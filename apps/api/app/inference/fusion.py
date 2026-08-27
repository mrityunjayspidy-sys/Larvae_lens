from typing import Dict, Any, List, Tuple, Optional
from ..schemas.common import RiskLevel

class FusionEngine:
    def __init__(self, thresholds: Optional[Dict[str, Any]] = None):
        default_thresholds = {
            "detector_threshold": 0.25,
            "larva_threshold": 0.70,
            "min_track_frames": 4,
            "motion_threshold": 0.015,
            "high_morphology_threshold": 0.88
        }
        self.thresholds = {**default_thresholds, **(thresholds or {})}

    def evaluate_track(
        self,
        detector_conf: float,
        larva_prob: float,
        non_larva_prob: float,
        motion_score: float,
        persistence_frames: int
    ) -> Tuple[bool, Optional[str], float]:
        """
        Gating logic for individual object tracks.
        Returns (accepted: bool, reject_reason: Optional[str], fused_confidence: float)
        """
        # Calculate fused confidence
        # 40% detector + 40% verifier + 20% normalized motion
        motion_norm = min(1.0, motion_score * 25.0)
        fused_conf = round(0.40 * detector_conf + 0.40 * larva_prob + 0.20 * motion_norm, 4)

        det_th = self.thresholds["detector_threshold"]
        larva_th = self.thresholds["larva_threshold"]
        min_frames = self.thresholds["min_track_frames"]
        motion_th = self.thresholds["motion_threshold"]
        high_morph_th = self.thresholds["high_morphology_threshold"]

        # 1. Detector check
        if detector_conf < det_th:
            return False, "DETECTOR_LOW_CONFIDENCE", fused_conf

        # 2. Verifier morphology check (Reject leaves, twigs, bubbles, dust)
        if larva_prob < larva_th:
            return False, "FAILED_VERIFIER_DEBRIS_OR_LOOKALIKE", fused_conf

        # 3. Temporal persistence check (Reject momentary noise, reflections)
        if persistence_frames < min_frames:
            return False, "INSUFFICIENT_TEMPORAL_PERSISTENCE", fused_conf

        # 4. Motion / High Morphology check
        if motion_score < motion_th and larva_prob < high_morph_th:
            return False, "STATIC_DEBRIS_NO_INDEPENDENT_MOTION", fused_conf

        # All criteria satisfied -> Accepted candidate track
        return True, None, fused_conf

    @staticmethod
    def map_risk_level(probable_larvae_count: int) -> RiskLevel:
        """
        Risk classification based on probable larvae count.
        Note: Count 0 is 'none_observed' for this specific clip, never 'safe water'.
        """
        if probable_larvae_count == 0:
            return RiskLevel.NONE_OBSERVED
        elif 1 <= probable_larvae_count <= 2:
            return RiskLevel.LOW
        elif 3 <= probable_larvae_count <= 5:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.HIGH

    @staticmethod
    def calculate_overall_confidence(accepted_tracks: List[Dict[str, Any]], default_conf: float = 0.0) -> float:
        if not accepted_tracks:
            return default_conf
        return round(float(sum(t.get("fused_confidence", 0.0) for t in accepted_tracks) / len(accepted_tracks)), 4)
