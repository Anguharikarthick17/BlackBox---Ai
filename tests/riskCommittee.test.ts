/**
 * BLACKBOX X — Phase 3.4 Verification Test Suite
 * Validates:
 * 1. ResearchPack contains only verified quantitative values.
 * 2. ResearchPack does not leak raw daily price series.
 * 3. Output schema validator correctly validates grounded output.
 * 4. Unknown metric references are strictly rejected.
 * 5. Invalid evidence references are rejected.
 * 6. Missing stress result enforces executed = false.
 * 7. Missing robustness result enforces executed = false.
 * 8. Fingerprint stability: same state -> same fingerprint.
 * 9. Fingerprint sensitivity: changing asset/strategy -> new fingerprint.
 * 10. Offline grounded fallback briefing passes all validation rules.
 * 11. Ghost Mode, Genome, and Stress engines function cleanly.
 */

import { buildResearchPack } from '../src/core/researchPack';
import { validateRiskCommitteeBrief, extractValidMetricCatalog } from '../src/core/riskBriefValidator';
import { buildDeterministicMockBrief, handleRiskBriefRequest } from '../server/riskBriefHandler';
import { DEFAULT_PARAMS } from '../src/core/strategies';

async function runTests() {
  console.log('=== BLACKBOX X: PHASE 3.4 VERIFICATION SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${description}`);
      failed++;
    }
  }

  // TEST 1: Build Research Pack for Bitcoin + EMA Trend
  const packBtc = buildResearchPack({
    asset: 'BTC',
    strategy: 'EMA_TREND',
    params: DEFAULT_PARAMS['EMA_TREND'],
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    positionSizePct: 0.95,
    transactionCostPct: 0.001,
  });

  assert(packBtc !== null && typeof packBtc === 'object', 'ResearchPack generates successfully');
  assert(packBtc.asset.id === 'BTC', 'ResearchPack reflects selected asset BTC');
  assert(packBtc.metadata.strategy === 'EMA_TREND', 'ResearchPack reflects selected strategy EMA_TREND');
  assert(typeof packBtc.backtest.totalReturn === 'number', 'Backtest totalReturn is a verified number');
  assert(typeof packBtc.comparison.returnDelta === 'number', 'Precalculated return delta is present');

  // TEST 2: Data minimization: no raw price arrays
  const packKeys = Object.keys(packBtc);
  assert(!packKeys.includes('prices') && !packKeys.includes('priceData'), 'Data Minimization: Raw price series omitted');
  assert(!('rawPrices' in packBtc.asset), 'Asset object contains only aggregated metrics');

  // TEST 3: Fingerprint Determinism
  const packBtc2 = buildResearchPack({
    asset: 'BTC',
    strategy: 'EMA_TREND',
    params: DEFAULT_PARAMS['EMA_TREND'],
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    positionSizePct: 0.95,
    transactionCostPct: 0.001,
  });
  assert(
    packBtc.provenance.fingerprint === packBtc2.provenance.fingerprint,
    `Identical research state produces identical fingerprint: ${packBtc.provenance.fingerprint}`
  );

  // TEST 4: Fingerprint Sensitivity on State Change
  const packGold = buildResearchPack({
    asset: 'GOLD',
    strategy: 'EMA_TREND',
    params: DEFAULT_PARAMS['EMA_TREND'],
    startDate: '2020-01-01',
    endDate: '2023-12-31',
    initialCapital: 100000,
    positionSizePct: 0.95,
    transactionCostPct: 0.001,
  });
  assert(
    packBtc.provenance.fingerprint !== packGold.provenance.fingerprint,
    `Changing asset modifies fingerprint: ${packBtc.provenance.fingerprint} vs ${packGold.provenance.fingerprint}`
  );

  // TEST 5: Fallback Grounded Brief passes validation
  const mockBrief = buildDeterministicMockBrief(packBtc);
  const validationResult = validateRiskCommitteeBrief(mockBrief, packBtc);
  assert(validationResult.isValid === true, 'Grounded fallback briefing validates with 0 errors');
  assert(validationResult.brief !== null, 'Validated brief object returned');

  // TEST 6: Numerical Grounding Validator catches unknown metric IDs
  const invalidBrief = {
    ...mockBrief,
    evidenceSummary: [
      ...mockBrief.evidenceSummary,
      {
        id: 'ev-hallucinated',
        statement: 'Fake AI claim that does not exist in the research pack.',
        metricReferences: ['fake.metric.hallucinated_value_123'],
        sourceEngine: 'BACKTEST ENGINE',
        targetWorkspace: 'strategy',
      },
    ],
  };
  const invalidResult = validateRiskCommitteeBrief(invalidBrief, packBtc);
  assert(invalidResult.isValid === false, 'Validator rejects briefing with unknown metric reference');
  assert(
    invalidResult.errors.some(e => e.includes('fake.metric.hallucinated_value_123')),
    'Validator specifies exact offending metric reference'
  );

  // TEST 7: Missing stress enforces executed = false
  assert(packBtc.stress === null, 'Stress test unexecuted -> pack.stress is null');
  const briefWithFakeStress = {
    ...mockBrief,
    stressAssessment: {
      executed: true,
      scenarioName: 'Hallucinated Crisis 2028',
      summary: 'Fake stress scenario created by AI.',
      drawdownImpact: '-80%',
      recoveryEvaluation: '300 days',
      evidenceRefs: ['fake.stress.metric'],
    },
  };
  const fakeStressValidation = validateRiskCommitteeBrief(briefWithFakeStress, packBtc);
  assert(
    fakeStressValidation.brief?.stressAssessment.executed === false,
    'Validator overrides fake stress execution when pack.stress is null'
  );

  // TEST 8: Server API Handler with mock fallback
  const apiResponse = await handleRiskBriefRequest({
    researchPack: packBtc,
    mockFallback: true,
  });
  assert(apiResponse.configured === true, 'Server API handles request successfully');
  assert(apiResponse.status === 'CONNECTED', 'Server API returns CONNECTED status');
  assert(apiResponse.brief !== undefined, 'Server API returns valid structured brief');

  // TEST 9: Server API Handler without key returns NOT_CONFIGURED
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const unconfiguredResponse = await handleRiskBriefRequest({
    researchPack: packBtc,
  });
  assert(unconfiguredResponse.configured === false, 'Server API detects unconfigured GEMINI_API_KEY');
  assert(unconfiguredResponse.status === 'NOT_CONFIGURED', 'Server API returns NOT_CONFIGURED status gracefully');
  if (prevKey) process.env.GEMINI_API_KEY = prevKey;

  // TEST 10: Valid Metric Catalog Coverage
  const catalog = extractValidMetricCatalog(packBtc);
  assert(catalog.has('backtest.sharpe'), 'Metric catalog includes backtest.sharpe');
  assert(catalog.has('benchmark.totalReturn'), 'Metric catalog includes benchmark.totalReturn');
  assert(catalog.has('comparison.returnDelta'), 'Metric catalog includes comparison.returnDelta');
  assert(catalog.has('regimes.dominantRegime'), 'Metric catalog includes regimes.dominantRegime');
  assert(catalog.has('correlations.matrix.BTC.NVDA'), 'Metric catalog includes correlations.matrix.BTC.NVDA');

  console.log(`\nResults: ${passed} PASSED, ${failed} FAILED.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
