# BLACKBOX X — PHASE 4.1
## RESEARCH REPRODUCIBILITY & DECISION AUDIT METHODOLOGY
### Canonical-Output Reproducibility, Metric-Specific Tolerances, Precedence-Ordered Mismatch Taxonomy, and Bidirectional Provenance Lineage

---

## 1. Executive Summary & Core Philosophical Invariant

Phase 4.1 establishes an institutional **Research Reproducibility & Decision Audit Layer** directly on top of the Phase 4.0 Institutional Research Workspace in BLACKBOX X.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4.1 AUDIT & REPRODUCIBILITY STACK                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Research Question                                                           │
│        │                                                                    │
│        ▼                                                                    │
│ Research Case (Immutable, Sealed via DeepFreeze, BBX-CASE-YYYY-XXXX)        │
│        │                                                                    │
│        ▼                                                                    │
│ Research Manifest (Complete 7-Section Machine-Readable Contract)            │
│        │                                                                    │
│        ▼                                                                    │
│ Reproducibility Fingerprint (Canonical Serialized SHA-256)                  │
│        │                                                                    │
│        ▼                                                                    │
│ Replay Engine (Tool Registry Allowlist Execution Only, Sandbox Guarded)     │
│        │                                                                    │
│        ▼                                                                    │
│ Replay Verification (6-Tier Audit: Config, Data, Plan, Evidence, Claims)    │
│        │                                                                    │
│        ▼                                                                    │
│ Mismatch Evaluator (10-Category Precedence Ranking Taxonomy)                │
│        │                                                                    │
│        ▼                                                                    │
│ Provenance & Lineage (Bidirectional Claim ↔ Evidence ↔ Fingerprint Graph)   │
│        │                                                                    │
│        ▼                                                                    │
│ Research Diff Engine (Neutral Comparative Deltas, Epistemic Neutrality)     │
│        │                                                                    │
│        ▼                                                                    │
│ Auditable Case File (17-Section Institutional Export: MD, JSON, Print)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Invariant Core
1. **Auditing & Orchestration Only**: Phase 4.1 is strictly an audit, replay, and reproducibility verification layer. It contains zero financial simulation algorithms, return formulas, or numerical models. Quantitative engines from Phases 1–3.9 remain the single source of financial truth.
2. **Canonical-Output Reproducibility**: The platform asserts canonical reproducibility rather than universal bit-for-bit hardware identity:
   $$\text{Same Engine} + \text{Same Data} + \text{Same Params} + \text{Same Seed} + \text{Same Numerical Contract} + \text{Same Canonical Serialization} = \text{Identical Output Fingerprint}$$
3. **Strict Epistemic Neutrality**: Comparison operations report empirical differences, absolute deltas, and relative shifts without evaluative or promotional bias. Adjectives such as *better*, *worse*, *winner*, *superior*, or *inferior* are strictly prohibited by code contract.

---

## 2. Canonical Reproducibility & Numerical Comparison

### 2.1 Three Comparison Classes

| Comparison Class | Scope & Applied Entities | Decision Rule |
| :--- | :--- | :--- |
| **`EXACT`** | Identifiers, tool names, asset tickers, regime labels, data observation counts, seed integer | String/integer bit-for-bit equality ($A === B$) |
| **`CANONICAL_EXACT`** | Serialized configuration structures, JSON manifests, event hashes, checksums | Lexicographically sorted keys, 8-decimal normalized floats, non-finite token replacement (`"NaN"`, `"Infinity"`), SHA-256 hash |
| **`NUMERICAL_TOLERANCE`** | Continuous floating-point financial metrics (returns, volatilities, Sharpe ratios, drawdowns, risk weights) | Absolute difference must satisfy $|A - B| \le \epsilon_{\text{metric}}$ |

### 2.2 Metric-Specific Tolerance Matrix

Universal single-epsilon tolerances ($\epsilon = 10^{-6}$) are rejected as scientifically unsound for financial research. BLACKBOX X enforces domain-specific tolerance budgets calibrated to the numerical sensitivity of each analytical discipline:

| Metric Category | Target Financial Metrics | Tolerance ($\epsilon$) | Justification & Numerical Rationale |
| :--- | :--- | :--- | :--- |
| **Simplex Weights** | Portfolio allocations ($w_i$) | $\le 10^{-6}$ | Sum-to-one simplex constraints in quadratic programming solvers. |
| **Cumulative Returns** | Strategy return, Benchmark return | $\le 10^{-6}$ | Compounding precision across daily discrete return series. |
| **Volatilities** | Annualized $\sigma$, downside deviation | $\le 10^{-6}$ | Standard deviation computation over fixed discrete sample. |
| **Correlations** | Pearson pairwise matrix ($\rho_{ij}$) | $\le 10^{-4}$ | Normalization denominator sensitivity in near-collinear covariance matrices. |
| **Risk Ratios** | Sharpe, Sortino, Calmar, Information | $\le 10^{-4}$ | Annualization scaling ($\sqrt{252}$) and division by low volatility values. |
| **Drawdowns** | Max DD %, Average DD %, Duration | $\le 10^{-5}$ | High-water mark step function discrete tracking. |
| **Monte Carlo Quantiles** | VaR 95/99, Expected Shortfall (CVaR) | $\le 10^{-4}$ | Bounded empirical quantile interpolation across $10^4$ simulation paths. |
| **Euler Allocations** | Marginal and percentage risk contributions | $\le 10^{-5}$ | First-order partial derivative numerical approximations. |
| **Regime Transitions** | Transition matrix probabilities ($P_{ij}$) | $\le 10^{-5}$ | Discrete empirical state counting and Markov transition frequencies. |

---

## 3. Ten-Tier Replay Mismatch Taxonomy & Precedence Hierarchy

Replay discrepancies are never collapsed into generic "Replay Failed" error strings. BLACKBOX X categorizes divergences into 10 structured, precedence-ordered failure types:

```
Rank 1:  SCHEMA_MISMATCH          ── Highest Precedence: Structural manifest invalidity
Rank 2:  VERSION_MISMATCH         ── Engine or methodology breaking semver shift
Rank 3:  TOOL_UNAVAILABLE         ── Missing registered tool in execution environment
Rank 4:  CONFIGURATION_MISMATCH    ── Parameter, friction, or seed drift
Rank 5:  DATA_MISMATCH             ── Start date, end date, or bar count mismatch
Rank 6:  NUMERICAL_MISMATCH        ── Metric exceeded domain tolerance budget
Rank 7:  EVIDENCE_MISMATCH         ── Evidence count or schema discrepancy
Rank 8:  CLAIM_MISMATCH            ── Numerical claim unbound or unsupported
Rank 9:  SYNTHESIS_MISMATCH        ── Structural claim synthesis divergence
Rank 10: REPLAY_FAILURE            ── Lowest Precedence: Worker crash or runtime exception
```

### Precedence Resolution Algorithm
When multiple divergences occur concurrently during replay (e.g. changing transaction costs causes numerical metric shifts), the verifier computes all mismatch codes but systematically attributes the **Primary Mismatch** to the root cause using the lowest numerical rank ($1 \to 10$). A configuration change is correctly diagnosed as `CONFIGURATION_MISMATCH` (Rank 4) rather than `NUMERICAL_MISMATCH` (Rank 6).

---

## 4. Replay Lifecycle & Verification Workflow

### 4.1 State Machine

```
[SEALED CASE]
      │
      ▼
[REPLAY ENGINE] ── Pre-execution check (schema, version, tool allowlist)
      │
      ├── (Incompatible SemVer) ──► [INCOMPATIBLE]
      ├── (Worker/Runtime Fault) ──► [FAILED]
      │
      ▼
[REGISTERED TOOL EXECUTION] ── (Max 10,000 paths, Mulberry32 PRNG seed)
      │
      ▼
[6-TIER VERIFICATION AUDIT]
  ├── Tier 1: Configuration Audit (EXACT)
  ├── Tier 2: Data Window Audit (EXACT)
  ├── Tier 3: Experiment Plan Audit (EXACT)
  ├── Tier 4: Evidence Records Audit (TOLERANCE)
  ├── Tier 5: Research Claims Audit (BINDING)
  └── Tier 6: Synthesis Audit (STRUCTURAL)
      │
      ├── (All Tiers Pass & Fingerprints Match) ──► [MATCHED]
      └── (Any Tier Fails or Tolerance Exceeded) ──► [MISMATCHED]
```

### 4.2 Replay Execution Safeguards
- **Tool Allowlist Validation**: The replay engine executes exclusively tools registered in `ResearchToolRegistry`. Direct string evaluation (`eval`, `new Function`) is prohibited by design.
- **Simulation Limits**: Monte Carlo simulation paths are hard-capped at 10,000 iterations during replay to prevent resource starvation.
- **Worker Isolation**: Replays reuse the existing Web Worker architecture for computationally intensive simulations without leaking memory.

---

## 5. Evidence Lineage & Claim Inspector

### 5.1 Bidirectional Provenance Graph
Evidence lineage is strictly a **provenance and derivation relationship**, explicitly distinguished from causal assertions:

$$\text{Claim} \longleftrightarrow \text{Evidence} \longleftrightarrow \text{Experiment} \longleftrightarrow \text{Tool} \longleftrightarrow \text{Arguments} \longleftrightarrow \text{Data Window} \longleftrightarrow \text{Engine Version} \longleftrightarrow \text{Fingerprint}$$

