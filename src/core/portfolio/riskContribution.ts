/**
 * BLACKBOX X — Phase 3.7
 * Euler Risk Contribution Engine
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * MATHEMATICAL DEFINITION:
 * By Euler's homogeneous function theorem:
 * sigma_p = sum(w_i * d(sigma_p)/d(w_i))
 *
 * Marginal Risk Contribution (MRC_i):
 * MRC_i = (Sigma * w)_i / sigma_p
 *
 * Component Risk Contribution (CRC_i):
 * CRC_i = w_i * MRC_i = w_i * (Sigma * w)_i / sigma_p
 *
 * Percentage Risk Contribution (PRC_i):
 * PRC_i = CRC_i / sigma_p = w_i * (Sigma * w)_i / (w^T * Sigma * w)
 *
 * EULER SUM IDENTITIES:
 * sum(CRC_i) = sigma_p
 * sum(PRC_i) = 1.0 (100%)
 */

import { Asset } from '../data';
import {
  PortfolioWeights,
  RiskContribution,
  validateWeights,
} from './portfolioTypes';
import {
  computePortfolioVariance,
  computePortfolioVolatility,
  getSynchronizedAssetData,
} from './covariance';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];
const EULER_TOLERANCE = 1e-4;

/**
 * Computes Marginal, Component, and Percentage Risk Contributions
 * using Euler's decomposition theorem.
 */
export function computeRiskContribution(
  weights: Partial<PortfolioWeights>,
  annualizedCovMatrix?: Record<Asset, Record<Asset, number>>
): RiskContribution {
  const validation = validateWeights(weights);
  const w = validation.normalizedWeights;

  const cov = annualizedCovMatrix || getSynchronizedAssetData().annualizedCovarianceMatrix;
  const variance = computePortfolioVariance(w, cov);
  const volatility = Math.sqrt(variance);

  if (volatility < 1e-9) {
    return {
      marginalRisk: { GOLD: 0, BTC: 0, NVDA: 0 },
      componentRisk: { GOLD: 0, BTC: 0, NVDA: 0 },
      percentageRisk: { GOLD: 1 / 3, BTC: 1 / 3, NVDA: 1 / 3 },
      eulerSumCrc: 0,
      eulerSumPrc: 1.0,
      portfolioVolatility: 0,
      isEulerSumVerified: true,
      tolerance: EULER_TOLERANCE,
    };
  }

  // 1. Compute matrix-vector product (Sigma * w)
  const sigmaW: Record<Asset, number> = {
    GOLD: 0,
    BTC: 0,
    NVDA: 0,
  };

  for (const a1 of ASSETS) {
    let sum = 0;
    for (const a2 of ASSETS) {
      sum += (cov[a1][a2] || 0) * (w[a2] || 0);
    }
    sigmaW[a1] = sum;
  }

  // 2. Marginal Risk Contribution: MRC_i = (Sigma * w)_i / sigma_p
  const marginalRisk: Record<Asset, number> = {
    GOLD: sigmaW.GOLD / volatility,
    BTC: sigmaW.BTC / volatility,
    NVDA: sigmaW.NVDA / volatility,
  };

  // 3. Component Risk Contribution: CRC_i = w_i * MRC_i
  const componentRisk: Record<Asset, number> = {
    GOLD: (w.GOLD || 0) * marginalRisk.GOLD,
    BTC: (w.BTC || 0) * marginalRisk.BTC,
    NVDA: (w.NVDA || 0) * marginalRisk.NVDA,
  };

  // 4. Percentage Risk Contribution: PRC_i = CRC_i / sigma_p
  const percentageRisk: Record<Asset, number> = {
    GOLD: componentRisk.GOLD / volatility,
    BTC: componentRisk.BTC / volatility,
    NVDA: componentRisk.NVDA / volatility,
  };

  // 5. Numerical Euler verification
  const eulerSumCrc = componentRisk.GOLD + componentRisk.BTC + componentRisk.NVDA;
  const eulerSumPrc = percentageRisk.GOLD + percentageRisk.BTC + percentageRisk.NVDA;

  const crcDiscrepancy = Math.abs(eulerSumCrc - volatility);
  const prcDiscrepancy = Math.abs(eulerSumPrc - 1.0);
  const isEulerSumVerified = crcDiscrepancy < EULER_TOLERANCE && prcDiscrepancy < EULER_TOLERANCE;

  return {
    marginalRisk,
    componentRisk,
    percentageRisk,
    eulerSumCrc: parseFloat(eulerSumCrc.toFixed(6)),
    eulerSumPrc: parseFloat(eulerSumPrc.toFixed(6)),
    portfolioVolatility: parseFloat(volatility.toFixed(6)),
    isEulerSumVerified,
    tolerance: EULER_TOLERANCE,
  };
}
