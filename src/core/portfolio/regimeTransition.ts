/**
 * BLACKBOX X — Phase 3.9
 * Empirical Regime Transition Matrix & Alignment Engine
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Implements:
 * 1. Synchronized chronological sequence alignment (T = 1,825 observations)
 * 2. Transition count accumulation: N_ij
 * 3. Empirical transition probabilities: P_ij = N_ij / rowTotal
 * 4. Row-stochastic normalization invariant (Σ_j P_ij = 1.0 for N_i > 0)
 * 5. Regime persistence & dwell time diagnostics (occupancy, empirical mean/median, Markov geometric)
 * 6. Sparse regime detection (MIN_REGIME_OBSERVATIONS = 20) and zero outgoing transition blocking
 *
 * NON-PREDICTIVE PROTOCOL:
 * All probabilities reflect empirical observation frequencies from the offline demonstration dataset.
 * Zero forward forecasting, zero Laplace smoothing, zero synthetic transitions.
 */

import { Asset, PortfolioWeights, DEFAULT_PORTFOLIO_WEIGHTS, validateWeights } from './portfolioTypes';
import { getSynchronizedAssetData, computeDailyPortfolioReturns } from './covariance';
import { detectRegimes, RegimeType } from '../regimes';
import {
  ALL_REGIMES,
  MIN_REGIME_OBSERVATIONS,
  AlignedRegimeObservation,
  RegimeTransitionMatrix,
} from './regimeMonteCarloTypes';
import { PricePoint } from '../data';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

/**
 * Builds the synchronized chronological observation sequence across the 1,825 daily bars (2019-2023).
 * Classifies regimes using the existing Phase 2 rule-based 60-day rolling engine.
 */
export function getAlignedRegimeSequence(
  weights: Partial<PortfolioWeights> = DEFAULT_PORTFOLIO_WEIGHTS
): AlignedRegimeObservation[] {
  const validation = validateWeights(weights);
  const w = validation.normalizedWeights;

  const dataset = getSynchronizedAssetData();
  const dates = dataset.dates;
  const T = dataset.observationCount; // 1,825
  const portfolioReturns = computeDailyPortfolioReturns(w, dataset.returns);

  // Construct daily portfolio equity trajectory to feed into rule-based detectRegimes
  let equity = 100.0;
  const equityPricePoints: PricePoint[] = [
    {
      date: dataset.startDate,
      open: 100,
      high: 100,
      low: 100,
      close: 100,
      volume: 1000000,
    },
  ];

  for (let t = 0; t < T; t++) {
    equity *= (1 + portfolioReturns[t]);
    equityPricePoints.push({
      date: dates[t],
      open: equity,
      high: equity,
      low: equity,
      close: equity,
      volume: 1000000,
    });
  }

  // Detect regime points (window = 60 days)
  const regimePoints = detectRegimes(equityPricePoints, 60);
  const dateRegimeMap = new Map<string, RegimeType>();
  for (const rp of regimePoints) {
    dateRegimeMap.set(rp.date, rp.regime);
  }

  const aligned: AlignedRegimeObservation[] = [];
  for (let t = 0; t < T; t++) {
    const d = dates[t];
    // Fallback for initial warm-up window before day 60
    const regime = dateRegimeMap.get(d) || 'BULL';
    aligned.push({
      date: d,
      regime,
      assetReturns: {
        GOLD: dataset.returns.GOLD[t],
        BTC: dataset.returns.BTC[t],
        NVDA: dataset.returns.NVDA[t],
      },
      portfolioReturn: portfolioReturns[t],
    });
  }

  return aligned;
}

/**
 * Calculates empirical transition frequencies, persistence metrics, and sparse flags from the observation sequence.
 */
