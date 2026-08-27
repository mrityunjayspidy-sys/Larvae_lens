from fastapi import APIRouter, Depends
from typing import List
from ...core.security import get_current_user, require_role, AuthenticatedUser
from ...schemas.common import UserRole
from ...schemas.reviews import ReviewCreateRequest, ReviewResponse, ReviewQueueItem
from ...services.review_service import ReviewService

router = APIRouter(tags=["Reviews"])

@router.get("/review-queue", response_model=List[ReviewQueueItem])
async def get_review_queue(
    page: int = 1,
    limit: int = 50,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.REVIEWER, UserRole.ADMIN]))
):
    """
    Retrieves the queue of completed scans awaiting public health audit.
    Requires 'reviewer' or 'admin' role.
    """
    offset = (page - 1) * limit
    return ReviewService.get_review_queue(limit=limit, offset=offset)

@router.post("/scans/{scan_id}/reviews", response_model=ReviewResponse)
async def submit_human_review(
    scan_id: str,
    review_in: ReviewCreateRequest,
    current_user: AuthenticatedUser = Depends(require_role([UserRole.REVIEWER, UserRole.ADMIN]))
):
    """
    Submits a human review decision (confirmed / rejected / inconclusive).
    Does NOT overwrite raw model tracks or counts.
    """
    review = ReviewService.submit_review(
        scan_id=scan_id,
        reviewer_id=current_user.id,
        decision=review_in.decision,
        notes=review_in.notes,
        reviewer_name=current_user.full_name
    )
    return ReviewResponse(**review)
