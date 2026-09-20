/**
 * BLACKBOX X — Phase 3.7
 * Covariance Engine & Synchronized Portfolio Returns
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * SYNCHRONIZATION POLICY:
 * Portfolio return and covariance modeling requires contemporaneous asset prices.
 * Returns are computed exclusively on the common trading calendar intersection
 * where valid observations exist across all assets simultaneously.
 * NO silent forward-fills with synthetic zero returns are permitted.
 */

import { Asset, PRICE_DATA, PricePoint } from '../data';
import {
  PortfolioWeights,
  PortfolioMetrics,
  RISK_FREE_RATE,
  TRADING_DAYS_PER_YEAR,
  validateWeights,
  DEFAULT_PORTFOLIO_WEIGHTS,
} from './portfolioTypes';
import { computePortfolioVaRReport } from './varMetrics';

export interface SynchronizedDataset {
  dates: string[];
  prices: Record<Asset, number[]>;
  returns: Record<Asset, number[]>;
  meanDailyReturns: Record<Asset, number>;
  annualizedExpectedReturns: Record<Asset, number>;
  dailyCovarianceMatrix: Record<Asset, Record<Asset, number>>;
  annualizedCovarianceMatrix: Record<Asset, Record<Asset, number>>;
  correlationMatrix: Record<Asset, Record<Asset, number>>;
  assetVolatilities: Record<Asset, number>; // Annualized %
  startDate: string;
  endDate: string;
  observationCount: number;
  assetsIncluded: Asset[];
  synchronizationPolicy: string;
}

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Extracts strictly synchronized contemporaneous asset data.
 * Merges dates present across all assets and computes genuine returns.
 * Days where any asset is missing are omitted from the intersection (no forward fill).
 */
