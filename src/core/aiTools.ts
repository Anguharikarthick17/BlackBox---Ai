/**
 * BLACKBOX X — AI Quantitative Tool Registry
 * 
 * Defines deterministic quantitative tools callable by the AI Research Assistant.
 * Every tool invokes verified BLACKBOX X computation engines.
 * 
 * ARCHITECTURAL RULE:
 * ZERO financial calculations inside the AI layer.
 * All tools return authoritative deterministic numbers.
 */

import { z } from 'zod';
import { Asset, ASSET_LABELS, getDataInRange, PRICE_DATA } from './data';
import { computeMetrics, computeRollingVolatility, computeRollingSharpe } from './metrics';
import { runBacktest, BacktestResult } from './backtest';
import { StrategyType, StrategyParams, DEFAULT_PARAMS, generateSignals, STRATEGY_LABELS } from './strategies';
import { computeCorrelationMatrix, computeRollingCorrelation } from './correlations';
import { detectRegimes, computeRegimePeriods, strategyPerformanceByRegime, RegimeType } from './regimes';
import { runRobustnessSweep, generateDefaultConfigs } from './robustness';
import { runStressSimulation, StressScenarioId, DEFAULT_CUSTOM_SHOCK } from './stressTesting';
import { buildStrategyGenome, GenomeMode } from './strategyGenome';
import { generateResearchInsights } from './insights';
import { buildResearchPack } from './researchPack';
import {
  computePortfolioMetrics,
  computeRiskContribution,
  optimizePortfolio,
  OptimizationObjective,
} from './portfolio';
import {
  runMonteCarloSimulation,
  compareHistoricalVsMonteCarlo,
} from './portfolio/monteCarloEngine';
import {
  runRegimeMonteCarloSimulation,
  compareRegimeSimulations,
} from './portfolio/regimeMonteCarlo';

export type ToolSourceCategory =
  | 'QUANT_METRICS'
  | 'BACKTEST'
  | 'BENCHMARK'
  | 'REGIMES'
  | 'CORRELATION'
  | 'ROBUSTNESS'
  | 'STRESS'
  | 'GENOME'
  | 'RESEARCH_TRAIL'
  | 'RISK_COMMITTEE'
  | 'WEB_SEARCH'
  | 'PORTFOLIO';

export interface BlackboxToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  category: ToolSourceCategory;
  schema: z.ZodType<TInput>;
  parameters: Record<string, any>; // JSON Schema format for OpenAI/Featherless tools
  execute: (input: TInput) => Promise<TOutput> | TOutput;
}

// ---------------------------------------------------------------------------
// Tool 1: get_asset_metrics
// ---------------------------------------------------------------------------
const GetAssetMetricsSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']).describe('Target asset identifier'),
  startDate: z.string().optional().default('2020-01-01').describe('Start date YYYY-MM-DD'),
  endDate: z.string().optional().default('2023-12-31').describe('End date YYYY-MM-DD'),
});

// ---------------------------------------------------------------------------
// Tool 2: get_strategy_metrics
// ---------------------------------------------------------------------------
const GetStrategyMetricsSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']).describe('Underlying asset'),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']).describe('Strategy model'),
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
  initialCapital: z.number().optional().default(100000),
  transactionCostPct: z.number().optional().default(0.001),
});

// ---------------------------------------------------------------------------
// Tool 3: get_benchmark_metrics
// ---------------------------------------------------------------------------
const GetBenchmarkMetricsSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']).describe('Target asset for Buy & Hold benchmark'),
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
});

// ---------------------------------------------------------------------------
// Tool 4: get_regime_performance
// ---------------------------------------------------------------------------
const GetRegimePerformanceSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']).optional().default('EMA_TREND'),
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
});

// ---------------------------------------------------------------------------
// Tool 5: get_drawdown_analysis
// ---------------------------------------------------------------------------
const GetDrawdownAnalysisSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']).optional().default('EMA_TREND'),
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
});

// ---------------------------------------------------------------------------
// Tool 6: get_correlation_matrix
// ---------------------------------------------------------------------------
const GetCorrelationMatrixSchema = z.object({
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
});

// ---------------------------------------------------------------------------
// Tool 7: get_rolling_correlation
// ---------------------------------------------------------------------------
const GetRollingCorrelationSchema = z.object({
  assetA: z.enum(['GOLD', 'BTC', 'NVDA']).default('BTC'),
  assetB: z.enum(['GOLD', 'BTC', 'NVDA']).default('NVDA'),
  window: z.enum(['30', '60', '90']).optional().default('60'),
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
});

// ---------------------------------------------------------------------------
// Tool 8: get_robustness_analysis
// ---------------------------------------------------------------------------
const GetRobustnessAnalysisSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']),
  startDate: z.string().optional().default('2020-01-01'),
  endDate: z.string().optional().default('2023-12-31'),
});

// ---------------------------------------------------------------------------
const GetStressResultSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']).default('BTC'),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']).optional().default('EMA_TREND'),
  scenarioId: z.enum(['GFC_2008', 'COVID_2020', 'RATE_HIKE_2022', 'CRYPTO_WINTER_2022', 'CUSTOM']).optional(),
  shockId: z.enum(['GFC_2008', 'COVID_2020', 'RATE_HIKE_2022', 'CRYPTO_WINTER_2022', 'CUSTOM']).optional(),
});

