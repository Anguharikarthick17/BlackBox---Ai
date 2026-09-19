/**
 * BLACKBOX X — Market Regime Detection
 * Classifies each period as Bull, Bear, High Volatility, or Low Volatility.
 * Rule-based classification using rolling return and volatility thresholds.
 * NOT machine-learning based.
 */

import { PricePoint } from './data';
import { computeReturns, std, mean, computeSharpe } from './metrics';
import { Signal } from './strategies';

export type RegimeType = 'BULL' | 'BEAR' | 'HIGH_VOL' | 'LOW_VOL';

export interface RegimePeriod {
  startDate: string;
  endDate: string;
  regime: RegimeType;
  return: number;          // % return over period
  volatility: number;      // annualized %
  durationDays: number;
}

export interface RegimePoint {
  date: string;
  regime: RegimeType;
  rollingVol: number;
  rollingReturn: number;
}

const REGIME_LABELS: Record<RegimeType, string> = {
  BULL: 'Bull Market',
  BEAR: 'Bear Market',
  HIGH_VOL: 'High Volatility',
  LOW_VOL: 'Low Volatility',
};

const REGIME_COLORS: Record<RegimeType, string> = {
  BULL: '#22C55E',
  BEAR: '#EF4444',
  HIGH_VOL: '#F59E0B',
  LOW_VOL: '#3B82F6',
};

export { REGIME_LABELS, REGIME_COLORS };

/**
 * Classify each bar into a regime using 60-day rolling statistics.
 * Thresholds (annualized vol > 35% → HIGH_VOL, < 15% → LOW_VOL,
 * rolling return > 5% → BULL, else BEAR) are fixed rule-based values,
 * not dynamically calibrated.
 */
export function detectRegimes(prices: PricePoint[], window = 60): RegimePoint[] {
  const returns = computeReturns(prices);
  const results: RegimePoint[] = [];

  for (let i = window; i < prices.length; i++) {
    const slice = returns.slice(i - window, i);
    const rollingVol = std(slice) * Math.sqrt(252) * 100;
    const rollingReturn = (Math.pow(1 + mean(slice), 252) - 1) * 100;

    let regime: RegimeType;
    if (rollingVol > 35) {
      regime = 'HIGH_VOL';
    } else if (rollingVol < 15) {
      regime = 'LOW_VOL';
    } else if (rollingReturn > 5) {
      regime = 'BULL';
    } else {
      regime = 'BEAR';
    }

    results.push({
      date: prices[i].date,
      regime,
      rollingVol: parseFloat(rollingVol.toFixed(2)),
      rollingReturn: parseFloat(rollingReturn.toFixed(2)),
    });
  }

  return results;
}

export function computeRegimePeriods(regimePoints: RegimePoint[]): RegimePeriod[] {
  if (regimePoints.length === 0) return [];
  const periods: RegimePeriod[] = [];
  let currentRegime = regimePoints[0].regime;
  let startIdx = 0;

  for (let i = 1; i <= regimePoints.length; i++) {
    const changed = i === regimePoints.length || regimePoints[i].regime !== currentRegime;
    if (changed) {
      const slice = regimePoints.slice(startIdx, i);
      const avgVol = slice.reduce((s, p) => s + p.rollingVol, 0) / slice.length;
      const avgRet = slice.reduce((s, p) => s + p.rollingReturn, 0) / slice.length;
      periods.push({
        startDate: slice[0].date,
        endDate: slice[slice.length - 1].date,
        regime: currentRegime,
        return: parseFloat(avgRet.toFixed(2)),
        volatility: parseFloat(avgVol.toFixed(2)),
        durationDays: slice.length,
      });
      if (i < regimePoints.length) {
        currentRegime = regimePoints[i].regime;
        startIdx = i;
      }
    }
  }
  return periods;
}

export interface RegimeStrategyPerf {
  regime: RegimeType;
  strategyReturn: number;
  buyHoldReturn: number;
  numTrades: number;
  sharpe: number;
  winRate: number;
}

/**
 * Compute strategy performance within each regime using actual equity curve data.
 * Sharpe and WinRate are computed from real equity returns and trade log,
 * not from hardcoded approximations.
 */
export function strategyPerformanceByRegime(
  regimePoints: RegimePoint[],
  strategyEquity: { date: string; value: number }[],
  buyHoldEquity: { date: string; value: number }[],
  trades: { entryDate: string; exitDate: string; pnl: number }[] = [],
): RegimeStrategyPerf[] {
  const regimeTypes: RegimeType[] = ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'];

  return regimeTypes.map(regime => {
    const regimeDates = new Set(regimePoints.filter(r => r.regime === regime).map(r => r.date));

    const stratSlice = strategyEquity.filter(e => regimeDates.has(e.date));
    const bhSlice = buyHoldEquity.filter(e => regimeDates.has(e.date));

    if (stratSlice.length < 2) {
      return { regime, strategyReturn: 0, buyHoldReturn: 0, numTrades: 0, sharpe: 0, winRate: 0 };
    }

    const stratStart = stratSlice[0].value;
    const stratEnd = stratSlice[stratSlice.length - 1].value;
    const stratReturn = stratStart > 0
      ? parseFloat((((stratEnd - stratStart) / stratStart) * 100).toFixed(2))
      : 0;

    const bhStart = bhSlice.length >= 2 ? bhSlice[0].value : 0;
    const bhEnd = bhSlice.length >= 2 ? bhSlice[bhSlice.length - 1].value : 0;
    const bhReturn = bhStart > 0
      ? parseFloat((((bhEnd - bhStart) / bhStart) * 100).toFixed(2))
      : 0;

    // Compute real Sharpe from equity daily returns within this regime
    const eqValues = stratSlice.map(e => e.value);
    const eqReturns: number[] = [];
    for (let i = 1; i < eqValues.length; i++) {
      if (eqValues[i - 1] !== 0) {
        eqReturns.push((eqValues[i] - eqValues[i - 1]) / eqValues[i - 1]);
      }
    }
    const sharpe = eqReturns.length >= 2 ? computeSharpe(eqReturns) : 0;

    // Compute real WinRate from trades that fell within this regime
    const regimeStart = stratSlice[0].date;
    const regimeEnd = stratSlice[stratSlice.length - 1].date;
    const regimeTrades = trades.filter(
      t => t.entryDate >= regimeStart && t.exitDate <= regimeEnd
    );
    const winningTrades = regimeTrades.filter(t => t.pnl > 0).length;
    const winRate = regimeTrades.length > 0
      ? parseFloat(((winningTrades / regimeTrades.length) * 100).toFixed(1))
      : 0;

    return {
      regime,
      strategyReturn: stratReturn,
      buyHoldReturn: bhReturn,
      numTrades: regimeTrades.length,
      sharpe,
      winRate,
    };
  });
}
