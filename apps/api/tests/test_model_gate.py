import os
import json
import tempfile
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.inference.model_registry import ModelRegistry
from app.core.config import settings

client = TestClient(app)

def test_health_alive_when_models_unready():
    """Verify health liveness endpoint returns 200 even when models are not ready."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_models_status_reports_unready_safely():
    """Verify models/status reports ready=false with safe reason codes and no secret paths."""
    headers = {"Authorization": "Bearer local-jwt-eyJpZCI6ImFkbWluLXVzZXIiLCJlbWFpbCI6ImFkbWluQGxhcnZhbGVucy5vcmciLCJyb2xlIjoiYWRtaW4iLCJmdWxsX25hbWUiOiJBZG1pbiBVc2VyIn0="}
    response = client.get("/api/v1/models/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "ready" in data
    assert "status_code" in data
    assert "active_models" in data
    assert "fusion_thresholds" in data
    # Ensure no secret keys are leaked
    assert "SUPABASE_SERVICE_ROLE_KEY" not in response.text
    assert "secret" not in response.text.lower()

def test_registry_missing_manifest_handling():
    """Verify ModelRegistry handles missing manifest gracefully."""
    with tempfile.TemporaryDirectory() as empty_dir:
        orig_dir = settings.MODEL_DIR
        try:
            settings.MODEL_DIR = empty_dir
            reg = ModelRegistry()
            reg.load_registry()
            assert reg.ready is False
            assert reg.status_code == "MISSING_MANIFEST"
            status = reg.get_status_response()
            assert status.ready is False
        finally:
            settings.MODEL_DIR = orig_dir

def test_registry_hash_mismatch_handling():
    """Verify ModelRegistry catches hash mismatches on corrupt or tampered files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        orig_dir = settings.MODEL_DIR
        try:
            settings.MODEL_DIR = temp_dir
            
            # Create a fake weight file with content "tampered"
            det_path = os.path.join(temp_dir, "larva_detector_best.pt")
            with open(det_path, "wb") as f:
                f.write(b"tampered_bytes_123")
                
            ver_path = os.path.join(temp_dir, "larva_debris_verifier_best.pt")
            with open(ver_path, "wb") as f:
                f.write(b"tampered_bytes_456")

            # Manifest expecting a different SHA
            manifest = {
                "schema_version": 1,
                "required": {
                    "detector": {
                        "filename": "larva_detector_best.pt",
                        "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
                        "classes": ["mosquito_larva"],
                        "input_size": 640
                    },
                    "verifier": {
                        "filename": "larva_debris_verifier_best.pt",
                        "sha256": "1111111111111111111111111111111111111111111111111111111111111111",
                        "classes": ["larva", "non_larva"],
                        "input_size": 224,
                        "larva_threshold": 0.70
                    }
                },
                "fusion": {
                    "detector_threshold": 0.25,
                    "min_track_frames": 4,
                    "motion_threshold": 0.015,
                    "high_morphology_threshold": 0.88
                }
            }
            with open(os.path.join(temp_dir, "model_manifest.json"), "w", encoding="utf-8") as f:
                json.dump(manifest, f)

            reg = ModelRegistry()
            reg.load_registry()
            assert reg.ready is False
            assert reg.status_code == "HASH_MISMATCH"
            status = reg.get_status_response()
            assert status.ready is False
            assert status.active_models["detector"].hash_matched is False
        finally:
            settings.MODEL_DIR = orig_dir
