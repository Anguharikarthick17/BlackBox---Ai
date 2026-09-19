/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Immutable Research Session Factory & Lifecycle
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import { ResearchSession, ResearchSessionStatus, SessionProvenance } from './researchTypes';
import { validateStateTransition } from './researchStateMachine';
import { DATASET_FINGERPRINT_1825, generateSessionFingerprint } from './researchFingerprint';

/**
 * Standard institutional limitations attached to all research sessions.
 */
export const DEFAULT_METHODOLOGICAL_LIMITATIONS: string[] = [
  'Evaluated on offline simulated historical demonstration dataset (2019-01-01 to 2023-12-31, 1,825 synchronized bars).',
  'Non-predictive historical backtest with 10 bps friction and zero look-ahead next-bar execution.',
  'First-order Markov regime switching assumes stationary transition probabilities across sample.',
  'Simulated distributions reflect historical return characteristics and do not guarantee future performance.',
  'Analysis is for institutional quantitative research purposes only and does not constitute financial advice.',
];

/**
 * Engine version catalog for provenance tracking.
 */
export const ENGINE_VERSIONS: Record<string, string> = {
  quantCore: '1.0',
  psCompliance: '2.0',
  stressEngine: '3.2',
  genomeEngine: '3.3',
  riskCommittee: '3.4',
  assistant: '3.5',
  quantAgent: '3.6',
  portfolio: '3.7',
  monteCarlo: '3.8',
  regimeMonteCarlo: '3.9',
  researchWorkspace: '4.0',
};

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a new ResearchSession in DRAFT status.
 */
export function createResearchSession(
  researchQuestion: string,
  options?: {
    seed?: number;
    startDate?: string;
    endDate?: string;
    observationCount?: number;
  }
): ResearchSession {
  const normalizedQuestion = researchQuestion.trim();
  if (!normalizedQuestion) {
    throw new Error('Research inquiry cannot be empty.');
  }

  const seed = options?.seed ?? 42;
  const now = Date.now();
  const sessionId = generateUUID();

  const provenance: SessionProvenance = {
    dataWindow: {
      startDate: options?.startDate ?? '2019-01-01',
      endDate: options?.endDate ?? '2023-12-31',
      observationCount: options?.observationCount ?? 1825,
    },
    engineVersions: { ...ENGINE_VERSIONS },
    totalExecutionDurationMs: 0,
    totalToolsExecuted: 0,
    deterministicSeed: seed,
  };

  const initialFingerprint = generateSessionFingerprint({
    researchQuestion: normalizedQuestion,
    datasetFingerprint: DATASET_FINGERPRINT_1825,
    experimentIds: [],
    hypothesisIds: [],
    deterministicSeed: seed,
  });

  return {
    sessionId,
    researchQuestion: normalizedQuestion,
    createdAt: now,
    updatedAt: now,
    status: 'DRAFT',
    configurationFingerprint: initialFingerprint,
    datasetFingerprint: DATASET_FINGERPRINT_1825,
    experimentIds: [],
    hypothesisIds: [],
    evidenceIds: [],
    contradictionIds: [],
    limitations: [...DEFAULT_METHODOLOGICAL_LIMITATIONS],
    nextTests: [],
    provenance,
  };
}

/**
 * Transitions session to a new lifecycle state with strict transition validation.
 * Preserves all collected evidence even on failure or cancellation.
 */
export function transitionSession(
  session: ResearchSession,
  targetStatus: ResearchSessionStatus,
  options?: {
    errorMessage?: string;
    durationDeltaMs?: number;
    toolsExecutedDelta?: number;
  }
): ResearchSession {
  validateStateTransition(session.status, targetStatus);

  const now = Date.now();
  const updatedProvenance: SessionProvenance = {
    ...session.provenance,
    totalExecutionDurationMs:
      session.provenance.totalExecutionDurationMs + (options?.durationDeltaMs ?? 0),
    totalToolsExecuted:
      session.provenance.totalToolsExecuted + (options?.toolsExecutedDelta ?? 0),
  };

  const updatedFingerprint = generateSessionFingerprint({
    researchQuestion: session.researchQuestion,
    datasetFingerprint: session.datasetFingerprint,
    experimentIds: session.experimentIds,
    hypothesisIds: session.hypothesisIds,
    deterministicSeed: session.provenance.deterministicSeed,
  });

  return {
    ...session,
    status: targetStatus,
    updatedAt: now,
    configurationFingerprint: updatedFingerprint,
    provenance: updatedProvenance,
    errorMessage: options?.errorMessage ?? session.errorMessage,
  };
}
