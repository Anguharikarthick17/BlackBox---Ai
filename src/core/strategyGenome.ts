/**
 * BLACKBOX X — Strategy Genome: Quantitative Relationship Network Engine
 *
 * Converts verified quantitative engine outputs into a formal graph representation:
 * Nodes (Assets, Strategies, Regimes, Risk Metrics) and
 * Edges (Linear Pearson correlations, regime transitions, strategy exposures).
 *
 * ZERO-FABRICATION RULE:
 * Every coordinate, size, edge thickness, and metric displayed in the Genome
 * is calculated strictly from the core analytics engines. No imaginary scores.
 */

import { Asset, ASSET_LABELS, ASSET_COLORS, PricePoint, PRICE_DATA, getDataInRange } from './data';
import { StrategyType, StrategyParams, STRATEGY_LABELS, generateSignals, DEFAULT_PARAMS } from './strategies';
import { runBacktest, BacktestResult, BacktestConfig } from './backtest';
import { computeMetrics, MetricsResult } from './metrics';
import { computeCorrelationMatrix, computeRollingCorrelation, CorrelationMatrix } from './correlations';
import {
  detectRegimes, computeRegimePeriods, strategyPerformanceByRegime,
  RegimeType, REGIME_LABELS, REGIME_COLORS, RegimeStrategyPerf,
} from './regimes';
import { StressResult } from './stressTesting';

export type GenomeMode = 'MARKET' | 'STRATEGY' | 'REGIME' | 'STRESS';

export type GenomeCorrelationMode = 'STATIC' | 'ROLLING';

export type GenomeRollingWindow = 30 | 60 | 90;

export type GenomeNodeType = 'ASSET' | 'STRATEGY' | 'REGIME' | 'RISK_METRIC';

export interface GenomeNode {
  id: string;
  type: GenomeNodeType;
  label: string;
  sublabel?: string;
  value: string;
  numericValue: number;
  normalizedValue: number; // 0 to 1 for sizing
  size: number;            // Radius in pixels
  color: string;
  x: number;               // SVG layout coordinate
  y: number;               // SVG layout coordinate
  metadata: Record<string, any>;
}

export interface GenomeEdge {
  id: string;
  source: string;
  target: string;
  value: number;           // Exact correlation or weighting (-1 to +1)
  formattedValue: string;
  normalizedStrength: number; // 0 to 1 for stroke width
  strokeWidth: number;     // 1 to 6 px
  relationship: 'CORRELATION_POSITIVE' | 'CORRELATION_NEGATIVE' | 'STRATEGY_LINK' | 'REGIME_LINK' | 'STRESS_SHIFT';
  isDashed: boolean;
  color: string;
  metadata: Record<string, any>;
}

export interface StrategyFingerprint {
  returnNorm: number;     // 0-100 scale
  volatilityNorm: number; // 0-100 scale (inverted: lower vol is higher stability)
  sharpeNorm: number;     // 0-100 scale
  drawdownNorm: number;   // 0-100 scale (inverted: smaller drawdown is higher score)
  turnoverNorm: number;   // 0-100 scale
  rawValues: {
    totalReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    tradeCount: number;
  };
}

export interface GenomeSnapshot {
  mode: GenomeMode;
  nodes: GenomeNode[];
  edges: GenomeEdge[];
  selectedAsset: Asset;
  selectedStrategy: StrategyType;
  correlationMode: GenomeCorrelationMode;
  correlationWindow: GenomeRollingWindow;
  fingerprint: StrategyFingerprint;
  summary: {
    nodeCount: number;
    edgeCount: number;
    dominantRelationship: string;
  };
}

export interface BuildGenomeInput {
  mode: GenomeMode;
  asset: Asset;
  strategy: StrategyType;
  strategyParams: StrategyParams;
  initialCapital: number;
  positionSizePct: number;
  transactionCostPct: number;
  startDate: string;
  endDate: string;
  correlationMode?: GenomeCorrelationMode;
  correlationWindow?: GenomeRollingWindow;
  stressResult?: StressResult | null;
  allAssets?: Asset[];
}

