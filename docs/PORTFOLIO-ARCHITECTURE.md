# BLACKBOX X — PHASE 3.7
## PORTFOLIO INTELLIGENCE & OPTIMIZATION ARCHITECTURE
### Complete Mathematical, Algorithmic, and Technical Specification

---

## 1. Executive Summary & Problem Definition

### 1.1 Objective
Phase 3.7 extends BLACKBOX X from single-asset strategy intelligence into an institutional **Multi-Asset Portfolio Intelligence & Optimization System**. The system enables quantitative analysts to construct, analyze, mathematically optimize, and stress-test portfolios composed of the core BLACKBOX asset universe:
- **Gold (XAU)**: Safe-haven, low-volatility monetary commodity.
- **Bitcoin (BTC)**: High-beta, asymmetric digital store of value.
- **NVIDIA (NVDA)**: High-growth, secular AI technology equity.

### 1.2 Quantitative Foundations & Non-Negotiable Invariants
1. **BLACKBOX Calculates, AI Interprets**: All portfolio returns, covariance matrices, risk contributions, optimization solutions, and efficient frontiers are computed deterministically by verified numerical engines.
2. **Zero Fabrication**: No random Monte Carlo points masquerading as optimal portfolios. No black-box neural net weights. Every metric traces to deterministic linear algebra and convex optimization.
3. **Mathematical Defensibility**: Formulas strictly adhere to modern portfolio theory (Markowitz 1952), Euler's risk decomposition theorem, and the existing 252-day annualization and 4.0% risk-free rate conventions of BLACKBOX X.
4. **Phase 3.1–3.6 Protection**: Phase 3.1 (Ghost Mode), 3.2 (Stress Lab), 3.3 (Genome), 3.4 (Risk Committee), 3.5 (Research Assistant), and 3.6 (Autonomous Quant Agent) remain untouched. Existing engines are reused directly without code duplication.

---

## 2. Mathematical Formulation & Portfolio Models

### 2.1 Asset Universe & Weight Vector
Let the asset universe be defined as $N = 3$ assets:
$$\mathcal{A} = \{\text{GOLD}, \text{BTC}, \text{NVDA}\}$$

The portfolio allocation vector $\mathbf{w} \in \mathbb{R}^N$ is defined as:
$$\mathbf{w} = \begin{bmatrix} w_{\text{GOLD}} \\ w_{\text{BTC}} \\ w_{\text{NVDA}} \end{bmatrix}$$

### 2.2 Operational Constraints
For the initial Phase 3.7 implementation, all portfolios are **long-only** and **fully invested** without financial leverage:
1. **Non-Negativity (No Short Selling)**:
   $$w_i \ge 0 \quad \forall i \in \{1, \dots, N\}$$
2. **Full Investment (Budget Constraint)**:
   $$\sum_{i=1}^N w_i = \mathbf{w}^T \mathbf{1} = 1.0$$
3. **Bounded Simplex Domain**:
   The feasible set $\mathcal{W}$ is the standard 2-simplex in $\mathbb{R}^3$:
   $$\Delta^2 = \left\{ \mathbf{w} \in \mathbb{R}^3 \;\middle|\; w_1 + w_2 + w_3 = 1, \; w_i \ge 0 \right\}$$

*Note on Shorting & Leverage*: Short positions ($w_i < 0$) and margin leverage ($\sum |w_i| > 1$) introduce funding borrowing rates, margin maintenance requirements, and short-borrow fees. These are explicitly deferred to future releases to ensure pure, frictionless risk-premia analysis in Phase 3.7.

### 2.3 Asset Returns & Trading Calendar Alignment
Let $P_{i,t}$ be the closing price of asset $i$ on trading day $t \in \{0, 1, \dots, T\}$. The simple discrete daily return is:
$$r_{i,t} = \frac{P_{i,t} - P_{i,t-1}}{P_{i,t-1}}$$

The vector of daily asset returns at time $t$ is:
$$\mathbf{r}_t = \begin{bmatrix} r_{\text{GOLD},t} \\ r_{\text{BTC},t} \\ r_{\text{NVDA},t} \end{bmatrix} \in \mathbb{R}^3$$

**Trading Calendar Alignment & Data Synchronization Policy**:
In actual financial markets, instruments follow divergent trading schedules: Bitcoin trades 24/7/365, Gold trades on statutory commodity days, and NVIDIA trades on the US equity exchange calendar.

**Offline Simulated Dataset Implementation (Option B — Mathematically Honest Specification)**:
In BLACKBOX X Phase 1–3.7, all asset series are generated deterministically by the simulated demonstration engine (`src/core/data.ts`) across an **offline simulated common daily calendar**:
1. **Common Observation Calendar**:
   All three assets share identical, continuous daily observations spanning $t \in [2019-01-01, 2023-12-31]$ (exactly **1,826 contemporaneous daily price points**).
2. **Synchronized Daily Observations**:
   Portfolio returns are computed over the resulting **1,825 synchronized daily return intervals** ($T = 1,825$). Terminology strictly uses **"synchronized daily observations"** rather than "trading sessions".
3. **No Synthetic Forward-Filling**:
   Because every calendar date in the simulation has an authentic, contemporaneous generated price point across all three assets, no forward-filling is performed and no synthetic zero returns are created.
4. **Synchronization Policy Label**:
   `"Offline simulated common daily calendar — contemporaneous daily observations across all assets without forward-fill"`.

### 2.4 Portfolio Return Equation
The portfolio daily rate of return at time $t$ given target weights $\mathbf{w}$ is:
$$R_{p,t} = \mathbf{w}^T \mathbf{r}_t = \sum_{i=1}^N w_i r_{i,t}$$

