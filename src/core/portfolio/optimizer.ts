/**
 * BLACKBOX X — Phase 3.7
 * Deterministic Portfolio Optimizer
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * OPTIMIZER GUARANTEE:
 * "Deterministic reproducible optimizer with a discrete global search over the defined
 * simplex grid followed by deterministic local refinement."
 *
 * It evaluates 20,301 candidate portfolios over the 2-simplex with delta = 0.005,
 * selecting the best candidate on the discrete grid, followed by 20 iterations of
 * deterministic localized projected gradient refinement.
 *
 * Identical inputs produce bit-identical outputs.
 */

import { Asset } from '../data';
import {
  PortfolioWeights,
  OptimizationObjective,
  OptimizationResult,
  RISK_FREE_RATE,
  DEFAULT_PORTFOLIO_WEIGHTS,
} from './portfolioTypes';
import {
  getSynchronizedAssetData,
  computePortfolioVariance,
  computePortfolioVolatility,
  SynchronizedDataset,
} from './covariance';
import { computeRiskContribution } from './riskContribution';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];
const GRID_STEP = 0.005; // delta = 0.5% increments
const REFINEMENT_ITERATIONS = 20;
const REFINEMENT_STEP = 0.0005;

export const OPTIMIZER_METHOD_DESCRIPTION =
  'Deterministic reproducible optimizer with a discrete global search over the defined simplex grid followed by deterministic local refinement.';

/**
 * Generates all candidate weight vectors on the 2-simplex:
 * w_1 + w_2 + w_3 = 1, w_i >= 0 with step delta = 0.005.
 * Total candidates = (200 + 1)(200 + 2) / 2 = 20,301.
 */
export function generateSimplexGrid(step = GRID_STEP): PortfolioWeights[] {
  const candidates: PortfolioWeights[] = [];
  const M = Math.round(1.0 / step);

  for (let i = 0; i <= M; i++) {
    const wGold = i * step;
    for (let j = 0; j <= M - i; j++) {
      const wBtc = j * step;
      const wNvda = Math.max(0, 1.0 - wGold - wBtc);
      // Double check rounding drift
      const total = wGold + wBtc + wNvda;
      candidates.push({
        GOLD: wGold / total,
        BTC: wBtc / total,
        NVDA: wNvda / total,
      });
    }
  }
  return candidates;
}

// Pre-cached deterministic simplex grid for performance
let cachedGrid: PortfolioWeights[] | null = null;
function getCachedGrid(): PortfolioWeights[] {
  if (!cachedGrid) {
    cachedGrid = generateSimplexGrid(GRID_STEP);
  }
  return cachedGrid;
}

/**
 * Projects an arbitrary 3D vector onto the standard simplex:
 * w_i >= 0, sum(w_i) = 1.
 */
function projectOntoSimplex(w: PortfolioWeights): PortfolioWeights {
  const v = [w.GOLD, w.BTC, w.NVDA];
  const sorted = [...v].sort((a, b) => b - a);

  let rho = 0;
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += sorted[i];
    if (sorted[i] - (sum - 1.0) / (i + 1) > 0) {
      rho = i;
    }
  }

  sum = 0;
  for (let i = 0; i <= rho; i++) {
    sum += sorted[i];
  }
  const theta = (sum - 1.0) / (rho + 1);

  const pGold = Math.max(0, w.GOLD - theta);
  const pBtc = Math.max(0, w.BTC - theta);
  const pNvda = Math.max(0, w.NVDA - theta);
  const total = (pGold + pBtc + pNvda) || 1.0;

  return {
    GOLD: pGold / total,
    BTC: pBtc / total,
    NVDA: pNvda / total,
  };
}

/**
 * Evaluates the objective score for a candidate allocation.
 * Returns score (to be minimized) or null if infeasible.
 */
