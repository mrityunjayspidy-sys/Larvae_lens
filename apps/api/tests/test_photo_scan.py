import io
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.inference.model_registry import model_registry

client = TestClient(app)

USER_AUTH = {"Authorization": "Bearer local-jwt-eyJpZCI6InVzZXItcmVzaWRlbnQiLCJlbWFpbCI6InJlc2lkZW50QGxhcnZhbGVucy5vcmciLCJyb2xlIjoiZmllbGRfd29ya2VyIiwiZnVsbF9uYW1lIjoiQ2l0aXplbiBVc2VyIn0="}

def create_synthetic_jpeg_bytes(width: int = 320, height: int = 240) -> bytes:
    """Helper to generate a real, valid JPEG image in-memory."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    cv2.circle(img, (160, 120), 15, (255, 255, 255), -1)
    success, encoded_img = cv2.imencode('.jpg', img)
    assert success
    return encoded_img.tobytes()

def test_upload_photo_image_accepted_and_queued():
    """Verify normal citizens/users can upload a JPEG/PNG photo of water and receive HTTP 202."""
    orig_ready = model_registry.ready
    model_registry.ready = True
    try:
        jpeg_bytes = create_synthetic_jpeg_bytes()
        files = {"video": ("water_surface_photo.jpg", jpeg_bytes, "image/jpeg")}
        data = {
            "latitude": "28.6139",
            "longitude": "77.2090",
            "location_accuracy_m": "4.2",
            "idempotency_key": "photo-scan-idempotency-001"
        }
        response = client.post("/api/v1/scans", files=files, data=data, headers=USER_AUTH)
        assert response.status_code == 202
        body = response.json()
        assert "scan_id" in body
        assert body["status"] == "queued"
        
        # Verify scan detail retrieval
        scan_id = body["scan_id"]
        get_res = client.get(f"/api/v1/scans/{scan_id}", headers=USER_AUTH)
        assert get_res.status_code == 200
        assert get_res.json()["id"] == scan_id
    finally:
        model_registry.ready = orig_ready
