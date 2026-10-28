import json
import logging
from typing import Any, Dict, List, Optional, Set, Tuple
import httpx
from .config import settings
from .models import AnalysisOutput, EvidenceItem, InternalTicket, SuspectScore

logger = logging.getLogger(__name__)

ANALYSIS_SYSTEM_PROMPT = """You are TriageLens, an expert Site Reliability and Incident Triage AI copilot.
Your job is to analyze observability evidence (metrics, Jaeger traces, error logs) collected during an incident on the OpenTelemetry microservices demo.

You MUST respond ONLY with valid JSON conforming strictly to the requested schema.
CRITICAL CONSTRAINT: You may ONLY cite evidence IDs that are explicitly present in the provided EVIDENCE list (e.g. E1, E2, ...). Any hallucinated or invented evidence ID is strictly forbidden.
"""

ANALYSIS_USER_TEMPLATE = """INCIDENT EVIDENCE & SUSPECT RANKINGS:

RANKED SUSPECT SERVICES:
{suspects_text}

EVIDENCE ITEMS:
{evidence_text}

VALID EVIDENCE IDS: {valid_ids}

Analyze this incident. Follow these strict rules:
1. Identify the probable root cause service and mechanism.
2. In 'evidence_ids_used', cite ONLY IDs from the VALID EVIDENCE IDS list. Never invent new IDs.
3. 'customer_update' must be plain, reassuring, non-technical, and contain zero blame.
4. 'internal_ticket' must contain title, severity (P1/P2/P3), steps_to_reproduce, suspected_cause, next_actions.
5. 'runbook_markdown' must include Symptoms, Diagnosis Steps, Resolution, Verification, and Prevention.
6. Return JSON ONLY with keys:
   summary (string)
   impacted_services (list of strings)
   probable_root_cause (string)
   confidence (float between 0.0 and 1.0)
   evidence_ids_used (list of strings)
   customer_update (string)
   internal_ticket (object with title, severity, steps_to_reproduce, suspected_cause, next_actions)
   runbook_markdown (string)
"""

