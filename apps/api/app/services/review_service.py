import logging
from typing import Dict, Any, List, Optional
from ..db.repository import Repository
from ..core.errors import NotFoundError, ValidationError
from ..schemas.common import ReviewDecision

logger = logging.getLogger("larvalens.review_service")

class ReviewService:
    @staticmethod
    def get_review_queue(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        scans = Repository.list_review_queue(limit=limit, offset=offset)
        queue_items = []
        for s in scans:
            tracks = Repository.get_tracks_by_scan_id(s["id"])
            reviews = Repository.get_reviews_by_scan_id(s["id"])
            acc_count = sum(1 for t in tracks if t.get("accepted"))
            rej_count = len(tracks) - acc_count
            queue_items.append({
                "scan": s,
                "accepted_tracks_count": acc_count,
                "rejected_tracks_count": rej_count,
                "reviews": reviews
            })
        return queue_items

    @staticmethod
    def submit_review(
        scan_id: str,
        reviewer_id: str,
        decision: ReviewDecision,
        notes: Optional[str] = None,
        reviewer_name: Optional[str] = None
    ) -> Dict[str, Any]:
        scan = Repository.get_scan_by_id(scan_id)
        if not scan:
            raise NotFoundError(f"Scan '{scan_id}' not found.")

        review_rec = Repository.create_review(
            scan_id=scan_id,
            reviewer_id=reviewer_id,
            decision=decision,
            notes=notes,
            reviewer_name=reviewer_name
        )

        Repository.append_scan_event(scan_id, "review", "HUMAN_REVIEW_SUBMITTED", {
            "reviewer_id": reviewer_id,
            "decision": decision.value,
            "notes": notes
        })

        return review_rec
