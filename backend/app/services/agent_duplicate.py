from app.core.config import db
from datetime import datetime, timezone
import math
import uuid
import os
import google.generativeai as genai

# Setup Gemini API (Fallback for embeddings if key missing)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def haversine(lat1, lon1, lat2, lon2):
    """Calculates the great circle distance between two points on the earth in meters."""
    R = 6371000  # radius of Earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_embedding(text: str) -> list:
    """Generates a text embedding using Gemini."""
    if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
        # Mock embedding of 768 dimensions for fallback
        return [0.1] * 768
    
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="semantic_similarity"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embedding error: {e}")
        return [0.0] * 768

def cosine_similarity(v1: list, v2: list) -> float:
    """Calculates cosine similarity between two vectors."""
    dot_product = sum(a*b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a*a for a in v1))
    norm_v2 = math.sqrt(sum(b*b for b in v2))
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

def run_duplicate_merger():
    """
    Agent 2: Duplicate Merger
    Finds issues within 100m radius of same type. Merges them if semantically similar.
    """
    if not db:
        return {"status": "error", "message": "Database not initialized."}

    open_statuses = ["Reported", "Community Verified", "Assigned", "In Progress"]
    RADIUS_THRESHOLD_METERS = 100.0
    SIMILARITY_THRESHOLD = 0.85
    
    try:
        issues_ref = db.collection("issues")
        query = issues_ref.where("status", "in", open_statuses).stream()
        
        # We need all issues in memory to compare them pairwise
        issues = []
        for doc in query:
            data = doc.to_dict()
            if data.get("is_merged"):
                continue # Skip already merged issues
            data["_id"] = doc.id
            issues.append(data)
            
        merged_count = 0
        actions_taken = []
        merged_ids = set() # Keep track of issues already merged in this run

        for i, issue1 in enumerate(issues):
            if issue1["_id"] in merged_ids:
                continue
                
            for j in range(i + 1, len(issues)):
                issue2 = issues[j]
                if issue2["_id"] in merged_ids:
                    continue
                    
                # 1. Type Match
                if issue1.get("type") != issue2.get("type"):
                    continue
                    
                # 2. Distance Match
                lat1, lng1 = issue1.get("lat"), issue1.get("lng")
                lat2, lng2 = issue2.get("lat"), issue2.get("lng")
                if lat1 is None or lng1 is None or lat2 is None or lng2 is None:
                    continue
                    
                distance = haversine(lat1, lng1, lat2, lng2)
                if distance > RADIUS_THRESHOLD_METERS:
                    continue
                    
                # 3. Semantic Similarity Match
                # We compare descriptions (or auto_descriptions)
                desc1 = issue1.get("description", "") or issue1.get("ai_classification", {}).get("auto_description", "")
                desc2 = issue2.get("description", "") or issue2.get("ai_classification", {}).get("auto_description", "")
                
                emb1 = get_embedding(desc1)
                emb2 = get_embedding(desc2)
                
                similarity = cosine_similarity(emb1, emb2)
                
                if similarity >= SIMILARITY_THRESHOLD:
                    # Duplicate Found!
                    # Keep the older one as primary
                    t1 = issue1.get("created_at")
                    t2 = issue2.get("created_at")
                    
                    primary, secondary = (issue1, issue2) if str(t1) <= str(t2) else (issue2, issue1)
                    
                    # Merge Logic
                    primary_ref = db.collection("issues").document(primary["_id"])
                    secondary_ref = db.collection("issues").document(secondary["_id"])
                    
                    new_upvotes = primary.get("upvote_count", 0) + secondary.get("upvote_count", 0)
                    primary_uids = primary.get("upvoter_uids", [])
                    secondary_uids = secondary.get("upvoter_uids", [])
                    combined_uids = list(set(primary_uids + secondary_uids))
                    
                    # Update Primary
                    primary_ref.update({
                        "upvote_count": new_upvotes,
                        "upvoter_uids": combined_uids
                    })
                    
                    # Update Secondary
                    secondary_ref.update({
                        "is_merged": True,
                        "merged_into_id": primary["_id"],
                        "status": "Closed"
                    })
                    
                    merged_ids.add(secondary["_id"])
                    merged_count += 1
                    
                    msg = f"Merged {secondary['_id']} into {primary['_id']} (Distance: {distance:.1f}m, Similarity: {similarity:.2f})"
                    actions_taken.append(msg)
                    
                    # Mock FCM Notification
                    print(f"[FCM Mock] Notifying {secondary.get('reporter_uid')}: 'Your report was merged with an existing issue nearby. Upvotes combined!'")
                    
        # Log to AgentLog
        now = datetime.now(timezone.utc)
        log_entry = {
            "id": str(uuid.uuid4()),
            "agent_name": "Duplicate_Merger",
            "run_at": now.isoformat(),
            "issues_processed": len(issues),
            "issues_merged": merged_count,
            "actions_taken": actions_taken,
            "errors": []
        }
        db.collection("agent_logs").document(log_entry["id"]).set(log_entry)

        return {
            "status": "success",
            "agent": "Duplicate_Merger",
            "processed": len(issues),
            "merged": merged_count,
            "actions": actions_taken
        }

    except Exception as e:
        print(f"Duplicate Merger Error: {e}")
        try:
            db.collection("agent_logs").add({
                "agent_name": "Duplicate_Merger",
                "run_at": datetime.utcnow().isoformat(),
                "errors": [str(e)]
            })
        except:
            pass
        return {"status": "error", "message": str(e)}
