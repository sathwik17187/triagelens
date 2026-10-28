import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from .models import Fault
from .config import settings

logger = logging.getLogger(__name__)

# Ground truth mapping based on the real flag names and services in OpenTelemetry Demo
FLAG_SERVICE_MAP = {
    "adFailure": "ad",
    "adHighCpu": "ad",
    "adManualGc": "ad",
    "aiRunawayAgent": "agent",
    "aiSlowResponse": "agent",
    "cartFailure": "cart",
    "cartMetricCardinalityOverflow": "cart",
    "emailMemoryLeak": "email",
    "failedReadinessProbe": "cart",
    "imageSlowLoad": "frontend",
    "intlShippingSlowdown": "shipping",
    "kafkaConsumerDead": "fraud-detection",
    "kafkaQueueProblems": "fraud-detection",
    "loadGeneratorFloodHomepage": "frontend",
    "paymentFailure": "payment",
    "paymentUnreachable": "payment",
    "productCatalogFailure": "product-catalog",
    "productCatalogLockContention": "product-catalog",
    "recommendationCacheFailure": "recommendation",
}

DEFAULT_ACTIVE_VARIANTS = {
    "adFailure": "on",
    "adHighCpu": "on",
    "adManualGc": "on",
    "aiRunawayAgent": "on",
    "aiSlowResponse": "5sec",
    "cartFailure": "50%",
    "cartMetricCardinalityOverflow": "on",
    "emailMemoryLeak": "100x",
    "failedReadinessProbe": "on",
    "imageSlowLoad": "5sec",
    "intlShippingSlowdown": "5sec",
    "kafkaConsumerDead": "on",
    "kafkaQueueProblems": "3sec",
    "loadGeneratorFloodHomepage": "on",
    "paymentFailure": "50%",
    "paymentUnreachable": "on",
    "productCatalogFailure": "on",
    "productCatalogLockContention": "on",
    "recommendationCacheFailure": "on",
}

class FlagdManager:
    def __init__(self, file_path: Optional[str] = None):
        self.file_path = Path(file_path or settings.flagd_file_path)
        self.cached_raw: Dict[str, Any] = {}
        self.active_faults: Dict[str, str] = {}  # fault_name -> variant
        self._load_flags()

    def _load_flags(self) -> Dict[str, Any]:
        if not self.file_path.exists():
            logger.warning(f"Flag file not found at {self.file_path}, using fallback defaults.")
            self.cached_raw = {"flags": {}}
            return self.cached_raw

        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                self.cached_raw = json.load(f)
        except Exception as e:
            logger.error(f"Error loading flagd file: {e}")
            if not self.cached_raw:
                self.cached_raw = {"flags": {}}
        return self.cached_raw

    def _save_flags(self) -> bool:
        if not self.file_path.parent.exists():
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(self.cached_raw, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error writing flagd file: {e}")
            return False

    def list_faults(self) -> List[Fault]:
        raw = self._load_flags()
        flags = raw.get("flags", {})
        faults: List[Fault] = []

        for name, data in flags.items():
            # Skip non-fault flags if any (e.g. emitRawPii is marked not a failure scenario)
            description = data.get("description", "")
            variants = data.get("variants", {})
            default_variant = data.get("defaultVariant", "off")
            state = data.get("state", "ENABLED")
            target_service = FLAG_SERVICE_MAP.get(name, "unknown")

            # Determine chosen active variant
            active_variant = DEFAULT_ACTIVE_VARIANTS.get(name, "on")
            if active_variant not in variants:
                # choose the first variant that is not off
                non_off = [k for k in variants.keys() if k != "off"]
                active_variant = non_off[0] if non_off else "on"

            is_active = (name in self.active_faults) or (default_variant != "off")

            faults.append(
                Fault(
                    name=name,
                    description=description,
                    target_service=target_service,
                    default_variant=default_variant,
                    active_variant=active_variant,
                    state=state,
                    is_active=is_active,
                    variants=variants,
                )
            )
        return sorted(faults, key=lambda f: f.name)

    def get_ground_truth(self, fault_name: str) -> str:
        return FLAG_SERVICE_MAP.get(fault_name, "unknown")

    def set_fault(self, fault_name: str, enable: bool, variant: Optional[str] = None) -> bool:
        self._load_flags()
        flags = self.cached_raw.get("flags", {})
        if fault_name not in flags:
            logger.warning(f"Flag {fault_name} not found in flag config")
            # We still record in active_faults for mock/simulated run
            if enable:
                self.active_faults[fault_name] = variant or DEFAULT_ACTIVE_VARIANTS.get(fault_name, "on")
            else:
                self.active_faults.pop(fault_name, None)
            return False

        flag_data = flags[fault_name]
        if enable:
            target_variant = variant or DEFAULT_ACTIVE_VARIANTS.get(fault_name, "on")
            if target_variant not in flag_data.get("variants", {}):
                non_off = [k for k in flag_data.get("variants", {}).keys() if k != "off"]
                target_variant = non_off[0] if non_off else "on"
            flag_data["defaultVariant"] = target_variant
            self.active_faults[fault_name] = target_variant
        else:
            flag_data["defaultVariant"] = "off"
            self.active_faults.pop(fault_name, None)

        return self._save_flags()

    def get_active_faults(self) -> Dict[str, str]:
        return dict(self.active_faults)

flagd_manager = FlagdManager()