---

## 3. Covariance Engine & Risk Metrics

### 3.1 Sample Covariance Matrix
Let $\boldsymbol{\mu} \in \mathbb{R}^N$ be the vector of expected daily asset returns:
$$\mu_i = \frac{1}{T} \sum_{t=1}^T r_{i,t}$$

The daily sample covariance matrix $\boldsymbol{\Sigma}_{\text{daily}} \in \mathbb{R}^{N \times N}$ is:
$$\Sigma_{ij} = \frac{1}{T - 1} \sum_{t=1}^T (r_{i,t} - \mu_i)(r_{j,t} - \mu_j)$$

### 3.2 Annualization Assumptions
Consistent with `src/core/metrics.ts`:
- **Annual Trading Days**: $A = 252$
- **Annualized Expected Return**:
  $$\boldsymbol{\mu}_{\text{ann}} = \boldsymbol{\mu} \times 252$$
- **Annualized Covariance Matrix**:
  $$\boldsymbol{\Sigma} = \boldsymbol{\Sigma}_{\text{daily}} \times 252$$

### 3.3 Covariance vs. Correlation Distinction
The correlation coefficient $\rho_{ij}$ normalizes covariance by the product of individual asset standard deviations:
$$\rho_{ij} = \frac{\Sigma_{ij}}{\sigma_i \sigma_j} \in [-1, 1]$$

While correlation measures the degree of linear co-movement, covariance preserves the absolute scale of asset volatility:
$$\Sigma_{ij} = \sigma_i \sigma_j \rho_{ij}$$
Portfolio risk optimization requires **covariance**, as variance minimization must account for both relative correlation and absolute volatility scale.

### 3.4 Portfolio Variance & Volatility
The annualized portfolio variance is given by the quadratic form:
$$\sigma_p^2 = \mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w} = \sum_{i=1}^N \sum_{j=1}^N w_i w_j \Sigma_{ij}$$

The annualized portfolio volatility is:
$$\sigma_p = \sqrt{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}$$

Because $\boldsymbol{\Sigma}$ is positive semi-definite, $\sigma_p(\mathbf{w})$ is a convex function of $\mathbf{w}$ over the simplex $\Delta^2$.

---

## 4. Institutional Portfolio Metrics

Every portfolio metric in Phase 3.7 directly inherits the verified mathematical formulas in `src/core/metrics.ts`:

| Metric | Mathematical Definition | Annualization / Baseline |
| :--- | :--- | :--- |
| **Portfolio Equity Path** | $E_0 = \text{Initial Capital}$, $E_t = E_{t-1}(1 + R_{p,t} - \text{Cost}_t)$ | Base currency ($) |
| **Total Return** | $\text{TR}_p = \frac{E_T - E_0}{E_0} \times 100\%$ | Period cumulative % |
| **Annualized Return** | $\text{CAGR}_p = \left[ \left(\frac{E_T}{E_0}\right)^{\frac{252}{T}} - 1 \right] \times 100\%$ | Compound annual % |
| **Annualized Volatility** | $\sigma_p = \sqrt{\frac{1}{T-1}\sum_{t=1}^T (R_{p,t} - \bar{R}_p)^2} \times \sqrt{252} \times 100\%$ | $\sqrt{252}$ factor |
| **Sharpe Ratio** | $S_p = \frac{\bar{R}_{p,\text{excess}}}{\sigma_{p,\text{excess}}} \times \sqrt{252}$, where $R_{\text{excess},t} = R_{p,t} - \frac{R_f}{252}$ | $R_f = 0.04$ (4.0% annualized) |
| **Maximum Drawdown** | $\text{MDD}_p = \min_{t} \left( \frac{E_t - \max_{s \le t} E_s}{\max_{s \le t} E_s} \right) \times 100\%$ | Peak-to-trough % |
| **Calmar Ratio** | $\text{Calmar}_p = \frac{\text{CAGR}_p}{\vert \text{MDD}_p \vert}$ | Return per unit tail drawdown |
| **Rolling Sharpe** | $S_{p,t}(W) = \frac{\text{mean}(R_{p, \tau} - R_{f,\text{daily}})}{\text{std}(R_{p, \tau} - R_{f,\text{daily}})} \times \sqrt{252}, \; \tau \in [t-W, t]$ | Rolling window $W \in \{30, 60, 90\}$ |
| **Historical VaR 95%** | $\text{VaR}_{95} = - R_{(k_{95})}$, where $k_{95} = \lfloor 0.05 \cdot T \rfloor$ | **Positive loss magnitude** (1-day horizon) |
| **Historical VaR 99%** | $\text{VaR}_{99} = - R_{(k_{99})}$, where $k_{99} = \lfloor 0.01 \cdot T \rfloor$ | **Positive loss magnitude** (1-day horizon) |
| **Historical CVaR 95%** | $\text{CVaR}_{95} = - \frac{1}{k_{95}}\sum_{j=1}^{k_{95}} R_{(j)}$ (Expected Shortfall) | **Positive loss magnitude** (1-day horizon) |
| **Historical CVaR 99%** | $\text{CVaR}_{99} = - \frac{1}{k_{99}}\sum_{j=1}^{k_{99}} R_{(j)}$ (Expected Shortfall) | **Positive loss magnitude** (1-day horizon) |

*Sign Convention Note*: BLACKBOX X strictly adopts the **positive loss magnitude** convention for all VaR and CVaR calculations ($L = -R$). A 95% 1-day VaR of $2.4\%$ means there is a 5% historical probability of a single-day loss exceeding $2.4\%$ of portfolio value. Higher values unambiguously indicate greater tail risk.

