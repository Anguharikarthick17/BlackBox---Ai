# BLACKBOX X — PHASE 4.1
## RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER ARCHITECTURE
### Formal Case Encapsulation, Manifest Specification, Multi-Level Replay Verification, Evidence Lineage, and Research Diff Engine

---

## 1. Executive Summary & Purpose

### 1.1 Objective
Phase 4.1 establishes a formal, tamper-evident **Reproducibility, Replay, and Decision Audit Layer** on top of the Phase 4.0 Institutional Research Workspace.

Phase 4.0 transformed BLACKBOX X into an orchestrated research workspace producing falsifiable hypotheses, bounded experiment DAGs, direct evidence records, contradiction evaluations, secondary sensitivity sweeps, structured numerical claims, and reproducible research memos. Phase 4.1 elevates completed sessions into **immutable Research Cases**, encapsulates complete reproducible configurations into machine-readable **Research Manifests**, provides a deterministic **Replay Engine** with 6-level verification, renders an interactive **Evidence Lineage** graph, and delivers a neutral **Research Diff Engine** for auditing parameter drift and evidence divergence across research investigations:

$$\begin{aligned}
\text{Research Inquiry} &\;\longrightarrow\; \text{Research Case} \;\longrightarrow\; \text{Research Manifest} \;\longrightarrow\; \text{Evidence Lineage} \\
&\;\longrightarrow\; \text{Replay Engine} \;\longrightarrow\; \text{6-Level Verification} \;\longrightarrow\; \text{Structured Diff} \;\longrightarrow\; \text{Auditable Case File}
\end{aligned}$$

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                 PHASE 4.1 FORMAL REPRODUCIBILITY & AUDIT ARCHITECTURE                     │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Immutable Research Case (Formal Case Identity: BBX-CASE-YYYY-XXXX)                     │
│    Seals session state, hypotheses, DAG, evidence, claims, contradictions, and provenance │
│          │                                                                                │
│          ▼                                                                                │
│ 2. Canonical Research Manifest (JSON-LD / Schema v4.1)                                    │
│    Zero secrets, complete parameter closure, synchronization policy, engine versions       │
│          │                                                                                │
│          ▼                                                                                │
│ 3. Deterministic Replay Engine                                                            │
│    Reconstructs DAG, re-executes registered tools under identical seed and runtime bounds │
│          │                                                                                │
│          ▼                                                                                │
│ 4. Six-Level Verification Audit                                                           │
│    L1 Config • L2 Data/Window • L3 Experiment • L4 Evidence • L5 Claims • L6 Synthesis        │
│          │                                                                                │
│          ▼                                                                                │
│ 5. Structured Mismatch & Lineage Diagnostics                                              │
│    Trace exact drift (e.g. 10 bps → 20 bps friction ⇒ alters EV-004 ⇒ breaks Claim C-002) │
│          │                                                                                │
│          ▼                                                                                │
│ 6. Neutral Research Diff Engine                                                           │
│    Mathematical parameter and metric deltas without evaluative rankings ("What changed?") │
│          │                                                                                │
│          ▼                                                                                │
│ 7. Auditable Case File (17 Sections, Markdown / JSON / PDF)                               │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Architectural Invariant: Zero Financial Calculation Duplication
Phase 4.1 is strictly an **audit, reproducibility, lineage, and verification layer**.
- **No Calculation Duplication**: Phase 4.1 implements zero financial metric calculations, backtest loops, return calculations, covariance estimations, Monte Carlo random-number generators, or regime detection algorithms.
- **Single Source of Financial Truth**: Quantitative engines (Phases 1 through 3.9) remain the sole source of truth. When replaying experiments, the Replay Engine dispatches identical inputs exclusively to registered tools via `ResearchToolRegistry`.
- **AI Boundaries**: Large Language Models operate strictly as explainers and summarizers of audit timelines, lineages, and differences. AI **never** alters manifests, modifies evidence records, tampers with fingerprints, or fabricates numerical claim values.

---

## 2. Existing Architecture Reuse Map

Phase 4.1 integrates with and strictly preserves all locked components from Phases 1 through 4.0:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                ARCHITECTURE REUSE MAPPING                                 │
├───────────────────────────────┬───────────────────────────────────────────────────────────┤
│ Component                     │ Phase 4.1 Integration & Reuse Modality                    │
├───────────────────────────────┼───────────────────────────────────────────────────────────┤
│ Quantitative Metrics          │ Replay validation target via `get_asset_metrics`          │
│ Strategy Engine & Backtest    │ Replay execution via `get_strategy_metrics` & benchmark   │
│ Correlation Engine            │ Matrix & rolling verification via `get_correlation_*`     │
│ Market Regimes                │ 4-regime classification via `get_regime_performance`     │
│ Stress Testing (Phase 3.2)    │ Macro crisis shock replay via `get_stress_result`        │
│ Strategy Genome (Phase 3.3)   │ 5D risk fingerprint replay via `get_strategy_genome`      │
│ Risk Committee (Phase 3.4)    │ ResearchPack audit export and CRO verification briefing   │
│ AI Assistant (Phase 3.5)      │ Lineage explainer & audit timeline narrative              │
│ Quant Research Agent (3.6)    │ Falsifiable hypothesis & contradiction engine patterns    │
│ Portfolio Intelligence (3.7)  │ Simplex allocations & Euler risk replay verification      │
│ Monte Carlo (Phase 3.8)       │ Unconditional bootstrap/parametric replay (Web Worker)    │
│ Regime Monte Carlo (3.9)      │ Markov transition simulation replay (Mulberry32 seed)     │
│ ResearchSession (Phase 4.0)   │ Underlying operational session captured by ResearchCase   │
│ ResearchToolRegistry (4.0)    │ Exclusive execution allowlist for deterministic replay    │
│ EvidenceRecord & Claims (4.0) │ Atomic objects bound into lineage graphs and verified     │
│ researchFingerprint (4.0)     │ Canonical JSON serialization & SHA-256 hash algorithms    │
└───────────────────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 3. Research Case Data Contract

An active `ResearchSession` (Phase 4.0) transitions upon completion into an immutable `ResearchCase`. Once locked, a `ResearchCase` cannot be mutated.

