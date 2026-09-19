# BLACKBOX X — PHASE 3.8
## MONTE CARLO & PROBABILISTIC RISK INTELLIGENCE ARCHITECTURE
### Complete Mathematical, Algorithmic, and Technical Specification

---

## 1. Purpose & Philosophy

### 1.1 Objective & Research Framing
Phase 3.8 extends BLACKBOX X from deterministic historical backtesting and discrete simplex portfolio optimization into **probabilistic simulation and distribution intelligence**.

The core quantitative research question answered by this engine is:

> **"Given the observed return characteristics and a defined simulation methodology, what distribution of outcomes appears across reproducible simulated paths?"**

### 1.2 Institutional Positioning & Non-Predictive Charter
BLACKBOX X explicitly **does not predict future markets**. 

Monte Carlo simulations do not generate market forecasts, expected payoffs, or price targets. Instead, the engine evaluates the mathematical dispersion, path-dependency, recovery dynamics, and extreme downside tail risks of a portfolio under explicitly stated, transparent probabilistic assumptions.

**Core Mandate:**
- **No Forecast Claims**: Outputs represent simulated distributions under declared assumptions, not future probabilities of real-world returns.
- **Strict Methodological Transparency**: Every simulation run must carry full provenance regarding its sampling mechanics, seed, distributional assumptions, and underlying historical baseline.
- **Reproducibility**: The engine uses a deterministic, seeded pseudo-random number generator (PRNG). Identical inputs and seeds produce bit-identical simulation paths and summary metrics.

---

## 2. Existing Architecture Reuse & Non-Negotiable Boundaries

Phase 3.8 builds directly upon the validated foundations of Phases 1 through 3.7 without modifying or duplicating existing engines.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BLACKBOX X PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Phase 1 & 2: Deterministic Data Engine (1,826 daily bars, 1,825 returns)    │
│  Phase 3.1:   Research Trail & Ghost Mode Insight Engine                   │
│  Phase 3.2:   Multi-Scenario Stress Lab (Macro & Historical Shocks)         │
│  Phase 3.3:   Strategy Genome (Graph Topology & Phenotype Metrics)          │
│  Phase 3.4:   Institutional Risk Committee (ResearchPack & Briefings)       │
│  Phase 3.5:   AI Research Assistant (Featherless Inference & Tool Sandbox)  │
│  Phase 3.6:   Autonomous Quant Research Agent (Hypothesis & Contradiction)  │
│  Phase 3.7:   Portfolio Covariance, Simplex Optimizer, Euler Risk, Backtest │
├─────────────────────────────────────────────────────────────────────────────┤
│  PHASE 3.8:   MONTE CARLO & PROBABILISTIC RISK INTELLIGENCE (NEW ENGINE)    │
│               - Joint Historical Bootstrap (Vector Resampling)              │
│               - Parametric Correlated Normal (Cholesky Decomposition)       │
│               - Path Drawdown & Terminal Wealth Distributions               │
│               - Web Worker High-Throughput Streaming Engine                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Reused Components (Zero Code Duplication)
1. **Asset Universe & Data Engine (`src/core/data.ts`)**:
   - The tri-asset universe (`GOLD`, `BTC`, `NVDA`).
   - The 1,826 daily closing price bars spanning `2019-01-01` to `2023-12-31`.
2. **Synchronized Covariance & Return Matrix (`src/core/portfolio/covariance.ts`)**:
   - The 1,825 synchronized daily observations vector $T = 1,825$.
   - Empirical mean return vector $\boldsymbol{\mu}$ and daily covariance matrix $\boldsymbol{\Sigma}_{\text{daily}}$.
   - Portfolio weight validation and simplex projection ($\mathbf{w} \in \Delta^2$).
3. **Transaction Cost & Rebalancing Logic (`src/core/portfolio/portfolioBacktest.ts`)**:
   - Next-bar rebalancing schedules (`BUY_AND_HOLD`, `DAILY`, `MONTHLY`, `QUARTERLY`, `THRESHOLD \pm 5\%`).
   - Standard 10 bps friction and capital turnover accounting.
4. **Risk Metrics & VaR Framework (`src/core/portfolio/varMetrics.ts`)**:
   - Positive loss convention $L = -R$.
   - Non-parametric historical quantile calculations.
5. **Research Governance & Integrity (`src/core/researchAgent/`)**:
   - Evidence collection contracts (`evidenceId`, direct evidence vs. interpretation).
   - Strict tool execution budget (bounded research steps).

---

## 3. Data Source, Calendar Alignment & Provenance

### 3.1 Source Dataset Characteristics
- **Data Source**: Offline deterministic simulated demonstration dataset.
- **Date Range**: `2019-01-01` to `2023-12-31`.
- **Price Observations**: Exactly `1,826` daily closing price observations per asset.
- **Synchronized Observations**: Exactly `1,825` contemporaneous daily return intervals.
- **Terminology**: Must strictly use **"synchronized daily observations"**. It is forbidden to characterize these as "actual market trading sessions" or "real historical exchange feeds".

### 3.2 Mandatory Provenance Metadata
Every Monte Carlo simulation result, export, and AI tool payload must serialize the following provenance record:

```typescript
export interface MonteCarloProvenance {
  dataSource: 'OFFLINE_DEMO';
  dataSourceLabel: string;             // 'Offline Simulated Demonstration Dataset'
  dataWindow: {
    startDate: '2019-01-01';
    endDate: '2023-12-31';
    observationCount: 1825;
  };
  simulationMethod: MonteCarloMethod;   // 'HISTORICAL_BOOTSTRAP' | 'PARAMETRIC_NORMAL'
  simulationCount: number;             // e.g., 10,000
  horizonDays: number;                 // e.g., 252
  seed: number;                        // Deterministic PRNG seed
  portfolioWeights: PortfolioWeights;  // { GOLD: number, BTC: number, NVDA: number }
  rebalanceSchedule: RebalanceFrequency;
  transactionCostBps: number;
  fingerprint: string;                 // Deterministic SHA-256 hash
  generatedTimestamp: number;
}
```

---

## 4. Simulation Methodologies & Mathematics

Phase 3.8 specifies **two primary simulation engines**, each addressing distinct risk-modeling assumptions.

