/**
 * BLACKBOX X — PHASE 4.2: RESEARCH OBSERVATORY
 * Types, State Contracts, and Epistemic Invariants
 * 
 * Source of Truth: docs/RESEARCH-OBSERVATORY-ARCHITECTURE.md
 */

import { Asset } from '../../../core/data';
import { StrategyType, StrategyParams } from '../../../core/strategies';
import { StressScenarioId } from '../../../core/stressTesting';
import { HypothesisStatus } from '../../../core/research/researchTypes';

/**
 * 6-Stage Persistent Research Progress Rail
 */
export type ObservatoryStage = 
  | 'ASK'
  | 'INVESTIGATE'
  | 'INSPECT'
  | 'CHALLENGE'
  | 'CONCLUDE'
  | 'REPLAY';

/**
 * 10 Canonical Observatory Sections
 */
export type ObservatorySection =
  | '01_QUESTION'
  | '02_HYPOTHESIS'
  | '03_INVESTIGATION_PLAN'
  | '04_MARKET_EVIDENCE'
  | '05_STRATEGY_EVIDENCE'
  | '06_RISK_STRESS'
  | '07_REGIME_BEHAVIOUR'
  | '08_CONTRADICTIONS'
  | '09_SYNTHESIS'
  | '10_REPRODUCE_AUDIT';

/**
 * Compact Market Evidence Snapshot
 */
export interface MarketEvidenceSnapshot {
  asset: Asset;
  dataWindow: {
    startDate: string;
    endDate: string;
    observationCount: number;
  };
  totalReturnPct: number;
  annualizedReturnPct: number;
  annualizedVolatilityPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  rollingVolatility30dPct: number;
  currentPrice: number;
  priceDeltaPct: number;
  pairwiseCorrelations: Record<string, number>;
  provenanceDisclaimer: string;
}

/**
 * Compact Strategy Evidence Snapshot
 */
export interface StrategyEvidenceSnapshot {
  asset: Asset;
  strategy: StrategyType;
  parameters: StrategyParams;
  transactionCostBps: number;
  executionConvention: 'NEXT_BAR_CLOSE';
  strategyReturnPct: number;
  annualizedReturnPct: number;
  volatilityPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  tradeCount: number;
  winRatePct: number;
  benchmarkReturnPct: number;
  benchmarkSharpeRatio: number;
  returnDifferencePctPoints: number;
  neutralComparisonText: string;
  provenanceDisclaimer: string;
}

/**
 * Unified Risk & Stress Strip Data
 */
export interface RiskSnapshotData {
  volatilityPct: number;
  sharpeRatio: number;
  maxDrawdownPct: number;
  var95Pct: number;
  cvar95Pct: number;
  stressDamagePct: number;
  stressScenario: StressScenarioId;
  monteCarloDownsideFrequencyPct: number;
  eulerRiskContributionPct: Record<string, number>;
  provenanceDisclaimer: string;
}

/**
 * Market Regime Intelligence Snapshot
 */
export interface RegimeSnapshotData {
  asset: Asset;
  activeRegime: 'BULL' | 'BEAR' | 'HIGH_VOL' | 'LOW_VOL';
  regimePerformance: Array<{
    regime: string;
    returnPct: number;
    volatilityPct: number;
    sharpeRatio: number;
    winRatePct: number;
    durationDays: number;
  }>;
  historicalSharpe: number;
  unconditionalMonteCarloSharpe: number;
  regimeConditionedMonteCarloSharpe: number;
  provenanceDisclaimer: string;
}

/**
 * Stress Scenario Snapshot
 */
export interface StressSnapshotData {
  scenarioId: StressScenarioId;
  scenarioName: string;
  durationDays: number;
  marketShockPct: number;
  volatilityMultiplier: number;
  baselineEquity: number;
  stressedEquity: number;
  maxDamagePct: number;
  recoveryDays: number;
  correlationShiftDelta: number;
  provenanceDisclaimer: string;
  simulationDisclaimer: string;
}

/**
 * Monte Carlo Distribution Snapshot
 */
export interface MonteCarloSnapshotData {
  method: 'PARAMETRIC' | 'HISTORICAL_BOOTSTRAP' | 'STUDENT_T';
  pathCount: number;
  horizonDays: number;
  seed: number;
  rebalancingFrequency: 'NONE' | 'DAILY' | 'MONTHLY';
  terminalPercentiles: {
    p05: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  medianReturnPct: number;
  medianDrawdownPct: number;
  probabilityLossPct: number;
  drawdownExceedance20Pct: number;
  simulationDisclaimer: string;
}

/**
 * Epistemic Disclaimers and Badges
 */
export const OBSERVATORY_DISCLAIMERS = {
  DATA_PROVENANCE: 'OFFLINE CALIBRATED DEMONSTRATION DATA (2019-01-01 TO 2023-12-31, 1,825 BARS). NOT LIVE OR ACTUAL MARKET DATA.',
  SIMULATION_FORECAST: 'SIMULATION DISTRIBUTION — NOT A FINANCIAL FORECAST OR PREDICTIVE GUARANTEE.',
  STRESS_REPLAY: 'SIMULATED MACRO STRESS SHOCK SCENARIO — NOT A HISTORICAL MARKET REPLAY.',
  EPISTEMIC_ROLE: "BLACKBOX X doesn't tell you what to buy. It provides an institutional research environment to investigate asset behaviour, test strategies, understand risk, challenge assumptions, and inspect reproducible evidence.",
};

export const PROGRESS_RAIL_STAGES: Array<{ id: ObservatoryStage; label: string; sectionId: string }> = [
  { id: 'ASK', label: 'ASK', sectionId: 'sec-question' },
  { id: 'INVESTIGATE', label: 'INVESTIGATE', sectionId: 'sec-plan' },
  { id: 'INSPECT', label: 'INSPECT', sectionId: 'sec-evidence' },
  { id: 'CHALLENGE', label: 'CHALLENGE', sectionId: 'sec-challenge' },
  { id: 'CONCLUDE', label: 'CONCLUDE', sectionId: 'sec-synthesis' },
  { id: 'REPLAY', label: 'REPLAY', sectionId: 'sec-replay' },
];

/**
 * Suggested Curated Inquiries for Instant Onboarding
 */
export const CURATED_OBSERVATORY_INQUIRIES = [
  {
    title: 'EMA Trend vs Buy & Hold',
    query: 'Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?',
    domain: 'STRATEGY_DECONSTRUCTION',
  },
  {
    title: 'Transaction Cost Friction Sensitivity',
    query: 'How sensitive is active trend alpha to transaction cost friction?',
    domain: 'EXECUTION_FRICTION',
  },
  {
    title: 'Regime-Conditioned Tail Risk',
    query: 'Does starting regime alter simulated Monte Carlo tail risk?',
    domain: 'REGIME_RISK',
  },
  {
    title: 'Macroeconomic Shock Resistance',
    query: 'How does the portfolio absorb a macroeconomic crash stress scenario?',
    domain: 'STRESS_RESILIENCE',
  },
  {
    title: 'Risk Concentration & Drivers',
    query: 'Which assets drive portfolio volatility and risk concentration?',
    domain: 'PORTFOLIO_CONCENTRATION',
  },
];

export const CURATED_INQUIRY_PROMPTS = CURATED_OBSERVATORY_INQUIRIES.map(i => i.query);