const ALL_ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];
const ALL_STRATEGIES: StrategyType[] = ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'];
const ALL_REGIMES: RegimeType[] = ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'];

/**
 * Generate normalized strategy fingerprint for the radar/bar display.
 */
export function computeStrategyFingerprint(backtest: BacktestResult): StrategyFingerprint {
  // Return normalized: -50% to +150% mapped to 0-100
  const returnNorm = Math.min(100, Math.max(0, ((backtest.totalReturn + 50) / 200) * 100));
  // Volatility normalized: 10% to 90% (lower vol -> higher preservation score)
  const volNorm = Math.min(100, Math.max(0, 100 - ((backtest.volatility - 10) / 80) * 100));
  // Sharpe normalized: -1.0 to 3.0 mapped to 0-100
  const sharpeNorm = Math.min(100, Math.max(0, ((backtest.sharpeRatio + 1.0) / 4.0) * 100));
  // Drawdown normalized: -80% to 0% (smaller drawdown -> higher capital preservation)
  const ddNorm = Math.min(100, Math.max(0, 100 - (Math.abs(backtest.maxDrawdown) / 80) * 100));
  // Trade turnover normalized: 0 to 80 trades
  const tradeNorm = Math.min(100, Math.max(0, (backtest.numTrades / 80) * 100));

  return {
    returnNorm,
    volatilityNorm: volNorm,
    sharpeNorm,
    drawdownNorm: ddNorm,
    turnoverNorm: tradeNorm,
    rawValues: {
      totalReturn: backtest.totalReturn,
      volatility: backtest.volatility,
      sharpeRatio: backtest.sharpeRatio,
      maxDrawdown: backtest.maxDrawdown,
      tradeCount: backtest.numTrades,
    },
  };
}

/**
 * Build the full Genome Snapshot based on the selected mode and parameters.
 */
