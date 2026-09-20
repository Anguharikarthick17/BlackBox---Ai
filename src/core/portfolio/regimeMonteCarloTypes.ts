/**
 * BLACKBOX X — Phase 3.9
 * Regime-Aware Probabilistic Intelligence Types & Contracts
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Enforces non-predictive framing, empirical transition structures,
 * conditional return pools, and regime-conditioned Monte Carlo contracts.
 */

import { Asset, PortfolioWeights, RebalanceFrequency, validateWeights, DEFAULT_PORTFOLIO_WEIGHTS } from './portfolioTypes';
import type {
  PercentileSummary,
  SimulationTrajectoryBands,
  SamplePath,
  MonteCarloRiskMetrics,
} from './monteCarloTypes';

export type {
  PercentileSummary,
  SimulationTrajectoryBands,
  SamplePath,
  MonteCarloRiskMetrics,
};
import { RegimeType } from '../regimes';

export type RegimeMonteCarloMethod = 'REGIME_BOOTSTRAP' | 'REGIME_PARAMETRIC';

export type StartingRegimeMode =
  | 'START_BULL'
  | 'START_BEAR'
  | 'START_HIGH_VOL'
  | 'START_LOW_VOL'
  | 'START_CURRENT_OBSERVED'
  | 'START_EMPIRICAL_DISTRIBUTION';

export const ALL_REGIMES: RegimeType[] = ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'];

export const MIN_REGIME_OBSERVATIONS = 20;

export interface AlignedRegimeObservation {
  date: string;
  regime: RegimeType;
  assetReturns: Record<Asset, number>;
  portfolioReturn: number;
}

export interface RegimeTransitionMatrix {
  regimes: RegimeType[];
  counts: Record<RegimeType, Record<RegimeType, number>>;
  probabilities: Record<RegimeType, Record<RegimeType, number>>;
  observationCounts: Record<RegimeType, number>;
  outgoingTransitionCounts: Record<RegimeType, number>;
  occupancy: Record<RegimeType, number>;                    // Frequencies summing to 1.0
  selfTransitionProbability: Record<RegimeType, number>;     // P_ii stickiness
  averageDuration: Record<RegimeType, number>;               // Empirical mean duration in consecutive days
  medianDuration: Record<RegimeType, number>;                // Empirical median duration in consecutive days
  expectedMarkovDuration: Record<RegimeType, number>;        // Theoretical 1 / (1 - P_ii)
  switchingFrequency: number;                                // Rate of switching across consecutive bars
  sparseRegimes: RegimeType[];                               // Regimes with < 20 observations
  insufficientDataRegimes: RegimeType[];                     // Regimes with 0 outgoing transitions
  status: 'VALID' | 'SPARSE_WARNING' | 'INSUFFICIENT_TRANSITION_DATA';
  warnings: string[];
}

export interface RegimeReturnPool {
  regime: RegimeType;
  observationCount: number;
  isSparse: boolean;
  vectors: number[][];                                       // Each vector is [r_GOLD, r_BTC, r_NVDA]
  dates: string[];
  mean: Record<Asset, number>;                               // Daily mean returns
  volatility: Record<Asset, number>;                         // Annualized volatility %
  covariance: Record<Asset, Record<Asset, number>>;          // Annualized covariance
  dailyCovarianceMatrix: number[][];                         // 3x3 daily covariance array
  choleskyL: number[][];                                     // 3x3 lower-triangular Cholesky factor
  regularizationApplied: boolean;
  regularizationMagnitude?: number;
  minReturns: Record<Asset, number>;
  maxReturns: Record<Asset, number>;
  percentiles: Record<Asset, PercentileSummary>;
  riskContribution?: {
    marginalRisk: Record<Asset, number>;
    componentRisk: Record<Asset, number>;
    percentageRisk: Record<Asset, number>;
    portfolioVolatility: number;
  };
}

export interface RegimeSimulationPathStats {
  terminalRegimeCounts: Record<RegimeType, number>;
  terminalRegimeFrequencies: Record<RegimeType, number>;
  occupancyDays: Record<RegimeType, number>;
  occupancyFrequencies: Record<RegimeType, number>;
  averageTransitionsPerPath: number;
  transitionCounts: Record<RegimeType, Record<RegimeType, number>>;
  averageSimulatedDuration: Record<RegimeType, number>;
}

export interface RegimeMonteCarloProvenance {
  dataSource: 'OFFLINE_DEMO';
  dataSourceLabel: string;
  dataWindowDescription: string;
  dataWindow: {
    startDate: string;
    endDate: string;
    observationCount: number;
  };
  regimeEngineVersion: string;
  regimeObservationCounts: Record<RegimeType, number>;
  transitionMatrixFingerprint: string;
  simulationMethod: RegimeMonteCarloMethod;
  startingRegimeMode: StartingRegimeMode;
  resolvedStartingRegime: RegimeType | 'EMPIRICAL_DISTRIBUTION';
  seed: number;
  simulationCount: number;
  horizonDays: number;
  portfolioWeights: PortfolioWeights;
  rebalanceSchedule: RebalanceFrequency;
  transactionCostBps: number;
  conditionalMoments: Record<RegimeType, { mean: Record<Asset, number>; volatility: Record<Asset, number> }>;
  regularizationMetadata: Record<RegimeType, { applied: boolean; lambda?: number }>;
  fingerprint: string;
  generatedTimestamp: number;
}