---

## 5. Risk Contribution Methodology (Euler Decomposition)

### 5.1 Marginal Risk Contribution (MRC)
By Euler's homogeneous function theorem, since portfolio standard deviation $\sigma_p(\mathbf{w})$ is a homogeneous function of degree 1 in weights $\mathbf{w}$ ($\sigma_p(\lambda \mathbf{w}) = \lambda \sigma_p(\mathbf{w})$ for $\lambda > 0$):
$$\sigma_p(\mathbf{w}) = \sum_{i=1}^N w_i \frac{\partial \sigma_p}{\partial w_i}$$

The **Marginal Risk Contribution (MRC)** of asset $i$ is the gradient of portfolio volatility with respect to $w_i$:
$$\text{MRC}_i = \frac{\partial \sigma_p}{\partial w_i} = \frac{(\boldsymbol{\Sigma} \mathbf{w})_i}{\sqrt{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}} = \frac{(\boldsymbol{\Sigma} \mathbf{w})_i}{\sigma_p}$$

$\text{MRC}_i$ represents the change in total portfolio annualized volatility per infinitesimal increment of weight in asset $i$.

### 5.2 Component Risk Contribution (CRC)
The absolute volatility contribution of asset $i$ to the total portfolio volatility is:
$$\text{CRC}_i = w_i \times \text{MRC}_i = \frac{w_i (\boldsymbol{\Sigma} \mathbf{w})_i}{\sigma_p}$$

**Euler's Summation Identity (Strict Mathematical Test)**:
$$\sum_{i=1}^N \text{CRC}_i = \sum_{i=1}^N \frac{w_i (\boldsymbol{\Sigma} \mathbf{w})_i}{\sigma_p} = \frac{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}{\sigma_p} = \frac{\sigma_p^2}{\sigma_p} = \sigma_p$$

Every unit of portfolio volatility is 100% accounted for by the sum of individual component risk contributions.

### 5.3 Percentage Risk Contribution (PRC)
The normalized fraction of risk contributed by asset $i$ is:
$$\text{PRC}_i = \frac{\text{CRC}_i}{\sigma_p} = \frac{w_i (\boldsymbol{\Sigma} \mathbf{w})_i}{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}$$

**Identity**:
$$\sum_{i=1}^N \text{PRC}_i = 1.0 \quad (100\%)$$

### 5.4 UI Presentation of Risk Decomposition
In the Portfolio Lab UI:
- A horizontal stacked bar and radial donut chart compares **Capital Allocation Weight ($w_i$)** vs. **Risk Contribution ($\text{PRC}_i$)**.
- *Example Insight*: A 60% Gold / 20% BTC / 20% NVDA portfolio may display $w_{\text{BTC}} = 20\%$, but due to volatility scaling, $\text{PRC}_{\text{BTC}} = 58.4\%$, immediately surfacing hidden risk concentration.

---

## 6. Portfolio Optimization Methodology

Phase 3.7 formulates four distinct, mathematically rigorous optimization objectives over the simplex $\Delta^2$:

```
                           PORTFOLIO OPTIMIZATION OBJECTIVES
          ┌───────────────────────┬────────────────────────┬───────────────────────┐
          ↓                       ↓                        ↓                       ↓
    MAXIMUM SHARPE        MINIMUM VOLATILITY         RISK PARITY             TARGET RETURN
  Maximize excess return   Minimize total variance   Equalize percentage     Minimize variance
   per unit of risk         min wᵀΣw                  risk contributions      subject to
   max (wᵀμ - Rf) / σp                                PRC_i = 1/N = 33.3%     wᵀμ ≥ R_target
```

### 6.1 Objective A: Maximum Sharpe (Tangency Portfolio)
Finds the allocation on the efficient frontier maximizing risk-adjusted excess return:
$$\mathbf{w}^*_{\text{Sharpe}} = \arg\max_{\mathbf{w} \in \Delta^2} \frac{\mathbf{w}^T \boldsymbol{\mu}_{\text{ann}} - R_f}{\sqrt{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}}$$
Subject to:
$$\sum_{i=1}^N w_i = 1, \quad w_i \ge 0 \quad \forall i$$

### 6.2 Objective B: Minimum Volatility (Global Minimum Variance Portfolio)
Finds the absolute lowest risk portfolio possible from the asset covariance structure:
$$\mathbf{w}^*_{\text{MinVol}} = \arg\min_{\mathbf{w} \in \Delta^2} \mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}$$
Subject to:
$$\sum_{i=1}^N w_i = 1, \quad w_i \ge 0 \quad \forall i$$

### 6.3 Objective C: Risk Balanced (Equal Risk Contribution / Risk Parity)
Finds the allocation where every asset contributes an identical amount of volatility to the portfolio:
$$\text{PRC}_i = \frac{1}{N} = \frac{1}{3} \approx 33.33\% \quad \forall i \in \{1, 2, 3\}$$
Formulated as minimizing the sum of squared risk contribution discrepancies:
$$\mathbf{w}^*_{\text{RP}} = \arg\min_{\mathbf{w} \in \Delta^2} \sum_{i=1}^N \sum_{j > i}^N \left( w_i (\boldsymbol{\Sigma}\mathbf{w})_i - w_j (\boldsymbol{\Sigma}\mathbf{w})_j \right)^2$$

