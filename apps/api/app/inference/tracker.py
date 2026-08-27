import numpy as np
from typing import List, Dict, Any, Tuple

class SimpleByteTrack:
    def __init__(self, iou_threshold: float = 0.3, max_age: int = 5):
        self.iou_threshold = iou_threshold
        self.max_age = max_age
        self.next_track_id = 1
        self.active_tracks: Dict[int, Dict[str, Any]] = {}
        self.completed_tracks: List[Dict[str, Any]] = []

    @staticmethod
    def compute_iou(box1: List[float], box2: List[float]) -> float:
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        inter_area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])

        union_area = area1 + area2 - inter_area
        return inter_area / union_area if union_area > 0 else 0.0

    def update(self, detections: List[Dict[str, Any]], frame_idx: int, timestamp_s: float, global_shift: Tuple[float, float] = (0.0, 0.0)):
        """
        detections: list of {'bbox': [x1, y1, x2, y2], 'confidence': float, 'crop': np.ndarray}
        """
        matched_track_ids = set()
        matched_det_indices = set()

        # Match existing active tracks
        for track_id, track in list(self.active_tracks.items()):
            last_bbox = track["trajectory"][-1]["bbox"]
            # Compensate for global camera motion
            comp_last_bbox = [
                last_bbox[0] + global_shift[0],
                last_bbox[1] + global_shift[1],
                last_bbox[2] + global_shift[0],
                last_bbox[3] + global_shift[1]
            ]
            
            best_iou = 0.0
            best_det_idx = -1

            for idx, det in enumerate(detections):
                if idx in matched_det_indices:
                    continue
                iou = self.compute_iou(comp_last_bbox, det["bbox"])
                if iou > best_iou and iou >= self.iou_threshold:
                    best_iou = iou
                    best_det_idx = idx

            if best_det_idx >= 0:
                det = detections[best_det_idx]
                track["trajectory"].append({
                    "frame_idx": frame_idx,
                    "timestamp_s": timestamp_s,
                    "bbox": det["bbox"],
                    "confidence": det["confidence"]
                })
                track["crops"].append(det.get("crop"))
                track["confidences"].append(det["confidence"])
                track["time_since_update"] = 0
                matched_track_ids.add(track_id)
                matched_det_indices.add(best_det_idx)
            else:
                track["time_since_update"] += 1

        # Age out lost tracks
        for track_id in list(self.active_tracks.keys()):
            if self.active_tracks[track_id]["time_since_update"] > self.max_age:
                self.completed_tracks.append(self.active_tracks.pop(track_id))

        # Create new tracks for unmatched detections
        for idx, det in enumerate(detections):
            if idx not in matched_det_indices:
                track_id = self.next_track_id
                self.next_track_id += 1
                self.active_tracks[track_id] = {
                    "track_number": track_id,
                    "trajectory": [{
                        "frame_idx": frame_idx,
                        "timestamp_s": timestamp_s,
                        "bbox": det["bbox"],
                        "confidence": det["confidence"]
                    }],
                    "crops": [det.get("crop")],
                    "confidences": [det["confidence"]],
                    "time_since_update": 0
                }

    def finish(self) -> List[Dict[str, Any]]:
        for track in self.active_tracks.values():
            self.completed_tracks.append(track)
        self.active_tracks.clear()
        return self.completed_tracks
