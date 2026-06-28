import os
import google.generativeai as genai
from datetime import datetime, timezone, timedelta
import uuid
from app.core.config import db
from collections import defaultdict

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def run_weekly_digest():
    """
    Agent 5: Weekly Digest Generator
    Generates a structured city-level report for all of India.
    """
    if not db:
        return {"status": "error", "message": "Database not initialized."}

    now = datetime.now(timezone.utc)
    one_week_ago = now - timedelta(days=7)
    
    try:
        issues = db.collection("issues").stream()
        
        opened = 0
        resolved = 0
        categories = defaultdict(int)
        cities = defaultdict(int)
        
        for doc in issues:
            data = doc.to_dict()
            
            # Simple date filtering (assuming created_at is ISO string, fallback for demo)
            # In a real app we'd use a proper Firestore query timestamp
            
            status = data.get("status")
            issue_type = data.get("type", "Other")
            city = data.get("city") or "Unknown City"
            
            if status != "Closed" and status != "Resolved":
                opened += 1
                
            if status == "Resolved":
                resolved += 1
                
            categories[issue_type] += 1
            cities[city] += 1

        # Build context payload for Gemini
        context = {
            "timeframe": f"{one_week_ago.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}",
            "issues_opened": opened,
            "issues_resolved": resolved,
            "category_breakdown": dict(categories),
            "top_cities": dict(sorted(cities.items(), key=lambda item: item[1], reverse=True)[:5]),
            "avg_resolution_time_hrs": 48.5 # Mock metric for now
        }
        
        prompt = f"""
        You are an AI assistant generating the National Weekly Civic Digest for NagarSeva (covering cities across India).
        Using the raw data below, generate a professional, well-structured markdown report.
        
        Data:
        {context}
        
        Requirements:
        1. Include a short executive summary of the national civic health.
        2. Present the numbers clearly (e.g. using bullet points).
        3. Highlight the most reported category and the city with the most reports.
        4. Keep it concise, professional, and actionable for administrators.
        """

        if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            digest_md = f"""# National Weekly Civic Digest ({context['timeframe']})
            
**Executive Summary:** This week saw a total of {opened} new issues opened and {resolved} resolved across India. Average resolution time is tracking at 48.5 hours.

**Key Metrics:**
- **New Issues:** {opened}
- **Resolved Issues:** {resolved}

**Area of Concern:**
Highest reported category remains an issue. Keep an eye on top reporting cities. (Mock Report)
            """
        else:
            response = model.generate_content(prompt)
            digest_md = response.text.strip()
            
        # Log to AgentLog
        log_entry = {
            "id": str(uuid.uuid4()),
            "agent_name": "Weekly_Digest_Generator",
            "run_at": now.isoformat(),
            "actions_taken": ["Generated national weekly digest markdown"],
            "errors": []
        }
        db.collection("agent_logs").document(log_entry["id"]).set(log_entry)
        
        # Save digest
        db.collection("weekly_digests").add({
            "generated_at": now.isoformat(),
            "content_md": digest_md,
            "scope": "national"
        })

        return {
            "status": "success",
            "agent": "Weekly_Digest_Generator",
            "digest": digest_md
        }

    except Exception as e:
        print(f"Weekly Digest Error: {e}")
        return {"status": "error", "message": str(e)}
