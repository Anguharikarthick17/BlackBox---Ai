/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Core Type Definitions & Data Contracts
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md
 */

import {
  ResearchSession,
  ResearchHypothesis,
  ExperimentNode,
  EvidenceRecord,
  ContradictionRecord,
  SecondaryTestRecord,
  ResearchSynthesis,
  ResearchMemo,
  SessionProvenance,
  SessionDataWindow,
  ResearchClaim,
} from '../researchTypes';

// ============================================================================
// 1. CASE LIFECYCLE & STATUS
// ============================================================================

export type CaseStatus =
  | 'SEALED'              // Normal completed session, permanently locked
  | 'REPLAY_VERIFIED'     // Successfully replayed with 100% canonical-output match
  | 'REPLAY_DIVERGENT'    // Replay exhibited parameter, evidence, or numerical divergence
  | 'ARCHIVED'            // Historical reference case
  | 'REVOKED';            // Invalidated by audit due to corrupted input data

// ============================================================================
// 2. REPLAY MISMATCH TAXONOMY & PRECEDENCE (PATCH 3)
// ============================================================================

export type ReplayMismatchType =
  | 'SCHEMA_MISMATCH'          // Rank 1: Manifest JSON syntax or schema invalid; cannot execute
  | 'VERSION_MISMATCH'         // Rank 2: Quantitative engine semver or breaking contract change
  | 'TOOL_UNAVAILABLE'         // Rank 3: Required analytical tool not registered in environment
  | 'CONFIGURATION_MISMATCH'   // Rank 4: Case parameters (weights, costs, lookback, seed) differ
  | 'DATA_MISMATCH'            // Rank 5: Date window, observation count, or price points differ
  | 'NUMERICAL_MISMATCH'       // Rank 6: Config & version match, but numerical delta > metric tolerance
  | 'EVIDENCE_MISMATCH'        // Rank 7: Numbers match, but evidence record structure/count differs
  | 'CLAIM_MISMATCH'           // Rank 8: Evidence matches, but structured claim binding differs
  | 'SYNTHESIS_MISMATCH'       // Rank 9: Claims match, but contradiction resolution/synthesis differs
  | 'REPLAY_FAILURE';          // Rank 10: Runtime exception, worker crash, or execution timeout

export const REPLAY_MISMATCH_PRECEDENCE: Record<ReplayMismatchType, number> = {
  SCHEMA_MISMATCH: 1,
  VERSION_MISMATCH: 2,
  TOOL_UNAVAILABLE: 3,
  CONFIGURATION_MISMATCH: 4,
  DATA_MISMATCH: 5,
  NUMERICAL_MISMATCH: 6,
  EVIDENCE_MISMATCH: 7,
  CLAIM_MISMATCH: 8,
  SYNTHESIS_MISMATCH: 9,
  REPLAY_FAILURE: 10,
};

// ============================================================================
// 3. NUMERICAL COMPARISON CLASSES (PATCH 2)
// ============================================================================

export type ComparisonClass = 'EXACT' | 'CANONICAL_EXACT' | 'NUMERICAL_TOLERANCE';

export interface MetricToleranceSpec {
  metric: string;
  comparisonClass: ComparisonClass;
  tolerance: number;
  rationale: string;
}

// ============================================================================
// 4. RESEARCH MANIFEST CONTRACT (7 SECTIONS)
// ============================================================================

export interface ManifestDataSection {
  assetUniverse: string[];
  assetCanonicalOrdering: string[];
  startDate: string;
  endDate: string;
  observationCount: number;
  synchronizationPolicy: 'EXACT_CALENDAR_INTERSECTION' | string;
  datasetFingerprint: string;
  provenanceSource: string;
}

export interface ManifestStrategySection {
  strategy: string;
  parameters: Record<string, any>;
  executionConvention: 'NEXT_BAR_OPEN' | string;
  positionSizing: 'EQUAL_WEIGHT' | 'SIMPLEX_WEIGHTED' | string;
  transactionCostBps: number;
  benchmark: string;
}

export interface ManifestPortfolioSection {
  weights: Record<string, number>;
  rebalancePolicy: 'DAILY' | 'BUY_AND_HOLD' | 'MONTHLY';
  optimizationConfig: {
    targetReturn?: number;
    riskFreeRate: number;
    simplexTolerance: number;
  };
}

export interface ManifestSimulationSection {
  method: 'HISTORICAL_BOOTSTRAP' | 'STUDENT_T' | 'PARAMETRIC_GAUSSIAN' | 'REGIME_SWITCHING_MARKOV';
  pathCount: number;
  horizonDays: number;
  seed: number;
  startingRegime?: string;
  rebalancingEnabled: boolean;
}

export interface ManifestEngineSection {
  engineVersions: Record<string, string>;
  methodologyVersions: Record<string, string>;
  toolVersions: Record<string, string>;
}

