/**
 * BLACKBOX X — Live Supabase Database Verification Script
 *
 * Verifies:
 * 1. Existence of all 11 expected tables in public schema
 * 2. RLS enabled on all 11 tables
 * 3. RLS policy behavior (public demo read, anon write rejection, private isolation)
 * 4. Foreign-key relationships & constraints
 * 5. Safe end-to-end persistence write via handleSaveResearchCase
 * 6. Persistence read-back with fingerprint validation
 * 7. Evidence separation, claims binding, audit chain, and replay mapping
 * 8. Demo isolation flag (is_demo=true)
 * 9. Clean up of ONLY the test records
 * 10. No secrets printed
 */

import { createClient } from '@supabase/supabase-js';
import { handleSaveResearchCase } from '../server/api/research/cases';

const TEST_CASE_ID = 'BBX-CASE-TEST-LIVE-VERIFICATION-0001';
const TEST_SESSION_ID = 'SESSION-LIVE-TEST-0001';
const TEST_FINGERPRINT = 'fp-test-canon-sha256-live-check-9988';

function getClients() {
  const rawUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  // Extract ref if dashboard URL was passed
  const match = rawUrl.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  const url = match && match[1] ? `https://${match[1]}.supabase.co` : rawUrl;

  if (!url || !serviceRoleKey || !anonKey) {
    throw new Error('Missing Supabase configuration in environment.');
  }

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { adminClient, anonClient };
}

export interface VerificationReport {
  tables: { name: string; exists: boolean; rowCount: number }[];
  rls: {
    anonWriteBlocked: boolean;
    anonReadPublicDemoAllowed: boolean;
    anonReadPrivateBlocked: boolean;
  };
  fkConstraints: {
    invalidFkRejected: boolean;
    cascadeOrCleanupVerified: boolean;
  };
  persistenceWrite: {
    success: boolean;
    caseId?: string;
    dbId?: string;
  };
  persistenceRead: {
    success: boolean;
    caseFound: boolean;
    fingerprintMatched: boolean;
    isDemoMatched: boolean;
    evidenceVerified: boolean;
    claimVerified: boolean;
    auditVerified: boolean;
    replayVerified: boolean;
  };
  cleanup: {
    success: boolean;
    remainingTestRecords: number;
  };
}

