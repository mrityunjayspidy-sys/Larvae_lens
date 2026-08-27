from pydantic import BaseModel, Field
from typing import Optional, List, Any
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    CITIZEN = "citizen"
    FIELD_WORKER = "field_worker"
    REVIEWER = "reviewer"
    ADMIN = "admin"

class ScanStatus(str, Enum):
    QUEUED = "queued"
    VALIDATING = "validating"
    DETECTING = "detecting"
    VERIFYING = "verifying"
    TRACKING = "tracking"
    COMPLETED = "completed"
    RETAKE_REQUIRED = "retake_required"
    FAILED = "failed"

class RiskLevel(str, Enum):
    NONE_OBSERVED = "none_observed"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class VideoQuality(str, Enum):
    GOOD = "good"
    USABLE = "usable"
    POOR = "poor"

class ReviewDecision(str, Enum):
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    INCONCLUSIVE = "inconclusive"

class ErrorResponse(BaseModel):
    code: str
    message: str
    retryable: bool = False
    request_id: str

class UserProfile(BaseModel):
    id: str
    full_name: str
    role: UserRole
    email: Optional[str] = None
    phone: Optional[str] = None
    organization: Optional[str] = None
    location_city: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime
