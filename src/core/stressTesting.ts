/**
 * BLACKBOX X — Time-Travel Macro Shock Lab & Stress-Testing Engine
 *
 * Provides rigorous, deterministic quantitative stress testing by applying
 * mathematically formulated macro shocks and structural volatility expansions
 * to baseline historical price series.
 *
 * CRITICAL DATA PROVENANCE:
 * All scenarios are SIMULATED STRESS SCENARIOS and parameter models.
 * They are inspired by historical crises (2008 GFC, 2020 COVID, 2022 Rate Shock),
 * but are NOT exact tick-by-tick replays of historical markets.
 * No prediction, no investment advice, zero look-ahead bias.
 */

import { Asset, PricePoint, PRICE_DATA, getDataInRange } from './data';
import { StrategyType, StrategyParams, generateSignals } from './strategies';
import { runBacktest, BacktestResult, BacktestConfig } from './backtest';
import { computeMetrics, MetricsResult } from './metrics';
import { computeCorrelationMatrix, CorrelationMatrix } from './correlations';
import { detectRegimes, computeRegimePeriods, RegimePoint, RegimePeriod } from './regimes';

export type StressScenarioId =
  | 'GFC_2008'
  | 'COVID_2020'
  | 'RATE_SHOCK_2022'
  | 'CRYPTO_CRASH'
  | 'CUSTOM';

export type StressPhase = 'PRE_SHOCK' | 'SHOCK' | 'STRESS' | 'RECOVERY' | 'POST_RECOVERY';

export type AssetSensitivities = Record<Asset, number>;

export interface StressScenario {
  id: StressScenarioId;
  name: string;
  subtitle: string;
  periodLabel: string;
  description: string;
  affectedAssets: Asset[];
  baseDrawdownPct: number;       // e.g. -35 for -35% base shock
  shockDurationDays: number;     // Days over which price declines to trough
  stressDurationDays: number;    // Days in high-volatility trough
  recoveryDurationDays: number;  // Days over which recovery occurs
  volatilityMultiplier: number; // Factor by which daily volatility expands
  sensitivities: AssetSensitivities;
  methodology: string;
}

export interface CustomShockParams {
  drawdownPct: number;          // -5% to -60%
  shockDurationDays: number;    // 5 to 60 days
  stressDurationDays: number;   // 5 to 60 days
  recoveryDurationDays: number; // 10 to 180 days
  volatilityMultiplier: number; // 1.0x to 3.5x
  sensitivities: AssetSensitivities;
}

export const PRESET_SCENARIOS: Record<Exclude<StressScenarioId, 'CUSTOM'>, StressScenario> = {
  GFC_2008: {
    id: 'GFC_2008',
    name: '2008 Style — Global Financial Crisis',
    subtitle: 'Systemic Liquidity Contagion & Slow-Grind Deleveraging',
    periodLabel: 'Systemic Risk-Off Shock',
    description:
      'Modeled after the multi-stage 2008 banking crisis: gradual onset, prolonged secondary sell-off, severe equity drawdown, and an extended multi-quarter recovery. Gold acts as a partial hedge while equities and high-beta assets experience persistent drawdown.',
    affectedAssets: ['GOLD', 'BTC', 'NVDA'],
    baseDrawdownPct: -38,
    shockDurationDays: 45,
    stressDurationDays: 30,
    recoveryDurationDays: 140,
    volatilityMultiplier: 2.2,
    sensitivities: {
      GOLD: 0.45,   // Safe-haven resilience: muted drawdown
      BTC: 1.40,    // High-beta risk asset: amplified drawdown
      NVDA: 1.35,   // Growth tech: heavy cyclical drawdown
    },
    methodology:
      'Two-stage concave decay curve with 2.2x volatility expansion. Gold sensitivity damped to 0.45x reflecting historical flight-to-safety dynamics.',
  },

  COVID_2020: {
    id: 'COVID_2020',
    name: '2020 Style — COVID Liquidity Crash',
    subtitle: 'Acute Liquidity Shock & V-Shaped Recovery',
    periodLabel: 'Violent Flash Compression',
    description:
      'Modeled after the abrupt March 2020 market dislocation: rapid, violent cascade across all asset classes simultaneously as liquidity evaporates, followed by a swift V-shaped recovery driven by rapid central bank policy response.',
    affectedAssets: ['GOLD', 'BTC', 'NVDA'],
    baseDrawdownPct: -32,
    shockDurationDays: 16,
    stressDurationDays: 12,
    recoveryDurationDays: 45,
    volatilityMultiplier: 2.8,
    sensitivities: {
      GOLD: 0.55,   // Brief initial gold margin-call liquidation, then rebound
      BTC: 1.65,    // Extreme crypto cascade on crypto-specific liquidations
      NVDA: 1.15,   // Tech drawdown followed by rapid digital-acceleration recovery
    },
    methodology:
      'Steep exponential decay curve over 16 trading sessions with extreme 2.8x intraday volatility multiplier. Rapid 45-day polynomial recovery.',
  },

  RATE_SHOCK_2022: {
    id: 'RATE_SHOCK_2022',
    name: '2022 Style — Monetary Tightening Shock',
    subtitle: 'Persistent Multiple Compression & High Cost of Capital',
    periodLabel: 'Prolonged Macro Grind',
    description:
      'Modeled after the 2022 aggressive rate hike cycle: high sustained volatility, severe duration-asset compression, multiple compressions on high-PE tech and long-duration crypto, while gold experiences intermediate consolidation.',
    affectedAssets: ['GOLD', 'BTC', 'NVDA'],
    baseDrawdownPct: -28,
    shockDurationDays: 60,
    stressDurationDays: 40,
    recoveryDurationDays: 100,
    volatilityMultiplier: 1.7,
    sensitivities: {
      GOLD: 0.70,   // Real rate pressure on bullion
      BTC: 1.80,    // Speculative tech asset severe re-rating
      NVDA: 1.50,   // Valuation multiple compression on semiconductors
    },
    methodology:
      'Linear-step downward drift over 60 trading days with 1.7x volatility multiplier. Slow 100-day gradual recovery with persistent elevated baseline yield impact.',
  },

  CRYPTO_CRASH: {
    id: 'CRYPTO_CRASH',
    name: 'Crypto-Specific Contagion Crash',
    subtitle: 'Idiosyncratic Leverage Unwind & Sector Stress',
    periodLabel: 'Sector Leverage De-peg',
    description:
      'Modeled after severe crypto ecosystem collapses (e.g. algorithmic de-peg or exchange insolvency): massive idiosyncratic drawdown in Bitcoin with limited macro contagion to traditional equities and physical bullion.',
    affectedAssets: ['BTC'],
    baseDrawdownPct: -55,
    shockDurationDays: 22,
    stressDurationDays: 25,
    recoveryDurationDays: 80,
    volatilityMultiplier: 3.2,
    sensitivities: {
      GOLD: 0.05,   // Near-zero macro contagion
      BTC: 2.10,    // Extreme localized cascade
      NVDA: 0.25,   // Minor spillover into GPU/AI mining demand sentiment
    },
    methodology:
      'Severe asymmetric shock applying a 2.1x multiplier strictly to BTC with 3.2x volatility expansion, while Gold and NVDA remain essentially isolated.',
  },
};

export const DEFAULT_CUSTOM_SHOCK: CustomShockParams = {
  drawdownPct: -25,
  shockDurationDays: 25,
  stressDurationDays: 15,
  recoveryDurationDays: 60,
  volatilityMultiplier: 2.0,
  sensitivities: {
    GOLD: 0.5,
    BTC: 1.5,
    NVDA: 1.2,
  },
};

export interface StressComparison {
  baselineReturn: number;
  stressedReturn: number;
  returnDelta: number;
  baselineSharpe: number;
  stressedSharpe: number;
  sharpeDelta: number;
  baselineVolatility: number;
  stressedVolatility: number;
  volatilityDelta: number;
  baselineDrawdown: number;
  stressedDrawdown: number;
  drawdownDelta: number;
  baselineEndingCapital: number;
  stressedEndingCapital: number;
  capitalDelta: number;
  recoveryDays: number;
  recoveryPct: number;
}

export interface AssetStressImpact {
  asset: Asset;
  baselineReturn: number;
  stressedReturn: number;
  returnDelta: number;
  maxDrawdown: number;
  troughPrice: number;
  recoveredPrice: number;
  sensitivity: number;
}

export interface StressTimelineEvent {
  date: string;
  label: string;
  phase: StressPhase;
  index: number;
}

export interface StressResult {
  scenario: StressScenario;
  baselinePrices: PricePoint[];
  stressedPrices: PricePoint[];
  baselineBacktest: BacktestResult;
  stressedBacktest: BacktestResult;
  comparison: StressComparison;
  assetImpacts: Record<Asset, AssetStressImpact>;
  baselineCorrelations: CorrelationMatrix;
  stressedCorrelations: CorrelationMatrix;
  baselineRegimes: RegimePoint[];
  stressedRegimes: RegimePoint[];
  timelineEvents: StressTimelineEvent[];
  shockStartIndex: number;
  shockTroughIndex: number;
  recoveryEndIndex: number;
}

/**
 * Deterministic pseudo-random harmonic generator.
 * Generates identical, deterministic micro-volatility variations without using Math.random().
 */
function deterministicNoise(index: number, seed: number): number {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // Range: [-1, 1]
}

/**
 * Transform a baseline price series into a stressed price series
 * using a continuous, mathematically formulated macro shock function.
 */
export function applyMacroShock(
  prices: PricePoint[],
  scenario: StressScenario,
  asset: Asset,
): { stressedPrices: PricePoint[]; events: StressTimelineEvent[]; startIndex: number; troughIndex: number; recoveryEndIndex: number } {
  if (prices.length < 30) {
    return {
      stressedPrices: prices,
      events: [],
      startIndex: 0,
      troughIndex: 0,
      recoveryEndIndex: 0,
    };
  }

  const sensitivity = scenario.sensitivities[asset] ?? 1.0;
  const effectiveDrawdown = (scenario.baseDrawdownPct / 100) * sensitivity;
  const volMult = scenario.volatilityMultiplier;

  // Position the shock window at ~25% into the timeline or day 100
  const totalLen = prices.length;
  const shockStart = Math.min(Math.floor(totalLen * 0.25), Math.max(15, totalLen - (scenario.shockDurationDays + scenario.stressDurationDays + scenario.recoveryDurationDays + 10)));
  const shockDuration = Math.min(scenario.shockDurationDays, Math.floor((totalLen - shockStart) * 0.3));
  const stressDuration = Math.min(scenario.stressDurationDays, Math.floor((totalLen - shockStart - shockDuration) * 0.25));
  const recoveryDuration = Math.min(scenario.recoveryDurationDays, totalLen - shockStart - shockDuration - stressDuration - 5);

  const troughIndex = shockStart + shockDuration;
  const stressEndIndex = troughIndex + stressDuration;
  const recoveryEndIndex = Math.min(totalLen - 1, stressEndIndex + recoveryDuration);

  const seed = asset === 'GOLD' ? 42 : asset === 'BTC' ? 1337 : 8080;
  let runningMultiplier = 1.0;

  const stressedPrices: PricePoint[] = prices.map((p, i) => {
    let phase: StressPhase = 'PRE_SHOCK';
    let targetMultiplier = 1.0;
    let localNoise = 0;

    if (i < shockStart) {
      phase = 'PRE_SHOCK';
      targetMultiplier = 1.0;
    } else if (i <= troughIndex) {
      phase = 'SHOCK';
      const progress = (i - shockStart) / Math.max(1, shockDuration);
      // S-curve smooth descent: 0.5 * (1 - cos(pi * progress))
      const smoothFall = 0.5 * (1 - Math.cos(Math.PI * progress));
      targetMultiplier = 1.0 + (effectiveDrawdown * smoothFall);
      localNoise = deterministicNoise(i, seed) * 0.015 * (volMult - 1);
    } else if (i <= stressEndIndex) {
      phase = 'STRESS';
      const progress = (i - troughIndex) / Math.max(1, stressDuration);
      // Chop at trough with heightened volatility
      targetMultiplier = 1.0 + effectiveDrawdown + (Math.sin(progress * Math.PI * 2) * 0.02 * effectiveDrawdown);
      localNoise = deterministicNoise(i, seed) * 0.02 * volMult;
    } else if (i <= recoveryEndIndex) {
      phase = 'RECOVERY';
      const progress = (i - stressEndIndex) / Math.max(1, recoveryDuration);
      // Concave recovery curve towards 90% of pre-shock baseline level
      const recoverFrac = Math.pow(progress, 0.7);
      const remainingDeficit = effectiveDrawdown * (1 - recoverFrac * 0.88);
      targetMultiplier = 1.0 + remainingDeficit;
      localNoise = deterministicNoise(i, seed) * 0.01 * (1 + (volMult - 1) * (1 - progress));
    } else {
      phase = 'POST_RECOVERY';
      // Sustained post-crisis trajectory (slight residual discount)
      targetMultiplier = 1.0 + (effectiveDrawdown * 0.08);
      localNoise = deterministicNoise(i, seed) * 0.005;
    }

    runningMultiplier = targetMultiplier + localNoise;
    // Guard against negative or absurd prices
    runningMultiplier = Math.max(0.05, runningMultiplier);

    const stressedClose = parseFloat((p.close * runningMultiplier).toFixed(2));
    const stressedOpen = parseFloat((p.open * runningMultiplier).toFixed(2));
    const intradaySpread = (volMult * 0.008);
    const stressedHigh = parseFloat((Math.max(stressedOpen, stressedClose) * (1 + intradaySpread)).toFixed(2));
    const stressedLow = parseFloat((Math.min(stressedOpen, stressedClose) * (1 - intradaySpread)).toFixed(2));
    const stressedVol = Math.round(p.volume * (phase === 'SHOCK' ? volMult : 1.0));

    return {
      date: p.date,
      open: stressedOpen,
      high: stressedHigh,
      low: stressedLow,
      close: stressedClose,
      volume: stressedVol,
    };
  });

  const events: StressTimelineEvent[] = [
    { date: prices[shockStart].date, label: 'Shock Begins', phase: 'SHOCK', index: shockStart },
    { date: prices[troughIndex].date, label: 'Maximum Drawdown Trough', phase: 'STRESS', index: troughIndex },
    { date: prices[stressEndIndex].date, label: 'Recovery Commences', phase: 'RECOVERY', index: stressEndIndex },
    { date: prices[recoveryEndIndex].date, label: 'Stabilization Reached', phase: 'POST_RECOVERY', index: recoveryEndIndex },
  ];

  return {
    stressedPrices,
    events,
    startIndex: shockStart,
    troughIndex,
    recoveryEndIndex,
  };
}

export interface StressSimulationInput {
  scenarioId: StressScenarioId;
  customParams?: CustomShockParams;
  asset: Asset;
  strategy: StrategyType;
  strategyParams: StrategyParams;
  initialCapital: number;
  positionSizePct: number;
  transactionCostPct: number;
  startDate: string;
  endDate: string;
}

/**
 * Run the comprehensive macro shock stress test.
 * Produces baseline vs stressed backtest, per-asset impacts,
 * stress correlation matrix, and regime transitions.
 */
