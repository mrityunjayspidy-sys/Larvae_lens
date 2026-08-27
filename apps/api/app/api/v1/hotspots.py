from fastapi import APIRouter, Query
from typing import Optional
from ...schemas.hotspots import HotspotsResponse
from ...services.hotspot_service import HotspotService

router = APIRouter(prefix="/hotspots", tags=["Hotspots"])

@router.get("", response_model=HotspotsResponse)
async def get_hotspots(
    min_lat: Optional[float] = Query(None, description="Minimum bounding box latitude"),
    max_lat: Optional[float] = Query(None, description="Maximum bounding box latitude"),
    min_lng: Optional[float] = Query(None, description="Minimum bounding box longitude"),
    max_lng: Optional[float] = Query(None, description="Maximum bounding box longitude"),
):
    """
    Returns privacy-preserving aggregated hotspot clusters.
    Never exposes raw private video paths, reporter identities, or exact home coordinates.
    """
    return HotspotService.get_aggregated_hotspots(
        min_lat=min_lat,
        max_lat=max_lat,
        min_lng=min_lng,
        max_lng=max_lng
    )
