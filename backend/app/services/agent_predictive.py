import os
import google.generativeai as genai
from datetime import datetime, timezone
import uuid
from app.core.config import db
from collections import defaultdict

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def get_real_issue_data():
    """Aggregates real data from Firestore by city and type"""
    if not db:
        return []
    
    try:
        issues = db.collection("issues").stream()
        
        # Group by City -> Type -> Count
        # Structure: {"Mumbai": {"Pothole": 15, "Garbage": 5}, "Belagavi": {...}}
        city_stats = defaultdict(lambda: defaultdict(int))
        
        for doc in issues:
            data = doc.to_dict()
            city = data.get("city") or "Unknown City"
            issue_type = data.get("type") or "Other"
            city_stats[city][issue_type] += 1
            
        # Format for prompt
        formatted_data = []
        for city, types in city_stats.items():
            for t, count in types.items():
                formatted_data.append({"city": city, "type": t, "recent_count": count})
                
        return formatted_data
    except Exception as e:
        print(f"Error fetching data for predictive engine: {e}")
        return []

def run_predictive_engine():
    """
    Agent 4: Predictive Hotspots Engine
    Queries historical data and uses Gemini to generate a natural language forecast.
    """
    data = get_real_issue_data()
    
    if not data:
        data = [{"city": "Sample City", "type": "Pothole", "recent_count": 10}] # Fallback
        
    current_month = datetime.now(timezone.utc).strftime("%B %Y")
    
    prompt = f"""
    You are an AI predictive analyst for the NagarSeva platform — a civic issue reporting app covering all cities in India.
    Analyze the following recent civic issue data across various cities:
    {data}
    
    Current Month: {current_month}.
    
    Task:
    1. Identify the highest risk areas (hotspots) for the upcoming weeks based on the city data provided.
    2. Write a concise, 2-3 sentence natural language forecast that a City Officer can quickly read.
    3. Example: 'Mumbai has had 12 waterlogging reports recently. High risk this monsoon.'
    
    Provide ONLY the natural language forecast.
    """
    
    try:
        if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            forecast_text = f"Based on recent data, {data[0]['city']} has shown a consistent increase in {data[0]['type']} reports. High risk of severe issues expected soon. (Mock Forecast)"
        else:
            response = model.generate_content(prompt)
            forecast_text = response.text.strip()
            
        # Log to AgentLog
        now = datetime.now(timezone.utc)
        log_entry = {
            "id": str(uuid.uuid4()),
            "agent_name": "Predictive_Hotspot_Engine",
            "run_at": now.isoformat(),
            "forecast_generated": forecast_text,
            "actions_taken": [f"Generated predictive hotspot forecast for {current_month}"],
            "errors": []
        }
        
        if db:
            db.collection("agent_logs").document(log_entry["id"]).set(log_entry)
            
            db.collection("forecasts").add({
                "generated_at": now.isoformat(),
                "forecast_text": forecast_text,
                "target_month": current_month
            })
            
        return {
            "status": "success",
            "agent": "Predictive_Hotspot_Engine",
            "forecast": forecast_text
        }

    except Exception as e:
        print(f"Predictive Engine Error: {e}")
        return {"status": "error", "message": str(e)}
