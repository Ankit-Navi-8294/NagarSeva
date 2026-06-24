import os
import google.generativeai as genai
from datetime import datetime, timezone, timedelta
import uuid
from app.core.config import db

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def run_weekly_digest():
    """
    Agent 5: Weekly Digest Generator
    Runs every Monday. Generates a structured ward-level report.
    """
    if not db:
        return {"status": "error", "message": "Database not initialized."}

    now = datetime.now(timezone.utc)
    one_week_ago = now - timedelta(days=7)
    
    try:
        # Fetch issues reported in the last 7 days (mock logic for querying)
        # In a real scenario, we use db.collection("issues").where("created_at", ">=", one_week_ago).stream()
        # For this demo, we'll fetch all and filter in memory if necessary, or just use a mock summary
        
        issues = db.collection("issues").stream()
        
        opened = 0
        resolved = 0
        categories = {}
        
        for doc in issues:
            data = doc.to_dict()
            status = data.get("status")
            issue_type = data.get("type", "Other")
            
            if status != "Closed" and status != "Resolved":
                opened += 1
                
            if status == "Resolved":
                resolved += 1
                
            categories[issue_type] = categories.get(issue_type, 0) + 1

        # Build context payload for Gemini
        context = {
            "timeframe": f"{one_week_ago.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}",
            "issues_opened": opened,
            "issues_resolved": resolved,
            "category_breakdown": categories,
            "avg_resolution_time_hrs": 48.5 # Mock metric
        }
        
        prompt = f"""
        You are an AI assistant generating the Weekly Ward Officer Digest for NagarSeva.
        Using the raw data below, generate a professional, well-structured markdown report.
        
        Data:
        {context}
        
        Requirements:
        1. Include a short executive summary.
        2. Present the numbers clearly (e.g. using bullet points).
        3. Highlight the most reported category as an "Area of Concern".
        4. Keep it concise, professional, and actionable.
        """

        if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            digest_md = f"""# Weekly Ward Digest ({context['timeframe']})
            
**Executive Summary:** This week saw a total of {opened} new issues opened and {resolved} resolved. Average resolution time is tracking at 48.5 hours.

**Key Metrics:**
- **New Issues:** {opened}
- **Resolved Issues:** {resolved}
- **Citizen Participation Rate:** High

**Area of Concern:**
Potholes remain the highest reported category this week. We recommend allocating additional PWD resources to Ward 12.
            """
        else:
            response = model.generate_content(prompt)
            digest_md = response.text.strip()
            
        # Log to AgentLog
        log_entry = {
            "id": str(uuid.uuid4()),
            "agent_name": "Weekly_Digest_Generator",
            "run_at": now.isoformat(),
            "actions_taken": ["Generated weekly digest markdown"],
            "errors": []
        }
        db.collection("agent_logs").document(log_entry["id"]).set(log_entry)
        
        # Save digest
        db.collection("weekly_digests").add({
            "generated_at": now.isoformat(),
            "content_md": digest_md,
            "ward_id": "all" # Mock ward
        })
        
        # Mock Email send
        print("[Email Mock] Sending Weekly Digest to ward.officer@belagavi.gov.in")

        return {
            "status": "success",
            "agent": "Weekly_Digest_Generator",
            "digest": digest_md
        }

    except Exception as e:
        print(f"Weekly Digest Error: {e}")
        return {"status": "error", "message": str(e)}