export function getSynchronizedAssetData(
  startDate?: string,
  endDate?: string
): SynchronizedDataset {
  // 1. Build date map for each asset
  const assetPriceMap: Record<Asset, Map<string, number>> = {
    GOLD: new Map(),
    BTC: new Map(),
    NVDA: new Map(),
  };

  for (const asset of ASSETS) {
    const points = PRICE_DATA[asset] || [];
    for (const pt of points) {
      if ((!startDate || pt.date >= startDate) && (!endDate || pt.date <= endDate)) {
        assetPriceMap[asset].set(pt.date, pt.close);
      }
    }
  }

  // 2. Find common dates present in all assets simultaneously (intersection)
  const commonDates: string[] = [];
  const goldDates = Array.from(assetPriceMap.GOLD.keys()).sort();
  for (const date of goldDates) {
    if (assetPriceMap.BTC.has(date) && assetPriceMap.NVDA.has(date)) {
      commonDates.push(date);
    }
  }

  if (commonDates.length < 2) {
    throw new Error(
      `Insufficient synchronized observations for portfolio analysis. Found ${commonDates.length} common dates.`
    );
  }

  // 3. Extract aligned price arrays
  const prices: Record<Asset, number[]> = {
    GOLD: commonDates.map(d => assetPriceMap.GOLD.get(d)!),
    BTC: commonDates.map(d => assetPriceMap.BTC.get(d)!),
    NVDA: commonDates.map(d => assetPriceMap.NVDA.get(d)!),
  };

  // 4. Compute simple discrete returns on consecutive synchronized dates
  // Return at index t corresponds to return earned between commonDates[t] and commonDates[t+1]
  const returns: Record<Asset, number[]> = {
    GOLD: [],
    BTC: [],
    NVDA: [],
  };

  const returnDates: string[] = [];
  const T = commonDates.length - 1;

  for (let t = 0; t < T; t++) {
    returnDates.push(commonDates[t + 1]);
    for (const asset of ASSETS) {
      const pPrev = prices[asset][t];
      const pCurr = prices[asset][t + 1];
      const r = (pCurr - pPrev) / pPrev;
      returns[asset].push(r);
    }
  }

  // 5. Compute mean daily and annualized returns
  const meanDailyReturns: Record<Asset, number> = {
    GOLD: returns.GOLD.reduce((a, b) => a + b, 0) / T,
    BTC: returns.BTC.reduce((a, b) => a + b, 0) / T,
    NVDA: returns.NVDA.reduce((a, b) => a + b, 0) / T,
  };

  const annualizedExpectedReturns: Record<Asset, number> = {
    GOLD: meanDailyReturns.GOLD * TRADING_DAYS_PER_YEAR,
    BTC: meanDailyReturns.BTC * TRADING_DAYS_PER_YEAR,
    NVDA: meanDailyReturns.NVDA * TRADING_DAYS_PER_YEAR,
  };

  // 6. Compute sample covariance matrix
  // Cov(X, Y) = 1/(T - 1) * sum((X_t - mu_X)(Y_t - mu_Y))
  const dailyCovarianceMatrix: Record<Asset, Record<Asset, number>> = {
    GOLD: { GOLD: 0, BTC: 0, NVDA: 0 },
    BTC: { GOLD: 0, BTC: 0, NVDA: 0 },
    NVDA: { GOLD: 0, BTC: 0, NVDA: 0 },
  };

  const annualizedCovarianceMatrix: Record<Asset, Record<Asset, number>> = {
    GOLD: { GOLD: 0, BTC: 0, NVDA: 0 },
    BTC: { GOLD: 0, BTC: 0, NVDA: 0 },
    NVDA: { GOLD: 0, BTC: 0, NVDA: 0 },
  };

  const correlationMatrix: Record<Asset, Record<Asset, number>> = {
    GOLD: { GOLD: 1, BTC: 0, NVDA: 0 },
    BTC: { GOLD: 0, BTC: 1, NVDA: 0 },
    NVDA: { GOLD: 0, BTC: 0, NVDA: 1 },
  };

  const assetDailyStd: Record<Asset, number> = {
    GOLD: 0,
    BTC: 0,
    NVDA: 0,
  };

  for (const asset of ASSETS) {
    const r = returns[asset];
    const m = meanDailyReturns[asset];
    const variance = r.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (T - 1);
    assetDailyStd[asset] = Math.sqrt(variance);
  }

  for (let i = 0; i < ASSETS.length; i++) {
    const a1 = ASSETS[i];
    for (let j = 0; j < ASSETS.length; j++) {
      const a2 = ASSETS[j];
      const r1 = returns[a1];
      const r2 = returns[a2];
      const m1 = meanDailyReturns[a1];
      const m2 = meanDailyReturns[a2];

      let covDaily = 0;
      for (let t = 0; t < T; t++) {
        covDaily += (r1[t] - m1) * (r2[t] - m2);
      }
      covDaily /= (T - 1);

      dailyCovarianceMatrix[a1][a2] = covDaily;
      const covAnnual = covDaily * TRADING_DAYS_PER_YEAR;
      annualizedCovarianceMatrix[a1][a2] = covAnnual;

      const std1 = assetDailyStd[a1];
      const std2 = assetDailyStd[a2];
      if (std1 > 0 && std2 > 0) {
        correlationMatrix[a1][a2] = covDaily / (std1 * std2);
      } else {
        correlationMatrix[a1][a2] = i === j ? 1 : 0;
      }
    }
  }

  const assetVolatilities: Record<Asset, number> = {
    GOLD: assetDailyStd.GOLD * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100,
    BTC: assetDailyStd.BTC * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100,
    NVDA: assetDailyStd.NVDA * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100,
  };

  return {
    dates: returnDates,
    prices,
    returns,
    meanDailyReturns,
    annualizedExpectedReturns,
    dailyCovarianceMatrix,
    annualizedCovarianceMatrix,
    correlationMatrix,
    assetVolatilities,
    startDate: commonDates[0],
    endDate: commonDates[commonDates.length - 1],
    observationCount: T,
    assetsIncluded: ASSETS,
    synchronizationPolicy:
      'Offline simulated common daily calendar — contemporaneous daily observations across all assets without forward-fill',
  };
}

/**
 * Computes portfolio annualized variance:
 * sigma_p^2 = w^T * Sigma_annual * w
 */
export function computePortfolioVariance(
  weights: PortfolioWeights,
  annualizedCovMatrix: Record<Asset, Record<Asset, number>>
): number {
  let variance = 0;
  for (const a1 of ASSETS) {
    const w1 = weights[a1] || 0;
    for (const a2 of ASSETS) {
      const w2 = weights[a2] || 0;
      variance += w1 * w2 * (annualizedCovMatrix[a1][a2] || 0);
    }
  }
  return Math.max(0, variance);
}

/**
 * Computes portfolio annualized volatility (in decimal form):
 * sigma_p = sqrt(w^T * Sigma_annual * w)
 */
export function computePortfolioVolatility(
  weights: PortfolioWeights,
  annualizedCovMatrix: Record<Asset, Record<Asset, number>>
): number {
  return Math.sqrt(computePortfolioVariance(weights, annualizedCovMatrix));
}

/**
 * Computes daily portfolio returns:
 * R_(p,t) = sum(w_i * r_(i,t))
 */
