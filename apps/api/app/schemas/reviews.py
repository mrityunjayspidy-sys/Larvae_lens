from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .common import ReviewDecision
from .scans import ScanDetailResponse

class ReviewCreateRequest(BaseModel):
    decision: ReviewDecision
    notes: Optional[str] = Field(None, max_length=2000)

class ReviewResponse(BaseModel):
    id: str
    scan_id: str
    reviewer_id: str
    reviewer_name: Optional[str] = None
    decision: ReviewDecision
    notes: Optional[str] = None
    created_at: datetime

class ReviewQueueItem(BaseModel):
    scan: ScanDetailResponse
    accepted_tracks_count: int
    rejected_tracks_count: int
    reviews: List[ReviewResponse] = []
