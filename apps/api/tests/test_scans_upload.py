import io
import os
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.inference.model_registry import model_registry

client = TestClient(app)

USER_A_AUTH = {"Authorization": "Bearer local-jwt-eyJpZCI6InVzZXItYSIsImVtYWlsIjoidXNlcl9hQGV4YW1wbGUub3JnIiwicm9sZSI6ImZpZWxkX3dvcmtlciIsImZ1bGxfbmFtZSI6IlVzZXIgQSJ9"}
USER_B_AUTH = {"Authorization": "Bearer local-jwt-eyJpZCI6InVzZXItYiIsImVtYWlsIjoidXNlcl9iQGV4YW1wbGUub3JnIiwicm9sZSI6ImZpZWxkX3dvcmtlciIsImZ1bGxfbmFtZSI6IlVzZXIgQiJ9"}

def create_synthetic_mp4_bytes(duration_sec: float = 2.0, fps: int = 20, width: int = 320, height: int = 240) -> bytes:
    """Helper to generate a real, valid decodable MP4 in-memory video."""
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        temp_path = tf.name

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))
    total_frames = int(duration_sec * fps)
    
    for _ in range(total_frames):
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        # draw a small moving circle
        cv2.circle(frame, (100, 100), 10, (255, 255, 255), -1)
        out.write(frame)
    out.release()

    with open(temp_path, "rb") as f:
        video_bytes = f.read()

    os.remove(temp_path)
    return video_bytes

def test_upload_missing_jwt():
    """Missing Authorization header must return 401 Unauthorized."""
    video_bytes = create_synthetic_mp4_bytes(1.0)
    files = {"video": ("sample.mp4", video_bytes, "video/mp4")}
    response = client.post("/api/v1/scans", files=files)
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"

def test_upload_model_unavailable_returns_503():
    """When models are not ready, upload must reject with 503 MODEL_NOT_READY."""
    orig_ready = model_registry.ready
    model_registry.ready = False
    try:
        video_bytes = create_synthetic_mp4_bytes(1.0)
        files = {"video": ("sample.mp4", video_bytes, "video/mp4")}
        data = {"idempotency_key": "test-key-503"}
        response = client.post("/api/v1/scans", files=files, data=data, headers=USER_A_AUTH)
        assert response.status_code == 503
        body = response.json()
        assert body["code"] == "MODEL_NOT_READY"
        assert body["retryable"] is True
    finally:
        model_registry.ready = orig_ready

def test_upload_unsupported_mime_type():
    """Unsupported MIME type must return 415."""
    orig_ready = model_registry.ready
    model_registry.ready = True
    try:
        files = {"video": ("notes.txt", b"plain text data", "text/plain")}
        data = {"idempotency_key": "test-key-bad-mime"}
        response = client.post("/api/v1/scans", files=files, data=data, headers=USER_A_AUTH)
        assert response.status_code == 415
        assert response.json()["code"] == "UNSUPPORTED_MEDIA_TYPE"
    finally:
        model_registry.ready = orig_ready

def test_upload_corrupted_video_fails_validation():
    """Invalid/corrupt video signature must return 422 VALIDATION_FAILED."""
    orig_ready = model_registry.ready
    model_registry.ready = True
    try:
        corrupted_bytes = b"NOT_A_REAL_VIDEO_HEADER_JUST_RANDOM_DATA"
        files = {"video": ("fake.mp4", corrupted_bytes, "video/mp4")}
        data = {"idempotency_key": "test-key-corrupted"}
        response = client.post("/api/v1/scans", files=files, data=data, headers=USER_A_AUTH)
        assert response.status_code == 422
        assert "VALIDATION" in response.json()["code"]
    finally:
        model_registry.ready = orig_ready

def test_upload_valid_video_queued_202_and_idempotency():
    """Valid video upload creates real queued row with 202 and respects idempotency key."""
    orig_ready = model_registry.ready
    model_registry.ready = True
    try:
        video_bytes = create_synthetic_mp4_bytes(2.0)
        files = {"video": ("valid_sample.mp4", video_bytes, "video/mp4")}
        data = {
            "latitude": "28.6139",
            "longitude": "77.2090",
            "location_accuracy_m": "5.0",
            "idempotency_key": "unique-idempotency-key-001"
        }
        response = client.post("/api/v1/scans", files=files, data=data, headers=USER_A_AUTH)
        assert response.status_code == 202
        body = response.json()
        assert "scan_id" in body
        assert body["status"] == "queued"
        scan_id = body["scan_id"]

        # Duplicate submit with same idempotency key
        files2 = {"video": ("valid_sample.mp4", video_bytes, "video/mp4")}
        response2 = client.post("/api/v1/scans", files=files2, data=data, headers=USER_A_AUTH)
        assert response2.status_code == 202
        assert response2.json()["scan_id"] == scan_id

        # Owner A can retrieve scan
        get_res = client.get(f"/api/v1/scans/{scan_id}", headers=USER_A_AUTH)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == scan_id

        # User B cannot retrieve User A scan
        get_b_res = client.get(f"/api/v1/scans/{scan_id}", headers=USER_B_AUTH)
        assert get_b_res.status_code in [403, 404]

    finally:
        model_registry.ready = orig_ready

def test_paginated_user_scans():
    """GET /api/v1/scans returns paginated scan list."""
    response = client.get("/api/v1/scans?page=1&limit=10", headers=USER_A_AUTH)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
