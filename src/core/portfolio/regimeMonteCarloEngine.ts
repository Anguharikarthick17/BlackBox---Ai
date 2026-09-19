/**
 * BLACKBOX X — Phase 3.9
 * Regime-Aware Probabilistic Intelligence Simulation Engine
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Implements:
 * 1. Regime-Conditioned Joint Bootstrap (indivisible multi-asset vector resampling)
 * 2. Regime-Conditioned Parametric Correlated Normal (Cholesky of conditional Sigma_r)
 * 3. Starting Regime Initialization (Fixed BULL/BEAR/HVOL/LVOL, CURRENT, or EMPIRICAL_DISTRIBUTION)
 * 4. Day-1 Return Semantics: Day 1 generated from R_0, transition at close of day 1 for day 2
 * 5. Discrete-Time Markov Regime Switching governed strictly by empirical transition matrix P_ij
 * 6. Portfolio Accounting: Buy & Hold organic drift vs. rebalancing, 10 bps friction, bankruptcy clamping
 * 7. Path Statistics: Regime occupancy, dwell time, terminal frequencies, transition conservation
 * 8. Tail Risk & Percentile Distributions (P05, P25, P50, P75, P95, VaR95/CVaR95)
 * 9. Deterministic Seeded PRNG & Canonical Audit Fingerprint
 */

import { Asset, PortfolioWeights } from './portfolioTypes';
import { RegimeType } from '../regimes';
import {
  ALL_REGIMES,
  RegimeMonteCarloConfig,
  RegimeMonteCarloResult,
  RegimeMonteCarloProvenance,
  RegimeSimulationPathStats,
  PercentileSummary,
  validateRegimeMonteCarloConfig,
} from './regimeMonteCarloTypes';
import { getAlignedRegimeSequence, buildRegimeTransitionMatrix } from './regimeTransition';
import { buildRegimeReturnPools } from './regimeConditionalReturns';
import { DeterministicPRNG } from './prng';
import { transformCorrelatedShocks } from './cholesky';
import {
  calculatePercentile,
  calculatePercentileSummary,
} from './monteCarloEngine';
import { SamplePath, SimulationTrajectoryBands } from './monteCarloTypes';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Generates a canonical fingerprint string uniquely identifying the regime simulation configuration.
 */
