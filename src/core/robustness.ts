/**
 * BLACKBOX X — Robustness Testing Engine
 *
 * Runs the same strategy across multiple parameter configurations and
 * returns a comparison table. The goal is NOT to find the best historical
 * configuration (that would be overfitting). The goal is to verify that
 * strategy behaviour remains reasonably stable across varied conditions.
 *
 * WARNING: Selecting parameters based on best historical backtest performance
 * is a form of overfitting. Use this tool to assess stability, not to optimize.
 */

import { PricePoint } from './data';
import { StrategyType, StrategyParams, generateSignals } from './strategies';
import { runBacktest, BacktestConfig } from './backtest';

export interface RobustnessConfig {
  label: string;            // Human-readable label for this configuration
  strategyParams: StrategyParams;
  transactionCostPct: number;
  startDate: string;
  endDate: string;
}

export interface RobustnessResult {
  label: string;
  strategyParams: StrategyParams;
  transactionCostPct: number;
  startDate: string;
  endDate: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  numTrades: number;
  winRate: number;
  buyHoldReturn: number;
  alpha: number;  // strategy return - buy&hold return
}

/**
 * Run a single robustness configuration and return its results.
 */
function runSingleConfig(
  prices: PricePoint[],
  strategy: StrategyType,
  config: RobustnessConfig,
  capital: number,
): RobustnessResult {
  if (prices.length < 20) {
    return {
      label: config.label,
      strategyParams: config.strategyParams,
      transactionCostPct: config.transactionCostPct,
      startDate: config.startDate,
      endDate: config.endDate,
      totalReturn: 0, annualizedReturn: 0, sharpeRatio: 0,
      volatility: 0, maxDrawdown: 0, numTrades: 0, winRate: 0,
      buyHoldReturn: 0, alpha: 0,
    };
  }

  const backtestConfig: BacktestConfig = {
    initialCapital: capital,
    positionSizePct: 0.95,
    transactionCostPct: config.transactionCostPct,
  };

  const signals = generateSignals(prices, strategy, config.strategyParams);
  const result = runBacktest(prices, signals, backtestConfig);

  return {
    label: config.label,
    strategyParams: config.strategyParams,
    transactionCostPct: config.transactionCostPct,
    startDate: config.startDate,
    endDate: config.endDate,
    totalReturn: result.totalReturn,
    annualizedReturn: result.annualizedReturn,
    sharpeRatio: result.sharpeRatio,
    volatility: result.volatility,
    maxDrawdown: result.maxDrawdown,
    numTrades: result.numTrades,
    winRate: result.winRate,
    buyHoldReturn: result.buyHoldReturn,
    alpha: parseFloat((result.totalReturn - result.buyHoldReturn).toFixed(2)),
  };
}

/**
 * Generate default robustness configurations for a given strategy.
 * Returns 4 configs: baseline, conservative params, aggressive params, high-cost stress test.
 */
export function generateDefaultConfigs(
  strategy: StrategyType,
  baseParams: StrategyParams,
  startDate: string,
  endDate: string,
  transactionCostPct: number,
): RobustnessConfig[] {
  const configs: RobustnessConfig[] = [];

  if (strategy === 'SMA_CROSSOVER' || strategy === 'EMA_TREND') {
    const short = baseParams.shortPeriod ?? 20;
    const long = baseParams.longPeriod ?? 50;
    configs.push(
      {
        label: 'Baseline',
        strategyParams: { shortPeriod: short, longPeriod: long },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'Conservative (slower)',
        strategyParams: { shortPeriod: Math.round(short * 1.5), longPeriod: Math.round(long * 1.5) },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'Aggressive (faster)',
        strategyParams: { shortPeriod: Math.max(5, Math.round(short * 0.6)), longPeriod: Math.max(short + 5, Math.round(long * 0.6)) },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'High-cost stress test',
        strategyParams: { shortPeriod: short, longPeriod: long },
        transactionCostPct: Math.min(transactionCostPct * 5, 0.01),
        startDate,
        endDate,
      },
    );
  } else if (strategy === 'MOMENTUM') {
    const lb = baseParams.lookback ?? 20;
    configs.push(
      {
        label: 'Baseline',
        strategyParams: { lookback: lb },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'Short lookback',
        strategyParams: { lookback: Math.max(5, Math.round(lb * 0.5)) },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'Long lookback',
        strategyParams: { lookback: Math.round(lb * 2) },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'High-cost stress test',
        strategyParams: { lookback: lb },
        transactionCostPct: Math.min(transactionCostPct * 5, 0.01),
        startDate,
        endDate,
      },
    );
  } else if (strategy === 'MEAN_REVERSION') {
    const period = baseParams.maPeriod ?? 20;
    const threshold = baseParams.threshold ?? 1.5;
    configs.push(
      {
        label: 'Baseline',
        strategyParams: { maPeriod: period, threshold },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'Tight threshold (1.0σ)',
        strategyParams: { maPeriod: period, threshold: 1.0 },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'Wide threshold (2.0σ)',
        strategyParams: { maPeriod: period, threshold: 2.0 },
        transactionCostPct,
        startDate,
        endDate,
      },
      {
        label: 'High-cost stress test',
        strategyParams: { maPeriod: period, threshold },
        transactionCostPct: Math.min(transactionCostPct * 5, 0.01),
        startDate,
        endDate,
      },
    );
  }

  return configs;
}

/**
 * Run all robustness configurations and return results array.
 */
export function runRobustnessSweep(
  pricesAll: PricePoint[],
  strategy: StrategyType,
  configs: RobustnessConfig[],
  capital: number,
  getDataInRange: (start: string, end: string) => PricePoint[],
): RobustnessResult[] {
  return configs.map(cfg => {
    const prices = getDataInRange(cfg.startDate, cfg.endDate);
    return runSingleConfig(prices, strategy, cfg, capital);
  });
}
