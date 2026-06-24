from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class AIClassification(BaseModel):
    type: str
    severity: int = Field(ge=1, le=5)
    department: str
    confidence: float

class IssueCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    lat: float
    lng: float
    photos: List[str] = [] # List of photo URLs (base64 or storage URLs)
    reporter_uid: str

class IssueResponse(IssueCreate):
    id: str
    status: str
    type: str
    severity: int
    department: str
    upvote_count: int = 0
    created_at: datetime
    ai_classification: Optional[AIClassification] = None
