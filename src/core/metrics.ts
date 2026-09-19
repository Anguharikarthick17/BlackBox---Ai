/**
 * BLACKBOX X — Quantitative Metrics
 * All calculations are deterministic. No values are fabricated.
 */

import { PricePoint } from './data';

export interface MetricsResult {
  totalReturn: number;        // percentage
  annualizedReturn: number;   // percentage
  volatility: number;         // annualized percentage
  sharpeRatio: number;
  maxDrawdown: number;        // percentage (negative)
  calmarRatio: number;
  startPrice: number;
  endPrice: number;
  days: number;
}

export function computeReturns(prices: PricePoint[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i].close - prices[i - 1].close) / prices[i - 1].close);
  }
  return returns;
}

export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function computeVolatility(returns: number[]): number {
  return std(returns) * Math.sqrt(252) * 100;
}

export function computeSharpe(returns: number[], riskFreeRate = 0.04): number {
  if (returns.length < 2) return 0;
  const dailyRF = riskFreeRate / 252;
  const excessReturns = returns.map(r => r - dailyRF);
  const m = mean(excessReturns);
  const s = std(excessReturns);
  if (s === 0) return 0;
  return parseFloat(((m / s) * Math.sqrt(252)).toFixed(2));
}

export function computeMaxDrawdown(prices: PricePoint[]): number {
  if (prices.length === 0) return 0;
  let peak = prices[0].close;
  let maxDD = 0;
  for (const p of prices) {
    if (p.close > peak) peak = p.close;
    const dd = (p.close - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return parseFloat((maxDD * 100).toFixed(2));
}

export function computeDrawdownSeries(prices: PricePoint[]): { date: string; drawdown: number }[] {
  if (prices.length === 0) return [];
  let peak = prices[0].close;
  return prices.map(p => {
    if (p.close > peak) peak = p.close;
    return {
      date: p.date,
      drawdown: parseFloat((((p.close - peak) / peak) * 100).toFixed(2)),
    };
  });
}

export function computeMetrics(prices: PricePoint[]): MetricsResult {
  if (prices.length < 2) {
    return {
      totalReturn: 0, annualizedReturn: 0, volatility: 0,
      sharpeRatio: 0, maxDrawdown: 0, calmarRatio: 0,
      startPrice: 0, endPrice: 0, days: 0,
    };
  }
  const returns = computeReturns(prices);
  const startPrice = prices[0].close;
  const endPrice = prices[prices.length - 1].close;
  const days = prices.length;
  const totalReturn = parseFloat((((endPrice - startPrice) / startPrice) * 100).toFixed(2));
  const years = days / 252;
  const annualizedReturn = parseFloat(
    ((Math.pow(endPrice / startPrice, 1 / years) - 1) * 100).toFixed(2)
  );
  const volatility = parseFloat(computeVolatility(returns).toFixed(2));
  const sharpeRatio = computeSharpe(returns);
  const maxDrawdown = computeMaxDrawdown(prices);
  const calmarRatio = maxDrawdown !== 0
    ? parseFloat((annualizedReturn / Math.abs(maxDrawdown)).toFixed(2))
    : 0;
  return { totalReturn, annualizedReturn, volatility, sharpeRatio, maxDrawdown, calmarRatio, startPrice, endPrice, days };
}

export function computeRollingVolatility(prices: PricePoint[], window = 30): { date: string; value: number }[] {
  const returns = computeReturns(prices);
  return prices.slice(window).map((p, i) => {
    const slice = returns.slice(i, i + window);
    return { date: p.date, value: parseFloat((std(slice) * Math.sqrt(252) * 100).toFixed(2)) };
  });
}

export function computeRollingSharpe(prices: PricePoint[], window = 60): { date: string; value: number }[] {
  const returns = computeReturns(prices);
  return prices.slice(window).map((p, i) => {
    const slice = returns.slice(i, i + window);
    return { date: p.date, value: computeSharpe(slice) };
  });
}

/**
 * Rolling N-day cumulative return (%).
 * At each bar i, computes: (close[i] / close[i - window] - 1) * 100
 */
export function computeRollingReturns(prices: PricePoint[], window = 20): { date: string; value: number }[] {
  const result: { date: string; value: number }[] = [];
  for (let i = window; i < prices.length; i++) {
    const base = prices[i - window].close;
    const curr = prices[i].close;
    if (base === 0) continue;
    result.push({
      date: prices[i].date,
      value: parseFloat((((curr - base) / base) * 100).toFixed(2)),
    });
  }
  return result;
}

export function normalizedPrices(prices: PricePoint[]): { date: string; value: number }[] {
  if (prices.length === 0) return [];
  const base = prices[0].close;
  return prices.map(p => ({
    date: p.date,
    value: parseFloat(((p.close / base) * 100).toFixed(2)),
  }));
}

/** Compute Sharpe ratio from an equity value array */
export function computeSharpeFromEquity(equity: number[], riskFreeRate = 0.04): number {
  if (equity.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    if (equity[i - 1] === 0) continue;
    returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
  }
  return computeSharpe(returns, riskFreeRate);
}

/** Compute max drawdown (%) from an equity value array */
export function computeMaxDrawdownFromEquity(equity: number[]): number {
  if (equity.length === 0) return 0;
  let peak = equity[0];
  let maxDD = 0;
  for (const v of equity) {
    if (v > peak) peak = v;
    const dd = (v - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return parseFloat((maxDD * 100).toFixed(2));
}

/** Compute annualized volatility from an equity value array */
export function computeVolatilityFromEquity(equity: number[]): number {
  if (equity.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    if (equity[i - 1] === 0) continue;
    returns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
  }
  return parseFloat(computeVolatility(returns).toFixed(2));
}
