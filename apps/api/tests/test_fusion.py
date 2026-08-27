import pytest
from app.inference.fusion import FusionEngine
from app.schemas.common import RiskLevel

@pytest.fixture
def fusion():
    return FusionEngine({
        "detector_threshold": 0.25,
        "larva_threshold": 0.70,
        "min_track_frames": 4,
        "motion_threshold": 0.015,
        "high_morphology_threshold": 0.88
    })

def test_fusion_accepts_valid_larva(fusion):
    accepted, reason, conf = fusion.evaluate_track(
        detector_conf=0.85,
        larva_prob=0.92,
        non_larva_prob=0.08,
        motion_score=0.04,
        persistence_frames=6
    )
    assert accepted is True
    assert reason is None
    assert conf > 0.70

def test_fusion_rejects_debris_morphology(fusion):
    accepted, reason, conf = fusion.evaluate_track(
        detector_conf=0.60,
        larva_prob=0.35,  # low larva prob (leaf/twig)
        non_larva_prob=0.65,
        motion_score=0.02,
        persistence_frames=5
    )
    assert accepted is False
    assert reason == "FAILED_VERIFIER_DEBRIS_OR_LOOKALIKE"

def test_fusion_rejects_insufficient_persistence(fusion):
    accepted, reason, conf = fusion.evaluate_track(
        detector_conf=0.80,
        larva_prob=0.85,
        non_larva_prob=0.15,
        motion_score=0.03,
        persistence_frames=2  # less than 4 frames
    )
    assert accepted is False
    assert reason == "INSUFFICIENT_TEMPORAL_PERSISTENCE"

def test_fusion_rejects_static_debris_without_exceptional_morphology(fusion):
    accepted, reason, conf = fusion.evaluate_track(
        detector_conf=0.75,
        larva_prob=0.75,
        non_larva_prob=0.25,
        motion_score=0.002,  # stationary object (e.g. dust specks)
        persistence_frames=8
    )
    assert accepted is False
    assert reason == "STATIC_DEBRIS_NO_INDEPENDENT_MOTION"

def test_risk_level_mapping(fusion):
    assert fusion.map_risk_level(0) == RiskLevel.NONE_OBSERVED
    assert fusion.map_risk_level(1) == RiskLevel.LOW
    assert fusion.map_risk_level(2) == RiskLevel.LOW
    assert fusion.map_risk_level(4) == RiskLevel.MEDIUM
    assert fusion.map_risk_level(7) == RiskLevel.HIGH
