import cv2
import numpy as np
from typing import Dict, Any, List, Tuple
from ..schemas.common import VideoQuality

class VideoQualityService:
    @staticmethod
    def analyze_video(video_path: str, max_sample_frames: int = 60) -> Tuple[VideoQuality, List[str], Dict[str, Any]]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return VideoQuality.POOR, ["UNREADABLE_VIDEO_STREAM"], {}

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0.0

        sample_step = max(1, total_frames // max_sample_frames)
        
        brightness_list = []
        blur_scores = []
        prev_gray = None
        global_shifts = []

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % sample_step == 0:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                # 1. Brightness (mean pixel intensity)
                brightness_list.append(float(np.mean(gray)))
                # 2. Blur (Laplacian variance)
                blur_scores.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))
                # 3. Global camera shift estimation
                if prev_gray is not None:
                    flow = cv2.calcOpticalFlowFarneback(
                        prev_gray, gray, None, 0.5, 3, 15, 3, 5, 1.2, 0
                    )
                    shift = np.linalg.norm(np.mean(flow, axis=(0, 1)))
                    global_shifts.append(float(shift))
                prev_gray = gray

            frame_idx += 1

        cap.release()

        reasons: List[str] = []
        avg_brightness = float(np.mean(brightness_list)) if brightness_list else 0.0
        avg_blur = float(np.mean(blur_scores)) if blur_scores else 0.0
        max_shift = float(np.max(global_shifts)) if global_shifts else 0.0

        if avg_brightness < 35.0:
            reasons.append("LOW_LIGHT_ENVIRONMENT")
        elif avg_brightness > 230.0:
            reasons.append("OVEREXPOSED_SURFACE_REFLECTION")

        if avg_blur < 45.0:
            reasons.append("EXCESSIVE_BLUR_OUT_OF_FOCUS")

        if max_shift > 20.0:
            reasons.append("SEVERE_CAMERA_UNSTABILITY")

        if len(reasons) >= 2 or avg_blur < 20.0 or avg_brightness < 20.0:
            quality = VideoQuality.POOR
        elif len(reasons) == 1 or avg_blur < 80.0:
            quality = VideoQuality.USABLE
        else:
            quality = VideoQuality.GOOD

        metrics = {
            "fps": fps,
            "total_frames": total_frames,
            "width": width,
            "height": height,
            "duration_seconds": duration,
            "avg_brightness": avg_brightness,
            "avg_blur_laplacian": avg_blur,
            "max_camera_shift": max_shift
        }

        return quality, reasons, metrics
