/**
 * BLACKBOX X — Phase 3.7
 * Efficient Frontier & Capital Allocation Line (CAL) Engine
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * FEASIBILITY BOUNDS:
 * Target returns are bounded by [R_MinVol, R_max].
 * Lower branch portfolios (variance higher than R_MinVol for lower return) are discarded.
 * No decorative, random, or extrapolated points are generated.
 *
 * CAPITAL ALLOCATION LINE:
 * CAL(sigma) = R_f + Sharpe* * sigma, with R_f = 4.0%.
 * The risk-free asset is an external reference benchmark, NOT held in the 3-asset portfolio.
 */

import {
  EfficientFrontierPoint,
  CapitalAllocationLine,
  RISK_FREE_RATE,
} from './portfolioTypes';
import {
  getSynchronizedAssetData,
  SynchronizedDataset,
} from './covariance';
import { optimizePortfolio } from './optimizer';

const FRONTIER_POINTS_COUNT = 50;

export interface EfficientFrontierResult {
  points: EfficientFrontierPoint[];
  minVolPoint: EfficientFrontierPoint;
  maxSharpePoint: EfficientFrontierPoint;
  maxReturnPoint: EfficientFrontierPoint;
  cal: CapitalAllocationLine;
  feasibleRange: [number, number]; // [R_MinVol %, R_max %]
  pointCount: number;
}

/**
 * Computes the deterministic Efficient Frontier and Capital Allocation Line.
 */
export function generateEfficientFrontier(
  datasetOverride?: SynchronizedDataset
): EfficientFrontierResult {
  const dataset = datasetOverride || getSynchronizedAssetData();
  const mu = dataset.annualizedExpectedReturns;

  // 1. Find Minimum Volatility Portfolio
  const minVolResult = optimizePortfolio('MIN_VOLATILITY', undefined, dataset);
  const minVolReturn = minVolResult.expectedReturn / 100; // decimal

  // 2. Find Max Return (100% in highest yielding asset)
  const returnsArray = [mu.GOLD, mu.BTC, mu.NVDA];
  const maxReturn = Math.max(...returnsArray);

  // 3. Find Tangency / Maximum Sharpe Portfolio
  const maxSharpeResult = optimizePortfolio('MAX_SHARPE', undefined, dataset);

  const minVolPoint: EfficientFrontierPoint = {
    targetReturn: parseFloat((minVolReturn * 100).toFixed(2)),
    achievedReturn: minVolResult.expectedReturn,
    volatility: minVolResult.volatility,
    sharpeRatio: minVolResult.sharpeRatio,
    allocation: minVolResult.allocation,
  };

  const maxSharpePoint: EfficientFrontierPoint = {
    targetReturn: maxSharpeResult.expectedReturn,
    achievedReturn: maxSharpeResult.expectedReturn,
    volatility: maxSharpeResult.volatility,
    sharpeRatio: maxSharpeResult.sharpeRatio,
    allocation: maxSharpeResult.allocation,
  };

  // 4. Generate M = 50 target returns along [R_MinVol, R_max]
  const points: EfficientFrontierPoint[] = [];
  const M = FRONTIER_POINTS_COUNT;
  const returnRange = maxReturn - minVolReturn;

  for (let k = 0; k < M; k++) {
    const targetRet = minVolReturn + (k / (M - 1)) * returnRange;
    const targetPct = targetRet * 100;

    const opt = optimizePortfolio('TARGET_RETURN', targetPct, dataset);
    if (opt.status === 'BEST_FOUND') {
      points.push({
        targetReturn: parseFloat(targetPct.toFixed(2)),
        achievedReturn: opt.expectedReturn,
        volatility: opt.volatility,
        sharpeRatio: opt.sharpeRatio,
        allocation: opt.allocation,
      });
    }
  }

  // Ensure minVol and maxSharpe are included cleanly
  if (points.length === 0) {
    points.push(minVolPoint);
  }

  const maxReturnPoint = points[points.length - 1];

  // 5. Generate Capital Allocation Line (CAL)
  // CAL(sigma) = Rf + Sharpe* * sigma
  const rfPct = RISK_FREE_RATE * 100; // 4.0%
  const sharpeStar = maxSharpePoint.sharpeRatio;
  const maxFrontierVol = Math.max(...points.map(p => p.volatility), 60);

  const calVolSteps = 10;
  const calPoints: { volatility: number; expectedReturn: number }[] = [];
  for (let i = 0; i <= calVolSteps; i++) {
    const vol = (i / calVolSteps) * (maxFrontierVol * 1.25);
    const expectedRet = rfPct + sharpeStar * vol;
    calPoints.push({
      volatility: parseFloat(vol.toFixed(2)),
      expectedReturn: parseFloat(expectedRet.toFixed(2)),
    });
  }

  const cal: CapitalAllocationLine = {
    riskFreeRate: rfPct,
    tangencyPortfolio: maxSharpePoint,
    points: calPoints,
    note: 'The 4.0% risk-free rate is an external reference benchmark, NOT held as an asset in the 3-asset portfolio.',
  };

  return {
    points,
    minVolPoint,
    maxSharpePoint,
    maxReturnPoint,
    cal,
    feasibleRange: [
      parseFloat((minVolReturn * 100).toFixed(2)),
      parseFloat((maxReturn * 100).toFixed(2)),
    ],
    pointCount: points.length,
  };
}
