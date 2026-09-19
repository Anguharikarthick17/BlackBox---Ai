# BLACKBOX X — FINAL SYSTEM ARCHITECTURE
**Architecture Version:** 4.3 (Final Hardened Release)  
**Classification:** Institutional Quantitative Research Instrument  
**Team:** Liquid

---

## 1. Structural Paradigm & Core Boundary

BLACKBOX X is built upon an uncompromised structural separation between **Deterministic Numerical Calculation** and **AI-Assisted Interpretation**:

```
                              ┌────────────────────────────────────────┐
                              │            RESEARCH SCIENTIST          │
                              │           (User Research Query)        │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CLIENT-SIDE RESEARCH RUNTIME (BROWSER / REACT / TSX / WEB WORKERS)                                   │
│                                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 1. RESEARCH OBSERVATORY / USER INTERFACE                                                       │  │
│  │   • Unified 6-Stage Progressive Canvas (ASK → INVESTIGATE → INSPECT → CHALLENGE → CONCLUDE)     │  │
│  │   • 3D Physical Knowledge Core (Three.js WebGL with bounded DPR)                               │  │
│  │   • Strategy Genome Topological Map & Macro Stress Cockpit                                     │  │
│  └──────────────────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                                 │                                                    │
│                                                 ▼                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 2. AUTONOMOUS RESEARCH ORCHESTRATOR                                                            │  │
│  │   • Falsifiable Hypothesis Generator (H1, H2, H3)                                              │  │
│  │   • Bounded Experiment Planner (Ceiling: MAX_TOOL_EXECUTIONS = 8)                              │  │
│  │   • Adversarial Contradiction Engine & Counterfactual Secondary Tests                          │  │
│  └──────────────────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                                 │ Dispatches                                         │
│                                                 ▼                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 3. REGISTERED QUANTITATIVE TOOL REGISTRY (Strict Zod Schema Validation)                        │  │
│  │   • get_asset_metrics            • get_strategy_metrics       • get_benchmark_metrics          │  │
│  │   • get_correlation_matrix       • get_regime_performance     • get_drawdown_analysis          │  │
│  │   • get_robustness_analysis      • get_stress_result          • get_portfolio_metrics          │  │
│  │   • get_monte_carlo_risk         • get_regime_monte_carlo     • get_strategy_genome            │  │
│  └──────────────────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                                 │ Executes                                           │
│                                                 ▼                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 4. DETERMINISTIC QUANTITATIVE ENGINES (Pure TypeScript & Web Workers)                          │  │
│  │   • 1,825 Synchronized Daily Bars (Gold, Bitcoin, NVIDIA: 2019–2023)                           │  │
│  │   • Next-Bar (t+1) Execution Backtester with 10 bps Turnover Friction                          │  │
│  │   • Convex Simplex Portfolio Optimizer & Euler Risk Decomposition (MRC, CRC, PRC)              │  │
│  │   • Historical Non-Parametric Tail Risk Engine (VaR95, CVaR95 positive loss convention)        │  │
│  │   • 10,000-Path Correlated Cholesky Monte Carlo Simulation (Off-Thread Web Worker)             │  │
│  │   • 4-State Empirical Markov Regime Switcher & Conditional Bootstrap                           │  │
│  └──────────────────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                                 │ Produces Immutable Typed Records                   │
│                                                 ▼                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 5. EVIDENCE GRAPH & DECISION AUDIT SUBSYSTEM                                                   │  │
│  │   • Directed Acyclic Graph (DAG) connecting Inquiry → Hypotheses → Evidence → Claims           │  │
│  │   • Canonical ResearchManifest Serialization (Key-Sorted JSON + 8-Decimal Float Normalization) │  │
│  │   • SHA-256 Output Fingerprint Generator (`computeDeterministicHash`)                          │  │
│  │   • 6-Rank Replay Mismatch Hierarchy (SCHEMA > TOOL > DATA > CONFIG > EVIDENCE > NUMERICAL)    │  │
│  │   • In-Memory / LocalStorage Repository Store (`globalResearchCaseStore`)                      │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┬────────────────────────────────────────────────────┘
                                                  │ Validated Pack Payload
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SERVER-SIDE AI INTEGRATION PROXY (NODE.JS / VITE MIDDLEWARE)                                         │
│                                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 6. SERVER API GATEWAY (`/api/ai/chat`, `/api/ai/research`, `/api/risk-brief`, `/api/web/search`)│  │
│  │   • Server-Side Credential Isolation (FEATHERLESS_API_KEY, GEMINI_API_KEY, TAVILY_API_KEY)     │  │
│  │   • 4-Mode Intent Router Firewall (GENERAL, BLACKBOX, WEB, HYBRID)                             │  │
│  │   • Prompt Injection & Regex Sanitizer (`sanitizePromptText`)                                  │  │
│  │   • Grounded Output Validator (`validateRiskCommitteeBrief` / Zero Numerical Hallucinations)  │  │
│  │   • Deterministic Mock Fallback Generator (Guarantees 100% offline usability)                  │  │
│  └──────────────────────────────────────────────┬─────────────────────────────────────────────────┘  │
│                                                 │ Proxied Prompt
                                                  ▼
                                       ┌─────────────────────┐
                                       │ EXTERNAL AI CLOUDS  │
                                       │ • Featherless LLM   │
                                       │ • Google Gemini SDK │
                                       │ • Tavily Web Search │
                                       └─────────────────────┘
```

