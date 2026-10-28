import pytest
from backend.app.llm_analyzer import LLMAnalyzer

def test_validate_and_clean_analysis_success():
    analyzer = LLMAnalyzer()
    valid_ids = {"E1", "E2", "E3"}

    raw_json = {
        "summary": "Service cart is failing with 500 errors",
        "impacted_services": ["cart", "checkout"],
        "probable_root_cause": "Valkey datastore timeout in cart",
        "confidence": 0.95,
        "evidence_ids_used": ["E1", "E2"],
        "customer_update": "We are looking into a temporary issue with carts.",
        "internal_ticket": {
            "title": "Cart failure in production",
            "severity": "P1",
            "steps_to_reproduce": ["Add item to cart"],
            "suspected_cause": "Cart pod unresponsive",
            "next_actions": ["Restart cart pod"]
        },
        "runbook_markdown": "# Runbook\n\nSymptoms: Cart errors."
    }

    is_valid, analysis, error_msg = analyzer.validate_and_clean_analysis(raw_json, valid_ids)
    assert is_valid is True
    assert error_msg is None
    assert analysis is not None
    assert analysis.confidence == 0.95
    assert analysis.evidence_ids_used == ["E1", "E2"]
    assert analysis.internal_ticket.severity == "P1"

def test_validate_rejects_hallucinated_evidence_id():
    analyzer = LLMAnalyzer()
    valid_ids = {"E1", "E2"}

    # Notice "E99" is hallucinated and not in valid_ids!
    raw_json = {
        "summary": "Hallucinated diagnosis",
        "impacted_services": ["cart"],
        "probable_root_cause": "Unknown",
        "confidence": 0.8,
        "evidence_ids_used": ["E1", "E99"],
        "customer_update": "Customer message",
        "internal_ticket": {
            "title": "Ticket",
            "severity": "P2",
            "steps_to_reproduce": [],
            "suspected_cause": "Cause",
            "next_actions": []
        },
        "runbook_markdown": "Runbook"
    }

    is_valid, analysis, error_msg = analyzer.validate_and_clean_analysis(raw_json, valid_ids)
    assert is_valid is False
    assert analysis is None
    assert "Cited non-existent evidence IDs" in error_msg
    assert "E99" in error_msg

def test_validate_missing_required_key():
    analyzer = LLMAnalyzer()
    valid_ids = {"E1"}
    raw_json = {
        "summary": "Missing other keys",
        "confidence": 0.9
    }
    is_valid, analysis, error_msg = analyzer.validate_and_clean_analysis(raw_json, valid_ids)
    assert is_valid is False
    assert "Missing required key" in error_msg

