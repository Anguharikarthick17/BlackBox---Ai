/**
 * BLACKBOX X — 3D PROCESS UNIVERSE STAGE SPECIFICATIONS
 * Spatial Coordinate System, Camera Choreography & Stage Metadata
 * 
 * NO FAKE NUMBERS · BOUND DIRECTLY TO REAL ENGINE OUTPUTS
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import { ProcessUniverseStageConfig, ProcessUniverseStageId, DemoStage } from '../../../core/demo/demoTypes';

export const UNIVERSE_STAGES: ProcessUniverseStageConfig[] = [
  {
    id: 'DATA',
    order: 1,
    label: '01 DATA',
    demoStage: 'QUESTION',
    subtitle: 'RAW MARKET OBSERVATION INGESTION',
    explanation: 'Raw BTC market observations enter the deterministic research pipeline.',
    cameraPosition: [-12, 6, 16],
    cameraTarget: [-8, 0, 0],
  },
  {
    id: 'TRANSFORM',
    order: 2,
    label: '02 TRANSFORM',
    demoStage: 'QUESTION',
    subtitle: 'CONTINUITY & RETURN VECTORIZATION',
    explanation: 'Market prices are converted into derived return and continuity series.',
    cameraPosition: [-8, 4, 12],
    cameraTarget: [-5, 0, 0],
  },
  {
    id: 'INDICATORS',
    order: 3,
    label: '03 INDICATORS',
    demoStage: 'QUANT',
    subtitle: 'DUAL EXPONENTIAL MOVING AVERAGES',
    explanation: 'EMA 12 and EMA 26 are calculated from the observed price series.',
    cameraPosition: [-4, 3, 10],
    cameraTarget: [-2, 0, 0],
  },
  {
    id: 'SIGNALS',
    order: 4,
    label: '04 SIGNALS',
    demoStage: 'QUANT',
    subtitle: 'TREND STATE TRANSITION GENERATION',
    explanation: 'Indicator relationships generate the strategy’s actual signals.',
    cameraPosition: [0, 3, 9],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'EXECUTION',
    order: 5,
    label: '05 EXECUTION',
    demoStage: 'QUANT',
    subtitle: 'NEXT-BAR EXECUTION & FRICTION',
    explanation: 'Signals are executed on the next available bar with transaction costs.',
    cameraPosition: [3, 2.5, 8],
    cameraTarget: [2.5, 0, 0],
  },
  {
    id: 'PORTFOLIO',
    order: 6,
    label: '06 PORTFOLIO',
    demoStage: 'QUANT',
    subtitle: 'CAPITAL ALLOCATION & EQUITY TRAJECTORY',
    explanation: 'Executed trades produce the portfolio equity path.',
    cameraPosition: [6, 4, 11],
    cameraTarget: [5, 0, 0],
  },
  {
    id: 'RISK',
    order: 7,
    label: '07 RISK',
    demoStage: 'QUANT',
    subtitle: 'MULTIDIMENSIONAL RISK DECOMPOSITION',
    explanation: 'Performance is decomposed into return, volatility, Sharpe, and drawdown.',
    cameraPosition: [8, 5, 12],
    cameraTarget: [7, 0, 0],
  },
  {
    id: 'ROBUSTNESS',
    order: 8,
    label: '08 ROBUSTNESS',
    demoStage: 'ROBUSTNESS',
    subtitle: 'PARAMETER PERTURBATION SWEEP',
    explanation: 'The strategy is tested across multiple parameter configurations.',
    cameraPosition: [4, 7, 14],
    cameraTarget: [4, 1, 0],
  },
  {
    id: 'REGIMES',
    order: 9,
    label: '09 REGIMES',
    demoStage: 'REGIME',
    subtitle: 'UNSUPERVISED MACRO REGIME SEGMENTATION',
    explanation: 'Historical observations are grouped into detected market regimes.',
    cameraPosition: [0, 8, 15],
    cameraTarget: [0, 2, 0],
  },
  {
    id: 'STRESS',
    order: 10,
    label: '10 STRESS',
    demoStage: 'STRESS',
    subtitle: 'COUNTERFACTUAL LIQUIDITY SHOCK SCENARIO',
    explanation: 'A simulated shock is applied to examine portfolio response.',
    cameraPosition: [-4, 7, 14],
    cameraTarget: [-3, 1, 0],
  },
  {
    id: 'SIMULATION',
    order: 11,
    label: '11 MONTE CARLO',
    demoStage: 'SIMULATION',
    subtitle: '1,000 BOOTSTRAP RESAMPLED PATHS',
    explanation: 'Historical behavior is resampled/simulated to examine outcome distributions.',
    cameraPosition: [0, 10, 18],
    cameraTarget: [0, 0, 0],
  },
  {
    id: 'EVIDENCE',
    order: 12,
    label: '12 EVIDENCE',
    demoStage: 'EVIDENCE',
    subtitle: 'DIRECTED ACYCLIC EVIDENCE GRAPH',
    explanation: 'Experimental results are connected to hypotheses and evidence.',
    cameraPosition: [6, 8, 16],
    cameraTarget: [4, 1, 0],
  },
  {
    id: 'RESEARCH',
    order: 13,
    label: '13 RESEARCH',
    demoStage: 'CONCLUSION',
    subtitle: 'FORMAL SYNTHESIS & AUDIT MEMORANDUM',
    explanation: 'Evidence is synthesized into a structured research conclusion.',
    cameraPosition: [2, 4, 10],
    cameraTarget: [1, 0, 0],
  },
  {
    id: 'REPLAY',
    order: 14,
    label: '14 REPLAY',
    demoStage: 'REPLAY',
    subtitle: 'CANONICAL EXACT 7-GATE VERIFICATION',
    explanation: 'The research case is replayed and compared against its recorded outputs.',
    cameraPosition: [0, 2, 8],
    cameraTarget: [0, 0, 0],
  },
];

// Map from core DemoStage to active 3D ProcessUniverseStageId
export function mapDemoStageToUniverseStage(demoStage: DemoStage): ProcessUniverseStageId {
  switch (demoStage) {
    case 'INTRO':
    case 'QUESTION':
      return 'DATA';
    case 'HYPOTHESIS':
      return 'TRANSFORM';
    case 'QUANT':
      return 'EXECUTION';
    case 'ROBUSTNESS':
      return 'ROBUSTNESS';
    case 'REGIME':
      return 'REGIMES';
    case 'STRESS':
      return 'STRESS';
    case 'SIMULATION':
      return 'SIMULATION';
    case 'CHALLENGE':
      return 'EVIDENCE';
    case 'EVIDENCE':
      return 'EVIDENCE';
    case 'CONCLUSION':
      return 'RESEARCH';
    case 'REPLAY':
    case 'COMPLETE':
      return 'REPLAY';
    default:
      return 'DATA';
  }
}

// Spatial position dictionary for the 14 process nodes in 3D space
export const NODE_SPATIAL_POSITIONS: Record<ProcessUniverseStageId, [number, number, number]> = {
  DATA: [-9, 0, 0],
  TRANSFORM: [-6.5, 0.4, 0.2],
  INDICATORS: [-4, 0.8, -0.2],
  SIGNALS: [-1.5, 0.6, 0.4],
  EXECUTION: [1, 0.2, -0.3],
  PORTFOLIO: [3.5, -0.2, 0.2],
  RISK: [6, -0.6, -0.4],
  ROBUSTNESS: [4.5, 2.8, 1.5],
  REGIMES: [0.5, 3.5, 2.0],
  STRESS: [-3.5, 3.0, 1.2],
  SIMULATION: [0, -2.8, 1.8],
  EVIDENCE: [4, 1.5, -2.0],
  RESEARCH: [1.5, -1.2, -2.5],
  REPLAY: [-1.5, -1.8, -1.5],
};
