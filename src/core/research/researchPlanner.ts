/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Deterministic Research Planner & Experiment DAG Builder
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import {
  ExperimentPlan,
  ExperimentNode,
  ResearchHypothesis,
} from './researchTypes';
import { isToolRegistered } from './researchToolRegistry';
import { generateExperimentFingerprint } from './researchFingerprint';

export const MAX_EXPERIMENTS_PER_SESSION = 8;
export const MAX_SESSION_TIMEOUT_MS = 60000;

/**
 * Sanitizes untrusted user prompt strings against prompt-injection patterns.
 */
export function sanitizePromptString(input: string): string {
  if (!input) return '';
  return input
    .replace(/ignore\s+(all\s+)?(previous\s+)?instructions/gi, '[FILTERED]')
    .replace(/system\s*:\s*/gi, '')
    .replace(/execute\s+arbitrary/gi, '[FILTERED]')
    .trim();
}

/**
 * Parses user question and extracts asset/strategy context heuristically.
 */
function parseQuestionContext(query: string): {
  asset: 'GOLD' | 'BTC' | 'NVDA';
  strategy: 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION';
  startDate: string;
  endDate: string;
} {
  const upper = query.toUpperCase();
  let asset: 'GOLD' | 'BTC' | 'NVDA' = 'BTC';
  if (upper.includes('GOLD')) asset = 'GOLD';
  else if (upper.includes('NVDA') || upper.includes('NVIDIA')) asset = 'NVDA';

  let strategy: 'SMA_CROSSOVER' | 'EMA_TREND' | 'MOMENTUM' | 'MEAN_REVERSION' = 'EMA_TREND';
  if (upper.includes('SMA')) strategy = 'SMA_CROSSOVER';
  else if (upper.includes('MOMENTUM')) strategy = 'MOMENTUM';
  else if (upper.includes('MEAN_REVERSION') || upper.includes('REVERSION')) strategy = 'MEAN_REVERSION';

  return {
    asset,
    strategy,
    startDate: '2020-01-01',
    endDate: '2023-12-31',
  };
}

/**
 * Generates testable, falsifiable hypotheses for the inquiry.
 */
export function generateHypotheses(
  researchQuestion: string
): ResearchHypothesis[] {
  const sanitized = sanitizePromptString(researchQuestion);
  const { asset, strategy } = parseQuestionContext(sanitized);
  const now = Date.now();

  return [
    {
      hypothesisId: 'H1',
      statement: `${asset} ${strategy} underperformance relative to Buy & Hold is primarily associated with adverse performance in chopping or high-volatility market regimes.`,
      category: 'REGIME_SENSITIVITY',
      priorEvidence: ['Historical trend strategies frequently incur whipsaw losses during range-bound regimes.'],
      expectedEvidence: ['Negative strategy return during HIGH_VOLATILITY or BEAR regimes with positive Buy & Hold delta.'],
      contradictingEvidence: ['Strategy achieves positive Sharpe and positive alpha across all market regimes.'],
      status: 'INCONCLUSIVE',
      confidence: 'INCONCLUSIVE',
      testIds: ['EXP-001', 'EXP-002', 'EXP-003'],
      createdAt: now,
    },
    {
      hypothesisId: 'H2',
      statement: `Transaction cost friction accounts for more than 50% of the net return deficit between ${asset} ${strategy} and Buy & Hold.`,
      category: 'EXECUTION_FRICTION',
      priorEvidence: ['Frequent position turnover degrades cumulative compounding over multi-year horizons.'],
      expectedEvidence: ['Zero-fee backtest return closes > 50% of the return gap to Buy & Hold.'],
      contradictingEvidence: ['Zero-fee backtest return remains substantially below Buy & Hold, indicating alpha deficit.'],
      status: 'INCONCLUSIVE',
      confidence: 'INCONCLUSIVE',
      testIds: ['EXP-001', 'EXP-004'],
      createdAt: now,
    },
    {
      hypothesisId: 'H3',
      statement: `Strategy drawdown clustering coincides with sustained macro market pullbacks rather than isolated false breakouts.`,
      category: 'VOLATILITY_DRAG',
      priorEvidence: ['Extended drawdowns often align with broad macro contraction periods.'],
      expectedEvidence: ['Max drawdown duration aligns with macro bear regime.'],
      contradictingEvidence: ['Drawdown peaks occur exclusively during macro bull regimes.'],
      status: 'INCONCLUSIVE',
      confidence: 'INCONCLUSIVE',
      testIds: ['EXP-005'],
      createdAt: now,
    },
  ];
}

