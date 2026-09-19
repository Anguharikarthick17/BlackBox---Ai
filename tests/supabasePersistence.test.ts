/**
 * BLACKBOX X — Supabase Persistence Integration Tests
 * 12 Critical Test Areas for the Persistence Layer
 *
 * Run with: tsx tests/supabasePersistence.test.ts
 *
 * Test Areas:
 *   1.  Secret Stripping (API keys never leave persistence boundary)
 *   2.  Monte Carlo Path Matrix Exclusion (raw paths never stored)
 *   3.  Evidence Separation (directEvidence STRICTLY ≠ interpretation)
 *   4.  Compact Serialization Correctness
 *   5.  Mapper: ResearchCase -> DB row
 *   6.  Mapper: Hypothesis ordering preserved
 *   7.  Mapper: Evidence row uses DB UUID (not string session ID)
 *   8.  Offline-First Fallback (no throw when server unreachable)
 *   9.  Audit Hash Chain Integrity
 *  10.  Replay Verification (CANONICAL_EXACT not BIT-IDENTICAL)
 *  11.  Claim Evidence Binding Preservation
 *  12.  Demo Case Isolation (is_demo tagging)
 */

import {
  stripSecrets,
  safeSerialize,
  compactMonteCarloResult,
  serializeEvidenceRecord,
  serializeResearchClaim,
  serializeResearchMemo,
  serializeAuditEvent,
  serializeReplayVerification,
} from '../src/core/persistence/compactSerializers';
import {
  mapCaseToCaseRow,
  mapHypothesisToRow,
  mapEvidenceToRow,
  mapClaimToRow,
  mapAuditEventToRow,
  mapReplayVerificationToRow,
} from '../src/core/persistence/supabaseMappers';
import { isSupabaseConfigured } from '../src/lib/supabase/client';

