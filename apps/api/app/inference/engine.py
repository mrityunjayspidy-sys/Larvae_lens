import os
import cv2
import numpy as np
import logging
from typing import Dict, Any, List, Optional
from .model_registry import model_registry
from .video_quality import VideoQualityService
from .tracker import SimpleByteTrack
from .fusion import FusionEngine
from ..schemas.common import VideoQuality, RiskLevel

logger = logging.getLogger("larvalens.inference")

class InferenceEngine:
    def __init__(self):
        self.fusion = FusionEngine(model_registry.fusion_thresholds)

    def process_video(
        self,
        video_path: str,
        output_evidence_dir: Optional[str] = None,
        progress_callback: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end video analysis pipeline with active YOLO larva detector.
        """
        if not model_registry.ready:
            raise RuntimeError("ModelRegistry is not ready. Cannot process inference.")

        # Stage 1: Video Quality Assessment
        if progress_callback:
            progress_callback(10, "validating")
            
        quality, quality_reasons, quality_metrics = VideoQualityService.analyze_video(video_path)
        
        # If quality is poor (e.g., completely unreadable/black/zero-focus), return retake_required
        if quality == VideoQuality.POOR and ("LOW_LIGHT_ENVIRONMENT" in quality_reasons or "EXCESSIVE_BLUR_OUT_OF_FOCUS" in quality_reasons):
            return {
                "status": "retake_required",
                "video_quality": quality,
                "quality_reasons": quality_reasons,
                "probable_larvae_count": 0,
                "rejected_tracks": 0,
                "overall_confidence": 0.0,
                "risk_level": RiskLevel.NONE_OBSERVED,
                "tracks": [],
                "model_versions": model_registry.get_model_versions_dict()
            }

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Could not open video stream for inference.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0.0
        
        # Sample at ~6-8 FPS for efficient and accurate tracking
        sample_step = max(1, int(round(fps / 6.0)))
        
        tracker = SimpleByteTrack(iou_threshold=0.25, max_age=4)
        prev_gray = None
        sampled_frame_idx = 0

        if progress_callback:
            progress_callback(30, "detecting")

        frame_num = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_num % sample_step == 0:
                h, w = frame.shape[:2]
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                timestamp_s = frame_num / fps

                # Calculate global camera motion shift
                global_shift = (0.0, 0.0)
                if prev_gray is not None:
                    flow = cv2.calcOpticalFlowFarneback(
                        prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
                    )
                    mean_flow = np.mean(flow, axis=(0, 1))
                    global_shift = (float(mean_flow[0]), float(mean_flow[1]))
                prev_gray = gray

                # Run Detector YOLO model
                det_results = model_registry.detector_model.predict(
                    frame,
                    conf=model_registry.fusion_thresholds.get("detector_threshold", 0.25),
                    imgsz=640,
                    verbose=False
                )

                frame_detections = []
                for res in det_results:
                    boxes = res.boxes
                    for box in boxes:
                        coords = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0].cpu().numpy())
                        
                        # Extract 15% padded crop
                        x1, y1, x2, y2 = coords
                        bw = x2 - x1
                        bh = y2 - y1
                        pad_x = bw * 0.15
                        pad_y = bh * 0.15
                        crop_x1 = max(0, int(x1 - pad_x))
                        crop_y1 = max(0, int(y1 - pad_y))
                        crop_x2 = min(w, int(x2 + pad_x))
                        crop_y2 = min(h, int(y2 + pad_y))

                        crop = frame[crop_y1:crop_y2, crop_x1:crop_x2]
                        if crop.size > 0:
                            frame_detections.append({
                                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                                "confidence": conf,
                                "crop": crop
                            })

                tracker.update(frame_detections, sampled_frame_idx, timestamp_s, global_shift)
                sampled_frame_idx += 1

            frame_num += 1

        cap.release()

        # Finish tracking
        raw_tracks = tracker.finish()

        if progress_callback:
            progress_callback(55, "verifying")

        # Process each track with Binary Verifier & Evidence Fusion
        processed_tracks: List[Dict[str, Any]] = []
        accepted_tracks: List[Dict[str, Any]] = []
        rejected_tracks: List[Dict[str, Any]] = []

        if progress_callback:
            progress_callback(75, "tracking")

        for track in raw_tracks:
            track_num = track["track_number"]
            crops = [c for c in track["crops"] if c is not None and c.size > 0]
            confs = track["confidences"]
            trajectory = track["trajectory"]
            persistence_frames = len(trajectory)
            
            avg_det_conf = float(np.mean(confs)) if confs else 0.0
            
            # Morphology larva probability
            larva_prob = avg_det_conf
            non_larva_prob = 1.0 - avg_det_conf
            evidence_frame_path = None

            if crops:
                # Select sharpest crop for evidence
                best_crop = max(crops, key=lambda c: cv2.Laplacian(cv2.cvtColor(c, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var() if c.size > 0 else 0)
                
                # Save evidence crop if directory provided
                if output_evidence_dir:
                    os.makedirs(output_evidence_dir, exist_ok=True)
                    crop_filename = f"track_{track_num}.jpg"
                    evidence_frame_path = os.path.join(output_evidence_dir, crop_filename)
                    cv2.imwrite(evidence_frame_path, best_crop)

                # If a standalone verifier model is present, predict with Verifier
                if model_registry.verifier_model is not None:
                    ver_results = model_registry.verifier_model.predict(
                        best_crop,
                        imgsz=224,
                        verbose=False
                    )
                    for vres in ver_results:
                        probs = vres.probs
                        if probs is not None:
                            prob_data = probs.data.cpu().numpy()
                            classes = model_registry.active_models_status.get("verifier", None)
                            class_names = classes.classes if classes else ["larva", "non_larva"]
                            
                            larva_idx = class_names.index("larva") if "larva" in class_names else 0
                            non_larva_idx = 1 - larva_idx if len(class_names) > 1 else 1

                            if len(prob_data) > larva_idx:
                                larva_prob = float(prob_data[larva_idx])
                            if len(prob_data) > non_larva_idx:
                                non_larva_prob = float(prob_data[non_larva_idx])

            # Calculate motion score: total distance traveled
            motion_score = 0.0
            if len(trajectory) >= 2:
                centers = [
                    ((p["bbox"][0] + p["bbox"][2]) / 2.0, (p["bbox"][1] + p["bbox"][3]) / 2.0)
                    for p in trajectory
                ]
                dists = [
                    np.linalg.norm(np.array(centers[i]) - np.array(centers[i-1]))
                    for i in range(1, len(centers))
                ]
                motion_score = float(np.mean(dists)) / max(1.0, float(quality_metrics.get("width", 640)))

            # Evaluate Gating with FusionEngine
            accepted, reject_reason, fused_conf = self.fusion.evaluate_track(
                detector_conf=avg_det_conf,
                larva_prob=larva_prob,
                non_larva_prob=non_larva_prob,
                motion_score=motion_score,
                persistence_frames=persistence_frames
            )

            track_record = {
                "track_number": track_num,
                "detector_confidence": round(avg_det_conf, 4),
                "larva_probability": round(larva_prob, 4),
                "non_larva_probability": round(non_larva_prob, 4),
                "motion_score": round(motion_score, 5),
                "fused_confidence": fused_conf,
                "persistence_frames": persistence_frames,
                "accepted": accepted,
                "reject_reason": reject_reason,
                "trajectory": trajectory,
                "evidence_frame_path": evidence_frame_path
            }

            processed_tracks.append(track_record)
            if accepted:
                accepted_tracks.append(track_record)
            else:
                rejected_tracks.append(track_record)

        probable_larvae_count = len(accepted_tracks)
        rejected_count = len(rejected_tracks)
        overall_confidence = self.fusion.calculate_overall_confidence(accepted_tracks)
        risk_level = self.fusion.map_risk_level(probable_larvae_count)

        return {
            "status": "completed",
            "video_quality": quality,
            "quality_reasons": quality_reasons,
            "probable_larvae_count": probable_larvae_count,
            "rejected_tracks": rejected_count,
            "overall_confidence": overall_confidence,
            "risk_level": risk_level,
            "tracks": processed_tracks,
            "model_versions": model_registry.get_model_versions_dict(),
            "duration_seconds": round(duration, 3)
        }

inference_engine = InferenceEngine()
