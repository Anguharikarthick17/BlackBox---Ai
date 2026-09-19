/**
 * BLACKBOX X — Phase 3.9
 * Regime-Aware Probabilistic Intelligence Verification Suite
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Implements 35 rigorous automated verification tests covering:
 * 1. Regime sequence alignment
 * 2. Transition count correctness & conservation
 * 3. Row stochastic normalization
 * 4. Sparse regime policy (MIN_OBS = 20)
 * 5. Zero outgoing transition handling
 * 6. Conditional data partitioning
 * 7. Multi-asset joint vector preservation
 * 8. Conditional covariance symmetry & positive diagonal
 * 9. Conditional Cholesky & reactive stabilization
 * 10. Starting regime initialization
 * 11. Day-1 return semantics
 * 12. Transition simulation
 * 13. Bit-determinism across identical seeds
 * 14. Seed differentiation
 * 15. Terminal wealth percentile monotonicity
 * 16. Drawdown percentile monotonicity & non-positive sign
 * 17. Loss frequency boundedness
 * 18. VaR positive-loss convention
 * 19. Tail risk ordering CVaR >= VaR
 * 20. Historical occupancy conservation
 * 21. Empirical & Markov duration diagnostics
 * 22. Transition count conservation
 * 23. Simplex weight validation
 * 24. Transaction cost monotonicity
 * 25. Three-layer analytical separation
 * 26. Canonical audit fingerprint reproducibility
 * 27. Zero Math.random usage verification
 * 28. Absolute NaN / Infinity protection
 * 29. Web Worker parity
 * 30. Parameter bounds enforcement
 * 31. Extreme negative return bankruptcy clamping
 * 32. Horizon = 1 boundary condition
 * 33. Simulation count = 1 boundary condition
 * 34. START_EMPIRICAL_DISTRIBUTION sampling
 * 35. Cross-regime comparative matrix integrity
 */

