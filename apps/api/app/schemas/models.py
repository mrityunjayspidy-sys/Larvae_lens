from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ModelItemStatus(BaseModel):
    artifact_kind: str
    filename: str
    sha256_expected: str
    sha256_actual: Optional[str] = None
    file_exists: bool
    hash_matched: bool
    classes: List[str] = []
    input_size: Optional[int] = None

class ModelsStatusResponse(BaseModel):
    ready: bool
    status_code: str  # e.g., "READY", "MISSING_ARTIFACTS", "HASH_MISMATCH", "CORRUPT_MANIFEST"
    message: str
    active_models: Dict[str, ModelItemStatus]
    fusion_thresholds: Dict[str, Any]
    species_model_enabled: bool = False