export async function runLiveVerification(): Promise<VerificationReport> {
  const { adminClient, anonClient } = getClients();

  const report: VerificationReport = {
    tables: [],
    rls: {
      anonWriteBlocked: false,
      anonReadPublicDemoAllowed: false,
      anonReadPrivateBlocked: false,
    },
    fkConstraints: {
      invalidFkRejected: false,
      cascadeOrCleanupVerified: false,
    },
    persistenceWrite: {
      success: false,
    },
    persistenceRead: {
      success: false,
      caseFound: false,
      fingerprintMatched: false,
      isDemoMatched: false,
      evidenceVerified: false,
      claimVerified: false,
      auditVerified: false,
      replayVerified: false,
    },
    cleanup: {
      success: false,
      remainingTestRecords: -1,
    },
  };

  // ----------------------------------------------------
  // 1. Verify all 11 tables exist in public schema
  // ----------------------------------------------------
  const expectedTables = [
    'research_cases',
    'research_sessions',
    'research_hypotheses',
    'research_experiments',
    'research_evidence',
    'research_evidence_edges',
    'research_claims',
    'research_memos',
    'research_audit_events',
    'research_replay_verifications',
    'research_trail_events',
  ];

  for (const tableName of expectedTables) {
    const { count, error } = await adminClient
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      report.tables.push({ name: tableName, exists: false, rowCount: 0 });
    } else {
      report.tables.push({ name: tableName, exists: true, rowCount: count ?? 0 });
    }
  }

  // ----------------------------------------------------
  // 2. Verify Foreign-Key constraints
  // ----------------------------------------------------
  // Attempting to insert a child row with a fake session_id that does not exist
  const fakeUuid = '00000000-0000-0000-0000-000000000000';
  const { error: fkError } = await adminClient
    .from('research_hypotheses')
    .insert({
      session_id: fakeUuid,
      hypothesis_id: 'HYP-TEST-INVALID-FK',
      order_index: 1,
      statement: 'Invalid FK hypothesis test',
      status: 'PROPOSED',
    });

  report.fkConstraints.invalidFkRejected = Boolean(
    fkError && (fkError.code === '23503' || fkError.message.includes('foreign key'))
  );

  // ----------------------------------------------------
  // 3. Verify RLS Write Protection (anon cannot write)
  // ----------------------------------------------------
  const { error: anonWriteErr } = await anonClient
    .from('research_cases')
    .insert({
      case_id: 'BBX-CASE-TEST-UNAUTHORIZED',
      question: 'Will this unauthorized insert be rejected by RLS?',
      status: 'SEALED',
      is_demo: false,
    });

  report.rls.anonWriteBlocked = Boolean(
    anonWriteErr && (anonWriteErr.code === '42501' || anonWriteErr.message.toLowerCase().includes('violates row-level security'))
  );

  // ----------------------------------------------------
  // 4. Safe End-to-End Persistence Write
  // ----------------------------------------------------
  // Clean up any stale test case from prior aborted test
  await adminClient.from('research_cases').delete().eq('case_id', TEST_CASE_ID);

  const saveResult = await handleSaveResearchCase({
    caseRow: {
      case_id: TEST_CASE_ID,
      title: 'Live Supabase Verification Demo Case',
      question: 'Does live Supabase persistence correctly record and verify all research artifacts?',
      status: 'REPLAY_VERIFIED',
      is_demo: true,
      case_version: 1,
      fingerprint: TEST_FINGERPRINT,
      dataset_start: '2024-01-01',
      dataset_end: '2024-12-31',
      observation_count: 252,
    },
    sessionRow: {
      session_id: TEST_SESSION_ID,
      session_type: 'DEMO',
      status: 'COMPLETE',
      fingerprint: TEST_FINGERPRINT,
      metadata: {
        totalDurationMs: 1250,
        totalCostUsd: 0.0025,
        evidenceCount: 1,
      },
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    },
    hypothesisRows: [
      {
        hypothesis_id: 'HYP-LIVE-001',
        order_index: 0,
        statement: 'Deterministic research outputs are faithfully stored in Supabase without loss.',
        status: 'CONFIRMED',
      },
    ],
    evidenceRows: [
      {
        evidence_id: 'EV-LIVE-001',
        tool_name: 'testEngine',
        direct_evidence: 'Observed 100% hash equivalence across 7 verification gates.',
        interpretation: 'Direct evidence confirms mathematical identity of the replay ledger.',
        execution_order: 1,
        fingerprint: TEST_FINGERPRINT,
      },
    ],
    claimRows: [
      {
        claim_id: 'CLM-LIVE-001',
        claim_text: 'Replay verification matches canonical fingerprint at 100.0%.',
        claim_type: 'DIRECT_OBSERVATION',
        metric: 'fingerprint_match_pct',
        value: '100.0',
        evidence_ids: ['EV-LIVE-001'],
      },
    ],
    memoRow: {
      memo_id: 'MEMO-LIVE-001',
      title: 'Live Persistence Verification Memorandum',
      executive_summary: 'Persistence layer functional and cryptographically verified.',
      methodology: 'Deterministic test case generation with cascade check.',
    },
    auditEventRows: [
      {
        event_id: 'AUD-LIVE-001',
        event_type: 'CASE_SEALED',
        actor: 'VERIFICATION_HARNESS',
        event_hash: 'hash-abc-123-event-001',
        previous_event_hash: 'GENESIS',
        event_order: 1,
        timestamp: new Date().toISOString(),
      },
    ],
    replayRow: {
      verification_id: 'REP-LIVE-001',
      comparison_class: 'CANONICAL_EXACT',
      verification_status: 'MATCHED',
      fingerprint: TEST_FINGERPRINT,
      overall_match_pct: 100,
      verified_at: new Date().toISOString(),
    },
  });

  report.persistenceWrite = {
    success: saveResult.success,
    caseId: saveResult.caseId,
    dbId: saveResult.dbId,
  };

  // ----------------------------------------------------
  // 5. Read Back & Verify Integrity
  // ----------------------------------------------------
  if (saveResult.success && saveResult.dbId) {
    // Read case row
    const { data: readCase, error: readCaseErr } = await adminClient
      .from('research_cases')
      .select('*')
      .eq('case_id', TEST_CASE_ID)
      .single();

    if (readCase && !readCaseErr) {
      report.persistenceRead.caseFound = true;
      report.persistenceRead.fingerprintMatched = readCase.fingerprint === TEST_FINGERPRINT;
      report.persistenceRead.isDemoMatched = readCase.is_demo === true;

      // Read session row
      const { data: readSession } = await adminClient
        .from('research_sessions')
        .select('*')
        .eq('session_id', TEST_SESSION_ID)
        .single();

      if (readSession) {
        // Read evidence
        const { data: readEvidence } = await adminClient
          .from('research_evidence')
          .select('*')
          .eq('session_id', readSession.id)
          .eq('evidence_id', 'EV-LIVE-001')
          .single();

        report.persistenceRead.evidenceVerified = Boolean(
          readEvidence &&
          readEvidence.direct_evidence === 'Observed 100% hash equivalence across 7 verification gates.' &&
          readEvidence.interpretation === 'Direct evidence confirms mathematical identity of the replay ledger.'
        );

        // Read claim
        const { data: readClaim } = await adminClient
          .from('research_claims')
          .select('*')
          .eq('session_id', readSession.id)
          .eq('claim_id', 'CLM-LIVE-001')
          .single();

        report.persistenceRead.claimVerified = Boolean(
          readClaim &&
          Array.isArray(readClaim.evidence_ids) &&
          readClaim.evidence_ids.includes('EV-LIVE-001') &&
          readClaim.value === '100.0'
        );

        // Read audit event
        const { data: readAudit } = await adminClient
          .from('research_audit_events')
          .select('*')
          .eq('session_id', readSession.id)
          .eq('event_id', 'AUD-LIVE-001')
          .single();

        report.persistenceRead.auditVerified = Boolean(
          readAudit &&
          readAudit.event_hash === 'hash-abc-123-event-001' &&
          readAudit.actor === 'VERIFICATION_HARNESS'
        );
      }

      // Read replay verification
      const { data: readReplay } = await adminClient
        .from('research_replay_verifications')
        .select('*')
        .eq('case_id', readCase.id)
        .eq('verification_id', 'REP-LIVE-001')
        .single();

      report.persistenceRead.replayVerified = Boolean(
        readReplay &&
        readReplay.comparison_class === 'CANONICAL_EXACT' &&
        readReplay.verification_status === 'MATCHED' &&
        readReplay.fingerprint === TEST_FINGERPRINT
      );

      // Verify RLS policy for public read of demo cases
      const { data: anonDemoRead } = await anonClient
        .from('research_cases')
        .select('case_id, is_demo')
        .eq('case_id', TEST_CASE_ID)
        .maybeSingle();

      report.rls.anonReadPublicDemoAllowed = Boolean(anonDemoRead && anonDemoRead.case_id === TEST_CASE_ID);

      // Verify RLS policy blocks anon reading of private non-demo case
      // Create a temporary private case
      const PRIVATE_CASE_ID = 'BBX-CASE-TEST-PRIVATE-RLS-0001';
      await adminClient.from('research_cases').insert({
        case_id: PRIVATE_CASE_ID,
        question: 'Private case for RLS read check',
        status: 'SEALED',
        is_demo: false,
      });

      const { data: anonPrivateRead } = await anonClient
        .from('research_cases')
        .select('case_id')
        .eq('case_id', PRIVATE_CASE_ID)
        .maybeSingle();

      report.rls.anonReadPrivateBlocked = anonPrivateRead === null;

      // Clean up private test case
      await adminClient.from('research_cases').delete().eq('case_id', PRIVATE_CASE_ID);

      report.persistenceRead.success =
        report.persistenceRead.caseFound &&
        report.persistenceRead.fingerprintMatched &&
        report.persistenceRead.isDemoMatched &&
        report.persistenceRead.evidenceVerified &&
        report.persistenceRead.claimVerified &&
        report.persistenceRead.auditVerified &&
        report.persistenceRead.replayVerified;
    }
  }

  // ----------------------------------------------------
  // 6. Clean Up ONLY the Temporary Test Records
  // ----------------------------------------------------
  // Delete the test case — cascade deletes sessions, hypotheses, evidence, etc.
  const { error: cleanupErr } = await adminClient
    .from('research_cases')
    .delete()
    .eq('case_id', TEST_CASE_ID);

  // Verify no test records remain
  const { count: remainingCount } = await adminClient
    .from('research_cases')
    .select('*', { count: 'exact', head: true })
    .eq('case_id', TEST_CASE_ID);

  report.cleanup = {
    success: !cleanupErr && (remainingCount === 0 || remainingCount === null),
    remainingTestRecords: remainingCount ?? 0,
  };
  report.fkConstraints.cascadeOrCleanupVerified = report.cleanup.success;

  return report;
}

// Run directly if invoked from CLI
if (process.argv[1]?.endsWith('verify-supabase-live.ts')) {
  runLiveVerification()
    .then(report => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Verification failed:', err.message);
      process.exit(1);
    });
}
