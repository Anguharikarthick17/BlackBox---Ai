/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Master Research Orchestration Pipeline
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import {
  ResearchSession,
  ExperimentPlan,
  ResearchHypothesis,
  EvidenceRecord,
  ContradictionRecord,
  SecondaryTestRecord,
  ResearchSynthesis,
  ResearchMemo,
  EvidenceGraph,
} from './researchTypes';
import { createResearchSession, transitionSession } from './researchSession';
import { generateHypotheses, generateExperimentPlan } from './researchPlanner';
import { executeRegisteredTool } from './researchToolRegistry';
import {
  createEvidenceRecord,
  formatDirectEvidenceAndInterpretation,
} from './researchEvidence';
import { evaluateContradictions } from './researchContradictions';
import { runSecondaryTests, MAX_SECONDARY_TESTS } from './researchSecondaryTests';
import { synthesizeResearchEvidence } from './researchSynthesis';
import { generateResearchMemo } from './researchMemo';
import { buildEvidenceGraph, validateGraphAcyclicity } from './researchGraph';
import { generateExperimentFingerprint } from './researchFingerprint';

export interface OrchestratorOptions {
  seed?: number;
  timeoutMs?: number;
  onProgress?: (progress: ResearchProgressUpdate) => void;
  cachedEvidence?: Map<string, EvidenceRecord>;
}

export interface ResearchProgressUpdate {
  stage: string;
  sessionStatus: string;
  completedExperiments: number;
  totalExperiments: number;
  currentTool?: string;
  message: string;
}

export interface CompletedResearchResult {
  session: ResearchSession;
  plan: ExperimentPlan;
  hypotheses: ResearchHypothesis[];
  evidence: EvidenceRecord[];
  contradictions: ContradictionRecord[];
  secondaryTests: SecondaryTestRecord[];
  synthesis: ResearchSynthesis;
  memo: ResearchMemo;
  graph: EvidenceGraph;
  ghostInsights: Array<{ type: string; summary: string; evidenceIds: string[] }>;
}

/**
 * Validates data windows between evidence records to prevent mismatched window combinations.
 */
export function validateEvidenceDataWindows(evidence: EvidenceRecord[]): {
  valid: boolean;
  mismatches: string[];
} {
  if (evidence.length <= 1) return { valid: true, mismatches: [] };

  const base = evidence[0].dataWindow;
  const mismatches: string[] = [];

  for (let i = 1; i < evidence.length; i++) {
    const ev = evidence[i];
    if (
      ev.dataWindow.startDate !== base.startDate ||
      ev.dataWindow.endDate !== base.endDate ||
      ev.dataWindow.observationCount !== base.observationCount
    ) {
      mismatches.push(
        `WINDOW_MISMATCH: Evidence ${ev.evidenceId} (${ev.dataWindow.startDate} to ${ev.dataWindow.endDate}, ${ev.dataWindow.observationCount} bars) ` +
        `differs from base window ${base.startDate} to ${base.endDate} (${base.observationCount} bars).`
      );
    }
  }

  return {
    valid: mismatches.length === 0,
    mismatches,
  };
}

/**
 * Generates Ghost Mode 2.0 deterministic insights derived strictly from evidence records.
 */
export function generateResearchGhostInsights(
  evidence: EvidenceRecord[],
  contradictions: ContradictionRecord[]
): Array<{ type: string; summary: string; evidenceIds: string[] }> {
  const insights: Array<{ type: string; summary: string; evidenceIds: string[] }> = [];

  // 1. RESEARCH_CONTRADICTION
  if (contradictions.length > 0) {
    insights.push({
      type: 'RESEARCH_CONTRADICTION',
      summary: `Contradiction detected: ${contradictions[0].analysis}`,
      evidenceIds: [
        ...contradictions[0].supportingEvidenceIds,
        ...contradictions[0].disconfirmingEvidenceIds,
      ],
    });
  }

  // 2. ROBUSTNESS_BREAK
  const robEv = evidence.find(e => e.toolName === 'get_robustness_analysis');
  if (robEv) {
    const zeroFee = Number(robEv.result.performanceAtZeroFee ?? robEv.result.zeroCostReturn ?? 0);
    const baseFee = Number(robEv.result.baselineReturn ?? 0);
    if (zeroFee - baseFee > 20) {
      insights.push({
        type: 'ROBUSTNESS_BREAK',
        summary: `Friction sensitivity: Strategy alpha experiences severe friction drag exceeding 20 percentage points under cost expansion.`,
        evidenceIds: [robEv.evidenceId],
      });
    }
  }

  // 3. REGIME_DIVERGENCE
  const regEv = evidence.find(e => e.toolName === 'get_regime_performance');
  if (regEv && Array.isArray(regEv.result.regimeBreakdown)) {
    const bull = regEv.result.regimeBreakdown.find((r: any) => r.regime === 'BULL');
    const bear = regEv.result.regimeBreakdown.find((r: any) => r.regime === 'BEAR');
    if (bull && bear && bull.strategyReturn > 0 && bear.strategyReturn < -10) {
      insights.push({
        type: 'REGIME_DIVERGENCE',
        summary: `Regime divergence: Strategy exhibits strong bull capture (${bull.strategyReturn.toFixed(1)}%) but severe bear drawdown (${bear.strategyReturn.toFixed(1)}%).`,
        evidenceIds: [regEv.evidenceId],
      });
    }
  }

  // 4. EVIDENCE_CLUSTER
  if (evidence.length >= 4) {
    insights.push({
      type: 'EVIDENCE_CLUSTER',
      summary: `Evidence cluster: Multi-engine consensus assembled across ${evidence.length} validated analytical dimensions.`,
      evidenceIds: evidence.map(e => e.evidenceId),
    });
  }

  return insights;
}

