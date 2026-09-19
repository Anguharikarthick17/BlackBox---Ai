/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Core Type Definitions & Data Contracts
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

export type ResearchSessionStatus =
  | 'DRAFT'
  | 'PLANNING'
  | 'RUNNING'
  | 'ANALYZING'
  | 'CONTRADICTION_CHECK'
  | 'SECONDARY_TEST'
  | 'SYNTHESIZING'
  | 'COMPLETE'
  | 'FAILED';

export interface SessionDataWindow {
  startDate: string;
  endDate: string;
  observationCount: number;
}

export interface SessionProvenance {
  dataWindow: SessionDataWindow;
  engineVersions: Record<string, string>;
  totalExecutionDurationMs: number;
  totalToolsExecuted: number;
  deterministicSeed: number;
}

export interface ResearchSession {
  sessionId: string;
  researchQuestion: string;
  createdAt: number;
  updatedAt: number;
  status: ResearchSessionStatus;
  configurationFingerprint: string;
  datasetFingerprint: string;
  experimentIds: string[];
  hypothesisIds: string[];
  evidenceIds: string[];
  contradictionIds: string[];
  synthesis?: ResearchSynthesis;
  limitations: string[];
  nextTests: string[];
  provenance: SessionProvenance;
  errorMessage?: string;
}

export type HypothesisStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'INCONCLUSIVE';

export type ConfidenceRating =
  | 'HIGH_EVIDENCE'
  | 'MODERATE_EVIDENCE'
  | 'LIMITED_EVIDENCE'
  | 'INCONCLUSIVE';

export type HypothesisCategory =
  | 'REGIME_SENSITIVITY'
  | 'EXECUTION_FRICTION'
  | 'VOLATILITY_DRAG'
  | 'STRUCTURAL_DECOUPLING'
  | 'PARAMETER_OVERFITTING'
  | 'PORTFOLIO_CONCENTRATION'
  | 'TAIL_RISK_ASYMMETRY';

export interface ResearchHypothesis {
  hypothesisId: string;
  statement: string;
  category: HypothesisCategory;
  priorEvidence: string[];
  expectedEvidence: string[];
  contradictingEvidence: string[];
  status: HypothesisStatus;
  confidence: ConfidenceRating;
  testIds: string[];
  createdAt: number;
}

export type ExperimentNodeStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SKIPPED';

export interface ExperimentNode {
  experimentId: string;
  purpose: string;
  toolName: string;
  arguments: Record<string, any>;
  expectedEvidence: string;
  maximumExecutions: number;
  dependencies: string[];
  dataWindow: { startDate: string; endDate: string };
  seed?: number;
  status: ExperimentNodeStatus;
  executionLatencyMs?: number;
  error?: string;
  fingerprint?: string;
}

export interface ExperimentPlan {
  planId: string;
  sessionId: string;
  experiments: ExperimentNode[];
  totalBudget: number;
  estimatedDurationMs: number;
}

export interface EvidenceRecord {
  evidenceId: string;
  experimentId: string;
  hypothesisId?: string;
  toolName: string;
  arguments: Record<string, any>;
  result: Record<string, any>;
  dataWindow: SessionDataWindow;
  directEvidence: string;
  interpretation: string;
  order: number;
  timestamp: number;
  fingerprint: string;
}

export type ClaimType = 'DIRECT_OBSERVATION' | 'INTERPRETATION' | 'COMPARISON';

export interface ResearchClaim {
  claimId: string;
  evidenceIds: string[];
  metric: string;
  value: number | string;
  unit?: string;
  text: string;
  claimType: ClaimType;
}

export interface ContradictionRecord {
  contradictionId: string;
  hypothesisId: string;
  supportingEvidenceIds: string[];
  disconfirmingEvidenceIds: string[];
  analysis: string;
  resolution:
    | 'CONTRADICTED'
    | 'HYPOTHESIS_REFINED'
    | 'SECONDARY_TEST_REQUIRED'
    | 'REMAINS_AMBIGUOUS';
}

export interface SecondaryTestRecord {
  testId: string;
  contradictionId?: string;
  hypothesisId: string;
  experimentId: string;
  parameterName: string;
  testedValues: any[];
  resultSummary: string;
  evidenceIds: string[];
}

export type NodeType =
  | 'QUESTION'
  | 'HYPOTHESIS'
  | 'EXPERIMENT'
  | 'EVIDENCE'
  | 'CONTRADICTION'
  | 'SECONDARY_TEST'
  | 'SYNTHESIS';

export type EdgeType =
  | 'SUPPORTS'
  | 'CONTRADICTS'
  | 'DERIVED_FROM'
  | 'TESTS'
  | 'REFINES'
  | 'DEPENDS_ON';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  metadata?: Record<string, any>;
}

export interface EvidenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ResearchSynthesis {
  executiveObservation: string;
  hypothesisFindings: Array<{
    hypothesisId: string;
    status: HypothesisStatus;
    confidence: ConfidenceRating;
    summary: string;
  }>;
  evidenceSummary: string;
  claims: ResearchClaim[];
  contradictions: string[];
  secondaryTests: string[];
  riskInterpretation: string;
  robustnessAssessment: string;
  limitations: string[];
  nextResearchQuestions: string[];
}

export interface ResearchMemo {
  memoId: string;
  sessionId: string;
  generatedAt: number;
  sections: {
    researchQuestion: string;
    executiveObservation: string;
    hypotheses: Array<{
      id: string;
      statement: string;
      category: string;
      status: string;
      confidence: string;
    }>;
    experimentPlanSummary: string;
    directEvidence: Array<{
      id: string;
      statement: string;
      toolName: string;
      metrics: Record<string, any>;
    }>;
    contradictions: string[];
    secondaryTests: string[];
    quantitativeFindings: Array<{
      claimId: string;
      metric: string;
      value: any;
      text: string;
      boundEvidence: string[];
    }>;
    riskInterpretation: string;
    robustnessAssessment: string;
    limitations: string[];
    nextResearchQuestions: string[];
    methodology: string;
    provenance: SessionProvenance;
    disclaimer: string;
  };
  rawMarkdown: string;
}

export type ResearchExecutionClass = 'LIGHTWEIGHT' | 'MEDIUM' | 'HEAVY_WORKER';

export interface ResearchToolDefinition<TInput = any, TOutput = any> {
  toolName: string;
  category: string;
  description: string;
  executionClass: ResearchExecutionClass;
  maxExecutionsPerSession: number;
  provenanceRequirements: string[];
  inputSchema: any;
  outputSchema?: any;
  execute: (args: TInput) => Promise<TOutput> | TOutput;
}
