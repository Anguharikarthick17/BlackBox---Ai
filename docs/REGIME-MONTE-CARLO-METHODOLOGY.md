# BLACKBOX X — PHASE 3.9
## REGIME-AWARE PROBABILISTIC INTELLIGENCE METHODOLOGY
### Mathematical Formulation, Algorithmic Architecture, and Non-Predictive Research Guidelines

---

## 1. Research Charter & Core Quantitative Invariant

### 1.1 Objective
Phase 3.9 extends BLACKBOX X from unconditional Monte Carlo simulations into **regime-conditioned probabilistic research**. The core research inquiry is:

> *"How does the simulated distribution of portfolio outcomes change when the simulation is conditioned on observed market regimes and empirically observed regime transitions?"*

### 1.2 Non-Predictive Institutional Boundary
BLACKBOX X **does not forecast future market regimes**, claim predictive foresight, or calculate "probabilities of crashes." 

The system strictly delineates four analytical layers:
1. **Historical Observation**: Post-hoc rule-based regime classifications applied to historical daily price bars in the offline demonstration dataset.
2. **Empirical Transition Estimation**: The observed transition counts $N_{ij}$ and frequencies $P_{ij}$ between consecutive daily historical regime states.
3. **Simulated Regime Path**: A synthetic discrete-time Markov sequence $R_0 \to R_1 \to \dots \to R_H$ governed strictly by empirical transition frequencies.
4. **Simulated Portfolio Outcome**: The resulting terminal wealth trajectory and drawdown distribution conditioned on the sampled regime sequence.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FOUR-TIER NON-PREDICTIVE TAXONOMY                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Historical Dataset ──► Rule-Based Regime Classification (Phase 2 Engine) │
│                                  │                                          │
│                                  ▼                                          │
│ 2. Empirical Frequency Matrix ──► Transition Counting: P_ij = N_ij / Σ N_ik │
│                                  │                                          │
│                                  ▼                                          │
│ 3. Synthetic State Sequence ────► Seeded Markov Chain: R_0 → R_1 → ... → R_H│
│                                  │                                          │
│                                  ▼                                          │
│ 4. Portfolio Distribution ──────► Terminal Wealth & Drawdown Percentiles    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forbidden Phrasing**:
- *"the market will enter..."*
- *"the next regime will be..."*
- *"probability of the next crash..."*
- *"forecasted regime"*

**Approved Framing**:
- *"BLACKBOX X evaluates how portfolio outcome distributions differ under regime-conditioned simulation assumptions."*
- *"Empirical transition frequency"*
- *"Fraction of simulated paths"*
- *"Starting regime scenario"*

---

## 2. Empirical Transition Matrix Formulation

Let $t \in \{1, \dots, T\}$ index the 1,825 synchronized contemporaneous daily observations ($T = 1,825$) spanning `2019-01-01` to `2023-12-31`.

The platform defines four macro regimes:
$$\mathcal{R} = \{\text{BULL}, \text{BEAR}, \text{HIGH\_VOLATILITY}, \text{LOW\_VOLATILITY}\}$$

### 2.1 Transition Accumulation
For consecutive daily observation pairs $(R_t, R_{t+1})$ where $t \in \{1, \dots, T-1\}$:
1. **Transition Count Matrix** $\mathbf{N} \in \mathbb{N}^{4 \times 4}$:
   $$N_{ij} = \sum_{t=1}^{T-1} \mathbb{I}\Big( R_t = i \;\land\; R_{t+1} = j \Big) \quad \forall i, j \in \mathcal{R}$$

2. **Total Outgoing Transitions**:
   $$N_i = \sum_{j \in \mathcal{R}} N_{ij}$$

3. **Empirical Transition Probabilities** $\mathbf{P} \in [0, 1]^{4 \times 4}$:
   $$P_{ij} = \begin{cases} \frac{N_{ij}}{N_i}, & N_i > 0 \\ 0, & N_i = 0 \end{cases}$$

### 2.2 Row-Stochastic Invariant
For every originating regime $i$ with $N_i > 0$:
$$\sum_{j \in \mathcal{R}} P_{ij} = 1.0$$

*No Artificial Smoothing*: Arbitrary Laplace smoothing (+1 pseudocounts) or synthetic transitions are strictly prohibited. Transition probabilities represent empirical observation counts from the finite historical demonstration window.

