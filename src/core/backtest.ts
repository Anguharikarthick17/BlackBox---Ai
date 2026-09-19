/**
 * BLACKBOX X — Backtesting Engine
 * Realistic simulation with transaction costs, position sizing,
 * and next-bar execution to avoid look-ahead bias.
 *
 * LOOK-AHEAD BIAS NOTE:
 * Signal is computed using data up to and including close[i].
 * Execution occurs at close[i+1] (the next bar's close).
 * This reflects a realistic assumption: a trader observes the
 * close-of-day signal and executes the following trading session.
 */

import { PricePoint } from './data';
import { Signal } from './strategies';
import {
  computeMaxDrawdown,
  computeSharpe,
  computeVolatility,
  computeSharpeFromEquity,
  computeMaxDrawdownFromEquity,
  computeVolatilityFromEquity,
} from './metrics';

export interface Trade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;           // dollars
  pnlPct: number;        // percentage
  type: 'LONG';
}

export interface BacktestResult {
  strategyEquity: { date: string; value: number }[];
  buyHoldEquity: { date: string; value: number }[];
  trades: Trade[];

  // Strategy metrics
  totalReturn: number;          // %
  annualizedReturn: number;     // %
  volatility: number;           // annualized %
  sharpeRatio: number;
  maxDrawdown: number;          // negative %
  numTrades: number;
  winRate: number;              // %
  startCapital: number;
  endCapital: number;
  bestTrade: number;            // %
  worstTrade: number;           // %
  avgTrade: number;             // %

  // Buy & Hold comparison metrics (same period, same capital)
  buyHoldReturn: number;        // %
  buyHoldAnnualizedReturn: number; // %
  buyHoldSharpe: number;
  buyHoldVolatility: number;    // annualized %
  buyHoldMaxDrawdown: number;   // negative %
  buyHoldEndCapital: number;

  // Signal series for chart overlay (parallel to prices)
  signalSeries: { date: string; signal: Signal; entryMarker: boolean; exitMarker: boolean }[];
}

export interface BacktestConfig {
  initialCapital: number;
  positionSizePct: number;     // 0–1, fraction of capital per trade
  transactionCostPct: number;  // e.g. 0.001 = 0.1%
}

function makePseudoPrices(equity: number[]): PricePoint[] {
  return equity.map((v, i) => ({
    date: String(i),
    open: v, high: v, low: v, close: v, volume: 0,
  }));
}