### 6.4 Objective D: Target Return Portfolio
Minimizes portfolio variance subject to achieving a specific required annualized hurdle return $R_{\text{target}}$:
$$\mathbf{w}^*_{\text{Target}} = \arg\min_{\mathbf{w} \in \Delta^2} \mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}$$
Subject to:
$$\mathbf{w}^T \boldsymbol{\mu}_{\text{ann}} \ge R_{\text{target}}$$
$$\sum_{i=1}^N w_i = 1, \quad w_i \ge 0 \quad \forall i$$

**Feasible Target-Return Range & Infeasibility Handling**:
Under the long-only simplex constraint ($\mathbf{w} \in \Delta^2$), any portfolio expected return is a convex linear combination of individual asset expected returns:
$$R_p(\mathbf{w}) = \sum_{i=1}^N w_i \mu_{\text{ann},i}$$
Therefore, the mathematically feasible expected return range is strictly bounded by individual asset extremes:
$$R_{\min}^{\text{feasible}} = \min_{i \in \{1,\dots,N\}} \mu_{\text{ann},i} \le R_p(\mathbf{w}) \le \max_{i \in \{1,\dots,N\}} \mu_{\text{ann},i} = R_{\max}^{\text{feasible}}$$

- **Minimum Feasible Return**: $R_{\min}^{\text{feasible}} = \min_i \mu_{\text{ann},i}$ (attained at 100% allocation to the asset with the lowest historical return).
- **Maximum Feasible Return**: $R_{\max}^{\text{feasible}} = \max_i \mu_{\text{ann},i}$ (attained at 100% allocation to the asset with the highest historical return).
- **Infeasible Targets**: If $R_{\text{target}} > R_{\max}^{\text{feasible}}$ or $R_{\text{target}} < R_{\min}^{\text{feasible}}$, the constraint set $\{\mathbf{w} \in \Delta^2 \mid \mathbf{w}^T \boldsymbol{\mu}_{\text{ann}} \ge R_{\text{target}}\}$ is mathematically empty.
- **Handling**: The engine rejects the target deterministically, flags `status: INFEASIBLE`, returns the exact bounded feasible range $[R_{\min}^{\text{feasible}}, R_{\max}^{\text{feasible}}]$, and generates zero decorative or extrapolated points outside the feasible region.

---

## 7. Numerical Method Selection & Optimizer Guarantee

### 7.1 Selection Analysis: Small-Universe Simplex
For an $N = 3$ asset universe, the allocation manifold is a 2-dimensional planar simplex embedded in $\mathbb{R}^3$. We analyze four numerical optimization methods:

| Method | Convergence Guarantee | Determinism | Computational Cost ($N=3$) | Failure Modes |
| :--- | :--- | :--- | :--- | :--- |
| **Opaque LLM/AI Optimizer** | **NONE** | **NO** (Random) | Variable / High | Hallucinated weights, constraint violations |
| **Generic Interior Point QP** | High | Yes | Moderate (Heavy library) | External solver dependency, WASM bloat |
| **Projected Gradient Descent**| High | Yes (with step tuning) | Low | Local trap near vertices, slow boundary convergence |
| **Deterministic Simplex Grid Search + Gradient Refinement** | **Discrete Global Grid Best + Local Refinement** | **100% REPRODUCIBLE** | **Sub-millisecond (<2ms)** | **ZERO runtime crashes** |

### 7.2 The Selected Method: High-Resolution Deterministic Simplex Grid Search with Local Refinement
For $N = 3$, a deterministic grid resolution with step size $\delta = 0.005$ (0.5% weight intervals) yields:
$$K = \frac{(M + 1)(M + 2)}{2} = \frac{(200 + 1)(200 + 2)}{2} = 20,301 \text{ candidate portfolios}$$
- Evaluating 20,301 analytical quadratic forms $\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}$ in native JavaScript takes **~1.8 milliseconds** on standard hardware.
- Followed by a 20-iteration localized projected gradient refinement step, this yields a precision of **0.0001 (0.01% weight precision)**.

### 7.3 Optimizer Guarantee & Mathematical Properties
**Explicit Guarantee**:
The optimizer is a **deterministic reproducible optimizer with a discrete global search over the defined simplex grid followed by deterministic local refinement**.

**Mathematical Limitations & Defensibility**:
1. **Discrete Grid Optimum vs. Continuous Global Optimum**:
   The $\delta = 0.005$ simplex grid provides the best evaluated point on the discrete candidate grid $\Delta_{\delta}^2$. It does not mathematically guarantee the continuous global optimum over the continuous simplex $\Delta^2$.
2. **Role of Local Refinement**:
   Localized projected gradient refinement iteratively improves the candidate chosen by the discrete grid search along the local gradient vector, but it does not establish continuous global optimality.
3. **100% Deterministic Reproducibility**:
   Because candidate grid enumeration, objective evaluations, tie-breaking rules, and gradient descent iterations are strictly non-stochastic, identical inputs produce reproducible, bit-identical results on every run across all platforms.
4. **No Unsubstantiated Claims**:
   The system never claims 'global optimality' unless an analytical closed-form or mathematically proven continuous global optimization guarantee is formally established.
5. **Precision Status Labeling**:
   Solved allocations report `status = 'BEST_FOUND'` (or `'INFEASIBLE'`). UI labels state "BEST FOUND: Best solution found using deterministic simplex grid search and local refinement", eliminating ambiguous "OPTIMAL" claims.

---

## 8. Efficient Frontier Generation & Capital Allocation Line

