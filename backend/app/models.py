from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator

class Fault(BaseModel):
    name: str
    description: str
    target_service: str
    default_variant: str
    active_variant: str
    state: str = "ENABLED"
    is_active: bool = False
    variants: Dict[str, Any] = {}

class EvidenceItem(BaseModel):
    id: str  # E1, E2, ...
    type: str  # metric_error_rate, metric_latency_p95, trace_error, log_error
    service: str
    summary: str
    details: Dict[str, Any] = {}
    severity: str = "medium"  # high, medium, low

class SuspectScore(BaseModel):
    service: str
    score: float
    rank: int
    error_rate_delta: float
    latency_p95_delta: float
    trace_error_count: int = 0
    log_error_count: int = 0
    evidence_ids: List[str] = []

class InternalTicket(BaseModel):
    title: str
    severity: str  # P1, P2, P3, P4
    steps_to_reproduce: List[str] = []
    suspected_cause: str
    next_actions: List[str] = []

    @field_validator("steps_to_reproduce", "next_actions", mode="before")
    @classmethod
    def coerce_to_list(cls, v):
        if isinstance(v, str):
            return [line.strip() for line in v.split("\n") if line.strip()] or [v]
        return v if isinstance(v, list) else []

class AnalysisOutput(BaseModel):
    summary: str
    impacted_services: List[str]
    probable_root_cause: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_ids_used: List[str]
    customer_update: str
    internal_ticket: InternalTicket
    runbook_markdown: str

class IncidentCreate(BaseModel):
    fault_name: str
    variant: Optional[str] = None

class Incident(BaseModel):
    id: str
    fault_name: str
    ground_truth_service: str
    status: str  # active, analyzing, analyzed, resolved
    start_time: str
    end_time: Optional[str] = None
    evidence: List[EvidenceItem] = []
    ranked_suspects: List[SuspectScore] = []
    analysis: Optional[AnalysisOutput] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServiceHealth(BaseModel):
    service: str
    error_rate: float  # 0.0 to 1.0 (or percentage)
    p95_latency_ms: float
    request_rate: float
    status: str  # healthy, degraded, critical
    active_fault: Optional[str] = None
