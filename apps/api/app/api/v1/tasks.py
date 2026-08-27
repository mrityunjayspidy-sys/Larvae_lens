import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from ...core.security import get_current_user, AuthenticatedUser
from ...db.repository import Repository
from ...schemas.common import UserRole
from ...schemas.tasks import (
    AssignTaskRequest, 
    UpdateTaskStatusRequest, 
    VectorTaskResponse, 
    WorkerInfo
)

logger = logging.getLogger("larvalens.tasks")

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[VectorTaskResponse])
async def list_tasks(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    List tasks: Field Workers get their assigned tasks; Admins get all tasks.
    """
    if current_user.role == UserRole.ADMIN:
        tasks = Repository.list_all_tasks()
    elif current_user.role == UserRole.FIELD_WORKER:
        tasks = Repository.list_tasks_for_worker(current_user.id)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only field workers and administrators have access to abatement tasks."
        )

    return [
        VectorTaskResponse(
            id=t["id"],
            scan_id=t["scan_id"],
            citizen_id=t.get("citizen_id", "anonymous-citizen"),
            citizen_name=t.get("citizen_name", "Resident"),
            assigned_worker_id=t["assigned_worker_id"],
            assigned_worker_name=t.get("assigned_worker_name", "Field Worker"),
            assigned_by_id=t.get("assigned_by_id", "admin"),
            status=t["status"],
            priority=t.get("priority", "high"),
            latitude=t.get("latitude"),
            longitude=t.get("longitude"),
            location_address=t.get("location_address"),
            probable_larvae_count=t.get("probable_larvae_count", 0),
            risk_level=t.get("risk_level", "high"),
            instructions=t.get("instructions"),
            action_taken=t.get("action_taken"),
            notes=t.get("notes"),
            treatment_chemical=t.get("treatment_chemical"),
            dosage_grams=t.get("dosage_grams"),
            created_at=t["created_at"],
            accepted_at=t.get("accepted_at"),
            completed_at=t.get("completed_at"),
        )
        for t in tasks
    ]

@router.post("/assign", response_model=VectorTaskResponse)
async def assign_task_to_worker(
    body: AssignTaskRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Admin assigns a citizen scan incident to an available field worker.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can dispatch and assign abatement tasks."
        )

    scan = Repository.get_scan_by_id(body.scan_id)
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan #{body.scan_id} not found."
        )

    worker_profile = Repository.get_profile(body.worker_id)
    worker_name = worker_profile.get("full_name", "Field Worker") if worker_profile else "Field Worker"
    
    # Check if worker is in default list if not in profiles table
    if not worker_profile:
        workers = Repository.list_field_workers()
        for w in workers:
            if w["id"] == body.worker_id:
                worker_name = w["name"]
                break

    citizen_profile = Repository.get_profile(scan["owner_id"])
    citizen_name = citizen_profile.get("full_name", "Citizen Resident") if citizen_profile else "Citizen Resident"

    address = None
    if scan.get("latitude") and scan.get("longitude"):
        address = f"Coordinates ({scan['latitude']:.4f}, {scan['longitude']:.4f})"

    task_data = {
        "scan_id": scan["id"],
        "citizen_id": scan["owner_id"],
        "citizen_name": citizen_name,
        "assigned_worker_id": body.worker_id,
        "assigned_worker_name": worker_name,
        "assigned_by_id": current_user.id,
        "status": "assigned",
        "priority": body.priority,
        "latitude": scan.get("latitude"),
        "longitude": scan.get("longitude"),
        "location_address": address,
        "probable_larvae_count": scan.get("probable_larvae_count", 0),
        "risk_level": scan.get("risk_level", "high"),
        "instructions": body.instructions or "Inspect standing water container, eliminate larvae breeding source, and treat with biolarvicide if needed."
    }

    created = Repository.create_task(task_data)
    return VectorTaskResponse(**created)

@router.patch("/{task_id}/status", response_model=VectorTaskResponse)
async def update_task_status(
    task_id: str,
    body: UpdateTaskStatusRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Field worker accepts, marks in progress, or completes an assigned task with treatment action.
    """
    task = Repository.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task #{task_id} not found."
        )

    if current_user.role != UserRole.ADMIN and task["assigned_worker_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update tasks assigned to another worker."
        )

    action_str = body.action_taken.value if body.action_taken else None

    updated = Repository.update_task_status(
        task_id=task_id,
        status=body.status.value,
        action_taken=action_str,
        notes=body.notes,
        chemical=body.treatment_chemical,
        dosage=body.dosage_grams
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Task update failed.")

    return VectorTaskResponse(**updated)

@router.get("/workers", response_model=List[WorkerInfo])
async def list_available_workers(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Admin views active field workers and their current workload.
    """
    if current_user.role != UserRole.ADMIN and current_user.role != UserRole.REVIEWER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and reviewers can view worker rosters."
        )

    workers = Repository.list_field_workers()
    return [WorkerInfo(**w) for w in workers]

@router.get("/unassigned-scans")
async def list_unassigned_positive_scans(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """
    Admin retrieves positive citizen scans that have not yet been assigned to a field worker.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access unassigned dispatch queues."
        )

    all_scans, _ = Repository.list_all_scans(page=1, limit=100)
    all_tasks = Repository.list_all_tasks()
    assigned_scan_ids = {t["scan_id"] for t in all_tasks}

    unassigned = [
        s for s in all_scans
        if (s.get("probable_larvae_count", 0) or 0) > 0 and s["id"] not in assigned_scan_ids and s.get("status") == "completed"
    ]

    return unassigned
