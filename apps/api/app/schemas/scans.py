from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .common import ScanStatus, RiskLevel, VideoQuality

class ScanQueuedResponse(BaseModel):
    scan_id: str
    status: ScanStatus = ScanStatus.QUEUED
    progress_percent: int = 0
    created_at: datetime

class TrajectoryPoint(BaseModel):
    frame_idx: int
    timestamp_s: float
    bbox: List[float]  # [x1, y1, x2, y2] normalized or pixels
    confidence: float

class TrackEvidence(BaseModel):
    id: Optional[str] = None
    scan_id: str
    track_number: int
    detector_confidence: float
    larva_probability: float
    non_larva_probability: float
    motion_score: float
    fused_confidence: float
    persistence_frames: int
    accepted: bool
    reject_reason: Optional[str] = None
    trajectory: List[Dict[str, Any]] = []
    evidence_frame_path: Optional[str] = None
    evidence_frame_url: Optional[str] = None
    created_at: Optional[datetime] = None

class ScanDetailResponse(BaseModel):
    id: str
    owner_id: str
    status: ScanStatus
    progress_percent: int
    current_stage: Optional[str] = None
    source_video_path: str
    evidence_video_path: Optional[str] = None
    evidence_video_url: Optional[str] = None
    source_mime_type: str
    source_size_bytes: int
    duration_seconds: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy_m: Optional[float] = None
    probable_larvae_count: Optional[int] = None
    rejected_tracks: Optional[int] = None
    overall_confidence: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    video_quality: Optional[VideoQuality] = None
    quality_reasons: List[str] = []
    model_versions: Dict[str, Any] = {}
    review_status: str = "pending"
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    updated_at: datetime

class ScanListResponse(BaseModel):
    items: List[ScanDetailResponse]
    total: int
    page: int
    limit: int
