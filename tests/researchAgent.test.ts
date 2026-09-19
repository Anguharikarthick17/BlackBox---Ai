/**
 * BLACKBOX X — Phase 3.6 Autonomous Quant Research Agent Test Suite
 * 
 * Verifies all 14 mandatory behavioral and architectural requirements:
 * 1. Simple research question classification
 * 2. Hypothesis generation
 * 3. Tool allowlist enforcement
 * 4. Invalid tool rejection
 * 5. Maximum 8 tool executions ceiling
 * 6. Evidence provenance preservation
 * 7. Contradiction detection
 * 8. Secondary test selection
 * 9. Tool failure handling (no fabrication)
 * 10. Inconclusive research handling
 * 11. Research Trail (Ghost Mode) integration
 * 12. No fabricated metrics (empirical validation)
 * 13. No financial advice language compliance
 * 14. Data-window preservation
 */

import {
  classifyResearchQuestion,
  generateHypotheses,
  createResearchPlan,
  isToolAllowed,
  normalizeToolName,
  ALLOWED_RESEARCH_TOOLS,
  MAX_RESEARCH_TOOL_EXECUTIONS,
  selectAndValidateTool,
  executeExperimentStep,
  evaluateContradictions,
  synthesizeResearchConclusion,
  formatResearchTrailEntry,
  runAutonomousResearch,
  ExperimentStep,
  EvidenceItem,
  ResearchHypothesis,
} from '../src/core/researchAgent';
import { BLACKBOX_TOOLS } from '../src/core/aiTools';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, description: string) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${description}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${description}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log('\n=== BLACKBOX X: PHASE 3.6 RESEARCH AGENT VERIFICATION SUITE ===\n');

  // ---------------------------------------------------------------------------
  // Test 1: Simple research question classification
  // ---------------------------------------------------------------------------
  const q1 = classifyResearchQuestion('Why did BTC EMA Trend underperform Buy & Hold?');
  assert(q1.intent === 'PERFORMANCE_DISCREPANCY', 'Test 1: Primary demo question classified as PERFORMANCE_DISCREPANCY');
  assert(q1.targetAsset === 'BTC', 'Test 1: Target asset correctly extracted as BTC');
  assert(q1.targetStrategy === 'EMA_TREND', 'Test 1: Target strategy correctly extracted as EMA_TREND');

  const qDrawdown = classifyResearchQuestion('Why did NVDA experience its largest drawdown?');
  assert(qDrawdown.intent === 'DRAWDOWN_INVESTIGATION', 'Test 1b: Drawdown question classified as DRAWDOWN_INVESTIGATION');
  assert(qDrawdown.targetAsset === 'NVDA', 'Test 1b: Target asset extracted as NVDA');

  // ---------------------------------------------------------------------------
  // Test 2: Hypothesis generation
  // ---------------------------------------------------------------------------
  const hypotheses = generateHypotheses(q1);
  assert(hypotheses.length >= 2, `Test 2: Hypotheses generated (found: ${hypotheses.length})`);
  assert(hypotheses.some(h => h.id === 'H1' && h.statement.toLowerCase().includes('regime')), 'Test 2: Contains regime drag hypothesis (H1)');
  assert(hypotheses.some(h => h.id === 'H2' && h.statement.toLowerCase().includes('transaction')), 'Test 2: Contains transaction cost friction hypothesis (H2)');
  assert(hypotheses.every(h => isToolAllowed(h.primaryTool)), 'Test 2: All hypotheses link strictly to allowed BLACKBOX tools');

  // ---------------------------------------------------------------------------
  // Test 3: Tool allowlist enforcement
  // ---------------------------------------------------------------------------
  assert(ALLOWED_RESEARCH_TOOLS.length === 12, `Test 3: Authoritative allowlist contains exactly 12 tools (found: ${ALLOWED_RESEARCH_TOOLS.length})`);
  for (const tool of ALLOWED_RESEARCH_TOOLS) {
    assert(isToolAllowed(tool), `Test 3: Allowlist permits '${tool}'`);
  }
  // Check alias normalization
  assert(normalizeToolName('get_regime_analysis') === 'get_regime_performance', 'Test 3: Tool alias get_regime_analysis normalizes to get_regime_performance');

  // ---------------------------------------------------------------------------
  // Test 4: Invalid tool rejection
  // ---------------------------------------------------------------------------
  assert(!isToolAllowed('execute_arbitrary_code'), 'Test 4: Rejects execute_arbitrary_code');
  assert(!isToolAllowed('bash_command'), 'Test 4: Rejects bash_command');
  assert(!isToolAllowed('eval_script'), 'Test 4: Rejects eval_script');
  assert(!isToolAllowed('delete_database'), 'Test 4: Rejects delete_database');

  const toolValidation = selectAndValidateTool('malicious_shell_tool', {});
  assert(!toolValidation.isValid, 'Test 4: Tool selector rejects unauthorized tool invocation');
  assert(toolValidation.rejectionReason?.includes('allowlist') === true, 'Test 4: Rejection reason references allowlist');

  // ---------------------------------------------------------------------------
  // Test 5: Maximum 8 tool executions ceiling
  // ---------------------------------------------------------------------------
  const plan = createResearchPlan(q1, hypotheses);
  assert(plan.steps.length <= MAX_RESEARCH_TOOL_EXECUTIONS, `Test 5: Planned steps do not exceed budget of 8 (steps: ${plan.steps.length})`);
  assert(MAX_RESEARCH_TOOL_EXECUTIONS === 8, 'Test 5: MAX_RESEARCH_TOOL_EXECUTIONS constant is strictly 8');

  // ---------------------------------------------------------------------------
  // Test 6: Evidence provenance preservation
  // ---------------------------------------------------------------------------
  const step1 = plan.steps[0];
  const ev1 = await executeExperimentStep(step1, 1);
  assert(ev1.status === 'COMPLETED', 'Test 6: Step 1 deterministic execution succeeded');
  assert(ev1.dataWindow.includes('2020-01-01') && ev1.dataWindow.includes('2023-12-31'), `Test 6: Data window preserved (${ev1.dataWindow})`);
  assert(ev1.toolName === 'get_strategy_metrics', 'Test 6: Tool name preserved');
  assert(ev1.toolArguments.asset === 'BTC', 'Test 6: Asset parameter preserved in provenance');
  assert(ev1.toolArguments.strategy === 'EMA_TREND', 'Test 6: Strategy parameter preserved in provenance');
  assert(ev1.executionOrder === 1, 'Test 6: Execution order recorded');

  // ---------------------------------------------------------------------------
  // Test 7: Contradiction detection
  // ---------------------------------------------------------------------------
  // Execute Step 2 (Benchmark) & Step 4 (Zero Transaction Cost)
  const step2 = plan.steps.find(s => s.toolName === 'get_benchmark_metrics')!;
  const ev2 = await executeExperimentStep(step2, 2);

  const step4 = plan.steps.find(s => s.toolName === 'get_strategy_metrics' && s.arguments.transactionCostPct === 0.0)!;
  const ev4 = await executeExperimentStep(step4, 4);

  const testEvaluations = evaluateContradictions(hypotheses, [ev1, ev2, ev4]);
  const costEval = testEvaluations.find(e => e.hypothesisId === 'H2');
  assert(costEval !== undefined, 'Test 7: Evaluation generated for H2');
  assert(costEval?.status === 'CONTRADICTED', `Test 7: Cost hypothesis H2 correctly classified as CONTRADICTED (found: ${costEval?.status})`);
  assert(costEval?.contradictingEvidenceIds.length! > 0, 'Test 7: Contradicting evidence IDs attached');

  // ---------------------------------------------------------------------------
  // Test 8: Secondary test selection
  // ---------------------------------------------------------------------------
  // When H2 is contradicted, H1 (Regime) is investigated via secondary tool get_regime_performance
  const step3 = plan.steps.find(s => s.toolName === 'get_regime_performance')!;
  const ev3 = await executeExperimentStep(step3, 3);
  const updatedEvaluations = evaluateContradictions(hypotheses, [ev1, ev2, ev4, ev3]);
  const regimeEval = updatedEvaluations.find(e => e.hypothesisId === 'H1');
  assert(regimeEval?.status === 'SUPPORTED', `Test 8: Secondary regime test completed and evaluated as SUPPORTED (found: ${regimeEval?.status})`);

  // ---------------------------------------------------------------------------
  // Test 9: Tool failure handling (no fabrication)
  // ---------------------------------------------------------------------------
  const failedStep: ExperimentStep = {
    stepId: 'STEP-FAIL',
    hypothesisId: 'H1',
    order: 99,
    toolName: 'get_asset_metrics',
    arguments: { asset: 'INVALID_ASSET_XYZ' as any }, // Will fail Zod schema
    status: 'PLANNED',
    purpose: 'Test failure handling',
  };
  const failedEvidence = await executeExperimentStep(failedStep, 99);
  assert(failedEvidence.status === 'TOOL_FAILED', 'Test 9: Tool failure properly trapped and labeled TOOL_FAILED');
  assert(failedEvidence.result === null, 'Test 9: Zero fabrication on tool failure (result is null)');
  assert(Object.keys(failedEvidence.keyMetrics).length === 0, 'Test 9: Empty metrics recorded on failure');

  // ---------------------------------------------------------------------------
  // Test 10: Inconclusive research handling
  // ---------------------------------------------------------------------------
  const inconclusiveEvaluations = evaluateContradictions(
    [{ id: 'HX', questionId: 'QX', statement: 'Unknown premise', rationale: 'None', primaryTool: 'get_asset_metrics', expectedEvidence: 'None', status: 'PENDING' }],
    [failedEvidence]
  );
  const inconclConclusion = synthesizeResearchConclusion(
    q1,
    [{ id: 'HX', questionId: 'QX', statement: 'Unknown premise', rationale: 'None', primaryTool: 'get_asset_metrics', expectedEvidence: 'None', status: 'PENDING' }],
    [failedEvidence],
    inconclusiveEvaluations
  );
  assert(inconclConclusion.confidence === 'INCONCLUSIVE', `Test 10: Inconclusive confidence assigned on failed/empty data (found: ${inconclConclusion.confidence})`);

  // ---------------------------------------------------------------------------
  // Test 11: Research Trail integration
  // ---------------------------------------------------------------------------
  const fullConclusion = synthesizeResearchConclusion(q1, hypotheses, [ev1, ev2, ev3, ev4], updatedEvaluations);
  const trailEntry = formatResearchTrailEntry(fullConclusion);
  assert(typeof trailEntry.observation === 'string' && trailEntry.observation.includes(q1.query), 'Test 11: Trail entry includes research question');
  assert(typeof trailEntry.evidence === 'string' && trailEntry.evidence.includes('EV-'), 'Test 11: Trail entry references evidence IDs');
  assert(typeof trailEntry.impact === 'string' && trailEntry.impact.includes('Confidence:'), 'Test 11: Trail entry details analytical impact');
  assert(typeof trailEntry.nextTest === 'string' && trailEntry.nextTest.length > 5, 'Test 11: Trail entry defines next recommended test');

  // ---------------------------------------------------------------------------
  // Test 12: No fabricated metrics
  // ---------------------------------------------------------------------------
  // Compare evidence metrics against raw engine computation directly
  const rawStrat = BLACKBOX_TOOLS['get_strategy_metrics'].execute({ asset: 'BTC', strategy: 'EMA_TREND', transactionCostPct: 0.001 });
  assert(ev1.keyMetrics.totalReturn === rawStrat.totalReturn, `Test 12: Evidence totalReturn (${ev1.keyMetrics.totalReturn}%) matches exact BLACKBOX engine calculation (${rawStrat.totalReturn}%)`);
  assert(ev1.keyMetrics.sharpe === rawStrat.sharpe, `Test 12: Evidence Sharpe (${ev1.keyMetrics.sharpe}) matches exact BLACKBOX engine calculation (${rawStrat.sharpe})`);

  // ---------------------------------------------------------------------------
  // Test 13: No financial advice language
  // ---------------------------------------------------------------------------
  const combinedReportText = [
    ...fullConclusion.findings,
    ...fullConclusion.limitations,
    fullConclusion.confidenceReason,
  ].join(' ');

  const forbiddenWords = ['\bbuy\b', '\bsell\b', 'you should invest', 'recommended trade', 'guaranteed profit'];
  const hasAdvice = forbiddenWords.some(w => new RegExp(w, 'i').test(combinedReportText));
  assert(!hasAdvice, 'Test 13: Strict compliance: ZERO financial advice phrasing found in research synthesis');
  assert(fullConclusion.findings.some(f => f.startsWith('Evidence indicates') || f.startsWith('Empirical testing contradicts')), 'Test 13: Formatted with rigorous analytical evidence statements');

  // ---------------------------------------------------------------------------
  // Test 14: Data-window preservation
  // ---------------------------------------------------------------------------
  assert(fullConclusion.limitations.some(lim => lim.includes('2020-01-01 to 2023-12-31')), 'Test 14: Limitations explicitly cite the simulated data window');
  assert(ev1.dataWindow !== 'N/A' && ev2.dataWindow !== 'N/A', 'Test 14: All successful evidence items retain strict data window provenance');

  // ---------------------------------------------------------------------------
  // Test 15: Percentage-point vs percentage wording (Issue 1)
  // ---------------------------------------------------------------------------
  assert(costEval?.explanation.includes('percentage points') === true, 'Test 15: Transaction cost wording uses "percentage points"');
  assert(!costEval?.explanation.includes('% of alpha'), 'Test 15: Does not describe percentage points as "% of alpha"');
  assert(costEval?.interpretation.includes('percentage points') === true, 'Test 15: Interpretation uses "percentage points"');

  // ---------------------------------------------------------------------------
  // Test 16: No "permanent impairment" from drawdown alone (Issue 3)
  // ---------------------------------------------------------------------------
  const step6 = plan.steps.find(s => s.toolName === 'get_drawdown_analysis')!;
  const ev6 = await executeExperimentStep(step6, 6);
  const ddEvaluations = evaluateContradictions(hypotheses, [ev6]);
  const ddEval = ddEvaluations.find(e => e.hypothesisId === 'H3');
  assert(!ddEval?.interpretation.toLowerCase().includes('permanent') && !ddEval?.explanation.toLowerCase().includes('permanently'), 'Test 16: No inference of permanent impairment from drawdown alone');
  assert(ddEval?.interpretation.includes('recovery and compounding drag') === true, 'Test 16: Accurately characterizes drawdown as recovery and compounding drag');

  // ---------------------------------------------------------------------------
  // Test 17: No unsupported causal claims (Issue 2)
  // ---------------------------------------------------------------------------
  assert(!regimeEval?.interpretation.includes('degraded trend persistence'), 'Test 17: Avoids unsupported causal claim of trend persistence degradation');
  assert(regimeEval?.interpretation.toLowerCase().includes("regime-dependent performance contributed to the strategy's underperformance relative to buy & hold") === true, 'Test 17: Grounded in regime-dependent performance relative to Buy & Hold');

  // ---------------------------------------------------------------------------
  // Test 18: Evidence/interpretation separation (Issue 4)
  // ---------------------------------------------------------------------------
  assert(typeof costEval?.directEvidence === 'string' && costEval.directEvidence.length > 0, 'Test 18: Contradiction evaluation includes directEvidence');
  assert(typeof costEval?.interpretation === 'string' && costEval.interpretation.length > 0, 'Test 18: Contradiction evaluation includes interpretation');
  assert(fullConclusion.findings.every(f => f.includes('DIRECT EVIDENCE:') && f.includes('INTERPRETATION:')), 'Test 18: Synthesizer findings explicitly separate DIRECT EVIDENCE from INTERPRETATION');

  // ---------------------------------------------------------------------------
  // End-to-End Test: Primary Demo Question Execution
  // ---------------------------------------------------------------------------
  console.log('\n--- Running End-to-End Demo Question Investigation ---');
  const e2eResult = await runAutonomousResearch('Why did BTC EMA Trend underperform Buy & Hold?');
  assert(e2eResult.conclusion.testsExecuted >= 4, `E2E: Executed ${e2eResult.conclusion.testsExecuted} deterministic tools`);
  assert(e2eResult.conclusion.evaluations.some(ev => ev.status === 'CONTRADICTED'), 'E2E: Contradiction check flagged counterfactual cost hypothesis');
  assert(e2eResult.conclusion.confidence === 'HIGH_EVIDENCE' || e2eResult.conclusion.confidence === 'MODERATE_EVIDENCE', `E2E: Confidence evaluated as ${e2eResult.conclusion.confidence}`);
  assert(e2eResult.trailEntry.impact.length > 0, 'E2E: Valid research trail entry produced');

  console.log('\n==================================================');
  console.log(`RESULTS: ${passedTests} PASSED, ${totalTests - passedTests} FAILED`);
  console.log('==================================================\n');

  if (totalTests !== passedTests) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
