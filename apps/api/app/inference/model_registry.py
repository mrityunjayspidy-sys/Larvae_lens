import os
import json
import hashlib
import logging
from typing import Dict, Any
from ..core.config import settings
from ..schemas.models import ModelsStatusResponse, ModelItemStatus

logger = logging.getLogger("larvalens.models")

class ModelRegistry:
    def __init__(self):
        self.ready: bool = False
        self.status_code: str = "INITIALIZING"
        self.message: str = "Model registry is initializing."
        self.manifest_data: Dict[str, Any] = {}
        self.active_models_status: Dict[str, ModelItemStatus] = {}
        self.fusion_thresholds: Dict[str, Any] = {
            "detector_threshold": 0.25,
            "min_track_frames": 4,
            "motion_threshold": 0.015,
            "high_morphology_threshold": 0.88
        }
        
        # Loaded model instances
        self.detector_model: Any = None
        self.verifier_model: Any = None
        self.species_model: Any = None

    @staticmethod
    def calculate_sha256(filepath: str) -> str:
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest().lower()

    def load_registry(self):
        logger.info(f"Checking model directory: {settings.MODEL_DIR}")
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        manifest_path = os.path.join(settings.MODEL_DIR, "model_manifest.json")

        if not os.path.exists(manifest_path):
            self.ready = False
            self.status_code = "MISSING_MANIFEST"
            self.message = "model_manifest.json is not present in the active models directory."
            logger.warning(self.message)
            return

        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                self.manifest_data = json.load(f)
        except Exception as e:
            self.ready = False
            self.status_code = "CORRUPT_MANIFEST"
            self.message = f"Failed to parse model_manifest.json: {str(e)}"
            logger.error(self.message)
            return

        required = self.manifest_data.get("required", {})
        detector_cfg = required.get("detector")
        verifier_cfg = required.get("verifier")
        self.fusion_thresholds = self.manifest_data.get("fusion", self.fusion_thresholds)

        if not detector_cfg:
            self.ready = False
            self.status_code = "INVALID_MANIFEST_STRUCTURE"
            self.message = "Manifest must define required detector configuration."
            logger.error(self.message)
            return

        # Check Detector
        det_filename = detector_cfg.get("filename", "larva_detector_e050_best.pt")
        det_path = os.path.join(settings.MODEL_DIR, det_filename)
        det_expected_sha = detector_cfg.get("sha256", "").lower()
        det_exists = os.path.exists(det_path)
        det_actual_sha = self.calculate_sha256(det_path) if det_exists else None
        det_match = (det_actual_sha == det_expected_sha) if (det_exists and det_expected_sha) else False

        self.active_models_status["detector"] = ModelItemStatus(
            artifact_kind="detector",
            filename=det_filename,
            sha256_expected=det_expected_sha,
            sha256_actual=det_actual_sha,
            file_exists=det_exists,
            hash_matched=det_match,
            classes=detector_cfg.get("classes", ["mosquito_larva"]),
            input_size=detector_cfg.get("input_size", 640)
        )

        if not det_exists:
            self.ready = False
            self.status_code = "MISSING_ARTIFACTS"
            self.message = f"Required detector model weights ({det_filename}) missing from MODEL_DIR."
            logger.warning(self.message)
            return

        if not det_match:
            self.ready = False
            self.status_code = "HASH_MISMATCH"
            self.message = f"Detector model file SHA-256 does not match the active manifest."
            logger.warning(self.message)
            return

        # Check Verifier (if configured)
        if verifier_cfg:
            ver_filename = verifier_cfg.get("filename", "larva_debris_verifier_best.pt")
            ver_path = os.path.join(settings.MODEL_DIR, ver_filename)
            ver_expected_sha = verifier_cfg.get("sha256", "").lower()
            ver_exists = os.path.exists(ver_path)
            ver_actual_sha = self.calculate_sha256(ver_path) if ver_exists else None
            ver_match = (ver_actual_sha == ver_expected_sha) if (ver_exists and ver_expected_sha) else False

            self.active_models_status["verifier"] = ModelItemStatus(
                artifact_kind="verifier",
                filename=ver_filename,
                sha256_expected=ver_expected_sha,
                sha256_actual=ver_actual_sha,
                file_exists=ver_exists,
                hash_matched=ver_match,
                classes=verifier_cfg.get("classes", ["larva", "non_larva"]),
                input_size=verifier_cfg.get("input_size", 224)
            )

            if not ver_exists:
                self.ready = False
                self.status_code = "MISSING_ARTIFACTS"
                self.message = f"Verifier model weights ({ver_filename}) missing from MODEL_DIR."
                logger.warning(self.message)
                return

            if not ver_match:
                self.ready = False
                self.status_code = "HASH_MISMATCH"
                self.message = "Verifier model file SHA-256 does not match active manifest."
                logger.warning(self.message)
                return

        # Instantiate PyTorch / YOLO detector
        try:
            from ultralytics import YOLO
            logger.info(f"Loading active detector model: {det_path}")
            self.detector_model = YOLO(det_path)

            if verifier_cfg and os.path.exists(os.path.join(settings.MODEL_DIR, verifier_cfg.get("filename", ""))):
                self.verifier_model = YOLO(os.path.join(settings.MODEL_DIR, verifier_cfg.get("filename", "")))
            else:
                self.verifier_model = None

            self.ready = True
            self.status_code = "READY"
            self.message = "Active larva detector model (larva_detector_e050_best.pt) verified and loaded successfully."
            logger.info(self.message)
        except Exception as e:
            self.ready = False
            self.status_code = "LOAD_FAILURE"
            self.message = f"Failed to instantiate PyTorch/YOLO model: {str(e)}"
            logger.error(self.message, exc_info=True)

    def get_status_response(self) -> ModelsStatusResponse:
        return ModelsStatusResponse(
            ready=self.ready,
            status_code=self.status_code,
            message=self.message,
            active_models=self.active_models_status,
            fusion_thresholds=self.fusion_thresholds,
            species_model_enabled=settings.ENABLE_SPECIES_MODEL
        )

    def get_model_versions_dict(self) -> Dict[str, Any]:
        det_status = self.active_models_status.get("detector")
        ver_status = self.active_models_status.get("verifier")
        return {
            "detector_sha256": det_status.sha256_actual if det_status else None,
            "detector_filename": det_status.filename if det_status else None,
            "verifier_sha256": ver_status.sha256_actual if ver_status else None,
            "status_code": self.status_code,
            "ready": self.ready
        }

model_registry = ModelRegistry()
