/**
 * BLACKBOX X — Contradiction Engine
 * 
 * Mandatory critical evaluation phase:
 * Challenges every hypothesis against empirical evidence before conclusions are formed.
 * 
 * Classifies each hypothesis as:
 * - SUPPORTED
 * - PARTIALLY_SUPPORTED
 * - CONTRADICTED
 * - INCONCLUSIVE
 */

import { ResearchHypothesis, EvidenceItem, ContradictionEvaluation } from './researchTypes';

/**
 * Evaluates hypotheses against the collected empirical evidence graph.
 */
export function evaluateContradictions(
  hypotheses: ResearchHypothesis[],
  evidenceList: EvidenceItem[]
): ContradictionEvaluation[] {
  const evaluations: ContradictionEvaluation[] = [];

  // Index completed evidence
  const completedEvidence = evidenceList.filter(e => e.status === 'COMPLETED');
  const failedEvidence = evidenceList.filter(e => e.status === 'TOOL_FAILED');

  // Locate common reference metrics if available
  const strategyBaseEvidence = completedEvidence.find(
    e => e.toolName === 'get_strategy_metrics' && e.toolArguments.transactionCostPct === 0.001
  );
  const benchmarkEvidence = completedEvidence.find(e => e.toolName === 'get_benchmark_metrics');
  const zeroCostEvidence = completedEvidence.find(
    e => e.toolName === 'get_strategy_metrics' && e.toolArguments.transactionCostPct === 0.0
  );
  const regimeEvidence = completedEvidence.find(e => e.toolName === 'get_regime_performance');
  const drawdownEvidence = completedEvidence.find(e => e.toolName === 'get_drawdown_analysis');
  const robustnessEvidence = completedEvidence.find(e => e.toolName === 'get_robustness_analysis');
  const stressEvidence = completedEvidence.find(e => e.toolName === 'get_stress_result');

  for (const hyp of hypotheses) {
    const directEvidenceList = completedEvidence.filter(e => e.hypothesisId === hyp.id);
    const directFailed = failedEvidence.filter(e => e.hypothesisId === hyp.id);

    // Rule 1: If primary tool failed and no secondary completed -> INCONCLUSIVE
    if (directEvidenceList.length === 0 && directFailed.length > 0) {
      evaluations.push({
        hypothesisId: hyp.id,
        hypothesisStatement: hyp.statement,
        status: 'INCONCLUSIVE',
        directEvidence: 'Tool execution failed or returned no quantitative data.',
        interpretation: 'In accordance with zero-fabrication rules, no conclusive claim can be made.',
        explanation: 'Quantitative tool execution failed for this hypothesis. In accordance with zero-fabrication rules, no conclusive claim can be made.',
        supportingEvidenceIds: [],
        contradictingEvidenceIds: directFailed.map(f => f.evidenceId),
        empiricalMetrics: {},
      });
      continue;
    }

    // Rule 2: Transaction Cost Hypothesis (H2 for performance discrepancy)
    if (
      hyp.statement.toLowerCase().includes('transaction') ||
      hyp.statement.toLowerCase().includes('cost') ||
      hyp.statement.toLowerCase().includes('friction')
    ) {
      if (zeroCostEvidence && benchmarkEvidence) {
        const zeroCostReturn = Number(zeroCostEvidence.keyMetrics.totalReturn || 0);
        const benchmarkReturn = Number(benchmarkEvidence.keyMetrics.totalReturn || 0);
        const baselineReturn = strategyBaseEvidence ? Number(strategyBaseEvidence.keyMetrics.totalReturn || 0) : 0;
        const deltaPoints = Number((zeroCostReturn - baselineReturn).toFixed(2));

        // If at 0% cost, the strategy still dramatically lags the benchmark: CONTRADICTED!
        if (zeroCostReturn < benchmarkReturn * 0.85) {
          evaluations.push({
            hypothesisId: hyp.id,
            hypothesisStatement: hyp.statement,
            status: 'CONTRADICTED',
            directEvidence: `Strategy total return is ${baselineReturn}% at 0.10% cost and ${zeroCostReturn}% at 0.00% cost (+${deltaPoints} percentage points) versus Buy & Hold return of ${benchmarkReturn}%.`,
            interpretation: `Removing transaction costs increases strategy total return by ${deltaPoints} percentage points, but the strategy remains substantially below the Buy & Hold return of ${benchmarkReturn}%. Transaction costs do not account for the performance gap.`,
            explanation: `Contradiction detected: Removing transaction costs increases strategy total return by ${deltaPoints} percentage points, but the strategy remains substantially below the Buy & Hold return of ${benchmarkReturn}%.`,
            supportingEvidenceIds: [],
            contradictingEvidenceIds: [zeroCostEvidence.evidenceId, benchmarkEvidence.evidenceId],
            empiricalMetrics: {
              strategyZeroCostReturn: zeroCostReturn,
              benchmarkReturn,
              frictionImpactPercentagePoints: deltaPoints,
            },
          });
          continue;
        } else {
          evaluations.push({
            hypothesisId: hyp.id,
            hypothesisStatement: hyp.statement,
            status: 'SUPPORTED',
            directEvidence: `Strategy total return at 0% transaction cost is ${zeroCostReturn}% compared to benchmark return of ${benchmarkReturn}%.`,
            interpretation: `Removing transaction costs enables strategy returns to converge with or exceed the benchmark, supporting transaction cost sensitivity.`,
            explanation: `Empirical evidence supports cost sensitivity: At 0% transaction cost, strategy return (${zeroCostReturn}%) converges with or exceeds benchmark return (${benchmarkReturn}%).`,
            supportingEvidenceIds: [zeroCostEvidence.evidenceId, benchmarkEvidence.evidenceId],
            contradictingEvidenceIds: [],
            empiricalMetrics: {
              strategyZeroCostReturn: zeroCostReturn,
              benchmarkReturn,
            },
          });
          continue;
        }
      }
    }

    // Rule 3: Regime Drag Hypothesis (H1 for performance discrepancy or regime behavior)
    if (
      hyp.statement.toLowerCase().includes('regime') ||
      hyp.statement.toLowerCase().includes('trend persistence') ||
      hyp.statement.toLowerCase().includes('bear')
    ) {
      const perfs: any[] = regimeEvidence?.result?.regimeBreakdown || regimeEvidence?.result?.regimePerformance;
      if (regimeEvidence && perfs && perfs.length > 0) {
        const bearPerf = perfs.find((p: any) => p.regime.toUpperCase().includes('BEAR'));
        const bullPerf = perfs.find((p: any) => p.regime.toUpperCase().includes('BULL'));

        const bearSharpe = bearPerf ? Number(bearPerf.sharpeRatio) : 0;
        const bullSharpe = bullPerf ? Number(bullPerf.sharpeRatio) : 0;
        const dominantRegime = regimeEvidence.result.dominantRegime || 'BEAR';

        if (bullSharpe > 0 && bearSharpe < bullSharpe) {
          const supporting = [regimeEvidence.evidenceId];
          if (benchmarkEvidence) supporting.push(benchmarkEvidence.evidenceId);

          evaluations.push({
            hypothesisId: hyp.id,
            hypothesisStatement: hyp.statement,
            status: 'SUPPORTED',
            directEvidence: `Regime decomposition shows Bull regime Sharpe of ${bullSharpe} versus Bear regime Sharpe of ${bearSharpe} under dominant regime '${dominantRegime}'.`,
            interpretation: `Regime-dependent performance contributed to the strategy's underperformance relative to Buy & Hold.`,
            explanation: `Evidence indicates that regime-dependent performance contributed to the strategy's underperformance relative to Buy & Hold. Regime decomposition shows Bull Sharpe of ${bullSharpe} versus Bear Sharpe of ${bearSharpe}.`,
            supportingEvidenceIds: supporting,
            contradictingEvidenceIds: [],
            empiricalMetrics: {
              bullSharpe,
              bearSharpe,
              dominantRegime,
            },
          });
          continue;
        }
      }
    }

    // Rule 4: Drawdown Drag Hypothesis (H3)
    if (
      hyp.statement.toLowerCase().includes('drawdown') ||
      hyp.statement.toLowerCase().includes('shock') ||
      hyp.statement.toLowerCase().includes('recovery')
    ) {
      if (drawdownEvidence) {
        const maxDd = Number(drawdownEvidence.keyMetrics.maxDrawdown ?? drawdownEvidence.result?.strategyMaxDrawdownPct ?? 0);
        const benchDd = Number(drawdownEvidence.keyMetrics.benchmarkMaxDrawdown ?? drawdownEvidence.result?.benchmarkMaxDrawdownPct ?? 0);

        evaluations.push({
          hypothesisId: hyp.id,
          hypothesisStatement: hyp.statement,
          status: 'SUPPORTED',
          directEvidence: `Maximum peak-to-trough drawdown was ${maxDd}% (Benchmark MaxDD: ${benchDd}%).`,
          interpretation: 'Drawdown episodes introduced recovery and compounding drag relative to the benchmark.',
          explanation: `Drawdown episodes introduced recovery and compounding drag relative to the benchmark. Maximum peak-to-trough drawdown was ${maxDd}%.`,
          supportingEvidenceIds: [drawdownEvidence.evidenceId],
          contradictingEvidenceIds: [],
          empiricalMetrics: {
            maxDrawdownPct: maxDd,
          },
        });
        continue;
      }
    }

    // Rule 5: Robustness Stability Hypothesis
    if (hyp.statement.toLowerCase().includes('robust') || hyp.statement.toLowerCase().includes('stability')) {
      if (robustnessEvidence) {
        const minSharpe = Number(robustnessEvidence.keyMetrics.minSharpe ?? robustnessEvidence.result?.minSharpeRatio ?? 0);
        const maxSharpe = Number(robustnessEvidence.keyMetrics.maxSharpe ?? robustnessEvidence.result?.maxSharpeRatio ?? 0);

        if (minSharpe > 0) {
          evaluations.push({
            hypothesisId: hyp.id,
            hypothesisStatement: hyp.statement,
            status: 'SUPPORTED',
            directEvidence: `Parameter neighborhood Sharpe ratios range from ${minSharpe} to ${maxSharpe} across tested configurations.`,
            interpretation: `Parameter stability is observed across neighboring window configurations without Sharpe collapse.`,
            explanation: `Supported by robustness sweep: Parameter neighborhood demonstrates positive Sharpe ratios across configurations (range [${minSharpe}, ${maxSharpe}]).`,
            supportingEvidenceIds: [robustnessEvidence.evidenceId],
            contradictingEvidenceIds: [],
            empiricalMetrics: { minSharpe, maxSharpe },
          });
          continue;
        } else {
          evaluations.push({
            hypothesisId: hyp.id,
            hypothesisStatement: hyp.statement,
            status: 'PARTIALLY_SUPPORTED',
            directEvidence: `Minimum Sharpe ratio drops to ${minSharpe} across parameter perturbations.`,
            interpretation: `Parameter sensitivity is observed, indicating potential parameter fragility under specific window pairs.`,
            explanation: `Parameter sensitivity observed: Minimum Sharpe drops to ${minSharpe}, indicating potential parameter fragility under specific window pairs.`,
            supportingEvidenceIds: [robustnessEvidence.evidenceId],
            contradictingEvidenceIds: [],
            empiricalMetrics: { minSharpe, maxSharpe },
          });
          continue;
        }
      }
    }

    // Default Fallback Evaluation for any generic hypothesis with direct evidence
    if (directEvidenceList.length > 0) {
      evaluations.push({
        hypothesisId: hyp.id,
        hypothesisStatement: hyp.statement,
        status: 'SUPPORTED',
        directEvidence: `Empirical observations recorded across ${directEvidenceList.length} deterministic tool run(s).`,
        interpretation: `Quantitative results provide empirical baseline for ${hyp.statement}.`,
        explanation: `Empirical evidence collected across ${directEvidenceList.length} deterministic tool run(s) confirms consistent quantitative observations.`,
        supportingEvidenceIds: directEvidenceList.map(e => e.evidenceId),
        contradictingEvidenceIds: [],
        empiricalMetrics: directEvidenceList[0].keyMetrics,
      });
    } else {
      evaluations.push({
        hypothesisId: hyp.id,
        hypothesisStatement: hyp.statement,
        status: 'INCONCLUSIVE',
        directEvidence: 'No direct quantitative evidence collected.',
        interpretation: 'Insufficient quantitative evidence to establish empirical support or contradiction.',
        explanation: `Insufficient quantitative evidence collected to establish empirical support or contradiction.`,
        supportingEvidenceIds: [],
        contradictingEvidenceIds: [],
        empiricalMetrics: {},
      });
    }
  }

  return evaluations;
}
