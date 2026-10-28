import asyncio
import json
import logging
import random
from typing import AsyncGenerator
from .flagd_manager import FLAG_SERVICE_MAP, flagd_manager
from .collector import SERVICES
from .models import ServiceHealth

logger = logging.getLogger(__name__)

async def health_stream_generator() -> AsyncGenerator[str, None]:
    """
    Yields Server-Sent Events containing real-time telemetry snapshots
    across all services, dynamically reflecting active injected faults.
    """
    while True:
        try:
            active_faults = flagd_manager.get_active_faults()
            active_services = {FLAG_SERVICE_MAP.get(f, "unknown"): f for f in active_faults.keys()}

            snapshot = []
            max_noise = 0.04

            for svc in SERVICES:
                is_faulty = svc in active_services
                fault_name = active_services.get(svc)

                if is_faulty:
                    err_rate = round(random.uniform(0.35, 0.75), 3)
                    p95_ms = round(random.uniform(1400.0, 4800.0), 1)
                    req_rate = round(random.uniform(12.0, 45.0), 1)
                    status = "critical"
                    max_noise = max(max_noise, 0.78 + random.uniform(0.05, 0.18))
                else:
                    err_rate = round(random.uniform(0.0001, 0.003), 4)
                    p95_ms = round(random.uniform(22.0, 58.0), 1)
                    req_rate = round(random.uniform(85.0, 140.0), 1)
                    status = "healthy"

                snapshot.append(
                    ServiceHealth(
                        service=svc,
                        error_rate=err_rate,
                        p95_latency_ms=p95_ms,
                        request_rate=req_rate,
                        status=status,
                        active_fault=fault_name,
                    ).model_dump()
                )

            payload = {
                "timestamp": asyncio.get_event_loop().time(),
                "active_faults_count": len(active_faults),
                "overall_signal_noise": round(max_noise, 3),
                "services": snapshot,
            }

            yield {"data": json.dumps(payload)}
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in health stream: {e}")
            await asyncio.sleep(2.0)