/**
 * Runs a complete Institutional Research Session end-to-end.
 */
export async function runResearchSession(
  researchQuestion: string,
  options?: OrchestratorOptions
): Promise<CompletedResearchResult> {
  const startTime = Date.now();
  const seed = options?.seed ?? 42;
  const timeoutMs = options?.timeoutMs ?? 60000;
  const evidenceCache = options?.cachedEvidence ?? new Map<string, EvidenceRecord>();

  // 1. QUESTION -> DRAFT SESSION
  let session = createResearchSession(researchQuestion, { seed });
  options?.onProgress?.({
    stage: 'QUESTION',
    sessionStatus: session.status,
    completedExperiments: 0,
    totalExperiments: 0,
    message: `Initialized research session for inquiry: "${researchQuestion}"`,
  });

  try {
    // 2. PLANNING: Generate Hypotheses & Experiment DAG
    session = transitionSession(session, 'PLANNING');
    const hypotheses = generateHypotheses(researchQuestion);
    const plan = generateExperimentPlan(session.sessionId, researchQuestion, { seed });

    session = {
      ...session,
      hypothesisIds: hypotheses.map(h => h.hypothesisId),
      experimentIds: plan.experiments.map(e => e.experimentId),
    };

    options?.onProgress?.({
      stage: 'PLANNING',
      sessionStatus: session.status,
      completedExperiments: 0,
      totalExperiments: plan.experiments.length,
      message: `Formulated ${hypotheses.length} hypotheses and scheduled ${plan.experiments.length} bounded experiments.`,
    });

    // 3. RUNNING: Execute Planned Experiments
    session = transitionSession(session, 'RUNNING');
    const evidenceRecords: EvidenceRecord[] = [];
    let executedToolsCount = 0;
    let totalLatencyMs = 0;

    for (let i = 0; i < plan.experiments.length; i++) {
      const exp = plan.experiments[i];

      // Check timeout ceiling
      if (Date.now() - startTime > timeoutMs) {
        exp.status = 'SKIPPED';
        exp.error = 'EXECUTION_TIMEOUT_EXCEEDED';
        continue;
      }

      options?.onProgress?.({
        stage: 'RUNNING',
        sessionStatus: session.status,
        completedExperiments: i,
        totalExperiments: plan.experiments.length,
        currentTool: exp.toolName,
        message: `Executing ${exp.experimentId}: ${exp.toolName}...`,
      });

      // Idempotency check: Reuse cached evidence if identical experiment fingerprint exists
      const expFingerprint = exp.fingerprint || generateExperimentFingerprint(exp.toolName, exp.arguments, exp.dataWindow, exp.seed);
      if (evidenceCache.has(expFingerprint)) {
        const cached = evidenceCache.get(expFingerprint)!;
        evidenceRecords.push(cached);
        exp.status = 'SUCCESS';
        continue;
      }

      exp.status = 'RUNNING';
      try {
        const toolOutput = await executeRegisteredTool(exp.toolName, exp.arguments);
        exp.status = 'SUCCESS';
        exp.executionLatencyMs = toolOutput.latencyMs;
        totalLatencyMs += toolOutput.latencyMs;
        executedToolsCount++;

        const matchingHyp = hypotheses.find(h => h.testIds.includes(exp.experimentId));
        const { directEvidence, interpretation } = formatDirectEvidenceAndInterpretation(
          exp.toolName,
          toolOutput.result,
          exp.arguments
        );

        const evRecord = createEvidenceRecord({
          experimentId: exp.experimentId,
          hypothesisId: matchingHyp?.hypothesisId,
          toolName: exp.toolName,
          arguments: exp.arguments,
          result: toolOutput.result,
          dataWindow: session.provenance.dataWindow,
          directEvidence,
          interpretation,
          order: evidenceRecords.length + 1,
        });

        evidenceRecords.push(evRecord);
        evidenceCache.set(expFingerprint, evRecord);
      } catch (err: any) {
        exp.status = 'FAILED';
        exp.error = err.message || 'TOOL_EXECUTION_FAILURE';
        // Graceful trap: continue executing surviving experiments in DAG
      }
    }

    session = {
      ...session,
      evidenceIds: evidenceRecords.map(e => e.evidenceId),
    };

    // 4. ANALYZING: Check Data Window Synchronization
    session = transitionSession(session, 'ANALYZING', {
      durationDeltaMs: totalLatencyMs,
      toolsExecutedDelta: executedToolsCount,
    });

    const windowCheck = validateEvidenceDataWindows(evidenceRecords);
    if (!windowCheck.valid) {
      session.limitations.push(...windowCheck.mismatches);
    }

    // 5. CONTRADICTION_CHECK: Evaluate Contradictions
    session = transitionSession(session, 'CONTRADICTION_CHECK');
    const { contradictions, updatedHypotheses } = evaluateContradictions(
      hypotheses,
      evidenceRecords
    );

    session = {
      ...session,
      contradictionIds: contradictions.map(c => c.contradictionId),
    };

    // 6. SECONDARY_TEST: Run Bounded Secondary Tests if Required
    let secondaryRecords: SecondaryTestRecord[] = [];
    const remainingBudget = plan.totalBudget - executedToolsCount;

    if (
      contradictions.some(c => c.resolution === 'SECONDARY_TEST_REQUIRED') &&
      remainingBudget > 0
    ) {
      session = transitionSession(session, 'SECONDARY_TEST');
      const secOutput = await runSecondaryTests({
        contradictions,
        hypotheses: updatedHypotheses,
        dataWindow: session.provenance.dataWindow,
        currentEvidenceCount: evidenceRecords.length,
        remainingBudget,
        seed,
      });

      secondaryRecords = secOutput.secondaryRecords;
      for (const newEv of secOutput.newEvidence) {
        evidenceRecords.push(newEv);
        session.evidenceIds.push(newEv.evidenceId);
        executedToolsCount++;
      }

      // Re-enter ANALYZING -> CONTRADICTION_CHECK with refined evidence
      session = transitionSession(session, 'ANALYZING', { toolsExecutedDelta: secondaryRecords.length });
      session = transitionSession(session, 'CONTRADICTION_CHECK');
    }

    // 7. SYNTHESIZING: Formulate Claims & Neutral Synthesis
    session = transitionSession(session, 'SYNTHESIZING');
    options?.onProgress?.({
      stage: 'SYNTHESIZING',
      sessionStatus: session.status,
      completedExperiments: plan.experiments.length,
      totalExperiments: plan.experiments.length,
      message: 'Synthesizing evidence records and assembling auditable Research Memo...',
    });

    const synthesis = synthesizeResearchEvidence({
      question: researchQuestion,
      hypotheses: updatedHypotheses,
      evidenceRecords,
      contradictions,
      secondaryTests: secondaryRecords,
    });

    session = {
      ...session,
      synthesis,
      limitations: synthesis.limitations,
      nextTests: synthesis.nextResearchQuestions,
    };

    // 8. COMPLETE: Assemble Research Memo & Evidence Graph
    const memo = generateResearchMemo({
      session,
      plan,
      hypotheses: updatedHypotheses,
      evidence: evidenceRecords,
      synthesis,
    });

    const graph = buildEvidenceGraph({
      question: researchQuestion,
      hypotheses: updatedHypotheses,
      experiments: plan.experiments,
      evidence: evidenceRecords,
      contradictions,
      secondaryTests: secondaryRecords,
      synthesis,
    });

    validateGraphAcyclicity(graph);

    const ghostInsights = generateResearchGhostInsights(evidenceRecords, contradictions);

    session = transitionSession(session, 'COMPLETE');

    options?.onProgress?.({
      stage: 'COMPLETE',
      sessionStatus: session.status,
      completedExperiments: plan.experiments.length,
      totalExperiments: plan.experiments.length,
      message: 'Research session complete. Auditable memo and evidence graph verified.',
    });

    return {
      session,
      plan,
      hypotheses: updatedHypotheses,
      evidence: evidenceRecords,
      contradictions,
      secondaryTests: secondaryRecords,
      synthesis,
      memo,
      graph,
      ghostInsights,
    };
  } catch (err: any) {
    session = transitionSession(session, 'FAILED', { errorMessage: err.message });
    throw err;
  }
}
