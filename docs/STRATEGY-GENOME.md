# BLACKBOX X — Strategy Genome
## Quantitative Relationship Network Reference Manual

**Author:** BLACKBOX X Quantitative Research Team  
**Phase:** 3.3  
**Status:** Implemented & Mathematically Verified  
**TypeScript Verification:** Clean compile (`npx tsc --noEmit` — 0 errors)  
**Bundle Target:** Production Vite Build (`npm run build` — 0 errors)

---

## 1. Concept

**Strategy Genome** is an interactive quantitative relationship network that maps the structural topology connecting:
$$\mathbf{Assets} \longleftrightarrow \mathbf{Correlations} \longleftrightarrow \mathbf{Volatility} \longleftrightarrow \mathbf{Strategies} \longleftrightarrow \mathbf{Market\ Regimes} \longleftrightarrow \mathbf{Stress\ Responses}$$

### The Metaphor of the "Genome"
In genomics, a genome represents the complete set of structural instructions and connections that define how an organism expresses traits under varied environmental stimuli. In BLACKBOX X, the **Strategy Genome** serves as the **structural fingerprint of the quantitative market and strategy environment**.

> [!IMPORTANT]
> Strategy Genome is **not** a biological simulation, nor is it a decorative neon force-directed graph. Every node radius, edge weight, line dash pattern, coordinate vector, and inspector metric corresponds strictly to deterministic, calibrated mathematical output from the verified BLACKBOX X engines.

### Central Research Question
The system is designed to answer:
> *"How does the quantitative structure of this market and tested trading strategies transform across baseline, regime-shifted, and stressed market states?"*

---

## 2. Graph Model & Topology