// ---------------------------------------------------------------------------
// Tool 10: get_strategy_genome
// ---------------------------------------------------------------------------
const GetStrategyGenomeSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']).optional().default('BTC'),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']).optional().default('EMA_TREND'),
  mode: z.enum(['MARKET', 'STRATEGY', 'REGIME', 'STRESS']).optional().default('MARKET'),
});

// ---------------------------------------------------------------------------
// Tool 11: get_research_trail
// ---------------------------------------------------------------------------
const GetResearchTrailSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']).optional().default('BTC'),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']).optional().default('EMA_TREND'),
});

// ---------------------------------------------------------------------------
// Tool 12: get_risk_brief
// ---------------------------------------------------------------------------
const GetRiskBriefSchema = z.object({
  asset: z.enum(['GOLD', 'BTC', 'NVDA']),
  strategy: z.enum(['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION']),
});

/**
 * Registry of all available BLACKBOX tools with execution implementations.
 */
export const BLACKBOX_TOOLS: Record<string, BlackboxToolDefinition> = {
  get_asset_metrics: {
    name: 'get_asset_metrics',
    description: 'Retrieve verified historical quantitative metrics (total return, volatility, Sharpe ratio, max drawdown) for Gold, Bitcoin, or NVIDIA.',
    category: 'QUANT_METRICS',
    schema: GetAssetMetricsSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'], description: 'Target asset identifier' },
        startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
        endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['asset'],
    },
    execute: ({ asset, startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const a = asset as Asset;
      const prices = getDataInRange(a, startDate, endDate);
      const m = computeMetrics(prices);
      const actualStart = prices.length > 0 ? prices[0].date : startDate;
      const actualEnd = prices.length > 0 ? prices[prices.length - 1].date : endDate;
      return {
        asset,
        assetName: ASSET_LABELS[a],
        dataWindow: `${actualStart} to ${actualEnd}`,
        startDate: actualStart,
        endDate: actualEnd,
        dataWindowDescription: `According to BLACKBOX X for the data window ${actualStart} to ${actualEnd}`,
        observationCount: prices.length,
        period: `${actualStart} to ${actualEnd}`,
        totalReturn: Number(m.totalReturn.toFixed(2)),
        annualizedReturn: Number(m.annualizedReturn.toFixed(2)),
        volatility: Number(m.volatility.toFixed(2)),
        sharpe: Number(m.sharpeRatio.toFixed(2)),
        maxDrawdown: Number(m.maxDrawdown.toFixed(2)),
        totalReturnPct: Number(m.totalReturn.toFixed(2)),
        annualizedReturnPct: Number(m.annualizedReturn.toFixed(2)),
        annualizedVolatilityPct: Number(m.volatility.toFixed(2)),
        sharpeRatio: Number(m.sharpeRatio.toFixed(2)),
        maxDrawdownPct: Number(m.maxDrawdown.toFixed(2)),
      };
    },
  },

  get_strategy_metrics: {
    name: 'get_strategy_metrics',
    description: 'Run backtest on an asset using SMA Crossover, EMA Trend, Momentum, or Mean Reversion and return performance metrics.',
    category: 'BACKTEST',
    schema: GetStrategyMetricsSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        initialCapital: { type: 'number' },
        transactionCostPct: { type: 'number' },
      },
      required: ['asset', 'strategy'],
    },
    execute: ({ asset, strategy, startDate = '2020-01-01', endDate = '2023-12-31', initialCapital = 100000, transactionCostPct = 0.001 }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const prices = getDataInRange(a, startDate, endDate);
      const params = DEFAULT_PARAMS[s];
      const signals = generateSignals(prices, s, params);
      const bt = runBacktest(prices, signals, {
        initialCapital,
        positionSizePct: 0.95,
        transactionCostPct,
      });

      const actualStart = prices.length > 0 ? prices[0].date : startDate;
      const actualEnd = prices.length > 0 ? prices[prices.length - 1].date : endDate;
      return {
        asset,
        strategy,
        strategyName: STRATEGY_LABELS[s],
        dataWindow: `${actualStart} to ${actualEnd}`,
        startDate: actualStart,
        endDate: actualEnd,
        dataWindowDescription: `According to BLACKBOX X for the data window ${actualStart} to ${actualEnd}`,
        totalReturn: Number(bt.totalReturn.toFixed(2)),
        annualizedReturn: Number(bt.annualizedReturn.toFixed(2)),
        volatility: Number(bt.volatility.toFixed(2)),
        sharpe: Number(bt.sharpeRatio.toFixed(2)),
        maxDrawdown: Number(bt.maxDrawdown.toFixed(2)),
        totalReturnPct: Number(bt.totalReturn.toFixed(2)),
        annualizedReturnPct: Number(bt.annualizedReturn.toFixed(2)),
        volatilityPct: Number(bt.volatility.toFixed(2)),
        sharpeRatio: Number(bt.sharpeRatio.toFixed(2)),
        maxDrawdownPct: Number(bt.maxDrawdown.toFixed(2)),
        endingCapital: Number(bt.endCapital.toFixed(2)),
        tradeCount: bt.numTrades,
        winRatePct: Number(bt.winRate.toFixed(2)),
        benchmarkReturnPct: Number(bt.buyHoldReturn.toFixed(2)),
        benchmarkSharpe: Number(bt.buyHoldSharpe.toFixed(2)),
        alphaPct: Number((bt.totalReturn - bt.buyHoldReturn).toFixed(2)),
      };
    },
  },

  get_benchmark_metrics: {
    name: 'get_benchmark_metrics',
    description: 'Get Buy & Hold benchmark performance metrics for a specified asset over the horizon.',
    category: 'BENCHMARK',
    schema: GetBenchmarkMetricsSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
      required: ['asset'],
    },
    execute: ({ asset, startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const a = asset as Asset;
      const prices = getDataInRange(a, startDate, endDate);
      const m = computeMetrics(prices);
      return {
        asset,
        assetName: ASSET_LABELS[a],
        benchmark: 'Buy & Hold',
        totalReturn: Number(m.totalReturn.toFixed(2)),
        annualizedReturn: Number(m.annualizedReturn.toFixed(2)),
        volatility: Number(m.volatility.toFixed(2)),
        sharpe: Number(m.sharpeRatio.toFixed(2)),
        maxDrawdown: Number(m.maxDrawdown.toFixed(2)),
        totalReturnPct: Number(m.totalReturn.toFixed(2)),
        annualizedReturnPct: Number(m.annualizedReturn.toFixed(2)),
        annualizedVolatilityPct: Number(m.volatility.toFixed(2)),
        sharpeRatio: Number(m.sharpeRatio.toFixed(2)),
        maxDrawdownPct: Number(m.maxDrawdown.toFixed(2)),
      };
    },
  },

  get_regime_performance: {
    name: 'get_regime_performance',
    description: 'Analyze how an asset and strategy behave across market regimes: Bull, Bear, High Volatility, and Low Volatility.',
    category: 'REGIMES',
    schema: GetRegimePerformanceSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
      required: ['asset'],
    },
    execute: ({ asset, strategy = 'EMA_TREND', startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const prices = getDataInRange(a, startDate, endDate);
      const regimePoints = detectRegimes(prices);
      const regimePeriods = computeRegimePeriods(regimePoints);
      const params = DEFAULT_PARAMS[s];
      const signals = generateSignals(prices, s, params);
      const bt = runBacktest(prices, signals, { initialCapital: 100000, positionSizePct: 0.95, transactionCostPct: 0.001 });
      const perf = strategyPerformanceByRegime(regimePoints, bt.strategyEquity, bt.buyHoldEquity, bt.trades);

      return {
        asset,
        strategy,
        dominantRegime: regimePeriods[0]?.regime || perf[0]?.regime || 'Bull',
        regimeBreakdown: perf.map(p => ({
          regime: p.regime,
          strategyReturnPct: Number(p.strategyReturn.toFixed(2)),
          buyHoldReturnPct: Number(p.buyHoldReturn.toFixed(2)),
          sharpeRatio: Number(p.sharpe.toFixed(2)),
          winRatePct: Number(p.winRate.toFixed(2)),
          tradeCount: p.numTrades,
        })),
      };
    },
  },

  get_drawdown_analysis: {
    name: 'get_drawdown_analysis',
    description: 'Get deep maximum drawdown metrics, peak-to-trough capital degradation, and duration.',
    category: 'QUANT_METRICS',
    schema: GetDrawdownAnalysisSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
      },
      required: ['asset'],
    },
    execute: ({ asset, strategy = 'EMA_TREND', startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const prices = getDataInRange(a, startDate, endDate);
      const params = DEFAULT_PARAMS[s];
      const signals = generateSignals(prices, s, params);
      const bt = runBacktest(prices, signals, { initialCapital: 100000, positionSizePct: 0.95, transactionCostPct: 0.001 });

      return {
        asset,
        strategy,
        strategyMaxDrawdownPct: Number(bt.maxDrawdown.toFixed(2)),
        benchmarkMaxDrawdownPct: Number(bt.buyHoldMaxDrawdown.toFixed(2)),
        drawdownDeltaPct: Number((bt.maxDrawdown - bt.buyHoldMaxDrawdown).toFixed(2)),
        worstTradeLossPct: Number(bt.worstTrade.toFixed(2)),
        bestTradeGainPct: Number(bt.bestTrade.toFixed(2)),
        capitalPreservationAssessment: bt.maxDrawdown > bt.buyHoldMaxDrawdown
          ? 'Strategy preserved capital better than passive Buy & Hold.'
          : 'Strategy experienced deeper peak-to-trough drawdown than passive holding.',
      };
    },
  },

  get_correlation_matrix: {
    name: 'get_correlation_matrix',
    description: 'Retrieve the 3x3 Pearson correlation matrix for Gold, Bitcoin, and NVIDIA returns.',
    category: 'CORRELATION',
    schema: GetCorrelationMatrixSchema,
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
    },
    execute: ({ startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const matrix = computeCorrelationMatrix({
        GOLD: getDataInRange('GOLD', startDate, endDate),
        BTC: getDataInRange('BTC', startDate, endDate),
        NVDA: getDataInRange('NVDA', startDate, endDate),
      });

      return {
        period: `${startDate} to ${endDate}`,
        matrix: {
          GOLD: { BTC: matrix.GOLD.BTC, NVDA: matrix.GOLD.NVDA },
          BTC: { GOLD: matrix.BTC.GOLD, NVDA: matrix.BTC.NVDA },
          NVDA: { GOLD: matrix.NVDA.GOLD, BTC: matrix.NVDA.BTC },
        },
        relationshipSummary: `BTC-NVDA correlation: ρ = ${matrix.BTC.NVDA.toFixed(2)}. GOLD-BTC correlation: ρ = ${matrix.GOLD.BTC.toFixed(2)}.`,
      };
    },
  },

  get_rolling_correlation: {
    name: 'get_rolling_correlation',
    description: 'Compute rolling correlation statistics (current value, mean, min, max) between two assets over 30d, 60d, or 90d window.',
    category: 'CORRELATION',
    schema: GetRollingCorrelationSchema,
    parameters: {
      type: 'object',
      properties: {
        assetA: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        assetB: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        window: { type: 'string', enum: ['30', '60', '90'] },
      },
    },
    execute: ({ assetA = 'BTC', assetB = 'NVDA', window = '60', startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const pricesA = getDataInRange(assetA as Asset, startDate, endDate);
      const pricesB = getDataInRange(assetB as Asset, startDate, endDate);
      const windowNum = parseInt(window, 10);
      const rolling = computeRollingCorrelation(pricesA, pricesB, windowNum);

      if (rolling.length === 0) {
        return { error: 'Insufficient data points for rolling window calculation.' };
      }

      const values = rolling.map(r => r.value);
      const current = values[values.length - 1];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;

      return {
        pair: `${assetA} × ${assetB}`,
        windowDays: windowNum,
        currentRollingCorrelation: Number(current.toFixed(3)),
        meanCorrelation: Number(mean.toFixed(3)),
        minCorrelation: Number(Math.min(...values).toFixed(3)),
        maxCorrelation: Number(Math.max(...values).toFixed(3)),
        recentShift: Number((current - values[0]).toFixed(3)),
      };
    },
  },

  get_robustness_analysis: {
    name: 'get_robustness_analysis',
    description: 'Run parameter sweeps and cost sensitivity checks across strategy configurations to detect parameter cliffs.',
    category: 'ROBUSTNESS',
    schema: GetRobustnessAnalysisSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
      },
      required: ['asset', 'strategy'],
    },
    execute: ({ asset, strategy, startDate = '2020-01-01', endDate = '2023-12-31' }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const configs = generateDefaultConfigs(s, DEFAULT_PARAMS[s], startDate, endDate, 0.001);
      const results = runRobustnessSweep(
        PRICE_DATA[a],
        s,
        configs,
        100000,
        (st, en) => getDataInRange(a, st, en)
      );

      const sharpes = results.map(r => r.sharpeRatio);
      const meanSharpe = sharpes.reduce((acc, b) => acc + b, 0) / sharpes.length;
      const positiveReturns = results.filter(r => r.totalReturn > 0).length;

      return {
        asset,
        strategy,
        configurationsTested: results.length,
        meanSharpeRatio: Number(meanSharpe.toFixed(2)),
        minSharpeRatio: Number(Math.min(...sharpes).toFixed(2)),
        maxSharpeRatio: Number(Math.max(...sharpes).toFixed(2)),
        consistencyRatePct: Number(((positiveReturns / results.length) * 100).toFixed(1)),
        bestConfig: results.reduce((best, cur) => cur.sharpeRatio > best.sharpeRatio ? cur : best, results[0]).label,
      };
    },
  },

  get_stress_result: {
    name: 'get_stress_result',
    description: 'Simulate macro shock stress testing (e.g. COVID-19 liquidity crash, 2008 GFC, or 2022 rate hike) on asset and strategy.',
    category: 'STRESS',
    schema: GetStressResultSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
        scenarioId: { type: 'string', enum: ['GFC_2008', 'COVID_2020', 'RATE_HIKE_2022', 'CRYPTO_WINTER_2022', 'CUSTOM'] },
      },
      required: ['asset'],
    },
    execute: ({ asset = 'BTC', strategy = 'EMA_TREND', scenarioId, shockId }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const selectedScenario = scenarioId || shockId || 'COVID_2020';
      const result = runStressSimulation({
        scenarioId: selectedScenario as StressScenarioId,
        customParams: DEFAULT_CUSTOM_SHOCK,
        asset: a,
        strategy: s,
        strategyParams: DEFAULT_PARAMS[s],
        initialCapital: 100000,
        positionSizePct: 0.95,
        transactionCostPct: 0.001,
        startDate: '2020-01-01',
        endDate: '2023-12-31',
      });

      return {
        scenarioName: result.scenario.name,
        shockName: result.scenario.name,
        baselineReturnPct: Number(result.comparison.baselineReturn.toFixed(2)),
        stressedReturnPct: Number(result.comparison.stressedReturn.toFixed(2)),
        stressedReturn: Number(result.comparison.stressedReturn.toFixed(2)),
        returnDeltaPct: Number(result.comparison.returnDelta.toFixed(2)),
        baselineMaxDrawdownPct: Number(result.comparison.baselineDrawdown.toFixed(2)),
        stressedMaxDrawdownPct: Number(result.comparison.stressedDrawdown.toFixed(2)),
        capitalLossAmount: Number(Math.abs(result.comparison.capitalDelta).toFixed(2)),
        recoveryDurationDays: result.comparison.recoveryDays,
      };
    },
  },

  get_strategy_genome: {
    name: 'get_strategy_genome',
    description: 'Retrieve Strategy Genome quantitative relationship network topology and 5D risk fingerprint.',
    category: 'GENOME',
    schema: GetStrategyGenomeSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
        mode: { type: 'string', enum: ['MARKET', 'STRATEGY', 'REGIME', 'STRESS'] },
      },
    },
    execute: ({ asset = 'BTC', strategy = 'EMA_TREND', mode = 'MARKET' }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const genome = buildStrategyGenome({
        asset: a,
        strategy: s,
        strategyParams: DEFAULT_PARAMS[s],
        initialCapital: 100000,
        positionSizePct: 0.95,
        transactionCostPct: 0.001,
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        mode: mode as GenomeMode,
      });

      return {
        mode,
        asset,
        strategy,
        nodes: genome.nodes,
        edges: genome.edges,
        nodeCount: genome.nodes.length,
        edgeCount: genome.edges.length,
        riskFingerprint: genome.fingerprint,
        topRelationships: genome.edges.slice(0, 5).map(e => ({
          source: e.source,
          target: e.target,
          strength: e.value,
          type: e.relationship,
        })),
      };
    },
  },

  get_research_trail: {
    name: 'get_research_trail',
    description: 'Retrieve verified deterministic research insights and hypotheses from Ghost Mode 2.0.',
    category: 'RESEARCH_TRAIL',
    schema: GetResearchTrailSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
      },
    },
    execute: ({ asset = 'BTC', strategy = 'EMA_TREND' }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const insights = generateResearchInsights({
        asset: a,
        strategy: s,
        params: DEFAULT_PARAMS[s],
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        initialCapital: 100000,
        positionSizePct: 0.95,
        transactionCostPct: 0.001,
      });

      return {
        activeInsightsCount: insights.length,
        insights: insights.slice(0, 5).map(i => ({
          id: i.id,
          category: i.category,
          title: i.title,
          observation: i.observation,
          hypothesis: i.hypothesis,
          impact: i.impact,
          recommendedNextTest: i.nextTest.label,
        })),
      };
    },
  },

  get_risk_brief: {
    name: 'get_risk_brief',
    description: 'Extract institutional Research Pack summary used by the AI Risk Committee.',
    category: 'RISK_COMMITTEE',
    schema: GetRiskBriefSchema,
    parameters: {
      type: 'object',
      properties: {
        asset: { type: 'string', enum: ['GOLD', 'BTC', 'NVDA'] },
        strategy: { type: 'string', enum: ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'] },
      },
      required: ['asset', 'strategy'],
    },
    execute: ({ asset, strategy }) => {
      const a = asset as Asset;
      const s = strategy as StrategyType;
      const pack = buildResearchPack({
        asset: a,
        strategy: s,
        params: DEFAULT_PARAMS[s],
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        initialCapital: 100000,
        positionSizePct: 0.95,
        transactionCostPct: 0.001,
      });

      return {
        fingerprint: pack.provenance.fingerprint,
        asset: pack.asset.name,
        strategy: pack.metadata.strategyName,
        returnDeltaPct: pack.comparison.returnDelta,
        sharpeDelta: pack.comparison.sharpeDelta,
        volatilityDeltaPct: pack.comparison.volatilityDelta,
        maxDrawdownDeltaPct: pack.comparison.maxDrawdownDelta,
        dominantRegime: pack.regimes.dominantRegime,
      };
    },
  },
};