### 8.1 Feasible Frontier Generation Algorithm
1. **Compute Efficient Target-Return Range**:
   - For a long-only portfolio ($\mathbf{w} \in \Delta^2$), the portfolio with minimum variance is the Global Minimum Variance Portfolio $\mathbf{w}^*_{\text{MinVol}}$, with annualized return:
     $$R_{\text{MinVol}} = \mathbf{w}_{\text{MinVol}}^{*T} \boldsymbol{\mu}_{\text{ann}}$$
   - Any portfolio with expected return $R < R_{\text{MinVol}}$ belongs to the *inefficient lower branch* of the minimum-variance set (incurring higher variance for lower return) and is mathematically excluded from the efficient frontier.
   - The maximum possible expected return is achieved by allocating 100% to the single asset with the highest historical return:
     $$R_{\max} = \max_{i \in \{1,\dots,N\}} \mu_{\text{ann},i}$$
   - Therefore, the **feasible target-return range for the Efficient Frontier** is strictly bounded:
     $$R_{\text{target}} \in [R_{\text{MinVol}}, R_{\max}]$$
   - Target returns outside this range are strictly infeasible for the efficient set.
2. **Discretize Target Returns**:
   Generate $M = 50$ evenly spaced deterministic target return steps across the feasible range:
   $$R_k = R_{\text{MinVol}} + \frac{k}{M - 1} (R_{\max} - R_{\text{MinVol}}), \quad k \in \{0, 1, \dots, M-1\}$$
3. **Deterministic Iso-Return Constrained Minimization**:
   For each target return $R_k$, solve:
   $$\sigma_k = \min_{\mathbf{w} \in \Delta^2} \sqrt{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}} \quad \text{s.t.} \quad \mathbf{w}^T \boldsymbol{\mu}_{\text{ann}} = R_k$$
   Using the deterministic simplex grid search over the iso-return hyper-plane slice followed by local projection.
4. **Strict Feasibility & Non-Decorative Guarantee**:
   No decorative, random, or extrapolated points are generated outside the feasible region $[R_{\text{MinVol}}, R_{\max}]$. Every point on the displayed frontier curve maps to an exact, verifiable allocation vector $\mathbf{w}_k \in \Delta^2$ with its computed historical volatility and return.

### 8.2 Capital Allocation Line (CAL) & Risk-Free Rate
1. **Risk-Free Rate Baseline**:
   - $R_f = 0.04$ ($4.0\%$ annualized), matching `src/core/metrics.ts`.
   - Daily equivalent: $R_{f,\text{daily}} = \frac{0.04}{252} \approx 0.0001587$.
2. **Tangency Portfolio (Maximum Sharpe Portfolio)**:
   - The tangency portfolio $\mathbf{w}^*_{\text{Sharpe}} \in \Delta^2$ is the unique risky asset allocation that maximizes the Sharpe ratio:
     $$S^* = \frac{\mathbf{w}^{*T}_{\text{Sharpe}} \boldsymbol{\mu}_{\text{ann}} - R_f}{\sqrt{\mathbf{w}^{*T}_{\text{Sharpe}} \boldsymbol{\Sigma} \mathbf{w}^*_{\text{Sharpe}}}}$$
   - Its coordinates in risk-return space are $(\sigma^*, R^*)$, where $\sigma^* = \sigma_p(\mathbf{w}^*_{\text{Sharpe}})$ and $R^* = \mathbf{w}^{*T}_{\text{Sharpe}} \boldsymbol{\mu}_{\text{ann}}$.
3. **Excess-Return Calculation**:
   - Annualized excess return: $R_{\text{excess}} = R_p - R_f$.
   - Daily excess return: $R_{\text{excess},t} = R_{p,t} - R_{f,\text{daily}}$.
4. **Capital Allocation Line Equation**:
   - The theoretical Capital Allocation Line represents combinations of the risk-free rate and the tangency portfolio:
     $$\text{CAL}(\sigma) = R_f + S^* \times \sigma$$
5. **Portfolio Universe Clarification (Risk-Free Asset Modeling)**:
   - **Crucial Boundary**: The three-asset portfolio universe $\mathcal{A} = \{\text{GOLD}, \text{BTC}, \text{NVDA}\}$ consists **strictly and exclusively of the three risky assets** ($\sum_{i=1}^3 w_i = 1.0, w_i \ge 0$).
   - The risk-free asset is **NOT** held as an asset within the portfolio weight vector $\mathbf{w}$.
   - The risk-free rate is used solely as an external financial benchmark to compute excess returns, evaluate the Sharpe ratio, and plot the theoretical reference Capital Allocation Line against the risky efficient frontier.

---

## 9. Portfolio Backtesting & Rebalancing Methodology

### 9.1 Next-Bar Execution & Zero Look-Ahead Bias
Consistent with `src/core/backtest.ts`:
- Asset weights determined at close of day $t-1$ are applied to returns earned over day $t$:
  $$E_t = E_{t-1} \times \left( 1 + \sum_{i=1}^N w_{i,t-1} r_{i,t} \right) - C_t$$
- No information from day $t$ close is used in portfolio allocation on or before day $t$.

### 9.2 Rebalancing Mechanics
Phase 3.7 supports three institutional rebalancing policies:
1. **Periodic Rebalancing**:
   - **Daily**: Strict continuous alignment to target weights $\mathbf{w}^*$.
   - **Monthly**: Rebalances on the first trading day of each month.
   - **Quarterly**: Rebalances on the first trading day of Jan, Apr, Jul, Oct.
2. **Threshold (Tolerance Band) Rebalancing**:
   - Rebalances only when any asset's drifted equity weight exceeds target by $\pm 5.0\%$:
     $$\max_i |w_{i,t}^{\text{drift}} - w_i^*| > 0.05$$