---

## 2. Component Decoupling Invariants

### 1. Arithmetic Prohibition for LLMs
- Large Language Models are strictly prohibited from generating, guessing, or performing financial arithmetic.
- All numbers cited in research memos originate from immutable `EvidenceRecord` objects produced by local TypeScript engines.
- If an LLM response references a metric not found in the evidence payload, the brief fails validation and triggers deterministic fallback.

### 2. Temporal & Look-Ahead Isolation
- Trading signals calculated at bar $t$ close are prohibited from knowing price data at bar $t+1$.
- Strategy order fills occur exclusively at bar $t+1$ with an explicit 10 bps ($0.10\%$) turnover penalty.
- Buy & Hold benchmark equity curves are computed independently from active strategy curves to prevent allocation bleeding.

### 3. Execution Boundary & Sandboxing
- The Autonomous Research Agent cannot execute arbitrary code strings or shell commands.
- All investigation steps must select from the 12 registered tools in `src/core/aiTools.ts`.
- Bounded execution ceiling: a hard cap of 8 tool invocations prevents infinite autonomous loops.

### 4. Deterministic Simulation Seed Invariant
- Correlated Cholesky Monte Carlo and Markov simulations use Mulberry32 32-bit PRNG.
- Replaying a sealed research case using the recorded seed integer produces a 100% bit-identical terminal wealth and drawdown distribution.

---

## 3. Data Flow Progression (End-to-End Inquiry)

```
[User Question: "Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?"]
                                 │
                                 ▼
                     [Scope & Window Extraction]
                     Asset: BTC | Window: 2020-01-01 to 2023-12-31 (1,461 bars)
                                 │
                                 ▼
                  [Hypothesis Engine Generation]
                  H1: High Volatility whipsaw drag
                  H2: Execution turnover friction drag
                  H3: Drawdown recovery lag
                                 │
                                 ▼
                   [Bounded Experiment Planning]
                   EXP-01: get_strategy_metrics (EMA_TREND)
                   EXP-02: get_benchmark_metrics (BUY_AND_HOLD)
                   EXP-03: get_regime_performance (BTC)
                   EXP-04: get_robustness_analysis (Friction sweep)
                                 │
                                 ▼
               [Deterministic Tool Execution & Packing]
               Native TypeScript engines calculate return deltas,
               regime frequencies, and Sharpe stability bands.
                                 │
                                 ▼
                 [Adversarial Contradiction Check]
                 Contradiction Engine detects friction accounts for only 4.2%
                 of underperformance, refuting H2. High Volatility whipsaw
                 explains 91.3% of drag, supporting H1.
                                 │
                                 ▼
                    [Targeted Secondary Test]
                    EXP-05: get_drawdown_analysis (Examines peak-to-trough lags)
                                 │
                                 ▼
                [Institutional Research Memo Synthesis]
                15-section structured briefing separating Direct Evidence
                from Analytical Interpretation.
                                 │
                                 ▼
                  [Cryptographic Sealing & Replay]
                  ResearchCase sealed with SHA-256 fingerprint.
                  Replay engine re-executes manifest and certifies MATCHED status.
```