// ---------------------------------------------------------------------------
// Tool 13: get_portfolio_metrics
// ---------------------------------------------------------------------------
const GetPortfolioMetricsSchema = z.object({
  goldWeight: z.number().min(0).max(1).optional().default(0.4).describe('Gold (XAU) weight 0 to 1'),
  btcWeight: z.number().min(0).max(1).optional().default(0.3).describe('Bitcoin (BTC) weight 0 to 1'),
  nvdaWeight: z.number().min(0).max(1).optional().default(0.3).describe('NVIDIA (NVDA) weight 0 to 1'),
  startDate: z.string().optional().default('2020-01-01').describe('Start date YYYY-MM-DD'),
  endDate: z.string().optional().default('2023-12-31').describe('End date YYYY-MM-DD'),
});

// ---------------------------------------------------------------------------
// Tool 14: get_portfolio_optimization
// ---------------------------------------------------------------------------
const GetPortfolioOptimizationSchema = z.object({
  objective: z
    .enum(['MAX_SHARPE', 'MIN_VOLATILITY', 'RISK_PARITY', 'TARGET_RETURN'])
    .describe('Optimization objective'),
  targetReturnPct: z
    .number()
    .optional()
    .describe('Target annualized return in % (e.g. 25.0 for 25%), required if TARGET_RETURN'),
});