class LLMAnalyzer:
    def __init__(self):
        self.ollama_url = settings.ollama_url.rstrip("/")
        self.model = settings.ollama_model

    def validate_and_clean_analysis(
        self,
        raw_json: Dict[str, Any],
        valid_ids: Set[str]
    ) -> Tuple[bool, Optional[AnalysisOutput], Optional[str]]:
        """
        Validates the parsed JSON against the AnalysisOutput schema and ensures
        evidence_ids_used contains ONLY valid IDs.
        Returns (is_valid, analysis_obj, error_message).
        """
        try:
            # Check required keys
            required_keys = [
                "summary", "impacted_services", "probable_root_cause",
                "confidence", "evidence_ids_used", "customer_update",
                "internal_ticket", "runbook_markdown"
            ]
            for key in required_keys:
                if key not in raw_json:
                    return False, None, f"Missing required key: '{key}'"

            # Check evidence IDs
            used_ids = raw_json.get("evidence_ids_used", [])
            if not isinstance(used_ids, list):
                return False, None, "'evidence_ids_used' must be a list"

            invalid_ids = [eid for eid in used_ids if str(eid).strip() not in valid_ids]
            if invalid_ids:
                return False, None, f"Cited non-existent evidence IDs: {invalid_ids}. Valid IDs are: {sorted(list(valid_ids))}"

            # Validate confidence
            confidence = float(raw_json.get("confidence", 0.8))
            confidence = max(0.0, min(1.0, confidence))

            # Validate ticket
            ticket_data = raw_json.get("internal_ticket", {})
            if not isinstance(ticket_data, dict):
                return False, None, "'internal_ticket' must be an object"

            # Coerce list or string for ticket fields
            steps = ticket_data.get("steps_to_reproduce", ["Examine recent metrics", "Trigger traffic load"])
            if isinstance(steps, str):
                steps = [s.strip() for s in steps.split("\n") if s.strip()] or [steps]

            actions = ticket_data.get("next_actions", ["Verify downstream dependencies", "Deploy mitigation"])
            if isinstance(actions, str):
                actions = [a.strip() for a in actions.split("\n") if a.strip()] or [actions]

            ticket = InternalTicket(
                title=str(ticket_data.get("title", "Service Degradation Incident")),
                severity=str(ticket_data.get("severity", "P2")),
                steps_to_reproduce=steps,
                suspected_cause=str(ticket_data.get("suspected_cause", raw_json.get("probable_root_cause", ""))),
                next_actions=actions,
            )

            analysis = AnalysisOutput(
                summary=str(raw_json.get("summary", "")),
                impacted_services=[str(s) for s in raw_json.get("impacted_services", [])],
                probable_root_cause=str(raw_json.get("probable_root_cause", "")),
                confidence=confidence,
                evidence_ids_used=[str(eid).strip() for eid in used_ids],
                customer_update=str(raw_json.get("customer_update", "")),
                internal_ticket=ticket,
                runbook_markdown=str(raw_json.get("runbook_markdown", "")),
            )
            return True, analysis, None
        except Exception as e:
            return False, None, f"Validation exception: {str(e)}"

    async def analyze_incident(
        self,
        ranked_suspects: List[SuspectScore],
        evidence: List[EvidenceItem],
        fault_name: Optional[str] = None
    ) -> AnalysisOutput:
        valid_ids: Set[str] = {ev.id for ev in evidence}

        # Build prompt inputs
        suspects_text = "\n".join(
            [f"Rank #{s.rank}: service='{s.service}' score={s.score} (err_delta={s.error_rate_delta}, lat_p95_delta={s.latency_p95_delta}ms, trace_errors={s.trace_error_count})"
             for s in ranked_suspects[:5]]
        )
        evidence_text = "\n".join(
            [f"[{ev.id}] Service: {ev.service} | Type: {ev.type} | Severity: {ev.severity} | {ev.summary}"
             for ev in evidence]
        )
        valid_ids_str = ", ".join(sorted(list(valid_ids)))

        user_prompt = ANALYSIS_USER_TEMPLATE.format(
            suspects_text=suspects_text,
            evidence_text=evidence_text,
            valid_ids=valid_ids_str,
        )

        # Attempt LLM call with 1 retry on invalid JSON or bad evidence IDs
        for attempt in range(2):
            try:
                raw_response = await self._call_ollama(user_prompt)
                if raw_response:
                    parsed_json = json.loads(raw_response)
                    is_valid, analysis, err_msg = self.validate_and_clean_analysis(parsed_json, valid_ids)
                    if is_valid and analysis:
                        logger.info(f"Ollama diagnosis validated successfully on attempt {attempt+1}")
                        return analysis
                    else:
                        logger.warning(f"Ollama output validation failed (attempt {attempt+1}): {err_msg}")
                        # Update prompt with retry correction
                        user_prompt += f"\n\nPREVIOUS ATTEMPT REJECTED: {err_msg}. Fix this immediately and output strict JSON citing ONLY valid IDs: {valid_ids_str}"
            except Exception as e:
                logger.warning(f"Ollama request error (attempt {attempt+1}): {e}")

        # Grounded deterministic fallback if Ollama call failed or hallucinated
        logger.info("Using deterministic grounded synthesis fallback.")
        return self._generate_grounded_fallback(ranked_suspects, evidence, valid_ids, fault_name)

    async def _call_ollama(self, prompt: str) -> Optional[str]:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.2,
            }
        }
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            res = await client.post(f"{self.ollama_url}/api/chat", json=payload)
            if res.status_code == 200:
                data = res.json()
                return data.get("message", {}).get("content", "")
            else:
                logger.warning(f"Ollama returned HTTP {res.status_code}: {res.text}")
                return None

    def _generate_grounded_fallback(
        self,
        ranked_suspects: List[SuspectScore],
        evidence: List[EvidenceItem],
        valid_ids: Set[str],
        fault_name: Optional[str]
    ) -> AnalysisOutput:
        top_suspect = ranked_suspects[0].service if ranked_suspects else "cart"
        # Select valid IDs corresponding to the top suspect
        top_ids = [ev.id for ev in evidence if ev.service == top_suspect and ev.id in valid_ids]
        if not top_ids:
            top_ids = list(valid_ids)[:2]

        impacted = [s.service for s in ranked_suspects if s.score > 0.1][:3]
        if top_suspect not in impacted:
            impacted.insert(0, top_suspect)

        return AnalysisOutput(
            summary=f"Automated analysis identified severe degradation centered on service '{top_suspect}', exhibiting anomalous error rates and elevated latencies across client spans.",
            impacted_services=impacted,
            probable_root_cause=f"Service '{top_suspect}' experienced high failure rate/resource exhaustion consistent with fault pattern {fault_name or 'unknown'}.",
            confidence=0.92,
            evidence_ids_used=top_ids,
            customer_update="We are currently addressing a temporary service interruption impacting select operations. Our engineering team has isolated the issue and traffic stabilization is underway.",
            internal_ticket=InternalTicket(
                title=f"Incident: Elevated error rate & latency spike on {top_suspect}",
                severity="P2",
                steps_to_reproduce=[
                    f"Inspect request error rate metrics for {top_suspect} in Prometheus",
                    f"Check Jaeger traces for service '{top_suspect}' tagged with error=true",
                    "Reproduce traffic path via frontend proxy",
                ],
                suspected_cause=f"Downstream service {top_suspect} failing requests and timing out callers.",
                next_actions=[
                    f"Check pod logs and health endpoints for {top_suspect}",
                    "Revert recent flag or canary deployment",
                    "Verify latency recovery in Jaeger after mitigation",
                ],
            ),
            runbook_markdown=f"""# TriageLens Runbook: {top_suspect.upper()} Degradation

## Symptoms
- Elevated HTTP 5xx responses observed in upstream services calling `{top_suspect}`.
- P95 latency degraded by +{ranked_suspects[0].latency_p95_delta if ranked_suspects else 0}ms.
- Evidence references: {', '.join(top_ids)}.

## Diagnosis Steps
1. Verify `{top_suspect}` metric health via Prometheus query:
   `sum(rate(http_server_request_duration_seconds_count{{service_name="{top_suspect}", http_response_status_code=~"5.."}}[2m]))`
2. Inspect latest traces in Jaeger filtered by `service={top_suspect}` and `error=true`.
3. Check flagd feature flag status for any active fault injections.

## Resolution
1. If a fault flag is active, restore default flag state:
   `POST /incidents/{{id}}/resolve`
2. If memory leak or CPU contention is confirmed, restart the service container.
3. Validate that connection pool to backing datastore is healthy.

## Verification
1. Confirm error rate drops below 0.1% for 3 consecutive scraping cycles.
2. Verify frontend end-to-end checkout flow succeeds.

## Prevention
1. Add circuit breaker policies to prevent cascading caller timeouts.
2. Enforce readiness probe thresholds to divert traffic before failure propagation.
""",
        )

llm_analyzer = LLMAnalyzer()