export interface RegimeMonteCarloConfig {
  method: RegimeMonteCarloMethod;
  startingRegimeMode?: StartingRegimeMode;
  portfolioWeights: PortfolioWeights;
  simulationCount?: number;             // Default: 5,000 | Max: 50,000
  horizonDays?: number;                 // Default: 252 | Max: 1,260
  seed?: number;                        // Default: 42
  initialCapital?: number;              // Default: 100,000
  rebalanceSchedule?: RebalanceFrequency; // Default: 'MONTHLY'
  includeTransactionCosts?: boolean;    // Default: true
  transactionCostBps?: number;          // Default: 10 (0.0010)
}

export interface RegimeMonteCarloResult {
  fingerprint: string;
  provenance: RegimeMonteCarloProvenance;
  startingRegimeMode: StartingRegimeMode;
  resolvedStartingRegime: RegimeType | 'EMPIRICAL_DISTRIBUTION';
  terminalWealth: PercentileSummary;
  totalReturn: PercentileSummary;
  maxDrawdown: PercentileSummary;
  cagr?: PercentileSummary;             // Evaluated when horizonDays >= 63
  sharpeRatio?: PercentileSummary;      // Evaluated when horizonDays >= 63
  riskMetrics: MonteCarloRiskMetrics;
  trajectoryBands: SimulationTrajectoryBands;
  samplePaths: SamplePath[];
  pathStats: RegimeSimulationPathStats;
  executionDurationMs: number;
  transitionMatrix: RegimeTransitionMatrix;
}

export interface RegimeComparisonRow {
  startingRegime: RegimeType;
  startingRegimeLabel: string;
  p50ReturnPct: number;
  p05ReturnPct: number;
  p95ReturnPct: number;
  p50MaxDrawdownPct: number;
  p95MaxDrawdownPct: number;
  lossFrequencyPct: number;
  medianTerminalWealth: number;
  oneDayVaR95: number;
  oneDayCVaR95: number;
  horizonVaR95: number;
  horizonCVaR95: number;
}

export interface RegimeComparisonMatrixResult {
  method: RegimeMonteCarloMethod;
  horizonDays: number;
  simulationCount: number;
  portfolioWeights: PortfolioWeights;
  comparisons: Record<RegimeType, RegimeMonteCarloResult>;
  table: RegimeComparisonRow[];
  transitionMatrix: RegimeTransitionMatrix;
}

export function validateRegimeMonteCarloConfig(userConfig: RegimeMonteCarloConfig): {
  isValid: boolean;
  error?: string;
  sanitizedConfig?: Required<RegimeMonteCarloConfig>;
} {
  const weightVal = validateWeights(userConfig.portfolioWeights);
  if (!weightVal.isValid) {
    return { isValid: false, error: `Invalid portfolio weights: ${weightVal.error}` };
  }

  const simCount = userConfig.simulationCount ?? 5000;
  if (!Number.isInteger(simCount) || simCount < 1 || simCount > 50000) {
    return { isValid: false, error: `Simulation count must be an integer between 1 and 50,000 (received ${simCount}).` };
  }

  const horizon = userConfig.horizonDays ?? 252;
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 1260) {
    return { isValid: false, error: `Horizon days must be an integer between 1 and 1,260 (received ${horizon}).` };
  }

  const seed = userConfig.seed ?? 42;
  if (!Number.isInteger(seed) || seed < 0) {
    return { isValid: false, error: `Seed must be a non-negative integer (received ${seed}).` };
  }

  const initialCap = userConfig.initialCapital ?? 100000;
  if (initialCap <= 0 || !Number.isFinite(initialCap)) {
    return { isValid: false, error: `Initial capital must be a positive number (received ${initialCap}).` };
  }

  const validMethods: RegimeMonteCarloMethod[] = ['REGIME_BOOTSTRAP', 'REGIME_PARAMETRIC'];
  if (!validMethods.includes(userConfig.method)) {
    return { isValid: false, error: `Invalid simulation method '${userConfig.method}'. Must be REGIME_BOOTSTRAP or REGIME_PARAMETRIC.` };
  }

  const validModes: StartingRegimeMode[] = [
    'START_BULL',
    'START_BEAR',
    'START_HIGH_VOL',
    'START_LOW_VOL',
    'START_CURRENT_OBSERVED',
    'START_EMPIRICAL_DISTRIBUTION',
  ];
  const startingMode = userConfig.startingRegimeMode ?? 'START_CURRENT_OBSERVED';
  if (!validModes.includes(startingMode)) {
    return { isValid: false, error: `Invalid starting regime mode '${startingMode}'.` };
  }

  const validSchedules: RebalanceFrequency[] = ['BUY_AND_HOLD', 'DAILY', 'MONTHLY', 'QUARTERLY', 'THRESHOLD'];
  const schedule = userConfig.rebalanceSchedule ?? 'MONTHLY';
  if (!validSchedules.includes(schedule)) {
    return { isValid: false, error: `Invalid rebalance schedule '${schedule}'.` };
  }

  const sanitized: Required<RegimeMonteCarloConfig> = {
    method: userConfig.method,
    startingRegimeMode: startingMode,
    portfolioWeights: weightVal.normalizedWeights,
    simulationCount: simCount,
    horizonDays: horizon,
    seed,
    initialCapital: initialCap,
    rebalanceSchedule: schedule,
    includeTransactionCosts: userConfig.includeTransactionCosts ?? true,
    transactionCostBps: Math.max(0, userConfig.transactionCostBps ?? 10),
  };

  return { isValid: true, sanitizedConfig: sanitized };
}
