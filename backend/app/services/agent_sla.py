from app.core.config import db
from datetime import datetime, timezone
import uuid

def run_sla_watchdog():
    """
    Agent 3: SLA Watchdog
    Checks all open issues against SLA targets. Auto-escalates if breached.
    """
    if not db:
        return {"status": "error", "message": "Database not initialized. Cannot run SLA Watchdog."}

    # SLA Targets in hours
    SLA_TARGETS = {
        "critical": 24,   # severity 4-5
        "high": 72,       # severity 3
        "medium": 168     # severity 1-2 (7 days)
    }

    open_statuses = ["Reported", "Community Verified", "Assigned", "In Progress"]
    
    try:
        # Note: Firestore query requires composite index if filtering by multiple fields.
        # For simplicity in this hackathon, we fetch all open issues and filter in memory if needed,
        # or just query by status.
        issues_ref = db.collection("issues")
        query = issues_ref.where("status", "in", open_statuses).stream()

        processed_count = 0
        escalated_count = 0
        actions_taken = []
        now = datetime.now(timezone.utc)

        for doc in query:
            processed_count += 1
            issue = doc.to_dict()
            
            # Skip if already breached and escalated
            if issue.get("sla_breached") is True:
                continue
            
            # Parse created_at (could be string or datetime depending on how it was saved)
            created_at = issue.get("created_at")
            if not created_at:
                continue
                
            if isinstance(created_at, str):
                try:
                    created_at_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                except ValueError:
                    continue # Bad format
            else:
                created_at_dt = created_at # Assuming datetime object
            
            # Ensure timezone awareness
            if created_at_dt.tzinfo is None:
                created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)

            hours_elapsed = (now - created_at_dt).total_seconds() / 3600
            
            severity = issue.get("severity", 1)
            target_hours = SLA_TARGETS["medium"]
            if severity >= 4:
                target_hours = SLA_TARGETS["critical"]
            elif severity == 3:
                target_hours = SLA_TARGETS["high"]

            if hours_elapsed > target_hours:
                # SLA Breached!
                escalated_count += 1
                new_escalation_count = issue.get("escalation_count", 0) + 1
                
                # 1. Update Document
                doc.reference.update({
                    "sla_breached": True,
                    "escalation_count": new_escalation_count,
                    "last_escalated_at": now.isoformat()
                })
                
                action_msg = f"Escalated issue {doc.id} (Severity {severity}). Elapsed: {hours_elapsed:.1f}h / Target: {target_hours}h"
                actions_taken.append(action_msg)
                
                # 2. Mock FCM Push Notification
                print(f"[FCM Mock] Sending push to reporter {issue.get('reporter_uid')}: 'Your issue has been escalated to senior authorities.'")
        
        # 3. Log to AgentLog collection
        log_entry = {
            "id": str(uuid.uuid4()),
            "agent_name": "SLA_Watchdog",
            "run_at": now.isoformat(),
            "issues_processed": processed_count,
            "issues_escalated": escalated_count,
            "actions_taken": actions_taken,
            "errors": []
        }
        db.collection("agent_logs").document(log_entry["id"]).set(log_entry)

        return {
            "status": "success",
            "agent": "SLA_Watchdog",
            "processed": processed_count,
            "escalated": escalated_count,
            "actions": actions_taken
        }

    except Exception as e:
        print(f"SLA Watchdog Error: {e}")
        # Log error to db if possible
        try:
            db.collection("agent_logs").add({
                "agent_name": "SLA_Watchdog",
                "run_at": datetime.utcnow().isoformat(),
                "errors": [str(e)]
            })
        except:
            pass
        
        return {"status": "error", "message": str(e)}