---

## 3. Sparse Regime & Zero Outgoing Transition Policy

To maintain statistical integrity and numerical safety:
1. **Minimum Observation Threshold**:
   $$\text{MIN\_REGIME\_OBSERVATIONS} = 20$$
   If $T_i < 20$, the regime is flagged as `SPARSE_WARNING`.

2. **Zero Outgoing Transition Blocking**:
   If an originating regime $i$ has $N_i = 0$:
   - The regime state is flagged as `'INSUFFICIENT_TRANSITION_DATA'`.
   - The simulation engine **strictly blocks** simulations attempting to start in regime $i$, returning an explicit error:
     `"Cannot execute regime-conditioned Monte Carlo: Starting regime [i] has zero observed outgoing transitions (INSUFFICIENT_TRANSITION_DATA)."`
   - During multi-regime comparative tables, regimes with $N_i = 0$ are rendered as `N/A (Insufficient Data)` rather than crashing the overall comparison.

---

## 4. Conditional Return Pools & Vector Preservation

For each regime $r \in \mathcal{R}$, observations are partitioned into conditional subsets:
$$\mathcal{D}_r = \Big\{ \mathbf{r}_t \;\Big|\; t \in \{1, \dots, T\} \;\land\; R_t = r \Big\}$$

### 4.1 Indivisible Multi-Asset Vector Invariant
For every day $t \in \mathcal{D}_r$, the return vector $\mathbf{r}_t = [r_{\text{GOLD},t}, r_{\text{BTC},t}, r_{\text{NVDA},t}]^T$ is treated as an indivisible atomic tuple. Assets are never independently bootstrapped within a regime, preserving authentic cross-asset dependence and flight-to-safety dynamics.

### 4.2 Conditional Moments
1. **Conditional Mean Vector** $\boldsymbol{\mu}_r$:
   $$\boldsymbol{\mu}_r = \frac{1}{T_r} \sum_{t \in \mathcal{D}_r} \mathbf{r}_t$$
2. **Conditional Daily Covariance** $\boldsymbol{\Sigma}_r$:
   $$\boldsymbol{\Sigma}_r = \frac{1}{T_r - 1} \sum_{t \in \mathcal{D}_r} (\mathbf{r}_t - \boldsymbol{\mu}_r)(\mathbf{r}_t - \boldsymbol{\mu}_r)^T$$
3. **Annualized Covariance & Volatility**:
   $$\boldsymbol{\Sigma}_{r,\text{annual}} = 252 \times \boldsymbol{\Sigma}_r, \quad \sigma_{r,i} = \sqrt{\Sigma_{r,ii}} \times \sqrt{252} \times 100\%$$

---

## 5. Simulation Methods

### 5.1 Method A: Regime-Conditioned Bootstrap (`REGIME_BOOTSTRAP`)
At forward day $\tau \in \{1, \dots, H\}$:
1. Identify active regime $R_\tau$.
2. Uniformly sample index $k \sim \mathcal{U}\{1, T_{R_\tau}\}$.
3. Resample synchronized vector:
   $$\mathbf{r}^*_\tau = \mathbf{r}_k \in \mathcal{D}_{R_\tau}$$
4. Update portfolio positions and evaluate rebalance triggers.
5. Transition regime state at close of day $\tau$ for day $\tau + 1$:
   $$R_{\tau+1} \sim \mathbf{P}_{R_\tau, \cdot}$$

### 5.2 Method B: Regime-Conditioned Parametric (`REGIME_PARAMETRIC`)
At forward day $\tau \in \{1, \dots, H\}$:
1. Retrieve conditional moments $\boldsymbol{\mu}_{R_\tau}$ and lower-triangular Cholesky factor $\mathbf{L}_{R_\tau}$.
   - If decomposition fails positive-definiteness ($L_{jj}^2 \le 10^{-10}$), reactive Tikhonov stabilization is applied: $\boldsymbol{\Sigma}_{r,\text{stable}} = \boldsymbol{\Sigma}_r + \lambda_r \mathbf{I}$.
