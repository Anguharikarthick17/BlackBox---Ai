/**
 * BLACKBOX X — Quantitative Research Insight Engine (Ghost Mode 2.0)
 *
 * Deterministic rule-based analytical engine that converts actual quantitative
 * metrics, backtest results, regime statistics, and robustness profiles into
 * a structured research pipeline:
 *
 * OBSERVATION → HYPOTHESIS → EVIDENCE → IMPACT → NEXT TEST
 *
 * STRICT ZERO-FABRICATION RULE:
 * Every number displayed must originate directly from verified calculations
 * in metrics.ts, backtest.ts, correlations.ts, regimes.ts, or robustness.ts.
 * No imaginary figures, no AI hallucinations, no investment recommendations.
 */

import { Asset, ASSET_LABELS, PricePoint, PRICE_DATA, getDataInRange } from './data';
import { StrategyType, StrategyParams, STRATEGY_LABELS, generateSignals, DEFAULT_PARAMS } from './strategies';
import { runBacktest, BacktestResult, BacktestConfig } from './backtest';
import { computeMetrics, MetricsResult, computeRollingVolatility } from './metrics';
import { computeCorrelationMatrix, computeRollingCorrelation, CorrelationMatrix } from './correlations';
import {
  detectRegimes, computeRegimePeriods, strategyPerformanceByRegime,
  RegimePoint, RegimePeriod, RegimeStrategyPerf, REGIME_LABELS,
} from './regimes';
import { runRobustnessSweep, generateDefaultConfigs, RobustnessResult } from './robustness';
import { StressResult } from './stressTesting';

export type InsightCategory =
  | 'VOLATILITY_SHIFT'
  | 'DRAWDOWN_PRESSURE'
  | 'STRATEGY_PERFORMANCE'
  | 'COST_PRESSURE'
  | 'CORRELATION_SHIFT'
  | 'REGIME_BEHAVIOR'
  | 'ROBUSTNESS_STABILITY'
  | 'STRESS_SENSITIVITY'
  | 'RECOVERY_PRESSURE'
  | 'CORRELATION_CONVERGENCE'
  | 'GENOME_RELATIONSHIP_SHIFT';

export interface ResearchEvidence {
  label: string;
  value: string;
  comparison?: string;
  source: 'metrics-engine' | 'backtest-engine' | 'regime-engine' | 'robustness-engine' | 'correlation-engine' | 'stress-engine';
}

export type NextTestActionType =
  | 'NAVIGATE'
  | 'SET_STRATEGY'
  | 'UPDATE_PARAMS'
  | 'SET_TRANSACTION_COST'
  | 'RUN_ROBUSTNESS'
  | 'SET_ASSET';

export interface NextTestAction {
  label: string;
  description: string;
  actionType: NextTestActionType;
  targetSection?: string;
  payload?: any;
}

export interface ResearchInsight {
  id: string;
  category: InsightCategory;
  categoryLabel: string;
  title: string;
  observation: string;
  hypothesis: string;
  evidence: ResearchEvidence[];
  impact: string;
  nextTest: NextTestAction;
  sourceMetrics: string[];
}

export interface InsightEngineInput {
  asset: Asset;
  strategy: StrategyType;
  params: StrategyParams;
  startDate: string;
  endDate: string;
  initialCapital: number;
  positionSizePct: number;
  transactionCostPct: number;
  metrics?: MetricsResult | null;
  backtestResult?: BacktestResult | null;
  correlationMatrix?: CorrelationMatrix | null;
  regimePoints?: RegimePoint[];
  regimePeriods?: RegimePeriod[];
  regimePerformance?: RegimeStrategyPerf[];
  robustnessResults?: RobustnessResult[];
  stressResult?: StressResult | null;
}

/**
 * Generate fully verified, deterministic research insights based on
 * the current application state and quantitative engine outputs.
 */
