# BLACKBOX X — Time-Travel Macro Shock Lab: Mathematical Methodology

**Module:** [`src/core/stressTesting.ts`](file:///Users/angu/Documents/BlackBox/src/core/stressTesting.ts)  
**UI Interface:** [`src/components/workspace/StressLab.tsx`](file:///Users/angu/Documents/BlackBox/src/components/workspace/StressLab.tsx)  
**Classification:** Deterministic Quantitative Stress-Testing Engine  

---

## 1. Executive Summary & Purpose

The **Time-Travel Macro Shock Lab** allows quantitative researchers to evaluate portfolio resilience under extreme macro stress scenarios (e.g. 2008 GFC systemic deleveraging, 2020 COVID flash liquidity freezes, and 2022 monetary tightening duration grinds).

Instead of relying on simplistic static percentage drops or unverified historical tick replays, BLACKBOX X employs a **continuous time-dependent macro shock transformation** that models:
1. **S-Curve Drawdown Cascade** (gradual onset accelerating to trough).
2. **Deterministic Micro-Volatility Expansion** (widening bid-ask spreads and intra-day whipsaws).
3. **Chop / Stress Plateau** (prolonged high-volatility regime at market bottom).
4. **Polynomial Recovery Glide** (decaying post-crisis recovery trajectory).
5. **Asset-Specific Crisis Sensitivities** ($\lambda_{\text{asset}}$ coefficients).

---

## 2. Mathematical Shock Formulation

For any historical price point $P_{\text{base}}(t)$ at trading day $t \in [0, N-1]$, the stressed price series $P_{\text{stressed}}(t)$ is defined as:

$$P_{\text{stressed}}(t) = P_{\text{base}}(t) \cdot \max\left(0.05, \, 1 + D(t) \cdot \lambda_{\text{asset}} + \epsilon_{\text{vol}}(t)\right)$$

Where:
- $D(t) \in [0, D_{\text{base}}]$ represents the time-dependent macro drawdown component.
- $\lambda_{\text{asset}}$ is the asset-specific crisis sensitivity coefficient.
- $\epsilon_{\text{vol}}(t)$ is the deterministic harmonic micro-volatility term.

### Phase 1: Pre-Shock Baseline ($t < t_{\text{start}}$)
$$D(t) = 0, \quad \epsilon_{\text{vol}}(t) = 0 \implies P_{\text{stressed}}(t) = P_{\text{base}}(t)$$

### Phase 2: Shock Contraction ($t_{\text{start}} \le t \le t_{\text{trough}}$)
Let $\tau = \frac{t - t_{\text{start}}}{T_{\text{shock}}} \in [0, 1]$ be the normalized shock progress. The smooth S-curve contraction is:

$$D(\tau) = D_{\text{base}} \cdot \frac{1 - \cos(\pi \tau)}{2}$$

The harmonic volatility term widens with the volatility multiplier $\sigma_{\text{mult}}$:
$$\epsilon_{\text{vol}}(t) = \eta(t, \text{seed}) \cdot 0.015 \cdot (\sigma_{\text{mult}} - 1)$$

Where $\eta(t, \text{seed}) \in [-1, 1]$ is a deterministic pseudo-random function:
$$\eta(t, \text{seed}) = 2 \cdot \operatorname{frac}\left(\sin(t \cdot 12.9898 + \text{seed} \cdot 78.233) \cdot 43758.5453\right) - 1$$

### Phase 3: Stress Plateau at Trough ($t_{\text{trough}} < t \le t_{\text{stress\_end}}$)
At the bottom of the crisis, prices experience choppy dispersion without immediate directional trend:
$$D(t) = D_{\text{base}} \cdot \left[1 + 0.02 \cdot \sin\left(\frac{t - t_{\text{trough}}}{T_{\text{stress}}} \cdot 2\pi\right)\right]$$
$$\epsilon_{\text{vol}}(t) = \eta(t, \text{seed}) \cdot 0.02 \cdot \sigma_{\text{mult}}$$

### Phase 4: Concave Recovery Glide ($t_{\text{stress\_end}} < t \le t_{\text{recovery\_end}}$)
Let $\rho = \frac{t - t_{\text{stress\_end}}}{T_{\text{recovery}}} \in [0, 1]$ be normalized recovery progress. Post-crisis appreciation exhibits diminishing marginal recovery:
$$\operatorname{Rec}(\rho) = D_{\text{base}} \cdot \left(1 - \rho^{0.7} \cdot 0.88\right)$$
$$D(t) = \operatorname{Rec}(\rho)$$
$$\epsilon_{\text{vol}}(t) = \eta(t, \text{seed}) \cdot 0.01 \cdot \left[1 + (\sigma_{\text{mult}} - 1)(1 - \rho)\right]$$

---

## 3. Crisis Scenario Archetypes & Model Sensitivities

| Scenario Archetype | Base Drawdown $D_{\text{base}}$ | Shock Window | Vol Multiplier | Asset Sensitivity $\lambda_{\text{asset}}$ | Crisis Mechanism |
|---|---|---|---|---|---|
| **2008 Style: Global Financial Crisis** | $-38\%$ | 45 days | $2.2\times$ | **Gold:** $0.45\times$<br>**BTC:** $1.40\times$<br>**NVDA:** $1.35\times$ | Broad credit freeze and persistent deleveraging. Gold functions as a safe haven while high-beta tech suffers prolonged drawdown. |
| **2020 Style: COVID Liquidity Crash** | $-32\%$ | 16 days | $2.8\times$ | **Gold:** $0.55\times$<br>**BTC:** $1.65\times$<br>**NVDA:** $1.15\times$ | Abrupt indiscriminate liquidity drain across all assets, followed by an aggressive V-shaped fiscal/monetary rebound. |
| **2022 Style: Rate Shock** | $-28\%$ | 60 days | $1.7\times$ | **Gold:** $0.70\times$<br>**BTC:** $1.80\times$<br>**NVDA:** $1.50\times$ | Persistent monetary tightening causing multiple compression and duration repricing across speculative growth assets. |
| **Crypto Contagion Crash** | $-55\%$ | 22 days | $3.2\times$ | **Gold:** $0.05\times$<br>**BTC:** $2.10\times$<br>**NVDA:** $0.25\times$ | Extreme crypto-native liquidation cascade (de-peg / exchange insolvency) with minimal macro spillover. |

---

## 4. Backtest Integrity & Anti-Bias Preservation

The stressed backtest is executed using the exact same backtesting engine as the baseline:
1. **Next-Bar Close Execution**: Signals are generated on Close $t$; order fills occur on Close $t+1$. No look-ahead bias is introduced during the crisis.
2. **Realistic Transaction Friction**: Round-trip transaction fees (e.g. $0.10\%$) are deducted upon entry and exit, compounding the cost of stop-loss whipsaws during the shock.
3. **Position Sizing & Cash Rules**: When the strategy exits to cash (0 position), capital is insulated from subsequent negative drift in the stressed price series.

---

## 5. Cross-Asset Correlation Under Stress

During systemic liquidity events, diversified portfolios frequently experience **crisis correlation convergence**:
$$\rho_{\text{crisis}}(A, B) = \frac{\operatorname{Cov}_{\text{crisis}}(r_A, r_B)}{\sigma_{\text{crisis}}(A) \cdot \sigma_{\text{crisis}}(B)}$$
Calculated strictly across the window $[t_{\text{start}} - 5, \, t_{\text{trough}} + T_{\text{stress}} + 10]$. This allows researchers to verify whether assets that were uncorrelated during benign conditions ($\rho \approx 0.1$) abruptly converge ($\rho \to +0.8$) when panic selling occurs.
