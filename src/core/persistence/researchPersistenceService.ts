/**
 * BLACKBOX X — Research Persistence Service
 * 
 * Unified interface for persisting and retrieving research artifacts.
 * 
 * ARCHITECTURE:
 *   1. Local deterministic engines compute quantitative results.
 *   2. This service persists compact research ARTIFACTS to Supabase.
 *   3. If Supabase is unavailable, falls back gracefully to in-memory store.
 *   4. The app NEVER breaks due to Supabase being offline.
 * 
 * DATA OWNERSHIP:
 *   Quantitative result -> local deterministic engine (source of truth)
 *   Research artifact -> ResearchCase architecture
 *   Persistence -> Supabase (this service)
 */

import type { ResearchCase, AuditEvent, ReplayVerificationRecord } from '../research/audit/auditTypes';
import type { ResearchSession, EvidenceRecord, ResearchMemo, GraphEdge } from '../research/researchTypes';
import type { PersistenceResult, PersistenceStatus } from './persistenceTypes';
import {
  mapCaseToCaseRow,
  mapSessionToSessionRow,
  mapHypothesisToRow,
  mapExperimentToRow,
  mapEvidenceToRow,
  mapEdgeToRow,
  mapClaimToRow,
  mapMemoToRow,
  mapAuditEventToRow,
  mapReplayVerificationToRow,
} from './supabaseMappers';
import { globalResearchCaseStore } from '../research/audit/researchCaseStore';

// ============================================================
// PERSISTENCE API CLIENT
// ============================================================

/**
 * Posts a JSON body to the server persistence API.
 * Server handles Supabase writes using the service role key.
 */
