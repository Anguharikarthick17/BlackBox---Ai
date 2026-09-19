# BLACKBOX X — Hackathon Problem Statement Compliance Matrix

**Project:** BLACKBOX X  
**Track:** Quantitative Multi-Asset Financial Intelligence & Backtesting Platform  
**Compliance Level:** 100% Full Implementation & Verified  
**Build Status:** Clean TypeScript build (`tsc --noEmit`), Vite production bundle (`npm run build`)  

---

## 1. Core Problem Statement Requirements vs. Codebase Mapping

| Requirement Area | Problem Statement Specification | Implementation in BLACKBOX X | Key Files & Functions |
|---|---|---|---|
| **Multi-Asset Historical Data Processing** | Process historical market data for Gold, Bitcoin, and NVIDIA across multi-year period. Calibrated metrics, clean data types. | 5 years of daily OHLCV series (1,826 records/asset) for Gold (`GOLD`), Bitcoin (`BTC`), and NVIDIA (`NVDA`). Deterministic, reproducible, and normalized base-100 series. | [`src/core/data.ts`](file:///Users/angu/Documents/BlackBox/src/core/data.ts): `PRICE_DATA`, `getDataInRange`, `MarketDataProvider`, `OfflineDemoProvider` |
| **Quantitative Indicators & Metrics** | Returns, Annualized Return, Volatility (ann.), Sharpe Ratio (rf=4%), Maximum Drawdown, Calmar Ratio, Rolling Returns, Rolling Volatility, Rolling Sharpe. | Mathematically rigorous quant core. Handles zero-variance guards, peak tracking, compound returns, and annualized conversion factors. | [`src/core/metrics.ts`](file:///Users/angu/Documents/BlackBox/src/core/metrics.ts): `computeMetrics`, `computeRollingVolatility`, `computeRollingSharpe`, `computeRollingReturns`, `computeDrawdownSeries` |
| **Cross-Asset Correlation Analysis** | Pearson correlation of daily returns, cross-asset correlation matrix, rolling correlation analysis across time windows. | Full 3×3 Pearson correlation matrix of daily log returns, pairwise strength breakdown, and interactive rolling correlation engine (30d, 60d, 90d windows). | [`src/core/correlations.ts`](file:///Users/angu/Documents/BlackBox/src/core/correlations.ts): `computeCorrelationMatrix`, `computeRollingCorrelation`<br>[`src/components/workspace/CorrelationView.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/CorrelationView.tsx) |
| **Strategy Backtesting Suite** | SMA Crossover, EMA Trend, Momentum, Mean Reversion. Configurable lookbacks, thresholds, and triggers. | 4 standard quantitative strategies with parameter validation, signal generation (+1 LONG, 0 CASH), and indicators overlay. | [`src/core/strategies.ts`](file:///Users/angu/Documents/BlackBox/src/core/strategies.ts): `generateSignals`, `computeSMA`, `computeEMA`, `STRATEGY_DESCRIPTIONS` |
| **Realistic Execution & Anti-Bias Simulation** | Initial capital, fractional/fixed position sizing, per-trade transaction costs/slippage, **Next-Bar Execution** to eliminate look-ahead bias. | Simulation computes signal at Close $t$ and fills trade at Close $t+1$. Deducts proportional transaction friction on entry & exit. Tracks capital path and individual trade logs. | [`src/core/backtest.ts`](file:///Users/angu/Documents/BlackBox/src/core/backtest.ts): `runBacktest`, `Trade`, `BacktestConfig`, `signalSeries` |
| **Benchmark Comparison (Strategy vs Buy & Hold)** | Compare strategy directly against Buy & Hold benchmark on: Total Return, Volatility, Sharpe Ratio, Maximum Drawdown. | Dedicated side-by-side benchmark comparison matrix displaying Strategy vs. Buy & Hold across all 4 required risk-adjusted metrics plus alpha/delta and final capital. | [`src/core/backtest.ts`](file:///Users/angu/Documents/BlackBox/src/core/backtest.ts): `buyHoldReturn`, `buyHoldSharpe`, `buyHoldVolatility`, `buyHoldMaxDrawdown`<br>[`src/components/workspace/StrategyLab.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/StrategyLab.tsx) |
| **Robustness & Parameter Sensitivity Testing** | Run strategy across parameter ranges and cost assumptions. Detect over-optimization and parameter cliffs. | Dedicated **Robustness Lab** section. Evaluates parameter sweeps (e.g., varying moving average windows) and cost sensitivity grids (0.05% to 0.30%). Flags fragility, win consistency, and parameter degradation. | [`src/core/robustness.ts`](file:///Users/angu/Documents/BlackBox/src/core/robustness.ts): `runRobustnessSweep`, `RobustnessResult`<br>[`src/components/workspace/RobustnessLab.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/RobustnessLab.tsx) |
| **Market Regime Detection** | Classify periods into market regimes (Bull, Bear, High Volatility, Low Volatility) and evaluate strategy/asset behavior within regimes. | Dynamic regime classification combining rolling 60d return and annualized volatility. Calculates real sub-period Sharpe, Win Rate, and Return for each regime. | [`src/core/regimes.ts`](file:///Users/angu/Documents/BlackBox/src/core/regimes.ts): `detectRegimes`, `computeRegimeStats`, `RegimeSummary`<br>[`src/components/workspace/MarketRegimes.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/MarketRegimes.tsx) |
| **Interactive Visualizations & 3D Environment** | Professional financial research visualization, 3D asset relationship universe, responsive charts, no generic fintech dashboards. | Recharts-based interactive charts (Equity, Signals & Indicators, Drawdowns, Rolling Volatility, Rolling Returns, Rolling Correlation), 3D Three.js canvas visualizing cross-asset volatility & correlation tension. | [`src/components/charts/Charts.tsx`](file:///Users/angu/Documents/BlackBox/src/components/charts/Charts.tsx)<br>[`src/components/three/AssetUniverse.tsx`](file:///Users/angu/Documents/BlackBox/src/components/three/AssetUniverse.tsx) |
| **Audit Trail & Research Provenance ("Ghost Mode")** | Reproducible research, history tracking, hypothesis testing without state contamination. | Ghost Mode log capturing parameter adjustments, backtest executions, and quantitative observations with timestamps. | [`src/components/workspace/ResearchTrail.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/ResearchTrail.tsx)<br>[`src/store/researchStore.ts`](file:///Users/angu/Documents/BlackBox/src/store/researchStore.ts) |

---

## 2. Mathematical Rigor & Anti-Bias Verification

### A. Look-Ahead Bias Prevention (Next-Bar Execution)
In `src/core/backtest.ts`:
```typescript
// Signal computed at bar i using data up to close[i]
const sig = signals[i];

// Execution occurs at bar i+1 close
const execPrice = prices[i + 1].close;
```
- Trader observes end-of-day signal at bar $t$.
- Fill price is strictly bar $t+1$ close.
- Zero future data is leaked into signal formation or execution pricing.

### B. Realistic Transaction Cost Friction
In `src/core/backtest.ts`:
- Entry cost: `positionValue * transactionCostPct` deducted immediately on entry.
- Exit cost: `exitValue * transactionCostPct` deducted upon trade exit.
- Preserves cash compounding and prevents unrealistic high-frequency profitability.

### C. True Risk-Adjusted Buy & Hold Comparison
In `src/core/backtest.ts`:
- Buy & Hold equity curve is tracked day-by-day alongside strategy equity using identical initial capital.
- Sharpe, Annualized Volatility, and Maximum Drawdown are computed from the benchmark equity series, guaranteeing identical statistical basis.

---

## 3. Verified Build & Execution Status
- **TypeScript Compiler Check:** `npx tsc --noEmit` → **Exit Code 0** (No errors or type warnings).
- **Vite Production Build:** `npm run build` → **Exit Code 0** (3,112 modules transformed in 2.92s).
- **Architecture:** Clean decoupling of Quantitative Core (`src/core/`), React UI Components (`src/components/`), Three.js Canvas (`src/components/three/`), and State Management (`src/store/`).

---

## 4. Phase 3.1 — Ghost Mode 2.0: Dynamic Quantitative Research Trail

### A. Architecture & Research Pipeline
Ghost Mode 2.0 transforms traditional static journaling into an automated, deterministic quantitative reasoning pipeline:
$$\text{OBSERVATION} \longrightarrow \text{HYPOTHESIS} \longrightarrow \text{EVIDENCE} \longrightarrow \text{IMPACT} \longrightarrow \text{NEXT TEST}$$

- **Core Module:** [`src/core/insights.ts`](file:///Users/angu/Documents/BlackBox/src/core/insights.ts)
- **UI Presentation:** [`src/components/workspace/ResearchTrail.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/ResearchTrail.tsx)
- **State Integration:** [`src/store/researchStore.ts`](file:///Users/angu/Documents/BlackBox/src/store/researchStore.ts)

### B. Seven Deterministic Insight Categories
1. **`VOLATILITY_SHIFT`**: Detects when 30-day rolling annualized volatility deviates materially ($> \pm 3\%$) from the 5-year historical baseline. Explains signal-to-noise implications on trend indicators.
2. **`STRATEGY_PERFORMANCE`**: Compares strategy total return, annualized return, Sharpe ratio, and ending capital against the Buy & Hold benchmark. Accurately reports measured alpha and Sharpe delta.
3. **`DRAWDOWN_PRESSURE`**: Evaluates peak-to-trough capital preservation vs. passive holding. Formulates cash allocation hypotheses and reports the single worst trade loss.
4. **`COST_PRESSURE`**: Analyzes trade turnover frequency against per-trade friction rates. Determines whether trading churn degrades compound net growth.
5. **`CORRELATION_SHIFT`**: Evaluates pairwise 60-day rolling correlation shifts between selected asset and peers (e.g. BTC vs NVDA). Identifies macro coupling vs diversification decoupling.
6. **`REGIME_BEHAVIOR`**: Maps strategy Sharpe, win rate, and returns across classified market regimes (Bull, Bear, High Volatility, Low Volatility). Pinpoints structural regime asymmetry.
7. **`ROBUSTNESS_STABILITY`**: Consumes parameter sweep matrices to calculate consistency rates and return dispersion. Identifies parameter cliff risks vs structural robustness.

### C. Strict Zero-Fabrication Rule
- **No Mock or Hallucinated Data:** Ghost Mode 2.0 never invents arbitrary percentages, trade counts, or dollar figures.
- **Engine Traceability:** Every evidence metric cites its source (`metrics-engine`, `backtest-engine`, `regime-engine`, `robustness-engine`, `correlation-engine`).
- **Data Provenance:** Clearly badges the underlying historical simulation as an *Offline Calibrated Research Dataset (2019–2023)* with zero look-ahead bias and no claim of live financial advice.

### D. Interactive Experimentation ("Next Test" Actions)
Each insight node provides a direct interactive experiment that dispatches typed state actions:
- `UPDATE_PARAMS`: Adjusts smoothing periods (e.g. wider SMA/EMA windows to resist high volatility).
- `SET_TRANSACTION_COST`: Stress-tests execution by scaling friction to 0.25%.
- `RUN_ROBUSTNESS`: Fires the multi-configuration sweep engine and navigates to Robustness Lab.
- `NAVIGATE`: Seamlessly jumps to Quantitative Analysis, Strategy Lab, Correlation View, or Market Regimes.

### E. Analyst Notebook Session Persistence
- Researchers can click **"Pin to Notebook"** on any active insight to preserve findings.
- Pinned notes remain accessible across research workflows within the session, enabling comparative hypothesis tracking.

### F. Limitations
- **Offline Dataset:** Calibrated to 2019–2023 market parameters (drift, volatility, and jump characteristics); does not connect to live streaming exchange feeds.
- **Execution Model:** Daily close-of-bar simulation (next-bar close fill); does not simulate intra-day tick book microstructure or limit order book queue position.

---

## 5. Phase 3.2 — Time-Travel Macro Shock Lab (Stress-Testing Engine)

### A. Purpose & Architecture
The **Time-Travel Macro Shock Lab** allows researchers to stress-test any quantitative strategy and asset portfolio against modeled macro crisis scenarios, quantifying capital destruction, volatility spikes, correlation convergence, and recovery trajectories.

- **Core Module:** [`src/core/stressTesting.ts`](file:///Users/angu/Documents/BlackBox/src/core/stressTesting.ts)
- **UI Interface:** [`src/components/workspace/StressLab.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/StressLab.tsx)
- **Mathematical Methodology:** [`docs/STRESS-METHODOLOGY.md`](file:///Users/angu/Documents/BlackBox/docs/STRESS-METHODOLOGY.md)
- **State Store:** [`src/store/researchStore.ts`](file:///Users/angu/Documents/BlackBox/src/store/researchStore.ts)

### B. Scenario Archetypes
1. **`2008 Style — Global Financial Crisis`**: Systemic liquidity freeze, concave drawdown cascade ($-38\%$, 45d), $2.2\times$ vol expansion, prolonged 140d recovery.
2. **`2020 Style — COVID Liquidity Crash`**: Rapid flash compression ($-32\%$, 16d), violent $2.8\times$ vol expansion, rapid 45d V-shaped recovery.
3. **`2022 Style — Rate Hike Shock`**: Persistent duration and multiple compression ($-28\%$, 60d), $1.7\times$ vol multiplier, 100d gradual recovery.
4. **`Crypto Contagion Crash`**: Idiosyncratic sector leverage unwind ($-55\%$, 22d), $3.2\times$ vol expansion, isolated to BTC ($2.10\times$ sensitivity) with minimal macro contagion.
5. **`Custom Parameterized Shock`**: Researcher-calibrated shock magnitude ($-5\%$ to $-60\%$), shock duration, vol multiplier ($1.0\times$ to $3.5\times$), recovery period, and custom asset sensitivities.

### C. Continuous Mathematical Shock Model
$$P_{\text{stressed}}(t) = P_{\text{base}}(t) \cdot \max\left(0.05, \, 1 + D(t) \cdot \lambda_{\text{asset}} + \epsilon_{\text{vol}}(t)\right)$$
- Continuous S-curve descent: $D(\tau) = D_{\text{base}} \cdot \frac{1 - \cos(\pi \tau)}{2}$.
- Deterministic harmonic micro-volatility: seeded pseudo-random function guarantees identical reproducible output on every run.
- Preserves backtest rules: identical next-bar execution, per-trade transaction friction ($0.10\%$), and position sizing.

### D. Stress Damage Report & Analytics
- **Stress Comparison KPI Matrix**: Baseline vs Stressed Max Drawdown, Return Delta, Sharpe Delta, Volatility Delta, Capital Delta, and Recovery Days.
- **Interactive Time-Travel Scrub Slider**: Scrub from 0% to 100% of the timeline to inspect stressed price, portfolio equity, delta vs baseline, and prevailing regime phase in real time.
- **Crisis Correlation Convergence**: Compares 5-year baseline Pearson correlation against the acute crisis period, capturing how diversification breaks down during panics.
- **Ghost Mode 2.0 Integration**: Automatically generates `STRESS_SENSITIVITY`, `RECOVERY_PRESSURE`, and `CORRELATION_CONVERGENCE` analytical pipeline cards when stress tests are executed.

### E. Data Provenance & Limitations
- **Simulated Stress Scenario — Not a Historical Price Replay**: Scenarios are parameterized mathematical models inspired by historical market shapes; they do not claim to reproduce actual tick-by-tick crisis quotes.
- **No Forward Predictions**: Stress tests serve to evaluate mechanical vulnerability and recovery latency, not to guarantee future real-world survival.

---

## 6. Phase 3.3 — Strategy Genome: Quantitative Relationship Network

### A. Concept & Purpose
Strategy Genome provides an interactive structural relationship graph that enables researchers to visually explore the interconnected topology of:
$$\text{ASSETS} \longleftrightarrow \text{CORRELATIONS} \longleftrightarrow \text{VOLATILITY} \longleftrightarrow \text{STRATEGIES} \longleftrightarrow \text{MARKET REGIMES} \longleftrightarrow \text{STRESS RESPONSE}$$

The engine answers the central structural question: *"How does the quantitative structure of this market and tested strategies transform across baseline, regime-shifted, and stressed market states?"*

- **Core Engine:** [`src/core/strategyGenome.ts`](file:///Users/angu/Documents/BlackBox/src/core/strategyGenome.ts)
- **UI Workspace Module:** [`src/components/workspace/StrategyGenome.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/StrategyGenome.tsx)
- **Comprehensive Reference:** [`docs/STRATEGY-GENOME.md`](file:///Users/angu/Documents/BlackBox/docs/STRATEGY-GENOME.md)
- **State Store Integration:** [`src/store/researchStore.ts`](file:///Users/angu/Documents/BlackBox/src/store/researchStore.ts)

### B. Graph Architecture & Layout Modes
The graph engine generates a fully typed `GenomeSnapshot` comprising deterministic `GenomeNode` and `GenomeEdge` records. It operates across four distinct layout modes:
1. **`MARKET` Mode**: Visualizes cross-asset nodes (Gold, Bitcoin, NVIDIA) positioned in a symmetrical equilateral topology. Edges represent pairwise Pearson correlations (static 5Y baseline or 30d/60d/90d rolling).
2. **`STRATEGY` Mode**: Positions the primary asset at center and projects tested strategies (SMA Crossover, EMA Trend, Momentum, Mean Reversion) radially, exposing individual backtest outcomes without competitive ranking.
3. **`REGIME` Mode**: Connects the active asset and active strategy to four classified market regimes (Bull, Bear, High Volatility, Low Volatility), presenting measured return, Sharpe, and win rates under each regime.
4. **`STRESS` Mode**: Directly consumes outputs from the Stress Lab (`stressResult`). Renders dual baseline vs. stressed node sizes (volatility expansion) and edge styles (crisis correlation convergence or decoupling).

### C. Node Categories & Mathematical Properties
- **`ASSET` Nodes**: Size is strictly proportional to normalized annualized volatility:
  $$\text{Radius} = r_{\min} + \frac{\sigma_{\text{ann}} - \sigma_{\min}}{\sigma_{\max} - \sigma_{\min}} \cdot (r_{\max} - r_{\min})$$
  Tooltips and Inspector detail: Asset, Annualized Return, Annualized Volatility, Sharpe Ratio, Maximum Drawdown.
- **`STRATEGY` Nodes**: Sized by risk-adjusted Sharpe ratio. Displays Total Return, Sharpe, Volatility, Max Drawdown, and Trade Count derived directly from `runBacktest()`.
- **`REGIME` Nodes**: Displays sub-period Return, Sharpe ratio, and Trade Win Rate computed by `computeRegimeStats()`.
- **`RISK_METRIC` Nodes**: Exposes foundational portfolio moments (Return, Volatility, Sharpe, Drawdown, Trade Turnover) in normalized 5D space.

### D. Edge Types & Non-Causal Semantics
- **Asset-to-Asset Edges**: Edge thickness is scaled to Pearson absolute correlation:
  $$\text{StrokeWidth} = w_{\min} + |\rho| \cdot (w_{\max} - w_{\min})$$
  - **Positive Correlation ($\rho \ge 0$)**: Solid line representation.
  - **Negative Correlation ($\rho < 0$)**: Dashed line representation (`stroke-dasharray="6,4"`).
  - **Descriptive Provenance**: Strictly labeled as "Correlation" or "Pairwise Relationship". Never uses causal labels such as "Influence", "Driver", "Impacts", or "Predicts".
- **Asset-to-Strategy Edges**: Solid directional link connecting target asset to backtested rules.
- **Strategy-to-Regime Edges**: Indicates environmental performance breakdown across market states.

### E. Static vs. Rolling Correlation
- **Static Mode**: Evaluates the full 5-year Pearson correlation matrix computed by `computeCorrelationMatrix()`.
- **Rolling Mode**: Computes dynamic rolling correlation over configurable windows ($30\text{D}$, $60\text{D}$, $90\text{D}$) via `computeRollingCorrelation()`. Edge thickness and inspector statistics reflect the latest rolling window point.

### F. Strategy Risk Fingerprint (5D Radar Model)
Renders a compact, 5-dimensional research fingerprint of the active strategy:
- Return ($\mu$)
- Annualized Volatility ($\sigma$)
- Sharpe Ratio ($S$)
- Maximum Drawdown ($|\text{MDD}|$)
- Trade Turnover Frequency ($N_{\text{trades}}$)

All dimensions are calibrated to verified realistic historical bounds and display exact quantitative metrics.

### G. "Why This Relationship?" Quantitative Explanations
Selecting any correlation edge opens an analytical breakdown explaining:
- Target pair (e.g., `BTC ↔ NVDA`)
- Measured correlation coefficient ($\rho$)
- Calculation mode (Static 5-Year vs. Rolling $W$-day)
- Objective mathematical interpretation using strictly non-causal language.

### H. Data Integrity & Safeguards
- **Zero Fabrication**: Every number originates from `data.ts`, `metrics.ts`, `backtest.ts`, `correlations.ts`, `regimes.ts`, or `stressTesting.ts`.
- **No "Winner" Creation**: Strategies and assets are presented objectively for comparative diagnosis; no algorithm is labeled "BEST", "WINNER", or recommended for deployment.
- **Accessibility & Motion**: Complies with `prefers-reduced-motion` and provides visual cues beyond color (dash patterns, stroke weights, metric badges).

### I. Limitations
- **Linear Metric**: Pearson correlation captures linear co-movement; non-linear tail dependencies or copulas are not modeled.
- **Offline Simulation**: All inputs derive from calibrated 2019–2023 historical daily data; past structural relationships do not guarantee future regime stability.

---

## 7. Phase 3.4 — AI Risk Committee / CRO Briefing

### A. Core Architectural Philosophy
$$\text{BLACKBOX X CALCULATES} \quad\longleftrightarrow\quad \text{GEMINI INTERPRETS}$$

The deterministic quantitative engines remain the sole source of mathematical truth. Google Gemini never calculates financial formulas, never estimates prices, and never invents metrics. It acts as an analytical risk committee interpreter, ingesting a structured `ResearchPack` and generating an institutional-grade Chief Risk Officer (CRO) memo.

- **Research Pack Engine:** [`src/core/researchPack.ts`](file:///Users/angu/Documents/BlackBox/src/core/researchPack.ts)
- **Numerical Grounding Validator:** [`src/core/riskBriefValidator.ts`](file:///Users/angu/Documents/BlackBox/src/core/riskBriefValidator.ts)
- **Server API Handler:** [`server/riskBriefHandler.ts`](file:///Users/angu/Documents/BlackBox/server/riskBriefHandler.ts)
- **Client Service:** [`src/services/riskCommittee.ts`](file:///Users/angu/Documents/BlackBox/src/services/riskCommittee.ts)
- **UI Memo Component:** [`src/components/workspace/RiskCommittee.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/RiskCommittee.tsx)
- **Comprehensive Reference:** [`docs/AI-RISK-COMMITTEE.md`](file:///Users/angu/Documents/BlackBox/docs/AI-RISK-COMMITTEE.md)

### B. Gemini Integration & SDK Selection
- **Official SDK:** Implemented using `@google/genai` (current official Google GenAI JavaScript SDK).
- **Server-Side Key Isolation:** `GEMINI_API_KEY` is loaded strictly on the Node.js server/Vite middleware and never bundled into client assets.
- **Model Flexibility:** Configurable via `GEMINI_MODEL` (default: `gemini-2.5-flash`).
- **Data Minimization:** Raw price arrays (thousands of data points) are excluded; only derived summary moments and precalculated deltas are transmitted.

### C. Deterministic ResearchPack & State Fingerprinting
The `ResearchPack` aggregates verified findings across all 5 engines:
- Metadata & Provenance (Offline Calibrated 2019–2023)
- Strategy Backtest vs. Buy & Hold Benchmark
- Precalculated Deltas (Return, Volatility, Sharpe, MDD, Capital)
- Regime Breakdown & Dominant State
- Pairwise Correlation Matrix & Rolling Horizons
- Robustness Parameter Dispersion & Fragility Flags
- Stress Lab Crisis Loss & Recovery Days (strictly `null` if un-run)
- Strategy Genome 5D Fingerprint & Key Relationship Topology
- Ghost Mode 2.0 Deterministic Insight Summaries
- **Deterministic 64-bit FNV-1a Hash (`bx-...`)**: Ensures API calls only occur when underlying quantitative research state meaningfully changes.

### D. Structured CRO Output & Numerical Grounding Validation
Before any brief is rendered in the UI, it passes through the two-tier validator:
1. **Schema Validation**: Ensures all required memo sections exist (`executiveObservation`, `evidenceSummary`, `riskFactors`, `contradictions`, `stressAssessment`, `robustnessAssessment`, `relationshipAssessment`, `researchQuestions`, `limitations`, `disclaimer`).
2. **Numerical Grounding Validation**: Extracts all valid metric keys from the ResearchPack. Every evidence statement and risk factor must cite verified metric keys (e.g. `backtest.annualizedVolatility`, `comparison.returnDelta`). Unknown keys trigger immediate rejection.
3. **Hypothetical State Guarding**: If `pack.stress` is null, the validator forces `stressAssessment.executed = false`, completely preventing hallucinated crisis evaluations.

### E. Prompt Injection Resistance & Safety Policy
- All values inside the `ResearchPack` are treated strictly as **DATA**.
- Explicit system prompt instructions command the model to ignore any instructions embedded within labels, notes, or commentary.
- Disallows future price targets, directional buy/sell calls, or financial advice.

### F. Limitations
- **Offline Horizon Grounding**: Interpretations apply strictly to the 2019–2023 historical multi-asset simulation.
- **Execution Model**: Backtests rely on next-bar execution with $0.10\%$ friction, excluding intraday order book queuing or slippage variations.

---

## 8. Phase 3.5 — BLACKBOX AI Research Assistant

### A. Core Architectural Philosophy
$$\text{BLACKBOX Calculates} \quad\longleftrightarrow\quad \text{Featherless Interprets} \quad\longleftrightarrow\quad \text{Tavily Grounds}$$

Phase 3.5 extends the AI architecture into an interactive quantitative research console. The assistant operates as an institutional pair-researcher rather than a generic SaaS chatbot, connecting natural language intent to deterministic quantitative tool executions, contemporary web search, and evidence-grounded responses.

- **AI Provider Abstraction:** [`src/services/ai/AIProvider.ts`](file:///Users/angu/Documents/BlackBox/src/services/ai/AIProvider.ts)
- **Featherless Provider:** [`src/services/ai/FeatherlessProvider.ts`](file:///Users/angu/Documents/BlackBox/src/services/ai/FeatherlessProvider.ts)
- **Web Search Abstraction:** [`src/services/web/WebSearchProvider.ts`](file:///Users/angu/Documents/BlackBox/src/services/web/WebSearchProvider.ts)
- **Tavily Web Provider:** [`src/services/web/TavilyProvider.ts`](file:///Users/angu/Documents/BlackBox/src/services/web/TavilyProvider.ts)
- **Quantitative Tool Registry:** [`src/core/aiTools.ts`](file:///Users/angu/Documents/BlackBox/src/core/aiTools.ts)
- **Assistant Intent Router:** [`src/core/assistantRouter.ts`](file:///Users/angu/Documents/BlackBox/src/core/assistantRouter.ts)
- **Assistant Console UI:** [`src/components/workspace/BlackboxAssistant.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/BlackboxAssistant.tsx)
- **Comprehensive Documentation:** [`docs/BLACKBOX-AI-ASSISTANT.md`](file:///Users/angu/Documents/BlackBox/docs/BLACKBOX-AI-ASSISTANT.md)

### B. Execution Modes & Autonomous Intent Routing
1. **MODE 1 — GENERAL**: Educational explanations of financial engineering formulas (e.g. Sharpe ratio, VaR, maximum drawdown). No proprietary tool execution required.
2. **MODE 2 — BLACKBOX**: Quantitative inquiry executing deterministic BLACKBOX tools (`get_strategy_metrics`, `get_drawdown_analysis`, `get_regime_performance`, etc.).
3. **MODE 3 — WEB**: External market news retrieved through Tavily with verified citations and clickable source URLs.
4. **MODE 4 — HYBRID**: Synthesis of real-time web intelligence with historical/simulated BLACKBOX regime analysis, strictly differentiating historical backtest models from contemporary news reports.

### C. Quantitative Tool Registry (12 Deterministic Tools)
All tools execute native TypeScript quantitative engines with strict Zod schema validation:
- `get_asset_metrics`: Verified historical return, volatility, Sharpe, and drawdown.
- `get_strategy_metrics`: Next-bar execution backtest with 0.10% friction.
- `get_benchmark_metrics`: Buy & Hold comparison over identical dates.
- `get_regime_performance`: Performance breakdown across Bull, Bear, High Vol, Low Vol.
- `get_drawdown_analysis`: Peak-to-trough capital degradation and recovery.
- `get_correlation_matrix`: 3x3 Pearson correlation matrix across Gold, BTC, and NVDA.
- `get_rolling_correlation`: 30d, 60d, 90d rolling correlation dynamics.
- `get_robustness_analysis`: 18-configuration sweep identifying parameter cliffs.
- `get_stress_result`: Macro shock crisis simulation (Phase 3.2).
- `get_strategy_genome`: Topological graph network and 5D risk fingerprint (Phase 3.3).
- `get_research_trail`: Ghost Mode 2.0 quantitative hypotheses and insights (Phase 3.1).
- `get_risk_brief`: Phase 3.4 Research Pack and CRO briefing summaries.

### D. Security, Privacy & Prompt Injection Defenses
- **Zero Client-Side API Secrets**: `FEATHERLESS_API_KEY` and `TAVILY_API_KEY` reside strictly server-side.
- **Prompt Injection Neutralization**: All retrieved web search snippets and tool data are treated as untrusted DATA; text sanitization automatically removes prompt override sequences before LLM ingestion.
- **Safe Offline Fallback**: In the absence of an external API key, the system seamlessly transitions to deterministic offline evaluation, executing native tools and presenting verifiable evidence with zero metric fabrication.

### E. Institutional Research Console UI
- **Design Aesthetic**: Warm ivory (`#FAF8F4`), graphite (`#1A1917`), electric blue (`#1E6FFF`), clean borders.
- **Tool Activity Timeline**: Visual indicators displaying running tools, durations (ms), and statuses.
- **Verified Sources Drawer**: Domain chips, publication dates, and external links.
- **Quick Research Actions & Shortcuts**: Global `Cmd/Ctrl + K` shortcut and suggested research inquiry prompts.

---

## 9. Phase 3.9 — Regime-Aware Probabilistic Intelligence

### A. Mathematical Scope & Non-Predictive Architecture
- **Objective**: Evaluates how the simulated distribution of portfolio outcomes changes when conditioned on observed market regimes and empirical transition frequencies.
- **Strict Non-Predictive Charter**: Prohibits claims of market forecasting or crash predictions.
- **Four Analytical Tiers**: Strictly separates Historical Observation, Empirical Transition Estimation, Simulated Regime Paths, and Simulated Portfolio Outcomes.
- **Core Types & Contracts**: [`src/core/portfolio/regimeMonteCarloTypes.ts`](file:///Users/angu/Documents/BlackBox/src/core/portfolio/regimeMonteCarloTypes.ts)
- **Transition Engine**: [`src/core/portfolio/regimeTransition.ts`](file:///Users/angu/Documents/BlackBox/src/core/portfolio/regimeTransition.ts)
- **Conditional Return Pools**: [`src/core/portfolio/regimeConditionalReturns.ts`](file:///Users/angu/Documents/BlackBox/src/core/portfolio/regimeConditionalReturns.ts)
- **Simulation Engine**: [`src/core/portfolio/regimeMonteCarloEngine.ts`](file:///Users/angu/Documents/BlackBox/src/core/portfolio/regimeMonteCarloEngine.ts)
- **High-Level API & Cross-Regime Lab**: [`src/core/portfolio/regimeMonteCarlo.ts`](file:///Users/angu/Documents/BlackBox/src/core/portfolio/regimeMonteCarlo.ts)
- **Institutional UI**: [`src/components/workspace/portfolio/RegimeIntelligenceLab.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/portfolio/RegimeIntelligenceLab.tsx)
- **AI Tool Integration**: `get_regime_monte_carlo_risk` and `compare_regime_simulations` in [`src/core/aiTools.ts`](file:///Users/angu/Documents/BlackBox/src/core/aiTools.ts)
- **Comprehensive Methodology Document**: [`docs/REGIME-MONTE-CARLO-METHODOLOGY.md`](file:///Users/angu/Documents/BlackBox/docs/REGIME-MONTE-CARLO-METHODOLOGY.md)
- **Approved Architecture Source of Truth**: [`docs/REGIME-PROBABILISTIC-ARCHITECTURE.md`](file:///Users/angu/Documents/BlackBox/docs/REGIME-PROBABILISTIC-ARCHITECTURE.md)

### B. Mathematical Verification & Test Suite
- **Verification Suite**: [`tests/regimeMonteCarlo.test.ts`](file:///Users/angu/Documents/BlackBox/tests/regimeMonteCarlo.test.ts) (39/39 passing tests).
- **Zero Regression**: 226/226 total automated tests passing across Phases 3.4–3.9.
- **Clean TypeScript Build**: `npx tsc --noEmit` exits with 0 errors.
- **Clean Production Bundle**: `npm run build` succeeds in ~3.5s.

---

## 10. Phase 4.0 — Institutional Research Workspace

### A. Orchestration Architecture & Non-Duplication Contract
- **Objective**: Orchestrates an end-to-end institutional quantitative research workflow: `QUESTION → HYPOTHESIS → EXPERIMENT PLAN → EVIDENCE COLLECTION → ANALYSIS → CONTRADICTION CHECK → SECONDARY TEST → SYNTHESIS → REPRODUCIBLE MEMO`.
- **Zero Calculation Duplication**: Native quantitative engines (Phases 1–3.9) remain the sole source of quantitative truth. AI acts strictly as an inquiry planner and evidentiary interpreter.
- **Core Architecture Source of Truth**: [`docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md`](file:///Users/angu/Documents/BlackBox/docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md)
- **Methodology Reference**: [`docs/INSTITUTIONAL-RESEARCH-METHODOLOGY.md`](file:///Users/angu/Documents/BlackBox/docs/INSTITUTIONAL-RESEARCH-METHODOLOGY.md)
- **Core Engine Modules**: [`src/core/research/`](file:///Users/angu/Documents/BlackBox/src/core/research/) (`researchSession.ts`, `researchStateMachine.ts`, `researchToolRegistry.ts`, `researchPlanner.ts`, `researchEvidence.ts`, `researchGraph.ts`, `researchContradictions.ts`, `researchSecondaryTests.ts`, `researchSynthesis.ts`, `researchMemo.ts`, `researchFingerprint.ts`, `researchOrchestrator.ts`).
- **Institutional UI**: [`src/components/workspace/research/`](file:///Users/angu/Documents/BlackBox/src/components/workspace/research/) (`ResearchWorkspace.tsx`, `ResearchPlanView.tsx`, `HypothesisBoard.tsx`, `ExperimentTimeline.tsx`, `EvidenceGraph.tsx`, `ContradictionPanel.tsx`, `SecondaryTestPanel.tsx`, `ExperimentInspectorModal.tsx`, `ResearchMemoView.tsx`, `ResearchComparisonModal.tsx`, `ResearchProvenance.tsx`).
- **Workspace Navigation**: Mounted as `"Research Notebook"` in [`src/pages/Workspace.tsx`](file:///Users/angu/Documents/BlackBox/src/pages/Workspace.tsx).

### B. Core Guardrails & Evidentiary Safeguards
1. **Tool Allowlist**: Central registry of 16 quantitative tool families. Rejects arbitrary or unknown tool calls.
2. **Budget Enforcement**: Hard execution ceiling of 8 experiments, 2 secondary tests, and 60-second timeout.
3. **Idempotency**: Deterministic experiment fingerprints prevent redundant tool executions.
4. **Separation Contract**: Strict separation between Direct Evidence (factual quantitative observations) and Analytical Interpretation.
5. **Numerical Claim Binding**: Every metric in the Research Memo must bind to a verified `EvidenceRecord`. Unbound claims are rejected.
6. **Acyclic Evidence Graph**: Validated via Kahn's algorithm; non-causal topological links.
7. **Adversarial Contradiction Engine**: Searches for counterfactuals to challenge hypotheses before verification.
8. **Causality Language Safeguard**: Enforces observational language (*"associated with"*, *"consistent with"*, never *"caused"*).
9. **Bit-Determinism & Provenance**: Canonical SHA-256 session fingerprint and PRNG seed preservation.
10. **Multi-Engine Provenance**: Retains engine version history across QuantCore, Regimes, Monte Carlo, and Stress Lab.

### C. Mathematical Verification & Test Suite
- **Verification Suite**: [`tests/institutionalResearch.test.ts`](file:///Users/angu/Documents/BlackBox/tests/institutionalResearch.test.ts) (80/80 passing tests).
- **Total Test Count**: 306/306 passing tests across all 7 platform test suites (`assistant`, `riskCommittee`, `researchAgent`, `portfolio`, `monteCarlo`, `regimeMonteCarlo`, `institutionalResearch`).
- **Clean TypeScript Build**: `npx tsc --noEmit` exits with 0 errors.
- **Clean Production Bundle**: `npm run build` succeeds in ~3.5s.

---

## 11. Phase 4.1 — Research Reproducibility & Decision Audit Layer

### A. Core Architecture & Reproducibility Contract
- **Objective**: Provides an institutional audit and reproducibility verification layer on top of Phase 4.0: `ResearchCase (Immutable/Sealed) → ResearchManifest (7-Section Machine-Readable Contract) → ReplayEngine (Tool Registry Allowlist) → 6-Tier ReplayVerifier → 10-Tier Precedence Mismatch Evaluator → Bidirectional Provenance Graph → ResearchDiffEngine (Neutral Mathematical Deltas) → 17-Section Case File Export`.
- **Authoritative Architecture Source of Truth**: [`docs/RESEARCH-AUDIT-ARCHITECTURE.md`](file:///Users/angu/Documents/BlackBox/docs/RESEARCH-AUDIT-ARCHITECTURE.md)
- **Comprehensive Methodology Reference**: [`docs/RESEARCH-AUDIT-METHODOLOGY.md`](file:///Users/angu/Documents/BlackBox/docs/RESEARCH-AUDIT-METHODOLOGY.md)
- **Canonical-Output Reproducibility Invariant**:
  $$\text{Same Engine} + \text{Same Data} + \text{Same Params} + \text{Same Seed} + \text{Same Numerical Contract} + \text{Same Canonical Serialization} = \text{Identical Output Fingerprint}$$
- **Three Comparison Classes**: `EXACT` (identifiers, tickers, observation count), `CANONICAL_EXACT` (sorted key JSON, float normalization, SHA-256), and `NUMERICAL_TOLERANCE` (domain-specific metric tolerance matrix).
- **Core Engine Modules**: [`src/core/research/audit/`](file:///Users/angu/Documents/BlackBox/src/core/research/audit/) (`auditTypes.ts`, `canonicalReproducibility.ts`, `versionCompatibility.ts`, `auditTimeline.ts`, `researchManifest.ts`, `researchCase.ts`, `replayVerifier.ts`, `replayEngine.ts`, `evidenceLineage.ts`, `claimInspector.ts`, `researchDiff.ts`, `caseExport.ts`, `researchCaseStore.ts`, `ghostModeAudit.ts`, `index.ts`).
- **Institutional UI Components**: [`src/components/workspace/research/audit/`](file:///Users/angu/Documents/BlackBox/src/components/workspace/research/audit/) (`ResearchCaseView.tsx`, `ResearchCaseFile.tsx`, `ReplayPanel.tsx`, `ReplayVerification.tsx`, `EvidenceLineage.tsx`, `ResearchDiffView.tsx`, `ClaimInspector.tsx`, `AuditTimeline.tsx`, `CaseExportPanel.tsx`).
- **Workspace Navigation**: Embedded as the primary `"Audit & Decision Replay"` tab in [`src/components/workspace/research/ResearchWorkspace.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/research/ResearchWorkspace.tsx).

### B. Core Guardrails & Audit Invariants
1. **Immutable ResearchCase**: Sealed via deep freeze; mutations fail/reject. Canonical human-readable identity format `BBX-CASE-YYYY-XXXX`.
2. **7-Section ResearchManifest**: Complete machine-readable data contract (Data, Strategy, Portfolio, Simulation, Engines, Research, Security). Sanitizes prompt injection and enforces zero secret exposure.
3. **Deterministic ReplayEngine**: Replays strictly registered tools through `ResearchToolRegistry`. Direct string evaluation (`eval`, `new Function`) is prohibited.
4. **Metric-Specific Tolerances**: Simplex weights ($10^{-6}$), returns/volatility ($10^{-6}$), correlations/Sharpe ($10^{-4}$), drawdowns ($10^{-5}$), Monte Carlo quantiles ($10^{-4}$), Euler risk ($10^{-5}$), regime transitions ($10^{-5}$).
5. **10-Category Precedence-Ordered Mismatch Taxonomy**: Structured root-cause attribution (`SCHEMA_MISMATCH` > `VERSION_MISMATCH` > `TOOL_UNAVAILABLE` > `CONFIGURATION_MISMATCH` > `DATA_MISMATCH` > `NUMERICAL_MISMATCH` > `EVIDENCE_MISMATCH` > `CLAIM_MISMATCH` > `SYNTHESIS_MISMATCH` > `REPLAY_FAILURE`).
6. **Bidirectional Provenance Lineage**: Traceable backward from claim to deterministic fingerprint, and forward from experiment to downstream claims. Non-causal lineage guarantee.
7. **Claim Inspector & Separation Contract**: Isolates Direct Evidence from Analytical Interpretation. Rejects unbound numerical claims.
8. **Neutral Research Diff Engine**: Evaluates absolute and relative deltas across 12 analytical dimensions with code-enforced epistemic neutrality (prohibits "better", "worse", "superior", "winner").
9. **Tamper-Guarded Audit Timeline**: Append-only structured ledger with strictly monotonic timestamps, credential scrubbing, and SHA timeline checksums.
10. **Multi-Format Institutional Case Export**: Markdown (17 sections), canonical JSON (lossless roundtrip re-import), and print-optimized HTML.
11. **Ghost Mode & Research Trail Integration**: Produces 5 deterministic audit insights (`REPRODUCIBILITY_STABLE`, `PARAMETER_DRIFT`, `DATA_DRIFT`, `EVIDENCE_DRIFT`, `VERSION_DRIFT`) and appends sealed cases to the non-overwriting Research Trail.
12. **Zero Database Dependency & Safe Simulation Caps**: Client-side in-memory repository; simulation paths capped at $\le 10,000$ to prevent UI lag.

### C. Mathematical Verification & Complete Platform Test Suite
- **Verification Suite**: [`tests/researchAudit.test.ts`](file:///Users/angu/Documents/BlackBox/tests/researchAudit.test.ts) (86/86 passing tests covering immutability, canonical determinism, 6-level verification, 10 mismatch codes, lineage tracing, tolerance enforcement, prompt injection, and neutrality).
- **Total Test Count**: **392/392** passing tests through Phase 4.1.
- **Clean TypeScript Build**: `npx tsc --noEmit` exits with **0 errors**.
- **Clean Production Bundle**: `npm run build` succeeds in **~4.0s**.

---

## 12. Phase 4.2 — BLACKBOX Research Observatory

### A. Core Architecture & High-Resolution Telemetry
- **Objective**: Provides an institutional telemetry and monitoring deck for real-time visualization of research sessions, active hypothesis graphs, evidence collection velocities, simulation health, and contradiction discovery.
- **Authoritative Architecture Source of Truth**: [`docs/RESEARCH-OBSERVATORY-ARCHITECTURE.md`](file:///Users/angu/Documents/BlackBox/docs/RESEARCH-OBSERVATORY-ARCHITECTURE.md)
- **Methodology Reference**: [`docs/RESEARCH-OBSERVATORY-METHODOLOGY.md`](file:///Users/angu/Documents/BlackBox/docs/RESEARCH-OBSERVATORY-METHODOLOGY.md)
- **Core Engine Modules**: [`src/core/research/observatory/`](file:///Users/angu/Documents/BlackBox/src/core/research/observatory/) (`observatoryTypes.ts`, `observatoryMetrics.ts`, `observatoryCollector.ts`, `observatoryEngine.ts`, `index.ts`).
- **UI Observatory Components**: [`src/components/workspace/research/observatory/`](file:///Users/angu/Documents/BlackBox/src/components/workspace/research/observatory/) (`ResearchObservatory.tsx`, `ObservatoryOverview.tsx`, `TelemetryDeck.tsx`, `EvidenceVelocityChart.tsx`, `ContradictionRadar.tsx`, `SimulationHealthMonitor.tsx`).
- **Workspace Navigation**: Embedded as the primary `"Research Observatory"` tab in [`src/pages/Workspace.tsx`](file:///Users/angu/Documents/BlackBox/src/pages/Workspace.tsx).
- **Verification Suite**: [`tests/researchObservatory.test.ts`](file:///Users/angu/Documents/BlackBox/tests/researchObservatory.test.ts) (36/36 passing tests).

---

## 13. Phase 4.3 — Hackathon Hardening, Final QA, Security, Performance & Demo Readiness (FINAL PHASE)

### A. Scope & Compliance Objectives
- **Objective**: Final engineering phase of BLACKBOX X. Zero feature creep, zero architectural duplication. Full hardening of existing systems for live demonstration, judge scrutiny, public deployment, and adversarial security.
- **Hard Stop Condition**: No Phase 4.4. Development complete.
- **Key Deliverables & Hardening Highlights**:
  1. **Full System Audit**: Completed across 12 operational dimensions in [`docs/PHASE-4.3-AUDIT.md`](file:///Users/angu/Documents/BlackBox/docs/PHASE-4.3-AUDIT.md).
  2. **Deterministic Data Provenance Disclosures**: Enforced explicit disclaimers across all quantitative research interfaces:
     - Stress Lab: `SIMULATED STRESS SCENARIO — NOT A HISTORICAL PRICE REPLAY`
     - Monte Carlo: `SIMULATION — NOT A FORECAST`
     - General Research: `FOR RESEARCH PURPOSES ONLY — NOT FINANCIAL ADVICE`
  3. **Zero Secret Exposure & Sanitized Configuration**:
     - Stripped API credentials from client code, `.env.example`, bundles, and network requests.
     - Implemented `/api/env-check` reporting safe boolean diagnostics (`CONFIGURED` / `NOT CONFIGURED`) without revealing key fragments.
  4. **Adversarial Prompt Injection Defense**: Server-side role boundaries and tool allowlists strictly isolate `GENERAL`, `BLACKBOX`, `WEB`, and `HYBRID` modes. AI never performs raw numerical financial calculations.
  5. **100% Offline Demo Safety**: All quantitative engines, Stress Lab, Monte Carlo, Portfolio Intelligence, Research Case replay, and Research Observatory function autonomously with deterministic data if internet or LLM providers fail.
  6. **One-Click Demo Reset**: Prominent "RESET DEMO" action in UI restores default asset (BTC), initial parameters, clears speculative cases, and resets simulation state without corrupting baseline historical data.
  7. **Canonical Judge Demo Flow**: Structured 14-step presentation path documented in [`docs/PHASE-4.3-IMPLEMENTATION-REPORT.md`](file:///Users/angu/Documents/BlackBox/docs/PHASE-4.3-IMPLEMENTATION-REPORT.md) and 26 factual judge Q&As prepared in [`docs/JUDGE-QA.md`](file:///Users/angu/Documents/BlackBox/docs/JUDGE-QA.md).
  8. **Three.js Performance Optimization**: Clamped DPR (`dpr={[1, 2]}`), enabled high-performance power preference, and verified proper WebGL context disposal to eliminate memory leaks.

### B. Final Mathematical Verification & Complete Platform Test Suite
- **Complete Test Matrix**: **428 / 428 passing assertions (100%)**, 0 failures across all 9 test suites:
  - [`tests/assistant.test.ts`](file:///Users/angu/Documents/BlackBox/tests/assistant.test.ts): 45 passing tests
  - [`tests/riskCommittee.test.ts`](file:///Users/angu/Documents/BlackBox/tests/riskCommittee.test.ts): 25 passing tests
  - [`tests/researchAgent.test.ts`](file:///Users/angu/Documents/BlackBox/tests/researchAgent.test.ts): 69 passing tests
  - [`tests/portfolio.test.ts`](file:///Users/angu/Documents/BlackBox/tests/portfolio.test.ts): 24 passing tests
  - [`tests/monteCarlo.test.ts`](file:///Users/angu/Documents/BlackBox/tests/monteCarlo.test.ts): 24 passing tests
  - [`tests/regimeMonteCarlo.test.ts`](file:///Users/angu/Documents/BlackBox/tests/regimeMonteCarlo.test.ts): 39 passing tests
  - [`tests/institutionalResearch.test.ts`](file:///Users/angu/Documents/BlackBox/tests/institutionalResearch.test.ts): 80 passing tests
  - [`tests/researchAudit.test.ts`](file:///Users/angu/Documents/BlackBox/tests/researchAudit.test.ts): 86 passing tests
  - [`tests/researchObservatory.test.ts`](file:///Users/angu/Documents/BlackBox/tests/researchObservatory.test.ts): 36 passing tests
- **TypeScript Compiler Check**: `npx tsc --noEmit` exits with **0 errors**.
- **Production Build**: `npm run build` succeeds in **~3.6s** (3,349 modules transformed).
- **Deployment Source of Truth**: [`docs/DEPLOYMENT.md`](file:///Users/angu/Documents/BlackBox/docs/DEPLOYMENT.md).
- **Final Architecture Diagram**: [`docs/FINAL-ARCHITECTURE.md`](file:///Users/angu/Documents/BlackBox/docs/FINAL-ARCHITECTURE.md).