export interface ManifestResearchSection {
  question: string;
  normalizedQuestion: string;
  hypotheses: Array<{
    id: string;
    statement: string;
    category: string;
  }>;
  experimentDAG: Array<{
    experimentId: string;
    toolName: string;
    dependencies: string[];
  }>;
  experimentArguments: Record<string, Record<string, any>>;
  evidenceIds: string[];
  contradictionIds: string[];
  secondaryTestIds: string[];
  claims: Array<{
    claimId: string;
    metric: string;
    value: number | string;
    evidenceIds: string[];
  }>;
}

export interface ManifestSecuritySection {
  secretsExcluded: boolean;
  apiKeysExcluded: boolean;
  executableCodeExcluded: boolean;
  checksum: string;
}

export interface ResearchManifest {
  manifestVersion: '4.1.0';
  manifestId: string;
  caseId: string;
  createdAt: string;
  data: ManifestDataSection;
  strategy: ManifestStrategySection;
  portfolio: ManifestPortfolioSection;
  simulation: ManifestSimulationSection;
  engines: ManifestEngineSection;
  research: ManifestResearchSection;
  security: ManifestSecuritySection;
}

// ============================================================================
// 5. RESEARCH CASE CONTRACT
// ============================================================================

export interface ResearchCase {
  readonly caseId: string;
  readonly caseVersion: number;
  readonly createdAt: number;
  readonly sealedAt: number;
  readonly updatedAt: number;
  readonly sessionId: string;
  readonly question: string;
  readonly normalizedQuestion: string;
  readonly status: CaseStatus;

  readonly hypotheses: ReadonlyArray<ResearchHypothesis>;
  readonly experiments: ReadonlyArray<ExperimentNode>;
  readonly evidence: ReadonlyArray<EvidenceRecord>;
  readonly contradictions: ReadonlyArray<ContradictionRecord>;
  readonly secondaryTests: ReadonlyArray<SecondaryTestRecord>;
  readonly synthesis?: Readonly<ResearchSynthesis>;
  readonly memo?: Readonly<ResearchMemo>;

  readonly provenance: Readonly<SessionProvenance>;
  readonly manifestId: string;
  readonly manifest: Readonly<ResearchManifest>;

  readonly sessionFingerprint: string;
  readonly datasetFingerprint: string;

  readonly reproducibilityMetadata: {
    readonly canonicalOutputFingerprint: string;
    readonly verificationCount: number;
    readonly lastReplayedAt?: number;
    readonly lastReplayStatus?: CaseStatus;
  };

  readonly auditMetadata: {
    readonly totalEvents: number;
    readonly timelineChecksum: string;
    readonly sealedBy: string;
  };
}

// ============================================================================
// 6. REPLAY VERIFICATION DATA CONTRACTS
// ============================================================================

export interface ConfigurationMismatch {
  parameterPath: string;
  originalValue: any;
  replayValue: any;
  precedence: 4;
}

export interface DataWindowMismatch {
  field: 'startDate' | 'endDate' | 'observationCount' | 'dataFingerprint';
  originalValue: string | number;
  replayValue: string | number;
  precedence: 5;
}

export interface NumericalMismatch {
  metric: string;
  comparisonClass: 'NUMERICAL_TOLERANCE';
  toleranceBudget: number;
  originalValue: number;
  replayValue: number;
  absoluteDelta: number;
  relativeDeltaPct: number;
  withinTolerance: boolean;
  precedence: 6;
}

export interface EvidenceMismatch {
  evidenceId: string;
  toolName: string;
  divergenceType: 'PAYLOAD_SCHEMA' | 'RECORD_COUNT' | 'MISSING_FIELD';
  description: string;
  precedence: 7;
}

export interface ClaimMismatch {
  claimId: string;
  metric: string;
  originalClaimText: string;
  boundEvidenceId: string;
  replayedEvidenceValue: number | string;
  reason: string;
  precedence: 8;
}

export interface ReplayTierResults {
  level1Configuration: {
    status: 'PASS' | 'FAIL';
    mismatches: ConfigurationMismatch[];
  };
  level2DataWindow: {
    status: 'PASS' | 'FAIL';
    mismatches: DataWindowMismatch[];
  };
  level3ExperimentPlan: {
    status: 'PASS' | 'FAIL';
    mismatches: string[];
  };
  level4EvidenceRecords: {
    status: 'PASS' | 'FAIL';
    mismatches: EvidenceMismatch[];
    numericalMismatches: NumericalMismatch[];
  };
  level5ResearchClaims: {
    status: 'PASS' | 'FAIL';
    mismatches: ClaimMismatch[];
  };
  level6Synthesis: {
    status: 'PASS' | 'FAIL';
    mismatches: string[];
  };
}

export interface ReplayVerificationRecord {
  verificationId: string;
  caseId: string;
  replayedAt: number;
  overallStatus: 'MATCHED' | 'MISMATCHED' | 'INCOMPATIBLE' | 'FAILED';

  primaryMismatchType?: ReplayMismatchType;
  mismatchPrecedenceLevel?: number;
  allMismatchTypes: ReplayMismatchType[];

