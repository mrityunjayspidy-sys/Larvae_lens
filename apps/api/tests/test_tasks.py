import base64
import json
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.common import UserRole, ScanStatus
from app.db.repository import Repository

client = TestClient(app)

def get_auth_headers(role: str = "admin", user_id: str = "test-admin"):
    payload = {
        "id": user_id,
        "email": f"{user_id}@larvalens.org",
        "role": role,
        "full_name": f"User {user_id}"
    }
    b64 = base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    token = f"local-jwt-{b64}"
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(autouse=True)
def setup_test_data():
    # Create a test positive scan
    Repository.create_scan({
        "id": "scan-positive-test-1",
        "owner_id": "citizen-ananya-1",
        "status": ScanStatus.COMPLETED.value,
        "probable_larvae_count": 8,
        "rejected_tracks": 2,
        "risk_level": "high",
        "video_quality": "good",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "source_video_path": "test.mp4",
        "source_mime_type": "video/mp4",
        "source_size_bytes": 1024,
    })

def test_admin_can_list_workers_and_assign_task():
    # 1. Admin lists available workers
    res = client.get("/api/v1/tasks/workers", headers=get_auth_headers("admin", "admin-1"))
    assert res.status_code == 200
    workers = res.json()
    assert len(workers) >= 1
    worker_id = workers[0]["id"]

    # 2. Admin assigns the positive scan to this worker
    assign_payload = {
        "scan_id": "scan-positive-test-1",
        "worker_id": worker_id,
        "priority": "high",
        "instructions": "Apply Bti larvicide to roadside puddle immediately."
    }
    assign_res = client.post("/api/v1/tasks/assign", json=assign_payload, headers=get_auth_headers("admin", "admin-1"))
    assert assign_res.status_code == 200
    task = assign_res.json()
    assert task["scan_id"] == "scan-positive-test-1"
    assert task["assigned_worker_id"] == worker_id
    assert task["status"] == "assigned"
    assert task["probable_larvae_count"] == 8

    # 3. Worker sees the assigned task in their list
    worker_res = client.get("/api/v1/tasks", headers=get_auth_headers("field_worker", worker_id))
    assert worker_res.status_code == 200
    worker_tasks = worker_res.json()
    assert any(t["id"] == task["id"] for t in worker_tasks)

    # 4. Worker accepts the task (status -> accepted)
    accept_res = client.patch(
        f"/api/v1/tasks/{task['id']}/status",
        json={"status": "accepted"},
        headers=get_auth_headers("field_worker", worker_id)
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # 5. Worker completes the task with action taken (status -> completed)
    complete_res = client.patch(
        f"/api/v1/tasks/{task['id']}/status",
        json={
            "status": "completed",
            "action_taken": "Bti Biolarvicide Applied",
            "notes": "Treated 50L puddle with 10g Bti granules. Breeding source neutralised.",
            "treatment_chemical": "Bti Granules 200 ITU/mg",
            "dosage_grams": 10.0
        },
        headers=get_auth_headers("field_worker", worker_id)
    )
    assert complete_res.status_code == 200
    completed_task = complete_res.json()
    assert completed_task["status"] == "completed"
    assert completed_task["action_taken"] == "Bti Biolarvicide Applied"
    assert completed_task["dosage_grams"] == 10.0

def test_citizen_cannot_access_or_assign_tasks():
    # Citizen attempts to access tasks -> 403 Forbidden
    res = client.get("/api/v1/tasks", headers=get_auth_headers("citizen", "citizen-1"))
    assert res.status_code == 403

    # Citizen attempts to assign task -> 403 Forbidden
    assign_res = client.post(
        "/api/v1/tasks/assign",
        json={"scan_id": "scan-positive-test-1", "worker_id": "worker-1"},
        headers=get_auth_headers("citizen", "citizen-1")
    )
    assert assign_res.status_code == 403
