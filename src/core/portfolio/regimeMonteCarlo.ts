/**
 * BLACKBOX X — Phase 3.9
 * Regime-Aware Probabilistic Intelligence High-Level API & Cross-Regime Comparative Lab
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Features:
 * 1. Unified entry points for regime-conditioned Monte Carlo
 * 2. Cross-regime comparative matrix (BULL vs BEAR vs HIGH_VOL vs LOW_VOL)
 * 3. Ghost Mode 2.0 deterministic regime insight generator
 * 4. Strictly non-predictive institutional formatting
 */

import { PortfolioWeights, validateWeights } from './portfolioTypes';
import { RegimeType, REGIME_LABELS } from '../regimes';
import {
  RegimeMonteCarloMethod,
  RegimeMonteCarloResult,
  RegimeComparisonRow,
  RegimeComparisonMatrixResult,
  ALL_REGIMES,
} from './regimeMonteCarloTypes';
import { runRegimeMonteCarloSimulation } from './regimeMonteCarloEngine';
import { getAlignedRegimeSequence, buildRegimeTransitionMatrix } from './regimeTransition';
import { buildRegimeReturnPools } from './regimeConditionalReturns';

export * from './regimeMonteCarloTypes';
export * from './regimeTransition';
export * from './regimeConditionalReturns';
export * from './regimeMonteCarloEngine';

/**
 * Runs a deterministic multi-scenario simulation comparing all four starting regimes
 * under identical portfolio weights, horizon, method, and seed.
 */
