import os
import pytest
from app.inference.model_registry import model_registry
from app.inference.engine import InferenceEngine
from app.inference.fusion import FusionEngine
from app.schemas.common import RiskLevel

def test_fusion_gating_algorithm_numerical_units():
    """Unit tests for evidence fusion and multi-stage gating with exact numeric vectors."""
    fusion_engine = FusionEngine({
        "detector_threshold": 0.25,
        "larva_threshold": 0.70,
        "min_track_frames": 4,
        "motion_threshold": 0.015,
        "high_morphology_threshold": 0.88,
    })

    # 1. Valid larva track: passes all 4 stages
    accepted, reason, conf = fusion_engine.evaluate_track(
        detector_conf=0.85,
        larva_prob=0.92,
        non_larva_prob=0.08,
        motion_score=0.045,
        persistence_frames=8
    )
    assert accepted is True
    assert reason is None
    assert conf > 0.80

    # 2. Debris candidate: low morphology probability (e.g. twig / dust)
    accepted, reason, conf = fusion_engine.evaluate_track(
        detector_conf=0.75,
        larva_prob=0.35,
        non_larva_prob=0.65,
        motion_score=0.030,
        persistence_frames=6
    )
    assert accepted is False
    assert reason == "FAILED_VERIFIER_DEBRIS_OR_LOOKALIKE"

    # 3. Low persistence candidate: noise/artifact present for only 2 frames
    accepted, reason, conf = fusion_engine.evaluate_track(
        detector_conf=0.80,
        larva_prob=0.85,
        non_larva_prob=0.15,
        motion_score=0.025,
        persistence_frames=2
    )
    assert accepted is False
    assert reason == "INSUFFICIENT_TEMPORAL_PERSISTENCE"

    # 4. Stationary debris with low motion score
    accepted, reason, conf = fusion_engine.evaluate_track(
        detector_conf=0.80,
        larva_prob=0.75,
        non_larva_prob=0.25,
        motion_score=0.005,
        persistence_frames=7
    )
    assert accepted is False
    assert reason == "STATIC_DEBRIS_NO_INDEPENDENT_MOTION"

    # 5. Stationary object with exceptional morphology (> 0.88)
    accepted, reason, conf = fusion_engine.evaluate_track(
        detector_conf=0.88,
        larva_prob=0.95,
        non_larva_prob=0.05,
        motion_score=0.005,
        persistence_frames=6
    )
    assert accepted is True

def test_risk_level_calculation():
    """Verify epidemiological risk band classifications."""
    assert FusionEngine.map_risk_level(0) == RiskLevel.NONE_OBSERVED
    assert FusionEngine.map_risk_level(1) == RiskLevel.LOW
    assert FusionEngine.map_risk_level(2) == RiskLevel.LOW
    assert FusionEngine.map_risk_level(3) == RiskLevel.MEDIUM
    assert FusionEngine.map_risk_level(5) == RiskLevel.MEDIUM
    assert FusionEngine.map_risk_level(6) == RiskLevel.HIGH
    assert FusionEngine.map_risk_level(20) == RiskLevel.HIGH

@pytest.mark.skipif(not model_registry.ready, reason="Real YOLO & Verifier PyTorch model weights are not loaded in MODEL_DIR")
def test_real_inference_engine_smoke():
    """Integration smoke test for full inference pipeline (executed only when weights are present)."""
    engine = InferenceEngine()
    assert engine is not None
