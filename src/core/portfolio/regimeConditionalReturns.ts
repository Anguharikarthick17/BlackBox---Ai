/**
 * BLACKBOX X — Phase 3.9
 * Regime-Conditioned Return Distributions & Joint Vectors
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Implements:
 * 1. Conditional data partitioning into D_r for each regime
 * 2. Indivisible multi-asset joint return vector preservation (zero asset decoupling)
 * 3. Conditional moments (mean, volatility, daily covariance, annualized covariance)
 * 4. Reactive Cholesky decomposition with Tikhonov regularization tracking
 * 5. Conditional empirical percentiles (P05, P25, P50, P75, P95)
 * 6. Conditional Euler risk decomposition (MRC, CRC, PRC)
 */

import { Asset, PortfolioWeights, DEFAULT_PORTFOLIO_WEIGHTS, validateWeights } from './portfolioTypes';
import { RegimeType } from '../regimes';
import {
  ALL_REGIMES,
  MIN_REGIME_OBSERVATIONS,
  AlignedRegimeObservation,
  RegimeReturnPool,
} from './regimeMonteCarloTypes';
import { computeCholesky } from './cholesky';
import { computeRiskContribution } from './riskContribution';
import { calculatePercentileSummary } from './monteCarloEngine';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Partitions the synchronized observations by regime and estimates conditional empirical moments,
 * joint vector pools, Cholesky factors, and Euler risk contribution.
 */