/**
 * Builds an experiment plan as a bounded Directed Acyclic Graph (max 8 nodes).
 */
export function generateExperimentPlan(
  sessionId: string,
  researchQuestion: string,
  options?: { seed?: number }
): ExperimentPlan {
  const sanitized = sanitizePromptString(researchQuestion);
  const { asset, strategy, startDate, endDate } = parseQuestionContext(sanitized);
  const seed = options?.seed ?? 42;

  const dataWindow = { startDate, endDate };

  const experiments: ExperimentNode[] = [
    {
      experimentId: 'EXP-001',
      purpose: `Baseline ${asset} ${strategy} performance evaluation with 10 bps friction.`,
      toolName: 'get_strategy_metrics',
      arguments: { asset, strategy, startDate, endDate, transactionCostPct: 0.001 },
      expectedEvidence: 'Total return, Sharpe ratio, max drawdown, and trade count.',
      maximumExecutions: 1,
      dependencies: [],
      dataWindow,
      seed,
      status: 'PENDING',
    },
    {
      experimentId: 'EXP-002',
      purpose: `Evaluate ${asset} Buy & Hold benchmark on identical dates.`,
      toolName: 'get_benchmark_metrics',
      arguments: { asset, startDate, endDate },
      expectedEvidence: 'Benchmark total return and max drawdown.',
      maximumExecutions: 1,
      dependencies: [],
      dataWindow,
      seed,
      status: 'PENDING',
    },
    {
      experimentId: 'EXP-003',
      purpose: `Partition strategy and asset returns across 4 macro market regimes.`,
      toolName: 'get_regime_performance',
      arguments: { asset, strategy, startDate, endDate },
      expectedEvidence: 'Sub-period strategy returns across Bull, Bear, and High Volatility regimes.',
      maximumExecutions: 1,
      dependencies: ['EXP-001'],
      dataWindow,
      seed,
      status: 'PENDING',
    },
    {
      experimentId: 'EXP-004',
      purpose: `Evaluate friction sensitivity and zero-fee backtest return delta.`,
      toolName: 'get_robustness_analysis',
      arguments: { asset, strategy, startDate, endDate },
      expectedEvidence: 'Zero-fee return vs. baseline return and parameter grid stability.',
      maximumExecutions: 1,
      dependencies: ['EXP-001'],
      dataWindow,
      seed,
      status: 'PENDING',
    },
    {
      experimentId: 'EXP-005',
      purpose: `Deconstruct drawdown depth, duration, and recovery trajectory.`,
      toolName: 'get_drawdown_analysis',
      arguments: { asset, strategy, startDate, endDate },
      expectedEvidence: 'Peak-to-trough drawdown % and duration in days.',
      maximumExecutions: 1,
      dependencies: ['EXP-001', 'EXP-002'],
      dataWindow,
      seed,
      status: 'PENDING',
    },
  ];

  // Validate budget
  if (experiments.length > MAX_EXPERIMENTS_PER_SESSION) {
    throw new Error(
      `Plan budget violation: requested ${experiments.length} experiments, exceeding maximum ceiling of ${MAX_EXPERIMENTS_PER_SESSION}.`
    );
  }

  // Validate tool registry allowlist
  for (const exp of experiments) {
    if (!isToolRegistered(exp.toolName)) {
      throw new Error(`Plan contains unregistered tool: "${exp.toolName}".`);
    }
    exp.fingerprint = generateExperimentFingerprint(exp.toolName, exp.arguments, exp.dataWindow, exp.seed);
  }

  return {
    planId: `PLAN-${sessionId.slice(0, 8)}`,
    sessionId,
    experiments,
    totalBudget: MAX_EXPERIMENTS_PER_SESSION,
    estimatedDurationMs: 1200,
  };
}
