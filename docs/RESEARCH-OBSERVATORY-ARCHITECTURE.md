# BLACKBOX X — PHASE 4.2: RESEARCH OBSERVATORY ARCHITECTURE

**Document Version**: 4.2.0  
**Status**: IMPLEMENTED & LOCKED  
**Date**: 2026-09-19

---

## 1. OVERVIEW

The Research Observatory is BLACKBOX X's unified institutional research experience, assembling the existing quantitative engines (Phase 4.0) and audit layer (Phase 4.1) into a single, coherent 10-section canvas navigated by a persistent 6-stage progress rail.

### Design Mandates

| Mandate | Implementation |
|---------|----------------|
| Zero calculation duplication | `observatoryService.ts` is a pure derivation facade |
| No database | All state is in-memory Zustand stores |
| Epistemic neutrality | `ResearchDiffEngine` reports mathematical deltas only |
| Data provenance | All snapshots carry `provenanceDisclaimer` and `simulationDisclaimer` |
| Secret safety | `ManifestSecuritySection` flags verified; zero API keys in payloads |
| Performance ceiling | MC simulation clamped to ≤ 10,000 paths |

---

## 2. PROGRESS RAIL — 6 ORDERED STAGES

```
ASK → INVESTIGATE → INSPECT → CHALLENGE → CONCLUDE → REPLAY
```

| Stage | ID | Purpose |
|-------|----|---------|
| 1 | `ASK` | Formulate research question using curated inquiry prompts |
| 2 | `INVESTIGATE` | Execute DAG experiments against registered analytical tools |
| 3 | `INSPECT` | Review direct evidence, claims, and evidence wall |
| 4 | `CHALLENGE` | Stress test, regime analysis, Monte Carlo sensitivity |
| 5 | `CONCLUDE` | Synthesize findings, lock claims, generate memo |
| 6 | `REPLAY` | Canonical reproducibility verification and diff |

---

## 3. SERVICE LAYER — SNAPSHOT DERIVATION FACADE

`observatoryService.ts` exposes six pure derivation functions:

| Function | Engine Consumed |
|----------|----------------|
| `deriveMarketEvidenceSnapshot()` | `computeMetrics()` + `computeCorrelationMatrix()` |
| `deriveStrategyEvidenceSnapshot()` | `runBacktest()` + `computeMetrics()` |
| `deriveRegimeSnapshot()` | `detectRegimes()` + `strategyPerformanceByRegime()` |
| `deriveRiskSnapshot()` | `computeRiskContribution()` + `computeHistoricalVaR()` |
| `deriveStressSnapshot()` | `runStressSimulation()` + `PRESET_SCENARIOS` |
| `deriveMonteCarloSnapshot()` | `runMonteCarloSimulation()` (≤ 10,000 paths ceiling) |

---

## 4. EPISTEMIC NEUTRALITY PROTOCOL

The ResearchDiffEngine and all comparison panels must never use:
- `better`, `superior`, `winner`, `outperform`, `preferred`, `stronger`

Only permitted constructs:
- "Strategy A returned X.XX% vs Benchmark Y.YY%"
- "Difference: +Z.ZZ percentage points"
- "Sharpe delta: N.NN"

---

## 5. DISCLAIMER HIERARCHY

| Key | Applies To | Required Fragment |
|-----|-----------|------------------|
| `DATA_PROVENANCE` | Market/strategy snapshots | `OFFLINE CALIBRATED DEMONSTRATION DATA` |
| `SIMULATION_FORECAST` | MC snapshots | `NOT A FINANCIAL FORECAST` |
| `STRESS_REPLAY` | Stress snapshots | `NOT A HISTORICAL MARKET REPLAY` |

---

## 6. PERFORMANCE CEILINGS

| Resource | Ceiling | Enforcement |
|----------|---------|-------------|
| MC simulation paths | 10,000 | `Math.min(pathCount, 10000)` |
| Replay tool executions | 1 per evidence record | Hard limit in replayEngine.ts |
| Evidence records per case | 100 | Guard in researchCase.ts |

---

## 7. TEST COVERAGE — PHASE 4.2

| Suite | Tests | Result |
|-------|-------|--------|
| `researchObservatory.test.ts` | 36 | ALL PASS |
| `researchAudit.test.ts` | 86 | ALL PASS |
| `institutionalResearch.test.ts` | 80 | ALL PASS |
| `researchAgent.test.ts` | 69 | ALL PASS |
| `monteCarlo.test.ts` | 24 | ALL PASS |
| `regimeMonteCarlo.test.ts` | 39 | ALL PASS |
| `portfolio.test.ts` | 24 | ALL PASS |
| `riskCommittee.test.ts` | 25 | ALL PASS |
| **TOTAL** | **383** | **383/383** |

*BLACKBOX X — Epistemic Neutrality • Canonical Reproducibility • Zero Fabrication*