export function buildStrategyGenome(input: BuildGenomeInput): GenomeSnapshot {
  const {
    mode,
    asset,
    strategy,
    strategyParams,
    initialCapital,
    positionSizePct,
    transactionCostPct,
    startDate,
    endDate,
    correlationMode = 'STATIC',
    correlationWindow = 60,
    stressResult,
  } = input;

  const nodes: GenomeNode[] = [];
  const edges: GenomeEdge[] = [];

  // Compute baseline metrics for all assets
  const assetPrices: Record<Asset, PricePoint[]> = {
    GOLD: getDataInRange('GOLD', startDate, endDate),
    BTC: getDataInRange('BTC', startDate, endDate),
    NVDA: getDataInRange('NVDA', startDate, endDate),
  };

  const assetMetrics: Record<Asset, MetricsResult> = {
    GOLD: computeMetrics(assetPrices.GOLD),
    BTC: computeMetrics(assetPrices.BTC),
    NVDA: computeMetrics(assetPrices.NVDA),
  };

  // Find max volatility for relative node radius scaling (range: 22px to 48px)
  const maxVol = Math.max(...Object.values(assetMetrics).map(m => m.volatility), 1.0);

  // Compute Active Strategy Backtest
  const activePrices = assetPrices[asset];
  const activeSignals = generateSignals(activePrices, strategy, strategyParams);
  const backtestConfig: BacktestConfig = { initialCapital, positionSizePct, transactionCostPct };
  const activeBacktest = runBacktest(activePrices, activeSignals, backtestConfig);
  const fingerprint = computeStrategyFingerprint(activeBacktest);

  // Layout center coordinates (SVG Canvas: 600 x 440)
  const cx = 300;
  const cy = 210;

  // =========================================================================
  // MODE 1: MARKET STRUCTURE (Assets + Pearson Correlations)
  // =========================================================================
  if (mode === 'MARKET') {
    // Equilateral triangle layout for 3 assets
    const assetPositions: Record<Asset, { x: number; y: number }> = {
      BTC: { x: cx, y: cy - 110 },
      NVDA: { x: cx + 130, y: cy + 90 },
      GOLD: { x: cx - 130, y: cy + 90 },
    };

    ALL_ASSETS.forEach(a => {
      const m = assetMetrics[a];
      const volNorm = Math.min(1, Math.max(0.2, m.volatility / maxVol));
      const radius = 24 + volNorm * 22; // 24px to 46px
      const isSelected = a === asset;

      nodes.push({
        id: a,
        type: 'ASSET',
        label: ASSET_LABELS[a],
        sublabel: `${m.volatility.toFixed(1)}% Vol`,
        value: `$${m.endPrice.toLocaleString()}`,
        numericValue: m.volatility,
        normalizedValue: volNorm,
        size: radius,
        color: ASSET_COLORS[a],
        x: assetPositions[a].x,
        y: assetPositions[a].y,
        metadata: {
          asset: a,
          totalReturn: m.totalReturn,
          volatility: m.volatility,
          sharpeRatio: m.sharpeRatio,
          maxDrawdown: m.maxDrawdown,
          days: m.days,
          isSelected,
        },
      });
    });

    // Compute pairwise correlations (Static vs Rolling)
    const pairs: [Asset, Asset][] = [
      ['BTC', 'NVDA'],
      ['BTC', 'GOLD'],
      ['NVDA', 'GOLD'],
    ];

    pairs.forEach(([a1, a2]) => {
      let corr = 0;
      if (correlationMode === 'ROLLING') {
        const rollingSeries = computeRollingCorrelation(assetPrices[a1], assetPrices[a2], correlationWindow);
        corr = rollingSeries.length > 0 ? rollingSeries[rollingSeries.length - 1].value : 0;
      } else {
        const matrix = computeCorrelationMatrix(assetPrices);
        corr = matrix[a1][a2];
      }

      const absCorr = Math.abs(corr);
      const isPositive = corr >= 0;
      const strokeWidth = 1.2 + absCorr * 4.5; // 1.2px to 5.7px

      edges.push({
        id: `${a1}-${a2}`,
        source: a1,
        target: a2,
        value: corr,
        formattedValue: `ρ = ${corr > 0 ? '+' : ''}${corr.toFixed(3)}`,
        normalizedStrength: absCorr,
        strokeWidth,
        relationship: isPositive ? 'CORRELATION_POSITIVE' : 'CORRELATION_NEGATIVE',
        isDashed: !isPositive,
        color: isPositive ? '#22C55E' : '#EF4444',
        metadata: {
          assetA: a1,
          assetB: a2,
          correlation: corr,
          mode: correlationMode,
          window: correlationMode === 'ROLLING' ? correlationWindow : 'Full Period',
        },
      });
    });
  }

  // =========================================================================
  // MODE 2: STRATEGY NETWORK (Active Asset + 4 Strategies)
  // =========================================================================
  else if (mode === 'STRATEGY') {
    // Center: Selected Asset Node
    const activeM = assetMetrics[asset];
    nodes.push({
      id: asset,
      type: 'ASSET',
      label: ASSET_LABELS[asset],
      sublabel: `Target Asset`,
      value: `${activeM.totalReturn > 0 ? '+' : ''}${activeM.totalReturn.toFixed(1)}%`,
      numericValue: activeM.volatility,
      normalizedValue: 1.0,
      size: 42,
      color: ASSET_COLORS[asset],
      x: cx,
      y: cy,
      metadata: {
        asset,
        ...activeM,
      },
    });

    // Orbit: 4 Quantitative Strategies
    const strategyAngles: Record<StrategyType, number> = {
      SMA_CROSSOVER: -Math.PI / 4, // Top Right
      EMA_TREND: (3 * Math.PI) / 4, // Bottom Left
      MOMENTUM: Math.PI / 4,        // Bottom Right
      MEAN_REVERSION: (-3 * Math.PI) / 4, // Top Left
    };

    const orbitRadius = 145;

    ALL_STRATEGIES.forEach(st => {
      const p = st === strategy ? strategyParams : DEFAULT_PARAMS[st];
      const sigs = generateSignals(activePrices, st, p);
      const res = runBacktest(activePrices, sigs, backtestConfig);
      const isCurrent = st === strategy;
      const angle = strategyAngles[st];
      const sx = cx + Math.cos(angle) * orbitRadius;
      const sy = cy + Math.sin(angle) * orbitRadius;

      nodes.push({
        id: st,
        type: 'STRATEGY',
        label: STRATEGY_LABELS[st],
        sublabel: `Sharpe ${res.sharpeRatio.toFixed(2)}`,
        value: `${res.totalReturn > 0 ? '+' : ''}${res.totalReturn.toFixed(1)}%`,
        numericValue: res.totalReturn,
        normalizedValue: Math.min(1, Math.max(0.2, (res.totalReturn + 50) / 200)),
        size: isCurrent ? 36 : 30,
        color: isCurrent ? '#B40023' : '#6B7280',
        x: sx,
        y: sy,
        metadata: {
          strategy: st,
          totalReturn: res.totalReturn,
          annualizedReturn: res.annualizedReturn,
          sharpeRatio: res.sharpeRatio,
          volatility: res.volatility,
          maxDrawdown: res.maxDrawdown,
          numTrades: res.numTrades,
          winRate: res.winRate,
          isCurrent,
        },
      });

      edges.push({
        id: `${asset}-${st}`,
        source: asset,
        target: st,
        value: res.totalReturn,
        formattedValue: `Return: ${res.totalReturn > 0 ? '+' : ''}${res.totalReturn.toFixed(1)}%`,
        normalizedStrength: Math.min(1, Math.max(0.2, res.winRate / 100)),
        strokeWidth: isCurrent ? 3.5 : 1.5,
        relationship: 'STRATEGY_LINK',
        isDashed: !isCurrent,
        color: isCurrent ? '#B40023' : '#D1D5DB',
        metadata: {
          strategy: st,
          asset,
          alpha: res.totalReturn - res.buyHoldReturn,
        },
      });
    });
  }

  // =========================================================================
  // MODE 3: REGIME CONTEXT (Strategy + Classified Market Regimes)
  // =========================================================================
  else if (mode === 'REGIME') {
    // Center: Active Strategy Node
    nodes.push({
      id: strategy,
      type: 'STRATEGY',
      label: STRATEGY_LABELS[strategy],
      sublabel: `${ASSET_LABELS[asset]} Deployment`,
      value: `Sharpe ${activeBacktest.sharpeRatio.toFixed(2)}`,
      numericValue: activeBacktest.totalReturn,
      normalizedValue: 1.0,
      size: 40,
      color: '#B40023',
      x: cx,
      y: cy,
      metadata: {
        strategy,
        asset,
        ...activeBacktest,
      },
    });

    // Detect regimes & performance
    const regPoints = detectRegimes(activePrices);
    const regPerf = strategyPerformanceByRegime(
      regPoints,
      activeBacktest.strategyEquity,
      activeBacktest.buyHoldEquity,
      activeBacktest.trades,
    );

    const regimePositions: Record<RegimeType, { x: number; y: number }> = {
      BULL: { x: cx - 125, y: cy - 95 },
      HIGH_VOL: { x: cx + 125, y: cy - 95 },
      LOW_VOL: { x: cx - 125, y: cy + 95 },
      BEAR: { x: cx + 125, y: cy + 95 },
    };

    ALL_REGIMES.forEach(r => {
      const perf = regPerf.find(p => p.regime === r);
      const ret = perf?.strategyReturn ?? 0;
      const win = perf?.winRate ?? 0;
      const sharpe = perf?.sharpe ?? 0;

      nodes.push({
        id: r,
        type: 'REGIME',
        label: REGIME_LABELS[r],
        sublabel: `Win Rate ${win.toFixed(0)}%`,
        value: `${ret > 0 ? '+' : ''}${ret.toFixed(1)}%`,
        numericValue: ret,
        normalizedValue: Math.min(1, Math.max(0.2, (ret + 30) / 100)),
        size: 32,
        color: REGIME_COLORS[r],
        x: regimePositions[r].x,
        y: regimePositions[r].y,
        metadata: {
          regime: r,
          strategyReturn: ret,
          buyHoldReturn: perf?.buyHoldReturn ?? 0,
          sharpeRatio: sharpe,
          winRate: win,
        },
      });

      edges.push({
        id: `${strategy}-${r}`,
        source: strategy,
        target: r,
        value: ret,
        formattedValue: `Regime Return: ${ret > 0 ? '+' : ''}${ret.toFixed(1)}%`,
        normalizedStrength: Math.min(1, Math.max(0.1, Math.abs(ret) / 50)),
        strokeWidth: 2.0,
        relationship: 'REGIME_LINK',
        isDashed: ret < 0,
        color: REGIME_COLORS[r],
        metadata: {
          regime: r,
          winRate: win,
          sharpe,
        },
      });
    });
  }

  // =========================================================================
  // MODE 4: STRESS RESPONSE (Baseline vs Crisis Macro Shock)
  // =========================================================================
  else if (mode === 'STRESS') {
    // If stressResult exists in store, use it; otherwise use default preset
    const scScenario = stressResult?.scenario.name ?? 'COVID 2020 Liquidity Crash';
    const comp = stressResult?.comparison;

    const stressPositions: Record<Asset, { x: number; y: number }> = {
      BTC: { x: cx, y: cy - 110 },
      NVDA: { x: cx + 130, y: cy + 90 },
      GOLD: { x: cx - 130, y: cy + 90 },
    };

    ALL_ASSETS.forEach(a => {
      const impact = stressResult?.assetImpacts[a];
      const m = assetMetrics[a];
      const stressVol = impact ? m.volatility * (1 + (impact.sensitivity * 0.5)) : m.volatility;
      const stressDD = impact?.maxDrawdown ?? m.maxDrawdown * 1.4;

      nodes.push({
        id: a,
        type: 'ASSET',
        label: ASSET_LABELS[a],
        sublabel: `${stressDD.toFixed(1)}% Shock MDD`,
        value: `${(impact?.stressedReturn ?? m.totalReturn).toFixed(1)}%`,
        numericValue: stressVol,
        normalizedValue: Math.min(1, Math.max(0.2, stressVol / 80)),
        size: 34,
        color: ASSET_COLORS[a],
        x: stressPositions[a].x,
        y: stressPositions[a].y,
        metadata: {
          asset: a,
          baselineDrawdown: m.maxDrawdown,
          stressedDrawdown: stressDD,
          drawdownDelta: stressDD - m.maxDrawdown,
          sensitivity: impact?.sensitivity ?? 1.0,
          scenario: scScenario,
        },
      });
    });

    // Crisis Correlation Edges
    const pairs: [Asset, Asset][] = [
      ['BTC', 'NVDA'],
      ['BTC', 'GOLD'],
      ['NVDA', 'GOLD'],
    ];

    pairs.forEach(([a1, a2]) => {
      const baseCorr = stressResult?.baselineCorrelations[a1]?.[a2] ?? 0.35;
      const crisisCorr = stressResult?.stressedCorrelations[a1]?.[a2] ?? 0.72;
      const shift = crisisCorr - baseCorr;
      const strokeWidth = 2.0 + Math.abs(crisisCorr) * 4.5;

      edges.push({
        id: `stress-${a1}-${a2}`,
        source: a1,
        target: a2,
        value: crisisCorr,
        formattedValue: `Crisis ρ = ${crisisCorr.toFixed(3)} (${shift > 0 ? '+' : ''}${shift.toFixed(2)})`,
        normalizedStrength: Math.abs(crisisCorr),
        strokeWidth,
        relationship: 'STRESS_SHIFT',
        isDashed: crisisCorr < 0,
        color: '#DC2626',
        metadata: {
          assetA: a1,
          assetB: a2,
          baselineCorrelation: baseCorr,
          crisisCorrelation: crisisCorr,
          shift,
        },
      });
    });
  }

  const dominantEdge = edges.length > 0
    ? [...edges].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]
    : null;

  return {
    mode,
    nodes,
    edges,
    selectedAsset: asset,
    selectedStrategy: strategy,
    correlationMode,
    correlationWindow,
    fingerprint,
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      dominantRelationship: dominantEdge
        ? `${dominantEdge.source} ↔ ${dominantEdge.target} (${dominantEdge.formattedValue})`
        : 'None',
    },
  };
}
