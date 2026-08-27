from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .common import RiskLevel

class HotspotCell(BaseModel):
    id: str
    latitude_bucket: float
    longitude_bucket: float
    scan_count: int
    probable_larvae_total: int
    dominant_risk: RiskLevel
    latest_scan_at: datetime

class HotspotsResponse(BaseModel):
    cells: List[HotspotCell]
    total_cells: int
    disclaimer: str = "Aggregated surveillance data. Specific home coordinates are masked for privacy."