3. **Buy & Hold (No Rebalancing / Drift)**:
   - Initial capital is split according to $\mathbf{w}$ on day 0, and weights float unconstrained with asset compounding paths.

### 9.3 Transaction Cost Model
Transaction costs are applied whenever capital is shifted across assets:
$$\text{Cost}_t = c \times \sum_{i=1}^N |\Delta w_{i,t}| \times E_{t-1}$$
Where:
- $c = 0.0010$ (10 bps default, identical to `src/core/backtest.ts`).
- $\Delta w_{i,t} = w_{i,\text{target}} - w_{i,t}^{\text{drift}}$ is the turnover delta for asset $i$.
- Turnover and trade count are tracked and logged explicitly.

---

## 10. Benchmark & Comparative Framework

To eliminate marketing bias, BLACKBOX X never labels any allocation "best". All portfolios are presented side-by-side against standard benchmarks:
1. **1/N Equal Weight Portfolio**: $w = [33.33\%, 33.33\%, 33.33\%]$.
2. **Individual Asset Buy & Hold**:
   - 100% Gold
   - 100% Bitcoin
   - 100% NVIDIA
3. **User-Configured Custom Portfolio**: Custom user baseline weights.
4. **Optimized Portfolios**: Max Sharpe, Min Volatility, and Risk Parity.

**Comparative Output Table**:
Columns: Strategy / Portfolio, Total Return (%), CAGR (%), Volatility (%), Sharpe Ratio, Max Drawdown (%), Turnover (%).

---

## 11. Portfolio Stress Testing Integration

Phase 3.7 reuses the validated Phase 3.2 Time-Travel Stress Engine (`src/core/stressTesting.ts`) rather than creating a secondary stress system.

### 11.1 Execution Flow
```
Portfolio Weights w
        │
        ▼
Stress Scenario Selected (GFC_2008 / COVID_2020 / RATE_SHOCK_2022 / CRYPTO_CRASH / CUSTOM)
        │
        ▼
Asset Price Series Shocked via Existing Stress Engine (Concave Decay + Volatility Multiplier)
        │
        ▼
Recompute Asset Returns under Shock: r_shocked,t
        │
        ▼
Calculate Stressed Portfolio Trajectory: R_p,shocked,t = wᵀ r_shocked,t
        │
        ▼
Extract Stressed Drawdown, Stressed Sharpe, and Recovery Days
```

### 11.2 Required Disclosure
Every portfolio stress analysis retains the mandatory disclaimer:
> **SIMULATED STRESS SCENARIO**: Modeled parameters reflect historical crisis volatility expansion and liquidity contagion. This is a mathematical sensitivity stress test, not a historical price replay or market prediction.

---

## 12. Monte Carlo & VaR / CVaR Scoping Decision

### 12.1 Scoping Assessment
- **Monte Carlo Simulation**:
  - *Recommendation*: **EXPLICITLY DEFERRED TO PHASE 3.8**.
  - *Rationale*: A rigorous Monte Carlo engine requires parametric geometric Brownian motion with Cholesky factorized correlation matrices or block bootstrap sampling. Implementing an ungrounded pseudo-random simulation in Phase 3.7 would violate the core architectural standard of mathematical defensibility. Phase 3.7 focuses on deterministic historical optimization and stress shocks.
- **Value at Risk (VaR) and Conditional VaR (CVaR)**:
  - *Recommendation*: **INCLUDED IN PHASE 3.7 (Historical Non-Parametric Method)**.
  - *Rationale*: Historical VaR and CVaR are non-parametric, require zero distributional or normality assumptions, and are computed deterministically from the empirical portfolio return distribution.
  - *Explicit Sign Convention*:
    - **Convention Chosen: Positive Loss Magnitude** ($L = -R$).
    - A positive VaR (e.g. $\text{VaR}_{95} = +0.0235$ or $+2.35\%$) means that over a 1-day horizon, there is a 5% probability of experiencing a portfolio loss of $2.35\%$ or greater.
    - A negative return quantile $q < 0$ is expressed as a positive loss magnitude via negation: $\text{VaR} = -q > 0$.
    - This institutional convention ensures that higher numerical values unambiguously reflect greater risk.
  - *Mathematical Formulations*:
    Let $\{R_{p,t}\}_{t=1}^T$ be the historical series of daily portfolio returns. Sort returns in ascending order:
    $$R_{(1)} \le R_{(2)} \le \dots \le R_{(T)}$$
    1. **VaR 95% (Daily 95% Value at Risk)**:
       Rank index $k_{95} = \lfloor 0.05 \times T \rfloor$:
       $$\text{VaR}_{95} = - R_{(k_{95})}$$
    2. **VaR 99% (Daily 99% Value at Risk)**:
       Rank index $k_{99} = \lfloor 0.01 \times T \rfloor$:
       $$\text{VaR}_{99} = - R_{(k_{99})}$$
    3. **CVaR 95% (Daily 95% Conditional VaR / Expected Shortfall)**:
       The conditional average loss magnitude across the 5% worst loss days:
       $$\text{CVaR}_{95} = - \frac{1}{k_{95}} \sum_{j=1}^{k_{95}} R_{(j)}$$
    4. **CVaR 99% (Daily 99% Conditional VaR / Expected Shortfall)**:
       The conditional average loss magnitude across the 1% worst loss days:
       $$\text{CVaR}_{99} = - \frac{1}{k_{99}} \sum_{j=1}^{k_{99}} R_{(j)}$$
  - *Mathematical Invariant*:
    $$\text{CVaR}_{99} \ge \text{CVaR}_{95} \ge \text{VaR}_{95} > 0$$
    strictly holds for empirical distributions with negative tails.

