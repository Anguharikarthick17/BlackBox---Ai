/**
 * BLACKBOX X — Phase 3.8
 * Monte Carlo & Probabilistic Risk Intelligence Engine
 *
 * Implements:
 * 1. Historical Joint Bootstrap (Complete vector resampling with replacement)
 * 2. Parametric Correlated Normal (Cholesky factorization of empirical covariance)
 * 3. Deterministic Seeded PRNG
 * 4. Portfolio Path Evolution (Organic drift, periodic/threshold rebalancing, friction)
 * 5. Extreme Volatility / Bankruptcy Clamping (r* <= -100% -> V_i = 0)
 * 6. Percentile Distributions (P05, P25, P50, P75, P95)
 * 7. Tail Risk & Loss Frequencies
 * 8. Historical vs. Monte Carlo Reconciliation
 */

import { Asset, PortfolioWeights, RebalanceFrequency } from './portfolioTypes';
import { getSynchronizedAssetData, computePortfolioMetrics } from './covariance';
import { runPortfolioBacktest } from './portfolioBacktest';
import {
  MonteCarloConfig,
  MonteCarloResult,
  MonteCarloProvenance,
  PercentileSummary,
  SimulationTrajectoryBands,
  SamplePath,
  MonteCarloRiskMetrics,
  HistoricalVsMonteCarloComparison,
  validateMonteCarloConfig,
} from './monteCarloTypes';
import { DeterministicPRNG } from './prng';
import { computeCholesky, covarianceRecordToArray, transformCorrelatedShocks } from './cholesky';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Calculates a specific percentile (0.0 to 1.0) using linear interpolation on sorted data.
 */
export function calculatePercentile(sortedValues: number[], p: number): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n === 1) return sortedValues[0];
  if (p <= 0) return sortedValues[0];
  if (p >= 1) return sortedValues[n - 1];

  const index = p * (n - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculates standard percentiles (P05, P25, P50, P75, P95) for a numeric array.
 */
export function calculatePercentileSummary(values: number[]): PercentileSummary {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p05: calculatePercentile(sorted, 0.05),
    p25: calculatePercentile(sorted, 0.25),
    p50: calculatePercentile(sorted, 0.50),
    p75: calculatePercentile(sorted, 0.75),
    p95: calculatePercentile(sorted, 0.95),
  };
}

/**
 * Generates a simple deterministic SHA-like hash string from input parameters.
 */