export function generateResearchInsights(input: InsightEngineInput): ResearchInsight[] {
  const {
    asset,
    strategy,
    params,
    startDate,
    endDate,
    initialCapital,
    positionSizePct,
    transactionCostPct,
  } = input;

  const prices = getDataInRange(asset, startDate, endDate);
  if (prices.length < 20) {
    return [];
  }

  // Ensure metrics are available
  const metrics: MetricsResult = input.metrics ?? computeMetrics(prices);

  // Ensure backtest is available
  let backtestResult: BacktestResult = input.backtestResult as BacktestResult;
  if (!backtestResult || backtestResult.strategyEquity.length === 0) {
    const signals = generateSignals(prices, strategy, params);
    backtestResult = runBacktest(prices, signals, {
      initialCapital,
      positionSizePct,
      transactionCostPct,
    });
  }

  const insights: ResearchInsight[] = [];
  const assetName = ASSET_LABELS[asset];
  const strategyName = STRATEGY_LABELS[strategy];

  // =========================================================================
  // 1. VOLATILITY SHIFT INSIGHT
  // =========================================================================
  const rolling30 = computeRollingVolatility(prices, 30);
  if (rolling30.length > 0) {
    const recentVol = rolling30[rolling30.length - 1].value;
    const fullVol = metrics.volatility;
    const volDelta = recentVol - fullVol;
    const isElevated = volDelta > 3.0;
    const isCompressed = volDelta < -3.0;

    insights.push({
      id: `vol-${asset}-${recentVol.toFixed(1)}`,
      category: 'VOLATILITY_SHIFT',
      categoryLabel: 'Volatility Shift',
      title: isElevated
        ? `${assetName} Rolling Volatility Elevated Above 5-Year Baseline`
        : isCompressed
        ? `${assetName} Volatility Compression Detected`
        : `${assetName} Volatility Remains Consistent with Historical Baseline`,
      observation: isElevated
        ? `Recent 30-day annualized volatility for ${assetName} is measured at ${recentVol.toFixed(2)}%, a ${volDelta > 0 ? '+' : ''}${volDelta.toFixed(2)}% divergence from the full-period baseline of ${fullVol.toFixed(2)}%.`
        : isCompressed
        ? `Recent 30-day annualized volatility for ${assetName} contracted to ${recentVol.toFixed(2)}%, falling ${Math.abs(volDelta).toFixed(2)}% below the historical baseline of ${fullVol.toFixed(2)}%.`
        : `Recent 30-day annualized volatility (${recentVol.toFixed(2)}%) closely tracks the historical full-period mean (${fullVol.toFixed(2)}%).`,
      hypothesis: isElevated
        ? `Elevated volatility increases price noise relative to trend signal strength, potentially triggering premature exits or false breakout fills in ${strategyName}.`
        : isCompressed
        ? `Volatility contraction suggests range consolidation; moving-average crossovers are prone to whipsaws until a directional breakout emerges.`
        : `Normal market dispersion allows moving-average and momentum filters to operate within expected historical signal-to-noise parameters.`,
      evidence: [
        {
          label: 'Recent 30d Volatility (ann.)',
          value: `${recentVol.toFixed(2)}%`,
          comparison: `${volDelta > 0 ? '+' : ''}${volDelta.toFixed(2)}% vs baseline`,
          source: 'metrics-engine',
        },
        {
          label: 'Full-Period Volatility (ann.)',
          value: `${fullVol.toFixed(2)}%`,
          source: 'metrics-engine',
        },
        {
          label: 'Sharpe Ratio (rf=4%)',
          value: metrics.sharpeRatio.toFixed(2),
          source: 'metrics-engine',
        },
      ],
      impact: isElevated
        ? `Under higher volatility, ${strategyName} experienced a maximum drawdown of ${backtestResult.maxDrawdown.toFixed(2)}% with ${backtestResult.numTrades} executed trades.`
        : `Measured historical risk-adjusted return stands at Sharpe ${metrics.sharpeRatio.toFixed(2)} with Calmar ratio ${metrics.calmarRatio.toFixed(2)}.`,
      nextTest: {
        label: isElevated ? 'Test Longer Smoothing Period' : 'Inspect Volatility Distribution',
        description: isElevated
          ? 'Increase lookback windows to filter high-frequency price noise.'
          : 'Review rolling risk dynamics in Quantitative Analysis.',
        actionType: isElevated ? 'UPDATE_PARAMS' : 'NAVIGATE',
        targetSection: isElevated ? undefined : 'analysis',
        payload: isElevated
          ? (strategy === 'SMA_CROSSOVER'
              ? { shortPeriod: (params.shortPeriod ?? 20) + 10, longPeriod: (params.longPeriod ?? 50) + 20 }
              : strategy === 'EMA_TREND'
              ? { shortPeriod: (params.shortPeriod ?? 12) + 8, longPeriod: (params.longPeriod ?? 26) + 14 }
              : { lookback: (params.lookback ?? 20) + 10 })
          : undefined,
      },
      sourceMetrics: ['volatility', 'rollingVolatility', 'sharpeRatio'],
    });
  }

  // =========================================================================
  // 2. STRATEGY OUTPERFORMANCE / UNDERPERFORMANCE (VS BUY & HOLD)
  // =========================================================================
  const stratReturn = backtestResult.totalReturn;
  const bhReturn = backtestResult.buyHoldReturn;
  const alpha = stratReturn - bhReturn;
  const stratSharpe = backtestResult.sharpeRatio;
  const bhSharpe = backtestResult.buyHoldSharpe;
  const sharpeDelta = stratSharpe - bhSharpe;
  const outperforming = alpha > 0;

  insights.push({
    id: `perf-${strategy}-${stratReturn.toFixed(1)}`,
    category: 'STRATEGY_PERFORMANCE',
    categoryLabel: 'Benchmark Comparison',
    title: outperforming
      ? `${strategyName} Generated +${alpha.toFixed(2)}% Alpha Over Buy & Hold`
      : `${strategyName} Underperformed Buy & Hold by ${Math.abs(alpha).toFixed(2)}%`,
    observation: `Over the period ${startDate} to ${endDate}, ${strategyName} on ${assetName} produced a total return of ${stratReturn > 0 ? '+' : ''}${stratReturn.toFixed(2)}% compared to ${bhReturn > 0 ? '+' : ''}${bhReturn.toFixed(2)}% for Buy & Hold.`,
    hypothesis: outperforming
      ? `Systematic risk reduction via zero-position cash holding during downtrends protected capital, yielding superior compound returns.`
      : `Lagging trend indicator entries and transaction costs created drag relative to full passive asset exposure during sustained upward appreciation.`,
    evidence: [
      {
        label: 'Strategy Total Return',
        value: `${stratReturn > 0 ? '+' : ''}${stratReturn.toFixed(2)}%`,
        comparison: `${alpha > 0 ? '+' : ''}${alpha.toFixed(2)}% alpha`,
        source: 'backtest-engine',
      },
      {
        label: 'Buy & Hold Return',
        value: `${bhReturn > 0 ? '+' : ''}${bhReturn.toFixed(2)}%`,
        source: 'backtest-engine',
      },
      {
        label: 'Strategy Sharpe',
        value: stratSharpe.toFixed(2),
        comparison: `${sharpeDelta > 0 ? '+' : ''}${sharpeDelta.toFixed(2)} vs B&H`,
        source: 'backtest-engine',
      },
      {
        label: 'Buy & Hold Sharpe',
        value: bhSharpe.toFixed(2),
        source: 'backtest-engine',
      },
    ],
    impact: `Ending capital reached $${backtestResult.endCapital.toLocaleString('en-US', { minimumFractionDigits: 0 })} versus $${backtestResult.buyHoldEndCapital.toLocaleString('en-US', { minimumFractionDigits: 0 })} for passive holding. Annualized strategy volatility was ${backtestResult.volatility.toFixed(2)}% vs ${backtestResult.buyHoldVolatility.toFixed(2)}% for Buy & Hold.`,
    nextTest: {
      label: 'Run Parameter Robustness Sweep',
      description: 'Check whether this alpha persists across parameter permutations or is an artifact of specific calibration.',
      actionType: 'RUN_ROBUSTNESS',
      targetSection: 'robustness',
    },
    sourceMetrics: ['totalReturn', 'buyHoldReturn', 'sharpeRatio', 'buyHoldSharpe', 'endCapital'],
  });

  // =========================================================================
  // 3. DRAWDOWN PRESSURE
  // =========================================================================
  const stratMDD = backtestResult.maxDrawdown;
  const bhMDD = backtestResult.buyHoldMaxDrawdown;
  const mddDelta = stratMDD - bhMDD; // e.g. -20% - (-50%) = +30% (mdd reduction is positive)
  const mddProtected = stratMDD > bhMDD;

  insights.push({
    id: `mdd-${asset}-${stratMDD.toFixed(1)}`,
    category: 'DRAWDOWN_PRESSURE',
    categoryLabel: 'Drawdown Profile',
    title: mddProtected
      ? `Strategy Reduced Peak Drawdown by ${Math.abs(mddDelta).toFixed(2)}% vs Benchmark`
      : `Strategy Drawdown (${stratMDD.toFixed(2)}%) Exceeded Benchmark (${bhMDD.toFixed(2)}%)`,
    observation: `${strategyName} recorded a maximum drawdown of ${stratMDD.toFixed(2)}%, whereas holding ${assetName} passively suffered a maximum drawdown of ${bhMDD.toFixed(2)}%.`,
    hypothesis: mddProtected
      ? `Execution rules successfully shifted position to 100% cash before the deepest stages of asset drawdowns materialized.`
      : `Whipsaw false triggers caused consecutive losing trades at cyclical tops and bottoms, compounding capital degradation.`,
    evidence: [
      {
        label: 'Strategy Max Drawdown',
        value: `${stratMDD.toFixed(2)}%`,
        comparison: mddProtected ? `+${mddDelta.toFixed(2)}% better` : `${mddDelta.toFixed(2)}% worse`,
        source: 'backtest-engine',
      },
      {
        label: 'Buy & Hold Max Drawdown',
        value: `${bhMDD.toFixed(2)}%`,
        source: 'backtest-engine',
      },
      {
        label: 'Worst Single Trade',
        value: `${backtestResult.worstTrade.toFixed(2)}%`,
        source: 'backtest-engine',
      },
    ],
    impact: mddProtected
      ? `Capital preservation allowed the portfolio to recover more rapidly from market drawdowns without absorbing severe tail risk.`
      : `Deeper drawdown increased time underwater and lowered compound growth potential across the testing interval.`,
    nextTest: {
      label: 'Compare Strategy Lab Visuals',
      description: 'Review the equity curve and entry/exit signal markers in Strategy Lab.',
      actionType: 'NAVIGATE',
      targetSection: 'strategy',
    },
    sourceMetrics: ['maxDrawdown', 'buyHoldMaxDrawdown', 'worstTrade'],
  });

  // =========================================================================
  // 4. TRADE FREQUENCY & COST PRESSURE
  // =========================================================================
  const numTrades = backtestResult.numTrades;
  const winRate = backtestResult.winRate;
  const costPct = transactionCostPct * 100;
  const estimatedTotalCostDollars = backtestResult.trades.reduce(
    (acc, t) => acc + (t.entryPrice * 0.001) + (t.exitPrice * 0.001), 0
  );

  insights.push({
    id: `cost-${numTrades}-${costPct.toFixed(2)}`,
    category: 'COST_PRESSURE',
    categoryLabel: 'Trade Frequency & Cost Friction',
    title: numTrades > 25
      ? `High Trade Turnover (${numTrades} Trades) Multiplies Cost Friction`
      : `Moderate Turnover (${numTrades} Trades) Retains Execution Efficiency`,
    observation: `The backtest generated ${numTrades} round-trip trade executions with a measured win rate of ${winRate.toFixed(1)}% under a ${(costPct).toFixed(2)}% per-trade transaction friction assumption.`,
    hypothesis: numTrades > 25
      ? `Short indicator windows generate frequent signal switching, where cumulative entry and exit costs significantly drag down net returns.`
      : `Selective signal generation limits churn, ensuring transaction friction does not dominate net compounding.`,
    evidence: [
      {
        label: 'Trade Count',
        value: `${numTrades} trades`,
        source: 'backtest-engine',
      },
      {
        label: 'Win Rate',
        value: `${winRate.toFixed(1)}%`,
        comparison: winRate >= 50 ? 'Positive edge' : 'Under 50% hit rate',
        source: 'backtest-engine',
      },
      {
        label: 'Transaction Friction Rate',
        value: `${costPct.toFixed(2)}% per trade`,
        source: 'backtest-engine',
      },
      {
        label: 'Average Trade P&L',
        value: `${backtestResult.avgTrade > 0 ? '+' : ''}${backtestResult.avgTrade.toFixed(2)}%`,
        source: 'backtest-engine',
      },
    ],
    impact: `Average trade gain of ${backtestResult.avgTrade > 0 ? '+' : ''}${backtestResult.avgTrade.toFixed(2)}% must sufficiently exceed round-trip friction (${(costPct * 2).toFixed(2)}%) to maintain statistical profitability.`,
    nextTest: {
      label: 'Test Higher Transaction Cost (0.25%)',
      description: 'Verify if the strategy edge survives elevated real-world slippage and brokerage fees.',
      actionType: 'SET_TRANSACTION_COST',
      payload: 0.0025,
    },
    sourceMetrics: ['numTrades', 'winRate', 'avgTrade', 'transactionCostPct'],
  });

  // =========================================================================
  // 5. CROSS-ASSET CORRELATION DYNAMICS
  // =========================================================================
  const peerAsset: Asset = asset === 'BTC' ? 'NVDA' : asset === 'NVDA' ? 'BTC' : 'BTC';
  const fullCorr = computeCorrelationMatrix(PRICE_DATA);
  const pairCorr = fullCorr[asset][peerAsset];
  const rollingCorr = computeRollingCorrelation(PRICE_DATA[asset], PRICE_DATA[peerAsset], 60);

  if (rollingCorr.length > 0) {
    const recentCorr = rollingCorr[rollingCorr.length - 1].value;
    const corrShift = recentCorr - pairCorr;

    insights.push({
      id: `corr-${asset}-${peerAsset}-${recentCorr.toFixed(2)}`,
      category: 'CORRELATION_SHIFT',
      categoryLabel: 'Cross-Asset Correlation',
      title: `${assetName} × ${ASSET_LABELS[peerAsset]} Correlation at ρ = ${recentCorr.toFixed(2)}`,
      observation: `The 60-day rolling correlation between ${assetName} and ${ASSET_LABELS[peerAsset]} is currently ρ = ${recentCorr.toFixed(2)}, compared to a 5-year full-period correlation of ρ = ${pairCorr.toFixed(2)} (shift: ${corrShift > 0 ? '+' : ''}${corrShift.toFixed(2)}).`,
      hypothesis: Math.abs(recentCorr) < 0.3
        ? `Low correlation indicates idiosyncratic driver regime, providing meaningful cross-asset diversification benefits.`
        : recentCorr > 0.6
        ? `Strong positive co-movement suggests common liquidity or risk-on macro factors are simultaneously driving both assets.`
        : `Moderate co-movement reflects partial factor alignment without complete coupling.`,
      evidence: [
        {
          label: `Recent 60d Correlation`,
          value: `ρ = ${recentCorr.toFixed(3)}`,
          comparison: `${corrShift > 0 ? '+' : ''}${corrShift.toFixed(2)} vs full history`,
          source: 'correlation-engine',
        },
        {
          label: `Full-Period Correlation`,
          value: `ρ = ${pairCorr.toFixed(3)}`,
          source: 'correlation-engine',
        },
      ],
      impact: `A rolling correlation of ${recentCorr.toFixed(2)} means pairing ${assetName} with ${ASSET_LABELS[peerAsset]} yields ${Math.abs(recentCorr) < 0.3 ? 'high' : 'reduced'} portfolio diversification benefit during this specific window.`,
      nextTest: {
        label: 'Open Correlation Matrix',
        description: 'Analyze all 3 asset pairs and rolling correlation windows in the Correlation view.',
        actionType: 'NAVIGATE',
        targetSection: 'correlation',
      },
      sourceMetrics: ['correlation', 'rollingCorrelation'],
    });
  }

  // =========================================================================
  // 6. MARKET REGIME BEHAVIOR
  // =========================================================================
  const regimePoints = input.regimePoints && input.regimePoints.length > 0
    ? input.regimePoints
    : detectRegimes(prices);

  const regimePeriods = input.regimePeriods && input.regimePeriods.length > 0
    ? input.regimePeriods
    : computeRegimePeriods(regimePoints);

  const regimePerf = input.regimePerformance && input.regimePerformance.length > 0
    ? input.regimePerformance
    : strategyPerformanceByRegime(
        regimePoints,
        backtestResult.strategyEquity,
        backtestResult.buyHoldEquity,
        backtestResult.trades,
      );

  if (regimePerf.length > 0) {
    // Find best and worst regime for strategy
    const sortedByReturn = [...regimePerf].sort((a, b) => b.strategyReturn - a.strategyReturn);
    const bestRegime = sortedByReturn[0];
    const worstRegime = sortedByReturn[sortedByReturn.length - 1];

    insights.push({
      id: `regime-${bestRegime.regime}-${worstRegime.regime}`,
      category: 'REGIME_BEHAVIOR',
      categoryLabel: 'Market Regime Asymmetry',
      title: `Strongest in ${REGIME_LABELS[bestRegime.regime]} (${bestRegime.strategyReturn > 0 ? '+' : ''}${bestRegime.strategyReturn.toFixed(1)}%), Weakest in ${REGIME_LABELS[worstRegime.regime]}`,
      observation: `When decomposed across detected market regimes, ${strategyName} achieved ${bestRegime.strategyReturn > 0 ? '+' : ''}${bestRegime.strategyReturn.toFixed(1)}% in ${REGIME_LABELS[bestRegime.regime]} regimes, but recorded ${worstRegime.strategyReturn > 0 ? '+' : ''}${worstRegime.strategyReturn.toFixed(1)}% in ${REGIME_LABELS[worstRegime.regime]} periods.`,
      hypothesis: `Moving-average and trend strategies inherently thrive during directional regime persistence (${REGIME_LABELS[bestRegime.regime]}), but suffer adverse fills and chop during choppy or mean-reverting regimes (${REGIME_LABELS[worstRegime.regime]}).`,
      evidence: [
        {
          label: `${REGIME_LABELS[bestRegime.regime]} Strategy Return`,
          value: `${bestRegime.strategyReturn > 0 ? '+' : ''}${bestRegime.strategyReturn.toFixed(2)}%`,
          comparison: `Win rate: ${bestRegime.winRate.toFixed(1)}%`,
          source: 'regime-engine',
        },
        {
          label: `${REGIME_LABELS[worstRegime.regime]} Strategy Return`,
          value: `${worstRegime.strategyReturn > 0 ? '+' : ''}${worstRegime.strategyReturn.toFixed(2)}%`,
          comparison: `Win rate: ${worstRegime.winRate.toFixed(1)}%`,
          source: 'regime-engine',
        },
        {
          label: `${REGIME_LABELS[bestRegime.regime]} B&H Return`,
          value: `${bestRegime.buyHoldReturn > 0 ? '+' : ''}${bestRegime.buyHoldReturn.toFixed(2)}%`,
          source: 'regime-engine',
        },
      ],
      impact: `Performance is heavily state-dependent. Knowing the prevailing regime is critical to determining whether ${strategyName} holds an active edge.`,
      nextTest: {
        label: 'Inspect Regime Timeline',
        description: 'Examine historical regime classifications and duration breakdown in Market Regimes.',
        actionType: 'NAVIGATE',
        targetSection: 'regimes',
      },
      sourceMetrics: ['regimeStrategyReturn', 'regimeBuyHoldReturn', 'regimeWinRate'],
    });
  }

  // =========================================================================
  // 7. ROBUSTNESS & PARAMETER STABILITY
  // =========================================================================
  if (input.robustnessResults && input.robustnessResults.length > 0) {
    const results = input.robustnessResults;
    const returns = results.map(r => r.totalReturn);
    const minRet = Math.min(...returns);
    const maxRet = Math.max(...returns);
    const positiveAlphas = results.filter(r => r.alpha > 0).length;
    const consistencyRate = (positiveAlphas / results.length) * 100;
    const isStable = consistencyRate >= 60;

    insights.push({
      id: `rob-${consistencyRate.toFixed(0)}`,
      category: 'ROBUSTNESS_STABILITY',
      categoryLabel: 'Parameter Sensitivity & Robustness',
      title: isStable
        ? `Strategy Demonstrates Robust Stability (${consistencyRate.toFixed(0)}% Configurations Beat B&H)`
        : `Parameter Fragility Detected (${consistencyRate.toFixed(0)}% Configurations Beat B&H)`,
      observation: `Across ${results.length} tested parameter and cost configurations, strategy returns range from ${minRet > 0 ? '+' : ''}${minRet.toFixed(1)}% to ${maxRet > 0 ? '+' : ''}${maxRet.toFixed(1)}%. ${positiveAlphas} of ${results.length} permutations produced positive alpha over Buy & Hold.`,
      hypothesis: isStable
        ? `Consistent profitability across varied smoothing windows confirms that the quantitative edge is structural, not an overfit anomaly.`
        : `Narrow profitability clusters indicate parameter cliff vulnerability; the strategy may fail if live market parameters drift slightly.`,
      evidence: [
        {
          label: 'Robustness Consistency',
          value: `${consistencyRate.toFixed(0)}%`,
          comparison: `${positiveAlphas}/${results.length} beat benchmark`,
          source: 'robustness-engine',
        },
        {
          label: 'Return Range',
          value: `${minRet.toFixed(1)}% to ${maxRet.toFixed(1)}%`,
          source: 'robustness-engine',
        },
        {
          label: 'Tested Variants',
          value: `${results.length} configurations`,
          source: 'robustness-engine',
        },
      ],
      impact: isStable
        ? `The strategy displays structural resilience, making it a stronger candidate for live consideration than a parameter-sensitive model.`
        : `Caution is advised: high variance across adjacent parameters is a hallmark of in-sample curve fitting.`,
      nextTest: {
        label: 'Open Robustness Lab',
        description: 'Examine detailed parameter matrix and transaction cost degradation tables.',
        actionType: 'NAVIGATE',
        targetSection: 'robustness',
      },
      sourceMetrics: ['robustnessResults', 'consistencyRate', 'returnDispersion'],
    });
  }

  // =========================================================================
  // 8. STRESS TESTING — MACRO SHOCK SENSITIVITY
  // =========================================================================
  if (input.stressResult) {
    const stress = input.stressResult;
    const comp = stress.comparison;
    const scName = stress.scenario.name;

    insights.push({
      id: `stress-sens-${stress.scenario.id}-${comp.stressedDrawdown.toFixed(1)}`,
      category: 'STRESS_SENSITIVITY',
      categoryLabel: 'Macro Stress Sensitivity',
      title: `${strategyName} Under ${scName}`,
      observation: `Under the ${scName} simulation, ${strategyName} on ${assetName} recorded a maximum drawdown of ${comp.stressedDrawdown.toFixed(2)}%, compared to a baseline maximum drawdown of ${comp.baselineDrawdown.toFixed(2)}% (stress delta: ${comp.drawdownDelta.toFixed(2)}%). Total return shifted from ${comp.baselineReturn > 0 ? '+' : ''}${comp.baselineReturn.toFixed(2)}% to ${comp.stressedReturn > 0 ? '+' : ''}${comp.stressedReturn.toFixed(2)}%.`,
      hypothesis: `Severe macro shocks introduce sudden gap-downs and elevated volatility spikes that test trend-following latency. Cash protection rules limit tail losses once the exit signal triggers, but absorb the initial decline.`,
      evidence: [
        {
          label: 'Stressed Max Drawdown',
          value: `${comp.stressedDrawdown.toFixed(2)}%`,
          comparison: `${comp.drawdownDelta.toFixed(2)}% vs baseline`,
          source: 'stress-engine',
        },
        {
          label: 'Baseline Max Drawdown',
          value: `${comp.baselineDrawdown.toFixed(2)}%`,
          source: 'stress-engine',
        },
        {
          label: 'Stressed Return',
          value: `${comp.stressedReturn > 0 ? '+' : ''}${comp.stressedReturn.toFixed(2)}%`,
          comparison: `${comp.returnDelta > 0 ? '+' : ''}${comp.returnDelta.toFixed(2)}% delta`,
          source: 'stress-engine',
        },
        {
          label: 'Stressed Sharpe',
          value: comp.stressedSharpe.toFixed(2),
          comparison: `${comp.sharpeDelta > 0 ? '+' : ''}${comp.sharpeDelta.toFixed(2)} vs baseline`,
          source: 'stress-engine',
        },
      ],
      impact: `Capital under stress concluded at $${comp.stressedEndingCapital.toLocaleString('en-US', { minimumFractionDigits: 0 })}, representing a delta of -$${Math.abs(comp.capitalDelta).toLocaleString('en-US', { minimumFractionDigits: 0 })} against the unshocked baseline.`,
      nextTest: {
        label: 'Open Stress Lab',
        description: 'Examine the full portfolio stress path, damage report, and asset sensitivity breakdown in Stress Lab.',
        actionType: 'NAVIGATE',
        targetSection: 'stress',
      },
      sourceMetrics: ['stressedDrawdown', 'drawdownDelta', 'stressedReturn', 'capitalDelta'],
    });

    // 9. RECOVERY PRESSURE
    insights.push({
      id: `stress-rec-${stress.scenario.id}-${comp.recoveryDays}`,
      category: 'RECOVERY_PRESSURE',
      categoryLabel: 'Post-Shock Recovery',
      title: `Recovery Trajectory: ${comp.recoveryPct.toFixed(1)}% Recovered Over ${comp.recoveryDays} Days`,
      observation: `Following the maximum drawdown trough in ${scName}, the portfolio recovered ${comp.recoveryPct.toFixed(1)}% of trough-to-peak losses across ${comp.recoveryDays} trading sessions.`,
      hypothesis: `The pace of portfolio recovery depends on indicator re-engagement speed. Delayed trend re-entry avoids dead-cat bounces but sacrifices early recovery gains.`,
      evidence: [
        {
          label: 'Recovery Trajectory',
          value: `${comp.recoveryPct.toFixed(1)}% recovered`,
          source: 'stress-engine',
        },
        {
          label: 'Recovery Window',
          value: `${comp.recoveryDays} trading days`,
          source: 'stress-engine',
        },
        {
          label: 'Stressed Volatility',
          value: `${comp.stressedVolatility.toFixed(2)}%`,
          comparison: `${comp.volatilityDelta > 0 ? '+' : ''}${comp.volatilityDelta.toFixed(2)}% vs baseline`,
          source: 'stress-engine',
        },
      ],
      impact: `Evaluating recovery hysteresis confirms whether the strategy possesses the survivability to rebuild equity after acute liquidity events.`,
      nextTest: {
        label: 'Compare Other Scenarios',
        description: 'Test alternative crisis structures such as rapid V-shaped shocks vs protracted rate grinds.',
        actionType: 'NAVIGATE',
        targetSection: 'stress',
      },
      sourceMetrics: ['recoveryPct', 'recoveryDays', 'stressedVolatility'],
    });

    // 10. CORRELATION CONVERGENCE UNDER STRESS
    const baseCorr = stress.baselineCorrelations.BTC.NVDA;
    const stressCorr = stress.stressedCorrelations.BTC.NVDA;
    const cDelta = stressCorr - baseCorr;

    insights.push({
      id: `stress-corr-${stress.scenario.id}`,
      category: 'CORRELATION_CONVERGENCE',
      categoryLabel: 'Crisis Correlation Shift',
      title: `BTC × NVDA Correlation Shifted to ρ = ${stressCorr.toFixed(2)} During Shock`,
      observation: `During the crisis window under ${scName}, the pairwise correlation between Bitcoin and NVIDIA moved from a baseline of ρ = ${baseCorr.toFixed(2)} to ρ = ${stressCorr.toFixed(2)} (${cDelta > 0 ? '+' : ''}${cDelta.toFixed(2)} shift).`,
      hypothesis: `During systemic liquidity crunches, cross-asset correlation often converges as investors liquidate across all risk assets simultaneously, temporarily diminishing diversification benefits.`,
      evidence: [
        {
          label: 'Crisis Period Correlation',
          value: `ρ = ${stressCorr.toFixed(3)}`,
          comparison: `${cDelta > 0 ? '+' : ''}${cDelta.toFixed(2)} shift`,
          source: 'stress-engine',
        },
        {
          label: 'Baseline 5-Year Correlation',
          value: `ρ = ${baseCorr.toFixed(3)}`,
          source: 'stress-engine',
        },
      ],
      impact: `Portfolio hedges lose efficacy when cross-asset correlations spike toward +1.0 during acute market sell-offs.`,
      nextTest: {
        label: 'Inspect Stress Correlations',
        description: 'View the 3x3 crisis correlation matrix in the Stress Lab.',
        actionType: 'NAVIGATE',
        targetSection: 'stress',
      },
      sourceMetrics: ['stressedCorrelations', 'baselineCorrelations'],
    });
  }

  // 11. GENOME RELATIONSHIP SHIFT INSIGHT
  const btcPrices = getDataInRange('BTC', startDate, endDate);
  const nvdaPrices = getDataInRange('NVDA', startDate, endDate);
  if (btcPrices.length >= 60 && nvdaPrices.length >= 60) {
    const rolling60 = computeRollingCorrelation(btcPrices, nvdaPrices, 60);
    if (rolling60.length >= 2) {
      const startCorr = rolling60[0].value;
      const endCorr = rolling60[rolling60.length - 1].value;
      const shift = endCorr - startCorr;

      if (Math.abs(shift) >= 0.15) {
        insights.push({
          id: 'genome-relationship-shift-btc-nvda',
          category: 'GENOME_RELATIONSHIP_SHIFT',
          categoryLabel: 'Relationship Shift',
          title: `BTC × NVDA Rolling Correlation Shifted by ${shift > 0 ? '+' : ''}${shift.toFixed(2)}`,
          observation: `BTC–NVIDIA 60-day rolling correlation shifted materially from ρ = ${startCorr.toFixed(2)} to ρ = ${endCorr.toFixed(2)} across the observed horizon.`,
          hypothesis: `Macro liquidity regimes and risk-on sentiment cycles cause the linear co-movement between digital assets and semiconductor equities to decouple or converge dynamically.`,
          evidence: [
            {
              label: 'Initial 60D Window',
              value: `ρ = ${startCorr.toFixed(2)}`,
              source: 'correlation-engine',
            },
            {
              label: 'Terminal 60D Window',
              value: `ρ = ${endCorr.toFixed(2)}`,
              comparison: `${shift > 0 ? '+' : ''}${shift.toFixed(2)} shift`,
              source: 'correlation-engine',
            },
          ],
          impact: `Shifting correlation topology directly influences portfolio concentration risk and multi-asset strategy diversification.`,
          nextTest: {
            label: 'Inspect Strategy Genome',
            description: 'Explore the full multi-asset and strategy network in Strategy Genome.',
            actionType: 'NAVIGATE',
            targetSection: 'genome',
          },
          sourceMetrics: ['rollingCorrelation', 'correlationShift'],
        });
      }
    }
  }

  return insights;
}
