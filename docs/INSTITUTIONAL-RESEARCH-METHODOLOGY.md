# BLACKBOX X — PHASE 4.0
## INSTITUTIONAL RESEARCH WORKSPACE METHODOLOGY
### End-to-End Orchestration, Evidence Graph, Contradiction Engine, and Verifiable Research Memos

---

## 1. Philosophical Framing & Core Invariants

Phase 4.0 transforms BLACKBOX X from a collection of isolated quantitative engines into an integrated **Institutional Quantitative Research Workspace**.

### 1.1 The Orchestration Layer Invariant
Phase 4.0 is strictly an **orchestration, evidentiary tracking, and synthesis layer**:
- **Zero Calculation Duplication**: The orchestration layer contains zero financial calculation algorithms, return equations, covariance estimators, or Monte Carlo generators.
- **Source of Truth**: Computational engines developed in Phases 1 through 3.9 remain the sole source of quantitative truth.
- **AI Role Boundaries**: The LLM operates strictly as an inquiry planner, hypothesis formulator, and evidence interpreter. The AI **never** calculates metrics, invents probabilities, or overrides engine outputs.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 INSTITUTIONAL QUANTITATIVE RESEARCH LIFECYCLE               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Natural Language Research Question                                       │
│    "Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?"        │
│          │                                                                  │
│          ▼                                                                  │
│ 2. Falsifiable Hypotheses Formulation                                       │
│    H1: Regime Drag • H2: Execution Friction • H3: Parameter Fragility       │
│          │                                                                  │
│          ▼                                                                  │
│ 3. Deterministic Experiment Plan (Bounded DAG, Max 8 runs)                  │
│          │                                                                  │
│          ▼                                                                  │
│ 4. Deterministic Tool Execution & Direct Evidence Extraction                │
│    [Direct Evidence: Factual Numbers] vs. [Interpretation: Analytical]      │
│          │                                                                  │
│          ▼                                                                  │
│ 5. Contradiction Engine & Counterfactual Audit                              │
│          │                                                                  │
│          ▼                                                                  │
│ 6. Bounded Secondary Hypothesis Testing (Max 2 sweeps)                      │
│          │                                                                  │
│          ▼                                                                  │
│ 7. Neutral Research Synthesis & Claim Binding                               │
│    Every quantitative claim strictly references verified EvidenceRecord IDs │
│          │                                                                  │
│          ▼                                                                  │
│ 8. Audit-Bound Reproducible Research Memo (15 Sections)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Research Session Data Contract & State Machine

A research investigation is captured in an immutable, serializable `ResearchSession`:

```typescript
export interface ResearchSession {
  sessionId: string;
  researchQuestion: string;
  createdAt: number;
  updatedAt: number;
  status: ResearchSessionStatus;
  configurationFingerprint: string;
  datasetFingerprint: string;
  experimentIds: string[];
  hypothesisIds: string[];
  evidenceIds: string[];
  contradictionIds: string[];
  synthesis?: ResearchSynthesis;
  limitations: string[];
  nextTests: string[];
  provenance: SessionProvenance;
  errorMessage?: string;
}
```

### 2.1 State Transitions
The platform enforces explicit transition validation:
- **Primary Flow**: `DRAFT` $\to$ `PLANNING` $\to$ `RUNNING` $\to$ `ANALYZING` $\to$ `CONTRADICTION_CHECK` $\to$ `SYNTHESIZING` $\to$ `COMPLETE`.
- **Conditional Branch**: `CONTRADICTION_CHECK` $\to$ `SECONDARY_TEST` $\to$ `ANALYZING` $\to$ `CONTRADICTION_CHECK`.
- **Failure / Cancellation**: Any active state $\to$ `FAILED`. Cancellation never deletes collected evidence.

---

## 3. Falsifiable Hypothesis Model

Every hypothesis is empirical, testable, and falsifiable:
- **Categories**: `REGIME_SENSITIVITY`, `EXECUTION_FRICTION`, `VOLATILITY_DRAG`, `STRUCTURAL_DECOUPLING`, `PARAMETER_OVERFITTING`, `PORTFOLIO_CONCENTRATION`, `TAIL_RISK_ASYMMETRY`.
- **Confidence Ratings**: Strictly categorical (`HIGH_EVIDENCE`, `MODERATE_EVIDENCE`, `LIMITED_EVIDENCE`, `INCONCLUSIVE`). Speculative percentage confidences (e.g. *"88% confident"*) are prohibited.
- **Criteria**: Each hypothesis explicitly states expected quantitative confirming criteria and disconfirming thresholds.

---

## 4. Bounded Experiment Plan (DAG)

- **Ceilings**:
  - Maximum 8 experiments per session.
  - Maximum 2 secondary tests.
  - Maximum 10,000 Monte Carlo paths.
  - 60-second execution timeout.
- **Idempotency**: An experiment fingerprint is computed from `(toolName, canonicalArgs, dataWindow, seed)`. Identical experiments return cached evidence without re-executing.

---

