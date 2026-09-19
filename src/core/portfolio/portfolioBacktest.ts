/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Backtesting & Rebalancing Engine
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * EXECUTION PHILOSOPHY:
 * 1. Zero look-ahead bias: weights determined at close of day t-1 are applied to day t returns.
 * 2. Rebalancing modes: DAILY, MONTHLY, QUARTERLY, THRESHOLD (+-5%), BUY_AND_HOLD.
 * 3. Friction: 10 bps default transaction fee (0.0010) on rebalanced turnover.
 */

import { Asset } from '../data';
import {
  PortfolioWeights,
  RebalanceFrequency,
  PortfolioBacktestResult,
  DEFAULT_TRANSACTION_FEE,
  TRADING_DAYS_PER_YEAR,
  RISK_FREE_RATE,
  validateWeights,
  DEFAULT_PORTFOLIO_WEIGHTS,
} from './portfolioTypes';
import {
  getSynchronizedAssetData,
  SynchronizedDataset,
} from './covariance';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];
const THRESHOLD_BAND = 0.05; // +-5% drift threshold

export interface BacktestOptions {
  weights?: Partial<PortfolioWeights>;
  initialCapital?: number;
  rebalanceFrequency?: RebalanceFrequency;
  transactionFee?: number; // default 0.0010 (10 bps)
  startDate?: string;
  endDate?: string;
}

/**
 * Checks if day t is a rebalance day based on the selected policy.
 */
function isRebalanceDay(
  frequency: RebalanceFrequency,
  currentDate: string,
  prevDate: string | null,
  currentDriftWeights: PortfolioWeights,
  targetWeights: PortfolioWeights
): boolean {
  switch (frequency) {
    case 'DAILY':
      return true;

    case 'BUY_AND_HOLD':
      return false;

    case 'MONTHLY': {
      if (!prevDate) return true;
      const prevMonth = prevDate.slice(0, 7); // YYYY-MM
      const currMonth = currentDate.slice(0, 7);
      return currMonth !== prevMonth;
    }

    case 'QUARTERLY': {
      if (!prevDate) return true;
      const getQuarter = (dateStr: string) => {
        const month = parseInt(dateStr.slice(5, 7), 10);
        return Math.floor((month - 1) / 3);
      };
      const prevQuarter = getQuarter(prevDate);
      const currQuarter = getQuarter(currentDate);
      const prevYear = prevDate.slice(0, 4);
      const currYear = currentDate.slice(0, 4);
      return currYear !== prevYear || currQuarter !== prevQuarter;
    }

    case 'THRESHOLD': {
      // Rebalance if any asset has drifted by more than +-5%
      for (const asset of ASSETS) {
        const drift = Math.abs(currentDriftWeights[asset] - targetWeights[asset]);
        if (drift > THRESHOLD_BAND) {
          return true;
        }
      }
      return false;
    }
  }
}

/**
 * Executes a realistic portfolio backtest with turnover costs and rebalancing rules.
 */