  tierResults: ReplayTierResults;

  fingerprintComparison: {
    originalFingerprint: string;
    replayFingerprint: string;
    identical: boolean;
  };

  totalReplayLatencyMs: number;
}

// ============================================================================
// 7. AUDIT TIMELINE EVENT CONTRACTS
// ============================================================================

export type AuditEventType =
  | 'CASE_CREATED'
  | 'HYPOTHESES_LOCKED'
  | 'EXPERIMENT_PLAN_LOCKED'
  | 'EXPERIMENT_STARTED'
  | 'EXPERIMENT_COMPLETED'
  | 'EVIDENCE_CREATED'
  | 'CONTRADICTION_CHECKED'
  | 'SECONDARY_TEST_STARTED'
  | 'SECONDARY_TEST_COMPLETED'
  | 'SYNTHESIS_CREATED'
  | 'CASE_SEALED'
  | 'REPLAY_STARTED'
  | 'REPLAY_COMPLETED'
  | 'REPLAY_MISMATCH'
  | 'CASE_ARCHIVED'
  | 'CASE_REVOKED';

export interface AuditEvent {
  eventId: string;
  caseId: string;
  timestamp: number;
  eventType: AuditEventType;
  entityId?: string;
  actor: 'SYSTEM' | 'RESEARCHER' | 'AI_AUDITOR';
  fingerprint?: string;
  details: Record<string, any>;
}

// ============================================================================
// 8. RESEARCH DIFF ENGINE CONTRACTS
// ============================================================================

export type DiffDirection = 'INCREASED' | 'DECREASED' | 'IDENTICAL' | 'CHANGED' | 'ADDED' | 'REMOVED';

export interface QuantitativeMetricDelta {
  metric: string;
  caseAValue: number | string;
  caseBValue: number | string;
  absoluteDelta?: number;
  relativeDeltaPct?: number;
  direction: DiffDirection;
  comparisonClass: ComparisonClass;
}

export interface CategoricalDelta {
  dimension: string;
  caseAValue: string;
  caseBValue: string;
  identical: boolean;
}

export interface ResearchDiffSection {
  sectionName: string;
  categoricalDeltas: CategoricalDelta[];
  quantitativeDeltas: QuantitativeMetricDelta[];
}

export interface ResearchDiffResult {
  caseAId: string;
  caseBId: string;
  comparedAt: number;
  neutralSummary: string;
  sections: {
    setup: ResearchDiffSection;
    data: ResearchDiffSection;
    strategy: ResearchDiffSection;
    portfolio: ResearchDiffSection;
    simulation: ResearchDiffSection;
    regime: ResearchDiffSection;
    hypotheses: ResearchDiffSection;
    experiments: ResearchDiffSection;
    evidence: ResearchDiffSection;
    claims: ResearchDiffSection;
    synthesis: ResearchDiffSection;
    reproducibility: ResearchDiffSection;
  };
}

// ============================================================================
// 9. EVIDENCE LINEAGE & CLAIM INSPECTOR
// ============================================================================

export interface LineageStep {
  tier: 'CLAIM' | 'EVIDENCE' | 'EXPERIMENT' | 'TOOL' | 'ARGUMENTS' | 'DATA' | 'ENGINE_VERSION' | 'FINGERPRINT';
  entityId: string;
  label: string;
  summary: string;
  metadata: Record<string, any>;
}

export interface BackwardLineageTrace {
  claimId: string;
  metric: string;
  claimedValue: number | string;
  chain: LineageStep[];
}

export interface ForwardLineageTrace {
  experimentId: string;
  toolName: string;
  boundEvidenceIds: string[];
  boundClaimIds: string[];
  downstreamFindings: string[];
}

export interface ClaimInspectionDetail {
  claimId: string;
  metric: string;
  value: number | string;
  unit?: string;
  claimText: string;

  // Direct Evidence vs Analytical Interpretation (Strict Separation)
  directEvidenceStatement: string;
  analyticalInterpretation: string;
  separationVerified: boolean;

  // Underlying Provenance
  evidenceId: string;
  experimentId: string;
  toolName: string;
  arguments: Record<string, any>;
  dataWindow: SessionDataWindow;
  engineVersion: string;
  seed: number;
  evidenceFingerprint: string;
  sessionFingerprint: string;
}

// ============================================================================
// 10. ENGINE VERSION COMPATIBILITY
// ============================================================================

export type EngineCompatibilityStatus = 'EXACT_COMPATIBLE' | 'COMPATIBLE_WITH_WARNING' | 'INCOMPATIBLE';

export interface VersionCompatibilityCheck {
  status: EngineCompatibilityStatus;
  recordedVersions: Record<string, string>;
  activeVersions: Record<string, string>;
  divergences: Array<{
    engine: string;
    recorded: string;
    active: string;
    severity: 'EXACT' | 'MINOR_WARNING' | 'MAJOR_BREAKING';
    impact: string;
  }>;
}
