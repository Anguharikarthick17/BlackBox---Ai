/**
 * BLACKBOX X — Phase 3.7
 * Multi-Asset Portfolio Stress Testing Engine
 *
 * Source of Truth: docs/PORTFOLIO-ARCHITECTURE.md
 *
 * REUSES EXISTING STRESS LAB (src/core/stressTesting.ts):
 * Does NOT create a second stress engine. Directly leverages PRESET_SCENARIOS
 * and applyMacroShock to shock each constituent asset, then computes the resulting
 * multi-asset portfolio equity trajectory, drawdown, and damage contributions.
 *
 * MANDATORY DISCLAIMER:
 * "SIMULATED STRESS SCENARIO — NOT A HISTORICAL PRICE REPLAY."
 */

import { Asset, PRICE_DATA } from '../data';
import {
  PortfolioWeights,
  PortfolioStressResult,
  validateWeights,
  DEFAULT_PORTFOLIO_WEIGHTS,
} from './portfolioTypes';
import {
  StressScenarioId,
  PRESET_SCENARIOS,
  applyMacroShock,
} from '../stressTesting';
import {
  getSynchronizedAssetData,
  computeDailyPortfolioReturns,
} from './covariance';

export const STRESS_DISCLAIMER =
  'SIMULATED STRESS SCENARIO — NOT A HISTORICAL PRICE REPLAY. Modeled crisis volatility expansion and contagion parameters.';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Runs a multi-asset stress test on the portfolio using the Phase 3.2 stress lab.
 */
export function runPortfolioStressTest(
  weights: Partial<PortfolioWeights> = DEFAULT_PORTFOLIO_WEIGHTS,
  scenarioId: Exclude<StressScenarioId, 'CUSTOM'> = 'COVID_2020'
): PortfolioStressResult {
  const validation = validateWeights(weights);
  const w = validation.normalizedWeights;

  const scenario = PRESET_SCENARIOS[scenarioId];
  if (!scenario) {
    throw new Error(`Unknown stress scenario: ${scenarioId}`);
  }

  // 1. Get baseline synchronized dataset
  const baselineDataset = getSynchronizedAssetData();
  const baselineReturns = computeDailyPortfolioReturns(w, baselineDataset.returns);

  let baselineEquity = 1.0;
  for (const r of baselineReturns) {
    baselineEquity *= (1 + r);
  }
  const baselineReturnPct = (baselineEquity - 1.0) * 100;

  // 2. Shock each asset's price series individually using the existing stress engine
  const stressedAssetPrices: Record<Asset, { close: number; date: string }[]> = {
    GOLD: [],
    BTC: [],
    NVDA: [],
  };

  for (const asset of ASSETS) {
    const rawPrices = PRICE_DATA[asset] || [];
    const shockResult = applyMacroShock(rawPrices, scenario, asset);
    stressedAssetPrices[asset] = shockResult.stressedPrices;
  }

  // 3. Re-synchronize stressed prices on common dates
  const assetMap: Record<Asset, Map<string, number>> = {
    GOLD: new Map(stressedAssetPrices.GOLD.map(p => [p.date, p.close])),
    BTC: new Map(stressedAssetPrices.BTC.map(p => [p.date, p.close])),
    NVDA: new Map(stressedAssetPrices.NVDA.map(p => [p.date, p.close])),
  };

  const commonDates: string[] = [];
  const goldDates = Array.from(assetMap.GOLD.keys()).sort();
  for (const d of goldDates) {
    if (assetMap.BTC.has(d) && assetMap.NVDA.has(d)) {
      commonDates.push(d);
    }
  }

  const T = commonDates.length - 1;
  const stressedReturns: Record<Asset, number[]> = {
    GOLD: [],
    BTC: [],
    NVDA: [],
  };

  for (let t = 0; t < T; t++) {
    const dPrev = commonDates[t];
    const dCurr = commonDates[t + 1];
    for (const asset of ASSETS) {
      const pPrev = assetMap[asset].get(dPrev)!;
      const pCurr = assetMap[asset].get(dCurr)!;
      stressedReturns[asset].push((pCurr - pPrev) / pPrev);
    }
  }

  // 4. Compute stressed portfolio trajectory
  const stressedDailyReturns = computeDailyPortfolioReturns(w, stressedReturns);
  let currentEquity = 1.0;
  let peakEquity = 1.0;
  let maxDD = 0;

  for (const r of stressedDailyReturns) {
    currentEquity *= (1 + r);
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }
    const dd = (currentEquity - peakEquity) / peakEquity;
    if (dd < maxDD) {
      maxDD = dd;
    }
  }

  const stressedReturnPct = (currentEquity - 1.0) * 100;
  const stressedDrawdownPct = parseFloat((maxDD * 100).toFixed(2));

  // Compute stressed Sharpe
  const meanExcess = stressedDailyReturns.reduce((a, b) => a + (b - 0.04 / 252), 0) / T;
  const variance =
    stressedDailyReturns.reduce((sum, r) => sum + Math.pow(r - 0.04 / 252 - meanExcess, 2), 0) /
    (T - 1);
  const std = Math.sqrt(variance);
  const stressedSharpe =
    std > 0 ? parseFloat(((meanExcess / std) * Math.sqrt(252)).toFixed(2)) : 0;

  // 5. Calculate damage contribution per asset
  // How much return did each asset lose relative to baseline?
  const assetLosses: Record<Asset, number> = { GOLD: 0, BTC: 0, NVDA: 0 };
  let totalWeightedLoss = 0;

  for (const asset of ASSETS) {
    const bPriceStart = baselineDataset.prices[asset][0];
    const bPriceEnd = baselineDataset.prices[asset][baselineDataset.prices[asset].length - 1];
    const bReturn = (bPriceEnd - bPriceStart) / bPriceStart;

    const sPriceStart = assetMap[asset].get(commonDates[0])!;
    const sPriceEnd = assetMap[asset].get(commonDates[commonDates.length - 1])!;
    const sReturn = (sPriceEnd - sPriceStart) / sPriceStart;

    const lossDelta = Math.max(0, (bReturn - sReturn));
    const weightedLoss = (w[asset] || 0) * lossDelta;
    assetLosses[asset] = weightedLoss;
    totalWeightedLoss += weightedLoss;
  }

  const damageContribution: Record<Asset, number> = {
    GOLD: totalWeightedLoss > 0 ? parseFloat(((assetLosses.GOLD / totalWeightedLoss) * 100).toFixed(1)) : 33.3,
    BTC: totalWeightedLoss > 0 ? parseFloat(((assetLosses.BTC / totalWeightedLoss) * 100).toFixed(1)) : 33.3,
    NVDA: totalWeightedLoss > 0 ? parseFloat(((assetLosses.NVDA / totalWeightedLoss) * 100).toFixed(1)) : 33.3,
  };

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    weights: w,
    baselineReturn: parseFloat(baselineReturnPct.toFixed(2)),
    stressedReturn: parseFloat(stressedReturnPct.toFixed(2)),
    stressedDrawdown: stressedDrawdownPct,
    stressedSharpe,
    damageContribution,
    recoveryDays: scenario.recoveryDurationDays,
    disclaimer: STRESS_DISCLAIMER,
  };
}