```typescript
export type CaseStatus =
  | 'SEALED'              // Normal completed session, permanently locked
  | 'REPLAY_VERIFIED'     // Successfully replayed with 100% canonical-output identity match
  | 'REPLAY_DIVERGENT'    // Replay exhibited parameter, evidence, or numerical divergence
  | 'ARCHIVED'            // Historical reference case
  | 'REVOKED';            // Invalidated by audit due to corrupted input data

export interface ResearchCase {
  caseId: string;                             // Canonical identity: "BBX-CASE-2026-XXXX"
  caseVersion: number;                        // Incremental case schema version (e.g., 1)
  createdAt: number;                          // Epoch timestamp ms of case creation
  sealedAt: number;                           // Epoch timestamp ms of permanent sealing
  updatedAt: number;                          // Epoch timestamp ms of latest audit action
  sessionId: string;                          // Originating ResearchSession UUID
  question: string;                           // Raw natural language question investigated
  normalizedQuestion: string;                 // Sanitized, lowercased canonical inquiry
  status: CaseStatus;
  
  // Bound Research Entity References
  manifestId: string;                         // Bound ResearchManifest identifier
  hypothesisIds: string[];                    // Ordered list of evaluated hypotheses
  experimentIds: string[];                    // Ordered list of planned experiment DAG nodes
  evidenceIds: string[];                      // Ordered list of generated EvidenceRecords
  claimIds: string[];                         // Structured ResearchClaim identifiers
  contradictionIds: string[];                 // Resolved contradiction record IDs
  secondaryTestIds: string[];                 // Triggered secondary sensitivity sweep IDs
  synthesisId: string;                        // ResearchSynthesis identifier
  memoId: string;                             // Generated ResearchMemo reference
  
  // Audit & Reproducibility Payloads
  manifest: ResearchManifest;                 // Embedded standalone reproducible manifest
  provenance: CaseProvenance;                 // Complete multi-engine data & runtime context
  reproducibility: ReproducibilityContract;   // Formal mathematical reproducibility contract
  lineage: CaseLineage;                       // Forward and backward claim-to-evidence graph
  auditTimeline: AuditEvent[];                // Tamper-evident append-only event trail
  verificationHistory: ReplayVerificationRecord[]; // Log of all replay executions
}

export interface CaseProvenance {
  datasetWindow: {
    startDate: string;                        // "2019-01-01"
    endDate: string;                          // "2023-12-31"
    observationCount: number;                 // Exactly 1,825 bars
    synchronizationPolicy: string;            // Common trading calendar intersection
    datasetFingerprint: string;               // "bx-sync-1825-gold-btc-nvda-v1"
  };
  assetUniverse: Array<'GOLD' | 'BTC' | 'NVDA'>;
  engineVersions: {
    quantCore: string;                        // "1.0"
    regimeEngine: string;                     // "2.0"
    stressEngine: string;                     // "3.2"
    genomeEngine: string;                     // "3.3"
    riskCommittee: string;                    // "3.4"
    portfolioEngine: string;                  // "3.7"
    monteCarloEngine: string;                 // "3.8"
    regimeMonteCarloEngine: string;           // "3.9"
    workspaceEngine: string;                  // "4.0"
    auditEngine: string;                      // "4.1"
  };
  runtimeEnvironment: {
    nodeVersion?: string;
    browserRuntime?: string;
    numericalContract: 'IEEE-754-FLOAT64-ROUND-NEAREST-TIES-EVEN';
  };
  deterministicSeed: number;                  // PRNG seed (e.g. 42 or 100)
  totalToolsExecuted: number;
  totalExecutionDurationMs: number;
}
```

---

## 4. Case Identity Architecture & Hierarchy

To eliminate ambiguity between human identifiers, cryptographic hashes, and runtime instances, Phase 4.1 establishes a four-tier identity architecture:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             FOUR-TIER IDENTITY ARCHITECTURE                               │
├─────────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│ Identifier Tier         │ Format / Scheme               │ Purpose & Scope                 │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ 1. Human-Readable Case  │ `BBX-CASE-YYYY-[SEQ4]`        │ Human citation, filing,         │
│    Identifier (caseId)  │ E.g., `BBX-CASE-2026-0042`    │ editorial memos, Risk Committee │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ 2. Canonical Session    │ `SHA-256(Q || D || E || H || S)`│ Cryptographic fingerprint of   │
│    Fingerprint          │ E.g., `bx-8f2c3a91b4e07d15`   │ total configuration parameters  │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ 3. Experiment           │ `SHA-256(Tool || Args || Win)`│ Idempotency caching and node    │
│    Fingerprint          │ E.g., `bx-exp-4c19a02e88f1`   │ equivalence during replay runs  │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ 4. Evidence             │ `SHA-256(Exp || Result)`      │ Canonical numerical payload     │
│    Fingerprint          │ E.g., `bx-ev-99b1e4c70312`    │ integrity & lineage tracking    │
└─────────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

### 4.1 Human-Readable Identifier Generation
The `caseId` follows a strict sequential standard: `BBX-CASE-{YEAR}-{SEQUENCE_4_DIGITS}`.
- Deterministically allocated by the case store.
- Independent of arbitrary runtime UUIDs.
- Guaranteed unique within the workspace repository.

---

## 5. Machine-Readable Research Manifest Contract

The `ResearchManifest` is a self-contained, machine-readable declarative document capturing every parameter required to reproduce the investigation with canonical-output reproducibility:

```typescript
export interface ResearchManifest {
  manifestVersion: '4.1.0';
  manifestId: string;                         // "MNF-BBX-CASE-2026-0042"
  createdAt: string;                          // ISO 8601 UTC string
  caseId: string;
  
  // 1. DATA MANIFEST
  data: {
    assetUniverse: Array<'GOLD' | 'BTC' | 'NVDA'>;
    assetCanonicalOrdering: ['GOLD', 'BTC', 'NVDA'];
    startDate: string;                        // "2019-01-01"
    endDate: string;                          // "2023-12-31"
    observationCount: 1825;
    synchronizationPolicy: 'CONTEMPORANEOUS_COMMON_CALENDAR_INTERSECTION';
    datasetFingerprint: string;               // "bx-sync-1825-gold-btc-nvda-v1"
  };

  // 2. STRATEGY & BACKTEST MANIFEST
  strategy: {
    targetAsset: 'GOLD' | 'BTC' | 'NVDA';
    targetStrategy: 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION';
    strategyParameters: Record<string, number | string>;
    executionConvention: 'NEXT_BAR_CLOSE_WITH_ZERO_LOOKAHEAD';
    transactionCostBps: number;               // E.g., 10 (0.10%)
    initialCapital: number;                   // 100,000
    benchmarkAsset: 'GOLD' | 'BTC' | 'NVDA';
  };

  // 3. PORTFOLIO CONFIGURATION MANIFEST
  portfolio?: {
    weights: Record<'GOLD' | 'BTC' | 'NVDA', number>;
    rebalanceSchedule: 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'BUY_AND_HOLD';
    riskFreeRateAnnPct: 4.0;
    covarianceMethod: 'SAMPLE_ANNUALIZED_252';
  };

  // 4. PROBABILISTIC SIMULATION MANIFEST
  simulation?: {
    monteCarloMethod: 'STATIONARY_CIRCULAR_BOOTSTRAP' | 'STUDENT_T_PARAMETRIC' | 'GAUSSIAN_PARAMETRIC';
    regimeConditioned: boolean;
    startingRegime?: 'BULL' | 'BEAR' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY' | 'EMPIRICAL_DISTRIBUTION';
    simulationCount: number;                  // Ceiling: 10,000
    horizonDays: number;                      // E.g., 252
    deterministicSeed: number;
    prngAlgorithm: 'MULBERRY_32';
  };

  // 5. ENGINE STACK MANIFEST
  engines: Record<string, string>;

  // 6. RESEARCH WORKFLOW MANIFEST
  research: {
    researchQuestion: string;
    hypotheses: Array<{
      id: string;
      category: string;
      statement: string;
      testIds: string[];
    }>;
    experimentDAG: Array<{
      experimentId: string;
      toolName: string;
      arguments: Record<string, any>;
      dependencies: string[];
      seed?: number;
      fingerprint: string;
    }>;
    expectedEvidenceFingerprints: Record<string, string>; // expId -> expected SHA-256
    expectedClaims: Array<{
      claimId: string;
      metric: string;
      value: number | string;
      boundEvidence: string[];
    }>;
  };

  // 7. SECURITY & INTEGRITY CERTIFICATE
  security: {
    containsZeroApiKeys: true;
    containsZeroExecutableCode: true;
    isSanitizedAgainstInjection: true;
    canonicalManifestHash: string;            // SHA-256 of canonical JSON
  };
}
```