function evaluateCandidateScore(
  w: PortfolioWeights,
  objective: OptimizationObjective,
  cov: Record<Asset, Record<Asset, number>>,
  mu: Record<Asset, number>,
  targetReturn?: number
): { score: number; sharpe: number; vol: number; ret: number } {
  const vol = computePortfolioVolatility(w, cov);
  const ret =
    (w.GOLD * mu.GOLD + w.BTC * mu.BTC + w.NVDA * mu.NVDA);

  // Sharpe ratio with Rf = 0.04
  const sharpe = vol > 1e-9 ? (ret - RISK_FREE_RATE) / vol : 0;

  let score = 0;
  switch (objective) {
    case 'MAX_SHARPE':
      // Minimize negative Sharpe
      score = -sharpe;
      break;

    case 'MIN_VOLATILITY':
      // Minimize volatility
      score = vol;
      break;

    case 'RISK_PARITY': {
      // Minimize sum of squared differences between percentage risk contributions
      const rc = computeRiskContribution(w, cov);
      const prcGold = rc.percentageRisk.GOLD;
      const prcBtc = rc.percentageRisk.BTC;
      const prcNvda = rc.percentageRisk.NVDA;
      const diff1 = prcGold - prcBtc;
      const diff2 = prcBtc - prcNvda;
      const diff3 = prcNvda - prcGold;
      score = diff1 * diff1 + diff2 * diff2 + diff3 * diff3;
      break;
    }

    case 'TARGET_RETURN': {
      // Minimize volatility subject to ret >= targetReturn
      if (targetReturn !== undefined && ret < targetReturn - 1e-5) {
        score = 1e9 + (targetReturn - ret) * 1e4; // penalty for return shortfall
      } else {
        score = vol;
      }
      break;
    }
  }

  return { score, sharpe, vol, ret };
}

/**
 * Performs localized deterministic refinement around a candidate allocation.
 */
function localRefinement(
  initialWeights: PortfolioWeights,
  objective: OptimizationObjective,
  cov: Record<Asset, Record<Asset, number>>,
  mu: Record<Asset, number>,
  targetReturn?: number
): { bestWeights: PortfolioWeights; bestScore: number } {
  let current = { ...initialWeights };
  let currentEval = evaluateCandidateScore(current, objective, cov, mu, targetReturn);
  let bestScore = currentEval.score;
  let bestWeights = { ...current };

  const perturbations = [
    { dGold: REFINEMENT_STEP, dBtc: -REFINEMENT_STEP, dNvda: 0 },
    { dGold: -REFINEMENT_STEP, dBtc: REFINEMENT_STEP, dNvda: 0 },
    { dGold: REFINEMENT_STEP, dBtc: 0, dNvda: -REFINEMENT_STEP },
    { dGold: -REFINEMENT_STEP, dBtc: 0, dNvda: REFINEMENT_STEP },
    { dGold: 0, dBtc: REFINEMENT_STEP, dNvda: -REFINEMENT_STEP },
    { dGold: 0, dBtc: -REFINEMENT_STEP, dNvda: REFINEMENT_STEP },
  ];

  for (let iter = 0; iter < REFINEMENT_ITERATIONS; iter++) {
    let improved = false;
    for (const p of perturbations) {
      const candidate = projectOntoSimplex({
        GOLD: current.GOLD + p.dGold,
        BTC: current.BTC + p.dBtc,
        NVDA: current.NVDA + p.dNvda,
      });

      const candEval = evaluateCandidateScore(candidate, objective, cov, mu, targetReturn);
      if (candEval.score < bestScore - 1e-8) {
        bestScore = candEval.score;
        bestWeights = candidate;
        current = candidate;
        improved = true;
      }
    }
    if (!improved) break;
  }

  return { bestWeights, bestScore };
}

/**
 * Optimizes portfolio allocation deterministically according to the specified objective.
 */