```
                  ┌─────────────────────────────────────┐
                  │    Synchronized Historical Data     │
                  │   1,825 Daily Return Vectors (r_t)  │
                  └──────────────────┬──────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────┐                     ┌─────────────────────────────┐
│ 4.1 Historical Joint        │                     │ 4.2 Parametric Correlated   │
│     Bootstrap Engine        │                     │     Monte Carlo Engine      │
├─────────────────────────────┤                     ├─────────────────────────────┤
│ • Resample complete vectors │                     │ • Empirical μ and Σ         │
│   r*_t = r_j (j ∈ [1, T])   │                     │ • Cholesky factor L (LL^T=Σ)│
│ • Preserves empirical fat   │                     │ • i.i.d. shocks z ~ N(0, I) │
│   tails & non-linear cross- │                     │ • Correlated shock ε = Lz   │
│   asset tail dependencies   │                     │ • r* = μ + ε                │
│ • Sampling with replacement │                     │ • Controlled Gaussian model │
└──────────────┬──────────────┘                     └──────────────┬──────────────┘
               │                                                   │
               └─────────────────────────┬─────────────────────────┘
                                         ▼
                        ┌─────────────────────────────────┐
                        │   Path Evolution & Rebalancing  │
                        │   w_t, V_t, Drawdown Trajectory │
                        └─────────────────────────────────┘
```

### 4.1 Method A: Historical Joint Bootstrap
The joint bootstrap generates simulated paths by resampling entire multi-asset return vectors directly from the synchronized historical observation matrix.

#### Mathematical Formulation
Let the synchronized historical dataset be represented as a matrix $\mathbf{R} \in \mathbb{R}^{T \times N}$, where $T = 1,825$ and $N = 3$:
$$\mathbf{r}_t = \begin{bmatrix} r_{\text{GOLD},t} \\ r_{\text{BTC},t} \\ r_{\text{NVDA},t} \end{bmatrix}, \quad t \in \{1, \dots, T\}$$

For each simulated path $m \in \{1, \dots, M\}$ and each simulated forward day $\tau \in \{1, \dots, H\}$:
1. Draw a discrete uniform random index $j$ from the historical index set:
   $$j \sim \mathcal{U}\{1, T\}$$
2. Select the complete synchronized return vector at index $j$:
   $$\mathbf{r}^*_{m,\tau} = \mathbf{r}_j = \begin{bmatrix} r_{\text{GOLD},j} \\ r_{\text{BTC},j} \\ r_{\text{NVDA},j} \end{bmatrix}$$

#### Critical Invariant: Complete Vector Resampling
- **Zero Asset-Decoupling**: It is **strictly prohibited** to bootstrap assets independently ($r^*_{\text{GOLD},\tau} = r_{\text{GOLD},j_1}$, $r^*_{\text{BTC},\tau} = r_{\text{BTC},j_2}$, $r^*_{\text{NVDA},\tau} = r_{\text{NVDA},j_3}$ with $j_1 \ne j_2 \ne j_3$).
- **Rationale**: Independent resampling annihilates the empirical cross-asset covariance, joint crash risk, and flight-to-safety dynamics (e.g., Gold appreciation during crypto/equity drawdowns).
- **Sampling Convention**: Sampling is performed **with replacement**.

---

### 4.2 Method B: Parametric Correlated Monte Carlo
The parametric simulation generates multivariate normal innovations that preserve the empirical first and second moments of the asset universe.

#### Mathematical Formulation
1. **Empirical Moments**:
   - Daily mean return vector: $\boldsymbol{\mu} \in \mathbb{R}^N$
     $$\mu_i = \frac{1}{T} \sum_{t=1}^T r_{i,t}$$
   - Daily sample covariance matrix: $\boldsymbol{\Sigma} \in \mathbb{R}^{N \times N}$
     $$\Sigma_{ij} = \frac{1}{T - 1} \sum_{t=1}^T (r_{i,t} - \mu_i)(r_{j,t} - \mu_j)$$

2. **Cholesky Factorization**:
   Compute the unique lower-triangular matrix $\mathbf{L} \in \mathbb{R}^{N \times N}$ such that:
   $$\boldsymbol{\Sigma} = \mathbf{L} \mathbf{L}^T$$
   where:
   $$L_{j,j} = \sqrt{\Sigma_{j,j} - \sum_{k=1}^{j-1} L_{j,k}^2}$$
   $$L_{i,j} = \frac{1}{L_{j,j}} \left( \Sigma_{i,j} - \sum_{k=1}^{j-1} L_{i,k} L_{j,k} \right), \quad i > j$$