---

## 6. Deterministic Replay Engine

The `ResearchReplayEngine` consumes a `ResearchCase` or `ResearchManifest` and systematically re-executes the planned quantitative experiments to verify whether outputs match the original investigation.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                            REPLAY ENGINE EXECUTION PIPELINE                               │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Validate Manifest Schema & Engine Version Compatibility                                │
│    [Version Guard: Ensure methodology version and schemas match]                          │
│          │                                                                                │
│          ▼                                                                                │
│ 2. Reconstruct Topological Experiment Plan (DAG)                                          │
│    [Ordering Guard: Kahn's topological sort resolves execution sequence]                 │
│          │                                                                                │
│          ▼                                                                                │
│ 3. Execute Registered Tools Sequentially                                                  │
│    [Allowlist Guard: Replay dispatches ONLY registered ResearchToolRegistry tools]        │
│          │                                                                                │
│          ▼                                                                                │
│ 4. Capture Replay Evidence Records & Fingerprints                                         │
│    [Deterministic Engine: Mulberry32 PRNG + IEEE-754 floats]                              │
│          │                                                                                │
│          ▼                                                                                │
│ 5. Perform 6-Level Replay Verification vs. Original Manifest                              │
│    [Config → Data → Experiments → Evidence → Claims → Synthesis]                          │
│          │                                                                                │
│          ▼                                                                                │
│ 6. Emit Structured ReplayVerificationRecord                                               │
│    [Status: MATCHED | MISMATCHED | INCOMPATIBLE | FAILED]                                 │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Replay State Transitions
```typescript
export type ReplayState =
  | 'PENDING'
  | 'VALIDATING_MANIFEST'
  | 'REPLAYING_EXPERIMENTS'
  | 'VERIFYING_EVIDENCE'
  | 'VERIFYING_CLAIMS'
  | 'MATCHED'
  | 'MISMATCHED'
  | 'INCOMPATIBLE'
  | 'FAILED';
```

---

## 7. The Mathematical Reproducibility Contract & Numerical Comparison Policy

Universal bit-for-bit identity across arbitrary hardware, operating systems, compiler optimizations, or runtime WASM/SIMD vectorization cannot and must not be claimed. Furthermore, canonical serialization inherently normalizes floating-point values (e.g., using `toFixed(8)`), which means raw IEEE-754 binary bit equivalence is neither guaranteed nor asserted at the serialization layer.

Instead, BLACKBOX X establishes formal **canonical-output reproducibility**.

### 7.1 Canonical-Output Reproducibility Definition
The system guarantees deterministic replay equivalence under the following additive identity:

$$\begin{aligned}
\text{SAME ENGINE} &\;+ \text{ SAME DATA} \\
&\;+ \text{ SAME PARAMETERS} \\
&\;+ \text{ SAME SEED} \\
&\;+ \text{ SAME NUMERICAL CONTRACT} \\
&\;+ \text{ SAME CANONICAL SERIALIZATION} \\
&\;\Longrightarrow\; \mathbf{\text{IDENTICAL CANONICAL OUTPUT FINGERPRINT}}
\end{aligned}$$

#### Three-Tier Comparison Distinction
To eliminate ambiguity between binary representations and analytical outputs, the architecture establishes a strict three-tier hierarchy:

1. **Raw Numerical / Binary Identity**:
   - Exact 64-bit IEEE-754 bit-pattern equality (`===` or binary memory buffer equivalence).
   - Only achievable on identical CPU/SIMD architectures running identical runtime bytecode and compiler flags.
   - **Explicit Boundary**: BLACKBOX X does *not* claim universal raw binary identity across arbitrary hardware/runtime combinations.
2. **Canonical Serialized Output Identity**:
   - Identity achieved after canonical serialization and numerical normalization (`toFixed(8)`, recursive lexicographical key sorting, standard representation of infinity and NaN).
   - Produces identical SHA-256 canonical fingerprints across all conforming IEEE-754 runtimes.
3. **Numerical Tolerance Comparison**:
   - Metric-aware delta evaluation ($|v_{\text{replay}} - v_{\text{orig}}| \le \varepsilon_{\text{metric}}$) applied to floating-point outputs during verification.
   - Accounts for legitimate runtime numerical variations (such as summation accumulation ordering across thousands of returns, transcendental function approximations, or intermediate register precision).

---

### 7.2 Numerical Comparison Policy

BLACKBOX X strictly prohibits using a single universal epsilon (such as a blanket $10^{-6}$) for every numerical field. Doing so either creates brittle false alarms on composite ratio metrics or masks meaningful drift in tightly bounded allocations.

Numerical verification evaluates fields across three explicit comparison classes:

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                NUMERICAL COMPARISON CLASSES                               │
├──────────────────────┬────────────────────────────────────────────────────────────────────┤
│ Comparison Class     │ Evaluated Fields & Target Scope                                    │
├──────────────────────┼────────────────────────────────────────────────────────────────────┤
│ 1. EXACT             │ • Identifiers (`caseId`, `manifestId`, `evidenceId`, `claimId`)    │
│                      │ • Dates & timestamps (`startDate`, `endDate`, epoch ms)            │
│                      │ • Asset ordering (canonical vectors: `['GOLD', 'BTC', 'NVDA']`)   │
│                      │ • PRNG Seeds (Mulberry32 integer seeds, e.g. `42`)                 │
│                      │ • Integer parameters (path count `1000`, lookback days `252`)      │
│                      │ • Boolean configuration flags (`rebalanceEnabled: true`)          │
│                      │ • Cryptographic fingerprints (`sessionFingerprint`, SHA-256 hashes)│
├──────────────────────┼────────────────────────────────────────────────────────────────────┤
│ 2. CANONICAL EXACT   │ • Values after canonical serialization and normalization          │
│                      │ • Stringified float payloads formatted via `toFixed(8)`            │
│                      │ • Canonical JSON representations prior to SHA-256 hashing          │
│                      │ • Non-finite float tokens (`"NaN"`, `"Infinity"`, `"-Infinity"`)   │
├──────────────────────┼────────────────────────────────────────────────────────────────────┤
│ 3. NUMERICAL         │ • Floating-point outputs where legitimate runtime numerical        │
│    TOLERANCE         │   variation can occur across compliant runtimes.                   │
│                      │ • Evaluated strictly against metric-specific tolerance budgets.   │
└──────────────────────┴────────────────────────────────────────────────────────────────────┘
```

#### Metric-Specific Numerical Tolerance Matrix
Tolerances are defined explicitly by financial metric and output type, with each threshold grounded in mathematical rationale:

| Metric / Output Type | Absolute Tolerance ($\varepsilon$) | Mathematical Rationale & Justification |
| :--- | :---: | :--- |
| **Correlation** | $\pm 10^{-4}$ | Pearson correlation involves covariance divided by product of std devs. Pairwise summation ordering across $\approx 1{,}825$ daily observations introduces minor floating-point cancellation. |
| **Portfolio Weights** | $\pm 10^{-6}$ | Optimization weights are constrained to the unit simplex ($\sum w_i = 1.0, w_i \ge 0$). Strict tolerance prevents allocation drift while permitting solver convergence limits. |
| **Returns (Daily / Cumulative)** | $\pm 10^{-6}$ | Cumulative compound returns $\prod (1 + r_t) - 1$ accumulate small rounding deltas across long time horizons. |
| **Volatility (Annualized)** | $\pm 10^{-6}$ | Sample standard deviation incorporates squared deviations and square-root evaluation ($\sqrt{252} \cdot \sigma$). |
| **Sharpe / Sortino Ratio** | $\pm 10^{-4}$ | Composite ratio metric ($\frac{\mu - r_f}{\sigma}$). Small variations in denominator volatility propagate non-linearly into ratio precision. |
| **Drawdown (Max / Daily)** | $\pm 10^{-5}$ | High-water mark tracking and peak division ($1 - P_t / HWM_t$) require fine-grained precision to avoid misidentifying peak troughs. |
| **Monte Carlo Percentiles** | $\pm 10^{-4}$ | Percentiles (5th, 25th, 50th, 75th, 95th) derived from sorted empirical paths ($N = 1{,}000 \dots 10{,}000$). Quantile rank interpolation can exhibit slight boundary variance. |
| **Euler Risk Contributions** | $\pm 10^{-5}$ | Marginal risk decomposition ($w_i \cdot \frac{\partial \sigma_p}{\partial w_i}$) involves matrix-vector product with covariance matrix. |
| **Regime Transition Frequencies**| $\pm 10^{-5}$ | Empirical transition probabilities derived from transition count matrix divided by state dwell counts. |

---

## 8. Six-Level Replay Verification Algorithm & Mismatch Taxonomy

Replay verification does not simply emit a boolean pass/fail or collapse all divergences into a generic failure message. It tests six hierarchical evidentiary tiers and classifies any mismatch using an explicit taxonomy with formal precedence.

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                              SIX-LEVEL VERIFICATION AUDIT                                 │
├─────────┬──────────────────────┬──────────────────────────────────────────────────────────┤
│ Level   │ Verification Tier    │ Evaluation Criteria & Comparison Class                   │
├─────────┼──────────────────────┼──────────────────────────────────────────────────────────┤
│ Level 1 │ Configuration Audit  │ Asset universe, strategy params, cost bps, seeds (EXACT) │
├─────────┼──────────────────────┼──────────────────────────────────────────────────────────┤
│ Level 2 │ Data Window Audit    │ Start/End date, synchronized observation count (EXACT)   │
├─────────┼──────────────────────┼──────────────────────────────────────────────────────────┤
│ Level 3 │ Experiment Plan Audit│ Planned DAG nodes, dependency order, tool names (EXACT)  │
├─────────┼──────────────────────┼──────────────────────────────────────────────────────────┤
│ Level 4 │ Evidence Audit       │ Numerical results match canonical contract & metric      │
│         │                      │ tolerances (CANONICAL EXACT / NUMERICAL TOLERANCE)       │
├─────────┼──────────────────────┼──────────────────────────────────────────────────────────┤
│ Level 5 │ Research Claim Audit │ Structured claims bound to identical Evidence IDs (EXACT)│
├─────────┼──────────────────────┼──────────────────────────────────────────────────────────┤
│ Level 6 │ Synthesis Audit      │ Findings, contradiction outcomes, and causality flags    │
└─────────┴──────────────────────┴──────────────────────────────────────────────────────────┘
```

### 8.1 Replay Mismatch Taxonomy

When a replay run diverges from the sealed `ResearchCase`, the system classifies the discrepancy into one of ten mutually exclusive diagnostic categories:

```typescript
export type ReplayMismatchType =
  | 'CONFIGURATION_MISMATCH'   // Case parameters (weights, costs, lookback, seed) differ
  | 'DATA_MISMATCH'            // Date window, observation count, or price points differ
  | 'VERSION_MISMATCH'         // Quantitative engine semver or breaking contract change
  | 'SCHEMA_MISMATCH'          // ResearchManifest or case JSON schema malformed/invalid
  | 'NUMERICAL_MISMATCH'       // Config & version match, but numerical delta > metric tolerance
  | 'EVIDENCE_MISMATCH'        // Numbers match, but evidence record structure/count differs
  | 'CLAIM_MISMATCH'           // Evidence matches, but structured claim binding differs
  | 'SYNTHESIS_MISMATCH'       // Claims match, but contradiction resolution/synthesis differs
  | 'TOOL_UNAVAILABLE'         // Required research tool missing from tool registry
  | 'REPLAY_FAILURE';          // Runtime exception, worker crash, or execution timeout
```

### 8.2 Precedence & Evaluation Hierarchy
When multiple mismatches co-occur during a replay run, they MUST NOT be collapsed into an ambiguous generic error. The Replay Engine evaluates tiers sequentially according to strict **precedence order** (Precedence 1 = highest / earliest root cause):

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                           REPLAY MISMATCH PRECEDENCE HIERARCHY                            │
├──────┬────────────────────────────┬───────────────────────────────────────────────────────┤
│ Rank │ Mismatch Classification    │ Disambiguation Rule & Execution Action                │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  1   │ `SCHEMA_MISMATCH`          │ Manifest parsing fails; cannot configure replay. Stop.│
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  2   │ `VERSION_MISMATCH`         │ Engine version incompatible; cannot guarantee math.   │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  3   │ `TOOL_UNAVAILABLE`         │ Required analytical tool not registered in environment│
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  4   │ `CONFIGURATION_MISMATCH`   │ Parameter drift detected before execution starts.     │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  5   │ `DATA_MISMATCH`            │ Data window or observation count drift detected.      │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  6   │ `NUMERICAL_MISMATCH`       │ Execution finished, but float output exceeds metric   │
│      │                            │ tolerance budget.                                     │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  7   │ `EVIDENCE_MISMATCH`        │ Numerical results match, but evidence packaging,      │
│      │                            │ record count, or metadata keys differ.                │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  8   │ `CLAIM_MISMATCH`           │ Evidence verified, but claim-to-evidence reference id │
│      │                            │ or claimed value binding differs.                     │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  9   │ `SYNTHESIS_MISMATCH`       │ Claims verified, but analytical findings or           │
│      │                            │ contradiction resolution flags differ.                │
├──────┼────────────────────────────┼───────────────────────────────────────────────────────┤
│  10  │ `REPLAY_FAILURE`           │ Uncaught runtime error, worker crash, or timeout.     │
└──────┴────────────────────────────┴───────────────────────────────────────────────────────┘
```

#### Concrete Disambiguation Examples
- **Example A (Configuration Drift)**:
  - Researcher re-runs a backtest with transaction costs set to $20\text{ bps}$ instead of the recorded $10\text{ bps}$.
  - *Classification*: `CONFIGURATION_MISMATCH` (Precedence 4). Even though numerical outputs will also differ, the root cause is parameter drift, evaluated before numerical comparison.
- **Example B (Engine Drift)**:
  - Monte Carlo engine updated from v3.8.0 to v4.0.0 with an altered PRNG step.
  - *Classification*: `VERSION_MISMATCH` (Precedence 2). Evaluated before running simulation.
- **Example C (Numerical Drift)**:
  - Configuration, dataset, tool, and engine version are all identical, but recomputed Sharpe ratio differs by $0.002$ ($> 10^{-4}$).
  - *Classification*: `NUMERICAL_MISMATCH` (Precedence 6).
- **Example D (Structural Evidence Drift)**:
  - Numerical metrics are identical within tolerance, but the replayed tool emits 4 evidence records instead of 5 due to an updated payload schema.
  - *Classification*: `EVIDENCE_MISMATCH` (Precedence 7).
- **Example E (Claim Binding Drift)**:
  - Replayed evidence matches, but an edited memo binds Claim-002 to Evidence-003 instead of Evidence-002.
  - *Classification*: `CLAIM_MISMATCH` (Precedence 8).

### 8.3 ReplayVerificationRecord Contract
```typescript
export interface ReplayVerificationRecord {
  verificationId: string;                     // "VRF-2026-0042-01"
  caseId: string;
  replayedAt: number;
  overallStatus: 'MATCHED' | 'MISMATCHED' | 'INCOMPATIBLE' | 'FAILED';
  
  // Structured Mismatch Taxonomy
  primaryMismatchType?: ReplayMismatchType;   // Highest-precedence root cause mismatch
  mismatchPrecedenceLevel?: number;           // 1 (highest) to 10 (lowest)
  allMismatchTypes: ReplayMismatchType[];      // Complete list of all detected mismatch codes

  tierResults: {
    level1Configuration: { 
      status: 'PASS' | 'FAIL'; 
      mismatches: ConfigurationMismatch[]; 
    };
    level2DataWindow: { 
      status: 'PASS' | 'FAIL'; 
      mismatches: DataWindowMismatch[]; 
    };
    level3ExperimentPlan: { 
      status: 'PASS' | 'FAIL'; 
      mismatches: string[]; 
    };
    level4EvidenceRecords: { 
      status: 'PASS' | 'FAIL'; 
      mismatches: EvidenceMismatch[];
      numericalMismatches: NumericalMismatch[];
    };
    level5ResearchClaims: { 
      status: 'PASS' | 'FAIL'; 
      mismatches: ClaimMismatch[]; 
    };
    level6Synthesis: { 
      status: 'PASS' | 'FAIL'; 
      mismatches: string[]; 
    };
  };

  fingerprintComparison: {
    originalFingerprint: string;
    replayFingerprint: string;
    identical: boolean;                       // Canonical output fingerprint match
  };
  
  totalReplayLatencyMs: number;
}

export interface ConfigurationMismatch {
  parameterPath: string;                      // E.g., "strategy.transactionCostBps"
  originalValue: any;
  replayValue: any;
  precedence: 4;
}

export interface DataWindowMismatch {
  field: 'startDate' | 'endDate' | 'observationCount' | 'dataFingerprint';
  originalValue: string | number;
  replayValue: string | number;
  precedence: 5;
}

export interface NumericalMismatch {
  metric: string;                             // E.g., "sharpeRatio", "maxDrawdown"
  comparisonClass: 'NUMERICAL_TOLERANCE';
  toleranceBudget: number;                    // E.g., 0.0001
  originalValue: number;
  replayValue: number;
  absoluteDelta: number;
  relativeDeltaPct: number;
  withinTolerance: boolean;
  precedence: 6;
}

export interface EvidenceMismatch {
  evidenceId: string;
  toolName: string;
  divergenceType: 'PAYLOAD_SCHEMA' | 'RECORD_COUNT' | 'MISSING_FIELD';
  description: string;
  precedence: 7;
}

export interface ClaimMismatch {
  claimId: string;
  metric: string;
  originalClaimText: string;
  boundEvidenceId: string;
  replayedEvidenceValue: number | string;
  reason: string;
  precedence: 8;
}
```

---

## 9. Neutral Research Diff Engine

The `ResearchDiffEngine` provides multi-case comparative auditing between two `ResearchCases` ($A$ and $B$).
- **Strict Epistemic Neutrality Protocol**: The Diff Engine strictly forbids subjective evaluations, performance scores, or rankings (e.g., *"Case A outperformed Case B"* or *"Case A is superior"*).
- **Objective Delta Output**: Reports strictly what changed, absolute deltas, relative percentage shifts, and direction.

```typescript
export interface ResearchDiffResult {
  caseAId: string;
  caseBId: string;
  comparedAt: number;

  inquiryDiff: {
    identicalQuestion: boolean;
    questionA: string;
    questionB: string;
  };

  parameterDiffs: Array<{
    category: 'DATA' | 'STRATEGY' | 'COST' | 'PORTFOLIO' | 'SIMULATION';
    parameterName: string;
    valueA: any;
    valueB: any;
    isDivergent: boolean;
  }>;

  quantitativeMetricDiffs: Array<{
    metricName: string;
    category: 'RETURN' | 'VOLATILITY' | 'SHARPE' | 'DRAWDOWN' | 'VAR' | 'TURNOVER';
    valueA: number;
    valueB: number;
    absoluteDelta: number;
    relativeDeltaPct?: number;
    direction: 'INCREASE' | 'DECREASE' | 'NO_CHANGE';
    evidenceRefA: string;
    evidenceRefB: string;
  }>;

  hypothesisDiffs: Array<{
    hypothesisId: string;
    statement: string;
    statusA: string;
    statusB: string;
    confidenceA: string;
    confidenceB: string;
    statusShift: boolean;
  }>;

  contradictionDiffs: {
    contradictionsA: number;
    contradictionsB: number;
    summary: string;
  };

  reproducibilityDiff: {
    seedA: number;
    seedB: number;
    fingerprintA: string;
    fingerprintB: string;
    identicalFingerprint: boolean;
  };
}
```

---

## 10. Evidence Lineage Model

Every `ResearchClaim` in a research memo must be bidirectionally traceable down to its underlying data bar:

$$\text{Claim} \;\longrightarrow\; \text{Evidence Record} \;\longrightarrow\; \text{Experiment Node} \;\longrightarrow\; \text{Tool Definition} \;\longrightarrow\; \text{Arguments} \;\longrightarrow\; \text{Data Window} \;\longrightarrow\; \text{Engine Version} \;\longrightarrow\; \text{Dataset Hash}$$

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EVIDENTIARY LINEAGE GRAPH                                 │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│  [Claim: CLM-001] ("Strategy realized total return of 321.57%")                           │
│         │                                                                                 │
│         ▼ SUPPORTED_BY                                                                    │
│  [Evidence: EV-001] (totalReturn: 321.57, maxDrawdown: -20.76, trades: 42)               │
│         │                                                                                 │
│         ▼ PRODUCED_BY                                                                     │
│  [Experiment: EXP-001] (tool: get_strategy_metrics)                                       │
│         │                                                                                 │
│         ▼ EXECUTED_WITH                                                                   │
│  [Arguments: { asset: 'BTC', strategy: 'EMA_TREND', friction: 0.001 }]                    │
│         │                                                                                 │
│         ▼ DERIVED_FROM                                                                    │
│  [Data Window: 2019-01-01 to 2023-12-31, 1,825 synchronized bars]                         │
│         │                                                                                 │
│         ▼ VERSIONED_BY                                                                    │
│  [Engine: QuantCore v1.0 • Backtest v1.0 • SHA: bx-sync-1825-gold-btc-nvda-v1]            │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

```typescript
export interface LineageTrace {
  claimId: string;
  claimText: string;
  metric: string;
  claimedValue: number | string;
  evidence: {
    evidenceId: string;
    directEvidence: string;
    interpretation: string;
    evidenceFingerprint: string;
  };
  experiment: {
    experimentId: string;
    toolName: string;
    arguments: Record<string, any>;
    seed?: number;
    latencyMs?: number;
    experimentFingerprint: string;
  };
  provenance: {
    startDate: string;
    endDate: string;
    observationCount: number;
    datasetFingerprint: string;
    engineVersion: string;
  };
}
```

---

## 11. Claim Inspector Component Contract

When the researcher clicks any numerical figure in the Research Memo or Case View, the system opens the **Claim Inspector**:
- **Claim Overview**: Claim ID, metric name, declared value, unit.
- **Direct Evidence**: Empirical factual statement extracted directly from engine output.
- **Interpretation**: Analytical meaning deduced from the direct evidence.
- **Underlying Engine Run**: Canonical tool name (`get_strategy_metrics`), exact input arguments, execution latency, and deterministic seed.
- **Data Window & Dataset Fingerprint**: 1,825 bars (2019–2023), synchronous calendar hash.
- **Cryptographic Hash**: Output fingerprint (`bx-ev-xxxxxxxx`).
- **Separation Verification**: Visual alert confirming that Direct Evidence and Interpretation are distinct.

---

## 12. Auditable Case File Structure (17 Sections)

The complete `ResearchCaseFile` represents the primary institutional deliverable:

```
=============================================================================================
BLACKBOX X — AUDITABLE RESEARCH CASE FILE
Case ID: BBX-CASE-2026-0042
=============================================================================================

1.  CASE IDENTITY & CLASSIFICATION
2.  RESEARCH QUESTION & SCOPE
3.  COMPLETE REPRODUCIBILITY MANIFEST
4.  DATASET PROVENANCE & CALENDAR SYNCHRONIZATION AUDIT
5.  FALSIFIABLE HYPOTHESES & CONFIDENCE TIERS
6.  BOUNDED EXPERIMENT DAG SPECIFICATION
7.  IMMUTABLE EXECUTION TIMELINE
8.  EVIDENCE GRAPH (TOPOLOGICAL DAG)
9.  DIRECT QUANTITATIVE EVIDENCE CATALOG
10. ADVERSARIAL CONTRADICTION & COUNTERFACTUAL AUDIT
11. SECONDARY PARAMETER SENSITIVITY SWEEPS
12. STRUCTURED RESEARCH CLAIMS & LINEAGE MAP
13. REPRODUCIBILITY CONTRACT & FINGERPRINTS
14. REPLAY VERIFICATION AUDIT REPORT
15. NEUTRAL RESEARCH SYNTHESIS
16. METHODOLOGICAL LIMITATIONS & BOUNDARIES
17. NON-INVESTMENT ADVICE & REGULATORY DISCLAIMER
=============================================================================================
```

---

## 13. Audit Timeline Specification

Every event occurring throughout the research and audit lifecycle is captured in an append-only, tamper-evident timeline:

```typescript
export interface AuditEvent {
  eventId: string;                            // "AUD-001"
  timestamp: number;                          // Epoch timestamp ms
  isoTimestamp: string;                       // "2026-09-19T13:42:01.124Z"
  eventType:
    | 'CASE_INITIALIZED'
    | 'HYPOTHESIS_FORMULATED'
    | 'EXPERIMENT_PLAN_LOCKED'
    | 'TOOL_DISPATCHED'
    | 'EVIDENCE_RECORDED'
    | 'CONTRADICTION_FLAGGED'
    | 'SECONDARY_TEST_TRIGGERED'
    | 'SYNTHESIS_COMPILED'
    | 'CASE_SEALED'
    | 'REPLAY_DISPATCHED'
    | 'REPLAY_VERIFIED'
    | 'REPLAY_MISMATCH_DETECTED'
    | 'CASE_EXPORTED';
  actor: 'SYSTEM_ORCHESTRATOR' | 'RESEARCH_REPLAY_ENGINE' | 'ANALYST';
  payload: Record<string, any>;
  eventDigest: string;                        // SHA-256 of canonical event state
}
```

---

## 14. Version Compatibility Model

Replay requests evaluate version compatibility across three levels:

```typescript
export type VersionCompatibilityStatus =
  | 'EXACT_COMPATIBLE'        // Engine and methodology versions match exactly
  | 'COMPATIBLE_WITH_WARNING' // Minor version bump with backward-compatible numerical contract
  | 'INCOMPATIBLE';           // Major version bump or breaking numerical changes

export function checkVersionCompatibility(
  manifestVersions: Record<string, string>,
  currentVersions: Record<string, string>
): {
  status: VersionCompatibilityStatus;
  divergences: Array<{ engine: string; manifestVer: string; currentVer: string; impact: string }>;
};
```

If an engine has undergone a breaking numerical change (e.g. Monte Carlo algorithm shift from Gaussian to Student-$t$), the Replay Engine blocks execution with `INCOMPATIBLE_ENGINE_VERSION` rather than producing corrupted verification verdicts.

---

## 15. Security & Threat Model

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             AUDIT SECURITY & THREAT DEFENSE                               │
├──────────────────────────┬────────────────────────────────────────────────────────────────┤
│ Threat Vector            │ Phase 4.1 Mitigation & Defense Guardrail                       │
├──────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Secret / API Key Leakage │ Strict sanitizer prevents persistence of tokens or keys.      │
├──────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Arbitrary Code Injection │ Replay engine executes ONLY registered allowlist tools.        │
│                          │ eval() and new Function() are strictly prohibited.             │
├──────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Prompt Injection Attack  │ Untrusted prompt overrides cannot alter manifest hashes,       │
│                          │ execution budgets, or tool allowlists.                         │
├──────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Evidence Forgery         │ Numerical claims require verified EvidenceRecord binds.        │
│                          │ Mismatched evidence hashes trigger REPLAY_MISMATCH.            │
├──────────────────────────┼────────────────────────────────────────────────────────────────┤
│ Path / Memory Explosion  │ Replay simulation paths strictly capped at 10,000.             │
│                          │ Raw trajectory cubes are never persisted in state.             │
└──────────────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 16. Performance & Memory Ceilings

1. **Lightweight State Footprint**: A sealed `ResearchCase` contains summary statistics, percentiles, and fingerprints. Raw Monte Carlo paths ($10{,}000 \times 252 \times 3$ floats $\approx 60\text{ MB}$) are **never** serialized into the manifest or case store.
2. **Worker Parity**: Heavy simulation tools (`get_monte_carlo_risk`, `get_regime_monte_carlo_risk`) execute in background Web Workers during replay without locking the UI.
3. **Execution Timeout**: Replay runs inherit the strict 60-second execution ceiling.

---

## 17. Ghost Mode & Research Trail Integration

### 17.1 Ghost Mode 2.0 Reproducibility Events
Ghost Mode monitors replay audits and emits three deterministic insights:
- `REPRODUCIBILITY_STABLE`: Replay reproduced the original evidence fingerprint with canonical-output reproducibility.
- `PARAMETER_DRIFT`: Two otherwise related cases differ in transaction-cost friction or lookback parameters.
- `EVIDENCE_DRIFT`: Re-running across an altered data window alters a previously observed regime return relationship.

### 17.2 Research Trail Permanent Journaling
Every sealed `ResearchCase` appends an immutable record to the Research Trail:
- `caseId`
- `question`
- `manifestId`
- `reproducibilityStatus` (`SEALED` / `REPLAY_VERIFIED`)
- `sessionFingerprint`
- `executiveSummary`

---

## 18. AI Boundaries & Epistemic Protocol

| Permitted AI Functions | Strictly Prohibited AI Functions |
| :--- | :--- |
| Explain parameter differences in a Research Diff | Alter ResearchManifest parameters or hashes |
| Summarize audit timeline events in clear narrative | Modify EvidenceRecords or forged claim values |
| Clarify the mathematical meaning of evidence lineage | Override ReplayEngine verification status |
| Suggest follow-up research questions based on drift | Generate predictive return forecasts or guarantees |
| Explain why two cases diverged under higher friction | Provide financial, investment, or trading advice |

---

## 19. Institutional UI Architecture: Research Audit Console

Directory: `src/components/workspace/research/audit/`

```
src/components/workspace/research/audit/
├── ResearchCaseView.tsx        // Master container for sealed cases
├── ResearchCaseFile.tsx        // 17-section full case viewer (Markdown / JSON)
├── ReplayPanel.tsx             // Replay runner with live step-by-step progress
├── ReplayVerification.tsx      // 6-level verification results table & mismatch drilldown
├── ResearchDiffView.tsx        // Side-by-side neutral comparison view
├── EvidenceLineage.tsx         // Interactive claim-to-evidence graph explorer
├── ClaimInspector.tsx          // Modal drawer for inspecting claim evidence binds
├── AuditTimeline.tsx           // Append-only chronological event ledger
└── CaseExportPanel.tsx         // Multi-format export (JSON / Markdown / Printable PDF)
```

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                             INSTITUTIONAL AUDIT CONSOLE UX                                │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ [CASE: BBX-CASE-2026-0042] • STATUS: [ REPLAY VERIFIED ✓ ] • AUDIT: [ bx-8f2c3a91b4e07d15 ]│
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ Tabs: [ CASE FILE ]  [ REPLAY AUDIT ]  [ EVIDENCE LINEAGE ]  [ RESEARCH DIFF ]  [ TIMELINE ]│
│                                                                                           │
│ ┌───────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ 6-LEVEL REPLAY VERIFICATION:                                                          │ │
│ │   ✓ Level 1: Configuration Identical (18/18 params)                                   │ │
│ │   ✓ Level 2: Data Window Matched (1,825 bars, 2019-01-01 → 2023-12-31)                │ │
│ │   ✓ Level 3: Experiment DAG Order Verified (5 nodes)                                  │ │
│ │   ✓ Level 4: Evidence Payloads Canonical Match (EV-001 → EV-005)                      │ │
│ │   ✓ Level 5: Numerical Claims Bound & Validated (CLM-001 → CLM-004)                   │ │
│ │   ✓ Level 6: Synthesis & Contradiction Resolution Invariant                           │ │
│ └───────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 20. Comprehensive Testing Strategy (37 Automated Invariants)

The verification suite ([`tests/researchAudit.test.ts`](file:///Users/angu/Documents/BlackBox/tests/researchAudit.test.ts)) will enforce 37 critical audit invariants:

1. **Case Creation**: Sealed case receives valid `BBX-CASE-YYYY-XXXX` identity and timestamps.
2. **Case Immutability**: Modifying properties of a sealed `ResearchCase` is prohibited / throws error.
3. **Manifest Completeness**: Manifest captures all 7 mandated sections (Data, Strategy, Portfolio, Simulation, Engines, Research, Security).
4. **Fingerprint Determinism**: Identical manifest generates identical SHA-256 canonical hash.
5. **Replay Match**: Replaying a case with identical configuration produces `MATCHED` verification with identical canonical output fingerprint.
6. **Replay Mismatch Classification**: Modifying transaction cost from 10 bps to 20 bps produces `MISMATCHED` classified as `CONFIGURATION_MISMATCH` with structured parameter delta diagnostics.
7. **Version Compatibility**: Exact engine versions produce `EXACT_COMPATIBLE`.
8. **Incompatible Version Rejection**: Replaying against mismatched major engine version yields `INCOMPATIBLE` classified as `VERSION_MISMATCH`.
9. **Data Window Validation**: Altering dataset observation count flags Level 2 verification failure classified as `DATA_MISMATCH`.
10. **Numerical Tolerance Compliance**: Verification evaluates numerical fields against metric-specific tolerance budgets; deltas exceeding budget trigger `NUMERICAL_MISMATCH`.
11. **Evidence Lineage Backward Trace**: Claim traces cleanly back through evidence, experiment, tool, and data window.
12. **Evidence Lineage Forward Trace**: Tool experiment traces forward to bound claims and synthesis statements.
13. **Claim Binding Integrity**: Every numeric claim in case file maps to an existing `EvidenceRecord`.
14. **Claim Mismatch Detection**: Bound claim value divergence or invalid reference triggers `CLAIM_MISMATCH`.
15. **Audit Timeline Append-Only**: Timeline events are monotonically ordered and immutable.
16. **Diff Engine Neutrality**: Diff report contains zero evaluative adjectives (*"better"*, *"worse"*, *"superior"*).
17. **Quantitative Delta Calculation**: Computes exact absolute and relative deltas for metrics.
18. **Seed Preservation in Replay**: PRNG seed is preserved and passed to replayed simulation tools.
19. **Monte Carlo Replay Parity**: Unconditional Monte Carlo replay reproduces identical percentiles within metric tolerance ($\pm 10^{-4}$).
20. **Regime Monte Carlo Replay Parity**: Regime Monte Carlo replay reproduces identical transition matrices and MDD percentiles within tolerance ($\pm 10^{-5}$ and $\pm 10^{-4}$).
21. **Portfolio Simplex Replay**: Portfolio optimization replay reproduces identical asset weight allocations within simplex tolerance ($\pm 10^{-6}$).
22. **Stress Shock Replay**: Stress testing replay reproduces identical stressed drawdowns within drawdown tolerance ($\pm 10^{-5}$).
23. **Prompt Injection Sanitization**: Injected prompt strings in research questions fail to alter manifest policies.
24. **Secret Exclusion Audit**: Verified zero API keys, secrets, or bearer tokens in exported manifests.
25. **AI Role Boundary**: AI functions cannot mutate case state or forge evidence.
26. **Worker Sandbox Isolation**: Heavy simulations execute off main thread without memory leaks.
27. **Bounded Memory Footprint**: Large Monte Carlo trajectory matrices are not serialized in case state.
28. **Idempotency Verification**: Successive replays produce identical execution counts and fingerprints.
29. **Corrupted Manifest Recovery**: Malformed JSON manifest halts replay with structured `SCHEMA_MISMATCH`.
30. **Missing Tool Handling**: Manifest requesting unregistered tool name triggers `TOOL_UNAVAILABLE`.
31. **Incompatible Data Handling**: Mismatched date ranges trigger `DATA_MISMATCH`.
32. **Claim Inspector Direct vs Interpretation Separation**: Inspector clearly differentiates empirical numbers from analytical narrative.
33. **Case Export Integrity**: Exported JSON parses back into identical `ResearchCase` structure.
34. **Research Trail Sync**: Sealing a case appends a structured entry to the Research Trail.
35. **Ghost Mode Insight Trigger**: Replay match triggers `REPRODUCIBILITY_STABLE` Ghost Mode insight.
36. **Precedence Hierarchy Enforcement**: Simultaneous parameter drift and numerical delta is correctly classified by highest precedence (`CONFIGURATION_MISMATCH`).
37. **Structural vs Numerical Disambiguation**: Payloads with matching numbers but altered schema are classified as `EVIDENCE_MISMATCH` rather than `NUMERICAL_MISMATCH`.

---

## 21. Failure Modes & Graceful Handling Matrix

| Mismatch / Failure Code | Root Cause | System Response & Precedence |
| :--- | :--- | :--- |
| **`SCHEMA_MISMATCH`** | Malformed JSON or ResearchManifest schema violation | Replay halts at Level 1; emits `SCHEMA_MISMATCH` (Precedence 1). |
| **`VERSION_MISMATCH`** | Breaking quantitative engine semver bump or contract change | Replay transitions to `INCOMPATIBLE`; explains version divergence (Precedence 2). |
| **`TOOL_UNAVAILABLE`** | Required research tool removed or not in tool registry | Replay halts at Level 3; emits `TOOL_UNAVAILABLE` (Precedence 3). |
| **`CONFIGURATION_MISMATCH`** | Parameters, friction costs, lookback, seeds, or weights altered | Level 1 audit fails with parameter deltas; emits `CONFIGURATION_MISMATCH` (Precedence 4). |
| **`DATA_MISMATCH`** | Observation count, date window, or price series altered | Level 2 audit fails with observation deltas; emits `DATA_MISMATCH` (Precedence 5). |
| **`NUMERICAL_MISMATCH`** | Floating-point delta exceeds metric-specific tolerance ($\Delta > \varepsilon_{\text{metric}}$) | Level 4 audit flags `NUMERICAL_MISMATCH` with exact absolute/relative deltas and budget (Precedence 6). |
| **`EVIDENCE_MISMATCH`** | Numbers match within tolerance, but payload schema/record count differs | Level 4 audit flags `EVIDENCE_MISMATCH` (Precedence 7). |
| **`CLAIM_MISMATCH`** | Claim references mismatched evidence ID or claimed value differs | Level 5 audit flags `CLAIM_MISMATCH` (Precedence 8). |
| **`SYNTHESIS_MISMATCH`** | Analytical synthesis findings or contradiction resolution flags differ | Level 6 audit flags `SYNTHESIS_MISMATCH` (Precedence 9). |
| **`REPLAY_FAILURE`** | Execution timeout ($> 60\text{s}$) or Web Worker unhandled crash | Replay halts safely; records `REPLAY_FAILURE` without locking UI (Precedence 10). |

---

## 22. Proposed Implementation File Architecture

```
src/core/research/audit/
├── researchCase.ts             // ResearchCase factory, sealing, immutability guards
├── researchManifest.ts         // Manifest builder, canonical serialization, schema validation
├── researchCaseStore.ts         // In-memory & localStorage case repository
├── replayEngine.ts             // Deterministic re-execution of manifest experiments
├── replayVerifier.ts           // 6-level verification audit & mismatch diagnostician
├── researchDiff.ts             // Neutral comparative diff engine between cases
├── evidenceLineage.ts          // Forward and backward lineage tracing
├── claimInspector.ts           // Claim inspection resolver and binding auditor
├── auditTimeline.ts            // Append-only audit event ledger
├── versionCompatibility.ts    // Engine version matrix and compatibility checker
├── caseExport.ts               // Markdown, JSON, and PDF case file generators
└── index.ts                    // Barrel export

src/components/workspace/research/audit/
├── ResearchCaseView.tsx        // Master case container with tab navigation
├── ResearchCaseFile.tsx        // 17-section institutional report view
├── ReplayPanel.tsx             // Replay execution launcher & real-time progress
├── ReplayVerification.tsx      // 6-level verification audit card & diffs
├── ResearchDiffView.tsx        // Side-by-side neutral comparison table
├── EvidenceLineage.tsx         // Interactive lineage graph visualization
├── ClaimInspector.tsx          // Interactive modal for claim evidence inspection
├── AuditTimeline.tsx           // Chronological audit event trail
└── CaseExportPanel.tsx         // Multi-format export dialog

tests/
└── researchAudit.test.ts       // 35+ automated invariant tests

docs/
└── RESEARCH-AUDIT-METHODOLOGY.md // Methodological documentation
```

---

## 23. Acceptance Criteria Checklist

Phase 4.1 is accepted only if:

- [ ] `ResearchCase` data model is immutable and serializable
- [ ] Canonical case identity (`BBX-CASE-YYYY-XXXX`) implemented
- [ ] `ResearchManifest` captures complete parameter closure (Data, Strategy, Portfolio, Simulation, Engines, Research, Security)
- [ ] **Canonical-output reproducibility clearly defined** (`SAME ENGINE + SAME DATA + SAME PARAMETERS + SAME SEED + SAME NUMERICAL CONTRACT + SAME CANONICAL SERIALIZATION = IDENTICAL CANONICAL OUTPUT FINGERPRINT`)
- [ ] **No false bit-identical claims** across arbitrary hardware/runtime environments
- [ ] **Metric-aware numerical comparison policy** implemented across `EXACT`, `CANONICAL EXACT`, and `NUMERICAL TOLERANCE` classes
- [ ] Numerical tolerances explicitly documented by financial metric (correlation, portfolio weights, returns, volatility, Sharpe, drawdown, Monte Carlo percentiles, Euler risk contributions)
- [ ] **Structured replay mismatch taxonomy** implemented with 10 explicit categories (`CONFIGURATION_MISMATCH`, `DATA_MISMATCH`, `VERSION_MISMATCH`, `SCHEMA_MISMATCH`, `NUMERICAL_MISMATCH`, `EVIDENCE_MISMATCH`, `CLAIM_MISMATCH`, `SYNTHESIS_MISMATCH`, `TOOL_UNAVAILABLE`, `REPLAY_FAILURE`)
- [ ] **Formal precedence hierarchy** enforced when multiple mismatches co-occur (never collapse into generic "REPLAY FAILED")
- [ ] **Configuration drift clearly distinguished** from engine version drift and dataset drift
- [ ] **Numerical mismatch clearly distinguished** from structural evidence mismatch and claim binding mismatch
- [ ] `ResearchReplayEngine` reconstructs and executes planned experiments via `ResearchToolRegistry`
- [ ] 6-level replay verification algorithm implemented (Config $\to$ Data $\to$ Experiments $\to$ Evidence $\to$ Claims $\to$ Synthesis)
- [ ] Structured mismatch diagnostics isolate exact parameter/evidence/claim divergences
- [ ] `ResearchDiffEngine` compares two cases with strict epistemic neutrality (zero rankings or evaluative judgments)
- [ ] Evidence lineage maps claims bidirectionally to evidence records and data windows
- [ ] Claim inspector displays direct evidence vs. analytical interpretation distinctly
- [ ] 17-section `ResearchCaseFile` implemented with JSON and Markdown export
- [ ] Append-only `AuditTimeline` tracks lifecycle and audit events
- [ ] Version compatibility engine identifies exact vs. incompatible engine versions
- [ ] Zero API keys or secrets persisted in manifests
- [ ] Simulation path ceilings ($\le 10{,}000$) and Web Worker boundaries preserved
- [ ] Ghost Mode surfaces `REPRODUCIBILITY_STABLE` and drift events
- [ ] Research Trail receives permanent case logging
- [ ] All 37+ automated tests pass in `tests/researchAudit.test.ts`
- [ ] All existing 306 platform tests continue to pass (zero regressions)
- [ ] TypeScript compiles with 0 errors (`npx tsc --noEmit`)
- [ ] Production bundle builds cleanly (`npm run build`)
- [ ] Non-investment advice disclosures and historical simulation labels preserved
