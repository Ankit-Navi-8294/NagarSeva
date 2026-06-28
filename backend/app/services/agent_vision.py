import os
import google.generativeai as genai
import json
import base64
import tempfile

# Setup Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Use gemini-1.5-flash — widely available, fast, supports vision
model = genai.GenerativeModel('gemini-1.5-flash')


def detect_mime_type(data_uri: str) -> str:
    """
    Detect MIME type from data URI prefix.
    e.g. 'data:image/png;base64,...' → 'image/png'
    Falls back to 'image/jpeg' if not detected.
    """
    if data_uri and data_uri.startswith("data:"):
        try:
            header = data_uri.split(";")[0]   # e.g. 'data:image/png'
            mime = header.split(":", 1)[1]     # e.g. 'image/png'
            return mime
        except Exception:
            pass
    return "image/jpeg"


def classify_issue_from_media(media_base64: str, media_type: str = "image", description: str = "") -> dict:
    """
    Agent 1: Vision Classifier
    Analyzes the image or video and description to return structured JSON.
    """
    prompt = f"""
    You are an expert civic issue classifier for the NagarSeva platform — a civic issue reporting app covering all cities in India.
    Analyze the provided {media_type} of a civic issue. 
    User provided description: "{description}"
    
    Return a JSON object with the following fields:
    - "type": Classify the issue as one of (Pothole, Water Leakage, Broken Streetlight, Garbage, Other)
    - "severity": An integer score from 1 to 5, where 1 is minor and 5 is a critical public safety hazard.
    - "department": The suggested government department to route this to (PWD, BWSSB, BESCOM, BBMP, Other)
    - "confidence": A float between 0.0 and 1.0 indicating your confidence in this classification.
    - "auto_description": A short, 1-2 sentence professional description of the issue based on what you see in the {media_type}.
    
    Respond ONLY with a valid JSON object. Do not use markdown blocks like ```json.
    """

    try:
        if GEMINI_API_KEY == "YOUR_GEMINI_API_KEY" or not media_base64:
            # Return Mock Data if no key is provided or empty media
            return {
                "type": "Pothole",
                "severity": 4,
                "department": "PWD",
                "confidence": 0.95,
                "auto_description": f"Large, deep pothole in the middle of the road causing traffic hazard. (Mock {media_type})"
            }

        # Detect MIME type from data URI prefix BEFORE stripping it
        mime_type = detect_mime_type(media_base64)

        # Strip data URI prefix if present (e.g. data:image/jpeg;base64,...)
        if "," in media_base64:
            media_base64 = media_base64.split(",", 1)[1]

        media_bytes = base64.b64decode(media_base64)

        content_parts = [prompt]

        if media_type == "video":
            # For video, upload using the File API (it handles larger files better)
            video_mime = mime_type if mime_type.startswith("video/") else "video/mp4"
            suffix = "." + video_mime.split("/")[1]

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                tmp_file.write(media_bytes)
                tmp_file_path = tmp_file.name

            try:
                uploaded_file = genai.upload_file(path=tmp_file_path, mime_type=video_mime)

                import time
                while uploaded_file.state.name == 'PROCESSING':
                    print("Waiting for video to process...")
                    time.sleep(2)
                    uploaded_file = genai.get_file(uploaded_file.name)

                if uploaded_file.state.name == 'FAILED':
                    raise ValueError("Video processing failed in Gemini")

                content_parts.append(uploaded_file)
                response = model.generate_content(content_parts)
                genai.delete_file(uploaded_file.name)
            finally:
                if os.path.exists(tmp_file_path):
                    os.remove(tmp_file_path)

        else:  # image
            image_mime = mime_type if mime_type.startswith("image/") else "image/jpeg"
            content_parts.append({"mime_type": image_mime, "data": media_bytes})
            response = model.generate_content(content_parts)

        result_text = response.text.strip()

        # Clean up potential markdown formatting
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        elif result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]

        result_text = result_text.strip()
        return json.loads(result_text)

    except Exception as e:
        print(f"Vision Agent Error: {e}")
        # Return smart fallback based on description
        desc_lower = description.lower()
        if "pothole" in desc_lower or "road" in desc_lower:
            issue_type, dept = "Pothole", "PWD"
        elif "water" in desc_lower or "leak" in desc_lower:
            issue_type, dept = "Water Leakage", "BWSSB"
        elif "light" in desc_lower or "street" in desc_lower:
            issue_type, dept = "Broken Streetlight", "BESCOM"
        elif "garbage" in desc_lower or "waste" in desc_lower:
            issue_type, dept = "Garbage", "BBMP"
        else:
            issue_type, dept = "Other", "Other"

        return {
            "type": issue_type,
            "severity": 3,
            "department": dept,
            "confidence": 0.5,
            "auto_description": description or f"Civic issue reported. (AI classification unavailable: {str(e)[:80]})"
        }