export const PORTFOLIO_TOOLS: Record<string, BlackboxToolDefinition> = {
  get_portfolio_metrics: {
    name: 'get_portfolio_metrics',
    description:
      'Calculates deterministic multi-asset portfolio performance (Total Return, CAGR, Volatility, Sharpe, Max Drawdown, VaR95, CVaR95, and Euler Risk Contribution) for Gold, Bitcoin, and NVIDIA.',
    category: 'PORTFOLIO',
    schema: GetPortfolioMetricsSchema,
    parameters: {
      type: 'object',
      properties: {
        goldWeight: { type: 'number', description: 'Gold (XAU) weight 0.0 to 1.0 (default 0.4)' },
        btcWeight: { type: 'number', description: 'Bitcoin (BTC) weight 0.0 to 1.0 (default 0.3)' },
        nvdaWeight: { type: 'number', description: 'NVIDIA (NVDA) weight 0.0 to 1.0 (default 0.3)' },
        startDate: { type: 'string', description: 'Start date YYYY-MM-DD' },
        endDate: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
    },
    execute: ({ goldWeight, btcWeight, nvdaWeight, startDate, endDate }) => {
      const metrics = computePortfolioMetrics(
        { GOLD: goldWeight, BTC: btcWeight, NVDA: nvdaWeight },
        startDate,
        endDate
      );
      const rc = computeRiskContribution(metrics.weights);
      return {
        weights: metrics.weights,
        totalReturnPct: metrics.totalReturn,
        cagrPct: metrics.cagr,
        annualizedVolatilityPct: metrics.annualizedVolatility,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdownPct: metrics.maxDrawdown,
        calmarRatio: metrics.calmarRatio,
        var95Pct: metrics.var95,
        var99Pct: metrics.var99,
        cvar95Pct: metrics.cvar95,
        cvar99Pct: metrics.cvar99,
        riskContribution: {
          marginalRisk: rc.marginalRisk,
          componentRisk: rc.componentRisk,
          percentageRisk: {
            GOLD: parseFloat((rc.percentageRisk.GOLD * 100).toFixed(2)),
            BTC: parseFloat((rc.percentageRisk.BTC * 100).toFixed(2)),
            NVDA: parseFloat((rc.percentageRisk.NVDA * 100).toFixed(2)),
          },
          isEulerSumVerified: rc.isEulerSumVerified,
        },
        startDate: metrics.startDate,
        endDate: metrics.endDate,
        observationCount: metrics.observationCount,
        synchronizationPolicy: metrics.synchronizationPolicy,
        dataSource: metrics.dataSourceLabel,
      };
    },
  },

  get_portfolio_optimization: {
    name: 'get_portfolio_optimization',
    description:
      'Solves deterministic multi-asset portfolio optimization (MAX_SHARPE, MIN_VOLATILITY, RISK_PARITY, or TARGET_RETURN) over Gold, Bitcoin, and NVIDIA on the simplex grid with local refinement.',
    category: 'PORTFOLIO',
    schema: GetPortfolioOptimizationSchema,
    parameters: {
      type: 'object',
      properties: {
        objective: {
          type: 'string',
          enum: ['MAX_SHARPE', 'MIN_VOLATILITY', 'RISK_PARITY', 'TARGET_RETURN'],
          description: 'Optimization target objective',
        },
        targetReturnPct: {
          type: 'number',
          description: 'Target annualized return in % (e.g. 30.0 for 30%)',
        },
      },
      required: ['objective'],
    },
    execute: ({ objective, targetReturnPct }) => {
      const opt = optimizePortfolio(
        objective as OptimizationObjective,
        targetReturnPct
      );
      const rc = computeRiskContribution(opt.allocation);
      return {
        objective: opt.objective,
        allocation: opt.allocation,
        expectedReturnPct: opt.expectedReturn,
        volatilityPct: opt.volatility,
        sharpeRatio: opt.sharpeRatio,
        status: opt.status,
        method: opt.method,
        gridResolution: opt.gridResolution,
        feasibleRangePct: opt.feasibleRange,
        targetReturnPct: opt.targetReturn,
        riskContributionPct: {
          GOLD: parseFloat((rc.percentageRisk.GOLD * 100).toFixed(2)),
          BTC: parseFloat((rc.percentageRisk.BTC * 100).toFixed(2)),
          NVDA: parseFloat((rc.percentageRisk.NVDA * 100).toFixed(2)),
        },
      };
    },
  },

  get_monte_carlo_risk: {
    name: 'get_monte_carlo_risk',
    description:
      'Runs probabilistic Monte Carlo simulation (HISTORICAL_BOOTSTRAP or PARAMETRIC_NORMAL) over Gold, Bitcoin, and NVIDIA to evaluate terminal wealth, max drawdown, loss frequency, and tail risk distributions. Does not predict future markets.',
    category: 'PORTFOLIO',
    schema: z.object({
      goldWeight: z.number().min(0).max(1).default(0.4),
      btcWeight: z.number().min(0).max(1).default(0.3),
      nvdaWeight: z.number().min(0).max(1).default(0.3),
      method: z.enum(['HISTORICAL_BOOTSTRAP', 'PARAMETRIC_NORMAL']).default('HISTORICAL_BOOTSTRAP'),
      simulationCount: z.number().int().min(100).max(10000).default(5000),
      horizonDays: z.number().int().min(21).max(504).default(252),
      rebalanceSchedule: z.enum(['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD']).default('MONTHLY'),
      seed: z.number().int().optional(),
    }),
    parameters: {
      type: 'object',
      properties: {
        goldWeight: { type: 'number', description: 'Gold weight 0.0 to 1.0 (default 0.4)' },
        btcWeight: { type: 'number', description: 'BTC weight 0.0 to 1.0 (default 0.3)' },
        nvdaWeight: { type: 'number', description: 'NVDA weight 0.0 to 1.0 (default 0.3)' },
        method: { type: 'string', enum: ['HISTORICAL_BOOTSTRAP', 'PARAMETRIC_NORMAL'], description: 'Simulation method' },
        simulationCount: { type: 'number', description: 'Simulation paths count (100 to 10,000)' },
        horizonDays: { type: 'number', description: 'Forward horizon in trading days (21 to 504)' },
        rebalanceSchedule: { type: 'string', enum: ['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD'], description: 'Rebalance frequency' },
        seed: { type: 'number', description: 'Deterministic seed integer' },
      },
    },
    execute: (args) => {
      const res = runMonteCarloSimulation({
        method: args.method,
        seed: args.seed,
        simulationCount: args.simulationCount,
        horizonDays: args.horizonDays,
        portfolioWeights: { GOLD: args.goldWeight, BTC: args.btcWeight, NVDA: args.nvdaWeight },
        rebalanceSchedule: args.rebalanceSchedule,
      });
      return {
        fingerprint: res.fingerprint,
        provenance: res.provenance,
        terminalWealth: res.terminalWealth,
        totalReturnPct: res.totalReturn,
        maxDrawdownPct: res.maxDrawdown,
        cagrPct: res.cagr,
        sharpeRatio: res.sharpeRatio,
        riskMetrics: res.riskMetrics,
        executionDurationMs: res.executionDurationMs,
      };
    },
  },

  compare_monte_carlo_backtest: {
    name: 'compare_monte_carlo_backtest',
    description:
      'Compares realized historical backtest results against the Monte Carlo simulated outcome distribution for Gold, Bitcoin, and NVIDIA portfolios.',
    category: 'PORTFOLIO',
    schema: z.object({
      goldWeight: z.number().min(0).max(1).default(0.4),
      btcWeight: z.number().min(0).max(1).default(0.3),
      nvdaWeight: z.number().min(0).max(1).default(0.3),
      rebalanceSchedule: z.enum(['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD']).default('MONTHLY'),
    }),
    parameters: {
      type: 'object',
      properties: {
        goldWeight: { type: 'number', description: 'Gold weight 0.0 to 1.0 (default 0.4)' },
        btcWeight: { type: 'number', description: 'BTC weight 0.0 to 1.0 (default 0.3)' },
        nvdaWeight: { type: 'number', description: 'NVDA weight 0.0 to 1.0 (default 0.3)' },
        rebalanceSchedule: { type: 'string', enum: ['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD'], description: 'Rebalance schedule' },
      },
    },
    execute: (args) => {
      const comparisons = compareHistoricalVsMonteCarlo(
        { GOLD: args.goldWeight, BTC: args.btcWeight, NVDA: args.nvdaWeight },
        args.rebalanceSchedule
      );
      return { comparisons };
    },
  },

  get_regime_monte_carlo_risk: {
    name: 'get_regime_monte_carlo_risk',
    description:
      'Runs regime-conditioned Monte Carlo simulation (REGIME_BOOTSTRAP or REGIME_PARAMETRIC) over Gold, Bitcoin, and NVIDIA conditioned on starting regime and empirical Markov regime transitions. Evaluates terminal wealth, drawdown, loss frequency, and tail risk distributions. Non-predictive research tool.',
    category: 'PORTFOLIO',
    schema: z.object({
      goldWeight: z.number().min(0).max(1).default(0.4),
      btcWeight: z.number().min(0).max(1).default(0.3),
      nvdaWeight: z.number().min(0).max(1).default(0.3),
      startingRegime: z.enum(['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL', 'CURRENT', 'EMPIRICAL']).default('CURRENT'),
      method: z.enum(['REGIME_BOOTSTRAP', 'REGIME_PARAMETRIC']).default('REGIME_BOOTSTRAP'),
      simulationCount: z.number().int().min(100).max(10000).default(5000),
      horizonDays: z.number().int().min(21).max(504).default(252),
      rebalanceSchedule: z.enum(['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD']).default('MONTHLY'),
      seed: z.number().int().optional(),
    }),
    parameters: {
      type: 'object',
      properties: {
        goldWeight: { type: 'number', description: 'Gold weight 0.0 to 1.0 (default 0.4)' },
        btcWeight: { type: 'number', description: 'BTC weight 0.0 to 1.0 (default 0.3)' },
        nvdaWeight: { type: 'number', description: 'NVDA weight 0.0 to 1.0 (default 0.3)' },
        startingRegime: { type: 'string', enum: ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL', 'CURRENT', 'EMPIRICAL'], description: 'Starting regime conditioning mode' },
        method: { type: 'string', enum: ['REGIME_BOOTSTRAP', 'REGIME_PARAMETRIC'], description: 'Simulation method' },
        simulationCount: { type: 'number', description: 'Simulation paths count (100 to 10,000)' },
        horizonDays: { type: 'number', description: 'Forward horizon in trading days (21 to 504)' },
        rebalanceSchedule: { type: 'string', enum: ['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD'], description: 'Rebalance frequency' },
        seed: { type: 'number', description: 'Deterministic seed integer' },
      },
    },
    execute: (args) => {
      let startMode: any = 'START_CURRENT_OBSERVED';
      if (args.startingRegime === 'BULL') startMode = 'START_BULL';
      else if (args.startingRegime === 'BEAR') startMode = 'START_BEAR';
      else if (args.startingRegime === 'HIGH_VOL') startMode = 'START_HIGH_VOL';
      else if (args.startingRegime === 'LOW_VOL') startMode = 'START_LOW_VOL';
      else if (args.startingRegime === 'EMPIRICAL') startMode = 'START_EMPIRICAL_DISTRIBUTION';

      const res = runRegimeMonteCarloSimulation({
        method: args.method,
        startingRegimeMode: startMode,
        seed: args.seed,
        simulationCount: args.simulationCount,
        horizonDays: args.horizonDays,
        portfolioWeights: { GOLD: args.goldWeight, BTC: args.btcWeight, NVDA: args.nvdaWeight },
        rebalanceSchedule: args.rebalanceSchedule,
      });

      return {
        fingerprint: res.fingerprint,
        provenance: res.provenance,
        startingRegimeMode: res.startingRegimeMode,
        resolvedStartingRegime: res.resolvedStartingRegime,
        terminalWealth: res.terminalWealth,
        totalReturnPct: res.totalReturn,
        maxDrawdownPct: res.maxDrawdown,
        cagrPct: res.cagr,
        sharpeRatio: res.sharpeRatio,
        riskMetrics: res.riskMetrics,
        pathStats: res.pathStats,
        executionDurationMs: res.executionDurationMs,
      };
    },
  },

  compare_regime_simulations: {
    name: 'compare_regime_simulations',
    description:
      'Runs side-by-side comparative Monte Carlo simulation across all 4 starting regimes (BULL, BEAR, HIGH_VOLATILITY, LOW_VOLATILITY) under identical portfolio weights, horizon, and seed.',
    category: 'PORTFOLIO',
    schema: z.object({
      goldWeight: z.number().min(0).max(1).default(0.4),
      btcWeight: z.number().min(0).max(1).default(0.3),
      nvdaWeight: z.number().min(0).max(1).default(0.3),
      method: z.enum(['REGIME_BOOTSTRAP', 'REGIME_PARAMETRIC']).default('REGIME_BOOTSTRAP'),
      horizonDays: z.number().int().min(21).max(504).default(252),
      simulationCount: z.number().int().min(100).max(5000).default(2500),
      seed: z.number().int().optional().default(42),
    }),
    parameters: {
      type: 'object',
      properties: {
        goldWeight: { type: 'number', description: 'Gold weight 0.0 to 1.0 (default 0.4)' },
        btcWeight: { type: 'number', description: 'BTC weight 0.0 to 1.0 (default 0.3)' },
        nvdaWeight: { type: 'number', description: 'NVDA weight 0.0 to 1.0 (default 0.3)' },
        method: { type: 'string', enum: ['REGIME_BOOTSTRAP', 'REGIME_PARAMETRIC'], description: 'Simulation method' },
        horizonDays: { type: 'number', description: 'Forward horizon in trading days (21 to 504)' },
        simulationCount: { type: 'number', description: 'Simulation count per regime (100 to 5,000)' },
        seed: { type: 'number', description: 'Deterministic seed integer' },
      },
    },
    execute: (args) => {
      const comp = compareRegimeSimulations(
        { GOLD: args.goldWeight, BTC: args.btcWeight, NVDA: args.nvdaWeight },
        args.method,
        args.horizonDays,
        args.simulationCount,
        args.seed
      );
      return {
        table: comp.table,
        transitionMatrix: {
          occupancy: comp.transitionMatrix.occupancy,
          averageDuration: comp.transitionMatrix.averageDuration,
          selfTransitionProbability: comp.transitionMatrix.selfTransitionProbability,
        },
      };
    },
  },
};

export const ALL_BLACKBOX_TOOLS: Record<string, BlackboxToolDefinition> = {
  ...BLACKBOX_TOOLS,
  ...PORTFOLIO_TOOLS,
};

/**
 * Returns OpenAI-compatible tool specifications for all BLACKBOX tools plus web search.
 */
/**
 * Returns OpenAI-compatible tool specifications for ONLY registered BLACKBOX quantitative tools (no web search).
 */
export function getBlackboxOpenAIToolDefinitions(): Array<{ type: 'function'; function: any }> {
  return Object.values(BLACKBOX_TOOLS).map(t => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

/**
 * Returns OpenAI-compatible tool specification for ONLY web_search.
 */
export function getWebSearchOpenAIToolDefinition(): Array<{ type: 'function'; function: any }> {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'web_search',
        description: 'Search the live web for current market news, corporate announcements, macro developments, or external financial reports.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query string' },
            maxResults: { type: 'number', description: 'Max search results to retrieve (1-5)' },
          },
          required: ['query'],
        },
      },
    },
  ];
}

