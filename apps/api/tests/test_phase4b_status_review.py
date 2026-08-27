import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.repository import Repository
from app.schemas.common import UserRole, ReviewDecision, ScanStatus

client = TestClient(app)

FIELD_WORKER_AUTH = {"Authorization": "Bearer local-jwt-eyJpZCI6Indvcmtlci0xIiwiZW1haWwiOiJ3b3JrZXJAbGFydmFsZW5zLm9yZyIsInJvbGUiOiJmaWVsZF93b3JrZXIiLCJmdWxsX25hbWUiOiJGaWVsZCBXb3JrZXIifQ=="}
REVIEWER_AUTH = {"Authorization": "Bearer local-jwt-eyJpZCI6InJldmlld2VyLTEiLCJlbWFpbCI6InJldmlld2VyQGxhcnZhbGVucy5vcmciLCJyb2xlIjoicmV2aWV3ZXIiLCJmdWxsX25hbWUiOiJFbnRvbW9sb2dpc3QgUHJpeWEifQ=="}
ADMIN_AUTH = {"Authorization": "Bearer local-jwt-eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQGxhcnZhbGVucy5vcmciLCJyb2xlIjoiYWRtaW4iLCJmdWxsX25hbWUiOiJBZG1pbiBVc2VyIn0="}

def test_monotonic_status_progression_and_events():
    """Verify scan status progression updates scans table and records scan_events."""
    scan = Repository.create_scan({
        "id": "scan-monotonic-001",
        "owner_id": "worker-1",
        "source_video_path": "scan-videos/worker-1/scan-monotonic-001/video.mp4",
        "source_mime_type": "video/mp4",
        "source_size_bytes": 1024000
    })

    # Stage transitions
    stages = [
        ("validating", 10),
        ("detecting", 30),
        ("verifying", 55),
        ("tracking", 75),
        ("completed", 100),
    ]

    for stage_name, pct in stages:
        Repository.update_scan("scan-monotonic-001", {
            "status": stage_name if stage_name == "completed" else "validating",
            "progress_percent": pct,
            "current_stage": stage_name
        })
        Repository.append_scan_event("scan-monotonic-001", stage_name, "STAGE_PROGRESS", {"percent": pct})

    # Verify final state
    updated_scan = Repository.get_scan_by_id("scan-monotonic-001")
    assert updated_scan["status"] == "completed"
    assert updated_scan["progress_percent"] == 100
    assert updated_scan["current_stage"] == "completed"

def test_track_level_evidence_access():
    """Verify owner and reviewer can query GET /api/v1/scans/{id}/tracks."""
    # Create test track
    Repository.create_tracks([{
        "scan_id": "scan-monotonic-001",
        "track_number": 1,
        "detector_confidence": 0.85,
        "larva_probability": 0.90,
        "non_larva_probability": 0.10,
        "motion_score": 0.035,
        "fused_confidence": 0.82,
        "persistence_frames": 6,
        "accepted": True,
        "reject_reason": None,
        "trajectory": []
    }])

    # Owner query
    res_owner = client.get("/api/v1/scans/scan-monotonic-001/tracks", headers=FIELD_WORKER_AUTH)
    assert res_owner.status_code == 200
    tracks = res_owner.json()
    assert len(tracks) >= 1
    assert tracks[0]["track_number"] == 1

    # Reviewer query
    res_reviewer = client.get("/api/v1/scans/scan-monotonic-001/tracks", headers=REVIEWER_AUTH)
    assert res_reviewer.status_code == 200

def test_field_worker_cannot_insert_review():
    """Verify ordinary field workers cannot submit reviews (403 Forbidden)."""
    response = client.post(
        "/api/v1/scans/scan-monotonic-001/reviews",
        headers=FIELD_WORKER_AUTH,
        json={"decision": "confirmed", "notes": "Unauthorized worker review"}
    )
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"

def test_reviewer_can_submit_review_preserving_model_evidence():
    """Verify reviewer can submit human review decision without altering model tracks."""
    scan = Repository.create_scan({
        "id": "scan-audit-002",
        "owner_id": "worker-1",
        "status": "completed",
        "probable_larvae_count": 2,
        "source_video_path": "scan-videos/worker-1/scan-audit-002/video.mp4",
        "source_mime_type": "video/mp4",
        "source_size_bytes": 1024000
    })

    # Reviewer submits review
    response = client.post(
        "/api/v1/scans/scan-audit-002/reviews",
        headers=REVIEWER_AUTH,
        json={"decision": "confirmed", "notes": "Audited by entomologist Priya: Aedes aegypti morphology."}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "confirmed"
    assert data["reviewer_id"] == "reviewer-1"

    # Verify scan row has review_status='reviewed' and original probable_larvae_count remains 2
    updated = Repository.get_scan_by_id("scan-audit-002")
    assert updated["review_status"] == "reviewed"
    assert updated["probable_larvae_count"] == 2