export function computeDailyPortfolioReturns(
  weights: PortfolioWeights,
  returns: Record<Asset, number[]>
): number[] {
  const T = returns.GOLD.length;
  const portfolioReturns: number[] = new Array(T);
  const wGold = weights.GOLD || 0;
  const wBtc = weights.BTC || 0;
  const wNvda = weights.NVDA || 0;

  for (let t = 0; t < T; t++) {
    portfolioReturns[t] =
      wGold * returns.GOLD[t] +
      wBtc * returns.BTC[t] +
      wNvda * returns.NVDA[t];
  }
  return portfolioReturns;
}

/**
 * Computes comprehensive portfolio metrics for a given allocation vector.
 */
export function computePortfolioMetrics(
  weights: Partial<PortfolioWeights>,
  startDate?: string,
  endDate?: string
): PortfolioMetrics {
  const validation = validateWeights(weights);
  const w = validation.normalizedWeights;

  const dataset = getSynchronizedAssetData(startDate, endDate);
  const dailyReturns = computeDailyPortfolioReturns(w, dataset.returns);
  const T = dailyReturns.length;

  // 1. Compound Equity Path
  let currentEquity = 1.0;
  let peakEquity = 1.0;
  let maxDD = 0;

  for (let t = 0; t < T; t++) {
    currentEquity *= (1 + dailyReturns[t]);
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const dd = (currentEquity - peakEquity) / peakEquity;
    if (dd < maxDD) {
      maxDD = dd;
    }
  }

  const totalReturn = (currentEquity - 1.0) * 100;
  // CAGR = (E_T / E_0)^(252 / T) - 1
  const cagr =
    currentEquity > 0
      ? (Math.pow(currentEquity, TRADING_DAYS_PER_YEAR / T) - 1) * 100
      : -100;

  // 2. Annualized Volatility from Covariance Matrix
  const volDecimal = computePortfolioVolatility(w, dataset.annualizedCovarianceMatrix);
  const annualizedVolatility = volDecimal * 100;

  // 3. Sharpe Ratio
  // Daily excess returns = r_p,t - (Rf / 252)
  const dailyRf = RISK_FREE_RATE / TRADING_DAYS_PER_YEAR;
  const excessReturns = dailyReturns.map(r => r - dailyRf);
  const meanExcess = excessReturns.reduce((a, b) => a + b, 0) / T;
  const varExcess =
    excessReturns.reduce((sum, v) => sum + Math.pow(v - meanExcess, 2), 0) / (T - 1);
  const stdExcess = Math.sqrt(varExcess);
  const sharpeRatio =
    stdExcess > 1e-5 && annualizedVolatility > 1e-4
      ? parseFloat(((meanExcess / stdExcess) * Math.sqrt(TRADING_DAYS_PER_YEAR)).toFixed(2))
      : 0;

  // 4. Max Drawdown % (standard negative percentage, matching metrics.ts)
  const maxDrawdownPct = parseFloat((maxDD * 100).toFixed(2));

  // 5. Calmar Ratio
  const calmarRatio =
    Math.abs(maxDrawdownPct) > 0.001 && Number.isFinite(cagr)
      ? parseFloat((cagr / Math.abs(maxDrawdownPct)).toFixed(2))
      : 0;

  // 6. VaR / CVaR (Historical Non-Parametric, positive loss magnitude)
  const varReport = computePortfolioVaRReport(dailyReturns);

  return {
    weights: w,
    totalReturn: Number.isFinite(totalReturn) ? parseFloat(totalReturn.toFixed(2)) : 0,
    cagr: Number.isFinite(cagr) ? parseFloat(cagr.toFixed(2)) : 0,
    annualizedVolatility: Number.isFinite(annualizedVolatility) ? parseFloat(annualizedVolatility.toFixed(2)) : 0,
    sharpeRatio: Number.isFinite(sharpeRatio) ? sharpeRatio : 0,
    maxDrawdown: Number.isFinite(maxDrawdownPct) ? maxDrawdownPct : 0,
    calmarRatio: Number.isFinite(calmarRatio) ? calmarRatio : 0,
    var95: varReport.var95,
    var99: varReport.var99,
    cvar95: varReport.cvar95,
    cvar99: varReport.cvar99,
    dailyReturns,
    dates: dataset.dates,
    startDate: dataset.startDate,
    endDate: dataset.endDate,
    observationCount: dataset.observationCount,
    assetsIncluded: dataset.assetsIncluded,
    synchronizationPolicy: dataset.synchronizationPolicy,
    isSimulatedData: true,
    dataSourceLabel: 'OFFLINE_DEMO',
  };
}