export function runPortfolioBacktest(
  options: BacktestOptions = {},
  datasetOverride?: SynchronizedDataset
): PortfolioBacktestResult {
  const {
    weights = DEFAULT_PORTFOLIO_WEIGHTS,
    initialCapital = 100000,
    rebalanceFrequency = 'MONTHLY',
    transactionFee = DEFAULT_TRANSACTION_FEE,
    startDate,
    endDate,
  } = options;

  const validation = validateWeights(weights);
  const targetW = validation.normalizedWeights;

  const dataset = datasetOverride || getSynchronizedAssetData(startDate, endDate);
  const dates = dataset.dates;
  const returns = dataset.returns;
  const T = dates.length;

  if (T === 0) {
    throw new Error('No synchronized price points found for backtest range.');
  }

  // Value held in each asset
  let assetValues: Record<Asset, number> = {
    GOLD: initialCapital * targetW.GOLD,
    BTC: initialCapital * targetW.BTC,
    NVDA: initialCapital * targetW.NVDA,
  };

  let totalEquity = initialCapital;
  let peakEquity = initialCapital;
  let cumulativeTurnover = 0;
  let cumulativeCosts = 0;
  let rebalanceCount = 0;

  const equityCurve: number[] = [];
  const dailyPortfolioReturns: number[] = [];
  const drawdownCurve: number[] = [];

  for (let t = 0; t < T; t++) {
    const currentDate = dates[t];
    const prevDate = t > 0 ? dates[t - 1] : null;

    // 1. Check current weights before market opens on day t
    totalEquity = assetValues.GOLD + assetValues.BTC + assetValues.NVDA;
    const currentWeights: PortfolioWeights = {
      GOLD: totalEquity > 0 ? assetValues.GOLD / totalEquity : targetW.GOLD,
      BTC: totalEquity > 0 ? assetValues.BTC / totalEquity : targetW.BTC,
      NVDA: totalEquity > 0 ? assetValues.NVDA / totalEquity : targetW.NVDA,
    };

    // 2. Determine if rebalancing is triggered
    const shouldRebalance =
      t === 0 ||
      isRebalanceDay(
        rebalanceFrequency,
        currentDate,
        prevDate,
        currentWeights,
        targetW
      );

    if (shouldRebalance) {
      rebalanceCount++;
      // Calculate turnover: sum(|w_target - w_current|)
      let turnoverFraction = 0;
      for (const asset of ASSETS) {
        turnoverFraction += Math.abs(targetW[asset] - currentWeights[asset]);
      }

      // Half of the sum of absolute changes represents capital turned over
      const tradedTurnover = turnoverFraction * 0.5;
      const fee = tradedTurnover * totalEquity * transactionFee;

      cumulativeTurnover += tradedTurnover * totalEquity;
      cumulativeCosts += fee;
      totalEquity -= fee;

      // Reallocate to exact target weights
      assetValues = {
        GOLD: totalEquity * targetW.GOLD,
        BTC: totalEquity * targetW.BTC,
        NVDA: totalEquity * targetW.NVDA,
      };
    }

    // 3. Apply day t asset returns (next-bar execution)
    const prevEquity = totalEquity;
    for (const asset of ASSETS) {
      const r = returns[asset][t];
      assetValues[asset] *= (1 + r);
    }

    totalEquity = assetValues.GOLD + assetValues.BTC + assetValues.NVDA;
    const dayReturn = prevEquity > 0 ? (totalEquity - prevEquity) / prevEquity : 0;

    dailyPortfolioReturns.push(dayReturn);
    equityCurve.push(parseFloat(totalEquity.toFixed(2)));

    if (totalEquity > peakEquity) {
      peakEquity = totalEquity;
    }
    const dd = (totalEquity - peakEquity) / peakEquity;
    drawdownCurve.push(parseFloat((dd * 100).toFixed(2)));
  }

  // Performance metrics
  const endingCapital = totalEquity;
  const totalReturn = ((endingCapital - initialCapital) / initialCapital) * 100;
  const cagr = (Math.pow(endingCapital / initialCapital, TRADING_DAYS_PER_YEAR / T) - 1) * 100;

  // Volatility
  const meanRet = dailyPortfolioReturns.reduce((a, b) => a + b, 0) / T;
  const variance =
    dailyPortfolioReturns.reduce((sum, r) => sum + Math.pow(r - meanRet, 2), 0) / (T - 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;

  // Sharpe
  const dailyRf = RISK_FREE_RATE / TRADING_DAYS_PER_YEAR;
  const excessReturns = dailyPortfolioReturns.map(r => r - dailyRf);
  const meanExcess = excessReturns.reduce((a, b) => a + b, 0) / T;
  const varExcess =
    excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcess, 2), 0) / (T - 1);
  const stdExcess = Math.sqrt(varExcess);
  const sharpeRatio =
    stdExcess > 0
      ? parseFloat(((meanExcess / stdExcess) * Math.sqrt(TRADING_DAYS_PER_YEAR)).toFixed(2))
      : 0;

  const maxDrawdown = Math.min(...drawdownCurve);

  return {
    dates,
    equity: equityCurve,
    returns: dailyPortfolioReturns,
    drawdowns: drawdownCurve,
    initialCapital,
    endingCapital: parseFloat(endingCapital.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    cagr: parseFloat(cagr.toFixed(2)),
    volatility: parseFloat(volatility.toFixed(2)),
    sharpeRatio,
    maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
    turnover: parseFloat(cumulativeTurnover.toFixed(2)),
    transactionCosts: parseFloat(cumulativeCosts.toFixed(2)),
    rebalanceCount,
    weights: targetW,
    rebalanceFrequency,
    startDate: dataset.startDate,
    endDate: dataset.endDate,
    observationCount: T,
    assetsIncluded: dataset.assetsIncluded,
    synchronizationPolicy: dataset.synchronizationPolicy,
    isSimulatedData: true,
    dataSourceLabel: 'OFFLINE_DEMO',
  };
}