2. Generate standard normal shocks: $\mathbf{z}_\tau \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ via Box-Muller transform.
3. Compute correlated shocks: $\boldsymbol{\varepsilon}_\tau = \mathbf{L}_{R_\tau} \mathbf{z}_\tau$.
4. Simulated return vector: $\mathbf{r}^*_\tau = \boldsymbol{\mu}_{R_\tau} + \boldsymbol{\varepsilon}_\tau$.
5. Update portfolio positions with bankruptcy clamping ($r^*_i \le -100\% \to V_{i,\tau} = 0$).
6. Transition regime state for day $\tau + 1$.

---

## 6. Starting Regime Semantics & Day-1 Protocol

The simulation supports six starting regime modes:
1. `START_CURRENT_OBSERVED`: Starts in the latest historical state ($R_T$, observation $1,825$).
2. `START_BULL`: Initial regime $R_0 = \text{BULL}$.
3. `START_BEAR`: Initial regime $R_0 = \text{BEAR}$.
4. `START_HIGH_VOL`: Initial regime $R_0 = \text{HIGH\_VOL}$.
5. `START_LOW_VOL`: Initial regime $R_0 = \text{LOW\_VOL}$.
6. `START_EMPIRICAL_DISTRIBUTION`: Initial regime $R_0$ sampled from observed occupancy frequencies $\boldsymbol{\pi} = [T_{\text{BULL}}/T, \dots, T_{\text{LOW\_VOL}}/T]$.

**Day-1 Return Convention Invariant:**
- Return at forward step $\tau = 1$ is generated **directly from the starting regime $R_0$**.
- The transition $R_0 \to R_1$ occurs at the close of day 1, governing returns for day 2.

---

## 7. Regime Persistence & Dwell Time Diagnostics

1. **Occupancy Frequency**:
   $$\pi_i = \frac{T_i}{T} \in [0, 1], \quad \sum_{i=1}^4 \pi_i = 1.0$$
2. **Empirical Mean & Median Dwell Time**:
   - $\bar{d}_i = \frac{1}{K_i} \sum_{k=1}^{K_i} d_{i,k}$ consecutive days.
   - $\text{Median}(d_i)$.
3. **Self-Transition Stickiness**:
   $$P_{ii} = \frac{N_{ii}}{N_i}$$
4. **Theoretical Geometric Dwell Time**:
   $$\mathbb{E}[D_i] = \frac{1}{1 - P_{ii}} \quad (\text{for } P_{ii} < 1.0)$$
5. **Switching Frequency**:
   $$\text{Rate}_{\text{switch}} = \frac{\sum_{i \ne j} N_{ij}}{T - 1}$$

---

## 8. Analytical Separation: Three-Tier Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THREE-TIER QUANTITATIVE HIERARCHY                        │
├──────────────────────┬────────────────────────┬─────────────────────────────┤
│ Tier                 │ Simulation Mechanism   │ Research Question Answered  │
├──────────────────────┼────────────────────────┼─────────────────────────────┤
│ A. Historical        │ Realized 2019–2023     │ What actually occurred over │
│    Backtest          │ Historical Daily Bars  │ the common synchronized bar?│
├──────────────────────┼────────────────────────┼─────────────────────────────┤
│ B. Unconditional     │ Stationary Resampling  │ What is outcome dispersion  │
│    Monte Carlo (3.8) │ Without Regime Shifts  │ under stationary history?   │
├──────────────────────┼────────────────────────┼─────────────────────────────┤
│ C. Regime-Conditioned│ Markov Regime Shifts   │ How do outcome distributions│
│    Monte Carlo (3.9) │ + Conditional Pools    │ shift by macro regime?      │
└──────────────────────┴────────────────────────┴─────────────────────────────┘
```

---

## 9. Performance & Bounded Execution Architecture

1. **Web Worker Non-Blocking Execution**:
   Reuses `monteCarlo.worker.ts` with dedicated message protocol (`action: 'REGIME'`).
2. **Memory Ceiling**:
   - Streaming percentile reductions (P05, P25, P50, P75, P95).
   - Up to 101 trajectory fan coordinates.
   - Exactly 50 representative sample paths transferred to React state.
   - Net message payload $< 5\text{ MB}$.
3. **Deterministic PRNG**:
   32-bit Mulberry32 generator ensures bit-identical reproducibility for identical configurations and seeds across both Web Worker and direct Node.js executions.
