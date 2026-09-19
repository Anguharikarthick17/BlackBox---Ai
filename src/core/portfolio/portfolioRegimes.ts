/**
 * BLACKBOX X — Phase 3.7
 * Multi-Asset Portfolio Market Regime Integration
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * REUSES EXISTING REGIME DETECTION (src/core/regimes.ts):
 * Evaluates portfolio performance across the 4 core macro regimes:
 * Bull, Bear, High Volatility, Low Volatility.
 */

import { Asset, PricePoint } from '../data';
import {
  PortfolioWeights,
  PortfolioRegimePerformance,
  validateWeights,
  DEFAULT_PORTFOLIO_WEIGHTS,
} from './portfolioTypes';
import { detectRegimes, RegimeType } from '../regimes';
import {
  getSynchronizedAssetData,
  computeDailyPortfolioReturns,
} from './covariance';
import { computeRiskContribution } from './riskContribution';

const REGIME_NAMES: Record<RegimeType, 'Bull' | 'Bear' | 'High Volatility' | 'Low Volatility'> = {
  BULL: 'Bull',
  BEAR: 'Bear',
  HIGH_VOL: 'High Volatility',
  LOW_VOL: 'Low Volatility',
};

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Evaluates portfolio performance and risk contribution partitioned by market regimes.
 */
export function analyzePortfolioRegimes(
  weights: Partial<PortfolioWeights> = DEFAULT_PORTFOLIO_WEIGHTS
): PortfolioRegimePerformance[] {
  const validation = validateWeights(weights);
  const w = validation.normalizedWeights;

  const dataset = getSynchronizedAssetData();
  const dates = dataset.dates;
  const portfolioReturns = computeDailyPortfolioReturns(w, dataset.returns);

  // Construct synthetic daily equity price points to feed into detectRegimes
  let equity = 100.0;
  const equityPricePoints: PricePoint[] = [
    {
      date: dataset.startDate,
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1000000,
    },
  ];

  for (let t = 0; t < dates.length; t++) {
    equity *= (1 + portfolioReturns[t]);
    equityPricePoints.push({
      date: dates[t],
      open: equity,
      high: equity,
      low: equity,
      close: equity,
      volume: 1000000,
    });
  }

  // Detect regime points (window = 60 days)
  const regimePoints = detectRegimes(equityPricePoints, 60);

  // Map dates to regime
  const dateRegimeMap = new Map<string, RegimeType>();
  for (const rp of regimePoints) {
    dateRegimeMap.set(rp.date, rp.regime);
  }

  // Group portfolio returns and asset returns by regime
  const regimeReturns: Record<RegimeType, number[]> = {
    BULL: [],
    BEAR: [],
    HIGH_VOL: [],
    LOW_VOL: [],
  };

  const regimeAssetReturns: Record<RegimeType, Record<Asset, number[]>> = {
    BULL: { GOLD: [], BTC: [], NVDA: [] },
    BEAR: { GOLD: [], BTC: [], NVDA: [] },
    HIGH_VOL: { GOLD: [], BTC: [], NVDA: [] },
    LOW_VOL: { GOLD: [], BTC: [], NVDA: [] },
  };

  for (let t = 0; t < dates.length; t++) {
    const d = dates[t];
    const r = dateRegimeMap.get(d) || 'BULL'; // default fallback for initial window
    regimeReturns[r].push(portfolioReturns[t]);

    for (const a of ASSETS) {
      regimeAssetReturns[r][a].push(dataset.returns[a][t]);
    }
  }

  const allRegimes: RegimeType[] = ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'];
  const results: PortfolioRegimePerformance[] = [];

  for (const reg of allRegimes) {
    const rets = regimeReturns[reg];
    const n = rets.length;

    if (n < 5) {
      results.push({
        regime: REGIME_NAMES[reg],
        periodCount: 1,
        totalDays: n,
        totalReturn: 0,
        cagr: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        riskContribution: { GOLD: 33.3, BTC: 33.3, NVDA: 33.3 },
      });
      continue;
    }

    // Cumulative Return
    let curEq = 1.0;
    let peakEq = 1.0;
    let maxDD = 0;

    for (const r of rets) {
      curEq *= (1 + r);
      if (curEq > peakEq) peakEq = curEq;
      const dd = (curEq - peakEq) / peakEq;
      if (dd < maxDD) maxDD = dd;
    }

    const totalReturn = (curEq - 1.0) * 100;
    const cagr = (Math.pow(curEq, 252 / n) - 1) * 100;

    // Volatility
    const meanR = rets.reduce((a, b) => a + b, 0) / n;
    const variance = rets.reduce((s, val) => s + Math.pow(val - meanR, 2), 0) / (n - 1);
    const vol = Math.sqrt(variance) * Math.sqrt(252) * 100;

    // Sharpe
    const excess = rets.map(r => r - 0.04 / 252);
    const meanEx = excess.reduce((a, b) => a + b, 0) / n;
    const stdEx = Math.sqrt(
      excess.reduce((s, val) => s + Math.pow(val - meanEx, 2), 0) / (n - 1)
    );
    const sharpe = stdEx > 0 ? parseFloat(((meanEx / stdEx) * Math.sqrt(252)).toFixed(2)) : 0;

    // Regime Covariance & Risk Contribution
    const regimeCov: Record<Asset, Record<Asset, number>> = {
      GOLD: { GOLD: 0, BTC: 0, NVDA: 0 },
      BTC: { GOLD: 0, BTC: 0, NVDA: 0 },
      NVDA: { GOLD: 0, BTC: 0, NVDA: 0 },
    };

    const assetMeans: Record<Asset, number> = {
      GOLD: regimeAssetReturns[reg].GOLD.reduce((a, b) => a + b, 0) / n,
      BTC: regimeAssetReturns[reg].BTC.reduce((a, b) => a + b, 0) / n,
      NVDA: regimeAssetReturns[reg].NVDA.reduce((a, b) => a + b, 0) / n,
    };

    for (const a1 of ASSETS) {
      for (const a2 of ASSETS) {
        let covSum = 0;
        for (let i = 0; i < n; i++) {
          covSum +=
            (regimeAssetReturns[reg][a1][i] - assetMeans[a1]) *
            (regimeAssetReturns[reg][a2][i] - assetMeans[a2]);
        }
        regimeCov[a1][a2] = (covSum / (n - 1)) * 252;
      }
    }

    const rc = computeRiskContribution(w, regimeCov);
    const riskContribution: Record<Asset, number> = {
      GOLD: parseFloat((rc.percentageRisk.GOLD * 100).toFixed(1)),
      BTC: parseFloat((rc.percentageRisk.BTC * 100).toFixed(1)),
      NVDA: parseFloat((rc.percentageRisk.NVDA * 100).toFixed(1)),
    };

    results.push({
      regime: REGIME_NAMES[reg],
      periodCount: 1,
      totalDays: n,
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      cagr: parseFloat(cagr.toFixed(2)),
      volatility: parseFloat(vol.toFixed(2)),
      sharpeRatio: sharpe,
      maxDrawdown: parseFloat((maxDD * 100).toFixed(2)),
      riskContribution,
    });
  }

  return results;
}
