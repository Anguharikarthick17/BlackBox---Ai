/**
 * BLACKBOX X — Phase 3.8
 * Monte Carlo & Probabilistic Risk Intelligence Types
 */

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
  totalReturnPct: number;
  maxDrawdownPct: number;
  values: number[];                     // Sampled path values
}

export interface MonteCarloRiskMetrics {
  lossFrequency: number;                // Fraction of paths ending with wealth < initialCapital (0 to 1)
  lossFrequencyPct: number;             // Percentage (0 to 100%)
  drawdownExceedance10Pct: number;      // % of paths with MDD <= -10%
  drawdownExceedance20Pct: number;      // % of paths with MDD <= -20%
  drawdownExceedance30Pct: number;      // % of paths with MDD <= -30%
  oneDaySimulatedVaR95: number;         // Positive loss convention %
  oneDaySimulatedCVaR95: number;        // Expected shortfall %
  horizonSimulatedVaR95: number;        // Terminal horizon loss %
  horizonSimulatedCVaR95: number;       // Terminal horizon Expected shortfall %
}

export interface MonteCarloProvenance {
  dataSource: 'OFFLINE_DEMO';
  dataSourceLabel: string;
  dataWindow: {
    startDate: string;
    endDate: string;
    observationCount: number;
  };
  simulationMethod: MonteCarloMethod;
  simulationCount: number;
  horizonDays: number;
  seed: number;
  portfolioWeights: PortfolioWeights;
  rebalanceSchedule: RebalanceFrequency;
  transactionCostBps: number;
  fingerprint: string;
  generatedTimestamp: number;
}

export interface MonteCarloConfig {
  method: MonteCarloMethod;
  seed?: number;
  simulationCount?: number;             // Default: 10,000 | Max: 50,000
  horizonDays?: number;                 // Default: 252 | Max: 1,260
  initialCapital?: number;              // Default: 100,000
  portfolioWeights: PortfolioWeights;
  rebalanceSchedule?: RebalanceFrequency; // Default: 'MONTHLY'
  includeTransactionCosts?: boolean;    // Default: true
  transactionCostBps?: number;          // Default: 10 (0.0010)
}

export interface MonteCarloResult {
  fingerprint: string;
  provenance: MonteCarloProvenance;
  terminalWealth: PercentileSummary;
  totalReturn: PercentileSummary;
  maxDrawdown: PercentileSummary;
  cagr?: PercentileSummary;             // Evaluated when horizonDays >= 63
  sharpeRatio?: PercentileSummary;      // Evaluated when horizonDays >= 63
  riskMetrics: MonteCarloRiskMetrics;
  trajectoryBands: SimulationTrajectoryBands;
  samplePaths: SamplePath[];
  executionDurationMs: number;
  stabilizationApplied: boolean;
  stabilizationMagnitude?: number;
}

export interface HistoricalVsMonteCarloComparison {
  metricName: string;
  historicalValue: number;          // Realized in 2019-2023 backtest
  monteCarloMedian: number;         // P50 across simulated paths
  monteCarloP05: number;            // P05 adverse percentile
  monteCarloP95: number;            // P95 favorable percentile
  historicalPercentileRank: number; // Percentile rank of historical within MC (0-100)
  interpretation: string;           // Quantitative commentary
}

export interface MonteCarloValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedConfig?: Required<Omit<MonteCarloConfig, 'seed'>> & { seed: number };
}

export const DEFAULT_MC_CONFIG: Required<Omit<MonteCarloConfig, 'seed'>> & { seed: number } = {
  method: 'HISTORICAL_BOOTSTRAP',
  seed: 482910,
  simulationCount: 10000,
  horizonDays: 252,
  initialCapital: 100000,
  portfolioWeights: { GOLD: 0.4, BTC: 0.3, NVDA: 0.3 },
  rebalanceSchedule: 'MONTHLY',
  includeTransactionCosts: true,
  transactionCostBps: 10,
};

/**
 * Validates and sanitizes Monte Carlo configuration against strict institutional boundaries.
 */
export function validateMonteCarloConfig(config: MonteCarloConfig): MonteCarloValidationResult {
  const method = config.method;
  if (method !== 'HISTORICAL_BOOTSTRAP' && method !== 'PARAMETRIC_NORMAL') {
    return { isValid: false, error: `Invalid simulation method: ${method}` };
  }

  const simCount = config.simulationCount ?? DEFAULT_MC_CONFIG.simulationCount;
  if (!Number.isInteger(simCount) || simCount <= 0 || simCount > 50000) {
    return { isValid: false, error: `simulationCount must be an integer between 1 and 50,000 (received: ${simCount})` };
  }

  const horizon = config.horizonDays ?? DEFAULT_MC_CONFIG.horizonDays;
  if (!Number.isInteger(horizon) || horizon <= 0 || horizon > 1260) {
    return { isValid: false, error: `horizonDays must be an integer between 1 and 1,260 (received: ${horizon})` };
  }

  const capital = config.initialCapital ?? DEFAULT_MC_CONFIG.initialCapital;
  if (typeof capital !== 'number' || isNaN(capital) || capital < 1000 || capital > 100000000) {
    return { isValid: false, error: `initialCapital must be between $1,000 and $100,000,000 (received: ${capital})` };
  }

  const weights = config.portfolioWeights;
  if (!weights || typeof weights !== 'object') {
    return { isValid: false, error: 'portfolioWeights must be provided' };
  }
  const { GOLD, BTC, NVDA } = weights;
  if (typeof GOLD !== 'number' || typeof BTC !== 'number' || typeof NVDA !== 'number') {
    return { isValid: false, error: 'Weights for GOLD, BTC, and NVDA must be numbers' };
  }
  if (GOLD < 0 || BTC < 0 || NVDA < 0) {
    return { isValid: false, error: 'Negative weights are not permitted (long-only simplex required)' };
  }
  const sumW = GOLD + BTC + NVDA;
  if (Math.abs(sumW - 1.0) > 1e-4) {
    return { isValid: false, error: `Weights must sum to 1.0 (found: ${sumW.toFixed(4)})` };
  }

  const feeBps = config.transactionCostBps ?? DEFAULT_MC_CONFIG.transactionCostBps;
  if (typeof feeBps !== 'number' || isNaN(feeBps) || feeBps < 0 || feeBps > 500) {
    return { isValid: false, error: `transactionCostBps must be between 0 and 500 bps (received: ${feeBps})` };
  }

  const rawSeed = config.seed ?? DEFAULT_MC_CONFIG.seed;
  const sanitizedSeed = Math.abs(Math.floor(rawSeed)) >>> 0;

  const validSchedules: RebalanceFrequency[] = ['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD'];
  const schedule = config.rebalanceSchedule ?? DEFAULT_MC_CONFIG.rebalanceSchedule;
  if (!validSchedules.includes(schedule)) {
    return { isValid: false, error: `Invalid rebalanceSchedule: ${schedule}` };
  }

  return {
    isValid: true,
    sanitizedConfig: {
      method,
      seed: sanitizedSeed,
      simulationCount: simCount,
      horizonDays: horizon,
      initialCapital: capital,
      portfolioWeights: { GOLD, BTC, NVDA },
      rebalanceSchedule: schedule,
      includeTransactionCosts: config.includeTransactionCosts ?? true,
      transactionCostBps: feeBps,
    },
  };
}