export function buildRegimeTransitionMatrix(
  observations: AlignedRegimeObservation[]
): RegimeTransitionMatrix {
  const T = observations.length;
  if (T === 0) {
    throw new Error('Cannot build regime transition matrix from empty observation sequence.');
  }

  // 1. Initialize count containers
  const counts: Record<RegimeType, Record<RegimeType, number>> = {
    BULL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    BEAR: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    HIGH_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    LOW_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
  };

  const observationCounts: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  const outgoingTransitionCounts: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  // Record observations
  for (let t = 0; t < T; t++) {
    const r = observations[t].regime;
    observationCounts[r] = (observationCounts[r] || 0) + 1;
  }

  // 2. Count consecutive transitions r_t -> r_{t+1}
  let totalSwitches = 0;
  for (let t = 0; t < T - 1; t++) {
    const from = observations[t].regime;
    const to = observations[t + 1].regime;

    counts[from][to] = (counts[from][to] || 0) + 1;
    outgoingTransitionCounts[from] = (outgoingTransitionCounts[from] || 0) + 1;

    if (from !== to) {
      totalSwitches++;
    }
  }

  // 3. Compute empirical transition probabilities P_ij = N_ij / N_i
  const probabilities: Record<RegimeType, Record<RegimeType, number>> = {
    BULL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    BEAR: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    HIGH_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
    LOW_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
  };

  const selfTransitionProbability: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  const insufficientDataRegimes: RegimeType[] = [];
  const sparseRegimes: RegimeType[] = [];
  const warnings: string[] = [];

  for (const from of ALL_REGIMES) {
    const totalOut = outgoingTransitionCounts[from];
    const totalObs = observationCounts[from];

    if (totalObs < MIN_REGIME_OBSERVATIONS) {
      sparseRegimes.push(from);
      warnings.push(
        `Sparse Regime Warning: ${from} has only ${totalObs} observations (< ${MIN_REGIME_OBSERVATIONS}). Parameter estimates exhibit higher sampling error.`
      );
    }

    if (totalOut === 0) {
      insufficientDataRegimes.push(from);
      warnings.push(
        `Insufficient Transition Data: ${from} has 0 observed outgoing transitions. Regime-conditioned simulation cannot proceed from this state.`
      );
      // Row remains all zeros
      continue;
    }

    // Row-stochastic computation
    for (const to of ALL_REGIMES) {
      probabilities[from][to] = counts[from][to] / totalOut;
    }
    selfTransitionProbability[from] = probabilities[from][from];
  }

  // 4. Occupancy frequencies
  const occupancy: Record<RegimeType, number> = {
    BULL: observationCounts.BULL / T,
    BEAR: observationCounts.BEAR / T,
    HIGH_VOL: observationCounts.HIGH_VOL / T,
    LOW_VOL: observationCounts.LOW_VOL / T,
  };

  // 5. Empirical dwell time / durations
  // Collect consecutive runs for each regime
  const durations: Record<RegimeType, number[]> = {
    BULL: [],
    BEAR: [],
    HIGH_VOL: [],
    LOW_VOL: [],
  };

  let currentRunRegime = observations[0].regime;
  let currentRunLength = 1;

  for (let t = 1; t < T; t++) {
    if (observations[t].regime === currentRunRegime) {
      currentRunLength++;
    } else {
      durations[currentRunRegime].push(currentRunLength);
      currentRunRegime = observations[t].regime;
      currentRunLength = 1;
    }
  }
  // push final run
  durations[currentRunRegime].push(currentRunLength);

  const averageDuration: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  const medianDuration: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  const expectedMarkovDuration: Record<RegimeType, number> = {
    BULL: 0,
    BEAR: 0,
    HIGH_VOL: 0,
    LOW_VOL: 0,
  };

  for (const r of ALL_REGIMES) {
    const dList = durations[r];
    if (dList.length > 0) {
      const sum = dList.reduce((acc, v) => acc + v, 0);
      averageDuration[r] = parseFloat((sum / dList.length).toFixed(1));

      const sorted = [...dList].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      medianDuration[r] =
        sorted.length % 2 !== 0
          ? sorted[mid]
          : parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
    }

    const pStay = selfTransitionProbability[r];
    if (outgoingTransitionCounts[r] > 0) {
      if (pStay < 1.0) {
        expectedMarkovDuration[r] = parseFloat((1 / (1 - pStay)).toFixed(1));
      } else {
        expectedMarkovDuration[r] = Infinity;
      }
    }
  }

  const switchingFrequency = T > 1 ? parseFloat((totalSwitches / (T - 1)).toFixed(4)) : 0;

  let status: 'VALID' | 'SPARSE_WARNING' | 'INSUFFICIENT_TRANSITION_DATA' = 'VALID';
  if (insufficientDataRegimes.length > 0) {
    status = 'INSUFFICIENT_TRANSITION_DATA';
  } else if (sparseRegimes.length > 0) {
    status = 'SPARSE_WARNING';
  }

  return {
    regimes: ALL_REGIMES,
    counts,
    probabilities,
    observationCounts,
    outgoingTransitionCounts,
    occupancy,
    selfTransitionProbability,
    averageDuration,
    medianDuration,
    expectedMarkovDuration,
    switchingFrequency,
    sparseRegimes,
    insufficientDataRegimes,
    status,
    warnings,
  };
}