export function compareRegimeSimulations(
  weights: Partial<PortfolioWeights>,
  method: RegimeMonteCarloMethod = 'REGIME_BOOTSTRAP',
  horizonDays = 252,
  simulationCount = 5000,
  seed = 42
): RegimeComparisonMatrixResult {
  const normalizedWeights = validateWeights(weights).normalizedWeights;
  const observations = getAlignedRegimeSequence(normalizedWeights);
  const transitionMatrix = buildRegimeTransitionMatrix(observations);

  const regimes: RegimeType[] = ['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'];
  const comparisons: Record<RegimeType, RegimeMonteCarloResult> = {} as any;
  const table: RegimeComparisonRow[] = [];

  for (const reg of regimes) {
    const hasTransitions = transitionMatrix.outgoingTransitionCounts[reg] > 0;
    if (hasTransitions) {
      const startMode = `START_${reg}` as any;
      const res = runRegimeMonteCarloSimulation({
        method,
        startingRegimeMode: startMode,
        portfolioWeights: normalizedWeights,
        horizonDays,
        simulationCount,
        seed,
      });
      comparisons[reg] = res;

      table.push({
        startingRegime: reg,
        startingRegimeLabel: REGIME_LABELS[reg],
        p50ReturnPct: res.totalReturn.p50,
        p05ReturnPct: res.totalReturn.p05,
        p95ReturnPct: res.totalReturn.p95,
        p50MaxDrawdownPct: res.maxDrawdown.p50,
        p95MaxDrawdownPct: res.maxDrawdown.p95,
        lossFrequencyPct: res.riskMetrics.lossFrequencyPct,
        medianTerminalWealth: res.terminalWealth.p50,
        oneDayVaR95: res.riskMetrics.oneDaySimulatedVaR95,
        oneDayCVaR95: res.riskMetrics.oneDaySimulatedCVaR95,
        horizonVaR95: res.riskMetrics.horizonSimulatedVaR95,
        horizonCVaR95: res.riskMetrics.horizonSimulatedCVaR95,
      });
    } else {
      // Regime with zero outgoing transitions in this dataset
      const stubRes: RegimeMonteCarloResult = {
        fingerprint: `bx-rmc-insufficient-${reg}`,
        provenance: {
          dataSource: 'OFFLINE_DEMO',
          dataSourceLabel: 'BLACKBOX Synchronized Multi-Asset Dataset',
          dataWindowDescription: 'Offline simulated common daily calendar — synchronized observations from 2019-01-01 to 2023-12-31.',
          dataWindow: {
            startDate: observations[0].date,
            endDate: observations[observations.length - 1].date,
            observationCount: observations.length,
          },
          regimeEngineVersion: 'Phase 2.0 (60-day rolling rule-based)',
          regimeObservationCounts: transitionMatrix.observationCounts,
          transitionMatrixFingerprint: 'INSUFFICIENT_DATA',
          simulationMethod: method,
          startingRegimeMode: `START_${reg}` as any,
          resolvedStartingRegime: reg,
          seed,
          simulationCount,
          horizonDays,
          portfolioWeights: normalizedWeights,
          rebalanceSchedule: 'MONTHLY',
          transactionCostBps: 10,
          conditionalMoments: {
            BULL: { mean: { GOLD: 0, BTC: 0, NVDA: 0 }, volatility: { GOLD: 0, BTC: 0, NVDA: 0 } },
            BEAR: { mean: { GOLD: 0, BTC: 0, NVDA: 0 }, volatility: { GOLD: 0, BTC: 0, NVDA: 0 } },
            HIGH_VOL: { mean: { GOLD: 0, BTC: 0, NVDA: 0 }, volatility: { GOLD: 0, BTC: 0, NVDA: 0 } },
            LOW_VOL: { mean: { GOLD: 0, BTC: 0, NVDA: 0 }, volatility: { GOLD: 0, BTC: 0, NVDA: 0 } },
          },
          regularizationMetadata: {
            BULL: { applied: false },
            BEAR: { applied: false },
            HIGH_VOL: { applied: false },
            LOW_VOL: { applied: false },
          },
          fingerprint: `bx-rmc-insufficient-${reg}`,
          generatedTimestamp: Date.now(),
        },
        startingRegimeMode: `START_${reg}` as any,
        resolvedStartingRegime: reg,
        terminalWealth: { p05: 100000, p25: 100000, p50: 100000, p75: 100000, p95: 100000 },
        totalReturn: { p05: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
        maxDrawdown: { p05: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
        riskMetrics: {
          lossFrequency: 0,
          lossFrequencyPct: 0,
          drawdownExceedance10Pct: 0,
          drawdownExceedance20Pct: 0,
          drawdownExceedance30Pct: 0,
          oneDaySimulatedVaR95: 0,
          oneDaySimulatedCVaR95: 0,
          horizonSimulatedVaR95: 0,
          horizonSimulatedCVaR95: 0,
        },
        trajectoryBands: { days: [0, horizonDays], p05Path: [100000, 100000], p25Path: [100000, 100000], p50Path: [100000, 100000], p75Path: [100000, 100000], p95Path: [100000, 100000] },
        samplePaths: [],
        pathStats: {
          terminalRegimeCounts: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
          terminalRegimeFrequencies: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
          occupancyDays: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
          occupancyFrequencies: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
          averageTransitionsPerPath: 0,
          transitionCounts: {
            BULL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
            BEAR: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
            HIGH_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
            LOW_VOL: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
          },
          averageSimulatedDuration: { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 },
        },
        executionDurationMs: 0,
        transitionMatrix,
      };

      comparisons[reg] = stubRes;
      table.push({
        startingRegime: reg,
        startingRegimeLabel: `${REGIME_LABELS[reg]} (N/A - Insufficient Data)`,
        p50ReturnPct: 0,
        p05ReturnPct: 0,
        p95ReturnPct: 0,
        p50MaxDrawdownPct: 0,
        p95MaxDrawdownPct: 0,
        lossFrequencyPct: 0,
        medianTerminalWealth: 100000,
        oneDayVaR95: 0,
        oneDayCVaR95: 0,
        horizonVaR95: 0,
        horizonCVaR95: 0,
      });
    }
  }

  return {
    method,
    horizonDays,
    simulationCount,
    portfolioWeights: normalizedWeights,
    comparisons,
    table,
    transitionMatrix,
  };
}

export interface RegimeGhostInsight {
  category:
    | 'REGIME_OUTCOME_DIVERGENCE'
    | 'REGIME_DRAWDOWN_PRESSURE'
    | 'REGIME_TRANSITION_RISK'
    | 'REGIME_PERSISTENCE'
    | 'REGIME_RISK_CONTRIBUTION';
  title: string;
  observation: string;
  hypothesis: string;
  evidence: string;
  impact: string;
  nextTest: string;
}

/**
 * Generates deterministic Ghost Mode insights from regime Monte Carlo and transition matrices.
 */
export function generateRegimeGhostInsights(
  result: RegimeMonteCarloResult,
  comparison?: RegimeComparisonMatrixResult
): RegimeGhostInsight[] {
  const insights: RegimeGhostInsight[] = [];
  const trans = result.transitionMatrix;

  // 1. REGIME_PERSISTENCE
  for (const r of ALL_REGIMES) {
    const pii = trans.selfTransitionProbability[r];
    if (pii >= 0.85) {
      insights.push({
        category: 'REGIME_PERSISTENCE',
        title: `High State Persistence in ${REGIME_LABELS[r]}`,
        observation: `Empirical self-transition probability P_${r},${r} is ${(pii * 100).toFixed(1)}% with an average observed dwell time of ${trans.averageDuration[r]} days.`,
        hypothesis: `Simulations initialized in ${REGIME_LABELS[r]} will exhibit extended path exposure before transitioning to other market regimes.`,
        evidence: `Markov geometric duration is ${trans.expectedMarkovDuration[r]} days, and observed bout length averages ${trans.averageDuration[r]} consecutive trading sessions.`,
        impact: `Path variance is heavily determined by early regime conditions rather than rapid mean-reversion.`,
        nextTest: `Simulate over a shorter horizon (e.g. 63 days) to isolate single-regime dwell impact.`,
      });
      break; // Pick most prominent
    }
  }

  // 2. REGIME_TRANSITION_RISK
  const pBullHvol = trans.probabilities.BULL.HIGH_VOL;
  if (pBullHvol > 0.05) {
    insights.push({
      category: 'REGIME_TRANSITION_RISK',
      title: 'Elevated Bull to High Volatility Transition Frequency',
      observation: `Observed transition frequency from Bull to High Volatility is ${(pBullHvol * 100).toFixed(1)}%.`,
      hypothesis: `Favorable trending regimes exhibit non-trivial empirical probability of direct transition into elevated volatility without intermediate stagnation.`,
      evidence: `${trans.counts.BULL.HIGH_VOL} transitions occurred from Bull directly to High Volatility over the synchronized observation window.`,
      impact: `Simulated Bull paths must account for abrupt tail risk shifts without assuming a protracted Bear deceleration phase.`,
      nextTest: `Evaluate drawdown exceedance frequencies under START_BULL across 10,000 paths.`,
    });
  }

  // 3. REGIME_OUTCOME_DIVERGENCE & REGIME_DRAWDOWN_PRESSURE (if comparison is available)
  if (comparison && comparison.comparisons.BULL && comparison.comparisons.BEAR) {
    const bullP50 = comparison.comparisons.BULL.terminalWealth.p50;
    const bearP50 = comparison.comparisons.BEAR.terminalWealth.p50;
    const diffPct = Math.abs((bullP50 - bearP50) / bearP50) * 100;

    if (diffPct > 5.0) {
      insights.push({
        category: 'REGIME_OUTCOME_DIVERGENCE',
        title: 'Starting Regime Terminal Outcome Divergence',
        observation: `Simulations starting in Bull produced median terminal wealth of $${bullP50.toLocaleString()} versus $${bearP50.toLocaleString()} starting in Bear (divergence of ${diffPct.toFixed(1)}%).`,
        hypothesis: `Initial macroeconomic regime creates path-dependent capital divergence that persists through a ${comparison.horizonDays}-day horizon despite empirical regime switching.`,
        evidence: `P50 terminal wealth differs by $${Math.abs(bullP50 - bearP50).toLocaleString()} across ${comparison.simulationCount.toLocaleString()} paths per regime.`,
        impact: `Horizon terminal expectations cannot be treated as regime-agnostic.`,
        nextTest: `Increase simulation horizon to 504 days to measure long-term ergodic convergence.`,
      });
    }

    const hvolMddP95 = comparison.comparisons.HIGH_VOL?.maxDrawdown.p95;
    const bullMddP95 = comparison.comparisons.BULL?.maxDrawdown.p95;
    if (hvolMddP95 !== undefined && bullMddP95 !== undefined && hvolMddP95 < bullMddP95) {
      insights.push({
        category: 'REGIME_DRAWDOWN_PRESSURE',
        title: 'Asymmetric Tail Drawdown Exposure in High Volatility',
        observation: `P95 simulated maximum drawdown starting in High Volatility reaches ${hvolMddP95.toFixed(1)}% compared to ${bullMddP95.toFixed(1)}% starting in Bull.`,
        hypothesis: `Volatility clustering and empirical high-volatility return distributions disproportionately amplify downside tail risk in the initial simulation stages.`,
        evidence: `Loss frequency under High Volatility is ${comparison.comparisons.HIGH_VOL.riskMetrics.lossFrequencyPct.toFixed(1)}% versus ${comparison.comparisons.BULL.riskMetrics.lossFrequencyPct.toFixed(1)}% under Bull.`,
        impact: `Portfolios requiring capital protection during high volatility require distinct risk budgeting.`,
        nextTest: `Compare monthly versus threshold rebalancing under START_HIGH_VOL.`,
      });
    }
  }

  // 4. REGIME_RISK_CONTRIBUTION
  const observations = getAlignedRegimeSequence(result.provenance.portfolioWeights);
  const pools = buildRegimeReturnPools(observations, result.provenance.portfolioWeights);
  if (pools.HIGH_VOL.riskContribution && pools.LOW_VOL.riskContribution) {
    const btcHvolPrc = pools.HIGH_VOL.riskContribution.percentageRisk.BTC * 100;
    const btcLvolPrc = pools.LOW_VOL.riskContribution.percentageRisk.BTC * 100;
    if (Math.abs(btcHvolPrc - btcLvolPrc) > 10) {
      insights.push({
        category: 'REGIME_RISK_CONTRIBUTION',
        title: 'Regime-Dependent Risk Contribution Shift',
        observation: `Bitcoin Percentage Risk Contribution shifts from ${btcLvolPrc.toFixed(1)}% in Low Volatility to ${btcHvolPrc.toFixed(1)}% in High Volatility.`,
        hypothesis: `Asset volatility expansion and cross-asset correlation asymmetry alter effective risk allocation across market regimes.`,
        evidence: `Conditional covariance calculations show Bitcoin variance expanding by ${(pools.HIGH_VOL.volatility.BTC / (pools.LOW_VOL.volatility.BTC || 1)).toFixed(1)}x between Low and High Volatility.`,
        impact: `Equal-weight allocations become substantially more concentrated in risk during turbulent regimes.`,
        nextTest: `Run Risk Parity optimization conditioned on High Volatility covariance matrix.`,
      });
    }
  }

  return insights;
}
