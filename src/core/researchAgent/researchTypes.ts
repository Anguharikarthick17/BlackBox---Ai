/**
 * BLACKBOX X — Autonomous Quant Research Agent Types
 * 
 * Defines foundational data structures for bounded quantitative investigation:
 * Question -> Hypothesis -> Experiment Plan -> Tool Execution -> Evidence -> Contradiction -> Synthesis
 */

import { Asset } from '../data';
import { StrategyType } from '../strategies';

export type ResearchIntent =
  | 'PERFORMANCE_DISCREPANCY'
  | 'DRAWDOWN_INVESTIGATION'
  | 'ROBUSTNESS_EVALUATION'
  | 'REGIME_BEHAVIOR'
  | 'CORRELATION_STRESS'
  | 'GENERAL_QUANT_INQUIRY';

export interface ResearchQuestion {
  id: string;
  query: string;
  intent: ResearchIntent;
  targetAsset: Asset;
  targetStrategy?: StrategyType;
  benchmarkAsset?: Asset;
  startDate?: string;
  endDate?: string;
  timestamp: number;
}

export type HypothesisStatus =
  | 'PENDING'
  | 'TESTING'
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'CONTRADICTED'
  | 'INCONCLUSIVE';

export interface ResearchHypothesis {
  id: string;
  questionId: string;
  statement: string;
  rationale: string;
  primaryTool: string;
  expectedEvidence: string;
  status: HypothesisStatus;
  contradictionReason?: string;
}

export type StepStatus = 'PLANNED' | 'EXECUTING' | 'COMPLETED' | 'TOOL_FAILED' | 'SKIPPED';

export interface ExperimentStep {
  stepId: string;
  hypothesisId: string;
  order: number;
  toolName: string;
  arguments: Record<string, any>;
  status: StepStatus;
  purpose: string;
}

export interface ResearchPlan {
  id: string;
  question: ResearchQuestion;
  hypotheses: ResearchHypothesis[];
  steps: ExperimentStep[];
  maxSteps: number;
}

export interface EvidenceItem {
  evidenceId: string;
  hypothesisId: string;
  toolName: string;
  toolArguments: Record<string, any>;
  result: any;
  dataWindow: string;
  executionOrder: number;
  timestamp: number;
  status: 'COMPLETED' | 'TOOL_FAILED';
  summary: string;
  keyMetrics: Record<string, number | string>;
}

export interface ContradictionEvaluation {
  hypothesisId: string;
  hypothesisStatement: string;
  status: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'CONTRADICTED' | 'INCONCLUSIVE';
  explanation: string;
  directEvidence: string;
  interpretation: string;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  empiricalMetrics: Record<string, number | string>;
}

export type ConfidenceLevel =
  | 'HIGH_EVIDENCE'
  | 'MODERATE_EVIDENCE'
  | 'LIMITED_EVIDENCE'
  | 'INCONCLUSIVE';

export interface ResearchConclusion {
  question: string;
  intent: ResearchIntent;
  hypotheses: ResearchHypothesis[];
  testsExecuted: number;
  evidence: EvidenceItem[];
  evaluations: ContradictionEvaluation[];
  findings: string[];
  confidence: ConfidenceLevel;
  confidenceReason: string;
  limitations: string[];
  nextResearchQuestion: string;
  researchTrailEntryId?: string;
}

export type ResearchAgentStage =
  | 'IDLE'
  | 'PLANNING'
  | 'HYPOTHESIS'
  | 'TESTING'
  | 'EVIDENCE'
  | 'CONTRADICTION CHECK'
  | 'SYNTHESIS'
  | 'COMPLETE'
  | 'FAILED';

export interface ResearchRunState {
  stage: ResearchAgentStage;
  currentStepIndex: number;
  totalPlannedSteps: number;
  activeToolName?: string;
  question?: ResearchQuestion;
  hypotheses: ResearchHypothesis[];
  plan?: ResearchPlan;
  evidenceList: EvidenceItem[];
  evaluations: ContradictionEvaluation[];
  conclusion?: ResearchConclusion;
  error?: string;
}