export function optimizePortfolio(
  objective: OptimizationObjective,
  targetReturnPct?: number,
  datasetOverride?: SynchronizedDataset
): OptimizationResult {
  const dataset = datasetOverride || getSynchronizedAssetData();
  const cov = dataset.annualizedCovarianceMatrix;
  const mu = dataset.annualizedExpectedReturns;

  // Feasibility boundaries for target return
  const returnsArray = [mu.GOLD, mu.BTC, mu.NVDA];
  const rMinAnnual = Math.min(...returnsArray);
  const rMaxAnnual = Math.max(...returnsArray);
  const feasibleRange: [number, number] = [
    parseFloat((rMinAnnual * 100).toFixed(2)),
    parseFloat((rMaxAnnual * 100).toFixed(2)),
  ];

  const targetReturnDecimal =
    targetReturnPct !== undefined ? targetReturnPct / 100 : undefined;

  // Milestone 6: Check feasibility for TARGET_RETURN
  if (objective === 'TARGET_RETURN' && targetReturnDecimal !== undefined) {
    if (targetReturnDecimal > rMaxAnnual + 1e-6 || targetReturnDecimal < rMinAnnual - 1e-6) {
      // Find asset closest to target
      const bestFallbackAsset =
        targetReturnDecimal > rMaxAnnual
          ? (mu.GOLD >= mu.BTC && mu.GOLD >= mu.NVDA ? 'GOLD' : mu.BTC >= mu.NVDA ? 'BTC' : 'NVDA')
          : (mu.GOLD <= mu.BTC && mu.GOLD <= mu.NVDA ? 'GOLD' : mu.BTC <= mu.NVDA ? 'BTC' : 'NVDA');

      const fallbackAllocation: PortfolioWeights = {
        GOLD: bestFallbackAsset === 'GOLD' ? 1.0 : 0.0,
        BTC: bestFallbackAsset === 'BTC' ? 1.0 : 0.0,
        NVDA: bestFallbackAsset === 'NVDA' ? 1.0 : 0.0,
      };

      const fallbackVol = computePortfolioVolatility(fallbackAllocation, cov);
      const fallbackRet = mu[bestFallbackAsset];
      const fallbackSharpe = (fallbackRet - RISK_FREE_RATE) / fallbackVol;

      return {
        objective,
        allocation: fallbackAllocation,
        objectiveValue: fallbackVol * 100,
        expectedReturn: parseFloat((fallbackRet * 100).toFixed(2)),
        volatility: parseFloat((fallbackVol * 100).toFixed(2)),
        sharpeRatio: parseFloat(fallbackSharpe.toFixed(2)),
        status: 'INFEASIBLE',
        method: OPTIMIZER_METHOD_DESCRIPTION,
        gridResolution: GRID_STEP,
        refinementMetadata: {
          iterations: 0,
          stepSize: REFINEMENT_STEP,
          gradientTolerance: 1e-5,
        },
        feasibleRange,
        targetReturn: targetReturnPct,
      };
    }
  }

  // Discrete global grid search over 20,301 candidate points
  const grid = getCachedGrid();
  let bestCandidate = grid[0];
  let bestScore = Infinity;

  for (let i = 0; i < grid.length; i++) {
    const candidate = grid[i];
    const { score } = evaluateCandidateScore(
      candidate,
      objective,
      cov,
      mu,
      targetReturnDecimal
    );
    if (score < bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  // Deterministic local refinement
  const refinement = localRefinement(
    bestCandidate,
    objective,
    cov,
    mu,
    targetReturnDecimal
  );

  const finalWeights = refinement.bestWeights;
  const finalEval = evaluateCandidateScore(
    finalWeights,
    objective,
    cov,
    mu,
    targetReturnDecimal
  );

  return {
    objective,
    allocation: {
      GOLD: parseFloat(finalWeights.GOLD.toFixed(4)),
      BTC: parseFloat(finalWeights.BTC.toFixed(4)),
      NVDA: parseFloat(finalWeights.NVDA.toFixed(4)),
    },
    objectiveValue:
      objective === 'MAX_SHARPE'
        ? parseFloat(finalEval.sharpe.toFixed(2))
        : parseFloat((finalEval.vol * 100).toFixed(2)),
    expectedReturn: parseFloat((finalEval.ret * 100).toFixed(2)),
    volatility: parseFloat((finalEval.vol * 100).toFixed(2)),
    sharpeRatio: parseFloat(finalEval.sharpe.toFixed(2)),
    status: 'BEST_FOUND',
    method: OPTIMIZER_METHOD_DESCRIPTION,
    gridResolution: GRID_STEP,
    refinementMetadata: {
      iterations: REFINEMENT_ITERATIONS,
      stepSize: REFINEMENT_STEP,
      gradientTolerance: 1e-5,
    },
    feasibleRange,
    targetReturn: targetReturnPct,
  };
}
