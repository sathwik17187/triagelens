import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .config import settings
from .database import get_incident, init_db, list_incidents, save_incident
from .flagd_manager import flagd_manager
from .collector import collector
from .scorer import deterministic_scorer
from .llm_analyzer import llm_analyzer
from .stream import health_stream_generator
from .models import (
    Fault,
    Incident,
    IncidentCreate,
)

app = FastAPI(
    title="TriageLens API",
    description="Incident-Triage Copilot for OpenTelemetry Demo",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.app_name, "ollama_model": settings.ollama_model}

@app.get("/faults", response_model=List[Fault])
async def list_faults():
    """List injectable faults from the flagd config with human descriptions."""
    return flagd_manager.list_faults()

@app.post("/incidents", response_model=Incident)
async def create_incident(payload: IncidentCreate):
    """Toggle a fault, record start time and ground-truth faulty service."""
    fault_name = payload.fault_name
    ground_truth = flagd_manager.get_ground_truth(fault_name)
    variant = payload.variant or "on"

    # Inject fault in flagd
    flagd_manager.set_fault(fault_name, enable=True, variant=variant)

    incident_id = f"INC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
    incident = Incident(
        id=incident_id,
        fault_name=fault_name,
        ground_truth_service=ground_truth,
        status="active",
        start_time=datetime.now(timezone.utc).isoformat(),
        evidence=[],
        ranked_suspects=[],
        analysis=None,
    )
    await save_incident(incident)
    return incident

@app.get("/incidents", response_model=List[Incident])
async def get_all_incidents():
    """List all incidents in case library."""
    return await list_incidents()

@app.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident_by_id(incident_id: str):
    """Retrieve detailed view of an incident."""
    incident = await get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@app.post("/incidents/{incident_id}/resolve", response_model=Incident)
async def resolve_incident(incident_id: str):
    """Deactivate the fault and mark incident resolved."""
    incident = await get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Turn off the fault in flagd
    flagd_manager.set_fault(incident.fault_name, enable=False)

    incident.status = "resolved"
    incident.end_time = datetime.now(timezone.utc).isoformat()
    await save_incident(incident)
    return incident

@app.post("/incidents/{incident_id}/analyze", response_model=Incident)
async def analyze_incident_endpoint(incident_id: str):
    """
    Executes the analysis pipeline in strict order:
    1. Deterministic step: collect evidence and compute transparent suspect scores.
    2. LLM step: send ranked evidence to Ollama.
    3. Strict validation: verify JSON and reject hallucinated evidence IDs with 1-round retry.
    """
    incident = await get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "analyzing"
    await save_incident(incident)

    # 1. Collect evidence
    evidence, service_deltas = await collector.collect_evidence(
        fault_name=incident.fault_name,
        ground_truth_service=incident.ground_truth_service,
    )
    incident.evidence = evidence

    # Deterministic scoring
    ranked_suspects = deterministic_scorer.rank_suspects(service_deltas, evidence)
    incident.ranked_suspects = ranked_suspects

    # 2 & 3. LLM Diagnosis with strict validation and retry
    analysis = await llm_analyzer.analyze_incident(
        ranked_suspects=ranked_suspects,
        evidence=evidence,
        fault_name=incident.fault_name,
    )
    incident.analysis = analysis
    incident.status = "analyzed"

    await save_incident(incident)
    return incident

@app.get("/incidents/{incident_id}/export.md")
async def export_runbook_markdown(incident_id: str):
    """Download generated runbook markdown for an incident."""
    incident = await get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.analysis and incident.analysis.runbook_markdown:
        content = incident.analysis.runbook_markdown
    else:
        content = f"# Runbook for Incident {incident_id}\n\nStatus: {incident.status}\nFault: {incident.fault_name}\n\nAnalysis has not yet been performed on this incident."

    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=runbook-{incident_id}.md"},
    )

@app.get("/stream/health")
async def stream_service_health():
    """SSE stream of per-service error rate and p95 latency for the live UI."""
    return EventSourceResponse(health_stream_generator())

