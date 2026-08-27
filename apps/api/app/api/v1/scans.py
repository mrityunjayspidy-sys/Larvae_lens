import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, Header, BackgroundTasks, status
from fastapi.responses import FileResponse
from typing import Optional, List
from ...core.security import get_current_user, AuthenticatedUser
from ...core.errors import NotFoundError, ForbiddenError
from ...schemas.scans import ScanQueuedResponse, ScanDetailResponse, ScanListResponse, TrackEvidence
from ...services.scan_service import ScanService
from ...services.storage_service import StorageService
from ...db.repository import Repository

router = APIRouter(prefix="/scans", tags=["Scans"])

@router.post("", status_code=status.HTTP_202_ACCEPTED, response_model=ScanQueuedResponse)
async def create_scan(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(..., description="Short water video clip (5-10s)"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_accuracy_m: Optional[float] = Form(None),
    idempotency_key: Optional[str] = Form(None),
    x_idempotency_key: Optional[str] = Header(None),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Submits a video for asynchronous larva screening and debris verification.
    Returns HTTP 202 with real queued scan record.
    """
    final_idempotency = idempotency_key or x_idempotency_key
    scan = await ScanService.process_and_queue_scan(
        owner_id=current_user.id,
        video_file=video,
        latitude=latitude,
        longitude=longitude,
        location_accuracy_m=location_accuracy_m,
        idempotency_key=final_idempotency,
        background_tasks=background_tasks
    )

    return ScanQueuedResponse(
        scan_id=scan["id"],
        status=scan["status"],
        progress_percent=scan.get("progress_percent", 0),
        created_at=scan["created_at"]
    )

@router.get("", response_model=ScanListResponse)
async def list_user_scans(
    page: int = 1,
    limit: int = 20,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Lists paginated scans belonging to the authenticated user.
    """
    items, total = Repository.list_scans_by_owner(current_user.id, page=page, limit=limit)
    
    # Attach signed evidence/video URLs
    scan_items = []
    for s in items:
        s_copy = dict(s)
        s_copy["evidence_video_url"] = StorageService.get_signed_video_url(s["owner_id"], s["id"], s["source_video_path"])
        scan_items.append(ScanDetailResponse(**s_copy))

    return ScanListResponse(items=scan_items, total=total, page=page, limit=limit)

@router.get("/{scan_id}", response_model=ScanDetailResponse)
async def get_scan_details(
    scan_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Gets real-time status and complete results for a single scan.
    Enforces ownership or reviewer role.
    """
    scan = Repository.get_scan_by_id(scan_id)
    if not scan:
        raise NotFoundError(f"Scan '{scan_id}' not found.")

    if scan["owner_id"] != current_user.id and not current_user.is_reviewer:
        raise ForbiddenError("You do not have permission to view this scan.")

    scan_copy = dict(scan)
    scan_copy["evidence_video_url"] = StorageService.get_signed_video_url(scan["owner_id"], scan["id"], scan["source_video_path"])
    return ScanDetailResponse(**scan_copy)

@router.get("/{scan_id}/tracks", response_model=List[TrackEvidence])
async def get_scan_tracks(
    scan_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Retrieves track-level evidence (candidates, debris verification, motion, trajectory) for a scan.
    """
    scan = Repository.get_scan_by_id(scan_id)
    if not scan:
        raise NotFoundError(f"Scan '{scan_id}' not found.")

    if scan["owner_id"] != current_user.id and not current_user.is_reviewer:
        raise ForbiddenError("You do not have permission to view track evidence for this scan.")

    tracks = Repository.get_tracks_by_scan_id(scan_id)
    return [TrackEvidence(**t) for t in tracks]

@router.get("/{scan_id}/video")
async def stream_scan_video(
    scan_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Streams local source video for authorized owner or reviewer.
    """
    scan = Repository.get_scan_by_id(scan_id)
    if not scan:
        raise NotFoundError(f"Scan '{scan_id}' not found.")

    if scan["owner_id"] != current_user.id and not current_user.is_reviewer:
        raise ForbiddenError("You do not have permission to access this video.")

    rel_path = scan.get("source_video_path", "")
    local_path = os.path.join(StorageService.get_local_storage_base(), "scan-videos", rel_path.replace("/", os.sep))
    
    if not os.path.exists(local_path):
        raise NotFoundError("Local video file not found.")

    return FileResponse(local_path, media_type=scan.get("source_mime_type", "video/mp4"))
