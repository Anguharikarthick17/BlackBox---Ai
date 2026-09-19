/**
 * BLACKBOX X — Supabase Domain <-> Database Row Bidirectional Mappers
 * 
 * Maps existing domain objects (ResearchCase, EvidenceRecord, etc.)
 * to database row representations and back.
 * 
 * IMPORTANT: These mappers do NOT duplicate domain types.
 * They use the existing canonical types from researchTypes.ts and auditTypes.ts.
 */

import type { ResearchCase, AuditEvent, ReplayVerificationRecord } from '../research/audit/auditTypes';
import type {
  ResearchSession,
  ResearchHypothesis,
  ExperimentNode,
  EvidenceRecord,
  ResearchClaim,
  ResearchMemo,
  GraphEdge,
} from '../research/researchTypes';
import type {
  ResearchCaseRow,
  ResearchSessionRow,
  ResearchHypothesisRow,
  ResearchExperimentRow,
  ResearchEvidenceRow,
  ResearchEvidenceEdgeRow,
  ResearchClaimRow,
  ResearchMemoRow,
  ResearchAuditEventRow,
  ResearchReplayVerificationRow,
} from './persistenceTypes';
import {
  serializeEvidenceRecord,
  serializeResearchClaim,
  serializeResearchMemo,
  serializeAuditEvent,
  serializeReplayVerification,
  serializeResearchCaseManifest,
  safeSerialize,
} from './compactSerializers';

// ============================================================
// RESEARCH CASE MAPPER
// ============================================================

export function mapCaseToCaseRow(
  caseData: ResearchCase,
  options?: { isDemo?: boolean; userId?: string }
): ResearchCaseRow {
  const manifest = caseData.manifest;
  const compactManifest = serializeResearchCaseManifest(caseData);

  return {
    case_id: caseData.caseId,
    title: `Research: ${caseData.question.slice(0, 80)}`,
    question: caseData.question,
    normalized_question: caseData.normalizedQuestion,
    status: caseData.status,
    case_version: caseData.caseVersion,
    is_demo: options?.isDemo ?? false,

    asset_universe: manifest.data
      ? safeSerialize(manifest.data) as Record<string, unknown>
      : undefined,
    strategy_config: manifest.strategy
      ? safeSerialize(manifest.strategy) as Record<string, unknown>
      : undefined,
    portfolio_config: manifest.portfolio
      ? safeSerialize(manifest.portfolio) as Record<string, unknown>
      : undefined,
    simulation_config: manifest.simulation
      ? safeSerialize(manifest.simulation) as Record<string, unknown>
      : undefined,
    engine_config: manifest.engines
      ? safeSerialize(manifest.engines) as Record<string, unknown>
      : undefined,
    research_config: manifest.research
      ? safeSerialize(manifest.research) as Record<string, unknown>
      : undefined,

    manifest: compactManifest,
    session_fingerprint: caseData.sessionFingerprint,
    dataset_fingerprint: caseData.datasetFingerprint,
    fingerprint: caseData.reproducibilityMetadata?.canonicalOutputFingerprint,

    dataset_start: manifest.data?.startDate,
    dataset_end: manifest.data?.endDate,
    observation_count: manifest.data?.observationCount,

    user_id: options?.userId,
    sealed_at: caseData.sealedAt ? new Date(caseData.sealedAt).toISOString() : undefined,
    created_at: new Date(caseData.createdAt).toISOString(),
    updated_at: new Date(caseData.updatedAt).toISOString(),
  };
}

// ============================================================
// SESSION MAPPER
// ============================================================

export function mapSessionToSessionRow(
  session: ResearchSession,
  caseDbId?: string,
  options?: { userId?: string }
): ResearchSessionRow {
  return {
    session_id: session.sessionId,
    case_id: caseDbId,
    session_type: 'STANDARD',
    status: session.status,
    fingerprint: session.configurationFingerprint,
    metadata: safeSerialize({
      dataWindow: session.provenance.dataWindow,
      engineVersions: session.provenance.engineVersions,
      totalExecutionDurationMs: session.provenance.totalExecutionDurationMs,
      totalToolsExecuted: session.provenance.totalToolsExecuted,
      deterministicSeed: session.provenance.deterministicSeed,
      limitations: session.limitations,
      nextTests: session.nextTests,
      errorMessage: session.errorMessage,
    }) as Record<string, unknown>,
    user_id: options?.userId,
    started_at: new Date(session.createdAt).toISOString(),
    completed_at: session.status === 'COMPLETE' ? new Date(session.updatedAt).toISOString() : undefined,
    created_at: new Date(session.createdAt).toISOString(),
  };
}