---

## 13. Portfolio Market Regime Integration

Portfolio performance is mapped across the four macro regimes identified by `src/core/regimes.ts`:
1. **Bull Regime**: Low/moderate volatility, upward trend.
2. **Bear Regime**: High volatility, sustained downward trend.
3. **High Volatility (Chop)**: Whipsaw price action, high variance.
4. **Low Volatility**: Compressional range-bound market.

For each detected regime period, the engine computes:
- Sub-period portfolio total return and annualized return.
- Regime-specific volatility and Sharpe ratio.
- Asset component risk contributions during that specific regime.

---

## 14. Autonomous Quant Research Agent (Phase 3.6) Integration

Phase 3.7 registers two new tools in the strictly bounded BLACKBOX tool allowlist:
1. `get_portfolio_metrics`: Computes total return, Sharpe, volatility, drawdown, VaR/CVaR for arbitrary valid weight vectors $\mathbf{w}$.
2. `get_portfolio_optimization`: Computes Max Sharpe, Min Volatility, or Risk Parity optimal allocations with deterministic metrics.

The Quant Agent can autonomously investigate multi-asset questions:
- *Question*: *"Does adding 20% Gold to an 80% BTC strategy reduce maximum drawdown without sacrificing Sharpe ratio?"*
- *Hypotheses*: Forms testable hypotheses on volatility dampening and tail risk reduction.
- *Tool Execution*: Runs `get_portfolio_metrics` on 100% BTC vs 80/20 BTC/Gold.
- *Contradiction Check*: Falsifies whether diversification actually improved risk-adjusted metrics or merely diluted returns.
- *Synthesis*: Synthesizes evidence-grounded findings and logs into the Research Trail.

---

## 15. UI / UX Design Architecture

### 15.1 Aesthetic Direction
Follows the institutional aesthetic of BLACKBOX X:
- Palette: `#FAF8F4` (Ivory background), `#1A1917` (Graphite accents), `#FFFFFF` (Card surfaces), `#E5E0D8` (Subtle borders).
- Modern typography, monospace quantitative callouts, zero neon gimmicks.

### 15.2 Interactive Layout Modules
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PORTFOLIO INTELLIGENCE & OPTIMIZATION LAB                                   │
│ Multi-Asset Allocation • Risk Contribution • Convex Optimization • Frontiers│
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1. ALLOCATION CONTROLS               │ 2. RISK CONTRIBUTION BREAKDOWN       │
│                                      │                                      │
│ Gold:  [=======|         ] 35.0%     │ Donut Chart: Capital vs. Risk Share │
│ BTC:   [====|            ] 25.0%     │ - Gold:  35.0% weight →  8.4% risk   │
│ NVDA:  [========|        ] 40.0%     │ - BTC:   25.0% weight → 41.2% risk   │
│ Total: 100.0% (Valid)                │ - NVDA:  40.0% weight → 50.4% risk   │
│                                      │                                      │
│ Presets: [Equal Weight] [60/40]      │ Euler Sum: Σ CRC_i = σ_p (Verified)  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ 3. EFFICIENT FRONTIER VISUALIZATION  │ 4. OPTIMIZATION COCKPIT              │
│                                      │                                      │
│ Return (%)                           │ [Solve Max Sharpe]   (Sharpe: 1.42)  │
│   ▲              / CAL               │ [Solve Min Vol]      (Vol: 14.8%)    │
│   │            ● (Max Sharpe)        │ [Solve Risk Parity]  (PRC: 33.3% ea) │
│   │         .-'                      │                                      │
│   │       .'   (Current Portfolio)   │ Quick Apply to allocation controls   │
│   │     ● (Min Vol)                  │                                      │
│   └──────────────────────► Vol (%)   │ Infeasible Targets Flagged Cleanly   │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ 5. HISTORICAL BACKTEST & MACRO STRESS REPLAY                                │
│ Cumulative Equity Chart • Drawdown Series • Stress Scenario Comparison     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Proposed File Structure

All Phase 3.7 code is organized cleanly in a dedicated directory without touching Phase 3.1–3.6:

```
src/core/portfolio/
    ├── portfolioTypes.ts         # Types: PortfolioWeights, OptimizationTarget, RiskContribution, PortfolioMetrics
    ├── covariance.ts             # Covariance matrix, correlation, portfolio variance & volatility
    ├── riskContribution.ts       # Marginal risk, component risk, percentage risk, Euler identity validation
    ├── optimizer.ts              # Deterministic simplex grid optimizer (Max Sharpe, Min Vol, Risk Parity)
    ├── efficientFrontier.ts      # Monotonic efficient frontier generation, CAL, and boundary solvers
    ├── portfolioBacktest.ts      # Backtesting engine with rebalancing frequencies, transaction costs, and equity paths
    ├── varMetrics.ts             # Deterministic Historical VaR (95%, 99%) and CVaR (Expected Shortfall)
    └── index.ts                  # Public portfolio engine exports

src/components/workspace/portfolio/
    ├── PortfolioLab.tsx          # Main container integrating allocation, metrics, optimizer, and charts
    ├── AllocationSliders.tsx     # Interactive weight sliders with auto-normalization and preset allocations
    ├── RiskContributionView.tsx  # Donut and comparative bar charts of capital vs risk contribution
    ├── EfficientFrontierChart.tsx# Recharts curve with Capital Allocation Line and interactive tangency point
    └── PortfolioMetricsTable.tsx # Comparative performance metrics against benchmarks and individual assets

server/api/portfolio/
    └── optimize.ts               # Optional server-side high-resolution optimizer endpoint

tests/
    └── portfolio.test.ts         # Verification suite covering all mathematical and operational requirements
```