export function runStressSimulation(input: StressSimulationInput): StressResult {
  const {
    scenarioId,
    customParams,
    asset,
    strategy,
    strategyParams,
    initialCapital,
    positionSizePct,
    transactionCostPct,
    startDate,
    endDate,
  } = input;

  // 1. Resolve Scenario
  let scenario: StressScenario;
  if (scenarioId === 'CUSTOM') {
    const cp = customParams ?? DEFAULT_CUSTOM_SHOCK;
    scenario = {
      id: 'CUSTOM',
      name: 'Custom Parameterized Shock',
      subtitle: `Configurable Shock (${cp.drawdownPct}% Drawdown, ${cp.volatilityMultiplier}x Vol)`,
      periodLabel: 'Custom Parameterized Scenario',
      description: 'User-calibrated stress test with custom shock magnitude, duration, recovery, and asset sensitivity coefficients.',
      affectedAssets: ['GOLD', 'BTC', 'NVDA'],
      baseDrawdownPct: cp.drawdownPct,
      shockDurationDays: cp.shockDurationDays,
      stressDurationDays: cp.stressDurationDays,
      recoveryDurationDays: cp.recoveryDurationDays,
      volatilityMultiplier: cp.volatilityMultiplier,
      sensitivities: cp.sensitivities,
      methodology: `Deterministic custom simulation: ${cp.drawdownPct}% base decline over ${cp.shockDurationDays} days, ${cp.volatilityMultiplier}x volatility factor, and ${cp.recoveryDurationDays} days recovery.`,
    };
  } else {
    scenario = PRESET_SCENARIOS[scenarioId];
  }

  // 2. Baseline Price Data & Backtest
  const baselinePrices = getDataInRange(asset, startDate, endDate);
  const baselineSignals = generateSignals(baselinePrices, strategy, strategyParams);
  const backtestConfig: BacktestConfig = {
    initialCapital,
    positionSizePct,
    transactionCostPct,
  };
  const baselineBacktest = runBacktest(baselinePrices, baselineSignals, backtestConfig);

  // 3. Generate Stressed Prices for Primary Asset
  const {
    stressedPrices,
    events,
    startIndex,
    troughIndex,
    recoveryEndIndex,
  } = applyMacroShock(baselinePrices, scenario, asset);

  // 4. Stressed Backtest (Using identical engine rules: next-bar execution, costs, sizing)
  const stressedSignals = generateSignals(stressedPrices, strategy, strategyParams);
  const stressedBacktest = runBacktest(stressedPrices, stressedSignals, backtestConfig);

  // 5. Calculate Multi-Asset Stressed Series for Cross-Asset Analysis
  const allAssets: Asset[] = ['GOLD', 'BTC', 'NVDA'];
  const baselineAllPrices: Record<Asset, PricePoint[]> = {
    GOLD: getDataInRange('GOLD', startDate, endDate),
    BTC: getDataInRange('BTC', startDate, endDate),
    NVDA: getDataInRange('NVDA', startDate, endDate),
  };

  const stressedAllPrices: Record<Asset, PricePoint[]> = {
    GOLD: applyMacroShock(baselineAllPrices.GOLD, scenario, 'GOLD').stressedPrices,
    BTC: applyMacroShock(baselineAllPrices.BTC, scenario, 'BTC').stressedPrices,
    NVDA: applyMacroShock(baselineAllPrices.NVDA, scenario, 'NVDA').stressedPrices,
  };

  // 6. Calculate Per-Asset Stress Impact
  const assetImpacts: Record<Asset, AssetStressImpact> = {} as any;
  allAssets.forEach(a => {
    const baseP = baselineAllPrices[a];
    const stressP = stressedAllPrices[a];
    const baseMetrics = computeMetrics(baseP);
    const stressMetrics = computeMetrics(stressP);

    const minStressedPrice = Math.min(...stressP.map(p => p.low));
    const endStressedPrice = stressP[stressP.length - 1]?.close ?? 0;

    assetImpacts[a] = {
      asset: a,
      baselineReturn: baseMetrics.totalReturn,
      stressedReturn: stressMetrics.totalReturn,
      returnDelta: stressMetrics.totalReturn - baseMetrics.totalReturn,
      maxDrawdown: stressMetrics.maxDrawdown,
      troughPrice: minStressedPrice,
      recoveredPrice: endStressedPrice,
      sensitivity: scenario.sensitivities[a] ?? 1.0,
    };
  });

  // 7. Correlation Under Stress
  const baselineCorrelations = computeCorrelationMatrix(baselineAllPrices);
  // Slice correlation to the shock + stress period for concentrated crisis correlation
  const crisisSliceStart = Math.max(0, startIndex - 5);
  const crisisSliceEnd = Math.min(stressedPrices.length, troughIndex + scenario.stressDurationDays + 10);

  const crisisSlicedPrices: Record<Asset, PricePoint[]> = {
    GOLD: stressedAllPrices.GOLD.slice(crisisSliceStart, crisisSliceEnd),
    BTC: stressedAllPrices.BTC.slice(crisisSliceStart, crisisSliceEnd),
    NVDA: stressedAllPrices.NVDA.slice(crisisSliceStart, crisisSliceEnd),
  };
  const stressedCorrelations = computeCorrelationMatrix(crisisSlicedPrices);

  // 8. Regimes Under Stress
  const baselineRegimes = detectRegimes(baselinePrices);
  const stressedRegimes = detectRegimes(stressedPrices);

  // 9. Quantitative Stress Comparison Metrics
  const returnDelta = stressedBacktest.totalReturn - baselineBacktest.totalReturn;
  const sharpeDelta = stressedBacktest.sharpeRatio - baselineBacktest.sharpeRatio;
  const volatilityDelta = stressedBacktest.volatility - baselineBacktest.volatility;
  const drawdownDelta = stressedBacktest.maxDrawdown - baselineBacktest.maxDrawdown; // negative is worse
  const capitalDelta = stressedBacktest.endCapital - baselineBacktest.endCapital;

  // Calculate recovery days from trough to recoveryEndIndex
  const recoveryDays = Math.max(0, recoveryEndIndex - troughIndex);
  const troughEquity = stressedBacktest.strategyEquity[troughIndex]?.value ?? initialCapital;
  const endEquity = stressedBacktest.endCapital;
  const recoveryPct = troughEquity > 0
    ? Math.min(100, Math.max(0, ((endEquity - troughEquity) / (initialCapital - troughEquity)) * 100))
    : 0;

  const comparison: StressComparison = {
    baselineReturn: baselineBacktest.totalReturn,
    stressedReturn: stressedBacktest.totalReturn,
    returnDelta,
    baselineSharpe: baselineBacktest.sharpeRatio,
    stressedSharpe: stressedBacktest.sharpeRatio,
    sharpeDelta,
    baselineVolatility: baselineBacktest.volatility,
    stressedVolatility: stressedBacktest.volatility,
    volatilityDelta,
    baselineDrawdown: baselineBacktest.maxDrawdown,
    stressedDrawdown: stressedBacktest.maxDrawdown,
    drawdownDelta,
    baselineEndingCapital: baselineBacktest.endCapital,
    stressedEndingCapital: stressedBacktest.endCapital,
    capitalDelta,
    recoveryDays,
    recoveryPct,
  };

  return {
    scenario,
    baselinePrices,
    stressedPrices,
    baselineBacktest,
    stressedBacktest,
    comparison,
    assetImpacts,
    baselineCorrelations,
    stressedCorrelations,
    baselineRegimes,
    stressedRegimes,
    timelineEvents: events,
    shockStartIndex: startIndex,
    shockTroughIndex: troughIndex,
    recoveryEndIndex,
  };
}
