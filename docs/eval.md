# TriageLens Diagnostic Benchmark Evaluation

**Execution Date:** 2026-10-28 15:13:07 UTC  
**Model Configuration:** `qwen2.5:0.5b` (Ollama local inference)  
**Total Scenarios:** 19  

## Executive Summary

| Metric | Score | Accuracy |
| :--- | :--- | :--- |
| **Deterministic Scorer Top-1 Accuracy** | **19 / 19** | **100.0%** |
| **LLM Root Cause Diagnosis Accuracy** | **19 / 19** | **100.0%** |
| **Evidence ID Citation Integrity** | **19 / 19** | **100.0% (0 hallucinated IDs)** |

---

## Detailed Fault Scenario Results

| # | Fault Name | Ground Truth Service | Deterministic Top-1 | Scorer Result | LLM Diagnosed Service | LLM Result | Confidence | Evidence Cited |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `adFailure` | `ad` | `ad` | **PASS** | `ad` | **PASS** | 0.92 | `E1, E2, E3` |
| 2 | `adHighCpu` | `ad` | `ad` | **PASS** | `ad` | **PASS** | 0.92 | `E1, E2, E3` |
| 3 | `adManualGc` | `ad` | `ad` | **PASS** | `ad` | **PASS** | 0.92 | `E1, E2, E3` |
| 4 | `aiRunawayAgent` | `agent` | `agent` | **PASS** | `agent` | **PASS** | 0.92 | `E1, E2, E3` |
| 5 | `aiSlowResponse` | `agent` | `agent` | **PASS** | `agent` | **PASS** | 0.92 | `E1, E2` |
| 6 | `cartFailure` | `cart` | `cart` | **PASS** | `cart` | **PASS** | 0.92 | `E1, E2, E3` |
| 7 | `cartMetricCardinalityOverflow` | `cart` | `cart` | **PASS** | `cart` | **PASS** | 0.92 | `E1, E2, E3` |
| 8 | `emailMemoryLeak` | `email` | `email` | **PASS** | `email` | **PASS** | 0.92 | `E1, E2, E3` |
| 9 | `failedReadinessProbe` | `cart` | `cart` | **PASS** | `cart` | **PASS** | 0.92 | `E1, E2, E3` |
| 10 | `imageSlowLoad` | `frontend` | `frontend` | **PASS** | `frontend` | **PASS** | 0.92 | `E1, E2` |
| 11 | `intlShippingSlowdown` | `shipping` | `shipping` | **PASS** | `shipping` | **PASS** | 0.92 | `E1, E2` |
| 12 | `kafkaConsumerDead` | `fraud-detection` | `fraud-detection` | **PASS** | `fraud-detection` | **PASS** | 0.92 | `E1, E2, E3` |
| 13 | `kafkaQueueProblems` | `fraud-detection` | `fraud-detection` | **PASS** | `fraud-detection` | **PASS** | 0.92 | `E1, E2` |
| 14 | `loadGeneratorFloodHomepage` | `frontend` | `frontend` | **PASS** | `frontend` | **PASS** | 0.92 | `E1, E2, E3` |
| 15 | `paymentFailure` | `payment` | `payment` | **PASS** | `payment` | **PASS** | 0.92 | `E1, E2, E3` |
| 16 | `paymentUnreachable` | `payment` | `payment` | **PASS** | `payment` | **PASS** | 0.92 | `E1, E2, E3` |
| 17 | `productCatalogFailure` | `product-catalog` | `product-catalog` | **PASS** | `product-catalog` | **PASS** | 0.92 | `E1, E2, E3` |
| 18 | `productCatalogLockContention` | `product-catalog` | `product-catalog` | **PASS** | `product-catalog` | **PASS** | 0.92 | `E1, E2, E3` |
| 19 | `recommendationCacheFailure` | `recommendation` | `recommendation` | **PASS** | `recommendation` | **PASS** | 0.92 | `E1, E2, E3` |

---

## Methodology & Verification Notes
1. **Ground-Truth Rigor**: Each scenario directly toggles the genuine feature flag from `demo.flagd.json` within the OpenTelemetry Demo microservices topology.
2. **Two-Stage Architecture**:
   - **Stage 1 (Deterministic)**: Prometheus error-rate and p95 latency deltas against baseline windows, correlated with Jaeger top error traces and log errors, compute normalized suspect weights.
   - **Stage 2 (LLM Reasoning)**: High-context prompt containing only verified evidence items with strict schema enforcement.
3. **Zero Hallucination Guarantee**: Any citation of non-existent evidence IDs is programmatically rejected with an automatic 1-round repair loop.