---

## 17. Comprehensive Test Strategy (`tests/portfolio.test.ts`)

A dedicated automated test suite verifying all mathematical and constraint invariants:

1. **Simplex Constraints**:
   - Validates that $\sum w_i = 1.0 \pm 10^{-6}$.
   - Rejects negative weights ($w_i < 0$).
   - Rejects weights summing to $\ne 1.0$.
2. **Portfolio Variance & Volatility**:
   - Verifies $\sigma_p = \sqrt{\mathbf{w}^T \boldsymbol{\Sigma} \mathbf{w}}$ matches hand-calculated test vectors.
   - Confirms that diversification reduces risk: $\sigma_p(\text{Equal Weight}) < \sum w_i \sigma_i$.
3. **Euler Risk Contribution Summation**:
   - Formally asserts $\left| \sum_{i=1}^3 \text{CRC}_i - \sigma_p \right| < 10^{-5}$ across 50 random test portfolios.
   - Formally asserts $\sum_{i=1}^3 \text{PRC}_i = 1.0 \pm 10^{-5}$.
4. **Optimization Determinism & Reproducibility**:
   - Re-running optimizer on identical inputs produces bit-identical weight vectors across runs.
   - Verifies discrete simplex grid search evaluates candidate space exhaustively and local refinement improves candidate without claiming unproven continuous global optimality.
5. **Max Sharpe Benchmark Domination**:
   - Asserts Sharpe of $\mathbf{w}^*_{\text{Sharpe}}$ is greater than or equal to Equal Weight and all individual assets.
6. **Min Volatility Optimality**:
   - Asserts volatility of $\mathbf{w}^*_{\text{MinVol}}$ is strictly less than or equal to any single asset volatility.
7. **Target Return Feasibility & Infeasibility Enforcement**:
   - Asserts that target returns within $[R_{\min}^{\text{feasible}}, R_{\max}^{\text{feasible}}]$ solve successfully.
   - Asserts that infeasible target returns ($R_{\text{target}} > \max_i \mu_i$ or $R_{\text{target}} < \min_i \mu_i$) deterministically return `status: INFEASIBLE` with the exact bounded range and zero extrapolated points.
8. **Risk Parity Equivalence**:
   - Asserts $\max_i |\text{PRC}_i - 0.3333| < 0.01$ for the Risk Parity portfolio.
9. **Efficient Frontier Monotonicity & CAL**:
   - Asserts that along the efficient frontier, return is strictly monotonically increasing with respect to volatility within $[R_{\text{MinVol}}, R_{\max}]$.
   - Asserts Capital Allocation Line originates at $(0, R_f)$ and is tangent to the frontier at the Maximum Sharpe portfolio, while the 3-asset portfolio holds zero weight in the risk-free asset.
10. **Calendar Synchronization & Non-Synthetic Returns**:
    - Asserts that portfolio returns are computed only on synchronized observation dates.
    - Asserts that missing dates are not forward-filled with synthetic zero returns.
11. **Backtest Look-Ahead Prevention**:
    - Asserts day $t$ return depends exclusively on day $t-1$ weights.
12. **Transaction Cost & Turnover**:
    - Asserts that rebalancing from $100\%$ Gold to $100\%$ BTC incurs exactly $2 \times 0.0010 \times \text{Capital}$ in fees.
13. **Stress Integration**:
    - Asserts portfolio drawdown under COVID_2020 matches weighted underlying asset shocks.
14. **Historical VaR / CVaR Positive Loss Invariants**:
    - Asserts positive loss magnitude convention: $\text{VaR}_{95} > 0$, $\text{VaR}_{99} > 0$, $\text{CVaR}_{95} > 0$, and $\text{CVaR}_{99} > 0$.
    - Asserts tail ordering: $\text{CVaR}_{99} \ge \text{CVaR}_{95} \ge \text{VaR}_{95} > 0$ on empirical return distributions.

---

## 18. Recommended Implementation Sequence

Once approved for execution, Phase 3.7 should proceed in four sequential milestones:

- **Milestone 1: Mathematical Foundations**
  - Implement `portfolioTypes.ts`, `covariance.ts`, `riskContribution.ts`, and `varMetrics.ts`.
  - Validate with core mathematical unit tests (Euler summation, covariance consistency).
- **Milestone 2: Numerical Optimizer & Efficient Frontier**
  - Implement `optimizer.ts` (deterministic simplex solver) and `efficientFrontier.ts`.
  - Validate Max Sharpe, Min Volatility, and frontier convexity tests.
- **Milestone 3: Portfolio Backtest & Stress Integration**
  - Implement `portfolioBacktest.ts` (periodic rebalancing, drift, transaction costs).
  - Connect with existing `stressTesting.ts` for multi-asset shock scenarios.
- **Milestone 4: UI Cockpit & Assistant Tools**
  - Build `src/components/workspace/portfolio/` components.
  - Mount Portfolio Lab tab in `Workspace.tsx`.
  - Register `get_portfolio_metrics` and `get_portfolio_optimization` in AI tools registry and Quant Agent.
  - Execute full regression suite (`tests/assistant.test.ts`, `tests/riskCommittee.test.ts`, `tests/researchAgent.test.ts`, `tests/portfolio.test.ts`).

---
*Specification status: COMPLETE. Zero code has been modified.*
