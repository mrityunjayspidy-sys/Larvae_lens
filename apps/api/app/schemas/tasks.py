from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime
from .common import RiskLevel

class TaskStatus(str, Enum):
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TreatmentAction(str, Enum):
    BTI_BIOLARVICIDE = "Bti Biolarvicide Applied"
    TEMEPHOS_CHEMICAL = "Chemical Larvicide (Temephos)"
    DRAINED_CONTAINER = "Container Emptied & Scrubbed"
    DESTROYED_SOURCE = "Breeding Source Eliminated"
    SOURCE_COVERED = "Water Source Sealed / Covered"
    FALSE_ALARM_CLEAN = "Field Confirmed Clean (No Action Required)"

class AssignTaskRequest(BaseModel):
    scan_id: str
    worker_id: str
    priority: str = "high"
    instructions: Optional[str] = None

class UpdateTaskStatusRequest(BaseModel):
    status: TaskStatus
    action_taken: Optional[TreatmentAction] = None
    notes: Optional[str] = None
    treatment_chemical: Optional[str] = None
    dosage_grams: Optional[float] = None

class VectorTaskResponse(BaseModel):
    id: str
    scan_id: str
    citizen_id: str
    citizen_name: str
    assigned_worker_id: str
    assigned_worker_name: str
    assigned_by_id: str
    status: TaskStatus
    priority: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_address: Optional[str] = None
    probable_larvae_count: int = 0
    risk_level: RiskLevel = RiskLevel.HIGH
    instructions: Optional[str] = None
    action_taken: Optional[str] = None
    notes: Optional[str] = None
    treatment_chemical: Optional[str] = None
    dosage_grams: Optional[float] = None
    created_at: datetime
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class WorkerInfo(BaseModel):
    id: str
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    assigned_zone: Optional[str] = None
    active_tasks_count: int = 0
    completed_tasks_count: int = 0
    status: str = "available"  # available, on_field, offline
