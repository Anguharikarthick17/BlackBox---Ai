/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Auditable Institutional Research Memo & Export Engine
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import {
  ResearchMemo,
  ResearchSession,
  ExperimentPlan,
  EvidenceRecord,
  ResearchHypothesis,
  ResearchSynthesis,
} from './researchTypes';
import { validateAllClaims } from './researchEvidence';

export function generateResearchMemo(params: {
  session: ResearchSession;
  plan?: ExperimentPlan;
  hypotheses: ResearchHypothesis[];
  evidence: EvidenceRecord[];
  synthesis: ResearchSynthesis;
}): ResearchMemo {
  const { session, plan, hypotheses, evidence, synthesis } = params;

  // Validate numerical claims bound to evidence
  validateAllClaims(synthesis.claims, evidence);

  const memoId = `MEMO-${session.sessionId.slice(0, 8).toUpperCase()}`;
  const now = Date.now();

  const sections = {
    researchQuestion: session.researchQuestion,
    executiveObservation: synthesis.executiveObservation,
    hypotheses: hypotheses.map(h => ({
      id: h.hypothesisId,
      statement: h.statement,
      category: h.category,
      status: h.status,
      confidence: h.confidence,
    })),
    experimentPlanSummary: plan
      ? `Bounded DAG plan containing ${plan.experiments.length} scheduled tool executions with total budget of ${plan.totalBudget}.`
      : 'Standard bounded quantitative DAG execution.',
    directEvidence: evidence.map(e => ({
      id: e.evidenceId,
      statement: e.directEvidence,
      toolName: e.toolName,
      metrics: e.result,
    })),
    contradictions: synthesis.contradictions,
    secondaryTests: synthesis.secondaryTests,
    quantitativeFindings: synthesis.claims.map(c => ({
      claimId: c.claimId,
      metric: c.metric,
      value: c.value,
      text: c.text,
      boundEvidence: c.evidenceIds,
    })),
    riskInterpretation: synthesis.riskInterpretation,
    robustnessAssessment: synthesis.robustnessAssessment,
    limitations: synthesis.limitations,
    nextResearchQuestions: synthesis.nextResearchQuestions,
    methodology:
      'Deterministic quantitative evaluation utilizing official BLACKBOX X computational engines. Zero financial calculations in the AI layer. All metrics computed over common calendar synchronized historical bars with zero look-ahead bias and next-bar execution.',
    provenance: session.provenance,
    disclaimer:
      'CONFIDENTIAL INSTITUTIONAL RESEARCH MEMORANDUM. FOR ANALYTICAL AND RESEARCH PURPOSES ONLY. DOES NOT CONSTITUTE FINANCIAL, INVESTMENT, OR TRADING ADVICE. ALL METRICS AND SIMULATIONS EVALUATED ON SYNCHRONIZED HISTORICAL DATASETS.',
  };

  const mdLines: string[] = [
    `# BLACKBOX X — INSTITUTIONAL RESEARCH MEMO`,
    `**Memo Reference**: \`${memoId}\`  `,
    `**Session ID**: \`${session.sessionId}\`  `,
    `**Audit Fingerprint**: \`${session.configurationFingerprint}\`  `,
    `**Generated**: ${new Date(now).toISOString()}  `,
    ``,
    `---`,
    ``,
    `## 1. Research Question`,
    `> **Inquiry**: *${sections.researchQuestion}*`,
    ``,
    `## 2. Executive Observation`,
    `${sections.executiveObservation}`,
    ``,
    `## 3. Hypotheses & Confidence Ratings`,
    `| ID | Category | Proposition | Status | Confidence |`,
    `| :--- | :--- | :--- | :--- | :--- |`,
    ...sections.hypotheses.map(
      h => `| **${h.id}** | \`${h.category}\` | ${h.statement} | \`${h.status}\` | \`${h.confidence}\` |`
    ),
    ``,
    `## 4. Experiment Plan Summary`,
    `${sections.experimentPlanSummary}`,
    ``,
    `## 5. Direct Quantitative Evidence`,
    ...sections.directEvidence.map(
      e => `- **[\`${e.id}\`]** *(${e.toolName})*: ${e.statement}`
    ),
    ``,
    `## 6. Contradictions & Counterfactual Audit`,
    sections.contradictions.length > 0
      ? sections.contradictions.map(c => `- ${c}`).join('\n')
      : `No significant empirical contradictions detected. Direct evidence is mutually consistent.`,
    ``,
    `## 7. Secondary Testing Findings`,
    sections.secondaryTests.length > 0
      ? sections.secondaryTests.map(s => `- ${s}`).join('\n')
      : `No secondary parameter sweeps were triggered.`,
    ``,
    `## 8. Quantitative Findings & Structured Claims`,
    ...sections.quantitativeFindings.map(
      q => `- **[\`${q.claimId}\`]** ${q.text} *(Evidence: ${q.boundEvidence.map(id => `\`[${id}]\``).join(', ')})*`
    ),
    ``,
    `## 9. Risk & Regime Interpretation`,
    `${sections.riskInterpretation}`,
    ``,
    `## 10. Robustness & Assumption Sensitivity`,
    `${sections.robustnessAssessment}`,
    ``,
    `## 11. Methodological Limitations`,
    ...sections.limitations.map(l => `- ${l}`),
    ``,
    `## 12. Recommended Next Research Tests`,
    ...sections.nextResearchQuestions.map(n => `- ${n}`),
    ``,
    `## 13. Quantitative Methodology`,
    `${sections.methodology}`,
    ``,
    `## 14. Provenance & Reproducibility Audit`,
    `- **Observation Window**: \`${session.provenance.dataWindow.startDate}\` to \`${session.provenance.dataWindow.endDate}\` (${session.provenance.dataWindow.observationCount} synchronized trading bars)`,
    `- **Deterministic PRNG Seed**: \`${session.provenance.deterministicSeed}\``,
    `- **Total Tool Executions**: \`${session.provenance.totalToolsExecuted}\``,
    `- **Engine Execution Wall-Clock**: \`${session.provenance.totalExecutionDurationMs}ms\``,
    `- **Dataset Hash**: \`${session.datasetFingerprint}\``,
    ``,
    `## 15. Regulatory & Non-Investment Advice Disclaimer`,
    `> **NOTICE**: ${sections.disclaimer}`,
    ``,
  ];

  return {
    memoId,
    sessionId: session.sessionId,
    generatedAt: now,
    sections,
    rawMarkdown: mdLines.join('\n'),
  };
}

export function exportResearchSessionJson(
  session: ResearchSession,
  evidence: EvidenceRecord[],
  synthesis?: ResearchSynthesis
): string {
  const exportPayload = {
    session,
    evidence,
    synthesis,
    exportedAt: new Date().toISOString(),
    schemaVersion: '4.0.0',
  };
  return JSON.stringify(exportPayload, null, 2);
}
