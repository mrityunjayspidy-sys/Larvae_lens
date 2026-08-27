import uuid
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from .supabase_client import get_supabase_client
from ..schemas.common import ScanStatus, RiskLevel, VideoQuality, ReviewDecision, UserRole

logger = logging.getLogger("larvalens.repository")

# In-memory storage fallback for offline/local development and testing
_local_scans: Dict[str, Dict[str, Any]] = {}
_local_tracks: Dict[str, List[Dict[str, Any]]] = {}
_local_reviews: Dict[str, List[Dict[str, Any]]] = {}
_local_events: Dict[str, List[Dict[str, Any]]] = {}
_local_profiles: Dict[str, Dict[str, Any]] = {}
_local_tasks: Dict[str, Dict[str, Any]] = {}

# Default sample field workers for dispatch
_default_workers = [
    {
        "id": "worker-ramesh-101",
        "name": "Ramesh Kumar",
        "email": "ramesh.kumar@health.gov.in",
        "role": "field_worker",
        "phone": "+91 98765 12340",
        "assigned_zone": "Ward 8 - Central Zone",
        "status": "available"
    },
    {
        "id": "worker-sunita-102",
        "name": "Sunita Devi",
        "email": "sunita.devi@health.gov.in",
        "role": "field_worker",
        "phone": "+91 98765 23451",
        "assigned_zone": "Ward 14 - South Zone",
        "status": "available"
    },
    {
        "id": "worker-amit-103",
        "name": "Amit Patel",
        "email": "amit.patel@health.gov.in",
        "role": "field_worker",
        "phone": "+91 98765 34562",
        "assigned_zone": "Ward 3 - East Zone",
        "status": "available"
    }
]