export function generateSimulationFingerprint(
  method: string,
  seed: number,
  simulationCount: number,
  horizonDays: number,
  initialCapital: number,
  weights: PortfolioWeights,
  schedule: string,
  bps: number
): string {
  const payload = `${method}|${seed}|${simulationCount}|${horizonDays}|${initialCapital}|${weights.GOLD.toFixed(4)},${weights.BTC.toFixed(4)},${weights.NVDA.toFixed(4)}|${schedule}|${bps}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `bx-mc-${hex}-${seed}`;
}

/**
 * Core Monte Carlo Simulation Execution
 */
export function runMonteCarloSimulation(userConfig: MonteCarloConfig): MonteCarloResult {
  const startTime = Date.now();
  const valRes = validateMonteCarloConfig(userConfig);
  if (!valRes.isValid || !valRes.sanitizedConfig) {
    throw new Error(`Monte Carlo Configuration Error: ${valRes.error}`);
  }

  const config = valRes.sanitizedConfig;
  const { method, seed, simulationCount, horizonDays, initialCapital, portfolioWeights, rebalanceSchedule, includeTransactionCosts, transactionCostBps } = config;

  // Retrieve synchronized historical dataset (Option B: offline simulated daily calendar)
  const dataset = getSynchronizedAssetData();
  const T = dataset.observationCount; // 1,825
  const prng = new DeterministicPRNG(seed);

  // Setup Parametric Cholesky if applicable
  let choleskyL: number[][] = [];
  let stabilizationApplied = false;
  let stabilizationMagnitude: number | undefined = undefined;
  const dailyMeans = [
    dataset.meanDailyReturns.GOLD,
    dataset.meanDailyReturns.BTC,
    dataset.meanDailyReturns.NVDA,
  ];

  if (method === 'PARAMETRIC_NORMAL') {
    const covArray = covarianceRecordToArray(dataset.dailyCovarianceMatrix);
    const choleskyRes = computeCholesky(covArray);
    choleskyL = choleskyRes.L;
    stabilizationApplied = choleskyRes.stabilizationApplied;
    stabilizationMagnitude = choleskyRes.stabilizationMagnitude;
  }

  // Pre-allocate collectors for metrics
  const terminalWealths = new Float64Array(simulationCount);
  const totalReturns = new Float64Array(simulationCount);
  const maxDrawdowns = new Float64Array(simulationCount);
  const cagrs: number[] = horizonDays >= 63 ? [] : [];
  const sharpeRatios: number[] = horizonDays >= 63 ? [] : [];

  // Trajectory bands collectors: aggregate daily portfolio values for percentile fan
  // To keep memory conscious, we sample up to 101 evenly spaced steps across the horizon
  const stepCount = Math.min(100, horizonDays);
  const sampleInterval = Math.max(1, Math.floor(horizonDays / stepCount));
  const recordedDays: number[] = [0];
  for (let d = sampleInterval; d <= horizonDays; d += sampleInterval) {
    recordedDays.push(d);
  }
  if (recordedDays[recordedDays.length - 1] !== horizonDays) {
    recordedDays.push(horizonDays);
  }
  const dayIndexMap = new Map<number, number>();
  recordedDays.forEach((day, idx) => dayIndexMap.set(day, idx));

  // Trajectory value buffers: matrix of [dayStepIndex][simulationIndex]
  const trajectoryGrid: number[][] = recordedDays.map(() => new Array(simulationCount));

  // 50 representative sample paths
  const sampleIndices = new Set<number>();
  const stride = Math.max(1, Math.floor(simulationCount / 50));
  for (let i = 0; i < simulationCount && sampleIndices.size < 50; i += stride) {
    sampleIndices.add(i);
  }

  const samplePathValues: Map<number, number[]> = new Map();
  sampleIndices.forEach(idx => samplePathValues.set(idx, [initialCapital]));

  const dailyExcessReturnsPool: number[] = [];

  // Execute M simulated paths
  for (let m = 0; m < simulationCount; m++) {
    // Initial capital allocation
    let capGold = portfolioWeights.GOLD * initialCapital;
    let capBtc = portfolioWeights.BTC * initialCapital;
    let capNvda = portfolioWeights.NVDA * initialCapital;
    let currentWealth = capGold + capBtc + capNvda;

    let peakWealth = currentWealth;
    let maxDd = 0; // reported as negative or zero (e.g. -0.25)
    trajectoryGrid[0][m] = currentWealth;

    const pathDailyReturns: number[] = [];

    for (let tau = 1; tau <= horizonDays; tau++) {
      // 1. Generate return vector r*
      let rGold = 0;
      let rBtc = 0;
      let rNvda = 0;

      if (method === 'HISTORICAL_BOOTSTRAP') {
        // Complete synchronized vector resampling with replacement
        const j = prng.nextInt(0, T - 1);
        rGold = dataset.returns.GOLD[j];
        rBtc = dataset.returns.BTC[j];
        rNvda = dataset.returns.NVDA[j];
      } else {
        // Parametric Correlated Normal: mu + L * z
        const z0 = prng.nextGaussian();
        const z1 = prng.nextGaussian();
        const z2 = prng.nextGaussian();
        const shocks = transformCorrelatedShocks(choleskyL, [z0, z1, z2]);
        rGold = dailyMeans[0] + shocks[0];
        rBtc = dailyMeans[1] + shocks[1];
        rNvda = dailyMeans[2] + shocks[2];
      }

      // 2. Position value evolution with bankruptcy clamping (r* <= -100% -> V_i = 0)
      const prevCapGold = capGold;
      const prevCapBtc = capBtc;
      const prevCapNvda = capNvda;
      const prevWealth = currentWealth;

      capGold = Math.max(0, prevCapGold * (1 + rGold));
      capBtc = Math.max(0, prevCapBtc * (1 + rBtc));
      capNvda = Math.max(0, prevCapNvda * (1 + rNvda));
      currentWealth = capGold + capBtc + capNvda;

      // Realized daily portfolio return
      const portReturn = prevWealth > 0 ? (currentWealth - prevWealth) / prevWealth : 0;
      pathDailyReturns.push(portReturn);
      if (m < 200) {
        // Collect a subset of daily returns for 1-day simulated VaR
        dailyExcessReturnsPool.push(portReturn);
      }

      // 3. Rebalance Evaluation
      let rebalanceTriggered = false;
      if (rebalanceSchedule === 'DAILY') {
        rebalanceTriggered = true;
      } else if (rebalanceSchedule === 'MONTHLY' && tau % 21 === 0) {
        rebalanceTriggered = true;
      } else if (rebalanceSchedule === 'QUARTERLY' && tau % 63 === 0) {
        rebalanceTriggered = true;
      } else if (rebalanceSchedule === 'THRESHOLD' && currentWealth > 0) {
        const driftGold = capGold / currentWealth;
        const driftBtc = capBtc / currentWealth;
        const driftNvda = capNvda / currentWealth;
        if (
          Math.abs(driftGold - portfolioWeights.GOLD) >= 0.05 ||
          Math.abs(driftBtc - portfolioWeights.BTC) >= 0.05 ||
          Math.abs(driftNvda - portfolioWeights.NVDA) >= 0.05
        ) {
          rebalanceTriggered = true;
        }
      }

      // Execute rebalance if triggered
      if (rebalanceTriggered && currentWealth > 0) {
        const targetGold = portfolioWeights.GOLD * currentWealth;
        const targetBtc = portfolioWeights.BTC * currentWealth;
        const targetNvda = portfolioWeights.NVDA * currentWealth;

        const turnover =
          Math.abs(targetGold - capGold) +
          Math.abs(targetBtc - capBtc) +
          Math.abs(targetNvda - capNvda);

        let fee = 0;
        if (includeTransactionCosts && transactionCostBps > 0) {
          fee = turnover * (transactionCostBps / 10000);
        }

        currentWealth = Math.max(0, currentWealth - fee);
        capGold = portfolioWeights.GOLD * currentWealth;
        capBtc = portfolioWeights.BTC * currentWealth;
        capNvda = portfolioWeights.NVDA * currentWealth;
      }

      // 4. Peak and Drawdown Tracking
      if (currentWealth > peakWealth) {
        peakWealth = currentWealth;
      }
      const dd = peakWealth > 0 ? (currentWealth - peakWealth) / peakWealth : 0;
      if (dd < maxDd) {
        maxDd = dd;
      }

      // Record trajectory snapshot if day matches recorded grid
      if (dayIndexMap.has(tau)) {
        const gridIdx = dayIndexMap.get(tau)!;
        trajectoryGrid[gridIdx][m] = currentWealth;
      }

      if (sampleIndices.has(m) && dayIndexMap.has(tau)) {
        samplePathValues.get(m)!.push(currentWealth);
      }
    }

    // Path Summary Metrics
    terminalWealths[m] = currentWealth;
    const totRet = (currentWealth - initialCapital) / initialCapital;
    totalReturns[m] = totRet;
    maxDrawdowns[m] = maxDd;

    if (horizonDays >= 63) {
      const cagr = currentWealth > 0 ? Math.pow(currentWealth / initialCapital, 252 / horizonDays) - 1 : -1;
      cagrs.push(cagr * 100);

      // Path Sharpe ratio
      const rfDaily = 0.04 / 252;
      let sumExcess = 0;
      for (const r of pathDailyReturns) {
        sumExcess += r - rfDaily;
      }
      const meanExcess = sumExcess / horizonDays;
      let sumSq = 0;
      for (const r of pathDailyReturns) {
        const dev = r - (meanExcess + rfDaily);
        sumSq += dev * dev;
      }
      const stdDaily = Math.sqrt(sumSq / (horizonDays - 1));
      const sharpe = stdDaily > 1e-6 ? (meanExcess / stdDaily) * Math.sqrt(252) : 0;
      sharpeRatios.push(sharpe);
    }
  }

  // Calculate trajectory bands (P05, P25, P50, P75, P95) across days
  const p05Path: number[] = [];
  const p25Path: number[] = [];
  const p50Path: number[] = [];
  const p75Path: number[] = [];
  const p95Path: number[] = [];

  for (let s = 0; s < recordedDays.length; s++) {
    const dayVals = trajectoryGrid[s].sort((a, b) => a - b);
    p05Path.push(calculatePercentile(dayVals, 0.05));
    p25Path.push(calculatePercentile(dayVals, 0.25));
    p50Path.push(calculatePercentile(dayVals, 0.50));
    p75Path.push(calculatePercentile(dayVals, 0.75));
    p95Path.push(calculatePercentile(dayVals, 0.95));
  }

  const trajectoryBands: SimulationTrajectoryBands = {
    days: recordedDays,
    p05Path,
    p25Path,
    p50Path,
    p75Path,
    p95Path,
  };

  // Convert representative sample paths
  const samplePaths: SamplePath[] = [];
  let pathIdCounter = 1;
  for (const [mIdx, vals] of samplePathValues.entries()) {
    samplePaths.push({
      pathId: pathIdCounter++,
      terminalWealth: terminalWealths[mIdx],
      totalReturnPct: totalReturns[mIdx] * 100,
      maxDrawdownPct: maxDrawdowns[mIdx] * 100,
      values: vals,
    });
  }

  // Calculate distribution percentiles
  const termWealthArray = Array.from(terminalWealths);
  const totalReturnArray = Array.from(totalReturns).map(r => r * 100);
  const maxDdArray = Array.from(maxDrawdowns).map(d => d * 100);

  const terminalWealth = calculatePercentileSummary(termWealthArray);
  const totalReturn = calculatePercentileSummary(totalReturnArray);
  const maxDrawdown = calculatePercentileSummary(maxDdArray);
  const cagr = cagrs.length > 0 ? calculatePercentileSummary(cagrs) : undefined;
  const sharpeRatio = sharpeRatios.length > 0 ? calculatePercentileSummary(sharpeRatios) : undefined;

  // Calculate Tail Risk & Loss Frequencies
  let lossCount = 0;
  let mdd10Count = 0;
  let mdd20Count = 0;
  let mdd30Count = 0;

  for (let m = 0; m < simulationCount; m++) {
    if (terminalWealths[m] < initialCapital) lossCount++;
    if (maxDrawdowns[m] <= -0.10) mdd10Count++;
    if (maxDrawdowns[m] <= -0.20) mdd20Count++;
    if (maxDrawdowns[m] <= -0.30) mdd30Count++;
  }

  const lossFrequency = lossCount / simulationCount;
  const lossFrequencyPct = lossFrequency * 100;
  const drawdownExceedance10Pct = (mdd10Count / simulationCount) * 100;
  const drawdownExceedance20Pct = (mdd20Count / simulationCount) * 100;
  const drawdownExceedance30Pct = (mdd30Count / simulationCount) * 100;

  // Simulated 1-Day VaR/CVaR (L = -R convention)
  const losses1Day = dailyExcessReturnsPool.map(r => -r * 100).sort((a, b) => a - b);
  const oneDayVaR95 = calculatePercentile(losses1Day, 0.95);
  const tail1Day = losses1Day.filter(l => l >= oneDayVaR95);
  const oneDayCVaR95 = tail1Day.length > 0 ? tail1Day.reduce((a, b) => a + b, 0) / tail1Day.length : oneDayVaR95;

  // Horizon VaR/CVaR (L = -R convention on terminal returns)
  const horizonLosses = totalReturnArray.map(r => -r).sort((a, b) => a - b);
  const horizonVaR95 = calculatePercentile(horizonLosses, 0.95);
  const tailHorizon = horizonLosses.filter(l => l >= horizonVaR95);
  const horizonCVaR95 = tailHorizon.length > 0 ? tailHorizon.reduce((a, b) => a + b, 0) / tailHorizon.length : horizonVaR95;

  const riskMetrics: MonteCarloRiskMetrics = {
    lossFrequency,
    lossFrequencyPct,
    drawdownExceedance10Pct,
    drawdownExceedance20Pct,
    drawdownExceedance30Pct,
    oneDaySimulatedVaR95: oneDayVaR95,
    oneDaySimulatedCVaR95: oneDayCVaR95,
    horizonSimulatedVaR95: horizonVaR95,
    horizonSimulatedCVaR95: horizonCVaR95,
  };

  const fingerprint = generateSimulationFingerprint(
    method,
    seed,
    simulationCount,
    horizonDays,
    initialCapital,
    portfolioWeights,
    rebalanceSchedule,
    transactionCostBps
  );

  const provenance: MonteCarloProvenance = {
    dataSource: 'OFFLINE_DEMO',
    dataSourceLabel: 'Offline Simulated Demonstration Dataset',
    dataWindow: {
      startDate: '2019-01-01',
      endDate: '2023-12-31',
      observationCount: dataset.observationCount,
    },
    simulationMethod: method,
    simulationCount,
    horizonDays,
    seed,
    portfolioWeights,
    rebalanceSchedule,
    transactionCostBps,
    fingerprint,
    generatedTimestamp: Date.now(),
  };

  return {
    fingerprint,
    provenance,
    terminalWealth,
    totalReturn,
    maxDrawdown,
    cagr,
    sharpeRatio,
    riskMetrics,
    trajectoryBands,
    samplePaths,
    executionDurationMs: Date.now() - startTime,
    stabilizationApplied,
    stabilizationMagnitude,
  };
}

/**
 * Compares realized historical backtest metrics against the Monte Carlo simulation distribution.
 */
export function compareHistoricalVsMonteCarlo(
  weights: PortfolioWeights,
  rebalanceSchedule: RebalanceFrequency = 'MONTHLY',
  mcResult?: MonteCarloResult
): HistoricalVsMonteCarloComparison[] {
  // Run deterministic backtest
  const bt = runPortfolioBacktest({
    weights,
    initialCapital: 100000,
    rebalanceFrequency: rebalanceSchedule,
    transactionFee: 0.0010,
  });

  // Run or reuse Monte Carlo simulation
  const mc =
    mcResult ??
    runMonteCarloSimulation({
      method: 'HISTORICAL_BOOTSTRAP',
      portfolioWeights: weights,
      rebalanceSchedule,
      horizonDays: 252,
      simulationCount: 5000,
    });

  const comparisons: HistoricalVsMonteCarloComparison[] = [];

  // 1. Total Return
  const histReturn = bt.totalReturn;
  const mcRetMedian = mc.totalReturn.p50;
  comparisons.push({
    metricName: 'Total Return (%)',
    historicalValue: Number(histReturn.toFixed(2)),
    monteCarloMedian: Number(mcRetMedian.toFixed(2)),
    monteCarloP05: Number(mc.totalReturn.p05.toFixed(2)),
    monteCarloP95: Number(mc.totalReturn.p95.toFixed(2)),
    historicalPercentileRank: histReturn > mcRetMedian ? 75 : 25,
    interpretation:
      histReturn >= mcRetMedian
        ? 'Realized historical return met or exceeded the simulation median.'
        : 'Realized historical return trailed the simulation median.',
  });

  // 2. Maximum Drawdown
  const histMdd = bt.maxDrawdown;
  const mcMddMedian = mc.maxDrawdown.p50;
  comparisons.push({
    metricName: 'Maximum Drawdown (%)',
    historicalValue: Number(histMdd.toFixed(2)),
    monteCarloMedian: Number(mcMddMedian.toFixed(2)),
    monteCarloP05: Number(mc.maxDrawdown.p05.toFixed(2)),
    monteCarloP95: Number(mc.maxDrawdown.p95.toFixed(2)),
    historicalPercentileRank: Math.abs(histMdd) > Math.abs(mcMddMedian) ? 80 : 30,
    interpretation:
      Math.abs(histMdd) <= Math.abs(mc.maxDrawdown.p05)
        ? 'Realized peak-to-trough drawdown was well within the simulated P05 tail.'
        : 'Realized drawdown exceeded simulated P05 downside.',
  });

  // 3. Ending Capital
  const histCap = bt.endingCapital;
  const mcCapMedian = mc.terminalWealth.p50;
  comparisons.push({
    metricName: 'Terminal Wealth ($)',
    historicalValue: Number(histCap.toFixed(2)),
    monteCarloMedian: Number(mcCapMedian.toFixed(2)),
    monteCarloP05: Number(mc.terminalWealth.p05.toFixed(2)),
    monteCarloP95: Number(mc.terminalWealth.p95.toFixed(2)),
    historicalPercentileRank: histCap > mcCapMedian ? 75 : 25,
    interpretation: 'Simulated terminal wealth distribution under declared parameters.',
  });

  return comparisons;
}