export function runBacktest(
  prices: PricePoint[],
  signals: Signal[],
  config: BacktestConfig
): BacktestResult {
  const { initialCapital, positionSizePct, transactionCostPct } = config;

  let cash = initialCapital;
  let holdings = 0;
  let inPosition = false;
  let entryPrice = 0;
  let entryDate = '';

  const strategyEquity: { date: string; value: number }[] = [];
  const trades: Trade[] = [];
  const signalSeries: BacktestResult['signalSeries'] = [];

  // --- NEXT-BAR EXECUTION ---
  // Signal[i] is computed from prices up to close[i].
  // We act on it at close[i+1] (next bar).
  // We process bars 0..n-2, then close any open position at bar n-1.

  for (let i = 0; i < prices.length; i++) {
    const currentPrice = prices[i].close;
    const portfolioValue = cash + holdings * currentPrice;
    let entryMarker = false;
    let exitMarker = false;

    // The effective signal for execution at bar i comes from signal[i-1]
    // (signal generated after bar i-1's close, executed at bar i's close)
    const effectiveSignal = i > 0 ? signals[i - 1] : 0;
    const prevEffectiveSignal = i > 1 ? signals[i - 2] : 0;

    // Entry: signal turns 1 and we are not in position
    if (effectiveSignal === 1 && prevEffectiveSignal !== 1 && !inPosition) {
      const tradeValue = portfolioValue * positionSizePct;
      const units = tradeValue / currentPrice;
      const cost = tradeValue * transactionCostPct;
      if (cash >= tradeValue + cost) {
        holdings += units;
        cash -= (tradeValue + cost);
        inPosition = true;
        entryPrice = currentPrice;
        entryDate = prices[i].date;
        entryMarker = true;
      }
    }

    // Exit: signal turns 0 and we are in position
    if (effectiveSignal === 0 && prevEffectiveSignal !== 0 && inPosition) {
      const proceeds = holdings * currentPrice;
      const cost = proceeds * transactionCostPct;
      cash += proceeds - cost;
      const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;
      trades.push({
        entryDate,
        exitDate: prices[i].date,
        entryPrice,
        exitPrice: currentPrice,
        pnl: parseFloat(((currentPrice - entryPrice) * (proceeds / currentPrice)).toFixed(2)),
        pnlPct: parseFloat(pnlPct.toFixed(2)),
        type: 'LONG',
      });
      holdings = 0;
      inPosition = false;
      exitMarker = true;
    }

    strategyEquity.push({
      date: prices[i].date,
      value: parseFloat((cash + holdings * currentPrice).toFixed(2)),
    });

    signalSeries.push({
      date: prices[i].date,
      signal: effectiveSignal as Signal,
      entryMarker,
      exitMarker,
    });
  }

  // Close open position at last bar
  if (inPosition && prices.length > 0) {
    const lastPrice = prices[prices.length - 1].close;
    const proceeds = holdings * lastPrice;
    const cost = proceeds * transactionCostPct;
    cash += proceeds - cost;
    const pnlPct = ((lastPrice - entryPrice) / entryPrice) * 100;
    trades.push({
      entryDate,
      exitDate: prices[prices.length - 1].date,
      entryPrice,
      exitPrice: lastPrice,
      pnl: parseFloat(((lastPrice - entryPrice) * (proceeds / lastPrice)).toFixed(2)),
      pnlPct: parseFloat(pnlPct.toFixed(2)),
      type: 'LONG',
    });
    strategyEquity[strategyEquity.length - 1].value = parseFloat(cash.toFixed(2));
  }

  // --- BUY & HOLD BENCHMARK ---
  // Buy at close[0] with transaction cost, hold until close[n-1], sell with transaction cost.
  const bhStartPrice = prices[0].close;
  const bhUnits = (initialCapital * (1 - transactionCostPct)) / bhStartPrice;
  const buyHoldEquity = prices.map(p => ({
    date: p.date,
    value: parseFloat((bhUnits * p.close).toFixed(2)),
  }));
  // Apply exit cost to final value
  const bhRawEnd = buyHoldEquity[buyHoldEquity.length - 1]?.value ?? initialCapital;
  const bhEndCapital = parseFloat((bhRawEnd * (1 - transactionCostPct)).toFixed(2));

  // --- STRATEGY PERFORMANCE ---
  const endCapital = strategyEquity[strategyEquity.length - 1]?.value ?? initialCapital;
  const totalReturn = parseFloat((((endCapital - initialCapital) / initialCapital) * 100).toFixed(2));
  const years = prices.length / 252;
  const annualizedReturn = parseFloat(
    ((Math.pow(Math.max(endCapital / initialCapital, 0.0001), 1 / years) - 1) * 100).toFixed(2)
  );
  const eqValues = strategyEquity.map(e => e.value);
  const strategyReturns: number[] = [];
  for (let i = 1; i < eqValues.length; i++) {
    if (eqValues[i - 1] !== 0) {
      strategyReturns.push((eqValues[i] - eqValues[i - 1]) / eqValues[i - 1]);
    }
  }
  const volatility = parseFloat(computeVolatility(strategyReturns).toFixed(2));
  const sharpeRatio = computeSharpe(strategyReturns);
  const maxDrawdown = computeMaxDrawdown(makePseudoPrices(eqValues));
  const winRate = trades.length > 0
    ? parseFloat(((trades.filter(t => t.pnl > 0).length / trades.length) * 100).toFixed(1))
    : 0;
  const pnlPcts = trades.map(t => t.pnlPct);
  const bestTrade = pnlPcts.length ? parseFloat(Math.max(...pnlPcts).toFixed(2)) : 0;
  const worstTrade = pnlPcts.length ? parseFloat(Math.min(...pnlPcts).toFixed(2)) : 0;
  const avgTrade = pnlPcts.length
    ? parseFloat((pnlPcts.reduce((a, b) => a + b, 0) / pnlPcts.length).toFixed(2))
    : 0;

  // --- BUY & HOLD PERFORMANCE ---
  const bhEquityValues = buyHoldEquity.map(e => e.value);
  const buyHoldReturn = parseFloat((((bhRawEnd - initialCapital) / initialCapital) * 100).toFixed(2));
  const buyHoldAnnualizedReturn = parseFloat(
    ((Math.pow(Math.max(bhRawEnd / initialCapital, 0.0001), 1 / years) - 1) * 100).toFixed(2)
  );
  const buyHoldSharpe = computeSharpeFromEquity(bhEquityValues);
  const buyHoldVolatility = computeVolatilityFromEquity(bhEquityValues);
  const buyHoldMaxDrawdown = computeMaxDrawdownFromEquity(bhEquityValues);

  return {
    strategyEquity,
    buyHoldEquity,
    trades,
    signalSeries,
    totalReturn,
    buyHoldReturn,
    annualizedReturn,
    buyHoldAnnualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown,
    numTrades: trades.length,
    winRate,
    startCapital: initialCapital,
    endCapital: parseFloat(endCapital.toFixed(2)),
    bestTrade,
    worstTrade,
    avgTrade,
    buyHoldSharpe,
    buyHoldVolatility,
    buyHoldMaxDrawdown,
    buyHoldEndCapital: bhEndCapital,
  };
}