export function generateRegimeSimulationFingerprint(
  method: string,
  startingMode: string,
  seed: number,
  simulationCount: number,
  horizonDays: number,
  initialCapital: number,
  weights: PortfolioWeights,
  schedule: string,
  bps: number,
  transitionMatrixHash: string
): string {
  const payload = `REGIME|${method}|${startingMode}|${seed}|${simulationCount}|${horizonDays}|${initialCapital}|${weights.GOLD.toFixed(4)},${weights.BTC.toFixed(4)},${weights.NVDA.toFixed(4)}|${schedule}|${bps}|${transitionMatrixHash}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i++) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `bx-rmc-${hex}-${seed}`;
}

/**
 * Simulates a single transition from originating regime `from` using empirical row probabilities.
 */
export function sampleNextRegime(
  from: RegimeType,
  probabilities: Record<RegimeType, Record<RegimeType, number>>,
  prng: DeterministicPRNG
): RegimeType {
  const row = probabilities[from];
  const u = prng.next(); // [0, 1)

  let cumulative = 0;
  for (const reg of ALL_REGIMES) {
    cumulative += row[reg] || 0;
    if (u < cumulative) {
      return reg;
    }
  }
  // Fallback to current regime if row sum is slightly < 1.0 due to rounding
  return from;
}

/**
 * Executes a full regime-conditioned Monte Carlo simulation according to the approved architecture.
 */
export function runRegimeMonteCarloSimulation(
  userConfig: RegimeMonteCarloConfig
): RegimeMonteCarloResult {
  const startTime = Date.now();
  const valRes = validateRegimeMonteCarloConfig(userConfig);
  if (!valRes.isValid || !valRes.sanitizedConfig) {
    throw new Error(`Regime Monte Carlo Configuration Error: ${valRes.error}`);
  }

  const config = valRes.sanitizedConfig;
  const {
    method,
    startingRegimeMode,
    portfolioWeights,
    simulationCount,
    horizonDays,
    seed,
    initialCapital,
    rebalanceSchedule,
    includeTransactionCosts,
    transactionCostBps,
  } = config;

  // 1. Retrieve synchronized historical regime sequence (T = 1,825)
  const observations = getAlignedRegimeSequence(portfolioWeights);
  const T = observations.length;
  if (T === 0) {
    throw new Error('No synchronized observation data available for regime simulation.');
  }

  // 2. Build empirical transition matrix
  const transitionMatrix = buildRegimeTransitionMatrix(observations);

  // 3. Build conditional return pools and moments
  const pools = buildRegimeReturnPools(observations, portfolioWeights);

  // 4. Resolve starting regime or empirical distribution
  const latestObservedRegime = observations[T - 1].regime;
  let resolvedStartingRegime: RegimeType | 'EMPIRICAL_DISTRIBUTION' = 'BULL';

  switch (startingRegimeMode) {
    case 'START_BULL':
      resolvedStartingRegime = 'BULL';
      break;
    case 'START_BEAR':
      resolvedStartingRegime = 'BEAR';
      break;
    case 'START_HIGH_VOL':
      resolvedStartingRegime = 'HIGH_VOL';
      break;
    case 'START_LOW_VOL':
      resolvedStartingRegime = 'LOW_VOL';
      break;
    case 'START_CURRENT_OBSERVED':
      resolvedStartingRegime = latestObservedRegime;
      break;
    case 'START_EMPIRICAL_DISTRIBUTION':
      resolvedStartingRegime = 'EMPIRICAL_DISTRIBUTION';
      break;
  }

  // Check sparse & insufficient transition policy on the selected starting regime
  if (
    resolvedStartingRegime !== 'EMPIRICAL_DISTRIBUTION' &&
    transitionMatrix.outgoingTransitionCounts[resolvedStartingRegime] === 0
  ) {
    throw new Error(
      `Cannot execute regime-conditioned Monte Carlo: Starting regime ${resolvedStartingRegime} has zero observed outgoing transitions (INSUFFICIENT_TRANSITION_DATA).`
    );
  }

  // Pre-calculate transition matrix hash for provenance
  const transitionMatrixHash = `${transitionMatrix.probabilities.BULL.BULL.toFixed(3)}_${transitionMatrix.probabilities.BEAR.BEAR.toFixed(3)}_${transitionMatrix.probabilities.HIGH_VOL.HIGH_VOL.toFixed(3)}_${transitionMatrix.probabilities.LOW_VOL.LOW_VOL.toFixed(3)}`;
  const fingerprint = generateRegimeSimulationFingerprint(
    method,
    startingRegimeMode,
    seed,
    simulationCount,
    horizonDays,
    initialCapital,
    portfolioWeights,
    rebalanceSchedule,
    transactionCostBps,
    transitionMatrixHash
  );

  // 5. Initialize PRNG and simulation collectors
  const prng = new DeterministicPRNG(seed);

  const terminalWealths = new Float64Array(simulationCount);
  const totalReturns = new Float64Array(simulationCount);
  const maxDrawdowns = new Float64Array(simulationCount);
  const cagrs: number[] = [];
  const sharpeRatios: number[] = [];

  // Path statistics collectors
  const terminalRegimeCounts: Record<RegimeType, number> = { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 };
  const totalOccupancyDays: Record<RegimeType, number> = { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 };
  const simulatedTransitionCounts: Record<RegimeType, Record<RegimeType, number>> = {
    BULL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    BEAR: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    HIGH_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    LOW_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
  };
  let totalPathSwitches = 0;
  const simulatedBoutLengths: Record<RegimeType, number[]> = { BULL: [], BEAR: [], HIGH_VOL: [], LOW_VOL: [] };

  // Trajectory bands collectors: sample up to 101 points across horizon
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

  // Empirical distribution cumulative thresholds for START_EMPIRICAL_DISTRIBUTION
  const empThresholds = {
    bull: transitionMatrix.occupancy.BULL,
    bear: transitionMatrix.occupancy.BULL + transitionMatrix.occupancy.BEAR,
    highVol: transitionMatrix.occupancy.BULL + transitionMatrix.occupancy.BEAR + transitionMatrix.occupancy.HIGH_VOL,
  };

  // 6. Main Simulation Loop: M paths
  for (let m = 0; m < simulationCount; m++) {
    // Initial capital allocation
    let capGold = portfolioWeights.GOLD * initialCapital;
    let capBtc = portfolioWeights.BTC * initialCapital;
    let capNvda = portfolioWeights.NVDA * initialCapital;
    let currentWealth = capGold + capBtc + capNvda;

    let peakWealth = currentWealth;
    let maxDd = 0; // negative or zero
    trajectoryGrid[0][m] = currentWealth;

    // Determine path starting regime R_0
    let currentRegime: RegimeType;
    if (resolvedStartingRegime === 'EMPIRICAL_DISTRIBUTION') {
      const uStart = prng.next();
      if (uStart < empThresholds.bull) {
        currentRegime = 'BULL';
      } else if (uStart < empThresholds.bear) {
        currentRegime = 'BEAR';
      } else if (uStart < empThresholds.highVol) {
        currentRegime = 'HIGH_VOL';
      } else {
        currentRegime = 'LOW_VOL';
      }
    } else {
      currentRegime = resolvedStartingRegime;
    }

    let currentBoutLength = 0;
    let pathSwitches = 0;
    const pathDailyReturns: number[] = [];

    // Forward Step Loop: tau = 1 ... H
    for (let tau = 1; tau <= horizonDays; tau++) {
      totalOccupancyDays[currentRegime]++;
      currentBoutLength++;

      // Step 2a: Sample return vector r* conditional on active currentRegime
      let rGold = 0;
      let rBtc = 0;
      let rNvda = 0;

      const activePool = pools[currentRegime];

      if (method === 'REGIME_BOOTSTRAP') {
        const poolVectors = activePool.vectors;
        if (poolVectors.length > 0) {
          const k = prng.nextInt(0, poolVectors.length - 1);
          const v = poolVectors[k];
          rGold = v[0];
          rBtc = v[1];
          rNvda = v[2];
        } else {
          // Fallback if sparse regime has 0 vectors
          rGold = 0;
          rBtc = 0;
          rNvda = 0;
        }
      } else {
        // REGIME_PARAMETRIC: mu_R + L_R * z
        const z0 = prng.nextGaussian();
        const z1 = prng.nextGaussian();
        const z2 = prng.nextGaussian();
        const shocks = transformCorrelatedShocks(activePool.choleskyL, [z0, z1, z2]);
        rGold = activePool.mean.GOLD + shocks[0];
        rBtc = activePool.mean.BTC + shocks[1];
        rNvda = activePool.mean.NVDA + shocks[2];
      }

      // Step 2b: Portfolio Accounting & Bankruptcy Clamping (r* <= -100% -> V_i = 0)
      const prevCapGold = capGold;
      const prevCapBtc = capBtc;
      const prevCapNvda = capNvda;
      const prevWealth = currentWealth;

      capGold = Math.max(0, prevCapGold * (1 + rGold));
      capBtc = Math.max(0, prevCapBtc * (1 + rBtc));
      capNvda = Math.max(0, prevCapNvda * (1 + rNvda));
      currentWealth = capGold + capBtc + capNvda;

      const portReturn = prevWealth > 0 ? (currentWealth - prevWealth) / prevWealth : 0;
      pathDailyReturns.push(portReturn);
      if (m < 200) {
        dailyExcessReturnsPool.push(portReturn);
      }

      // Step 2c: Rebalancing Friction
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

      if (rebalanceTriggered && currentWealth > 0) {
        const targetGold = portfolioWeights.GOLD * currentWealth;
        const targetBtc = portfolioWeights.BTC * currentWealth;
        const targetNvda = portfolioWeights.NVDA * currentWealth;

        const turnover =
          Math.abs(targetGold - capGold) +
          Math.abs(targetBtc - capBtc) +
          Math.abs(targetNvda - capNvda);

        if (includeTransactionCosts && turnover > 0) {
          const frictionFee = turnover * (transactionCostBps / 10000) * 0.5;
          currentWealth = Math.max(0, currentWealth - frictionFee);
          capGold = portfolioWeights.GOLD * currentWealth;
          capBtc = portfolioWeights.BTC * currentWealth;
          capNvda = portfolioWeights.NVDA * currentWealth;
        } else {
          capGold = targetGold;
          capBtc = targetBtc;
          capNvda = targetNvda;
        }
      }

      // Drawdown update
      if (currentWealth > peakWealth) {
        peakWealth = currentWealth;
      }
      const dd = peakWealth > 0 ? (currentWealth - peakWealth) / peakWealth : -1.0;
      if (dd < maxDd) {
        maxDd = dd;
      }

      // Record trajectory snapshot if day matches interval
      const dayIdx = dayIndexMap.get(tau);
      if (dayIdx !== undefined) {
        trajectoryGrid[dayIdx][m] = currentWealth;
      }

      // Record representative sample path
      if (samplePathValues.has(m)) {
        samplePathValues.get(m)!.push(currentWealth);
      }

      // Step 2d: Day-1 Return Semantics & Regime Transition
      // Transition happens after day tau is finished, determining regime for day tau + 1
      if (tau < horizonDays) {
        const nextRegime = sampleNextRegime(currentRegime, transitionMatrix.probabilities, prng);
        simulatedTransitionCounts[currentRegime][nextRegime]++;

        if (nextRegime !== currentRegime) {
          simulatedBoutLengths[currentRegime].push(currentBoutLength);
          currentBoutLength = 0;
          pathSwitches++;
          currentRegime = nextRegime;
        }
      } else {
        // Record final bout length at terminal day
        simulatedBoutLengths[currentRegime].push(currentBoutLength);
      }
    }

    terminalRegimeCounts[currentRegime]++;
    totalPathSwitches += pathSwitches;

    terminalWealths[m] = currentWealth;
    const pathTotalReturn = (currentWealth - initialCapital) / initialCapital;
    totalReturns[m] = pathTotalReturn;
    maxDrawdowns[m] = maxDd;

    // Evaluate CAGR and Sharpe if horizon is at least 63 days (quarter)
    if (horizonDays >= 63) {
      const years = horizonDays / 252;
      const cagr = currentWealth > 0 ? (Math.pow(currentWealth / initialCapital, 1 / years) - 1) * 100 : -100;
      cagrs.push(cagr);

      const pathMean = pathDailyReturns.reduce((a, b) => a + b, 0) / horizonDays;
      let pathVar = 0;
      for (let i = 0; i < horizonDays; i++) {
        pathVar += Math.pow(pathDailyReturns[i] - pathMean, 2);
      }
      const pathVol = Math.sqrt(pathVar / (horizonDays - 1)) * Math.sqrt(252);
      const riskFreeRate = 0.04;
      const excessReturn = pathMean * 252 - riskFreeRate;
      const sharpe = pathVol > 1e-9 ? excessReturn / pathVol : 0;
      sharpeRatios.push(sharpe);
    }
  }

  // 7. Calculate Aggregates and Percentile Trajectory Bands
  const sortedWealth = Array.from(terminalWealths).sort((a, b) => a - b);
  const sortedReturns = Array.from(totalReturns).map(r => r * 100).sort((a, b) => a - b);
  const sortedDrawdowns = Array.from(maxDrawdowns).map(d => d * 100).sort((a, b) => a - b);

  const terminalWealthSummary: PercentileSummary = {
    p05: calculatePercentile(sortedWealth, 0.05),
    p25: calculatePercentile(sortedWealth, 0.25),
    p50: calculatePercentile(sortedWealth, 0.50),
    p75: calculatePercentile(sortedWealth, 0.75),
    p95: calculatePercentile(sortedWealth, 0.95),
  };

  const totalReturnSummary: PercentileSummary = {
    p05: calculatePercentile(sortedReturns, 0.05),
    p25: calculatePercentile(sortedReturns, 0.25),
    p50: calculatePercentile(sortedReturns, 0.50),
    p75: calculatePercentile(sortedReturns, 0.75),
    p95: calculatePercentile(sortedReturns, 0.95),
  };

  const maxDrawdownSummary: PercentileSummary = {
    p05: calculatePercentile(sortedDrawdowns, 0.05),
    p25: calculatePercentile(sortedDrawdowns, 0.25),
    p50: calculatePercentile(sortedDrawdowns, 0.50),
    p75: calculatePercentile(sortedDrawdowns, 0.75),
    p95: calculatePercentile(sortedDrawdowns, 0.95),
  };

  let cagrSummary: PercentileSummary | undefined = undefined;
  let sharpeSummary: PercentileSummary | undefined = undefined;

  if (horizonDays >= 63 && cagrs.length > 0) {
    cagrSummary = calculatePercentileSummary(cagrs);
    sharpeSummary = calculatePercentileSummary(sharpeRatios);
  }

  // Trajectory bands across recorded days
  const trajectoryBands: SimulationTrajectoryBands = {
    days: recordedDays,
    p05Path: [],
    p25Path: [],
    p50Path: [],
    p75Path: [],
    p95Path: [],
  };

  for (let s = 0; s < recordedDays.length; s++) {
    const rowValues = trajectoryGrid[s].sort((a, b) => a - b);
    trajectoryBands.p05Path.push(calculatePercentile(rowValues, 0.05));
    trajectoryBands.p25Path.push(calculatePercentile(rowValues, 0.25));
    trajectoryBands.p50Path.push(calculatePercentile(rowValues, 0.50));
    trajectoryBands.p75Path.push(calculatePercentile(rowValues, 0.75));
    trajectoryBands.p95Path.push(calculatePercentile(rowValues, 0.95));
  }

  // Format 50 representative sample paths
  const samplePaths: SamplePath[] = [];
  sampleIndices.forEach(idx => {
    const values = samplePathValues.get(idx) || [];
    const term = terminalWealths[idx];
    const ret = totalReturns[idx] * 100;
    const mdd = maxDrawdowns[idx] * 100;
    samplePaths.push({
      pathId: idx,
      terminalWealth: term,
      totalReturnPct: ret,
      maxDrawdownPct: mdd,
      values,
    });
  });

  // Risk metrics & exceedance frequencies
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

  // Tail Risk VaR / CVaR
  const sortedLosses = Array.from(totalReturns).map(r => -r * 100).sort((a, b) => a - b);
  const horizonSimulatedVaR95 = calculatePercentile(sortedLosses, 0.95);
  const cutoffIndex = Math.floor(0.95 * sortedLosses.length);
  const tailHorizonLosses = sortedLosses.slice(cutoffIndex);
  const horizonSimulatedCVaR95 =
    tailHorizonLosses.length > 0
      ? tailHorizonLosses.reduce((a, b) => a + b, 0) / tailHorizonLosses.length
      : horizonSimulatedVaR95;

  // 1-day simulated VaR/CVaR from sample pool
  const sortedDailyLosses = dailyExcessReturnsPool.map(r => -r * 100).sort((a, b) => a - b);
  const oneDaySimulatedVaR95 = calculatePercentile(sortedDailyLosses, 0.95);
  const dailyCutoff = Math.floor(0.95 * sortedDailyLosses.length);
  const tailDailyLosses = sortedDailyLosses.slice(dailyCutoff);
  const oneDaySimulatedCVaR95 =
    tailDailyLosses.length > 0
      ? tailDailyLosses.reduce((a, b) => a + b, 0) / tailDailyLosses.length
      : oneDaySimulatedVaR95;

  // 8. Path Statistics Aggregation
  const totalSimulatedDays = simulationCount * horizonDays;
  const occupancyFrequencies: Record<RegimeType, number> = {
    BULL: totalOccupancyDays.BULL / totalSimulatedDays,
    BEAR: totalOccupancyDays.BEAR / totalSimulatedDays,
    HIGH_VOL: totalOccupancyDays.HIGH_VOL / totalSimulatedDays,
    LOW_VOL: totalOccupancyDays.LOW_VOL / totalSimulatedDays,
  };

  const terminalRegimeFrequencies: Record<RegimeType, number> = {
    BULL: terminalRegimeCounts.BULL / simulationCount,
    BEAR: terminalRegimeCounts.BEAR / simulationCount,
    HIGH_VOL: terminalRegimeCounts.HIGH_VOL / simulationCount,
    LOW_VOL: terminalRegimeCounts.LOW_VOL / simulationCount,
  };

  const averageSimulatedDuration: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  for (const r of ALL_REGIMES) {
    const list = simulatedBoutLengths[r];
    if (list.length > 0) {
      averageSimulatedDuration[r] = parseFloat((list.reduce((a, b) => a + b, 0) / list.length).toFixed(1));
    }
  }

  const pathStats: RegimeSimulationPathStats = {
    terminalRegimeCounts,
    terminalRegimeFrequencies,
    occupancyDays: {
      BULL: parseFloat((totalOccupancyDays.BULL / simulationCount).toFixed(1)),
      BEAR: parseFloat((totalOccupancyDays.BEAR / simulationCount).toFixed(1)),
      HIGH_VOL: parseFloat((totalOccupancyDays.HIGH_VOL / simulationCount).toFixed(1)),
      LOW_VOL: parseFloat((totalOccupancyDays.LOW_VOL / simulationCount).toFixed(1)),
    },
    occupancyFrequencies,
    averageTransitionsPerPath: parseFloat((totalPathSwitches / simulationCount).toFixed(2)),
    transitionCounts: simulatedTransitionCounts,
    averageSimulatedDuration,
  };

  // 9. Provenance Compilation
  const conditionalMoments: Record<RegimeType, { mean: Record<Asset, number>; volatility: Record<Asset, number> }> = {
    BULL: { mean: pools.BULL.mean, volatility: pools.BULL.volatility },
    BEAR: { mean: pools.BEAR.mean, volatility: pools.BEAR.volatility },
    HIGH_VOL: { mean: pools.HIGH_VOL.mean, volatility: pools.HIGH_VOL.volatility },
    LOW_VOL: { mean: pools.LOW_VOL.mean, volatility: pools.LOW_VOL.volatility },
  };

  const regularizationMetadata: Record<RegimeType, { applied: boolean; lambda?: number }> = {
    BULL: { applied: pools.BULL.regularizationApplied, lambda: pools.BULL.regularizationMagnitude },
    BEAR: { applied: pools.BEAR.regularizationApplied, lambda: pools.BEAR.regularizationMagnitude },
    HIGH_VOL: { applied: pools.HIGH_VOL.regularizationApplied, lambda: pools.HIGH_VOL.regularizationMagnitude },
    LOW_VOL: { applied: pools.LOW_VOL.regularizationApplied, lambda: pools.LOW_VOL.regularizationMagnitude },
  };

  const provenance: RegimeMonteCarloProvenance = {
    dataSource: 'OFFLINE_DEMO',
    dataSourceLabel: 'BLACKBOX Synchronized Multi-Asset Dataset',
    dataWindowDescription: 'Offline simulated common daily calendar — synchronized observations from 2019-01-01 to 2023-12-31.',
    dataWindow: {
      startDate: observations[0].date,
      endDate: observations[T - 1].date,
      observationCount: T,
    },
    regimeEngineVersion: 'Phase 2.0 (60-day rolling rule-based)',
    regimeObservationCounts: transitionMatrix.observationCounts,
    transitionMatrixFingerprint: transitionMatrixHash,
    simulationMethod: method,
    startingRegimeMode,
    resolvedStartingRegime,
    seed,
    simulationCount,
    horizonDays,
    portfolioWeights,
    rebalanceSchedule,
    transactionCostBps,
    conditionalMoments,
    regularizationMetadata,
    fingerprint,
    generatedTimestamp: Date.now(),
  };

  return {
    fingerprint,
    provenance,
    startingRegimeMode,
    resolvedStartingRegime,
    terminalWealth: terminalWealthSummary,
    totalReturn: totalReturnSummary,
    maxDrawdown: maxDrawdownSummary,
    cagr: cagrSummary,
    sharpeRatio: sharpeSummary,
    riskMetrics: {
      lossFrequency,
      lossFrequencyPct,
      drawdownExceedance10Pct,
      drawdownExceedance20Pct,
      drawdownExceedance30Pct,
      oneDaySimulatedVaR95,
      oneDaySimulatedCVaR95,
      horizonSimulatedVaR95,
      horizonSimulatedCVaR95,
    },
    trajectoryBands,
    samplePaths,
    pathStats,
    executionDurationMs: Date.now() - startTime,
    transitionMatrix,
  };
}
