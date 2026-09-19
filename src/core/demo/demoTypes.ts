/**
 * BLACKBOX X — LIVE PRODUCT DEMONSTRATION TYPES
 * Deterministic State Machine & Pedagogical Explanation Interfaces
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import { BacktestResult } from '../backtest';
import { RobustnessResult } from '../robustness';
import { RegimePeriod, RegimeType } from '../regimes';
import { StressResult } from '../stressTesting';
import { MonteCarloResult } from '../portfolio/monteCarloTypes';
import {
  ResearchHypothesis,
  EvidenceRecord,
  ContradictionRecord,
  ResearchMemo,
  EvidenceGraph,
} from '../research/researchTypes';
import { ResearchCase, ReplayVerificationRecord } from '../research/audit/auditTypes';

import { PricePoint } from '../data';
import { Signal } from '../strategies';

export type DemoStage =
  | 'INTRO'
  | 'QUESTION'
  | 'HYPOTHESIS'
  | 'QUANT'
  | 'ROBUSTNESS'
  | 'REGIME'
  | 'STRESS'
  | 'SIMULATION'
  | 'CHALLENGE'
  | 'EVIDENCE'
  | 'CONCLUSION'
  | 'REPLAY'
  | 'COMPLETE';

export type DemoStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED' | 'COMPLETE' | 'ERROR';

export type StepIndicatorStatus = 'WAITING' | 'RUNNING' | 'COMPLETE';

export type ViewMode = 'RESEARCH_VIEW' | 'SYSTEM_VIEW';

export type PipelineNodeStatus = 'WAITING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export interface PipelineNode {
  id: string;
  name: string;
  badge?: string;
  input: {
    label: string;
    value: string;
    detail?: string;
  };
  transformation: {
    operation: string;
    description: string;
    formula?: string;
  };
  output: {
    label: string;
    value: string;
    detail?: string;
  };
  status: PipelineNodeStatus;
}

export type DataInspectorTab = 'RAW_DATA' | 'DERIVED_DATA' | 'SIGNALS' | 'TRADES' | 'METRICS';

export interface DerivedSamplePoint {
  date: string;
  close: number;
  dailyReturnPct: number;
  fastEma?: number;
  slowEma?: number;
  signal: Signal;
  position: 'LONG' | 'FLAT';
}

export interface PedagogicalExplanation {
  stage: DemoStage;
  title: string;
  badge: string;
  whatWeAreDoing: string;
  why: string;
  calculatedResultHeadline: string;
  whatTheResultMeans: string;
  substeps: Array<{
    label: string;
    status: StepIndicatorStatus;
  }>;
}

export interface DemoEngineResults {
  question: string;
  asset: 'BTC';
  strategy: 'EMA_TREND';
  benchmark: 'BUY_AND_HOLD';
  dataWindow: {
    startDate: string;
    endDate: string;
    observationCount: number;
  };
  strategyParams?: {
    fastPeriod: number;
    slowPeriod: number;
    feeBps: number;
  };
  priceSample?: PricePoint[];
  derivedSample?: DerivedSamplePoint[];
  hypotheses: ResearchHypothesis[];
  backtest?: BacktestResult;
  robustnessSweep?: RobustnessResult[];
  regimePeriods?: RegimePeriod[];
  regimePerformance?: Array<{
    regime: RegimeType;
    returnPct: number;
    sharpe: number;
    winRate: number;
    trades: number;
  }>;
  stressResult?: StressResult;
  monteCarloResult?: MonteCarloResult;
  contradictions?: ContradictionRecord[];
  evidenceRecords: EvidenceRecord[];
  evidenceGraph?: EvidenceGraph;
  researchMemo?: ResearchMemo;
  sealedCase?: Readonly<ResearchCase>;
  replayVerification?: ReplayVerificationRecord;
}

export interface DemoState {
  currentStage: DemoStage;
  status: DemoStatus;
  engineExecutionStatus: 'IDLE' | 'EXECUTING' | 'COMPLETE' | 'FAILED';
  viewMode: ViewMode;
  stageIndex: number; // 0 to 12
  totalStages: number; // 11 core stages (excluding INTRO/COMPLETE in counter)
  progressPct: number;
  timeRemainingInStageMs: number;
  explanation: PedagogicalExplanation;
  results: DemoEngineResults;
  error?: string;
}

