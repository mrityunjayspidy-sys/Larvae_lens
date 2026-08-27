from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from ..db.repository import Repository
from ..schemas.common import RiskLevel
from ..schemas.hotspots import HotspotCell, HotspotsResponse

class HotspotService:
    @staticmethod
    def get_aggregated_hotspots(
        min_lat: Optional[float] = None,
        max_lat: Optional[float] = None,
        min_lng: Optional[float] = None,
        max_lng: Optional[float] = None,
        grid_precision: float = 0.01  # ~1.1km grid cells
    ) -> HotspotsResponse:
        scans = Repository.list_all_geocoded_scans()
        
        clusters: Dict[str, Dict[str, Any]] = {}

        for s in scans:
            lat = float(s["latitude"])
            lng = float(s["longitude"])

            # Filter by bounding box if provided
            if min_lat is not None and lat < min_lat:
                continue
            if max_lat is not None and lat > max_lat:
                continue
            if min_lng is not None and lng < min_lng:
                continue
            if max_lng is not None and lng > max_lng:
                continue

            # Snap to grid bucket to protect exact location privacy
            bucket_lat = round(round(lat / grid_precision) * grid_precision, 4)
            bucket_lng = round(round(lng / grid_precision) * grid_precision, 4)
            cell_key = f"{bucket_lat}_{bucket_lng}"

            larvae_count = s.get("probable_larvae_count") or 0
            created_at = s.get("created_at") or datetime.now(timezone.utc).isoformat()

            if cell_key not in clusters:
                clusters[cell_key] = {
                    "id": cell_key,
                    "latitude_bucket": bucket_lat,
                    "longitude_bucket": bucket_lng,
                    "scan_count": 0,
                    "probable_larvae_total": 0,
                    "risks": [],
                    "latest_scan_at": created_at
                }

            c = clusters[cell_key]
            c["scan_count"] += 1
            c["probable_larvae_total"] += larvae_count
            if s.get("risk_level"):
                c["risks"].append(s["risk_level"])
            if created_at > c["latest_scan_at"]:
                c["latest_scan_at"] = created_at

        cells = []
        for c in clusters.values():
            # Determine dominant risk
            if c["probable_larvae_total"] == 0:
                dominant = RiskLevel.NONE_OBSERVED
            elif c["probable_larvae_total"] <= 2:
                dominant = RiskLevel.LOW
            elif c["probable_larvae_total"] <= 6:
                dominant = RiskLevel.MEDIUM
            else:
                dominant = RiskLevel.HIGH

            cells.append(HotspotCell(
                id=c["id"],
                latitude_bucket=c["latitude_bucket"],
                longitude_bucket=c["longitude_bucket"],
                scan_count=c["scan_count"],
                probable_larvae_total=c["probable_larvae_total"],
                dominant_risk=dominant,
                latest_scan_at=c["latest_scan_at"]
            ))

        return HotspotsResponse(
            cells=cells,
            total_cells=len(cells)
        )
