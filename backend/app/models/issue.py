from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AIClassification(BaseModel):
    type: str
    severity: int = Field(ge=1, le=5)
    department: str
    confidence: float
    auto_description: Optional[str] = None

class IssueCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    lat: float
    lng: float
    photos: List[str] = []          # base64-encoded image or video data
    media_type: Optional[str] = "image"  # "image" or "video"
    reporter_uid: str
    address: Optional[str] = None   # Reverse-geocoded street address
    city: Optional[str] = None      # City name from reverse geocoding

class IssueResponse(IssueCreate):
    id: str
    status: str
    type: str
    severity: int
    department: str
    upvote_count: int = 0
    auto_description: Optional[str] = None
    created_at: datetime
    ai_classification: Optional[AIClassification] = None
