from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.models.issue import IssueCreate, IssueResponse, AIClassification
from app.services.agent_vision import classify_issue_from_media, compress_image_base64
from app.core.config import db
from datetime import datetime
import uuid

try:
    from google.cloud.firestore_v1.base_query import FieldFilter
    HAS_FIELD_FILTER = True
except ImportError:
    HAS_FIELD_FILTER = False

router = APIRouter(prefix="/issues", tags=["Issues"])


def strip_data_uri(data_uri: str) -> str:
    """Strip the data URI prefix, returning raw base64 string."""
    if data_uri and "," in data_uri:
        return data_uri.split(",", 1)[1]
    return data_uri


def build_display_uri(raw_b64: str, media_type: str = "image") -> str:
    """Reconstruct a displayable data URI from raw base64."""
    if not raw_b64:
        return ""
    if raw_b64.startswith("data:"):
        return raw_b64  # Already a full URI
    if media_type == "video":
        return f"data:video/mp4;base64,{raw_b64}"
    return f"data:image/jpeg;base64,{raw_b64}"


@router.post("/", response_model=IssueResponse)
async def create_issue(issue: IssueCreate, background_tasks: BackgroundTasks):
    """
    Create a new issue. This will trigger the Gemini Vision Agent to classify the issue.
    """
    issue_id = str(uuid.uuid4())

    # Strip data URI prefix for storage & AI processing
    media_type = issue.media_type or "image"

    # Reconstruct full data URI for Vision Agent (it strips it again internally, so pass original)
    full_media = issue.photos[0] if issue.photos else ""

    try:
        ai_result = classify_issue_from_media(
            media_base64=full_media,
            media_type=media_type,
            description=issue.description or ""
        )
    except Exception as e:
        print(f"Vision agent error (using fallback): {e}")
        desc_lower = (issue.description or "").lower()
        if "pothole" in desc_lower or "road" in desc_lower:
            ai_result = {"type": "Pothole", "severity": 3, "department": "PWD", "confidence": 0.5, "auto_description": issue.description or "Pothole reported."}
        elif "water" in desc_lower or "leak" in desc_lower:
            ai_result = {"type": "Water Leakage", "severity": 3, "department": "BWSSB", "confidence": 0.5, "auto_description": issue.description or "Water leakage reported."}
        elif "light" in desc_lower or "street" in desc_lower:
            ai_result = {"type": "Broken Streetlight", "severity": 3, "department": "BESCOM", "confidence": 0.5, "auto_description": issue.description or "Streetlight issue reported."}
        elif "garbage" in desc_lower or "waste" in desc_lower:
            ai_result = {"type": "Garbage", "severity": 3, "department": "BBMP", "confidence": 0.5, "auto_description": issue.description or "Garbage issue reported."}
        else:
            ai_result = {"type": "Other", "severity": 3, "department": "Other", "confidence": 0.5, "auto_description": issue.description or "Civic issue reported."}

    ai_class = AIClassification(
        type=ai_result.get("type", "Other"),
        severity=ai_result.get("severity", 1),
        department=ai_result.get("department", "Other"),
        confidence=ai_result.get("confidence", 0.0),
        auto_description=ai_result.get("auto_description", None)
    )

    # Normalize photos: strip data URI prefix then compress to fit Firestore 1MB limit
    # For video, skip image compression (PIL cannot handle video frames)
    if media_type == "image":
        normalized_photos = [compress_image_base64(strip_data_uri(p)) for p in issue.photos if p]
    else:
        # For video: the raw base64 can be tens of MB, far exceeding Firestore's 1MB doc limit.
        # Store only a small placeholder; the AI has already processed the video.
        normalized_photos = ["VIDEO_PROCESSED"]

    new_issue = IssueResponse(
        id=issue_id,
        status="Reported",
        type=ai_class.type,
        severity=ai_class.severity,
        department=ai_class.department,
        upvote_count=1,
        auto_description=ai_class.auto_description,
        created_at=datetime.utcnow(),
        ai_classification=ai_class,
        title=issue.title,
        description=issue.description,
        lat=issue.lat,
        lng=issue.lng,
        photos=normalized_photos,
        media_type=media_type,
        reporter_uid=issue.reporter_uid,
        address=issue.address,
        city=issue.city,
    )

    # Save to DB if available
    if db:
        try:
            db.collection("issues").document(issue_id).set(new_issue.model_dump(mode="json"))
        except Exception as e:
            error_detail = str(e)
            print(f"[Firestore ERROR] Failed to save issue {issue_id}: {type(e).__name__}: {error_detail}")
            raise HTTPException(
                status_code=500,
                detail=f"Database Error: {error_detail[:200]}"
            )

    return new_issue


@router.get("/", response_model=List[IssueResponse])
async def list_issues():
    """
    List all issues, ordered newest first.
    """
    if db:
        try:
            # Use DESCENDING constant correctly
            from google.cloud import firestore as fs
            docs = db.collection("issues").order_by(
                "created_at", direction=fs.Query.DESCENDING
            ).stream()
            return [IssueResponse(**doc.to_dict()) for doc in docs]
        except Exception as e:
            # Fallback: fetch without ordering if index not set up
            print(f"Error fetching from Firestore (trying without order): {e}")
            try:
                docs = db.collection("issues").stream()
                issues = [IssueResponse(**doc.to_dict()) for doc in docs]
                # Sort in memory
                issues.sort(key=lambda x: x.created_at, reverse=True)
                return issues
            except Exception as e2:
                print(f"Fallback fetch failed: {e2}")
                raise HTTPException(status_code=500, detail="Database Error")
    return []


@router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str):
    """
    Get a single issue
    """
    if db:
        doc = db.collection("issues").document(issue_id).get()
        if doc.exists:
            return IssueResponse(**doc.to_dict())
    raise HTTPException(status_code=404, detail="Issue not found")


@router.patch("/{issue_id}/status")
async def update_issue_status(issue_id: str, status: str):
    """
    Update issue status (for Admin)
    """
    if db:
        try:
            db.collection("issues").document(issue_id).update({"status": status})
            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=500, detail="DB not available")


@router.post("/{issue_id}/upvote")
async def upvote_issue(issue_id: str):
    """
    Upvote an issue
    """
    if db:
        try:
            doc_ref = db.collection("issues").document(issue_id)
            doc = doc_ref.get()
            if doc.exists:
                current_count = doc.to_dict().get("upvote_count", 0)
                doc_ref.update({"upvote_count": current_count + 1})
                return {"status": "success", "upvote_count": current_count + 1}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Issue not found")