## 5. Central Quantitative Tool Registry (Allowlist)

All tool executions are validated against the 16 registered tool families:
1. `get_asset_metrics` (LIGHTWEIGHT)
2. `get_strategy_metrics` (LIGHTWEIGHT)
3. `get_benchmark_metrics` (LIGHTWEIGHT)
4. `get_regime_performance` (LIGHTWEIGHT)
5. `get_drawdown_analysis` (LIGHTWEIGHT)
6. `get_correlation_matrix` (LIGHTWEIGHT)
7. `get_rolling_correlation` (LIGHTWEIGHT)
8. `get_robustness_analysis` (MEDIUM)
9. `get_stress_result` (LIGHTWEIGHT)
10. `get_strategy_genome` (LIGHTWEIGHT)
11. `get_research_trail` (LIGHTWEIGHT)
12. `get_risk_brief` (LIGHTWEIGHT)
13. `get_portfolio_metrics` (LIGHTWEIGHT)
14. `get_portfolio_optimization` (MEDIUM)
15. `get_monte_carlo_risk` (HEAVY_WORKER)
16. `get_regime_monte_carlo_risk` (HEAVY_WORKER)

Arbitrary tool names, dynamic functions, or unauthorized scripts are rejected at schema validation.

---

## 6. Evidence Architecture & Strict Separation Contract

Every successful tool execution produces an immutable `EvidenceRecord`:
- **Direct Evidence**: Factual quantitative observations (e.g. *"Strategy total return was 321.57% with -20.76% max drawdown"*). Zero conjecture, zero speculative causation.
- **Interpretation**: Analytical deduction (e.g. *"Active strategy experienced substantial drawdown friction over the window"*).
- **Invariance Rule**: Direct evidence and interpretation cannot be identical.

---

## 7. Structured Numerical Claims & Binding Safeguard

To eliminate hallucinated metrics, the system avoids regex parsing over AI prose and implements structured `ResearchClaim` records:
- **Rule**: Every quantitative figure in the final Research Memo must originate from a `ResearchClaim` whose `evidenceIds` map to verified `EvidenceRecords`.
- **Validation**: Any ungrounded numeric claim halts report assembly with `UNBOUND_NUMERICAL_ASSERTION_ERROR`.

---

## 8. Evidence Graph (DAG Topology)

- **Nodes**: `QUESTION`, `HYPOTHESIS`, `EXPERIMENT`, `EVIDENCE`, `CONTRADICTION`, `SECONDARY_TEST`, `SYNTHESIS`.
- **Edges**: `DERIVED_FROM`, `TESTS`, `SUPPORTS`, `CONTRADICTS`, `REFINES`, `DEPENDS_ON`.
- **Acyclicity**: Validated via Kahn's algorithm; cycles are strictly blocked.
- **Non-Causality Invariant**: Edges denote evidentiary links; graph connectivity does **not** assert real-world causality.

---

## 9. Contradiction Engine & Counterfactual Audit

- Actively searches for evidence disconfirming each hypothesis.
- Example: If hypothesis states "Fees caused strategy underperformance", a zero-fee backtest is evaluated. If underperformance persists at 0 bps friction, the hypothesis is flagged as `CONTRADICTED`.

---

## 10. Causality Language Safeguard

All synthesized outputs adhere to strict epistemic language compliance:
- Non-Compliant: *"High volatility caused the collapse."*
- Institutional Compliance: *"Drawdown was elevated during periods classified as High Volatility."*
- Non-Compliant: *"Fees destroyed alpha."*
- Institutional Compliance: *"Removing transaction costs increased return by 14.19 percentage points."*

---

## 11. Reproducibility Contract & Provenance Audit

Bit-level reproducibility contract:
$$\text{Same Engine} + \text{Same Dataset} + \text{Same Configuration} + \text{Same Seed} \Longrightarrow \text{Deterministic Equivalent Output}$$
Audit fingerprint:
$$\text{SHA-256}\Big(\text{Question} \;\parallel\; \text{DatasetHash} \;\parallel\; \text{SortedExpIDs} \;\parallel\; \text{SortedHypIDs} \;\parallel\; \text{Seed}\Big)$$

---

## 12. Institutional Research Memo (15 Sections)

1. Research Question
2. Executive Observation
3. Hypotheses & Confidence Ratings
4. Experiment Plan Summary
5. Direct Quantitative Evidence `[EV-xxx]`
6. Contradictions & Counterfactual Audit
7. Secondary Testing Findings
8. Quantitative Findings & Structured Claims `[CLM-xxx]`
9. Risk & Regime Interpretation
10. Robustness & Assumption Sensitivity
11. Methodological Limitations
12. Recommended Next Research Tests
13. Quantitative Methodology
14. Provenance & Reproducibility Audit
15. Regulatory & Non-Investment Advice Disclaimer

---

## 13. Regulatory Non-Advice Standard

The Institutional Research Workspace is an analytical research platform. It does not provide investment, financial, or trading recommendations. All metrics and simulations reflect historical demonstration data and do not guarantee future market behavior.
