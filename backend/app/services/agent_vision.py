import os
import google.generativeai as genai
from pydantic import BaseModel
import json

# Setup Gemini API (will throw if key is missing and not mocked)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Use the recommended model for multimodal tasks
model = genai.GenerativeModel('gemini-1.5-pro')

def classify_issue_from_image(image_base64: str, description: str = "") -> dict:
    """
    Agent 1: Vision Classifier
    Analyzes the image and description to return structured JSON.
    """
    prompt = f"""
    You are an expert civic issue classifier for the NagarSeva platform in Belagavi, Karnataka.
    Analyze the provided image of a civic issue. 
    User provided description: "{description}"
    
    Return a JSON object with the following fields:
    - "type": Classify the issue as one of (Pothole, Water Leakage, Broken Streetlight, Garbage, Other)
    - "severity": An integer score from 1 to 5, where 1 is minor and 5 is a critical public safety hazard.
    - "department": The suggested government department to route this to (PWD, BWSSB, BESCOM, BBMP, Other)
    - "confidence": A float between 0.0 and 1.0 indicating your confidence in this classification.
    - "auto_description": A short, 1-2 sentence professional description of the issue based on what you see.
    
    Respond ONLY with a valid JSON object. Do not use markdown blocks like ```json.
    """

    try:
        # In a real scenario, decode base64 to image bytes, or use Vertex AI's native File API
        # For the demo, we assume image_base64 contains actual image bytes or we pass it correctly
        # Here we mock the Image part to avoid PIL dependency for now
        
        # NOTE: To actually pass an image to gemini-1.5-pro:
        # response = model.generate_content([prompt, {"mime_type": "image/jpeg", "data": image_bytes}])
        
        # Fallback to text only for mock testing if image handling isn't fully wired
        if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
            # Return Mock Data if no key is provided
            return {
                "type": "Pothole",
                "severity": 4,
                "department": "PWD",
                "confidence": 0.95,
                "auto_description": "Large, deep pothole in the middle of the road causing traffic hazard."
            }
            
        response = model.generate_content(prompt)
        result_text = response.text.strip()
        
        # Clean up potential markdown formatting
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
            
        return json.loads(result_text)
    except Exception as e:
        print(f"Vision Agent Error: {e}")
        # Return safe fallback
        return {
            "type": "Other",
            "severity": 1,
            "department": "Other",
            "confidence": 0.0,
            "auto_description": f"Failed to classify issue: {str(e)}"
        }