async function persistenceApiCall(
  path: string,
  method: 'POST' | 'GET',
  body?: unknown
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json();
    if (!response.ok) {
      return { ok: false, error: json.error || `HTTP ${response.status}` };
    }
    return { ok: true, data: json };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * Checks if the persistence layer is reachable.
 * Returns ONLINE, OFFLINE, or UNCONFIGURED.
 */
export async function checkPersistenceHealth(): Promise<PersistenceStatus> {
  try {
    const result = await persistenceApiCall('/api/research/health', 'GET');
    if (result.ok) {
      return { status: 'ONLINE', message: 'Supabase persistence available' };
    }
    return { status: 'OFFLINE', message: result.error || 'Persistence unavailable' };
  } catch {
    return { status: 'OFFLINE', message: 'Persistence layer unreachable' };
  }
}

// ============================================================
// SAVE RESEARCH CASE (with all child records)
// ============================================================

export interface SaveResearchCaseOptions {
  isDemo?: boolean;
  userId?: string;
  auditEvents?: AuditEvent[];
  replayVerification?: ReplayVerificationRecord;
}

/**
 * Persists a sealed ResearchCase and all associated records to Supabase.
 * Falls back to local in-memory store if persistence is unavailable.
 * 
 * IMPORTANT:
 *   - caseData must be sealed (status: SEALED or REPLAY_VERIFIED).
 *   - Demo cases are tagged is_demo=true and isolated.
 *   - Monte Carlo raw paths are never included.
 */
export async function saveResearchCase(
  caseData: Readonly<ResearchCase>,
  options?: SaveResearchCaseOptions
): Promise<PersistenceResult> {
  // Always save to local in-memory store first (offline-first guarantee)
  try {
    globalResearchCaseStore.saveCase(caseData);
  } catch (localErr) {
    console.warn('[BLACKBOX X Persistence] Local store save failed:', (localErr as Error).message);
  }

  // Build the full persistence payload
  const caseRow = mapCaseToCaseRow(caseData, {
    isDemo: options?.isDemo ?? false,
    userId: options?.userId,
  });

  const sessionRow = caseData.status !== 'REVOKED'
    ? {
        session_id: caseData.sessionId,
        session_type: options?.isDemo ? 'DEMO' : 'STANDARD',
        status: 'COMPLETE',
        fingerprint: caseData.sessionFingerprint,
        metadata: {
          datasetFingerprint: caseData.datasetFingerprint,
        },
      }
    : null;

  const hypothesisRows = caseData.hypotheses.map((h, i) =>
    mapHypothesisToRow(h, caseData.sessionId, i)
  );

  const experimentRows = caseData.experiments.map((e, i) =>
    mapExperimentToRow(e, caseData.sessionId, i)
  );

  const evidenceRows = caseData.evidence.map(ev =>
    mapEvidenceToRow(ev, caseData.sessionId)
  );

  const claimRows = (caseData.memo?.sections.quantitativeFindings ?? []).map(
    (finding, i) => ({
      session_id: caseData.sessionId,
      claim_id: finding.claimId,
      claim_text: finding.text,
      claim_type: 'DIRECT_OBSERVATION' as const,
      metric: finding.metric,
      value: String(finding.value),
      evidence_ids: finding.boundEvidence,
    })
  );

  const memoRow = caseData.memo
    ? mapMemoToRow(caseData.memo, caseData.sessionId)
    : null;

  const auditEventRows = (options?.auditEvents ?? []).map((ev, i) =>
    mapAuditEventToRow(ev, caseData.sessionId, i)
  );

  const replayRow = options?.replayVerification
    ? {
        ...mapReplayVerificationToRow(
          options.replayVerification,
          'PLACEHOLDER', // Case DB UUID assigned after insert
          caseData.sessionId
        ),
      }
    : null;

  // Send to server persistence API
  const result = await persistenceApiCall('/api/research/cases', 'POST', {
    caseRow,
    sessionRow,
    hypothesisRows,
    experimentRows,
    evidenceRows,
    claimRows,
    memoRow,
    auditEventRows,
    replayRow,
  });

  if (!result.ok) {
    console.warn('[BLACKBOX X Persistence] Server save failed, operating in LOCAL ONLY mode:', result.error);
    return {
      success: false,
      caseId: caseData.caseId,
      error: result.error,
      offline: true,
    };
  }

  return {
    success: true,
    caseId: caseData.caseId,
    dbId: (result.data as any)?.dbId,
    offline: false,
  };
}

// ============================================================
// LIST RESEARCH CASES
// ============================================================

export interface ListCasesOptions {
  isDemo?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Lists persisted research cases.
 * Falls back to local in-memory store if persistence is unavailable.
 */
export async function listResearchCases(
  options?: ListCasesOptions
): Promise<{ cases: ResearchCase[]; source: 'REMOTE' | 'LOCAL'; error?: string }> {
  const params = new URLSearchParams();
  if (options?.isDemo !== undefined) params.set('is_demo', String(options.isDemo));
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const result = await persistenceApiCall(
    `/api/research/cases?${params.toString()}`,
    'GET'
  );

  if (!result.ok) {
    // Offline fallback: return local in-memory cases
    const localCases = globalResearchCaseStore.listCases();
    return {
      cases: localCases as ResearchCase[],
      source: 'LOCAL',
      error: result.error,
    };
  }

  const remoteCases = (result.data as any)?.cases ?? [];
  return { cases: remoteCases, source: 'REMOTE' };
}

// ============================================================
// GET SINGLE CASE
// ============================================================

/**
 * Retrieves a single research case by caseId (BBX-CASE-YYYY-XXXX).
 * Falls back to local in-memory store if unavailable.
 */
export async function getResearchCase(
  caseId: string
): Promise<{ caseData: ResearchCase | null; source: 'REMOTE' | 'LOCAL'; error?: string }> {
  const result = await persistenceApiCall(`/api/research/cases/${caseId}`, 'GET');

  if (!result.ok) {
    const localCase = globalResearchCaseStore.getCase(caseId) ?? null;
    return {
      caseData: localCase as ResearchCase | null,
      source: 'LOCAL',
      error: result.error,
    };
  }

  return {
    caseData: (result.data as any)?.caseData ?? null,
    source: 'REMOTE',
  };
}

// ============================================================
// SAVE REPLAY VERIFICATION
// ============================================================

/**
 * Persists a replay verification record for a previously saved case.
 */
export async function saveReplayVerification(
  caseId: string,
  verification: ReplayVerificationRecord
): Promise<PersistenceResult> {
  const result = await persistenceApiCall(
    `/api/research/cases/${caseId}/replay`,
    'POST',
    { verification: {
        verification_id: verification.verificationId,
        verification_status: verification.overallStatus,
        overall_match_pct: verification.fingerprintComparison?.identical ? 100.0 : 0.0,
        gate_results: verification.tierResults,
        mismatch_type: verification.primaryMismatchType,
        fingerprint: verification.fingerprintComparison?.originalFingerprint,
        verified_at: new Date(verification.replayedAt).toISOString(),
      }
    }
  );

  return {
    success: result.ok,
    caseId,
    error: result.error,
    offline: !result.ok,
  };
}