/**
 * Returns OpenAI-compatible tool specifications for all BLACKBOX tools plus web search.
 */
export function getOpenAIToolDefinitions(): Array<{ type: 'function'; function: any }> {
  return [
    ...getBlackboxOpenAIToolDefinitions(),
    ...getWebSearchOpenAIToolDefinition(),
  ];
}

/**
 * Server-side mode enforcement: returns strictly permitted tool definitions for the active assistant mode.
 * - GENERAL: NONE (undefined) -> zero tools passed to LLM
 * - BLACKBOX: ONLY BLACKBOX quantitative tools -> NO web search
 * - WEB: ONLY web_search -> NO quantitative tools
 * - HYBRID: BOTH quantitative tools + web search
 */
export function getToolsForMode(mode: string): Array<{ type: 'function'; function: any }> | undefined {
  if (mode === 'BLACKBOX') {
    return getBlackboxOpenAIToolDefinitions();
  }
  if (mode === 'WEB') {
    return getWebSearchOpenAIToolDefinition();
  }
  if (mode === 'HYBRID') {
    return getOpenAIToolDefinitions();
  }
  // GENERAL mode: STRICT SERVER-SIDE ENFORCEMENT -> NO TOOLS ALLOWED
  return undefined;
}

/**
 * Executes a BLACKBOX tool safely by name with argument validation.
 */
export async function executeBlackboxTool(name: string, rawArgs: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const tool = BLACKBOX_TOOLS[name] || PORTFOLIO_TOOLS[name];
  if (!tool) {
    return { success: false, error: `Tool "${name}" is not registered in BLACKBOX tool registry.` };
  }

  try {
    const validated = tool.schema.parse(rawArgs);
    const result = await tool.execute(validated);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: `Tool execution failed: ${err.message}` };
  }
}