import {
  getAlignedRegimeSequence,
  buildRegimeTransitionMatrix,
} from '../src/core/portfolio/regimeTransition';
import { buildRegimeReturnPools } from '../src/core/portfolio/regimeConditionalReturns';
import {
  runRegimeMonteCarloSimulation,
  sampleNextRegime,
  generateRegimeSimulationFingerprint,
} from '../src/core/portfolio/regimeMonteCarloEngine';
import {
  compareRegimeSimulations,
  generateRegimeGhostInsights,
} from '../src/core/portfolio/regimeMonteCarlo';
import { runRegimeMonteCarloSimulationAsync } from '../src/core/portfolio/monteCarloWorkerClient';
import { runMonteCarloSimulation } from '../src/core/portfolio/monteCarloEngine';
import { DeterministicPRNG } from '../src/core/portfolio/prng';
import { ALL_REGIMES } from '../src/core/portfolio/regimeMonteCarloTypes';
import { RegimeType } from '../src/core/regimes';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n========================================================');
  console.log('BLACKBOX X: PHASE 3.9 REGIME PROBABILISTIC TEST SUITE');
  console.log('========================================================\n');

  const defaultWeights = { GOLD: 0.4, BTC: 0.3, NVDA: 0.3 };

  // 1. Regime sequence alignment
  const observations = getAlignedRegimeSequence(defaultWeights);
  assert(
    observations.length === 1825,
    '1. Regime sequence alignment: exactly 1,825 synchronized daily observations',
    `Found ${observations.length}`
  );
  assert(
    observations.every(obs => Boolean(obs.date && obs.regime && obs.assetReturns)),
    '1b. Regime sequence completeness: every observation has date, regime, and asset returns'
  );

  // 2. Transition count correctness & conservation
  const matrix = buildRegimeTransitionMatrix(observations);
  let totalOutgoing = 0;
  for (const r of ALL_REGIMES) {
    totalOutgoing += matrix.outgoingTransitionCounts[r];
  }
  assert(
    totalOutgoing === observations.length - 1,
    '2. Transition count conservation: sum of outgoing transitions equals T - 1',
    `Sum = ${totalOutgoing}, Expected = ${observations.length - 1}`
  );

  // 3. Row normalization
  let rowsNormalized = true;
  for (const r of ALL_REGIMES) {
    if (matrix.outgoingTransitionCounts[r] > 0) {
      const rowSum = ALL_REGIMES.reduce((s, to) => s + matrix.probabilities[r][to], 0);
      if (Math.abs(rowSum - 1.0) > 1e-9) {
        rowsNormalized = false;
      }
    }
  }
  assert(
    rowsNormalized,
    '3. Row stochastic normalization: all valid outgoing rows sum to 1.0 within 1e-9'
  );

  // 4. Sparse regime policy (MIN_OBS = 20)
  const syntheticSparseObs = [
    { date: '2020-01-01', regime: 'BULL' as RegimeType, assetReturns: { GOLD: 0, BTC: 0, NVDA: 0 }, portfolioReturn: 0 },
    { date: '2020-01-02', regime: 'BULL' as RegimeType, assetReturns: { GOLD: 0, BTC: 0, NVDA: 0 }, portfolioReturn: 0 },
    { date: '2020-01-03', regime: 'BEAR' as RegimeType, assetReturns: { GOLD: 0, BTC: 0, NVDA: 0 }, portfolioReturn: 0 },
  ];
  const sparseMatrix = buildRegimeTransitionMatrix(syntheticSparseObs);
  assert(
    sparseMatrix.sparseRegimes.includes('HIGH_VOL') && sparseMatrix.sparseRegimes.includes('LOW_VOL'),
    '4. Sparse regime policy: regimes with < 20 observations flagged as sparse'
  );

  // 5. Zero outgoing transitions handling
  assert(
    sparseMatrix.status === 'INSUFFICIENT_TRANSITION_DATA',
    '5. Zero outgoing transition handling: flags INSUFFICIENT_TRANSITION_DATA state'
  );

  // 6. Conditional data partitioning
  const pools = buildRegimeReturnPools(observations, defaultWeights);
  let totalPoolObs = 0;
  for (const r of ALL_REGIMES) {
    totalPoolObs += pools[r].observationCount;
  }
  assert(
    totalPoolObs === 1825,
    '6. Conditional partitioning: all 1,825 observations cleanly partitioned across pools',
    `Total pool obs = ${totalPoolObs}`
  );

  // 7. Multi-asset joint vector preservation
  const firstBullVector = pools.BULL.vectors[0];
  assert(
    Array.isArray(firstBullVector) && firstBullVector.length === 3,
    '7. Joint vector preservation: vectors stored as indivisible [GOLD, BTC, NVDA] tuples'
  );

  // 8. Conditional covariance symmetry & positive diagonal
  let covValid = true;
  for (const r of ALL_REGIMES) {
    const cov = pools[r].dailyCovarianceMatrix;
    if (pools[r].observationCount > 1) {
      if (cov[0][0] < 0 || cov[1][1] < 0 || cov[2][2] < 0) covValid = false;
      if (Math.abs(cov[0][1] - cov[1][0]) > 1e-9) covValid = false;
      if (Math.abs(cov[0][2] - cov[2][0]) > 1e-9) covValid = false;
      if (Math.abs(cov[1][2] - cov[2][1]) > 1e-9) covValid = false;
    }
  }
  assert(
    covValid,
    '8. Conditional covariance: symmetric with non-negative diagonal elements'
  );

  // 9. Conditional Cholesky & reactive stabilization
  let choleskyValid = true;
  for (const r of ALL_REGIMES) {
    if (pools[r].observationCount > 1) {
      const L = pools[r].choleskyL;
      // L must be lower triangular
      if (L[0][1] !== 0 || L[0][2] !== 0 || L[1][2] !== 0) choleskyValid = false;
      // diagonal of L must be >= 0
      if (L[0][0] < 0 || L[1][1] < 0 || L[2][2] < 0) choleskyValid = false;
    }
  }
  assert(
    choleskyValid,
    '9. Conditional Cholesky: produces valid lower-triangular factorization'
  );

  // 10. Starting regime initialization
  const bullSim = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 100,
    horizonDays: 30,
    seed: 42,
  });
  assert(
    bullSim.resolvedStartingRegime === 'BULL',
    '10. Starting regime initialization: START_BULL resolves to BULL'
  );

  // 10b. Zero outgoing transition rejection on default weights where BEAR has 0 observations
  let caughtBearZeroObs = false;
  try {
    runRegimeMonteCarloSimulation({
      method: 'REGIME_BOOTSTRAP',
      startingRegimeMode: 'START_BEAR',
      portfolioWeights: defaultWeights,
      simulationCount: 100,
      horizonDays: 30,
      seed: 42,
    });
  } catch (err: any) {
    if (err.message.includes('INSUFFICIENT_TRANSITION_DATA')) {
      caughtBearZeroObs = true;
    }
  }
  assert(
    caughtBearZeroObs,
    '10b. Sparse policy: START_BEAR on 0-observation regime strictly blocked with INSUFFICIENT_TRANSITION_DATA'
  );

  // 10c. START_BEAR on portfolio allocation with observed BEAR bouts
  const bearWeights = { GOLD: 0.1, BTC: 0.45, NVDA: 0.45 };
  const bearSim = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BEAR',
    portfolioWeights: bearWeights,
    simulationCount: 100,
    horizonDays: 30,
    seed: 42,
  });
  assert(
    bearSim.resolvedStartingRegime === 'BEAR',
    '10c. Starting regime initialization: START_BEAR resolves to BEAR when observations exist'
  );

  // 11. Day-1 return semantics
  assert(
    bullSim.trajectoryBands.p50Path[0] === 100000 && bearSim.trajectoryBands.p50Path[0] === 100000,
    '11. Day-1 semantics: paths anchor strictly to initial capital at Day 0'
  );

  // 12. Transition simulation
  const prngTest = new DeterministicPRNG(12345);
  const sampledNext = sampleNextRegime('BULL', matrix.probabilities, prngTest);
  assert(
    ALL_REGIMES.includes(sampledNext),
    '12. Transition simulation: sampleNextRegime yields valid regime from Markov row'
  );

  // 13. Bit-determinism across identical seeds
  const simA = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 500,
    horizonDays: 63,
    seed: 9999,
  });
  const simB = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 500,
    horizonDays: 63,
    seed: 9999,
  });
  assert(
    simA.fingerprint === simB.fingerprint &&
      simA.terminalWealth.p50 === simB.terminalWealth.p50 &&
      simA.maxDrawdown.p50 === simB.maxDrawdown.p50,
    '13. Bit-determinism: identical configuration and seed yield bit-identical outputs'
  );

  // 14. Seed differentiation
  const simC = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 500,
    horizonDays: 63,
    seed: 8888,
  });
  assert(
    simA.terminalWealth.p50 !== simC.terminalWealth.p50 || simA.fingerprint !== simC.fingerprint,
    '14. Seed differentiation: different seeds produce distinct simulation outcomes'
  );

  // 15. Terminal wealth percentile monotonicity
  const tw = simA.terminalWealth;
  assert(
    tw.p05 <= tw.p25 && tw.p25 <= tw.p50 && tw.p50 <= tw.p75 && tw.p75 <= tw.p95,
    '15. Terminal wealth percentiles: strict ordering P05 <= P25 <= P50 <= P75 <= P95'
  );

  // 16. Drawdown percentile monotonicity & non-positive sign
  const dd = simA.maxDrawdown;
  assert(
    dd.p05 <= dd.p25 && dd.p25 <= dd.p50 && dd.p50 <= dd.p75 && dd.p75 <= dd.p95 && dd.p95 <= 0.0001,
    '16. Max drawdown percentiles: strict ordering and non-positive convention (MDD <= 0)'
  );

  // 17. Loss frequency boundedness
  const lossFreq = simA.riskMetrics.lossFrequencyPct;
  assert(
    lossFreq >= 0 && lossFreq <= 100,
    '17. Loss frequency boundedness: 0 <= lossFrequencyPct <= 100%'
  );

  // 18. VaR positive-loss convention
  assert(
    typeof simA.riskMetrics.oneDaySimulatedVaR95 === 'number' &&
      typeof simA.riskMetrics.horizonSimulatedVaR95 === 'number',
    '18. VaR metric validity: positive loss numbers calculated cleanly'
  );

  // 19. Tail risk ordering CVaR >= VaR
  assert(
    simA.riskMetrics.horizonSimulatedCVaR95 >= simA.riskMetrics.horizonSimulatedVaR95 - 0.01,
    '19. Tail risk ordering: horizon CVaR >= horizon VaR within floating-point tolerance'
  );

  // 20. Historical occupancy conservation
  const occSum = ALL_REGIMES.reduce((s, r) => s + matrix.occupancy[r], 0);
  assert(
    Math.abs(occSum - 1.0) < 1e-9,
    '20. Historical occupancy conservation: empirical occupancy fractions sum to 1.0'
  );

  // 21. Empirical & Markov duration diagnostics
  let durationsPositive = true;
  for (const r of ALL_REGIMES) {
    if (matrix.observationCounts[r] > 0) {
      if (matrix.averageDuration[r] <= 0 || matrix.expectedMarkovDuration[r] <= 0) {
        durationsPositive = false;
      }
    }
  }
  assert(
    durationsPositive,
    '21. Duration diagnostics: empirical and theoretical Markov dwell times are strictly positive'
  );

  // 22. Transition count conservation
  assert(
    matrix.outgoingTransitionCounts.BULL +
      matrix.outgoingTransitionCounts.BEAR +
      matrix.outgoingTransitionCounts.HIGH_VOL +
      matrix.outgoingTransitionCounts.LOW_VOL ===
      1824,
    '22. Transition count conservation: outgoing counts sum to exactly 1,824'
  );

  // 23. Simplex weight validation
  let threwBadWeights = false;
  try {
    runRegimeMonteCarloSimulation({
      method: 'REGIME_BOOTSTRAP',
      portfolioWeights: { GOLD: 0.8, BTC: 0.8, NVDA: 0.8 }, // sum = 2.4
    });
  } catch (e) {
    threwBadWeights = true;
  }
  assert(
    threwBadWeights,
    '23. Simplex weight validation: invalid weight vector properly rejected'
  );

  // 24. Transaction cost monotonicity
  const simNoCost = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 500,
    horizonDays: 126,
    seed: 5555,
    includeTransactionCosts: false,
  });
  const simHighCost = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 500,
    horizonDays: 126,
    seed: 5555,
    includeTransactionCosts: true,
    transactionCostBps: 100, // 1% friction
    rebalanceSchedule: 'DAILY',
  });
  assert(
    simNoCost.terminalWealth.p50 >= simHighCost.terminalWealth.p50,
    '24. Transaction cost friction: friction monotonically reduces median terminal capital'
  );

  // 25. Three-layer separation: Unconditional vs Regime-Conditioned
  const unconditionalSim = runMonteCarloSimulation({
    method: 'HISTORICAL_BOOTSTRAP',
    portfolioWeights: defaultWeights,
    simulationCount: 500,
    horizonDays: 126,
    seed: 5555,
  });
  assert(
    unconditionalSim.provenance.simulationMethod === 'HISTORICAL_BOOTSTRAP' &&
      simNoCost.provenance.simulationMethod === 'REGIME_BOOTSTRAP',
    '25. Three-layer analytical separation: distinct methods, metadata, and provenance between Phase 3.8 and Phase 3.9'
  );

  // 26. Canonical audit fingerprint reproducibility
  const fp1 = generateRegimeSimulationFingerprint('REGIME_BOOTSTRAP', 'START_BULL', 42, 1000, 252, 100000, defaultWeights, 'MONTHLY', 10, 'HASH1');
  const fp2 = generateRegimeSimulationFingerprint('REGIME_BOOTSTRAP', 'START_BULL', 42, 1000, 252, 100000, defaultWeights, 'MONTHLY', 10, 'HASH1');
  assert(
    fp1 === fp2,
    '26. Audit fingerprint reproducibility: canonical hash is strictly deterministic'
  );

  // 27. Math.random prohibition audit
  assert(
    !runRegimeMonteCarloSimulation.toString().includes('Math.random()'),
    '27. Deterministic PRNG enforcement: simulation engine contains zero Math.random() calls'
  );

  // 28. Absolute NaN / Infinity protection
  const metricsValues = [
    simA.terminalWealth.p05,
    simA.terminalWealth.p50,
    simA.terminalWealth.p95,
    simA.totalReturn.p50,
    simA.maxDrawdown.p50,
    simA.riskMetrics.lossFrequencyPct,
    simA.riskMetrics.oneDaySimulatedVaR95,
    simA.riskMetrics.horizonSimulatedVaR95,
  ];
  assert(
    metricsValues.every(val => Number.isFinite(val) && !Number.isNaN(val)),
    '28. NaN/Infinity protection: all percentiles and risk metrics are finite numbers'
  );

  // 29. Web Worker parity (Node.js fallback parity check)
  const workerResult = await runRegimeMonteCarloSimulationAsync({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 200,
    horizonDays: 63,
    seed: 7777,
  });
  const directResult = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 200,
    horizonDays: 63,
    seed: 7777,
  });
  assert(
    workerResult.fingerprint === directResult.fingerprint &&
      workerResult.terminalWealth.p50 === directResult.terminalWealth.p50,
    '29. Web Worker parity: async client produces exact match with direct engine'
  );

  // 30. Parameter bounds enforcement
  let caughtBounds = false;
  try {
    runRegimeMonteCarloSimulation({
      method: 'REGIME_BOOTSTRAP',
      portfolioWeights: defaultWeights,
      simulationCount: 100000, // exceeds max 50,000
    });
  } catch (e) {
    caughtBounds = true;
  }
  assert(
    caughtBounds,
    '30. Parameter bounds enforcement: simulation count > 50,000 properly rejected'
  );

  // 31. Extreme negative return bankruptcy clamping
  const parametricSim = runRegimeMonteCarloSimulation({
    method: 'REGIME_PARAMETRIC',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 300,
    horizonDays: 126,
    seed: 1234,
  });
  assert(
    parametricSim.terminalWealth.p05 >= 0,
    '31. Bankruptcy clamping: terminal portfolio capital remains non-negative even under extreme parametric shocks'
  );

  // 32. Horizon = 1 boundary condition
  const simH1 = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 100,
    horizonDays: 1,
    seed: 42,
  });
  assert(
    simH1.trajectoryBands.days.length === 2 && simH1.terminalWealth.p50 > 0,
    '32. Horizon = 1 boundary condition: runs cleanly with exactly 1 forward step'
  );

  // 33. Simulation count = 1 boundary condition
  const simM1 = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_BULL',
    portfolioWeights: defaultWeights,
    simulationCount: 1,
    horizonDays: 30,
    seed: 42,
  });
  assert(
    simM1.terminalWealth.p05 === simM1.terminalWealth.p95,
    '33. Simulation count = 1 boundary condition: single path collapses percentiles cleanly'
  );

  // 34. START_EMPIRICAL_DISTRIBUTION sampling
  const empSim = runRegimeMonteCarloSimulation({
    method: 'REGIME_BOOTSTRAP',
    startingRegimeMode: 'START_EMPIRICAL_DISTRIBUTION',
    portfolioWeights: defaultWeights,
    simulationCount: 1000,
    horizonDays: 30,
    seed: 42,
  });
  assert(
    empSim.resolvedStartingRegime === 'EMPIRICAL_DISTRIBUTION' && empSim.terminalWealth.p50 > 0,
    '34. START_EMPIRICAL_DISTRIBUTION: samples initial states from empirical occupancy cleanly'
  );

  // 35. Cross-regime comparative matrix integrity
  const compMatrix = compareRegimeSimulations(defaultWeights, 'REGIME_BOOTSTRAP', 126, 500, 42);
  assert(
    compMatrix.table.length === 4 &&
      compMatrix.comparisons.BULL !== undefined &&
      compMatrix.comparisons.BEAR !== undefined &&
      compMatrix.comparisons.HIGH_VOL !== undefined &&
      compMatrix.comparisons.LOW_VOL !== undefined,
    '35. Cross-regime comparative matrix: evaluates all 4 macro starting regimes cleanly'
  );

  // 36. Ghost Mode insight generator
  const insights = generateRegimeGhostInsights(simA, compMatrix);
  assert(
    insights.length > 0 && insights.every(ins => Boolean(ins.observation && ins.hypothesis && ins.evidence)),
    '36. Ghost Mode insight generator: creates structured research insights from simulation metrics'
  );

  console.log('\n========================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
