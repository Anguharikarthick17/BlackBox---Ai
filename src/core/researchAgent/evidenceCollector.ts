/**
 * BLACKBOX X — Evidence Collector & Graph Builder
 * 
 * Executes deterministic BLACKBOX tools and collects structured evidence records.
 * 
 * CORE PRINCIPLE:
 * BLACKBOX X calculates. The AI interprets.
 * ZERO financial calculations inside the AI layer.
 * Preserves strict data provenance: asset, strategy, data window, tool name, and source.
 */

import { BLACKBOX_TOOLS } from '../aiTools';
import { selectAndValidateTool } from './toolSelector';
import { ExperimentStep, EvidenceItem } from './researchTypes';

/**
 * Executes a single experiment step, collects structured quantitative evidence,
 * and maintains complete data provenance.
 */
export async function executeExperimentStep(
  step: ExperimentStep,
  executionOrder: number
): Promise<EvidenceItem> {
  const evidenceId = `EV-${String(executionOrder).padStart(2, '0')}`;
  const now = Date.now();

  // 1. Tool Selection & Schema Validation Guard
  const validation = selectAndValidateTool(step.toolName, step.arguments);
  if (!validation.isValid || !validation.toolName) {
    return {
      evidenceId,
      hypothesisId: step.hypothesisId,
      toolName: step.toolName,
      toolArguments: step.arguments,
      result: null,
      dataWindow: 'N/A',
      executionOrder,
      timestamp: now,
      status: 'TOOL_FAILED',
      summary: `Execution rejected: ${validation.rejectionReason}`,
      keyMetrics: {},
    };
  }

  const toolName = validation.toolName;
  const toolDef = BLACKBOX_TOOLS[toolName];
  const validatedArgs = validation.validatedArguments || step.arguments || {};

  try {
    // 2. Deterministic BLACKBOX Tool Execution
    const rawResult = await Promise.resolve(toolDef.execute(validatedArgs));

    // 3. Extract Data Window & Key Provenance
    const dataWindow =
      rawResult.dataWindow ||
      rawResult.period ||
      `${validatedArgs.startDate || '2020-01-01'} to ${validatedArgs.endDate || '2023-12-31'}`;

    // 4. Extract Structured Key Numerical Metrics
    const keyMetrics: Record<string, number | string> = {};
    if (typeof rawResult.totalReturn === 'number') keyMetrics.totalReturn = rawResult.totalReturn;
    if (typeof rawResult.annualizedReturn === 'number') keyMetrics.annualizedReturn = rawResult.annualizedReturn;
    if (typeof rawResult.sharpe === 'number') keyMetrics.sharpe = rawResult.sharpe;
    if (typeof rawResult.sharpeRatio === 'number') keyMetrics.sharpe = rawResult.sharpeRatio;
    if (typeof rawResult.volatility === 'number') keyMetrics.volatility = rawResult.volatility;
    if (typeof rawResult.maxDrawdown === 'number') keyMetrics.maxDrawdown = rawResult.maxDrawdown;
    if (typeof rawResult.strategyMaxDrawdownPct === 'number') keyMetrics.maxDrawdown = rawResult.strategyMaxDrawdownPct;
    if (typeof rawResult.benchmarkMaxDrawdownPct === 'number') keyMetrics.benchmarkMaxDrawdown = rawResult.benchmarkMaxDrawdownPct;
    if (typeof rawResult.tradeCount === 'number') keyMetrics.tradeCount = rawResult.tradeCount;
    if (typeof rawResult.winRate === 'number') keyMetrics.winRate = rawResult.winRate;
    if (typeof rawResult.winRatePct === 'number') keyMetrics.winRate = rawResult.winRatePct;
    if (typeof rawResult.dominantRegime === 'string') keyMetrics.dominantRegime = rawResult.dominantRegime;
    if (typeof rawResult.shockReturnPct === 'number') keyMetrics.shockReturn = rawResult.shockReturnPct;
    if (typeof rawResult.shockMaxDrawdownPct === 'number') keyMetrics.shockMaxDrawdown = rawResult.shockMaxDrawdownPct;
    if (typeof rawResult.currentCorrelation === 'number') keyMetrics.currentCorrelation = rawResult.currentCorrelation;
    if (typeof rawResult.minSharpe === 'number') keyMetrics.minSharpe = rawResult.minSharpe;
    if (typeof rawResult.minSharpeRatio === 'number') keyMetrics.minSharpe = rawResult.minSharpeRatio;
    if (typeof rawResult.maxSharpe === 'number') keyMetrics.maxSharpe = rawResult.maxSharpe;
    if (typeof rawResult.maxSharpeRatio === 'number') keyMetrics.maxSharpe = rawResult.maxSharpeRatio;
    if (typeof rawResult.meanSharpeRatio === 'number') keyMetrics.meanSharpe = rawResult.meanSharpeRatio;
    if (typeof rawResult.consistencyRatePct === 'number') keyMetrics.consistencyRate = rawResult.consistencyRatePct;

    // 5. Generate Evidence Summary grounded in BLACKBOX metrics
    let summary = `Tool '${toolName}' executed successfully on ${dataWindow}.`;
    if (toolName === 'get_strategy_metrics') {
      summary = `Strategy ${rawResult.strategy} on ${rawResult.asset}: Return ${rawResult.totalReturn}%, Sharpe ${rawResult.sharpe}, MaxDD ${rawResult.maxDrawdown}% across ${rawResult.tradeCount} trades (data window: ${dataWindow}).`;
    } else if (toolName === 'get_benchmark_metrics') {
      summary = `Benchmark Buy & Hold on ${rawResult.asset}: Return ${rawResult.totalReturn}%, Sharpe ${rawResult.sharpe}, MaxDD ${rawResult.maxDrawdown}% (data window: ${dataWindow}).`;
    } else if (toolName === 'get_regime_performance') {
      const regimes = rawResult.regimeBreakdown || rawResult.regimePerformance || [];
      const regimeSummaries = regimes.map((r: any) => `${r.regime}: ${r.strategyReturnPct ?? r.totalReturn}% return, Sharpe ${r.sharpeRatio}`).join('; ');
      summary = `Regime performance (${rawResult.strategy} on ${rawResult.asset}): Dominant '${rawResult.dominantRegime}'. Breakdown: ${regimeSummaries}.`;
    } else if (toolName === 'get_drawdown_analysis') {
      summary = `Drawdown analysis on ${rawResult.asset}: Max Drawdown ${rawResult.strategyMaxDrawdownPct ?? rawResult.maxDrawdown}%, Benchmark MaxDD ${rawResult.benchmarkMaxDrawdownPct}%, Drawdown Delta ${rawResult.drawdownDeltaPct}%. Assessment: ${rawResult.capitalPreservationAssessment || 'N/A'}`;
    } else if (toolName === 'get_robustness_analysis') {
      summary = `Robustness sweep on ${rawResult.asset} (${rawResult.strategy}): ${rawResult.configurationsTested || 4} configurations evaluated. Sharpe range: [${rawResult.minSharpeRatio ?? 'N/A'}, ${rawResult.maxSharpeRatio ?? 'N/A'}], Consistency: ${rawResult.consistencyRatePct}%. Best: ${rawResult.bestConfig}.`;
    } else if (toolName === 'get_stress_result') {
      summary = `Stress scenario '${rawResult.scenarioName || rawResult.scenarioId}': Stressed Return ${rawResult.shockReturnPct}%, Stressed Drawdown ${rawResult.shockMaxDrawdownPct}%.`;
    } else if (toolName === 'get_asset_metrics') {
      summary = `Asset metrics for ${rawResult.asset}: Return ${rawResult.totalReturn}%, Volatility ${rawResult.volatility}%, Sharpe ${rawResult.sharpe}, MaxDD ${rawResult.maxDrawdown}%.`;
    }

    return {
      evidenceId,
      hypothesisId: step.hypothesisId,
      toolName,
      toolArguments: validatedArgs,
      result: rawResult,
      dataWindow,
      executionOrder,
      timestamp: now,
      status: 'COMPLETED',
      summary,
      keyMetrics,
    };
  } catch (err: any) {
    // Zero fabrication on failure!
    return {
      evidenceId,
      hypothesisId: step.hypothesisId,
      toolName,
      toolArguments: validatedArgs,
      result: null,
      dataWindow: 'N/A',
      executionOrder,
      timestamp: now,
      status: 'TOOL_FAILED',
      summary: `Tool execution error: ${err.message || 'Unknown failure'}. Quantitative result omitted.`,
      keyMetrics: {},
    };
  }
}
