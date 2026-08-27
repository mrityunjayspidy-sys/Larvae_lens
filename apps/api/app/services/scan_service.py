import os
import uuid
import asyncio
import logging
import cv2
import numpy as np
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from fastapi import UploadFile, BackgroundTasks
from ..core.config import settings
from ..core.errors import (
    ModelNotReadyError, 
    ValidationError, 
    FileTooLargeError, 
    UnsupportedMediaTypeError
)
from ..schemas.common import ScanStatus
from ..db.repository import Repository
from ..inference.model_registry import model_registry
from ..inference.engine import InferenceEngine
from .storage_service import StorageService

logger = logging.getLogger("larvalens.scan_service")

class ScanService:
    @staticmethod
    def validate_file_signature(temp_path: str, mime_type: str) -> bool:
        # Check first bytes for video or image signatures
        try:
            with open(temp_path, "rb") as f:
                header = f.read(32)

            # Common Image signatures
            if header.startswith(b"\xff\xd8\xff"):  # JPEG
                return True
            if header.startswith(b"\x89PNG\r\n\x1a\n"):  # PNG
                return True
            if header.startswith(b"RIFF") and b"WEBP" in header[:16]:  # WebP
                return True

            # Common Video signatures
            if len(header) >= 8:
                # MP4/MOV ftyp box check
                if b"ftyp" in header[4:12] or b"moov" in header[:16]:
                    return True
                # Matroska / WebM
                if header.startswith(b"\x1a\x45\xdf\xa3"):
                    return True

            # Fallback OpenCV verification
            test_cap = cv2.VideoCapture(temp_path)
            if test_cap.isOpened():
                ret, _ = test_cap.read()
                test_cap.release()
                if ret:
                    return True
            
            # Fallback Image decode test
            test_img = cv2.imread(temp_path)
            if test_img is not None and test_img.size > 0:
                return True

            return False
        except Exception:
            return False

    @classmethod
    async def create_and_queue_scan(
        cls,
        video_file: UploadFile,
        owner_id: str,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        location_accuracy_m: Optional[float] = None,
        idempotency_key: Optional[str] = None,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Dict[str, Any]:
        # 1. Model Readiness Gate
        if not model_registry.ready:
            raise ModelNotReadyError(
                f"Analysis service is not ready. Status: {model_registry.status_code}. {model_registry.message}"
            )

        # 2. Check Idempotency
        if idempotency_key:
            existing = Repository.get_scan_by_idempotency_key(owner_id, idempotency_key)
            if existing:
                logger.info(f"Returning idempotent scan: {existing['id']}")
                return existing

        # 3. Validate MIME type
        content_type = video_file.content_type or "video/mp4"
        is_allowed = any(allowed in content_type for allowed in settings.allowed_mime_types_list)
        if not is_allowed and not (video_file.filename and video_file.filename.lower().endswith(('.mp4', '.webm', '.mov', '.jpg', '.jpeg', '.png', '.webp'))):
            raise UnsupportedMediaTypeError(
                f"Media format '{content_type}' is not supported. Allowed formats: {settings.ALLOWED_VIDEO_MIME_TYPES}"
            )

        # 4. Stream to bounded temporary file
        temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "temp"))
        os.makedirs(temp_dir, exist_ok=True)
        scan_id = str(uuid.uuid4())
        original_filename = video_file.filename or "video.mp4"
        temp_filename = f"{scan_id}_{original_filename}"
        temp_file_path = os.path.join(temp_dir, temp_filename)

        total_bytes = 0
        max_bytes = settings.max_video_bytes

        try:
            with open(temp_file_path, "wb") as out_f:
                while chunk := await video_file.read(1024 * 1024):  # 1MB chunk
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        raise FileTooLargeError(settings.MAX_VIDEO_MB)
                    out_f.write(chunk)
        except Exception as e:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise e

        # 5. Validate signature & media decodability
        if not cls.validate_file_signature(temp_file_path, content_type):
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            raise ValidationError("File signature validation failed. File is not a valid video or image stream.")

        is_image = content_type.startswith("image/") or original_filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
        
        if is_image:
            # Convert single image into a 1-second video clip for unified pipeline analysis
            img = cv2.imread(temp_file_path)
            if img is None:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise ValidationError("Could not decode image file. File may be corrupted.")
            
            h, w, _ = img.shape
            conv_video_path = os.path.join(temp_dir, f"{scan_id}_from_img.mp4")
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(conv_video_path, fourcc, 10, (w, h))
            for _ in range(10):  # 10 frames = 1 second
                out.write(img)
            out.release()
            
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            temp_file_path = conv_video_path
            duration = 1.0
        else:
            cap = cv2.VideoCapture(temp_file_path)
            if not cap.isOpened():
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise ValidationError("Could not decode video stream. File may be corrupted or encoded with an unsupported codec.")

            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0.0
            cap.release()

            if duration > settings.MAX_VIDEO_SECONDS:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                raise ValidationError(
                    f"Video duration ({duration:.1f}s) exceeds maximum allowed length of {settings.MAX_VIDEO_SECONDS}s."
                )

        # 6. Save to Storage (Supabase / Local)
        storage_path = StorageService.save_source_video(
            owner_id=owner_id,
            scan_id=scan_id,
            temp_file_path=temp_file_path,
            filename="media.mp4" if is_image else original_filename
        )

        # 7. Create Scan Record in DB
        scan_data = {
            "id": scan_id,
            "owner_id": owner_id,
            "status": ScanStatus.QUEUED.value,
            "progress_percent": 0,
            "current_stage": "queued",
            "source_video_path": storage_path,
            "source_mime_type": content_type,
            "source_size_bytes": total_bytes,
            "duration_seconds": round(duration, 3),
            "latitude": latitude,
            "longitude": longitude,
            "location_accuracy_m": location_accuracy_m,
            "idempotency_key": idempotency_key,
            "model_versions": model_registry.get_model_versions_dict()
        }

        created_scan = Repository.create_scan(scan_data)
        Repository.append_scan_event(scan_id, "queued", "SCAN_SUBMITTED", {"duration_seconds": duration, "size_bytes": total_bytes})

        # 8. Dispatch Background Processing Worker via bounded worker queue
        try:
            from .worker_queue import worker_queue
            await worker_queue.enqueue(scan_id, temp_file_path)
        except Exception as q_err:
            logger.warning(f"Could not enqueue in worker_queue ({q_err}); falling back to background task: {scan_id}")
            if background_tasks:
                background_tasks.add_task(cls.execute_inference_worker, scan_id, temp_file_path)
            else:
                asyncio.create_task(cls._run_worker_async(scan_id, temp_file_path))

        return created_scan

    # Alias for API router compatibility
    process_and_queue_scan = create_and_queue_scan

    @classmethod
    async def _run_worker_async(cls, scan_id: str, temp_file_path: str):
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, cls.execute_inference_worker, scan_id, temp_file_path)

    @classmethod
    def execute_inference_worker(cls, scan_id: str, temp_file_path: str):
        logger.info(f"Starting monotonic background analysis for scan: {scan_id}")
        engine = InferenceEngine()

        def progress_callback(*args, **kwargs):
            # Gracefully handle progress_callback(progress_percent, stage_name) or progress_callback(status, progress_percent, stage_name)
            progress_percent = 50
            stage_name = "detecting"
            status = ScanStatus.DETECTING.value

            if len(args) == 2:
                if isinstance(args[0], int):
                    progress_percent = args[0]
                    stage_name = str(args[1])
                else:
                    stage_name = str(args[0])
                    progress_percent = int(args[1]) if isinstance(args[1], int) else 50
            elif len(args) >= 3:
                if isinstance(args[1], int):
                    status = str(args[0])
                    progress_percent = args[1]
                    stage_name = str(args[2])
                elif isinstance(args[0], int):
                    progress_percent = args[0]
                    stage_name = str(args[1])
                    status = str(args[2])
            elif len(args) == 1:
                if isinstance(args[0], int):
                    progress_percent = args[0]
                else:
                    stage_name = str(args[0])

            if "progress_percent" in kwargs:
                progress_percent = kwargs["progress_percent"]
            if "stage_name" in kwargs:
                stage_name = kwargs["stage_name"]
            if "status" in kwargs:
                status = kwargs["status"]

            # Map stage to appropriate scan status
            if stage_name in ["validating"]:
                status = ScanStatus.VALIDATING.value
            elif stage_name in ["detecting"]:
                status = ScanStatus.DETECTING.value
            elif stage_name in ["verifying"]:
                status = ScanStatus.VERIFYING.value
            elif stage_name in ["tracking"]:
                status = ScanStatus.TRACKING.value

            Repository.update_scan(scan_id, {
                "status": status,
                "progress_percent": progress_percent,
                "current_stage": stage_name
            })
            Repository.append_scan_event(scan_id, stage_name, "STAGE_PROGRESS", {"percent": progress_percent})

        try:
            result = engine.process_video(
                video_path=temp_file_path,
                progress_callback=progress_callback
            )

            # Store tracks in database
            tracks = result.get("tracks", []) if isinstance(result, dict) else getattr(result, "tracks", [])
            if tracks:
                db_tracks = []
                for t in tracks:
                    db_tracks.append({
                        "scan_id": scan_id,
                        "track_number": t.get("track_number") if isinstance(t, dict) else getattr(t, "track_number", 1),
                        "detector_confidence": t.get("detector_confidence") if isinstance(t, dict) else getattr(t, "detector_confidence", 0.0),
                        "larva_probability": t.get("larva_probability") if isinstance(t, dict) else getattr(t, "larva_probability", 0.0),
                        "non_larva_probability": t.get("non_larva_probability") if isinstance(t, dict) else getattr(t, "non_larva_probability", 0.0),
                        "motion_score": t.get("motion_score") if isinstance(t, dict) else getattr(t, "motion_score", 0.0),
                        "fused_confidence": t.get("fused_confidence") if isinstance(t, dict) else getattr(t, "fused_confidence", 0.0),
                        "persistence_frames": t.get("persistence_frames") if isinstance(t, dict) else getattr(t, "persistence_frames", 1),
                        "accepted": t.get("accepted") if isinstance(t, dict) else getattr(t, "accepted", False),
                        "reject_reason": t.get("reject_reason") if isinstance(t, dict) else getattr(t, "reject_reason", None),
                        "trajectory": t.get("trajectory") if isinstance(t, dict) else getattr(t, "trajectory", []),
                        "evidence_frame_path": t.get("evidence_frame_path") if isinstance(t, dict) else getattr(t, "evidence_frame_path", None),
                    })
                Repository.create_tracks(db_tracks)

            # Finalize scan update
            final_status = result.get("status", "completed") if isinstance(result, dict) else getattr(result, "status", "completed")
            probable_larvae_count = result.get("probable_larvae_count", 0) if isinstance(result, dict) else getattr(result, "probable_larvae_count", 0)
            rejected_tracks = result.get("rejected_tracks", 0) if isinstance(result, dict) else getattr(result, "rejected_tracks", 0)
            overall_confidence = result.get("overall_confidence", 0.0) if isinstance(result, dict) else getattr(result, "overall_confidence", 0.0)
            
            risk_level = result.get("risk_level", "none_observed") if isinstance(result, dict) else getattr(result, "risk_level", "none_observed")
            if hasattr(risk_level, "value"):
                risk_level = risk_level.value

            video_quality = result.get("video_quality", "good") if isinstance(result, dict) else getattr(result, "video_quality", "good")
            if hasattr(video_quality, "value"):
                video_quality = video_quality.value

            quality_reasons = result.get("quality_reasons", []) if isinstance(result, dict) else getattr(result, "quality_reasons", [])

            final_update = {
                "status": final_status if final_status in [s.value for s in ScanStatus] else ScanStatus.COMPLETED.value,
                "progress_percent": 100,
                "current_stage": "completed",
                "probable_larvae_count": probable_larvae_count,
                "rejected_tracks": rejected_tracks,
                "overall_confidence": overall_confidence,
                "risk_level": risk_level,
                "video_quality": video_quality,
                "quality_reasons": quality_reasons,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            Repository.update_scan(scan_id, final_update)
            Repository.append_scan_event(scan_id, "completed", "SCAN_COMPLETED", {"probable_larvae_count": probable_larvae_count})
            logger.info(f"Scan {scan_id} analysis finished with status: {final_status}")

        except Exception as e:
            logger.error(f"Inference pipeline failed for scan {scan_id}: {e}", exc_info=True)
            Repository.update_scan(scan_id, {
                "status": ScanStatus.FAILED.value,
                "progress_percent": 100,
                "current_stage": "failed",
                "error_code": "INFERENCE_EXECUTION_ERROR",
                "error_message": str(e)
            })
            Repository.append_scan_event(scan_id, "failed", "SCAN_FAILED", {"error": str(e)})

        finally:
            if os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass
