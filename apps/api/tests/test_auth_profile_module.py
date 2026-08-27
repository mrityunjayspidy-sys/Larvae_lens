import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

TEST_AUTH_HEADER = {
    "Authorization": "Bearer local-jwt-eyJpZCI6InVzZXItMTIzIiwiZW1haWwiOiJmaWVsZHdvcmtlckBsYXJ2YWxlbnMub3JnIiwicm9sZSI6ImZpZWxkX3dvcmtlciIsImZ1bGxfbmFtZSI6IkZpZWxkIFdvcmtlciBSYW1lc2gifQ=="
}

def test_get_my_profile_authenticated():
    """Verify GET /api/v1/auth/me returns the database profile for the authenticated user."""
    response = client.get("/api/v1/auth/me", headers=TEST_AUTH_HEADER)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "user-123"
    assert data["role"] == "field_worker"
    assert "created_at" in data
    assert "updated_at" in data

def test_get_my_profile_unauthorized():
    """Verify GET /api/v1/auth/me fails with 401 when no token is supplied."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["code"] == "UNAUTHORIZED"

def test_update_my_profile_full_name():
    """Verify PATCH /api/v1/auth/me updates the profile name in the database."""
    response = client.patch(
        "/api/v1/auth/me",
        headers=TEST_AUTH_HEADER,
        json={"full_name": "Ramesh Kumar Updated"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Ramesh Kumar Updated"

def test_update_user_role_in_database():
    """Verify POST /api/v1/auth/role persists role updates in the database."""
    response = client.post(
        "/api/v1/auth/role",
        headers=TEST_AUTH_HEADER,
        json={"role": "reviewer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "reviewer"

    # Verify subsequent GET returns the updated role
    get_res = client.get("/api/v1/auth/me", headers=TEST_AUTH_HEADER)
    assert get_res.status_code == 200
    assert get_res.json()["role"] == "reviewer"
