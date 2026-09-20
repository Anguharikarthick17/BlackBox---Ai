/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Intelligence & Optimization Types
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 */

import { Asset } from '../data';
export type { Asset };

export type PortfolioWeights = Record<Asset, number>;

export const DEFAULT_PORTFOLIO_WEIGHTS: PortfolioWeights = {
  GOLD: 0.4,
  BTC: 0.3,
  NVDA: 0.3,
};

export const EQUAL_WEIGHTS: PortfolioWeights = {
  GOLD: 1 / 3,
  BTC: 1 / 3,
  NVDA: 1 / 3,
};

export const RISK_FREE_RATE = 0.04; // 4.0% annualized risk-free rate convention
export const TRADING_DAYS_PER_YEAR = 252;
export const DEFAULT_TRANSACTION_FEE = 0.001; // 10 bps (0.10%) per trade

export interface DataProvenance {
  startDate: string;
  endDate: string;
  observationCount: number;
  assetsIncluded: Asset[];
  synchronizationPolicy: string;
  isSimulatedData: true;
  dataSourceLabel: string;
}

export interface PortfolioMetrics extends DataProvenance {
  weights: PortfolioWeights;
  totalReturn: number;           // %
  cagr: number;                  // %
  annualizedVolatility: number;  // %
  sharpeRatio: number;
  maxDrawdown: number;           // % (peak-to-trough, positive or negative magnitude standard)
  calmarRatio: number;
  var95: number;                 // Positive loss magnitude % (1-day horizon)
  var99: number;                 // Positive loss magnitude % (1-day horizon)
  cvar95: number;                // Positive loss magnitude % (Expected Shortfall)
  cvar99: number;                // Positive loss magnitude % (Expected Shortfall)
  dailyReturns: number[];
  dates: string[];
}

export interface RiskContribution {
  marginalRisk: Record<Asset, number>;     // MRC_i = (Σw)_i / σ_p
  componentRisk: Record<Asset, number>;    // CRC_i = w_i * MRC_i
  percentageRisk: Record<Asset, number>;   // PRC_i = CRC_i / σ_p
  eulerSumCrc: number;                     // Sum of CRC_i ≈ σ_p
  eulerSumPrc: number;                     // Sum of PRC_i ≈ 1.0 (100%)
  portfolioVolatility: number;             // σ_p (annualized decimal)
  isEulerSumVerified: boolean;             // True if |sum(CRC) - σ_p| < 1e-4
  tolerance: number;
}

export type OptimizationObjective =
  | 'MAX_SHARPE'
  | 'MIN_VOLATILITY'
  | 'RISK_PARITY'
  | 'TARGET_RETURN';

export interface OptimizationResult {
  objective: OptimizationObjective;
  allocation: PortfolioWeights;
  objectiveValue: number;
  expectedReturn: number;       // Annualized %
  volatility: number;           // Annualized %
  sharpeRatio: number;
  status: 'BEST_FOUND' | 'INFEASIBLE';
  method: string;
  gridResolution: number;
  refinementMetadata: {
    iterations: number;
    stepSize: number;
    gradientTolerance: number;
  };
  feasibleRange?: [number, number]; // [R_min, R_max] annualized %
  targetReturn?: number;            // For TARGET_RETURN objective
}

export interface EfficientFrontierPoint {
  targetReturn: number;         // %
  achievedReturn: number;       // %
  volatility: number;           // %
  sharpeRatio: number;
  allocation: PortfolioWeights;
}

export interface CapitalAllocationLine {
  riskFreeRate: number;         // 4.0%
  tangencyPortfolio: EfficientFrontierPoint;
  points: { volatility: number; expectedReturn: number }[];
  note: string;
}

export type RebalanceFrequency =
  | 'DAILY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'THRESHOLD'
  | 'BUY_AND_HOLD';

export interface PortfolioBacktestResult extends DataProvenance {
  dates: string[];
  equity: number[];
  returns: number[];
  drawdowns: number[];
  initialCapital: number;
  endingCapital: number;
  totalReturn: number;
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  turnover: number;
  transactionCosts: number;
  rebalanceCount: number;
  weights: PortfolioWeights;
  rebalanceFrequency: RebalanceFrequency;
}

export interface PortfolioStressResult {
  scenarioId: string;
  scenarioName: string;
  weights: PortfolioWeights;
  baselineReturn: number;
  stressedReturn: number;
  stressedDrawdown: number;
  stressedSharpe: number;
  damageContribution: Record<Asset, number>; // How much each asset contributed to portfolio loss
  recoveryDays: number;
  disclaimer: string;
}

export interface PortfolioRegimePerformance {
  regime: 'Bull' | 'Bear' | 'High Volatility' | 'Low Volatility';
  periodCount: number;
  totalDays: number;
  totalReturn: number;
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  riskContribution: Record<Asset, number>; // PRC during regime
}

/**
 * Validates portfolio weights:
 * 1. All assets present (GOLD, BTC, NVDA)
 * 2. All weights >= 0 (no short selling)
 * 3. Sum of weights == 1 (tolerance 0.005)
 */
export function validateWeights(weights: Partial<PortfolioWeights>): {
  isValid: boolean;
  normalizedWeights: PortfolioWeights;
  error?: string;
} {
  const assets: Asset[] = ['GOLD', 'BTC', 'NVDA'];
  for (const asset of assets) {
    const val = weights[asset];
    if (val === undefined || isNaN(val)) {
      return {
        isValid: false,
        normalizedWeights: DEFAULT_PORTFOLIO_WEIGHTS,
        error: `Missing or invalid weight for asset ${asset}`,
      };
    }
    if (val < -1e-7) {
      return {
        isValid: false,
        normalizedWeights: DEFAULT_PORTFOLIO_WEIGHTS,
        error: `Negative weights are not permitted (long-only). Received ${val} for ${asset}`,
      };
    }
  }

  const sum = (weights.GOLD ?? 0) + (weights.BTC ?? 0) + (weights.NVDA ?? 0);
  if (sum <= 1e-6) {
    return {
      isValid: false,
      normalizedWeights: DEFAULT_PORTFOLIO_WEIGHTS,
      error: 'Portfolio weights must sum to 1.0 (100%). Received sum: 0.00%',
    };
  }
  if (Math.abs(sum - 1.0) > 0.005) {
    return {
      isValid: false,
      normalizedWeights: {
        GOLD: Math.max(0, (weights.GOLD ?? 0) / sum),
        BTC: Math.max(0, (weights.BTC ?? 0) / sum),
        NVDA: Math.max(0, (weights.NVDA ?? 0) / sum),
      },
      error: `Portfolio weights must sum to 1.0 (100%). Received sum: ${(sum * 100).toFixed(2)}%`,
    };
  }

  // Exact normalization to avoid floating precision drift
  const safeSum = sum || 1.0;
  return {
    isValid: true,
    normalizedWeights: {
      GOLD: Math.max(0, (weights.GOLD ?? 0) / safeSum),
      BTC: Math.max(0, (weights.BTC ?? 0) / safeSum),
      NVDA: Math.max(0, (weights.NVDA ?? 0) / safeSum),
    },
  };
}
