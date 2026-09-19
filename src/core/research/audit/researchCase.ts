/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Immutable Research Case Factory & Lifecycle
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Sections 3, 4)
 */

import { computeDeterministicHash } from '../../researchPack';
import { ResearchSession, ResearchMemo, EvidenceRecord } from '../researchTypes';
import { DATASET_FINGERPRINT_1825 } from '../researchFingerprint';
import { CaseStatus, ResearchCase } from './auditTypes';
import { buildResearchManifest } from './researchManifest';
import { canonicalStringify, computeCanonicalFingerprint } from './canonicalReproducibility';
import { globalAuditTimeline } from './auditTimeline';

// ============================================================================
// 1. DEEP IMMUTABILITY GUARDS
// ============================================================================

/**
 * Recursively freezes an object and its nested properties so that
 * any attempted mutation throws or is rejected in strict mode.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Freeze array elements or object properties
  if (Array.isArray(obj)) {
    for (const item of obj) {
      deepFreeze(item);
    }
  } else {
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val && typeof val === 'object') {
        deepFreeze(val);
      }
    }
  }

  return Object.freeze(obj);
}

// ============================================================================
// 2. CASE ID GENERATOR (DETERMINISTIC STANDARD)
// ============================================================================

let caseSequenceCounter = 1;

/**
 * Generates an institutional case ID following the standard:
 * `BBX-CASE-{YEAR}-{SEQUENCE_4_DIGITS}`
 */
export function generateCanonicalCaseId(year = new Date().getFullYear(), seq?: number): string {
  const sequenceNumber = seq ?? caseSequenceCounter++;
  const paddedSeq = String(sequenceNumber).padStart(4, '0');
  return `BBX-CASE-${year}-${paddedSeq}`;
}

// ============================================================================
// 3. CASE FACTORY (SEALING A SESSION)
// ============================================================================

export interface SealSessionOptions {
  caseId?: string;
  sealedBy?: string;
  strategy?: string;
  strategyParams?: Record<string, any>;
  transactionCostBps?: number;
  weights?: Record<string, number>;
  simulationMethod?: 'HISTORICAL_BOOTSTRAP' | 'STUDENT_T' | 'PARAMETRIC_GAUSSIAN' | 'REGIME_SWITCHING_MARKOV';
  evidenceRecords?: EvidenceRecord[];
}

/**
 * Transitions an active ResearchSession into a sealed, immutable ResearchCase.
 * Once sealed, the case cannot be silently modified.
 */
export function sealResearchSession(
  session: ResearchSession,
  memo: ResearchMemo,
  options?: SealSessionOptions
): Readonly<ResearchCase> {
  const now = Date.now();
  const caseId = options?.caseId || generateCanonicalCaseId();
  const sealedBy = options?.sealedBy || 'SYSTEM_AUDITOR';

  // 1. Build authoritative ResearchManifest
  const manifest = buildResearchManifest(session, memo, {
    caseId,
    strategy: options?.strategy,
    strategyParams: options?.strategyParams,
    transactionCostBps: options?.transactionCostBps,
    weights: options?.weights,
    simulationMethod: options?.simulationMethod,
  });

  // 2. Compute canonical-output reproducibility fingerprint
  // Evaluates canonical serialized evidence and direct findings
  const canonicalPayload = {
    caseId,
    manifestChecksum: manifest.security.checksum,
    evidence: (options?.evidenceRecords ?? []).map(ev => ({
      id: ev.evidenceId,
      tool: ev.toolName,
      direct: ev.directEvidence,
      result: ev.result,
    })),
    claims: manifest.research.claims,
    seed: manifest.simulation.seed,
  };

  const canonicalOutputFingerprint = computeCanonicalFingerprint(
    canonicalPayload,
    'bx-case'
  );

  // 3. Log CASE_SEALED event to append-only audit ledger
  globalAuditTimeline.appendEvent({
    caseId,
    eventType: 'CASE_SEALED',
    actor: 'SYSTEM',
    fingerprint: canonicalOutputFingerprint,
    details: {
      manifestId: manifest.manifestId,
      totalEvidence: (options?.evidenceRecords ?? []).length,
      sessionId: session.sessionId,
    },
  });

  const timelineChecksum = globalAuditTimeline.computeTimelineChecksum();
  const totalEvents = globalAuditTimeline.getEvents(caseId).length;

  const rawCase: ResearchCase = {
    caseId,
    caseVersion: 1,
    createdAt: session.createdAt,
    sealedAt: now,
    updatedAt: now,
    sessionId: session.sessionId,
    question: session.researchQuestion,
    normalizedQuestion: session.researchQuestion.trim().toLowerCase(),
    status: 'SEALED',

    hypotheses: session.hypothesisIds.map((id, idx) => ({
      hypothesisId: id,
      statement: memo.sections.hypotheses[idx]?.statement || `Hypothesis ${id}`,
      category: (memo.sections.hypotheses[idx]?.category as any) || 'REGIME_SENSITIVITY',
      priorEvidence: [],
      expectedEvidence: [],
      contradictingEvidence: [],
      status: (memo.sections.hypotheses[idx]?.status as any) || 'INCONCLUSIVE',
      confidence: (memo.sections.hypotheses[idx]?.confidence as any) || 'MODERATE_EVIDENCE',
      testIds: [],
      createdAt: session.createdAt,
    })),

    experiments: (options?.evidenceRecords ?? []).map((ev, idx) => ({
      experimentId: ev.experimentId || `EXP-${String(idx + 1).padStart(3, '0')}`,
      purpose: `Execute ${ev.toolName}`,
      toolName: ev.toolName,
      arguments: ev.arguments,
      expectedEvidence: ev.directEvidence,
      maximumExecutions: 1,
      dependencies: [],
      dataWindow: {
        startDate: ev.dataWindow.startDate,
        endDate: ev.dataWindow.endDate,
      },
      status: 'SUCCESS',
      fingerprint: ev.fingerprint,
    })),

    evidence: options?.evidenceRecords ?? [],
    contradictions: [],
    secondaryTests: [],
    synthesis: session.synthesis,
    memo,

    provenance: { ...session.provenance },
    manifestId: manifest.manifestId,
    manifest,

    sessionFingerprint: session.configurationFingerprint,
    datasetFingerprint: session.datasetFingerprint || DATASET_FINGERPRINT_1825,

    reproducibilityMetadata: {
      canonicalOutputFingerprint,
      verificationCount: 0,
    },

    auditMetadata: {
      totalEvents,
      timelineChecksum,
      sealedBy,
    },
  };

  // Deep-freeze to guarantee immutability
  return deepFreeze(rawCase);
}

