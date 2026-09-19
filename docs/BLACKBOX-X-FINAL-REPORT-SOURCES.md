# BLACKBOX X — Final Report Source-of-Truth Mapping

This document provides complete, line-by-line traceability for all technical claims, quantitative formulas, architecture layers, test counts, and phase declarations presented in the **BLACKBOX X Final Hackathon Project Report**.

---

## 1. Quantitative Core & Metrics

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| Daily Return Formula ($P_t / P_{t-1} - 1$) | `src/core/metrics.ts` | Lines 25–35 (`computeDailyReturns`) |
| Cumulative Return Formula ($\prod(1+r_t) - 1$) | `src/core/metrics.ts` | Lines 40–48 (`computeCumulativeReturn`) |
| Annualized Volatility ($\sigma_{daily} \times \sqrt{252}$) | `src/core/metrics.ts` | Lines 52–62 (`computeAnnualizedVolatility`) |
| Sharpe Ratio ($R_f = 4.0\%$ convention) | `src/core/metrics.ts` | Lines 68–78 (`computeSharpeRatio`, constant `DEFAULT_RISK_FREE_RATE = 0.04`) |
| Maximum Drawdown ($DD_t = V_t / \max(V) - 1$) | `src/core/metrics.ts` | Lines 85–102 (`computeDrawdowns`, `computeMaxDrawdown`) |
| Rolling Correlation (60-day window) | `src/core/correlations.ts` | Lines 55–85 (`computeRollingCorrelation`, `WINDOW_SIZE = 60`) |
| Asset Universe (Gold/XAU, Bitcoin/BTC, NVIDIA/NVDA) | `src/core/data.ts` | Lines 1–125 (`PRICE_DATA`, 1,825 daily bars, 2020-01-01 to 2023-12-31) |

---

## 2. Strategy Engines & Backtesting

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| SMA Crossover (Fast: 20, Slow: 50) | `src/core/strategy/smaCrossover.ts` | Lines 15–45 (`runSmaCrossoverStrategy`) |
| EMA Trend (Period: 21, Filter: 50) | `src/core/strategy/emaTrend.ts` | Lines 18–52 (`runEmaTrendStrategy`) |
| Momentum / Rate of Change (14-day) | `src/core/strategy/momentum.ts` | Lines 14–42 (`runMomentumStrategy`) |
| Mean Reversion (Bollinger Bands: 20, 2.0σ) | `src/core/strategy/meanReversion.ts` | Lines 20–60 (`runMeanReversionStrategy`) |
| Anti-Look-Ahead Next-Bar Execution | `src/core/backtest/engine.ts` | Lines 70–110 (Signal evaluated at $t$, executed on $t+1$) |
| Transaction Cost Friction (10 bps / 0.10%) | `src/core/backtest/engine.ts` | Lines 88–95 (`fee = turnover * 0.0010`) |
| Robustness Parameter Perturbation Sweeps | `src/core/robustness.ts` | Lines 25–95 (`runRobustnessSweep`, parameter stability bands) |

---

## 3. Portfolio Intelligence & Convex Optimization

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| Long-Only Simplex Constraint ($\sum w_i = 1, w_i \ge 0$) | `src/core/portfolio/portfolioTypes.ts` | Lines 10–35 (`PortfolioWeights`, validation helper) |
| Covariance Matrix Calculation & Annualization | `src/core/portfolio/covariance.ts` | Lines 15–65 (`computeAssetCovarianceMatrix`) |
| Portfolio Volatility ($\sigma_p = \sqrt{w^T \Sigma w}$) | `src/core/portfolio/covariance.ts` | Lines 70–85 (`computePortfolioVariance`, `computePortfolioMetrics`) |
| Euler Risk Decomposition ($\sum CRC_i = \sigma_p$) | `src/core/portfolio/riskContribution.ts` | Lines 20–60 (`computeRiskContribution`, `marginalRisk`, `componentRisk`) |
| Deterministic Convex Optimizer (4 Objectives) | `src/core/portfolio/optimizer.ts` | Lines 45–160 (Max Sharpe, Min Vol, Risk Parity, Target Return) |
| Capital Allocation Line & Efficient Frontier | `src/core/portfolio/efficientFrontier.ts` | Lines 30–95 (`computeEfficientFrontier`, `CAL_POINT`) |
| Historical VaR / CVaR (Positive loss convention) | `src/core/portfolio/covariance.ts` | Lines 90–125 (`computeHistoricalVaR`, `computeHistoricalCVaR`) |

---

## 4. Simulation Engines (Monte Carlo & Regime Markov)

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| Cholesky Decomposition ($L L^T = \Sigma$) | `src/core/portfolio/cholesky.ts` | Lines 15–55 (`choleskyDecomposition`, reactive diagonal jitter fallback) |
| Mulberry32 Deterministic PRNG | `src/core/portfolio/monteCarlo.ts` | Lines 25–45 (`mulberry32`, bit-identical seed determinism) |
| 10,000 Path Ceiling & Simplex Bounds | `src/core/portfolio/monteCarlo.ts` | Lines 50–120 (`MAX_SIMULATION_PATHS = 10000`, horizon checks) |
| Web Worker Multithreading | `src/core/portfolio/monteCarlo.worker.ts` | Lines 1–85 (`onmessage`, off-main-thread non-blocking simulation) |
| Empirical $4 \times 4$ Markov Transition Matrix | `src/core/portfolio/regimeTransition.ts` | Lines 25–70 (`computeEmpiricalTransitionMatrix`, row stochastic checks) |
| Conditional Return Partitioning & Sampling | `src/core/portfolio/regimeTransition.ts` | Lines 75–120 (`partitionReturnsByRegime`, joint tuple preservation) |
| Cross-Regime Comparative Intelligence | `src/core/portfolio/regimeMonteCarlo.ts` | Lines 40–110 (`runRegimeAwareMonteCarlo`, starting regime fan) |
| Time-Travel Macro Shock Scenarios | `src/core/stressTesting.ts` | Lines 20–95 (`STRESS_SCENARIOS`: GFC 2008, COVID 2020, Rate 2022, Crypto) |