// ============================================================
// TEST RUNNER
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string): void {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n▶ ${name}`);
}

// ============================================================
// FIXTURES
// ============================================================

function makeMockEvidenceRecord() {
  return {
    evidenceId: 'EV-001',
    experimentId: 'EXP-001',
    hypothesisId: 'H-001',
    toolName: 'correlationAnalysis',
    arguments: { assets: ['SPY', 'QQQ'], window: 252 },
    result: {
      pearsonR: 0.87,
      pValue: 0.001,
      // These raw path arrays should be compacted/replaced:
      paths: Array.from({ length: 10000 }, () => Math.random()),
      allPaths: Array.from({ length: 5000 }, () => [Math.random(), Math.random()]),
    },
    dataWindow: { startDate: '2020-01-01', endDate: '2024-12-31', observationCount: 1260 },
    directEvidence: 'Pearson correlation = 0.87, p-value < 0.001 over 1260 observations.',
    interpretation: 'Strong positive correlation indicates regime co-movement between assets.',
    order: 1,
    fingerprint: 'abc123fingerprint',
    timestamp: Date.now(),
  } as any;
}

function makeMockResearchClaim() {
  return {
    claimId: 'CLAIM-001',
    text: 'Sharpe ratio improved from 0.82 to 1.34 post-rebalancing',
    claimType: 'DIRECT_OBSERVATION',
    metric: 'sharpeRatio',
    value: 1.34,
    unit: 'ratio',
    evidenceIds: ['EV-001', 'EV-002'],
  } as any;
}

function makeMockResearchMemo() {
  return {
    memoId: 'MEMO-001',
    sections: {
      executiveSummary: 'Portfolio exhibits regime-dependent correlation shifts.',
      keyFindings: ['Finding A', 'Finding B'],
      quantitativeFindings: [],
      hypothesisConclusions: [],
      limitations: ['Limited dataset: 4 years only', 'Single regime assumption'],
      disclaimer: 'This is research-grade output for internal decision support only.',
      investmentConclusion: 'Proceed with conditional rebalancing.',
      appendices: [],
    },
    rawMarkdown: '# Research Memo\n...',
  } as any;
}

function makeMockAuditEvent() {
  return {
    eventId: 'AE-001',
    caseId: 'BBX-CASE-2024-0001',
    timestamp: Date.now(),
    eventType: 'CASE_SEALED',
    actor: 'SYSTEM',
    fingerprint: 'fp-hash-abc',
    details: {
      caseId: 'BBX-CASE-2024-0001',
      status: 'SEALED',
      apiKey: 'sk-supersecretapikey12345',
      serviceRoleKey: 'service_role_key_xyz',
    },
    eventHash: 'hash-of-this-event',
    previousEventHash: 'hash-of-prior-event',
    order: 5,
  } as any;
}

function makeMockReplayVerification() {
  return {
    verificationId: 'REPLAY-001',
    caseId: 'BBX-CASE-2024-0001',
    replayedAt: Date.now(),
    overallStatus: 'MATCHED',
    primaryMismatchType: undefined,
    allMismatchTypes: [],
    tierResults: {
      deterministicTier: { passed: true, score: 100 },
      canonicalTier: { passed: true, score: 98.5 },
    },
    fingerprintComparison: {
      originalFingerprint: 'fp-abc123',
      replayFingerprint: 'fp-abc123',
      identical: true,
    },
    comparisonClass: 'CANONICAL_EXACT',
    fingerprintMatchPct: 100,
    totalReplayLatencyMs: 342,
  } as any;
}

function makeMockResearchCase() {
  return {
    caseId: 'BBX-CASE-2024-0001',
    question: 'Does adding gold to a 60/40 portfolio improve Sharpe ratio under inflationary regimes?',
    normalizedQuestion: 'does adding gold to 60 40 portfolio improve sharpe ratio',
    status: 'SEALED',
    caseVersion: 1,
    sessionId: 'sess-abc-123',
    sessionFingerprint: 'sess-fp-xyz',
    datasetFingerprint: 'data-fp-xyz',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    sealedAt: Date.now(),
    hypotheses: [],
    experiments: [],
    evidence: [],
    memo: null,
    manifest: {
      data: {
        startDate: '2020-01-01',
        endDate: '2024-12-31',
        observationCount: 1260,
      },
      strategy: { type: 'MOMENTUM', lookback: 252 },
      portfolio: { assets: ['SPY', 'GLD', 'TLT'] },
      simulation: { method: 'PARAMETRIC_GAUSSIAN', pathCount: 10000 },
      engines: { version: '5.0.0' },
      research: { hypothesisCount: 3 },
    },
    reproducibilityMetadata: {
      // canonicalFingerprint does not exist on type — correct field is canonicalOutputFingerprint
      canonicalOutputFingerprint: 'canon-fp-abc',
      verificationCount: 0,
    },
    auditMetadata: { timelineChecksum: 'timeline-checksum-abc' },
  } as any;
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runTests(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  BLACKBOX X — Supabase Persistence Integration Tests   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 1: Secret Stripping
  // ────────────────────────────────────────────────────────────
  section('1. Secret Stripping');

  const obj1 = { apiKey: 'sk-supersecretkey', data: { value: 42 } };
  const stripped1 = stripSecrets(obj1) as any;
  assert(stripped1.apiKey === '[REDACTED_BY_PERSISTENCE_POLICY]', 'Top-level API key is redacted');
  assert(stripped1.data.value === 42, 'Non-secret fields pass through unchanged');

  const obj2 = { config: { auth: { serviceRoleKey: 'srv-xyz', token: 'bearer-abc' }, safeData: 'hello' } };
  const stripped2 = stripSecrets(obj2) as any;
  assert(stripped2.config.auth.serviceRoleKey === '[REDACTED_BY_PERSISTENCE_POLICY]', 'Nested serviceRoleKey is redacted');
  assert(stripped2.config.auth.token === '[REDACTED_BY_PERSISTENCE_POLICY]', 'Nested token is redacted');
  assert(stripped2.config.safeData === 'hello', 'Non-secret nested fields are preserved');

  const obj3 = { keys: [{ apiKey: 'sk-a', name: 'featherless' }, { apiKey: 'sk-b', name: 'gemini' }] };
  const stripped3 = stripSecrets(obj3) as any;
  assert(stripped3.keys[0].apiKey === '[REDACTED_BY_PERSISTENCE_POLICY]', 'Array element secrets are redacted');
  assert(stripped3.keys[0].name === 'featherless', 'Array element non-secret preserved');

  assert(stripSecrets(null) === null, 'Null value returns null');
  assert(stripSecrets(42) === 42, 'Numeric primitive passes through');

  const auditEvent = makeMockAuditEvent();
  const auditSerialized = serializeAuditEvent(auditEvent);
  const payload = auditSerialized.payload as any;
  assert(payload.apiKey === '[REDACTED_BY_PERSISTENCE_POLICY]', 'Audit event payload: apiKey redacted');
  assert(payload.serviceRoleKey === '[REDACTED_BY_PERSISTENCE_POLICY]', 'Audit event payload: serviceRoleKey redacted');
  assert(payload.caseId === 'BBX-CASE-2024-0001', 'Audit event payload: caseId preserved');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 2: Monte Carlo Path Matrix Exclusion
  // ────────────────────────────────────────────────────────────
  section('2. Monte Carlo Path Matrix Exclusion');

  const mcResult = {
    method: 'PARAMETRIC_GAUSSIAN',
    pathCount: 10000,
    horizonDays: 252,
    seed: 42,
    percentiles: { p05: -0.32, p25: -0.12, p50: 0.08, p75: 0.24, p95: 0.47 },
    varOneYear95: -0.28,
    cvarOneYear99: -0.35,
    ruinProbability: 0.02,
    medianFinalReturn: 0.08,
    paths: Array.from({ length: 10000 }, () => Math.random()),
    allPaths: Array.from({ length: 5000 }, () => [Math.random(), Math.random()]),
    pathMatrix: Array.from({ length: 252 * 10000 }, () => 0),
  };
  const compact = compactMonteCarloResult(mcResult);
  assert((compact as any).paths === undefined, 'Raw paths array is NOT stored');
  assert((compact as any).allPaths === undefined, 'allPaths array is NOT stored');
  assert((compact as any).pathMatrix === undefined, 'pathMatrix is NOT stored');
  assert(compact.pathCount === 10000, 'pathCount summary statistic preserved');
  assert(compact.seed === 42, 'Seed (for reproducibility) preserved');
  assert(compact.percentiles.p50 === 0.08, 'p50 percentile preserved');
  assert(compact.varOneYear95 === -0.28, 'VaR statistic preserved');

  const evidenceWithPaths = makeMockEvidenceRecord();
  const serializedEvidence = serializeEvidenceRecord(evidenceWithPaths);
  const resultAny = serializedEvidence.result as any;
  const pathsField = resultAny.paths;
  const pathsOk = pathsField === undefined || typeof pathsField === 'string' ||
    (Array.isArray(pathsField) && pathsField.length <= 100);
  assert(pathsOk, 'Evidence result: large path arrays are stripped or summarized');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 3: Evidence directEvidence vs Interpretation Separation
  // ────────────────────────────────────────────────────────────
  section('3. Evidence directEvidence vs Interpretation Separation');

  const evidenceRecord = makeMockEvidenceRecord();
  const serialized = serializeEvidenceRecord(evidenceRecord);
  assert(
    serialized.direct_evidence === 'Pearson correlation = 0.87, p-value < 0.001 over 1260 observations.',
    'directEvidence serialized to direct_evidence column verbatim'
  );
  assert(
    serialized.interpretation === 'Strong positive correlation indicates regime co-movement between assets.',
    'interpretation serialized to interpretation column verbatim'
  );
  assert(
    !serialized.direct_evidence.includes('indicates'),
    'direct_evidence does NOT contain interpretive language'
  );
  assert(
    !serialized.interpretation.includes('Pearson correlation = 0.87'),
    'interpretation does NOT contain direct observed facts'
  );

  const longEvidence = makeMockEvidenceRecord();
  longEvidence.directEvidence = 'A'.repeat(500);
  longEvidence.interpretation = 'B'.repeat(500);
  const longSerialized = serializeEvidenceRecord(longEvidence);
  assert(longSerialized.direct_evidence.length === 500, 'directEvidence is not truncated');
  assert(longSerialized.interpretation.length === 500, 'interpretation is not truncated');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 4: Compact Serialization Correctness
  // ────────────────────────────────────────────────────────────
  section('4. Compact Serialization Correctness');

  const claim = makeMockResearchClaim();
  const claimSerialized = serializeResearchClaim(claim);
  assert(claimSerialized.claim_id === 'CLAIM-001', 'Claim ID preserved');
  assert(claimSerialized.evidence_ids.length === 2, 'All evidence IDs preserved (count)');
  assert(claimSerialized.evidence_ids[0] === 'EV-001', 'Evidence ID [0] correct');
  assert(claimSerialized.metric === 'sharpeRatio', 'Metric name preserved');
  assert(claimSerialized.value === '1.34', 'Value serialized as string (polymorphism safe)');

  const memo = makeMockResearchMemo();
  const memoSerialized = serializeResearchMemo(memo);
  assert(memoSerialized.memo_id === 'MEMO-001', 'Memo ID preserved');
  assert(typeof memoSerialized.memo === 'object', 'Memo sections stored as structured object (not prose)');
  assert('executiveSummary' in memoSerialized.memo, 'Memo has executiveSummary section');
  assert(memoSerialized.limitations.includes('Limited dataset'), 'Limitations text preserved');
  assert(
    memoSerialized.disclaimer === 'This is research-grade output for internal decision support only.',
    'Disclaimer text preserved verbatim'
  );

  // ────────────────────────────────────────────────────────────
  // TEST AREA 5: Mapper — ResearchCase -> DB Row
  // ────────────────────────────────────────────────────────────
  section('5. ResearchCase -> DB Row Mapper');

  const caseData = makeMockResearchCase();
  const caseRow = mapCaseToCaseRow(caseData, { isDemo: false });
  assert(caseRow.case_id === 'BBX-CASE-2024-0001', 'case_id preserved (BBX format)');
  assert(caseRow.status === 'SEALED', 'status preserved');
  assert(caseRow.is_demo === false, 'is_demo=false for non-demo case');
  assert(caseRow.dataset_start === '2020-01-01', 'dataset_start from manifest.data');
  assert(caseRow.dataset_end === '2024-12-31', 'dataset_end from manifest.data');
  assert(caseRow.observation_count === 1260, 'observation_count from manifest.data');
  assert(caseRow.fingerprint === 'canon-fp-abc', 'canonical fingerprint preserved');
  assert(caseRow.question.length > 0, 'question field populated');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 6: Mapper — Hypothesis ordering
  // ────────────────────────────────────────────────────────────
  section('6. Hypothesis Ordering Preserved');

  const mockHypothesis = {
    hypothesisId: 'H-001',
    statement: 'Gold addition improves Sharpe in inflationary regimes',
    category: 'PERFORMANCE',
    status: 'SUPPORTED',
    confidence: 'HIGH_EVIDENCE',
    testIds: ['EXP-001', 'EXP-002'],
    priorEvidence: [],
    expectedEvidence: [],
    contradictingEvidence: [],
    createdAt: Date.now(),
  } as any;

  const hypothesisRow = mapHypothesisToRow(mockHypothesis, 'session-db-uuid', 2);
  assert(hypothesisRow.hypothesis_id === 'H-001', 'Hypothesis ID preserved');
  assert(hypothesisRow.order_index === 2, 'Order index = 2 preserved');
  assert(hypothesisRow.status === 'SUPPORTED', 'Status preserved');
  assert(hypothesisRow.statement === 'Gold addition improves Sharpe in inflationary regimes', 'Statement preserved');
  assert(hypothesisRow.session_id === 'session-db-uuid', 'Session DB UUID correctly bound');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 7: Mapper — Evidence row uses DB UUID
  // ────────────────────────────────────────────────────────────
  section('7. Evidence Row Uses DB UUID (not string session ID)');

  const evidenceRow = mapEvidenceToRow(makeMockEvidenceRecord(), 'db-uuid-of-session-f3a2');
  assert(evidenceRow.session_id === 'db-uuid-of-session-f3a2', 'Evidence row session_id is DB UUID');
  assert(evidenceRow.evidence_id === 'EV-001', 'Evidence ID preserved');
  assert(evidenceRow.tool_name === 'correlationAnalysis', 'Tool name preserved');
  assert(evidenceRow.direct_evidence.length > 0, 'directEvidence preserved in row');
  assert(evidenceRow.interpretation.length > 0, 'interpretation preserved in row');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 8: Offline-First Fallback
  // ────────────────────────────────────────────────────────────
  section('8. Offline-First Fallback (no throw when server unreachable)');

  // Override global fetch to simulate server down
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async () => { throw new Error('ECONNREFUSED: server down'); }) as any;

  try {
    // Dynamic import to get fresh module
    const { saveResearchCase, listResearchCases } = await import('../src/core/persistence/researchPersistenceService');

    const saveResult = await saveResearchCase(makeMockResearchCase(), { isDemo: false });
    assert(saveResult !== undefined, 'saveResearchCase does not throw when server is down');
    assert(saveResult.caseId === 'BBX-CASE-2024-0001', 'caseId returned even in offline mode');

    const listResult = await listResearchCases();
    assert(listResult !== undefined, 'listResearchCases does not throw when server is down');
    assert(listResult.source === 'LOCAL', 'listResearchCases falls back to LOCAL source');
    assert(Array.isArray(listResult.cases), 'listResearchCases returns array in offline mode');
  } catch (err) {
    assert(false, `Offline-first violated: threw ${(err as Error).message}`);
  } finally {
    globalThis.fetch = origFetch;
  }

  // ────────────────────────────────────────────────────────────
  // TEST AREA 9: Audit Hash Chain Integrity
  // ────────────────────────────────────────────────────────────
  section('9. Audit Hash Chain Integrity');

  const auditEvent2 = makeMockAuditEvent();
  const auditSer = serializeAuditEvent(auditEvent2);
  assert(auditSer.event_hash === 'hash-of-this-event', 'event_hash preserved in serialized form');
  assert(auditSer.previous_event_hash === 'hash-of-prior-event', 'previous_event_hash preserved (chain intact)');
  assert(auditSer.event_id === 'AE-001', 'event_id preserved');
  assert(auditSer.event_type === 'CASE_SEALED', 'event_type preserved');
  assert(auditSer.actor === 'SYSTEM', 'actor field preserved');

  const auditRow = mapAuditEventToRow(auditEvent2, 'session-db-uuid', 5);
  assert(auditRow.event_order === 5, 'event_order correctly set');
  assert(auditRow.case_id === 'BBX-CASE-2024-0001', 'case_id (BBX format) preserved in row');
  assert(auditRow.session_id === 'session-db-uuid', 'session_id (DB UUID) set in row');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 10: Replay Verification (CANONICAL_EXACT not BIT-IDENTICAL)
  // ────────────────────────────────────────────────────────────
  section('10. Replay Verification: CANONICAL_EXACT vocabulary');

  const replayRecord = makeMockReplayVerification();
  const replaySer = serializeReplayVerification(replayRecord);
  assert(replaySer.comparison_class === 'CANONICAL_EXACT', 'comparison_class = CANONICAL_EXACT');
  assert(replaySer.comparison_class !== 'BIT-IDENTICAL', 'comparison_class is NOT BIT-IDENTICAL (invalid term)');
  assert(replaySer.verification_status === 'MATCHED', 'verification_status preserved');
  assert(typeof replaySer.gate_results === 'object', 'gate_results is structured object');
  assert(replaySer.fingerprint === 'fp-abc123', 'fingerprint preserved');

  const replayRow = mapReplayVerificationToRow(replayRecord, 'case-db-uuid', 'session-db-uuid');
  assert(replayRow.case_id === 'case-db-uuid', 'Replay row has case DB UUID');
  assert(replayRow.session_id === 'session-db-uuid', 'Replay row has session DB UUID');
  assert(replayRow.overall_match_pct === 100, 'Match percentage = 100 for identical fingerprints');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 11: Claim Evidence Binding Preservation
  // ────────────────────────────────────────────────────────────
  section('11. Claim Evidence Binding Preservation');

  const claimWith4Evidence = {
    ...makeMockResearchClaim(),
    evidenceIds: ['EV-001', 'EV-002', 'EV-003', 'EV-004'],
  } as any;
  const claimSer4 = serializeResearchClaim(claimWith4Evidence);
  assert(claimSer4.evidence_ids.length === 4, 'All 4 evidence IDs preserved');
  assert(claimSer4.evidence_ids.includes('EV-003'), 'EV-003 is in the binding list');

  const claimRow = mapClaimToRow(makeMockResearchClaim(), 'session-db-uuid');
  assert(claimRow.session_id === 'session-db-uuid', 'Claim row uses session DB UUID');
  assert(claimRow.claim_id === 'CLAIM-001', 'claim_id preserved in row');
  assert(Array.isArray(claimRow.evidence_ids), 'evidence_ids is array in row');
  assert((claimRow.evidence_ids as string[]).length === 2, 'Both evidence IDs in row');

  // ────────────────────────────────────────────────────────────
  // TEST AREA 12: Demo Case Isolation
  // ────────────────────────────────────────────────────────────
  section('12. Demo Case Isolation (is_demo tagging)');

  const demoCase = makeMockResearchCase();
  const demoRow = mapCaseToCaseRow(demoCase, { isDemo: true });
  assert(demoRow.is_demo === true, 'Demo case tagged is_demo=true');

  const nonDemoCase = makeMockResearchCase();
  const nonDemoRow = mapCaseToCaseRow(nonDemoCase, { isDemo: false });
  assert(nonDemoRow.is_demo === false, 'Non-demo case tagged is_demo=false');

  const defaultCase = makeMockResearchCase();
  const defaultRow = mapCaseToCaseRow(defaultCase);
  assert(defaultRow.is_demo === false, 'Default (no option) → is_demo=false');

  // Confirm isSupabaseConfigured does not throw
  try {
    const configuredResult = isSupabaseConfigured();
    assert(typeof configuredResult === 'boolean', 'isSupabaseConfigured() returns boolean without throwing');
  } catch (err) {
    assert(false, `isSupabaseConfigured() must not throw: ${(err as Error).message}`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log(`║  TEST RESULTS: ${passed} passed, ${failed} failed                       ║`.slice(0, 56) + ' ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('\n✗ FATAL TEST ERROR:', err);
  process.exit(1);
});
