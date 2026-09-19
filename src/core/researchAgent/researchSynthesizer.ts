/**
 * BLACKBOX X — Research Synthesizer
 * 
 * Synthesizes final evidence-grounded research conclusions from the evidence graph
 * and contradiction evaluations.
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Zero financial advice language (no "Buy", "Sell", "You should invest")
 * 2. All numbers must trace to registered BLACKBOX tool outputs
 * 3. Categorical confidence rating (HIGH_EVIDENCE, MODERATE_EVIDENCE, LIMITED_EVIDENCE, INCONCLUSIVE)
 * 4. Automatic generation of Research Trail (Ghost Mode) integration entry
 */

import { calculateCategoricalConfidence } from './researchPolicy';
import {
  ResearchQuestion,
  ResearchHypothesis,
  EvidenceItem,
  ContradictionEvaluation,
  ResearchConclusion,
} from './researchTypes';

/**
 * Synthesizes quantitative findings into an institutional research report.
 */
export function synthesizeResearchConclusion(
  question: ResearchQuestion,
  hypotheses: ResearchHypothesis[],
  evidenceList: EvidenceItem[],
  evaluations: ContradictionEvaluation[]
): ResearchConclusion {
  const { confidence, reason: confidenceReason } = calculateCategoricalConfidence(evidenceList, evaluations);

  const completedEvidence = evidenceList.filter(e => e.status === 'COMPLETED');
  const supportedEval = evaluations.filter(e => e.status === 'SUPPORTED');
  const contradictedEval = evaluations.filter(e => e.status === 'CONTRADICTED');

  // Build grounded finding statements with explicit separation of Direct Evidence and Interpretation
  const findings: string[] = [];

  for (const ev of supportedEval) {
    const directEvidenceText = ev.directEvidence || 'Deterministic quantitative engine calculations.';
    const interpretationText = ev.interpretation || ev.explanation;
    findings.push(
      `Evidence indicates that ${interpretationText.replace(/^Evidence indicates that /i, '')} DIRECT EVIDENCE: ${directEvidenceText} INTERPRETATION: ${interpretationText}`
    );
  }

  for (const ev of contradictedEval) {
    const directEvidenceText = ev.directEvidence || 'Deterministic quantitative engine calculations.';
    const interpretationText = ev.interpretation || ev.explanation;
    findings.push(
      `Empirical testing contradicts the hypothesis. DIRECT EVIDENCE: ${directEvidenceText} INTERPRETATION: ${interpretationText}`
    );
  }

  if (findings.length === 0) {
    findings.push('The available quantitative data does not establish a statistically significant causal driver for this inquiry.');
  }

  // Define analytical limitations based on data boundaries
  const dataWindows = Array.from(new Set(completedEvidence.map(e => e.dataWindow))).filter(w => w !== 'N/A');
  const primaryDataWindow = dataWindows[0] || `${question.startDate || '2020-01-01'} to ${question.endDate || '2023-12-31'}`;

  const limitations = [
    `Findings are strictly bounded by historical simulation over the data window ${primaryDataWindow}. Past performance does not guarantee future results.`,
    'Backtest execution models assume continuous liquidity and static order execution without market impact modeling.',
    'Regime boundaries are derived from deterministic multi-factor clustering and may not capture sudden exogenous black-swan liquidity shocks.',
  ];

  // Propose high-value next quantitative research question
  let nextResearchQuestion = `Would adaptive regime-switching position filters eliminate downside whipsaw drag on ${question.targetAsset}?`;
  if (question.intent === 'ROBUSTNESS_EVALUATION') {
    nextResearchQuestion = `How does volatility-adjusted position sizing impact parameter cliff sensitivity for ${question.targetStrategy || 'EMA_TREND'}?`;
  } else if (question.intent === 'DRAWDOWN_INVESTIGATION') {
    nextResearchQuestion = `Can a dynamic volatility stop-loss curtail maximum drawdown during rapid regime collapse?`;
  } else if (question.intent === 'CORRELATION_STRESS') {
    nextResearchQuestion = `Does dynamic asset rebalancing preserve portfolio diversification during acute macro shock regimes?`;
  }

  // Update status on the hypotheses
  const updatedHypotheses: ResearchHypothesis[] = hypotheses.map(h => {
    const evalMatch = evaluations.find(ev => ev.hypothesisId === h.id);
    return {
      ...h,
      status: evalMatch ? evalMatch.status : h.status,
      contradictionReason: evalMatch?.status === 'CONTRADICTED' ? evalMatch.explanation : undefined,
    };
  });

  return {
    question: question.query,
    intent: question.intent,
    hypotheses: updatedHypotheses,
    testsExecuted: evidenceList.length,
    evidence: evidenceList,
    evaluations,
    findings,
    confidence,
    confidenceReason,
    limitations,
    nextResearchQuestion,
  };
}

/**
 * Formats a Research Trail entry compatible with Ghost Mode / ResearchTrail.
 */
export function formatResearchTrailEntry(conclusion: ResearchConclusion): {
  observation: string;
  hypothesis: string;
  evidence: string;
  impact: string;
  nextTest: string;
} {
  const supported = conclusion.evaluations.filter(e => e.status === 'SUPPORTED');
  const contradicted = conclusion.evaluations.filter(e => e.status === 'CONTRADICTED');

  const primaryHyp = supported[0] || conclusion.hypotheses[0];
  const primaryEvidence = conclusion.evidence.filter(e => e.status === 'COMPLETED');

  const evidenceSummary = primaryEvidence
    .map(e => `[${e.evidenceId}] ${e.toolName}: ${e.summary}`)
    .slice(0, 3)
    .join(' | ');

  const contradictionNote = contradicted.length > 0
    ? `Contradicted: ${contradicted.map(c => c.hypothesisId).join(', ')}. `
    : '';

  return {
    observation: `Autonomous Investigation: "${conclusion.question}"`,
    hypothesis: primaryHyp ? primaryHyp.hypothesisStatement : 'Autonomous hypothesis testing',
    evidence: evidenceSummary || 'Deterministic BLACKBOX tool execution records',
    impact: `${contradictionNote}Confidence: ${conclusion.confidence}. ${conclusion.findings[0] || 'Research complete.'}`,
    nextTest: conclusion.nextResearchQuestion,
  };
}
