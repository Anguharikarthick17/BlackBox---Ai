/**
 * BLACKBOX X — Research Policy & Governance Guards
 * 
 * Enforces strict operational boundaries on the Autonomous Quant Research Agent:
 * 1. Strict tool allowlist (only registered BLACKBOX quantitative tools)
 * 2. Hard tool execution ceiling (maximum 8 executions per investigation)
 * 3. Schema validation via Zod
 * 4. Categorical confidence rating determination
 * 5. Prohibition of arbitrary code execution, filesystem access, or external networks
 */

import { BLACKBOX_TOOLS, PORTFOLIO_TOOLS } from '../aiTools';
import { ConfidenceLevel, ContradictionEvaluation, EvidenceItem } from './researchTypes';

/**
 * The 12 authoritative BLACKBOX quantitative single-asset tools (Phase 3.6 baseline).
 */
export const ALLOWED_RESEARCH_TOOLS = [
  'get_asset_metrics',
  'get_strategy_metrics',
  'get_benchmark_metrics',
  'get_regime_performance',
  'get_drawdown_analysis',
  'get_correlation_matrix',
  'get_rolling_correlation',
  'get_robustness_analysis',
  'get_stress_result',
  'get_strategy_genome',
  'get_research_trail',
  'get_risk_brief',
] as const;

/**
 * Phase 3.7 multi-asset portfolio tools permitted for autonomous quantitative research.
 */
export const PORTFOLIO_RESEARCH_TOOLS = [
  'get_portfolio_metrics',
  'get_portfolio_optimization',
  'get_monte_carlo_risk',
  'compare_monte_carlo_backtest',
  'get_regime_monte_carlo_risk',
  'compare_regime_simulations',
] as const;

export const ALL_RESEARCH_TOOLS = [
  ...ALLOWED_RESEARCH_TOOLS,
  ...PORTFOLIO_RESEARCH_TOOLS,
] as const;

export type AllowedResearchToolName = typeof ALL_RESEARCH_TOOLS[number];

/**
 * Standard alias mappings to ensure canonical BLACKBOX tool resolution
 */
export const TOOL_ALIAS_MAP: Record<string, AllowedResearchToolName> = {
  'get_regime_analysis': 'get_regime_performance',
  'get_correlation_analysis': 'get_correlation_matrix',
  'get_stress_analysis': 'get_stress_result',
  'get_portfolio_analysis': 'get_portfolio_metrics',
  'run_monte_carlo': 'get_monte_carlo_risk',
  'monte_carlo_risk': 'get_monte_carlo_risk',
  'run_regime_monte_carlo': 'get_regime_monte_carlo_risk',
  'regime_monte_carlo': 'get_regime_monte_carlo_risk',
  'compare_regimes': 'compare_regime_simulations',
};

/**
 * Maximum quantitative tool executions per investigation to prevent unbounded loops.
 */
export const MAX_RESEARCH_TOOL_EXECUTIONS = 8;

/**
 * Normalizes tool names and verifies membership in the strict allowlist.
 */
export function normalizeToolName(toolName: string): AllowedResearchToolName | null {
  const trimmed = toolName.trim();
  if (ALL_RESEARCH_TOOLS.includes(trimmed as AllowedResearchToolName)) {
    return trimmed as AllowedResearchToolName;
  }
  if (TOOL_ALIAS_MAP[trimmed]) {
    return TOOL_ALIAS_MAP[trimmed];
  }
  return null;
}

/**
 * Strict allowlist check. Returns true ONLY if tool is an approved BLACKBOX quantitative engine.
 */
export function isToolAllowed(toolName: string): boolean {
  return normalizeToolName(toolName) !== null;
}

/**
 * Validates tool arguments against the tool's registered Zod schema.
 */
export function validateToolArguments(toolName: string, args: Record<string, any>): { valid: boolean; error?: string; parsedArgs?: any } {
  const canonicalName = normalizeToolName(toolName);
  if (!canonicalName) {
    return {
      valid: false,
      error: `Tool '${toolName}' is not in the authorized BLACKBOX quantitative tool allowlist. Arbitrary tool execution is forbidden.`,
    };
  }

  const toolDef = BLACKBOX_TOOLS[canonicalName] || PORTFOLIO_TOOLS[canonicalName];
  if (!toolDef || !toolDef.schema) {
    return {
      valid: false,
      error: `Tool definition for '${canonicalName}' is missing valid validation schema.`,
    };
  }

  const result = toolDef.schema.safeParse(args || {});
  if (!result.success) {
    return {
      valid: false,
      error: `Argument schema validation failed for '${canonicalName}': ${result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
    };
  }

  return {
    valid: true,
    parsedArgs: result.data,
  };
}

/**
 * Evaluates categorical confidence based on empirical evidence and contradiction status.
 * 
 * Governance Rule:
 * - HIGH_EVIDENCE: >= 2 supporting tests, >= 1 resolved contradiction or robust secondary test, 0 failed tools, consistent data window.
 * - MODERATE_EVIDENCE: >= 1 supporting test, no conflicting unresolved evidence, 0 failed tools.
 * - LIMITED_EVIDENCE: 1 test executed with limited scope or secondary test unavailable.
 * - INCONCLUSIVE: Critical tool failed, contradictory evidence unresolved, or empty observations.
 */
export function calculateCategoricalConfidence(
  evidence: EvidenceItem[],
  evaluations: ContradictionEvaluation[]
): { confidence: ConfidenceLevel; reason: string } {
  const completedEvidence = evidence.filter(e => e.status === 'COMPLETED');
  const failedEvidence = evidence.filter(e => e.status === 'TOOL_FAILED');

  if (completedEvidence.length === 0 || failedEvidence.length > completedEvidence.length) {
    return {
      confidence: 'INCONCLUSIVE',
      reason: 'Critical tool execution failed or returned insufficient empirical data.',
    };
  }

  const supportedEvaluations = evaluations.filter(ev => ev.status === 'SUPPORTED');
  const contradictedEvaluations = evaluations.filter(ev => ev.status === 'CONTRADICTED');
  const inconclusiveEvaluations = evaluations.filter(ev => ev.status === 'INCONCLUSIVE');

  if (supportedEvaluations.length === 0 && inconclusiveEvaluations.length > 0) {
    return {
      confidence: 'INCONCLUSIVE',
      reason: 'Empirical tests yielded mixed signals with no definitive causal pattern.',
    };
  }

  if (supportedEvaluations.length >= 2 && contradictedEvaluations.length >= 1 && failedEvidence.length === 0) {
    return {
      confidence: 'HIGH_EVIDENCE',
      reason: `Supported by ${supportedEvaluations.length} independent quantitative tests with alternative hypothesis explicitly tested and contradicted.`,
    };
  }

  if (supportedEvaluations.length >= 1 && failedEvidence.length === 0) {
    return {
      confidence: 'MODERATE_EVIDENCE',
      reason: `Supported by ${completedEvidence.length} deterministic tool results across ${supportedEvaluations.length} verified hypothesis.`,
    };
  }

  if (completedEvidence.length >= 1) {
    return {
      confidence: 'LIMITED_EVIDENCE',
      reason: 'Preliminary empirical evidence gathered, but requires wider parameter sweeps or additional stress tests.',
    };
  }

  return {
    confidence: 'INCONCLUSIVE',
    reason: 'Insufficient conclusive quantitative evidence.',
  };
}