3. **Standard Normal Innovations**:
   Draw an independent and identically distributed standard normal vector $\mathbf{z} \in \mathbb{R}^N$ using the Box-Muller transform or Marsaglia polar method over deterministic PRNG uniform draws:
   $$\mathbf{z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$$

4. **Correlated Shock Transformation**:
   Transform $\mathbf{z}$ into correlated shocks $\boldsymbol{\varepsilon} \in \mathbb{R}^N$:
   $$\boldsymbol{\varepsilon} = \mathbf{L} \mathbf{z}$$
   Since $\mathbb{E}[\boldsymbol{\varepsilon}\boldsymbol{\varepsilon}^T] = \mathbf{L} \mathbb{E}[\mathbf{z}\mathbf{z}^T] \mathbf{L}^T = \mathbf{L}\mathbf{I}\mathbf{L}^T = \boldsymbol{\Sigma}$, the simulated vector preserves cross-asset covariance.

5. **Simulated Return Vector**:
   $$\mathbf{r}^*_{m,\tau} = \boldsymbol{\mu} + \mathbf{L} \mathbf{z}_{m,\tau}$$

#### Numerical Stabilization Policy for Non-Positive-Definite Covariance
Due to finite floating-point precision, empirical covariance matrices can occasionally fail strict positive-definiteness ($L_{j,j}^2 \le 0$).

**Stabilization Algorithm (Reactive, Not Preemptive):**
1. Attempt standard Cholesky decomposition on the unadjusted empirical covariance matrix $\boldsymbol{\Sigma}$.
2. **Conditional Activation**: Regularization must **only activate if and when** the original decomposition encounters a non-positive pivot ($L_{j,j}^2 \le 0$ or $L_{j,j}^2 < \epsilon$, where $\epsilon = 10^{-10}$). Regularization is **never applied preemptively**.
3. If decomposition fails:
   - Apply deterministic Tikhonov regularization (minimal diagonal jitter):
     $$\boldsymbol{\Sigma}_{\text{stable}} = \boldsymbol{\Sigma} + \lambda \mathbf{I}$$
     where $\lambda = \max(10^{-8}, -\min(\text{eig}(\boldsymbol{\Sigma})) + 10^{-8})$.
   - Re-attempt Cholesky decomposition on $\boldsymbol{\Sigma}_{\text{stable}}$.
4. Log the regularization event in `MonteCarloResult.stabilizationApplied = true` with the exact adjustment magnitude $\lambda$. If standard decomposition succeeds without regularization, `stabilizationApplied = false` and $\lambda$ is omitted.
5. **Prohibition**: Silent manipulation of off-diagonal covariances is forbidden.

---

## 5. Random Number Generation & Deterministic PRNG

### 5.1 Rejection of `Math.random()`
`Math.random()` is **strictly banned** from the simulation engine. It is non-deterministic, browser-dependent, impossible to audit, and cannot be seeded.

### 5.2 Deterministic PRNG Specification: Mulberry32 / PCG32
The engine must implement a self-contained, 32-bit deterministic PRNG:

```typescript
export class DeterministicPRNG {
  private state: number;

  constructor(seed: number) {
    // Force seed to unsigned 32-bit integer
    this.state = Math.abs(Math.floor(seed)) >>> 0;
    if (this.state === 0) this.state = 0x6d2b79f5;
  }

  /** Generates a deterministic uniform float in [0, 1) */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Standard Gaussian using Box-Muller transform */
  public nextGaussian(): number {
    let u = 0, v = 0;
    while (u === 0) u = this.next(); // Convert (0, 1] to avoid log(0)
    while (v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}
```

### 5.3 Simulation Fingerprint
To guarantee cryptographic auditability and reproducibility, every simulation run computes a canonical SHA-256 fingerprint from its configuration:

$$\text{Fingerprint} = \text{SHA-256}\left(\text{method} \,\|\, \text{seed} \,\|\, M \,\|\, H \,\|\, V_0 \,\|\, w_{\text{GOLD}} \,\|\, w_{\text{BTC}} \,\|\, w_{\text{NVDA}} \,\|\, \text{schedule} \,\|\, \text{bps}\right)$$

---

## 6. Simulation Configuration & Boundary Constraints

### 6.1 Configuration Interface
```typescript
export interface MonteCarloConfig {
  method: 'HISTORICAL_BOOTSTRAP' | 'PARAMETRIC_NORMAL';
  seed: number;                        // Integer >= 0
  simulationCount: number;             // Default: 10,000 | Max: 50,000
  horizonDays: number;                 // Default: 252 (1 yr) | Max: 1,260 (5 yrs)
  initialCapital: number;              // Default: 100,000 | Min: 1,000
  portfolioWeights: PortfolioWeights;  // Simplex constrained: sum = 1.0, w_i >= 0
  rebalanceSchedule: RebalanceFrequency; // BUY_AND_HOLD, DAILY, MONTHLY, QUARTERLY, THRESHOLD
  includeTransactionCosts: boolean;    // Default: true
  transactionCostBps: number;          // Default: 10 (0.0010)
  targetReturnHurdle?: number;         // Optional threshold (e.g., 0% or 10%)
}
```

### 6.2 Hard Boundary Validation Rules
Any request violating the following rules must be immediately rejected with a descriptive `ValidationError`:

| Parameter | Allowed Range | Default | Rejection Condition |
| :--- | :--- | :--- | :--- |
| `simulationCount` | $[1, 50{,}000]$ | $10{,}000$ | $M \le 0$ or $M > 50{,}000$ |
| `horizonDays` | $[1, 1{,}260]$ | $252$ | $H \le 0$ or $H > 1{,}260$ |
| `initialCapital` | $[1{,}000, 100{,}000{,}000]$ | $100{,}000$ | $V_0 < 1{,}000$ |
| `portfolioWeights` | $w_i \ge 0, |\sum w_i - 1| < 10^{-4}$ | $\{0.4, 0.3, 0.3\}$ | Negative weights or sum $\ne 1.0$ |
| `transactionCostBps`| $[0, 500]$ (up to 5%) | $10$ | $\text{bps} < 0$ or $\text{bps} > 500$ |
| `seed` | $[0, 2^{32}-1]$ | Clock/Hash | Negative or non-integer |

---

## 7. Path Evolution, Capital Tracking & Rebalancing Mechanics

### 7.1 Buy & Hold Path Dynamics vs. Organic Weight Drift
In a Buy & Hold simulation, initial capital $V_0$ is allocated according to target weights $\mathbf{w}$ on day $\tau = 0$. 

**Organic Weight Drift Mechanics:**
- As individual asset prices evolve at differing rates, individual asset capital positions drift organically:
  $$V_{i,0} = w_i \times V_0$$
  $$V_{i,\tau} = \max\left(0, V_{i,\tau-1} \times (1 + r^*_{i,\tau})\right)$$
  $$V_\tau = \sum_{i=1}^N V_{i,\tau}$$
- The realized (drifting) portfolio weight of asset $i$ at day $\tau$ is:
  $$w_{i,\tau}^{\text{drift}} = \frac{V_{i,\tau}}{V_\tau} \quad (\text{for } V_\tau > 0)$$
  Unlike rebalanced portfolios where weights are periodically reset to target $\mathbf{w}$, Buy & Hold allows winning assets to compound and expand their weight organically (increasing concentration risk), while losing assets shrink.
- The realized portfolio return on day $\tau$ is:
  $$R_{p,\tau} = \begin{cases} \frac{V_\tau - V_{\tau-1}}{V_{\tau-1}}, & V_{\tau-1} > 0 \\ 0, & V_{\tau-1} = 0 \end{cases}$$

**Deterministic Handling of Non-Positive Asset Values ($r^* \le -100\%$):**
- If a simulated return $r^*_{i,\tau} \le -1.0$ occurs (asset bankruptcy/total loss):
  - Position capital is deterministically clamped to zero: $V_{i,\tau} = 0$.
  - In Buy & Hold, once an asset hits zero capital, it remains zero for all subsequent days ($\tau' > \tau$), as no capital is injected.
  - Total portfolio equity $V_\tau = \sum_{i=1}^N V_{i,\tau} \ge 0$ is strictly guaranteed non-negative.
  - Negative asset equity or negative portfolio capital is mathematically prevented.

### 7.2 Periodic & Threshold Rebalancing vs. Target Weights (Phase 3.7 Parity)
When rebalancing is active, the engine periodically resets drifted weights back to target weights $\mathbf{w}$:
1. **Next-Bar Execution**: Drifting weights $w_{i,\tau-1}^{\text{drift}}$ are evaluated at the close of day $\tau-1$. If a rebalance event occurs, target allocations $V_{i,\tau}^{\text{target}} = w_i \times V_{\tau-1}$ are executed at day $\tau$.
2. **Rebalance Schedules**:
   - `DAILY`: Rebalance every forward step $\tau$.
   - `MONTHLY`: Rebalance every 21 forward trading steps ($\tau \pmod{21} = 0$).
   - `QUARTERLY`: Rebalance every 63 forward trading steps ($\tau \pmod{63} = 0$).
   - `THRESHOLD`: Rebalance if $|w_{i,\tau-1}^{\text{drift}} - w_i| \ge 0.05$ for any asset $i$.
3. **Turnover & Transaction Costs**:
   At each rebalance event $\tau$, the total capital traded across all assets is:
   $$\text{Turnover}_\tau = \sum_{i=1}^N |V_{i,\tau}^{\text{target}} - V_{i,\tau-1}|$$
   $$\text{Cost}_\tau = \text{Turnover}_\tau \times \frac{\text{bps}}{10{,}000}$$
   Capital is adjusted post-friction: $V_\tau = V_{\tau-1} - \text{Cost}_\tau$.
4. **Rebalancing a Zero-Value Asset**: If an asset previously hit zero, rebalancing injects fresh capital equal to $w_i \times V_{\text{post-cost}}$ from other assets, restoring full target diversification.

---

## 8. Path Metrics, Peak Tracking & Drawdown Mechanics

For each simulated path $m \in \{1, \dots, M\}$ across forward horizon $\tau \in \{0, \dots, H\}$:

### 8.1 Peak & Drawdown Formulation
$$\text{Peak}_{m,0} = V_{m,0} = V_0$$
$$\text{Peak}_{m,\tau} = \max\left(\text{Peak}_{m,\tau-1}, V_{m,\tau}\right)$$
$$D_{m,\tau} = \frac{V_{m,\tau} - \text{Peak}_{m,\tau}}{\text{Peak}_{m,\tau}} \in [-1, 0]$$

### 8.2 Path Maximum Drawdown (MDD)
$$\text{MDD}_m = \min_{\tau \in [0, H]} D_{m,\tau} \le 0$$
*Sign Convention Standard*: In accordance with BLACKBOX X standard, drawdowns are reported as negative percentages (e.g., $-24.5\%$).

### 8.3 Path Terminal Wealth & Return
$$\text{Terminal Wealth}_m = V_{m,H}$$
$$\text{Total Return}_m = \frac{V_{m,H} - V_0}{V_0}$$
$$\text{CAGR}_m = \left( \frac{V_{m,H}}{V_0} \right)^{\frac{252}{H}} - 1 \quad (\text{for } H \ge 63)$$

### 8.4 Path Sharpe Ratio
Using the official BLACKBOX risk-free benchmark $R_f = 4.0\%$ annualized ($R_{f,\text{daily}} = 0.04 / 252$):
$$\text{Sharpe}_m = \frac{\frac{1}{H}\sum_{\tau=1}^H (R_{p,m,\tau} - R_{f,\text{daily}})}{\sqrt{\frac{1}{H-1}\sum_{\tau=1}^H (R_{p,m,\tau} - \bar{R}_{p,m})^2}} \times \sqrt{252}$$
*(Calculated only if $H \ge 63$ trading days to prevent small-sample volatility distortion).*

---

## 9. Distributional Analysis & Percentile Reporting

### 9.1 Simulation Percentiles (Terminology Compliance)
Outputs across $M$ simulated paths must be reported as **Simulation Percentiles**, **NEVER** as "confidence intervals":
- **Correct**: *"Simulated Terminal Wealth P05"* or *"P95 Maximum Drawdown"*.
- **Strictly Prohibited**: *"95% confidence interval"* (statistically invalid because it does not represent an estimator standard error).

### 9.2 Quantile Sorting & Interpolation
Let $\mathbf{X} = \{X_1, \dots, X_M\}$ be the array of a metric across all $M$ paths, sorted in ascending order:
$$X_{(1)} \le X_{(2)} \le \dots \le X_{(M)}$$
The $p$-th percentile ($p \in [0, 1]$) is computed using standard linear interpolation:
$$k = p \times (M - 1)$$
$$i = \lfloor k \rfloor, \quad d = k - i$$
$$P_p = X_{(i+1)} + d \times (X_{(i+2)} - X_{(i+1)})$$

The standard reported percentiles are:
$$\mathbf{P} = \{P_{05}, P_{25}, P_{50} \,(\text{Median}), P_{75}, P_{95}\}$$

---

## 10. Probability of Loss & Tail Risk Metrics

### 10.1 Loss Frequencies
Rather than claiming to predict future loss probability, the engine reports the **empirical path fraction**:
1. **Fraction of Paths with Net Capital Loss**:
   $$f_{\text{loss}} = \frac{1}{M} \sum_{m=1}^M \mathbb{I}(V_{m,H} < V_0)$$
   **Required UI / Report Wording**:
   > *"Fraction of simulated paths ending below initial capital: 14.2% (1,420 of 10,000 paths)."*
   *(Never phrase as: "14.2% chance that you will lose money").*

2. **Fraction of Paths Breaching Target Hurdle**:
   $$f_{\text{hurdle}} = \frac{1}{M} \sum_{m=1}^M \mathbb{I}(\text{Total Return}_m < R_{\text{target}})$$

### 10.2 Drawdown Severity Frequencies
Fraction of paths experiencing severe peak-to-trough declines at any point during horizon $H$:
$$P(\text{MDD} \le -10\%) = \frac{1}{M} \sum_{m=1}^M \mathbb{I}(\text{MDD}_m \le -0.10)$$
$$P(\text{MDD} \le -20\%) = \frac{1}{M} \sum_{m=1}^M \mathbb{I}(\text{MDD}_m \le -0.20)$$
$$P(\text{MDD} \le -30\%) = \frac{1}{M} \sum_{m=1}^M \mathbb{I}(\text{MDD}_m \le -0.30)$$

---

## 11. Historical Backtest vs. Monte Carlo Comparison Contract

The platform must provide a structured side-by-side reconciliation contract comparing the deterministic historical backtest (realized over the 1,825 synchronized observations) against the Monte Carlo simulation distribution:

```typescript
export interface HistoricalVsMonteCarloComparison {
  metricName: string;
  historicalValue: number;          // Realized in 2019-2023 backtest
  monteCarloMedian: number;         // P50 across simulated paths
  monteCarloP05: number;            // P05 adverse percentile
  monteCarloP95: number;            // P95 favorable percentile
  historicalPercentileRank: number; // Percentile rank of historical within MC (0-100)
  interpretation: string;           // Quantitative commentary
}
```

### 11.1 Comparison Contract Invariants
- **No Equating Median with Future Expectation**: The Monte Carlo median ($P_{50}$) is the midpoint of the simulated distribution under the declared model, not the expected future market performance.
- **Historical Contextualization**: If historical return sits in the 88th percentile of the Monte Carlo distribution, the report states:  
  *"The historical 2019–2023 trajectory produced returns in the 88th percentile of the simulated distribution, indicating that realized historical performance was buoyed by favorable market conditions relative to the median model path."*

---

## 12. VaR and CVaR Comparison: Historical vs. Simulated

The engine strictly delineates between:
1. **Historical 1-Day VaR / CVaR**: Computed directly from the 1,825 empirical observed daily return series.
2. **Simulated 1-Day VaR / CVaR**: Computed from the aggregate distribution of daily returns across all $M \times H$ simulated days.
3. **Simulated Horizon VaR / CVaR**: Computed from the distribution of terminal returns over horizon $H$.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VaR / CVaR TAXONOMY & HORIZON MATRIX                     │
├──────────────────────┬─────────────────────────┬────────────────────────────┤
│ Metric Type          │ Sample Pool             │ Horizon & Meaning          │
├──────────────────────┼─────────────────────────┼────────────────────────────┤
│ Historical 1-Day VaR │ 1,825 Synchronized Days │ Realized empirical loss    │
│ Simulated 1-Day VaR  │ M × H Simulated Days    │ Daily model loss quantile  │
│ Terminal Horizon VaR │ M Terminal Returns      │ Cumulative horizon loss    │
└──────────────────────┴─────────────────────────┴────────────────────────────┘
```

**Positive Loss Convention Standard**:
All VaR and CVaR metrics maintain the Phase 3.7 sign convention:
$$L = -R$$
A 1-day VaR of $1.5\%$ indicates a $1.5\%$ loss.

---

## 13. Correlation & Dependence Preservation

### 13.1 Finite-Sample Diagnostic Tolerance (Not an Exact Invariant)
To prevent structural model breakdown (e.g. inverted sign or unintentional asset decoupling), the engine provides an automated cross-asset correlation diagnostic:
- **Historical Joint Bootstrap**:
  Because complete vectors are resampled intact, the expected cross-asset correlation of the bootstrap sample approaches the empirical sample correlation as $M \times H \to \infty$.
- **Parametric Monte Carlo**:
  The simulated shock correlation matrix $\hat{\mathbf{C}}$ computed from simulated returns converges toward the empirical correlation matrix $\mathbf{C}$ as sample size increases.

**Finite-Sample Diagnostic Rule:**
For standard production runs ($M \ge 5{,}000$ and $H \ge 252$), the diagnostic check evaluates:
$$|\hat{C}_{ij} - C_{ij}| \le 0.05 \quad \forall i, j \in \{1, \dots, N\}$$
- **Explicit Framing**: This $\pm 0.05$ boundary is an empirical **finite-sample diagnostic tolerance band**, **NOT an exact mathematical equality invariant**.
- Because Monte Carlo draws are stochastic samples of finite length, standard error introduces natural random variation around true population values ($\text{SE} \approx \frac{1 - \rho^2}{\sqrt{M}}$). Deviations within $\pm 0.05$ represent normal finite-sample dispersion, whereas deviations beyond $\pm 0.05$ indicate algorithmic error or numerical instability.

---

## 14. Advanced Modes & Integration Boundaries

### 14.1 Regime-Conditioned Monte Carlo (Scope Boundary)
- **Phase 3.8 Boundary**: Regime-conditioned Monte Carlo is **DEFERRED** to Phase 3.9.
- **Rationale**: Implementing regime-conditioned simulation requires estimating an empirical Markov transition matrix between Phase 2 regimes (`BULL`, `BEAR`, `HIGH_VOL`, `LOW_VOL`). To maintain uncompromised mathematical integrity and avoid fabricating transition probabilities, Phase 3.8 focuses strictly on:
  1. Unconditional Historical Joint Bootstrap.
  2. Unconditional Parametric Correlated Normal.

### 14.2 Stress Testing Overlay (Phase 3.2 Integration Boundary)
- The engine supports an optional **Stressed Monte Carlo Path Analysis**:
  - The deterministic macro shock from Phase 3.2 (e.g., `COVID_2020` or `TECH_CRASH`) is applied at day $\tau = 1$ of each simulated path.
  - Forward evolution from day $\tau = 2$ to $H$ proceeds via Monte Carlo simulation.
  - **Terminology Rule**: The result is labeled *"Stressed Path Recovery Simulation"*, **NEVER** *"Crisis Prediction"*.

---

## 15. High-Throughput Performance Architecture

Simulating $50{,}000$ paths over $1{,}260$ days across 3 assets requires processing $1.89 \times 10^8$ floating-point operations. Doing this on the React UI thread would freeze the browser.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       WEB WORKER STREAMING TOPOLOGY                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [ React UI Thread ]                                                       │
│          │                                                                  │
│          │ PostMessage({ config, weights, seed })                           │
│          ▼                                                                  │
│   [ Monte Carlo Web Worker ]                                                │
│          │                                                                  │
│          ├─► Allocate Float64Array Memory Buffers                           │
│          ├─► Compute Cholesky / Index Table                                 │
│          ├─► Chunked Path Generation (e.g., 2,500 paths/batch)               │
│          │       │                                                          │
│          │       ├─► Stream Progress (0% → 25% → 50% → 100%)                │
│          │       ├─► Online Quantile Reservoir Sampling                     │
│          │       └─► Peak & Drawdown Extremes                               │
│          │                                                                  │
│          ▼ PostMessage({ summary, percentiles, samplePaths })               │
│   [ React Zustand Store ] ◄── (Zero Thread Freezing)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.1 Memory-Conscious Streamed Processing
1. **No Full-Matrix Allocation**:
   Storing $50{,}000 \times 1{,}260$ path values in JavaScript memory would require over $500\text{ MB}$ of RAM.
2. **Online Streaming Reductions**:
   - Each path updates a histogram / reservoir of terminal wealth, maximum drawdown, and total return.
   - Only a deterministic subsample of **50 representative paths** (e.g., min, max, P05, P25, P50, P75, P95, and 43 evenly spaced seeds) is retained for visual charting.
3. **Quantile Bands Trajectory**:
   At each forward step $\tau \in \{0, \dots, H\}$, the engine computes and retains only the 5 cross-sectional percentiles $\{P_{05}(\tau), P_{25}(\tau), P_{50}(\tau), P_{75}(\tau), P_{95}(\tau)\}$.

---

## 16. Research Trail & AI Evidence Synthesis

### 16.1 Evidence Serialization Contract
Monte Carlo findings integrate into the Phase 3.1 Research Trail and Phase 3.6 Autonomous Quant Agent as structured `ResearchEvidence`:

```typescript
export interface MonteCarloResearchEvidence {
  evidenceId: string;                 // e.g., 'ev-mc-7b3f91a'
  type: 'MONTE_CARLO_SIMULATION';
  provenance: MonteCarloProvenance;
  hypothesisId?: string;
  directEvidence: {
    terminalWealthMedian: number;
    terminalWealthP05: number;
    terminalWealthP95: number;
    mddP50: number;
    mddP95: number;
    lossFrequencyPct: number;
    drawdown20PctFrequencyPct: number;
  };
  interpretation: string;             // Analytical commentary
  confidence: 'HIGH_EVIDENCE' | 'MEDIUM_EVIDENCE' | 'INCONCLUSIVE';
}
```

### 16.2 Separation of Evidence from Interpretation
In strict accordance with Phase 3.6 standards:
- **Direct Evidence**:  
  *"Across 10,000 bootstrap simulations of the 40/30/30 portfolio over a 252-day horizon, the P95 maximum drawdown was -26.4%, and 13.8% of paths ended below initial capital."*
- **Interpretation**:  
  *"The simulated tail risk suggests that while the median outcome (+15.2%) is favorable, the downside dispersion is heavily driven by Bitcoin volatility, which contributes 62.9% of portfolio risk."*

---

## 17. Ghost Mode Insight Categories

Phase 3.1 Ghost Mode will recognize 5 new deterministic Monte Carlo insight triggers:
1. `OUTCOME_DISPERSION`: Flagged when $\frac{P_{95} - P_{05}}{P_{50}} > 1.5$ (extreme outcome divergence).
2. `DRAWDOWN_TAIL`: Flagged when $|\text{MDD}_{P95}| > 2 \times |\text{MDD}_{\text{historical}}|$.
3. `LOSS_FREQUENCY`: Flagged when $f_{\text{loss}} > 0.20$ (>20% simulated loss probability).
4. `TERMINAL_WEALTH_ASYMMETRY`: Flagged when positive skew $\frac{P_{95} - P_{50}}{P_{50} - P_{05}} > 2.0$.
5. `SIMULATION_VS_BACKTEST`: Flagged when historical return deviates by $> 2$ standard deviations from the simulation median.

---

## 18. AI Assistant & Autonomous Quant Agent Tool Contracts

### 18.1 Tool 1: `get_monte_carlo_risk`
Executes a bounded Monte Carlo simulation and returns structured distribution metrics.

```typescript
export const GetMonteCarloRiskSchema = z.object({
  goldWeight: z.number().min(0).max(1),
  btcWeight: z.number().min(0).max(1),
  nvdaWeight: z.number().min(0).max(1),
  method: z.enum(['HISTORICAL_BOOTSTRAP', 'PARAMETRIC_NORMAL']).default('HISTORICAL_BOOTSTRAP'),
  simulationCount: z.number().int().min(100).max(10000).default(5000),
  horizonDays: z.number().int().min(21).max(504).default(252),
  rebalanceSchedule: z.enum(['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD']).default('MONTHLY'),
  seed: z.number().int().optional(),
});
```

### 18.2 Tool 2: `compare_monte_carlo_backtest`
Generates a side-by-side reconciliation between realized historical backtest metrics and simulated distribution percentiles.

```typescript
export const CompareMonteCarloBacktestSchema = z.object({
  goldWeight: z.number().min(0).max(1),
  btcWeight: z.number().min(0).max(1),
  nvdaWeight: z.number().min(0).max(1),
  rebalanceSchedule: z.enum(['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD']).default('MONTHLY'),
});
```

### 18.3 Autonomous Agent Guardrails
- **Fixed Tool Budget**: The agent may execute at most **1 Monte Carlo simulation** per research run to prevent infinite simulation loops or excessive CPU burn.
- **Server-Side Validation**: All tool parameters are strictly validated by Zod schemas prior to execution.

---

## 19. Institutional UI Architecture: Monte Carlo Lab

The UI component will be integrated into the Portfolio Workspace as a dedicated tab: **Monte Carlo Lab**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PORTFOLIO WORKSPACE  │  Overview  │  Optimization  │  MONTE CARLO LAB [NEW]│
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Control Bar: Method | Sims (10k) | Horizon (252d) | Rebalance | Run ]   │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  SIMULATED WEALTH TRAJECTORIES       │  DISTRIBUTION HISTOGRAMS             │
│  • P05, P25, P50, P75, P95 Fans     │  • Terminal Wealth (P05 to P95)      │
│  • 50 Sample Paths (Subtle Opacity)  │  • Maximum Drawdown Distribution     │
│  • Historical Baseline Reference     │  • Tail Loss Frequency (< $100k)     │
├──────────────────────────────────────┴──────────────────────────────────────┤
│  PERCENTILE MATRIX & RISK PROBABILITIES                                     │
│  ┌────────────────────┬──────────┬──────────┬──────────┬──────────┬───────┐ │
│  │ Metric             │   P05    │   P25    │   P50    │   P75    │  P95  │ │
│  ├────────────────────┼──────────┼──────────┼──────────┼──────────┼───────┤ │
│  │ Terminal Wealth    │ $86,420  │ $104,110 │ $118,340 │ $136,800 │ $168k │ │
│  │ Max Drawdown       │ -28.4%   │ -18.2%   │ -13.1%   │  -8.9%   │ -5.6% │ │
│  └────────────────────┴──────────┴──────────┴──────────┴──────────┴───────┘ │
│  Loss Fraction: 13.8% | MDD <= -20% Fraction: 19.4% | Breakeven: 218 Days   │
├─────────────────────────────────────────────────────────────────────────────┤
│  PROVENANCE BAR                                                             │
│  Seed: #482910 | 1,825 Synchronized Obs | Joint Bootstrap | 10k Paths | 10bps│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 19.1 Institutional Design System Compliance
- **Canvas / Background**: `#FAF8F4` Warm Ivory
- **Surface / Cards**: `#FFFFFF` with `#E5E0D8` 1px Borders
- **Text**: `#1A1917` Graphite (High Contrast), `#68645E` Muted Graphite
- **Brand Accent**: `#1E6FFF` Institutional Cobalt (Percentile Medians)
- **Downside Risk Accent**: `#C93B2B` Muted Crimson (Drawdown Tails & Loss Zones)
- **Typography**: Inter (UI / Labels) & JetBrains Mono (Numbers, Seeds, Tables)
- **Zero Gamification**: No particle animations, no casino dice/roulette wheels, no fluorescent neon lines.

---

## 20. Comprehensive TypeScript Data Contracts

```typescript
import { Asset, PortfolioWeights, RebalanceFrequency } from './portfolioTypes';

export type MonteCarloMethod = 'HISTORICAL_BOOTSTRAP' | 'PARAMETRIC_NORMAL';

export interface PercentileSummary {
  p05: number;
  p25: number;
  p50: number; // Median
  p75: number;
  p95: number;
}

export interface SimulationTrajectoryBands {
  days: number[];                       // 0 to H
  p05Path: number[];                    // Portfolio values at P05
  p25Path: number[];
  p50Path: number[];
  p75Path: number[];
  p95Path: number[];
}

export interface SamplePath {
  pathId: number;
  terminalWealth: number;
  maxDrawdown: number;
  values: number[];                     // Sampled every k days for visual rendering
}

export interface MonteCarloRiskMetrics {
  lossFrequency: number;                // Fraction of paths with terminal return < 0
  drawdownExceedance10: number;         // Fraction of paths with MDD <= -10%
  drawdownExceedance20: number;         // Fraction of paths with MDD <= -20%
  drawdownExceedance30: number;         // Fraction of paths with MDD <= -30%
  oneDaySimulatedVaR95: number;         // Positive loss convention %
  oneDaySimulatedCVaR95: number;        // Expected shortfall %
  horizonSimulatedVaR95: number;        // Terminal horizon loss %
  horizonSimulatedCVaR95: number;
}

export interface MonteCarloResult {
  fingerprint: string;
  provenance: MonteCarloProvenance;
  terminalWealth: PercentileSummary;
  totalReturn: PercentileSummary;
  maxDrawdown: PercentileSummary;
  cagr?: PercentileSummary;             // Only if horizon >= 63 days
  sharpeRatio?: PercentileSummary;      // Only if horizon >= 63 days
  riskMetrics: MonteCarloRiskMetrics;
  trajectoryBands: SimulationTrajectoryBands;
  samplePaths: SamplePath[];            // 50 representative paths
  executionDurationMs: number;
  stabilizationApplied: boolean;
  stabilizationMagnitude?: number;
}
```

---

## 21. Complete Testing & Verification Plan

The Phase 3.8 test suite (`tests/monteCarlo.test.ts`) must implement and pass **24 rigorous verification checks**:

| Test ID | Invariant Verified | Method / Assertion |
| :--- | :--- | :--- |
| **Test 1** | Configuration Bounds Validation | Rejects $M \le 0$, $M > 50{,}000$, $H > 1{,}260$, invalid weights. |
| **Test 2** | PRNG Bit-Determinism | Identical seed + config produces bit-identical results. |
| **Test 3** | Seed Differentiation | Seed $A \ne \text{Seed } B$ produces distinct paths. |
| **Test 4** | Joint Bootstrap Vector Integrity | Every drawn return vector exists identically in historical dataset. |
| **Test 5** | Covariance Symmetry & Positivity | Parametric $\boldsymbol{\Sigma}$ is symmetric and positive semi-definite. |
| **Test 6** | Cholesky Decomposition Correctness | $\mathbf{L}\mathbf{L}^T = \boldsymbol{\Sigma}$ to within $10^{-8}$ tolerance. |
| **Test 7** | Cholesky Stabilization Fallback | Singular covariance matrix regularized deterministically. |
| **Test 8** | Simplex Weight Adherence | Rebalance weights satisfy $w_i \ge 0, \sum w_i = 1.0$. |
| **Test 9** | Day-0 Initial Capital Equality | All simulated paths begin exactly at $V_0$. |
| **Test 10** | Peak Tracking Monotonicity | $\text{Peak}_\tau \ge \text{Peak}_{\tau-1}$ across all paths. |
| **Test 11** | Drawdown Non-Positivity | $D_\tau \le 0$ strictly for all paths and days. |
| **Test 12** | Max Drawdown Lower Bound | $\text{MDD} \le \min(D_\tau)$. |
| **Test 13** | Percentile Monotonicity | $P_{05} \le P_{25} \le P_{50} \le P_{75} \le P_{95}$ strictly holds. |
| **Test 14** | Loss Frequency Boundedness | $f_{\text{loss}} \in [0, 1]$ exactly. |
| **Test 15** | Drawdown Threshold Hierarchy | $P(\text{MDD} \le -30\%) \le P(\text{MDD} \le -20\%) \le P(\text{MDD} \le -10\%)$. |
| **Test 16** | VaR / CVaR Tail Invariant | Simulated $\text{CVaR}_{95} \ge \text{VaR}_{95}$ under positive loss standard. |
| **Test 17** | Correlation Preservation (Bootstrap) | Simulated correlation matches historical within $\pm 0.05$. |
| **Test 18** | Correlation Preservation (Parametric)| Simulated correlation matches historical within $\pm 0.05$. |
| **Test 19** | Transaction Cost Monotonicity | Ending wealth with friction ($10\text{ bps}$) $<$ frictionless wealth. |
| **Test 20** | Rebalance Schedule Differentiation| Daily vs Monthly produces distinct turnover counts. |
| **Test 21** | Degenerate Asset (Zero Volatility) | Constant zero return asset handles correctly without NaN. |
| **Test 22** | Minimal Horizon Boundary | Horizon $H = 1$ executes cleanly without crash. |
| **Test 23** | Provenance Completeness | All provenance fields populated with non-predictive wording. |
| **Test 24** | Zero `Math.random` Enforcement | Codebase scan verifies zero unseeded random calls. |

---

## 22. Edge Cases & Robustness Handling

1. **Singular Covariance Matrix**:
   - If two assets become perfectly collinear ($\rho = 1.0$), Cholesky encounters a zero pivot.
   - Handled via Tikhonov diagonal regularization ($\lambda = 10^{-8}$).
2. **Extreme Volatility Blowups & Asset Bankruptcy ($r^* \le -100\%$)**:
   - If simulated return $r^*_{i,\tau} \le -1.0$:
   - The position's capital is deterministically clamped to zero: $V_{i,\tau} = \max(0, V_{i,\tau-1} \times (1 + r^*_{i,\tau})) = 0$.
   - In Buy & Hold, the asset remains permanently at $0.0$. In rebalanced portfolios, subsequent rebalancing allocates the target weight percentage $w_i \times V_{\text{post-cost}}$ from other non-zero assets.
   - Total portfolio wealth $V_\tau = \sum V_{i,\tau} \ge 0$ is strictly guaranteed non-negative. Negative asset equity or negative portfolio capital is mathematically prevented.
3. **Very Short Horizon ($H < 63$)**:
   - Annualized metrics (CAGR, Sharpe) are suppressed or flagged with an explanatory note to avoid small-sample volatility magnification.
4. **Single-Path Edge Case ($M = 1$)**:
   - Percentiles degenerate cleanly: $P_{05} = P_{50} = P_{95} = X_1$.

---

## 23. Institutional Limitations & Disclaimers

The following disclosures must be embedded in all generated reports, UI screens, and exported artifacts:
1. **Offline Demonstration Data**: Metrics are derived from an offline simulated demonstration dataset (`2019-01-01` to `2023-12-31`). No real historical market feeds are claimed.
2. **Distributional Simplification**: Parametric Monte Carlo assumes multivariate normality. Real financial markets exhibit fat tails, leptokurtosis, and non-linear tail co-dependence not fully captured by Gaussian models.
3. **Stationarity Assumption**: Historical bootstrap assumes past return intervals are representative of potential future variability. Structural regime changes or exogenous shocks outside the observation window are not reflected.
4. **No Financial or Investment Advice**: Monte Carlo simulations are quantitative exploratory tools for analyzing mathematical properties of portfolios under model assumptions. They do not constitute financial, investment, legal, or tax advice.

---

## 24. Phase 3.8 Architecture Checklist

- [x] Historical joint bootstrap defined (vector resampling without asset decoupling)
- [x] Parametric correlated Monte Carlo defined (Cholesky factorization of daily covariance)
- [x] Deterministic seeded PRNG defined (`Mulberry32` / `PCG32` without `Math.random`)
- [x] Simulation limits defined (Default: 10,000 / Max: 50,000; Horizon: 252 / Max: 1,260)
- [x] Portfolio path model defined (Organic drift, rebalancing, transaction friction)
- [x] Rebalancing semantics defined (Parity with Phase 3.7 next-bar execution)
- [x] Terminal wealth distribution defined (Percentiles P05, P25, P50, P75, P95)
- [x] Drawdown distribution defined (Peak tracking, non-positive sign convention)
- [x] Loss frequencies defined (Non-predictive wording: fraction of paths ending below capital)
- [x] VaR/CVaR separation defined (Historical 1-day vs Simulated 1-day vs Horizon VaR)
- [x] Correlation preservation defined (Tolerance-based validation $\pm 0.05$)
- [x] Regime boundary defined (Unconditional models prioritized; Markov models deferred to Phase 3.9)
- [x] Stress boundary defined (Deterministic Phase 3.2 shock overlay)
- [x] Research Trail integration defined (Direct evidence vs Interpretation)
- [x] Ghost Mode integration defined (5 quantitative trigger categories)
- [x] AI tool contracts defined (`get_monte_carlo_risk` with strict Zod schemas)
- [x] Quant Agent integration defined (Bounded single-simulation experiment)
- [x] UI architecture defined (Monte Carlo Lab, Institutional ivory/graphite palette)
- [x] Performance architecture defined (Web Worker streaming, 50 sample paths, memory-conscious)
- [x] Security constraints defined (Server-side validation, no code execution, no key exposure)
- [x] Test strategy defined (24 automated verification test invariants)
- [x] Edge cases defined (Singular covariance, asset bankruptcy, small horizon)
- [x] Provenance defined (Mandatory metadata serialization & SHA-256 fingerprint)
- [x] Limitations defined (4 mandatory institutional disclosures)

---
*End of Phase 3.8 Architecture Specification. Implementation must not proceed until this document has been formally reviewed and approved.*
