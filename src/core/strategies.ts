/**
 * BLACKBOX X — Trading Strategies
 * SMA Crossover, EMA Trend, Momentum, Mean Reversion
 */

import { PricePoint } from './data';

export type StrategyType = 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION';

export interface StrategyParams {
  shortPeriod?: number;   // SMA/EMA short window
  longPeriod?: number;    // SMA/EMA long window
  lookback?: number;      // Momentum lookback
  threshold?: number;     // Mean reversion z-score threshold
  maPeriod?: number;      // Mean reversion MA period
}

export type Signal = 1 | 0 | -1; // 1=long, 0=flat, -1=short (we only use long/flat)

function sma(prices: number[], period: number, idx: number): number | null {
  if (idx < period - 1) return null;
  const slice = prices.slice(idx - period + 1, idx + 1);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(prices: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < prices.length; i++) {
    if (prev === null) {
      if (i < period - 1) { result.push(NaN); continue; }
      const initSlice = prices.slice(0, period);
      prev = initSlice.reduce((a, b) => a + b, 0) / period;
      result.push(prev);
    } else {
      prev = prices[i] * k + prev * (1 - k);
      result.push(prev);
    }
  }
  return result;
}

function zScore(prices: number[], period: number, idx: number): number | null {
  if (idx < period - 1) return null;
  const slice = prices.slice(idx - period + 1, idx + 1);
  const m = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((s, v) => s + Math.pow(v - m, 2), 0) / period;
  const s = Math.sqrt(variance);
  if (s === 0) return null;
  return (prices[idx] - m) / s;
}

export function generateSignals(
  prices: PricePoint[],
  strategy: StrategyType,
  params: StrategyParams
): Signal[] {
  const closes = prices.map(p => p.close);
  const signals: Signal[] = new Array(closes.length).fill(0);

  if (strategy === 'SMA_CROSSOVER') {
    const short = params.shortPeriod ?? 20;
    const long = params.longPeriod ?? 50;
    for (let i = long - 1; i < closes.length; i++) {
      const s = sma(closes, short, i)!;
      const l = sma(closes, long, i)!;
      signals[i] = s > l ? 1 : 0;
    }
  } else if (strategy === 'EMA_TREND') {
    const short = params.shortPeriod ?? 12;
    const long = params.longPeriod ?? 26;
    const shortEMA = ema(closes, short);
    const longEMA = ema(closes, long);
    for (let i = 0; i < closes.length; i++) {
      if (isNaN(shortEMA[i]) || isNaN(longEMA[i])) continue;
      signals[i] = shortEMA[i] > longEMA[i] ? 1 : 0;
    }
  } else if (strategy === 'MOMENTUM') {
    const lb = params.lookback ?? 20;
    for (let i = lb; i < closes.length; i++) {
      const momentumReturn = (closes[i] - closes[i - lb]) / closes[i - lb];
      signals[i] = momentumReturn > 0 ? 1 : 0;
    }
  } else if (strategy === 'MEAN_REVERSION') {
    const period = params.maPeriod ?? 20;
    const threshold = params.threshold ?? 1.5;
    for (let i = period - 1; i < closes.length; i++) {
      const z = zScore(closes, period, i);
      if (z === null) continue;
      if (z < -threshold) signals[i] = 1;
      else if (z > threshold) signals[i] = 0;
      else signals[i] = signals[i - 1] ?? 0;
    }
  }

  return signals;
}

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  SMA_CROSSOVER: 'SMA Crossover',
  EMA_TREND: 'EMA Trend',
  MOMENTUM: 'Momentum',
  MEAN_REVERSION: 'Mean Reversion',
};

export const STRATEGY_DESCRIPTIONS: Record<StrategyType, string> = {
  SMA_CROSSOVER: 'Goes long when the short-period SMA crosses above the long-period SMA.',
  EMA_TREND: 'Goes long when the fast EMA is above the slow EMA, using exponential weighting.',
  MOMENTUM: 'Buys assets with positive recent returns, sells when momentum turns negative.',
  MEAN_REVERSION: 'Buys when price is statistically cheap (low z-score), sells when expensive.',
};

export const DEFAULT_PARAMS: Record<StrategyType, StrategyParams> = {
  SMA_CROSSOVER: { shortPeriod: 20, longPeriod: 50 },
  EMA_TREND: { shortPeriod: 12, longPeriod: 26 },
  MOMENTUM: { lookback: 20 },
  MEAN_REVERSION: { maPeriod: 20, threshold: 1.5 },
};