// ============================================================
// HYPOTHESIS MAPPER
// ============================================================

export function mapHypothesisToRow(
  hypothesis: ResearchHypothesis,
  sessionDbId: string,
  orderIndex: number
): ResearchHypothesisRow {
  return {
    session_id: sessionDbId,
    hypothesis_id: hypothesis.hypothesisId,
    statement: hypothesis.statement,
    category: hypothesis.category,
    status: hypothesis.status,
    confidence: hypothesis.confidence,
    thresholds: {
      testIds: hypothesis.testIds,
    },
    direct_evidence: {
      priorEvidence: hypothesis.priorEvidence,
      expectedEvidence: hypothesis.expectedEvidence,
      contradictingEvidence: hypothesis.contradictingEvidence,
    },
    order_index: orderIndex,
    created_at: new Date(hypothesis.createdAt).toISOString(),
  };
}

// ============================================================
// EXPERIMENT MAPPER
// ============================================================

export function mapExperimentToRow(
  experiment: ExperimentNode,
  sessionDbId: string,
  executionOrder: number
): ResearchExperimentRow {
  return {
    session_id: sessionDbId,
    experiment_id: experiment.experimentId,
    tool_name: experiment.toolName,
    arguments: safeSerialize(experiment.arguments) as Record<string, unknown>,
    data_window: {
      startDate: experiment.dataWindow.startDate,
      endDate: experiment.dataWindow.endDate,
    },
    status: experiment.status,
    execution_order: executionOrder,
    result_summary: undefined, // Result summary lives in evidence records
    fingerprint: experiment.fingerprint,
    completed_at: experiment.status === 'SUCCESS' ? new Date().toISOString() : undefined,
  };
}

// ============================================================
// EVIDENCE RECORD MAPPER
// ============================================================

export function mapEvidenceToRow(
  record: EvidenceRecord,
  sessionDbId: string
): ResearchEvidenceRow {
  const serialized = serializeEvidenceRecord(record);
  return {
    session_id: sessionDbId,
    ...serialized,
    created_at: new Date(record.timestamp).toISOString(),
  };
}

// ============================================================
// GRAPH EDGE MAPPER
// ============================================================

export function mapEdgeToRow(
  edge: GraphEdge,
  sessionDbId: string
): ResearchEvidenceEdgeRow {
  return {
    session_id: sessionDbId,
    source_id: edge.source,
    target_id: edge.target,
    edge_type: edge.type,
    metadata: edge.metadata
      ? safeSerialize(edge.metadata) as Record<string, unknown>
      : undefined,
  };
}

// ============================================================
// CLAIM MAPPER
// ============================================================

export function mapClaimToRow(
  claim: ResearchClaim,
  sessionDbId: string
): ResearchClaimRow {
  const serialized = serializeResearchClaim(claim);
  return {
    session_id: sessionDbId,
    ...serialized,
    evidence_ids: serialized.evidence_ids,
  };
}

// ============================================================
// MEMO MAPPER
// ============================================================

export function mapMemoToRow(
  memo: ResearchMemo,
  sessionDbId: string
): ResearchMemoRow {
  const serialized = serializeResearchMemo(memo);
  return {
    session_id: sessionDbId,
    ...serialized,
  };
}

// ============================================================
// AUDIT EVENT MAPPER
// ============================================================

export function mapAuditEventToRow(
  event: AuditEvent,
  sessionDbId?: string,
  eventOrder?: number
): ResearchAuditEventRow {
  const serialized = serializeAuditEvent(event);
  return {
    session_id: sessionDbId,
    case_id: event.caseId,
    ...serialized,
    event_order: eventOrder ?? 0,  // override serialized.event_order with caller-supplied index
  };
}

// ============================================================
// REPLAY VERIFICATION MAPPER
// ============================================================

export function mapReplayVerificationToRow(
  record: ReplayVerificationRecord,
  caseDbId: string,
  sessionDbId?: string
): ResearchReplayVerificationRow {
  const serialized = serializeReplayVerification(record);
  
  // Compute overall match percentage from fingerprint comparison
  const isIdentical = record.fingerprintComparison?.identical ?? false;
  const matchPct = isIdentical ? 100.0 : 0.0;

  return {
    case_id: caseDbId,
    session_id: sessionDbId,
    overall_match_pct: matchPct,
    verified_at: new Date(record.replayedAt).toISOString(),
    ...serialized,
  };
}
