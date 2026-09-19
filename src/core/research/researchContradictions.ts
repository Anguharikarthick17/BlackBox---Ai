/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Contradiction Engine & Counterfactual Audit
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import {
  ResearchHypothesis,
  EvidenceRecord,
  ContradictionRecord,
  HypothesisStatus,
  ConfidenceRating,
} from './researchTypes';

/**
 * Evaluates hypotheses against all collected evidence, searching explicitly
 * for disconfirming signals and contradictions.
 */
export function evaluateContradictions(
  hypotheses: ResearchHypothesis[],
  evidenceRecords: EvidenceRecord[]
): {
  contradictions: ContradictionRecord[];
  updatedHypotheses: ResearchHypothesis[];
} {
  const contradictions: ContradictionRecord[] = [];
  const updatedHypotheses: ResearchHypothesis[] = [];
  let contradictionCounter = 1;

  for (const hyp of hypotheses) {
    // Find all directly bound evidence
    const boundEvidence = evidenceRecords.filter(
      e => e.hypothesisId === hyp.hypothesisId || hyp.testIds.includes(e.experimentId)
    );

    const supportingEvidenceIds: string[] = [];
    const disconfirmingEvidenceIds: string[] = [];
    let contradictionAnalysis = '';

    // Specific domain counterfactual audits based on hypothesis category:
    if (hyp.category === 'EXECUTION_FRICTION') {
      // Look for zero-fee robustness evidence
      const robEv = evidenceRecords.find(e => e.toolName === 'get_robustness_analysis');
      const bmEv = evidenceRecords.find(e => e.toolName === 'get_benchmark_metrics');
      const stratEv = evidenceRecords.find(e => e.toolName === 'get_strategy_metrics');

      if (robEv && bmEv && stratEv) {
        const zeroFeeReturn = Number(robEv.result.performanceAtZeroFee ?? robEv.result.zeroCostReturn ?? 0);
        const bmReturn = Number(bmEv.result.benchmarkReturn ?? bmEv.result.totalReturn ?? 0);
        const baseReturn = Number(stratEv.result.totalReturn ?? 0);

        if (zeroFeeReturn < bmReturn && baseReturn < bmReturn) {
          // Underperformance persists even at 0 fees!
          disconfirmingEvidenceIds.push(robEv.evidenceId);
          supportingEvidenceIds.push(stratEv.evidenceId);
          contradictionAnalysis =
            `Zero-cost backtest realized return of ${zeroFeeReturn.toFixed(2)}%, which remains below Buy & Hold (${bmReturn.toFixed(2)}%). ` +
            `Execution friction explains ${Math.max(0, zeroFeeReturn - baseReturn).toFixed(2)}% drag but contradicts fee-alone attribution.`;
        } else {
          supportingEvidenceIds.push(robEv.evidenceId);
        }
      } else {
        boundEvidence.forEach(e => supportingEvidenceIds.push(e.evidenceId));
      }
    } else if (hyp.category === 'REGIME_SENSITIVITY') {
      const regEv = evidenceRecords.find(e => e.toolName === 'get_regime_performance');
      if (regEv && Array.isArray(regEv.result.regimeBreakdown)) {
        const hasDivergence = regEv.result.regimeBreakdown.some(
          (r: any) => (r.strategyReturn ?? 0) < 0
        );
        if (hasDivergence) {
          supportingEvidenceIds.push(regEv.evidenceId);
        } else {
          disconfirmingEvidenceIds.push(regEv.evidenceId);
          contradictionAnalysis = 'Strategy demonstrated consistent positive returns across all classified market regimes, weakening regime drag hypothesis.';
        }
      } else {
        boundEvidence.forEach(e => supportingEvidenceIds.push(e.evidenceId));
      }
    } else {
      boundEvidence.forEach(e => supportingEvidenceIds.push(e.evidenceId));
    }

    // Determine resolved hypothesis status and confidence
    let newStatus: HypothesisStatus = hyp.status;
    let newConfidence: ConfidenceRating = hyp.confidence;

    if (disconfirmingEvidenceIds.length > 0 && supportingEvidenceIds.length === 0) {
      newStatus = 'CONTRADICTED';
      newConfidence = 'HIGH_EVIDENCE';
    } else if (disconfirmingEvidenceIds.length > 0 && supportingEvidenceIds.length > 0) {
      newStatus = 'PARTIALLY_SUPPORTED';
      newConfidence = 'MODERATE_EVIDENCE';

      const record: ContradictionRecord = {
        contradictionId: `C-${String(contradictionCounter++).padStart(3, '0')}`,
        hypothesisId: hyp.hypothesisId,
        supportingEvidenceIds,
        disconfirmingEvidenceIds,
        analysis: contradictionAnalysis || 'Tension detected between baseline strategy underperformance and component attribution.',
        resolution: 'SECONDARY_TEST_REQUIRED',
      };
      contradictions.push(record);
    } else if (supportingEvidenceIds.length >= 2) {
      newStatus = 'SUPPORTED';
      newConfidence = 'HIGH_EVIDENCE';
    } else if (supportingEvidenceIds.length === 1) {
      newStatus = 'SUPPORTED';
      newConfidence = 'MODERATE_EVIDENCE';
    } else {
      newStatus = 'INCONCLUSIVE';
      newConfidence = 'INCONCLUSIVE';
    }

    updatedHypotheses.push({
      ...hyp,
      status: newStatus,
      confidence: newConfidence,
      contradictingEvidence: disconfirmingEvidenceIds,
    });
  }

  return {
    contradictions,
    updatedHypotheses,
  };
}