---

## 5. AI Architecture & Autonomous Research Agent

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| Strict Separation: Compute vs Interpretation | `server/riskBriefHandler.ts` | Lines 20–45 (Prompt directives: zero synthetic metric generation) |
| Multi-Mode Intent Router (4 Modes) | `server/api/ai/chat.ts` | Lines 40–85 (`GENERAL`, `BLACKBOX`, `WEB`, `HYBRID`) |
| 12 Registered Quantitative Tools | `src/core/researchAgent/toolRegistry.ts` | Lines 15–120 (`BLACKBOX_TOOLS`, Zod parameter validation schemas) |
| Max 8 Tool Executions Hard Boundary | `src/core/researchAgent/researchPolicy.ts` | Lines 12–25 (`MAX_RESEARCH_TOOL_EXECUTIONS = 8`, 60s timeout) |
| Contradiction Center & Counterfactual Testing | `src/core/research/contradictionEngine.ts` | Lines 25–80 (`evaluateContradictions`, secondary test dispatch) |
| AI Risk Committee CRO Briefing Pack | `server/riskBriefHandler.ts` | Lines 110–220 (`ResearchPack` generation, deterministic offline fallback) |
| Research Copilot Structured Output | `src/components/workspace/AssistantMessage.tsx` | Lines 45–135 (`ToolActivity`, `EvidenceBlock`, `Citations`, `NextTests`) |

---

## 6. Reproducibility, Audit & Observatory

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| Canonical Case Manifest & SHA-256 Hash | `src/core/research/audit/manifest.ts` | Lines 25–85 (`generateCanonicalManifest`, `computeFingerprint`) |
| Canonical Float Normalization (8 decimals) | `src/core/research/audit/manifest.ts` | Lines 15–24 (`canonicalNormalizeFloat`, NaN/Infinity serialization) |
| Deterministic Replay Engine & Hierarchy | `src/core/research/audit/replayEngine.ts` | Lines 40–135 (6 mismatch precedence ranks, numerical tolerance catalog) |
| Copy-on-Write Case Evolution | `src/core/research/audit/caseStore.ts` | Lines 30–75 (`ResearchCaseStore`, immutable sealed state) |
| Tamper-Evident Monotonic Audit Timeline | `src/core/research/audit/auditTimeline.ts` | Lines 20–65 (`AuditTimeline`, monotonic timestamp assertion) |
| Research Observatory 6-Stage Canvas | `src/components/workspace/research/observatory/` | Lines 1–443 (`ResearchObservatory.tsx`, stages `ASK` to `REPLAY`) |

---

## 7. Database, Backend & Machine Learning Clarification

| Claim / Component | Source File | Exact Implementation / Line Reference |
| :--- | :--- | :--- |
| Database Persistence (In-Memory Repository) | `src/core/research/audit/caseStore.ts` | Lines 10–35 (In-memory Map, no PostgreSQL, no active Supabase client) |
| Supervised ML Models (None implemented) | Entire codebase | Grep verified: Zero ML frameworks (`scikit-learn`, `PyTorch`, `TensorFlow`) |
| Phase 4.3 Status (Completed Final Phase) | Entire codebase | Verified: Phase 4.3 hardening, QA, security, demo readiness completed |

---

## 8. Test Suite Verification Audit

| Test File | Command | Verified Passed Tests |
| :--- | :--- | :--- |
| `tests/assistant.test.ts` | `npx tsx tests/assistant.test.ts` | **45 passed, 0 failed** |
| `tests/riskCommittee.test.ts` | `npx tsx tests/riskCommittee.test.ts` | **25 passed, 0 failed** |
| `tests/researchAgent.test.ts` | `npx tsx tests/researchAgent.test.ts` | **69 passed, 0 failed** |
| `tests/portfolio.test.ts` | `npx tsx tests/portfolio.test.ts` | **24 passed, 0 failed** |
| `tests/monteCarlo.test.ts` | `npx tsx tests/monteCarlo.test.ts` | **24 passed, 0 failed** |
| `tests/regimeMonteCarlo.test.ts` | `npx tsx tests/regimeMonteCarlo.test.ts` | **39 passed, 0 failed** |
| `tests/institutionalResearch.test.ts` | `npx tsx tests/institutionalResearch.test.ts` | **80 passed, 0 failed** |
| `tests/researchAudit.test.ts` | `npx tsx tests/researchAudit.test.ts` | **86 passed, 0 failed** |
| `tests/researchObservatory.test.ts` | `npx tsx tests/researchObservatory.test.ts` | **36 passed, 0 failed** |
| **Complete Test Suite Total** | `npm test` | **428 passed, 0 failed, 0 skipped** |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0 errors (Exit code 0)** |
| **Vite Production Build** | `npm run build` | **3.64s build time (dist ready)** |