The graph engine is implemented in [`src/core/strategyGenome.ts`](file:///Users/angu/Documents/BlackBox/src/core/strategyGenome.ts) with strict TypeScript types and zero `any` usage.

### Data Contracts

#### Node Definition (`GenomeNode`)
```typescript
export interface GenomeNode {
  id: string;
  type: GenomeNodeType; // 'ASSET' | 'STRATEGY' | 'REGIME' | 'RISK_METRIC'
  label: string;
  sublabel?: string;
  value: number;
  normalizedValue: number; // [0, 1] for visual radius mapping
  x: number; // Normalized coordinate [-1, 1]
  y: number; // Normalized coordinate [-1, 1]
  radius: number; // Viewbox radius [px]
  color: string;
  metadata: {
    asset?: Asset;
    strategy?: StrategyType;
    regime?: RegimeType;
    metrics?: Record<string, number | string>;
    stressed?: boolean;
  };
}
```

#### Edge Definition (`GenomeEdge`)
```typescript
export interface GenomeEdge {
  id: string;
  source: string;
  target: string;
  value: number; // Quantitative relationship value (e.g. Pearson correlation)
  normalizedStrength: number; // [0, 1] for stroke width scaling
  relationship: 'CORRELATION' | 'APPLICATION' | 'REGIME_EXPOSURE' | 'STRESS_SHIFT';
  isNegative?: boolean; // Controls dashed rendering for negative correlation
  metadata: {
    label: string;
    description: string;
    window?: number;
    mode?: 'STATIC' | 'ROLLING';
    baselineValue?: number;
    stressValue?: number;
  };
}
```

#### Snapshot Definition (`GenomeSnapshot`)
```typescript
export interface GenomeSnapshot {
  nodes: GenomeNode[];
  edges: GenomeEdge[];
  mode: GenomeMode; // 'MARKET' | 'STRATEGY' | 'REGIME' | 'STRESS'
  selectedAsset: Asset;
  selectedStrategy: StrategyType;
  fingerprint: StrategyRiskFingerprint;
  summary: {
    nodeCount: number;
    edgeCount: number;
    meanCorrelation: number;
    dominantRegime: string;
    activeAssetVol: number;
  };
}
```

---

## 3. Data Mapping & Quantitative Integrity

Every visual property maps directly to real calculations from the primary math engines:

| Visual Attribute | Target Element | Mathematical Formula / Source | Range / Scaling |
|---|---|---|---|
| **Asset Node Radius** | `ASSET` Nodes | Normalized Annualized Volatility $\sigma_{\text{ann}}$ from `metrics.ts` | $r \in [24\text{px}, 42\text{px}]$ |
| **Strategy Node Radius** | `STRATEGY` Nodes | Normalized Sharpe Ratio $S$ from `backtest.ts` | $r \in [22\text{px}, 36\text{px}]$ |
| **Regime Node Radius** | `REGIME` Nodes | Sub-period duration % or Win Rate from `regimes.ts` | $r \in [20\text{px}, 32\text{px}]$ |
| **Edge Stroke Width** | Correlation Edges | Absolute Pearson Correlation $|\rho|$ | $w \in [1.5\text{px}, 5.5\text{px}]$ |
| **Edge Dash Style** | Negative Correlations | `stroke-dasharray="6,4"` if $\rho < 0$, else solid | Binary structural distinction |
| **Node Color** | Asset / Strategy | Asset token colors (`GOLD`: `#E5A93C`, `BTC`: `#F7931A`, `NVDA`: `#76B900`) | Standard platform palette |

---

## 4. Correlation Methodology

### Static vs. Rolling Mode

```
┌────────────────────────────────────────────────────────┐
│ CORRELATION ENGINE (src/core/correlations.ts)          │
└────────────────────────────────────────────────────────┘
            │                               │
            ▼                               ▼
    [STATIC MODE]                   [ROLLING MODE]
Full 5-Year Pearson Matrix      Configurable Rolling Windows:
ρ(X, Y) = Cov(X,Y) / (σX σY)     - 30-Day Window (high responsiveness)
                                 - 60-Day Window (quarterly macro)
                                 - 90-Day Window (structural trend)
```

1. **Static Mode**: Evaluates daily log returns over the entire 5-year historical horizon (1,826 observations per asset).
2. **Rolling Mode**: Evaluates rolling Pearson correlation over lookbacks of $30$, $60$, or $90$ calendar days:
   $$\rho_t(X, Y) = \frac{\sum_{i=0}^{W-1} (R_{X, t-i} - \bar{R}_{X})(R_{Y, t-i} - \bar{R}_{Y})}{(W-1) \, s_{X, t} \, s_{Y, t}}$$
   The active edge thickness transitions dynamically to reflect the latest point of the selected rolling series.

### Non-Causal Semantics Rule
- **Allowed Descriptive Terms**: *"displays linear correlation"*, *"exhibits co-movement"*, *"correlation weakened"*, *"relationship inverted"*.
- **Strictly Prohibited Causal Terms**: *"causes"*, *"drives"*, *"predicts"*, *"leads to"*, *"triggers"*.

---

## 5. Strategy Mapping & Comparison Mode

Strategy Genome projects the backtest outcome of trading models without establishing an artificial "winner".

### Supported Strategy Types
- **SMA Crossover**: Trend-following via moving average crossovers (Fast Lookback: 10–30d, Slow Lookback: 40–100d).
- **EMA Trend**: Exponential smoothing responding to directional momentum while mitigating lag.
- **Momentum**: Relative rate-of-change over lookback horizon with directional threshold filter.
- **Mean Reversion**: Contrarian positioning based on statistical deviation (Z-score / Bollinger bands) around historical mean.

### Objective Comparative Inspection
When in **STRATEGY Mode**, all four strategies are arrayed around the selected asset. The inspector displays:
- **Total Return** ($\%$)
- **Sharpe Ratio** ($S$)
- **Annualized Volatility** ($\%$)
- **Maximum Drawdown** ($\%$)
- **Trade Count** ($N_{\text{trades}}$)

> [!NOTE]
> BLACKBOX X does not tag any strategy as "BEST", "TOP PERFORMER", or "WINNER". Strategies display differing risk-return profiles depending on market conditions, trade frequency, and asset volatility.

---

## 6. Regime Mapping

In **REGIME Mode**, the graph connects the active strategy to the four classified market environments detected by [`src/core/regimes.ts`](file:///Users/angu/Documents/BlackBox/src/core/regimes.ts):
1. **BULL REGIME**: Positive 60-day returns with moderate annualized volatility.
2. **BEAR REGIME**: Negative 60-day returns with elevated volatility.
3. **HIGH VOLATILITY REGIME**: Annualized volatility above the historical 75th percentile.
4. **LOW VOLATILITY REGIME**: Compressed volatility below the historical 25th percentile.

### Metric Attribution
Each regime node exposes real sub-period performance:
- **Regime Total Return**: Equity growth achieved exclusively while in that regime.
- **Regime Sharpe Ratio**: Risk-adjusted excess return normalized to sub-period duration.
- **Regime Win Rate**: Percentage of trades closed profitably during that market regime.

---

## 7. Stress Mapping (Time-Travel Macro Shock Lab Integration)

When **STRESS Mode** is active, Strategy Genome directly ingests the current `stressResult` produced by [`src/core/stressTesting.ts`](file:///Users/angu/Documents/BlackBox/src/core/stressTesting.ts):

### Dual Baseline vs. Stressed Representation
- **Asset Nodes**: Shows baseline historical volatility alongside stressed volatility:
  $$\sigma_{\text{stressed}} = \sigma_{\text{baseline}} \cdot M_{\text{vol}}$$
- **Drawdown Comparison**: Directly displays baseline maximum drawdown vs. crisis drawdown (e.g. $-18.4\%$ baseline vs $-41.2\%$ under COVID-19 liquidity shock).
- **Crisis Correlation Convergence**: Pairwise edges update to reflect correlation measured *during the crisis window*:
  - In liquidity crises, cross-asset correlations often surge toward $+1.0$ as investors liquidate liquid assets simultaneously.
  - The graph renders stressed edges with thicker stroke widths and red/amber stress accents to highlight diversification breakdown.

---

## 8. Strategy Risk Fingerprint (5D Radar Architecture)

The **Strategy Risk Fingerprint** renders a normalized 5-axis polygon representing the multidimensional risk profile of the active strategy:

```
                  VOLATILITY (σ)
                        ▲
                        │
         TURNOVER ◄─────┼─────► RETURN (μ)
                        │
              MDD ◄─────┼─────► SHARPE (S)
                        ▼
```

### Normalization Scale
Each axis maps actual values into $[0, 1]$ based on empirical multi-asset boundaries:
- **Return Axis**: Normalized over $[-20\%, +60\%]$
- **Volatility Axis**: Normalized over $[10\%, 80\%]$
- **Sharpe Axis**: Normalized over $[-0.5, +2.5]$
- **Drawdown Axis**: Normalized inverted scale where smaller drawdown yields higher score
- **Turnover Axis**: Normalized over $[0, 100\text{ trades}]$

Actual quantitative numbers are displayed directly in the badge chips alongside the diagram.

---

## 9. Ghost Mode 2.0 Integration

Strategy Genome is directly wired to the **Ghost Mode 2.0 Research Trail**:
- **Insight Category**: `GENOME_RELATIONSHIP_SHIFT`
- **Trigger**: Detected when rolling correlation shifts by $|\Delta \rho| \ge 0.15$ over 60-day windows.
- **Actionable Next Test**: Dispatches `NAVIGATE` actions with target `'genome'` or `'stress'`, enabling seamless hypothesis-driven navigation between correlation analysis, genome topology, and stress testing.

---

## 10. Performance & Accessibility Safeguards

### Performance Optimizations
- **`useMemo` Memoization**: Graph layout, node positioning, edge calculations, and 5D fingerprint coordinates are wrapped in `useMemo` blocks keyed strictly to `[prices, asset, strategy, params, mode, correlationMode, correlationWindow, stressResult]`.
- **Zero Calculation on Hover**: Hovering or clicking nodes/edges performs constant-time state lookups ($O(1)$) without re-running backtests or correlation matrices.
- **SVG Hardware Acceleration**: The graph is rendered with vector SVG paths utilizing CSS transforms and Framer Motion spring physics.

### Accessibility & Reduced Motion
- **Reduced Motion Support**: Inspects `useReducedMotion()` from Framer Motion. Transitions collapse from animated springs to zero-duration opacity changes.
- **Multi-Channel Encodings**: Negative correlations utilize dashed stroke patterns (`stroke-dasharray="6,4"`) in addition to color distinctions to ensure full readability for color-blind researchers.
- **Semantic ARIA Badging**: Controls, SVG nodes, and inspector panels feature standard semantic roles and descriptive titles.

---

## 11. Interpretation Limitations

1. **Non-Predictive Historical Representation**: Strategy Genome illustrates structural relationships within historical data (2019–2023) or simulated stress models. It does not predict future price trajectories or structural breaks.
2. **Linear Metric Dependence**: Correlation edges utilize the Pearson product-moment correlation coefficient, which quantifies linear co-dependence. Non-linear coupling, tail dependence, or asymmetric downside copulas are not captured by single-point correlation values.
3. **Execution Assumptions**: Backtest metrics shown on strategy nodes assume next-bar close fills with $0.10\%$ round-trip transaction costs and zero intraday slippage or liquidity constraints.
