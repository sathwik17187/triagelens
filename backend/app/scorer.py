import logging
from typing import Dict, List
from .models import EvidenceItem, SuspectScore

logger = logging.getLogger(__name__)

class DeterministicScorer:
    """
    Transparent deterministic ranking engine that computes suspect scores
    from error rate deltas, latency deltas, error trace counts, and log anomalies.
    """
    def __init__(
        self,
        weight_error_rate: float = 0.40,
        weight_latency: float = 0.30,
        weight_trace: float = 0.15,
        weight_log: float = 0.15,
    ):
        self.w_err = weight_error_rate
        self.w_lat = weight_latency
        self.w_trc = weight_trace
        self.w_log = weight_log

    def rank_suspects(
        self,
        service_deltas: Dict[str, Dict[str, float]],
        evidence: List[EvidenceItem],
    ) -> List[SuspectScore]:
        # Associate evidence IDs with services
        service_evidence_map: Dict[str, List[str]] = {}
        for ev in evidence:
            svc = ev.service
            if svc not in service_evidence_map:
                service_evidence_map[svc] = []
            service_evidence_map[svc].append(ev.id)

        # Find max deltas for normalization
        max_err = max((d.get("error_rate_delta", 0.0) for d in service_deltas.values()), default=1.0)
        max_err = max(max_err, 0.001)

        max_lat = max((d.get("latency_p95_delta", 0.0) for d in service_deltas.values()), default=1.0)
        max_lat = max(max_lat, 10.0)

        suspects: List[SuspectScore] = []

        for svc, d in service_deltas.items():
            err_delta = float(d.get("error_rate_delta", 0.0))
            lat_delta = float(d.get("latency_p95_delta", 0.0))
            trace_errs = int(d.get("error_traces", 0))
            log_errs = int(d.get("error_logs", 0))

            norm_err = min(max(err_delta / max_err, 0.0), 1.0) if max_err > 0 else 0.0
            norm_lat = min(max(lat_delta / max_lat, 0.0), 1.0) if max_lat > 0 else 0.0
            norm_trc = min(trace_errs / 20.0, 1.0)
            norm_log = min(log_errs / 30.0, 1.0)

            # Combined transparent weighted score
            score = (
                self.w_err * norm_err +
                self.w_lat * norm_lat +
                self.w_trc * norm_trc +
                self.w_log * norm_log
            )

            # Round score to 3 decimals
            score = round(score, 3)

            suspects.append(
                SuspectScore(
                    service=svc,
                    score=score,
                    rank=0,  # assigned after sorting
                    error_rate_delta=round(err_delta, 4),
                    latency_p95_delta=round(lat_delta, 1),
                    trace_error_count=trace_errs,
                    log_error_count=log_errs,
                    evidence_ids=service_evidence_map.get(svc, []),
                )
            )

        # Sort descending by score, tiebreak with error_rate_delta then latency_p95_delta
        suspects.sort(key=lambda s: (s.score, s.error_rate_delta, s.latency_p95_delta), reverse=True)

        # Assign ranks
        for idx, item in enumerate(suspects, start=1):
            item.rank = idx

        return suspects

deterministic_scorer = DeterministicScorer()

