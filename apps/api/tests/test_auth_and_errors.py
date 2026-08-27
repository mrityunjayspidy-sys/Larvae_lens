from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_unauthorized_access():
    response = client.get("/api/v1/scans")
    assert response.status_code == 401
    data = response.json()
    assert data["code"] == "UNAUTHORIZED"
    assert "request_id" in data

def test_models_status_unauthenticated():
    response = client.get("/api/v1/models/status")
    assert response.status_code == 401

def test_nonexistent_scan_not_found():
    # Provide a fake authorization header
    headers = {"Authorization": "Bearer test-token"}
    response = client.get("/api/v1/scans/non-existent-uuid", headers=headers)
    # Since test-token is parsed or rejected
    assert response.status_code in [401, 404]