// ============================================================================
// 4. COPY-ON-WRITE EVOLUTION (NEVER SILENTLY MUTATES)
// ============================================================================

/**
 * Creates an evolved immutable copy of a ResearchCase with an updated status
 * or verification count, logging the change to the audit ledger.
 */
export function evolveCaseStatus(
  originalCase: Readonly<ResearchCase>,
  newStatus: CaseStatus,
  options?: {
    actor?: 'SYSTEM' | 'RESEARCHER' | 'AI_AUDITOR';
    reason?: string;
  }
): Readonly<ResearchCase> {
  const now = Date.now();

  globalAuditTimeline.appendEvent({
    caseId: originalCase.caseId,
    eventType: newStatus === 'REPLAY_VERIFIED' ? 'REPLAY_COMPLETED' : 'REPLAY_MISMATCH',
    actor: options?.actor ?? 'SYSTEM',
    fingerprint: originalCase.reproducibilityMetadata.canonicalOutputFingerprint,
    details: {
      priorStatus: originalCase.status,
      newStatus,
      reason: options?.reason ?? 'Status evolved via verification audit.',
    },
  });

  const updatedCase: ResearchCase = {
    ...originalCase,
    status: newStatus,
    updatedAt: now,
    reproducibilityMetadata: {
      ...originalCase.reproducibilityMetadata,
      verificationCount: originalCase.reproducibilityMetadata.verificationCount + 1,
      lastReplayedAt: now,
      lastReplayStatus: newStatus,
    },
    auditMetadata: {
      ...originalCase.auditMetadata,
      totalEvents: globalAuditTimeline.getEvents(originalCase.caseId).length,
      timelineChecksum: globalAuditTimeline.computeTimelineChecksum(),
    },
  };

  return deepFreeze(updatedCase);
}

// ============================================================================
// 5. CASE INTEGRITY VALIDATOR
// ============================================================================

export function validateResearchCase(caseData: ResearchCase): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!caseData.caseId || !caseData.caseId.startsWith('BBX-CASE-')) {
    errors.push(`Invalid caseId format: "${caseData.caseId}". Expected "BBX-CASE-YYYY-XXXX".`);
  }

  if (!caseData.manifestId || !caseData.manifest) {
    errors.push('Case is missing mandatory ResearchManifest attachment.');
  }

  if (!caseData.reproducibilityMetadata?.canonicalOutputFingerprint) {
    errors.push('Case is missing canonical output reproducibility fingerprint.');
  }

  // Ensure claims are backed by evidence
  if (caseData.manifest?.research?.claims) {
    for (const claim of caseData.manifest.research.claims) {
      if (!claim.evidenceIds || claim.evidenceIds.length === 0) {
        errors.push(`Unsupported claim rejection: Claim "${claim.claimId}" has zero bound evidence records.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
