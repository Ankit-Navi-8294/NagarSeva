import os
import google.generativeai as genai
from datetime import datetime, timezone
import uuid
from app.core.config import db

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-pro')

def get_mock_bigquery_data():
    """Returns mock historical data for 3 years (aggregated by month and location)"""
    return [
        {"ward": "Ward 12", "month": "June", "type": "Waterlogging", "count_2023": 15, "count_2024": 18, "count_2025": 14},
        {"ward": "Ward 12", "month": "July", "type": "Pothole", "count_2023": 40, "count_2024": 45, "count_2025": 50},
        {"ward": "Ward 8", "month": "June", "type": "Garbage", "count_2023": 5, "count_2024": 4, "count_2025": 6},
    ]

def run_predictive_engine():
    """
    Agent 4: Predictive Hotspots Engine
    Queries historical data (BigQuery Mock) and uses Gemini to generate a natural language forecast.
    """
    data = get_mock_bigquery_data()
    
    prompt = f"""
    You are an AI predictive analyst for the NagarSeva platform in Belagavi.
    Analyze the following historical civic issue data spanning 3 years:
    {data}
    
    Current Month: June 2026.
    
    Task:
    1. Identify the highest risk areas (hotspots) for the upcoming months based on the trends.
    2. Write a concise, 2-3 sentence natural language forecast that a Ward Officer can quickly read.
    3. Example: 'Ward X has had 12 waterlogging reports every June-July for 3 years. High risk this monsoon.'
    
    Provide ONLY the natural language forecast.
    """
    
    try:
        if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            forecast_text = "Ward 12 has shown a consistent increase in Pothole reports during June-July over the last 3 years, averaging 45+ cases. High risk of severe road damage expected this monsoon."
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
            "actions_taken": ["Generated predictive hotspot forecast for June 2026"],
            "errors": []
        }
        
        if db:
            db.collection("agent_logs").document(log_entry["id"]).set(log_entry)
            
            # Save the forecast itself to a forecasts collection for the dashboard
            db.collection("forecasts").add({
                "generated_at": now.isoformat(),
                "forecast_text": forecast_text,
                "target_month": "June 2026"
            })
            
        return {
            "status": "success",
            "agent": "Predictive_Hotspot_Engine",
            "forecast": forecast_text
        }

    except Exception as e:
        print(f"Predictive Engine Error: {e}")
        return {"status": "error", "message": str(e)}