class Repository:
    @staticmethod
    def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("profiles").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_profile failed: {e}")

        return _local_profiles.get(user_id)

    @staticmethod
    def upsert_profile(user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        client = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        rec = {
            "id": user_id,
            "full_name": profile_data.get("full_name", "User"),
            "role": profile_data.get("role", UserRole.FIELD_WORKER.value),
            "email": profile_data.get("email"),
            "phone": profile_data.get("phone"),
            "organization": profile_data.get("organization"),
            "location_city": profile_data.get("location_city"),
            "bio": profile_data.get("bio"),
            "updated_at": now
        }
        if "created_at" not in profile_data:
            rec["created_at"] = now
        else:
            rec["created_at"] = profile_data["created_at"]

        if client:
            try:
                res = client.table("profiles").upsert(rec).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase upsert_profile failed: {e}")

        _local_profiles[user_id] = {**_local_profiles.get(user_id, {}), **rec}
        return _local_profiles[user_id]

    @staticmethod
    def update_profile_role(user_id: str, role: str) -> Dict[str, Any]:
        client = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        if client:
            try:
                res = client.table("profiles").update({"role": role, "updated_at": now}).eq("id", user_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase update_profile_role failed: {e}")

        if user_id not in _local_profiles:
            _local_profiles[user_id] = {
                "id": user_id,
                "full_name": "Field Worker",
                "role": role,
                "created_at": now,
                "updated_at": now
            }
        else:
            _local_profiles[user_id]["role"] = role
            _local_profiles[user_id]["updated_at"] = now
        return _local_profiles[user_id]

    @staticmethod
    def create_scan(scan_data: Dict[str, Any]) -> Dict[str, Any]:
        client = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        
        record = {
            "id": scan_data.get("id", str(uuid.uuid4())),
            "owner_id": scan_data["owner_id"],
            "status": scan_data.get("status", ScanStatus.QUEUED.value),
            "progress_percent": scan_data.get("progress_percent", 0),
            "current_stage": scan_data.get("current_stage", "queued"),
            "source_video_path": scan_data["source_video_path"],
            "evidence_video_path": scan_data.get("evidence_video_path"),
            "source_mime_type": scan_data["source_mime_type"],
            "source_size_bytes": scan_data["source_size_bytes"],
            "duration_seconds": scan_data.get("duration_seconds"),
            "latitude": scan_data.get("latitude"),
            "longitude": scan_data.get("longitude"),
            "location_accuracy_m": scan_data.get("location_accuracy_m"),
            "probable_larvae_count": scan_data.get("probable_larvae_count"),
            "rejected_tracks": scan_data.get("rejected_tracks"),
            "overall_confidence": scan_data.get("overall_confidence"),
            "risk_level": scan_data.get("risk_level"),
            "video_quality": scan_data.get("video_quality"),
            "quality_reasons": scan_data.get("quality_reasons", []),
            "model_versions": scan_data.get("model_versions", {}),
            "review_status": scan_data.get("review_status", "pending"),
            "error_code": scan_data.get("error_code"),
            "error_message": scan_data.get("error_message"),
            "idempotency_key": scan_data.get("idempotency_key"),
            "created_at": now,
            "started_at": scan_data.get("started_at"),
            "completed_at": scan_data.get("completed_at"),
            "updated_at": now
        }

        if client:
            try:
                res = client.table("scans").insert(record).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_scan failed: {e}")

        _local_scans[record["id"]] = record
        return record

    @staticmethod
    def get_scan_by_id(scan_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("scans").select("*").eq("id", scan_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_scan_by_id failed: {e}")

        return _local_scans.get(scan_id)

    @staticmethod
    def get_scan_by_idempotency_key(owner_id: str, idempotency_key: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("scans").select("*").eq("owner_id", owner_id).eq("idempotency_key", idempotency_key).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_scan_by_idempotency_key failed: {e}")

        for scan in _local_scans.values():
            if scan.get("owner_id") == owner_id and scan.get("idempotency_key") == idempotency_key:
                return scan
        return None

    @staticmethod
    def update_scan(scan_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        if client:
            try:
                res = client.table("scans").update(update_data).eq("id", scan_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase update_scan failed: {e}")

        if scan_id in _local_scans:
            _local_scans[scan_id].update(update_data)
            return _local_scans[scan_id]
        return None

    @staticmethod
    def list_scans_by_owner(owner_id: str, page: int = 1, limit: int = 20) -> Tuple[List[Dict[str, Any]], int]:
        client = get_supabase_client()
        offset = (page - 1) * limit
        if client:
            try:
                res = client.table("scans").select("*", count="exact").eq("owner_id", owner_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                return res.data or [], res.count or 0
            except Exception as e:
                logger.error(f"Supabase list_scans_by_owner failed: {e}")

        user_scans = [s for s in _local_scans.values() if s.get("owner_id") == owner_id]
        user_scans.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        total = len(user_scans)
        items = user_scans[offset:offset + limit]
        return items, total

    @staticmethod
    def list_all_scans(page: int = 1, limit: int = 50) -> Tuple[List[Dict[str, Any]], int]:
        client = get_supabase_client()
        offset = (page - 1) * limit
        if client:
            try:
                res = client.table("scans").select("*", count="exact").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                return res.data or [], res.count or 0
            except Exception as e:
                logger.error(f"Supabase list_all_scans failed: {e}")

        all_scans = list(_local_scans.values())
        all_scans.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        total = len(all_scans)
        items = all_scans[offset:offset + limit]
        return items, total

    @staticmethod
    def get_review_queue(page: int = 1, limit: int = 50) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        offset = (page - 1) * limit
        if client:
            try:
                res = client.table("scans").select("*").eq("status", "completed").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_review_queue failed: {e}")

        completed = [s for s in _local_scans.values() if s.get("status") == "completed"]
        completed.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return completed[offset:offset + limit]

    @staticmethod
    def list_all_geocoded_scans() -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("scans").select("id, latitude, longitude, probable_larvae_count, risk_level, created_at").not_.is_("latitude", "null").not_.is_("longitude", "null").execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase list_all_geocoded_scans failed: {e}")

        return [
            s for s in _local_scans.values()
            if s.get("latitude") is not None and s.get("longitude") is not None
        ]

    @staticmethod
    def create_tracks(tracks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not tracks_data:
            return []
        client = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        for t in tracks_data:
            if "id" not in t:
                t["id"] = str(uuid.uuid4())
            t["created_at"] = now

        if client:
            try:
                res = client.table("tracks").insert(tracks_data).execute()
                if res.data:
                    return res.data
            except Exception as e:
                logger.error(f"Supabase create_tracks failed: {e}")

        for t in tracks_data:
            scan_id = t["scan_id"]
            if scan_id not in _local_tracks:
                _local_tracks[scan_id] = []
            _local_tracks[scan_id].append(t)
        return tracks_data

    @staticmethod
    def get_tracks_by_scan_id(scan_id: str) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("tracks").select("*").eq("scan_id", scan_id).order("track_number").execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_tracks_by_scan_id failed: {e}")

        return _local_tracks.get(scan_id, [])

    @staticmethod
    def create_review(scan_id: str, reviewer_id: str, decision: ReviewDecision, notes: Optional[str] = None, reviewer_name: Optional[str] = None) -> Dict[str, Any]:
        client = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        dec_str = decision.value if hasattr(decision, "value") else str(decision)
        rec = {
            "id": str(uuid.uuid4()),
            "scan_id": scan_id,
            "reviewer_id": reviewer_id,
            "reviewer_name": reviewer_name,
            "decision": dec_str,
            "notes": notes,
            "created_at": now
        }

        if client:
            try:
                res = client.table("reviews").insert(rec).execute()
                client.table("scans").update({"review_status": "reviewed"}).eq("id", scan_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_review failed: {e}")

        if scan_id not in _local_reviews:
            _local_reviews[scan_id] = []
        _local_reviews[scan_id].append(rec)
        
        if scan_id in _local_scans:
            _local_scans[scan_id]["review_status"] = "reviewed"

        return rec

    @staticmethod
    def get_reviews_by_scan_id(scan_id: str) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("reviews").select("*").eq("scan_id", scan_id).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase get_reviews_by_scan_id failed: {e}")

        return _local_reviews.get(scan_id, [])

    @staticmethod
    def append_scan_event(scan_id: str, stage: str, event_type: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        client = get_supabase_client()
        now = datetime.now(timezone.utc).isoformat()
        rec = {
            "scan_id": scan_id,
            "stage": stage,
            "event_type": event_type,
            "payload": payload or {},
            "created_at": now
        }

        if client:
            try:
                res = client.table("scan_events").insert(rec).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase append_scan_event failed: {e}")

        if scan_id not in _local_events:
            _local_events[scan_id] = []
        _local_events[scan_id].append(rec)
        return rec

    # ==================== VECTOR ABATEMENT TASKS & DISPATCH ====================

    @staticmethod
    def list_field_workers() -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("profiles").select("*").eq("role", "field_worker").execute()
                if res.data and len(res.data) > 0:
                    workers = []
                    for p in res.data:
                        w_id = p["id"]
                        active_count = sum(1 for t in _local_tasks.values() if t.get("assigned_worker_id") == w_id and t.get("status") in ["assigned", "accepted", "in_progress"])
                        comp_count = sum(1 for t in _local_tasks.values() if t.get("assigned_worker_id") == w_id and t.get("status") == "completed")
                        workers.append({
                            "id": w_id,
                            "name": p.get("full_name", "Field Worker"),
                            "email": p.get("email", "worker@larvalens.org"),
                            "role": "field_worker",
                            "phone": p.get("phone"),
                            "assigned_zone": p.get("location_city", "Field Operations"),
                            "active_tasks_count": active_count,
                            "completed_tasks_count": comp_count,
                            "status": "on_field" if active_count > 0 else "available"
                        })
                    return workers
            except Exception as e:
                logger.error(f"Supabase list_field_workers failed: {e}")

        # Return default active workers
        res = []
        for w in _default_workers:
            w_id = w["id"]
            active_count = sum(1 for t in _local_tasks.values() if t.get("assigned_worker_id") == w_id and t.get("status") in ["assigned", "accepted", "in_progress"])
            comp_count = sum(1 for t in _local_tasks.values() if t.get("assigned_worker_id") == w_id and t.get("status") == "completed")
            res.append({
                **w,
                "active_tasks_count": active_count,
                "completed_tasks_count": comp_count,
                "status": "on_field" if active_count > 0 else "available"
            })
        return res

    @staticmethod
    def create_task(task_data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        task_id = task_data.get("id", f"task-v-{uuid.uuid4().hex[:8]}")
        rec = {
            "id": task_id,
            "scan_id": task_data["scan_id"],
            "citizen_id": task_data.get("citizen_id", "anonymous-citizen"),
            "citizen_name": task_data.get("citizen_name", "Citizen"),
            "assigned_worker_id": task_data["assigned_worker_id"],
            "assigned_worker_name": task_data.get("assigned_worker_name", "Field Worker"),
            "assigned_by_id": task_data.get("assigned_by_id", "admin"),
            "status": task_data.get("status", "assigned"),
            "priority": task_data.get("priority", "high"),
            "latitude": task_data.get("latitude"),
            "longitude": task_data.get("longitude"),
            "location_address": task_data.get("location_address"),
            "probable_larvae_count": task_data.get("probable_larvae_count", 0),
            "risk_level": task_data.get("risk_level", "high"),
            "instructions": task_data.get("instructions"),
            "action_taken": task_data.get("action_taken"),
            "notes": task_data.get("notes"),
            "treatment_chemical": task_data.get("treatment_chemical"),
            "dosage_grams": task_data.get("dosage_grams"),
            "created_at": now,
            "accepted_at": None,
            "completed_at": None
        }

        client = get_supabase_client()
        if client:
            try:
                res = client.table("abatement_tasks").insert(rec).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase create_task failed: {e}")

        _local_tasks[task_id] = rec
        return rec

    @staticmethod
    def get_task_by_id(task_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("abatement_tasks").select("*").eq("id", task_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase get_task_by_id failed: {e}")

        return _local_tasks.get(task_id)

    @staticmethod
    def update_task_status(
        task_id: str, 
        status: str, 
        action_taken: Optional[str] = None, 
        notes: Optional[str] = None,
        chemical: Optional[str] = None,
        dosage: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        update_fields: Dict[str, Any] = {"status": status, "updated_at": now}
        
        if status == "accepted":
            update_fields["accepted_at"] = now
        elif status == "completed":
            update_fields["completed_at"] = now
            if action_taken:
                update_fields["action_taken"] = action_taken
            if notes:
                update_fields["notes"] = notes
            if chemical:
                update_fields["treatment_chemical"] = chemical
            if dosage is not None:
                update_fields["dosage_grams"] = dosage

        client = get_supabase_client()
        if client:
            try:
                res = client.table("abatement_tasks").update(update_fields).eq("id", task_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase update_task_status failed: {e}")

        if task_id in _local_tasks:
            _local_tasks[task_id].update(update_fields)
            return _local_tasks[task_id]
        return None

    @staticmethod
    def list_tasks_for_worker(worker_id: str) -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("abatement_tasks").select("*").eq("assigned_worker_id", worker_id).order("created_at", desc=True).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase list_tasks_for_worker failed: {e}")

        tasks = [t for t in _local_tasks.values() if t.get("assigned_worker_id") == worker_id]
        tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return tasks

    @staticmethod
    def list_all_tasks() -> List[Dict[str, Any]]:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("abatement_tasks").select("*").order("created_at", desc=True).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase list_all_tasks failed: {e}")

        tasks = list(_local_tasks.values())
        tasks.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return tasks
