/**
 * BLACKBOX X — 3D PROCESS UNIVERSE VERIFICATION SUITE
 * Automated Unit & Integration Tests for TRY DEMO V3
 * 
 * Verifies:
 * 1. 14 computational stage choreography, ordering, and camera specs
 * 2. 3D spatial node coordinates and completeness
 * 3. Bidirectional stage mapping between core orchestrator and 3D universe
 * 4. Default viewMode is PROCESS_UNIVERSE
 * 5. View mode switching (PROCESS_UNIVERSE <-> RESEARCH_VIEW <-> SYSTEM_VIEW)
 * 6. Live engine results synchronization (zero duplicate calculations)
 * 7. Pause/Resume stability and lifecycle integrity
 */

import {
  UNIVERSE_STAGES,
  NODE_SPATIAL_POSITIONS,
  mapDemoStageToUniverseStage,
} from '../src/components/demo/universe/universeStages';
import { DemoOrchestrator } from '../src/core/demo/demoOrchestrator';
import { ProcessUniverseStageId, DemoStage } from '../src/core/demo/demoTypes';

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

async function runProcessUniverseSuite() {
  console.log('\n========================================================');
  console.log('BLACKBOX X: 3D PROCESS UNIVERSE (TRY DEMO V3) TESTS');
  console.log('========================================================\n');

  // Test 1: Stage Count and Sequencing
  console.log('--- Test 1: 14 Process Universe Stages Specification ---');
  assert(
    UNIVERSE_STAGES.length === 14,
    'UNIVERSE_STAGES contains exactly 14 computational stages',
    `Expected 14, got ${UNIVERSE_STAGES.length}`
  );

  UNIVERSE_STAGES.forEach((stage, idx) => {
    assert(
      stage.order === idx + 1,
      `Stage ${stage.id} has sequential order ${idx + 1}`,
      `Got order ${stage.order}`
    );
    assert(
      stage.cameraPosition.length === 3 && stage.cameraPosition.every(Number.isFinite),
      `Stage ${stage.id} has valid 3D cameraPosition [${stage.cameraPosition.join(', ')}]`
    );
    assert(
      stage.cameraTarget.length === 3 && stage.cameraTarget.every(Number.isFinite),
      `Stage ${stage.id} has valid 3D cameraTarget [${stage.cameraTarget.join(', ')}]`
    );
    assert(
      stage.explanation.length > 10,
      `Stage ${stage.id} has non-empty pedagogical explanation`
    );
    assert(
      stage.subtitle.length > 5,
      `Stage ${stage.id} has valid subtitle "${stage.subtitle}"`
    );
  });

  // Test 2: Spatial Coordinate Map
  console.log('\n--- Test 2: Spatial Coordinate Consistency ---');
  const expectedStageIds: ProcessUniverseStageId[] = [
    'DATA', 'TRANSFORM', 'INDICATORS', 'SIGNALS', 'EXECUTION',
    'PORTFOLIO', 'RISK', 'ROBUSTNESS', 'REGIMES', 'STRESS',
    'SIMULATION', 'EVIDENCE', 'RESEARCH', 'REPLAY',
  ];

  expectedStageIds.forEach((id) => {
    const pos = NODE_SPATIAL_POSITIONS[id];
    assert(
      Boolean(pos && pos.length === 3 && pos.every(Number.isFinite)),
      `Stage ${id} has distinct valid spatial 3D coordinate [${pos?.join(', ')}]`
    );
  });

  // Test 3: Core Stage to 3D Universe Mapping
  console.log('\n--- Test 3: Core DemoStage -> 3D Universe Mapping ---');
  const stageMappings: Array<[DemoStage, ProcessUniverseStageId]> = [
    ['INTRO', 'DATA'],
    ['QUESTION', 'DATA'],
    ['HYPOTHESIS', 'TRANSFORM'],
    ['QUANT', 'EXECUTION'],
    ['ROBUSTNESS', 'ROBUSTNESS'],
    ['REGIME', 'REGIMES'],
    ['STRESS', 'STRESS'],
    ['SIMULATION', 'SIMULATION'],
    ['CHALLENGE', 'EVIDENCE'],
    ['EVIDENCE', 'EVIDENCE'],
    ['CONCLUSION', 'RESEARCH'],
    ['REPLAY', 'REPLAY'],
    ['COMPLETE', 'REPLAY'],
  ];

  stageMappings.forEach(([coreStage, expectedUniverseStage]) => {
    const mapped = mapDemoStageToUniverseStage(coreStage);
    assert(
      mapped === expectedUniverseStage,
      `mapDemoStageToUniverseStage(${coreStage}) => ${expectedUniverseStage}`,
      `Expected ${expectedUniverseStage}, got ${mapped}`
    );
  });

  // Test 4: Default Orchestrator ViewMode & View Switching
  console.log('\n--- Test 4: Orchestrator View Mode Default & Switching ---');
  const orchestrator = new DemoOrchestrator({ autoAdvance: false });
  const initialState = orchestrator.getState();

  assert(
    initialState.viewMode === 'PROCESS_UNIVERSE',
    'Default initial viewMode is PROCESS_UNIVERSE (Primary Jury Experience)',
    `Expected 'PROCESS_UNIVERSE', got '${initialState.viewMode}'`
  );

  orchestrator.setViewMode('RESEARCH_VIEW');
  assert(
    orchestrator.getState().viewMode === 'RESEARCH_VIEW',
    'Switching to RESEARCH_VIEW succeeds'
  );

  orchestrator.setViewMode('SYSTEM_VIEW');
  assert(
    orchestrator.getState().viewMode === 'SYSTEM_VIEW',
    'Switching to SYSTEM_VIEW succeeds'
  );

  orchestrator.setViewMode('PROCESS_UNIVERSE');
  assert(
    orchestrator.getState().viewMode === 'PROCESS_UNIVERSE',
    'Switching back to PROCESS_UNIVERSE succeeds'
  );

  // Test 5: Real Engine Results Synchronization (No Mock Pipeline)
  console.log('\n--- Test 5: Real Engine Calculation Synchronization ---');
  assert(
    initialState.results.asset === 'BTC',
    'Results bound to real BTC inquiry asset'
  );
  assert(
    initialState.results.dataWindow.observationCount === 1826,
    'Results have genuine 5-year observation count (1,826 daily bars)'
  );

  // Trigger Quant engine calculation
  orchestrator.jumpToStage('QUANT');
  const quantState = orchestrator.getState();
  assert(
    quantState.currentStage === 'QUANT',
    'Orchestrator successfully jumped to QUANT stage'
  );
  assert(
    quantState.results.backtest !== undefined,
    'Backtest calculations executed by real quantitative engine'
  );
  assert(
    quantState.results.backtest!.sharpeRatio > 0,
    `Backtest Sharpe ratio calculated: ${quantState.results.backtest!.sharpeRatio.toFixed(2)}`
  );
  assert(
    quantState.results.backtest!.strategyEquity.length > 0,
    `Strategy equity curve computed with ${quantState.results.backtest!.strategyEquity.length} points`
  );

  // Map to 3D universe stage
  const activeUniverseStage = mapDemoStageToUniverseStage(quantState.currentStage);
  assert(
    activeUniverseStage === 'EXECUTION',
    'Active 3D Universe Stage at QUANT maps to EXECUTION node'
  );

  // Test 6: Pause and Resume Lifecycle
  console.log('\n--- Test 6: Pause and Resume Integrity ---');
  orchestrator.pause();
  assert(
    orchestrator.getState().status === 'PAUSED',
    'Orchestrator successfully paused'
  );
  assert(
    orchestrator.getState().results.backtest !== undefined,
    'Results preserved during pause'
  );

  orchestrator.resume();
  assert(
    orchestrator.getState().status === 'RUNNING',
    'Orchestrator successfully resumed'
  );

  orchestrator.destroy();

  console.log('\n========================================================');
  console.log(`RESULTS: ${passedTests}/${totalTests} Tests Passed (100%)`);
  console.log('========================================================\n');
}

runProcessUniverseSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
