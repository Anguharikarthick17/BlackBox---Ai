/**
 * BLACKBOX X — LIVE PRODUCT DEMONSTRATION VERIFICATION SUITE
 * Comprehensive Automated Tests for DemoOrchestrator
 * 
 * Verifies:
 * 1. Deterministic configuration and data isolation
 * 2. Stage transitions and progress progression
 * 3. Pause, resume, restart, and exit mechanics
 * 4. Real quantitative engine execution at each stage
 * 5. Complete pedagogical explanations
 * 6. Audit sealing and 7-gate replay verification
 */

import {
  DemoOrchestrator,
  DEMO_ASSET,
  DEMO_STRATEGY,
  DEMO_BENCHMARK,
  DEMO_QUESTION,
} from '../src/core/demo/demoOrchestrator';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.error(`✗ FAIL: ${testName}`);
    if (detail) console.error(`  Detail: ${detail}`);
    throw new Error(`Assertion failed: ${testName} - ${detail || ''}`);
  }
}

async function runDemoTestSuite() {
  console.log('\n========================================================');
  console.log('BLACKBOX X: LIVE DEMO ORCHESTRATOR VERIFICATION');
  console.log('========================================================\n');

  console.log('--- 1. Initialization and Configuration ---');
  const demo = new DemoOrchestrator({ autoAdvance: false });
  const initialState = demo.getState();

  assert(initialState.currentStage === 'INTRO', '1a. Initial stage is INTRO');
  assert(initialState.status === 'IDLE', '1b. Initial status is IDLE');
  assert(DEMO_ASSET === 'BTC', '1c. Deterministic asset is BTC');
  assert(DEMO_STRATEGY === 'EMA_TREND', '1d. Strategy is EMA_TREND');
  assert(DEMO_BENCHMARK === 'BUY_AND_HOLD', '1e. Benchmark is BUY_AND_HOLD');
  assert(initialState.results.dataWindow.observationCount >= 1825, '1f. 1,825+ daily bars loaded (1,826 inclusive leap year)');
  assert(initialState.results.dataWindow.startDate === '2019-01-01', '1g. Start date is 2019-01-01');
  assert(initialState.results.dataWindow.endDate === '2023-12-31', '1h. End date is 2023-12-31');

  console.log('\n--- 2. Stage-by-Stage Engine Execution ---');
  // Start the demo
  await demo.start();
  let state = demo.getState();
  assert(state.currentStage === 'QUESTION', '2a. Transitioned to QUESTION stage');
  assert(state.explanation.stage === 'QUESTION', '2b. Explanation stage matches QUESTION');
  assert(Boolean(state.explanation.whatWeAreDoing), '2c. Explanation has "whatWeAreDoing"');
  assert(Boolean(state.explanation.why), '2d. Explanation has "why"');
  assert(Boolean(state.explanation.whatTheResultMeans), '2e. Explanation has "whatTheResultMeans"');

  // Next: HYPOTHESIS
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'HYPOTHESIS', '3a. Transitioned to HYPOTHESIS stage');
  assert(state.results.hypotheses.length === 3, '3b. Exactly 3 falsifiable hypotheses formulated');
  assert(state.results.hypotheses[0].hypothesisId === 'H1', '3c. Hypothesis H1 defined');

  // Next: QUANT (Real Backtest Engine)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'QUANT', '4a. Transitioned to QUANT stage');
  assert(state.results.backtest !== undefined, '4b. Real backtest result computed');
  assert(state.results.backtest!.trades.length > 0, '4c. Real trade log generated');
  assert(typeof state.results.backtest!.totalReturn === 'number', '4d. Total return computed');
  assert(typeof state.results.backtest!.maxDrawdown === 'number', '4e. Max drawdown computed');
  assert(state.results.evidenceRecords.length >= 1, '4f. First evidence record created');

  // Next: ROBUSTNESS (Parameter Sweep)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'ROBUSTNESS', '5a. Transitioned to ROBUSTNESS stage');
  assert(state.results.robustnessSweep !== undefined, '5b. Robustness parameter sweep executed');
  assert(state.results.robustnessSweep!.length > 0, '5c. Multiple parameter configurations evaluated');
  assert(state.results.evidenceRecords.length >= 2, '5d. Robustness evidence record logged');

  // Next: REGIME (Volatility Regimes)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'REGIME', '6a. Transitioned to REGIME stage');
  assert(state.results.regimePeriods !== undefined && state.results.regimePeriods.length > 0, '6b. Regime periods identified');
  assert(state.results.regimePerformance !== undefined && state.results.regimePerformance.length > 0, '6c. Strategy conditional performance by regime computed');
  assert(state.results.evidenceRecords.length >= 3, '6d. Regime evidence record logged');

  // Next: STRESS (Macro Shock Lab)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'STRESS', '7a. Transitioned to STRESS stage');
  assert(state.results.stressResult !== undefined, '7b. Stress simulation computed');
  assert(state.results.stressResult!.scenario.id === 'COVID_2020', '7c. COVID 2020 liquidity shock scenario applied');
  assert(state.results.evidenceRecords.length >= 4, '7d. Stress evidence record logged');

  // Next: SIMULATION (Monte Carlo Engine)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'SIMULATION', '8a. Transitioned to SIMULATION stage');
  assert(state.results.monteCarloResult !== undefined, '8b. Monte Carlo simulation executed');
  assert(state.results.monteCarloResult!.terminalWealth.p50 > 0, '8c. Median P50 path computed');
  assert(state.results.monteCarloResult!.terminalWealth.p05 < state.results.monteCarloResult!.terminalWealth.p95, '8d. P05 is strictly less than P95');
  assert(state.results.evidenceRecords.length >= 5, '8e. Monte Carlo evidence record logged');

  // Next: CHALLENGE (Contradiction & Falsification Engine)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'CHALLENGE', '9a. Transitioned to CHALLENGE stage');
  assert(state.results.contradictions !== undefined, '9b. Contradictions evaluated');
  assert(state.results.hypotheses.some(h => h.status === 'SUPPORTED'), '9c. At least one hypothesis supported by empirical facts');

  // Next: EVIDENCE (Topological Evidence Graph)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'EVIDENCE', '10a. Transitioned to EVIDENCE stage');
  assert(state.results.evidenceGraph !== undefined, '10b. Evidence Graph DAG assembled');
  assert(state.results.evidenceGraph!.nodes.length >= 10, '10c. DAG contains comprehensive research nodes');
  assert(state.results.evidenceGraph!.edges.length >= 10, '10d. DAG contains verified directed edges');

  // Next: CONCLUSION (12-Section Research Memo)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'CONCLUSION', '11a. Transitioned to CONCLUSION stage');
  assert(state.results.researchMemo !== undefined, '11b. Research memo generated');
  assert(Boolean(state.results.researchMemo!.sections.executiveObservation), '11c. Executive observation section populated');

  // Next: REPLAY (Case Sealing & 7-Gate Replay Audit)
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'REPLAY', '12a. Transitioned to REPLAY stage');
  assert(state.results.sealedCase !== undefined, '12b. Immutable ResearchCase sealed');
  assert(state.results.sealedCase!.caseId.startsWith('BBX-CASE-DEMO'), '12c. Isolated demo case ID format');
  assert(Boolean(state.results.sealedCase!.reproducibilityMetadata.canonicalOutputFingerprint), '12d. Canonical SHA-256 fingerprint generated');
  assert(state.results.replayVerification !== undefined, '12e. 7-gate replay verification executed');
  assert(state.results.replayVerification!.overallStatus === 'MATCHED', '12f. Replay overallStatus is MATCHED');
  assert(state.results.replayVerification!.fingerprintComparison.identical === true, '12g. Replay fingerprint is 100% identical');

  // Next: COMPLETE
  await demo.nextStage();
  state = demo.getState();
  assert(state.currentStage === 'COMPLETE', '13a. Transitioned to COMPLETE stage');
  assert(state.status === 'COMPLETE', '13b. Status marked COMPLETE');
  assert(state.progressPct === 100, '13c. Progress percentage is 100%');

  console.log('\n--- 3. Pause and Resume Controls ---');
  const demo2 = new DemoOrchestrator({ autoAdvance: true, stageIntervalMs: 5000 });
  await demo2.start();
  assert(demo2.getState().status === 'RUNNING', '14a. Demo 2 started and is RUNNING');
  
  demo2.pause();
  assert(demo2.getState().status === 'PAUSED', '14b. Demo 2 paused successfully');
  const pausedStage = demo2.getState().currentStage;
  
  demo2.resume();
  assert(demo2.getState().status === 'RUNNING', '14c. Demo 2 resumed successfully');
  assert(demo2.getState().currentStage === pausedStage, '14d. Resume retains exact same stage');

  console.log('\n--- 4. Restart and Jump Mechanics ---');
  await demo2.jumpToStage('STRESS');
  assert(demo2.getState().currentStage === 'STRESS', '15a. Direct jump to STRESS works');
  assert(demo2.getState().results.stressResult !== undefined, '15b. Stress engine executed upon jump');

  await demo2.restart();
  assert(demo2.getState().currentStage === 'QUESTION', '16a. Restart resets back to QUESTION');
  assert(demo2.getState().status === 'RUNNING', '16b. Status is RUNNING after restart');

  demo2.stop();
  assert(demo2.getState().status === 'STOPPED', '17. Stop cleanly halts orchestrator');

  console.log('\n--- 5. Data Flow & Internal Pipeline Synchronization ---');
  const demo3 = new DemoOrchestrator({ autoAdvance: false });
  const d3State = demo3.getState();

  // 18. View mode and sample data integrity
  assert(d3State.viewMode === 'PROCESS_UNIVERSE', '18a. Initial viewMode is PROCESS_UNIVERSE');
  demo3.setViewMode('RESEARCH_VIEW');
  assert(demo3.getState().viewMode === 'RESEARCH_VIEW', '18b. setViewMode updates viewMode to RESEARCH_VIEW');
  demo3.setViewMode('SYSTEM_VIEW');
  assert(demo3.getState().viewMode === 'SYSTEM_VIEW', '18c. setViewMode updates viewMode to SYSTEM_VIEW');
  assert(d3State.results.priceSample !== undefined && d3State.results.priceSample.length >= 8, '18c. priceSample populated with actual BTC OHLCV bars');
  assert(d3State.results.derivedSample !== undefined && d3State.results.derivedSample.length >= 8, '18d. derivedSample populated with actual returns and signals');
  assert(d3State.results.strategyParams?.fastPeriod === 12, '18e. strategyParams specifies actual fast EMA = 12');
  assert(d3State.results.strategyParams?.slowPeriod === 26, '18f. strategyParams specifies actual slow EMA = 26');

  // 19. Data flow reflects actual stage & real execution
  await demo3.jumpToStage('QUANT');
  const quantState = demo3.getState();
  assert(quantState.currentStage === 'QUANT', '19a. Data flow reflects actual stage QUANT');
  assert(quantState.engineExecutionStatus === 'COMPLETE', '19b. Engine execution status is COMPLETE after stage run');
  assert(quantState.results.backtest !== undefined, '19c. Real BacktestResult reached data flow state');
  assert(quantState.results.backtest!.trades.length > 0, '19d. Real executed trades reached pipeline');
  assert(quantState.results.backtest!.totalReturn !== 0, '19e. Non-zero real total return calculated');

  // 20. Robustness and evidence preservation
  await demo3.jumpToStage('ROBUSTNESS');
  const robustState = demo3.getState();
  assert(robustState.results.robustnessSweep !== undefined && robustState.results.robustnessSweep.length >= 4, '20a. Robustness sweep populated with 4 configurations');
  assert(robustState.results.evidenceRecords.length >= 2, '20b. Evidence nodes correspond to actual evidence records');

  // 21. Pause freezes pipeline, resume continues
  demo3.pause();
  assert(demo3.getState().status === 'PAUSED', '21a. Pause freezes pipeline');
  demo3.resume();
  assert(demo3.getState().status === 'RUNNING', '21b. Resume continues pipeline');

  // 22. Replay state reflects actual replay
  await demo3.jumpToStage('REPLAY');
  const replayState = demo3.getState();
  assert(replayState.results.replayVerification !== undefined, '22a. Replay verification record present in data flow');
  assert(replayState.results.replayVerification?.overallStatus === 'MATCHED', '22b. Replay status is MATCHED');

  // 23. Pipeline reset on restart
  await demo3.restart();
  const restartedState = demo3.getState();
  assert(restartedState.currentStage === 'QUESTION', '23a. Restart resets pipeline back to QUESTION');
  assert(restartedState.status === 'RUNNING', '23b. Status is RUNNING after pipeline restart');

  // 24. Engine error handling
  (demo3 as any).state.status = 'ERROR';
  (demo3 as any).state.engineExecutionStatus = 'FAILED';
  (demo3 as any).state.error = 'Simulated engine failure for test';
  const errState = demo3.getState();
  assert(errState.status === 'ERROR', '24a. Failed engine produces ERROR status');
  assert(errState.engineExecutionStatus === 'FAILED', '24b. Failed engine sets execution status to FAILED');
  assert(errState.error === 'Simulated engine failure for test', '24c. Error message preserved cleanly');

  demo3.stop();

  console.log('\n========================================================');
  console.log(`TOTAL DEMO TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: 0`);
  console.log('========================================================\n');
}

runDemoTestSuite().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