- **Backward Traversal**: Enables researchers to select any numerical claim in the Research Memo and unroll its complete audit chain down to the deterministic fingerprint.
- **Forward Traversal**: Enables researchers to select an analytical tool or experiment and inspect every downstream conclusion and claim that depends on its output.

### 5.2 Direct Evidence vs. Interpretation Boundary
The Claim Inspector enforces a strict separation between empirical observations and analytical interpretations:
- **Direct Evidence**: Factual numerical outputs emitted by verified quantitative engines (e.g. `Strategy Sharpe: 0.94, Max Drawdown: -31.2%`).
- **Analytical Interpretation**: Contextual reasoning framed by hypotheses (e.g. `Strategy suffered significant performance drag during high volatility regimes`).
- **Ungrounded Claim Rule**: Any quantitative claim lacking an associated `EvidenceRecord` ID triggers an immediate `CLAIM_MISMATCH` failure.

---

## 6. Research Diff Engine & Epistemic Neutrality

The `ResearchDiffEngine` performs side-by-side comparative analysis of two `ResearchCase` instances across 12 analytical dimensions:
1. Setup & Inquiry
2. Asset Universe
3. Data Window & Bar Count
4. Strategy & Parameters
5. Transaction Friction
6. Portfolio Target Allocations
7. Simulation Configuration
8. Regime Specifications
9. Hypotheses & Statuses
10. Evidence Records & Deltas
11. Bound Research Claims
12. Reproducibility Status & Verification Counts

### Mathematical Deltas
For all numeric dimensions, the diff engine computes:
- $\Delta_{\text{abs}} = V_B - V_A$
- $\Delta_{\text{rel}} = \frac{V_B - V_A}{|V_A|} \times 100\%$ (when $V_A \neq 0$)
- Directional indicator: `INCREASE`, `DECREASE`, or `UNCHANGED`

### The Neutrality Guarantee
The diff engine strictly refrains from making value judgments. Asserting that a higher Sharpe ratio or lower drawdown is "better" or "superior" is forbidden; the engine solely reports empirical deltas.

---

## 7. Audit Timeline & Tamper-Evident Ledger

All research events are recorded in an append-only, in-memory structured ledger:
- `CASE_CREATED`, `HYPOTHESES_LOCKED`, `EXPERIMENT_PLAN_LOCKED`, `EXPERIMENT_STARTED`, `EXPERIMENT_COMPLETED`, `EVIDENCE_CREATED`, `CONTRADICTION_CHECKED`, `SECONDARY_TEST_STARTED`, `SECONDARY_TEST_COMPLETED`, `SYNTHESIS_CREATED`, `CASE_SEALED`, `REPLAY_STARTED`, `REPLAY_COMPLETED`, `REPLAY_MISMATCH`.

### Security & Integrity Controls
- **Monotonic Timestamps**: Event timestamps must be non-decreasing ($t_i \ge t_{i-1}$); any retroactive modification throws a ledger corruption exception.
- **Secret Redaction**: Any payload keys containing credential markers (`apikey`, `token`, `secret`, `password`, `auth`) are automatically scrubbed and redacted.
- **Ledger Checksum**: The timeline maintains a cumulative SHA-256 checksum over all serialized events.

---

## 8. Case File Export Formats

Research cases can be exported across three complete, self-contained formats containing all 17 canonical institutional sections:
1. **Markdown (`.md`)**: Fully readable, table-formatted institutional document suitable for Git version control and offline review.
2. **JSON (`.json`)**: Machine-readable canonical serialization preserving exact structures, fingerprints, and evidence graphs for lossless re-import.
3. **Printable HTML / PDF**: Institutional typography, high-contrast dark theme, and page-break optimization for physical distribution and compliance archival.

---

## 9. Security, AI Boundaries, and Methodological Limitations

### 9.1 Security Guarantees
- Zero persistence of API keys, authentication headers, or system secrets in manifests.
- Prompt injection protection: LLM inputs cannot modify case identity, rewrite fingerprints, tamper with audit history, or bypass tool registries.
- No database dependencies: Pure client-side/in-memory execution with no external telemetry egress.

### 9.2 AI Role Boundaries
- **Permitted**: Explaining replay divergences, translating audit events into human summaries, illustrating lineage graphs, and suggesting follow-up hypotheses.
- **Prohibited**: Fabricating numerical values, modifying evidence records, altering fingerprints, overriding replay verification statuses, or bypassing tool registries.

### 9.3 Known Methodological Limitations
1. Floating-point cross-architecture divergence: Compiling with different V8/JavaScript runtimes or CPU microarchitectures may introduce LSB (least significant bit) differences beyond $10^{-8}$.
2. Simulation path truncation: Replays clamp Monte Carlo simulation paths to $\le 10,000$ to ensure UI responsiveness.
3. Local storage boundary: In the initial Phase 4.1 deployment, cases are stored in-memory with optional JSON export/import. Persistent multi-tenant synchronization is reserved for future enterprise phases.
