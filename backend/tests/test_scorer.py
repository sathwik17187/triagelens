import pytest
from backend.app.models import EvidenceItem
from backend.app.scorer import DeterministicScorer

def test_deterministic_scorer_ranks_faulty_service_first():
    scorer = DeterministicScorer()

    service_deltas = {
        "cart": {"error_rate_delta": 0.55, "latency_p95_delta": 450.0, "error_traces": 30.0, "error_logs": 50.0},
        "frontend": {"error_rate_delta": 0.12, "latency_p95_delta": 110.0, "error_traces": 5.0, "error_logs": 8.0},
        "payment": {"error_rate_delta": 0.001, "latency_p95_delta": 5.0, "error_traces": 0.0, "error_logs": 0.0},
        "shipping": {"error_rate_delta": 0.002, "latency_p95_delta": 4.0, "error_traces": 0.0, "error_logs": 0.0},
    }

    evidence = [
        EvidenceItem(id="E1", type="metric_error_rate", service="cart", summary="Error spike on cart", severity="high"),
        EvidenceItem(id="E2", type="trace_error", service="cart", summary="Span 500 error", severity="high"),
        EvidenceItem(id="E3", type="metric_error_rate", service="frontend", summary="Cascading 500", severity="medium"),
    ]

    suspects = scorer.rank_suspects(service_deltas, evidence)

    assert len(suspects) == 4
    # Highest suspect must be cart
    assert suspects[0].service == "cart"
    assert suspects[0].rank == 1
    assert suspects[0].score > suspects[1].score
    assert "E1" in suspects[0].evidence_ids
    assert "E2" in suspects[0].evidence_ids
    assert "E3" in suspects[1].evidence_ids

def test_deterministic_scorer_latency_ranking():
    scorer = DeterministicScorer()
    service_deltas = {
        "agent": {"error_rate_delta": 0.01, "latency_p95_delta": 5200.0, "error_traces": 15.0, "error_logs": 20.0},
        "checkout": {"error_rate_delta": 0.002, "latency_p95_delta": 20.0, "error_traces": 1.0, "error_logs": 0.0},
    }
    evidence = [
        EvidenceItem(id="E1", type="metric_latency_p95", service="agent", summary="Extreme latency in agent", severity="high")
    ]
    suspects = scorer.rank_suspects(service_deltas, evidence)
    assert suspects[0].service == "agent"
    assert suspects[0].rank == 1

