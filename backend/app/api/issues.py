from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List
from app.models.issue import IssueCreate, IssueResponse, AIClassification
from app.services.agent_vision import classify_issue_from_image
from app.core.config import db
from datetime import datetime
import uuid

router = APIRouter(prefix="/issues", tags=["Issues"])

# In-memory mock database for now
mock_db = []

@router.post("/", response_model=IssueResponse)
async def create_issue(issue: IssueCreate, background_tasks: BackgroundTasks):
    """
    Create a new issue. This will trigger the Gemini Vision Agent to classify the issue.
    """
    # Create a base issue record
    issue_id = str(uuid.uuid4())
    
    # Call Vision Classifier Agent
    # For a real implementation, we would pass issue.photos[0] properly.
    # Currently passing a placeholder string.
    ai_result = classify_issue_from_image(
        image_base64="dummy_base64_or_url_here", 
        description=issue.description or ""
    )
    
    ai_class = AIClassification(
        type=ai_result.get("type", "Other"),
        severity=ai_result.get("severity", 1),
        department=ai_result.get("department", "Other"),
        confidence=ai_result.get("confidence", 0.0)
    )

    new_issue = IssueResponse(
        id=issue_id,
        status="Reported",
        type=ai_class.type,
        severity=ai_class.severity,
        department=ai_class.department,
        upvote_count=1,
        created_at=datetime.utcnow(),
        ai_classification=ai_class,
        **issue.model_dump()
    )
    
    # Save to DB if available
    if db:
        try:
            db.collection("issues").document(issue_id).set(new_issue.model_dump(mode="json"))
        except Exception as e:
            print(f"Error saving to Firestore: {e}")
            mock_db.append(new_issue)
    else:
        mock_db.append(new_issue)
    
    # Trigger background tasks (SLA logic, Agent logs)
    # background_tasks.add_task(process_vision_agent, issue_id, issue.photos)
    
    return new_issue

@router.get("/", response_model=List[IssueResponse])
async def list_issues():
    """
    List all issues (add filters later)
    """
    if db:
        try:
            docs = db.collection("issues").stream()
            return [IssueResponse(**doc.to_dict()) for doc in docs]
        except Exception as e:
            print(f"Error fetching from Firestore: {e}")
            return mock_db
    return mock_db