export function buildRegimeReturnPools(
  observations: AlignedRegimeObservation[],
  weights: Partial<PortfolioWeights> = DEFAULT_PORTFOLIO_WEIGHTS
): Record<RegimeType, RegimeReturnPool> {
  const validation = validateWeights(weights);
  const w = validation.normalizedWeights;

  // 1. Group observations by regime
  const partitioned: Record<RegimeType, { dates: string[]; vectors: number[][] }> = {
    BULL: { dates: [], vectors: [] },
    BEAR: { dates: [], vectors: [] },
    HIGH_VOL: { dates: [], vectors: [] },
    LOW_VOL: { dates: [], vectors: [] },
  };

  for (const obs of observations) {
    partitioned[obs.regime].dates.push(obs.date);
    // Indivisible synchronized vector: [GOLD, BTC, NVDA]
    partitioned[obs.regime].vectors.push([
      obs.assetReturns.GOLD,
      obs.assetReturns.BTC,
      obs.assetReturns.NVDA,
    ]);
  }

  const pools: Record<RegimeType, RegimeReturnPool> = {} as any;

  for (const reg of ALL_REGIMES) {
    const dates = partitioned[reg].dates;
    const vectors = partitioned[reg].vectors;
    const n = vectors.length;
    const isSparse = n < MIN_REGIME_OBSERVATIONS;

    // Handle zero observation edge case
    if (n === 0) {
      pools[reg] = {
        regime: reg,
        observationCount: 0,
        isSparse: true,
        vectors: [],
        dates: [],
        mean: { GOLD: 0, BTC: 0, NVDA: 0 },
        volatility: { GOLD: 0, BTC: 0, NVDA: 0 },
        covariance: {
          GOLD: { GOLD: 0, BTC: 0, NVDA: 0 },
          BTC: { GOLD: 0, BTC: 0, NVDA: 0 },
          NVDA: { GOLD: 0, BTC: 0, NVDA: 0 },
        },
        dailyCovarianceMatrix: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        choleskyL: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
        regularizationApplied: false,
        minReturns: { GOLD: 0, BTC: 0, NVDA: 0 },
        maxReturns: { GOLD: 0, BTC: 0, NVDA: 0 },
        percentiles: {
          GOLD: { p05: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
          BTC: { p05: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
          NVDA: { p05: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
        },
      };
      continue;
    }

    // Asset return series
    const goldReturns = vectors.map(v => v[0]);
    const btcReturns = vectors.map(v => v[1]);
    const nvdaReturns = vectors.map(v => v[2]);

    const assetReturnsMap: Record<Asset, number[]> = {
      GOLD: goldReturns,
      BTC: btcReturns,
      NVDA: nvdaReturns,
    };

    // Means
    const meanGold = goldReturns.reduce((a, b) => a + b, 0) / n;
    const meanBtc = btcReturns.reduce((a, b) => a + b, 0) / n;
    const meanNvda = nvdaReturns.reduce((a, b) => a + b, 0) / n;

    const mean: Record<Asset, number> = {
      GOLD: meanGold,
      BTC: meanBtc,
      NVDA: meanNvda,
    };

    // Daily Covariance Matrix (3x3 array and Record)
    const dailyCovMatrix: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const annualizedCov: Record<Asset, Record<Asset, number>> = {
      GOLD: { GOLD: 0, BTC: 0, NVDA: 0 },
      BTC: { GOLD: 0, BTC: 0, NVDA: 0 },
      NVDA: { GOLD: 0, BTC: 0, NVDA: 0 },
    };

    const meansArray = [meanGold, meanBtc, meanNvda];

    if (n > 1) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let sum = 0;
          for (let k = 0; k < n; k++) {
            sum += (vectors[k][i] - meansArray[i]) * (vectors[k][j] - meansArray[j]);
          }
          const dailyCov = sum / (n - 1);
          dailyCovMatrix[i][j] = dailyCov;
          annualizedCov[ASSETS[i]][ASSETS[j]] = dailyCov * 252;
        }
      }
    }

    // Volatilities (annualized %)
    const volatility: Record<Asset, number> = {
      GOLD: Math.sqrt(Math.max(0, dailyCovMatrix[0][0])) * Math.sqrt(252) * 100,
      BTC: Math.sqrt(Math.max(0, dailyCovMatrix[1][1])) * Math.sqrt(252) * 100,
      NVDA: Math.sqrt(Math.max(0, dailyCovMatrix[2][2])) * Math.sqrt(252) * 100,
    };

    // Cholesky Factorization with reactive Tikhonov stabilization
    let choleskyL: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    let regularizationApplied = false;
    let regularizationMagnitude: number | undefined = undefined;

    if (n > 1) {
      try {
        const cholRes = computeCholesky(dailyCovMatrix);
        choleskyL = cholRes.L;
        regularizationApplied = cholRes.stabilizationApplied;
        regularizationMagnitude = cholRes.stabilizationMagnitude;
      } catch (err) {
        regularizationApplied = true;
      }
    }

    // Min / Max Returns and Percentiles
    const minReturns: Record<Asset, number> = {
      GOLD: Math.min(...goldReturns),
      BTC: Math.min(...btcReturns),
      NVDA: Math.min(...nvdaReturns),
    };

    const maxReturns: Record<Asset, number> = {
      GOLD: Math.max(...goldReturns),
      BTC: Math.max(...btcReturns),
      NVDA: Math.max(...nvdaReturns),
    };

    const percentiles: Record<Asset, any> = {
      GOLD: calculatePercentileSummary(goldReturns),
      BTC: calculatePercentileSummary(btcReturns),
      NVDA: calculatePercentileSummary(nvdaReturns),
    };

    // Euler Risk Contribution conditioned on regime
    let riskContribution: RegimeReturnPool['riskContribution'] = undefined;
    if (n > 1) {
      try {
        const rc = computeRiskContribution(w, annualizedCov);
        riskContribution = {
          marginalRisk: rc.marginalRisk,
          componentRisk: rc.componentRisk,
          percentageRisk: rc.percentageRisk,
          portfolioVolatility: rc.portfolioVolatility,
        };
      } catch (err) {
        // Leave undefined if non-computable
      }
    }

    pools[reg] = {
      regime: reg,
      observationCount: n,
      isSparse,
      vectors,
      dates,
      mean,
      volatility,
      covariance: annualizedCov,
      dailyCovarianceMatrix: dailyCovMatrix,
      choleskyL,
      regularizationApplied,
      regularizationMagnitude,
      minReturns,
      maxReturns,
      percentiles,
      riskContribution,
    };
  }

  return pools;
}
