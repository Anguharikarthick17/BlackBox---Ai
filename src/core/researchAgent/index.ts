/**
 * BLACKBOX X — Autonomous Quant Research Agent Orchestrator
 * 
 * Main entry point coordinating bounded quantitative research:
 * Intent -> Hypotheses -> Bounded Plan -> Tool Execution -> Evidence -> Contradictions -> Synthesis
 */

import { Asset } from '../data';
import { StrategyType } from '../strategies';
import { classifyResearchQuestion, generateHypotheses } from './hypothesisEngine';
import { createResearchPlan } from './researchPlanner';
import { executeExperimentStep } from './evidenceCollector';
import { evaluateContradictions } from './contradictionEngine';
import { synthesizeResearchConclusion, formatResearchTrailEntry } from './researchSynthesizer';
import { MAX_RESEARCH_TOOL_EXECUTIONS } from './researchPolicy';
import {
  ResearchRunState,
  ResearchConclusion,
  ResearchAgentStage,
  EvidenceItem,
  ContradictionEvaluation,
} from './researchTypes';

export * from './researchTypes';
export * from './researchPolicy';
export * from './hypothesisEngine';
export * from './researchPlanner';
export * from './toolSelector';
export * from './evidenceCollector';
export * from './contradictionEngine';
export * from './researchSynthesizer';

export interface AutonomousResearchOptions {
  asset?: Asset;
  strategy?: StrategyType;
  startDate?: string;
  endDate?: string;
  onProgress?: (state: ResearchRunState) => void;
}

/**
 * Runs a complete bounded quantitative research investigation.
 */
export async function runAutonomousResearch(
  query: string,
  options: AutonomousResearchOptions = {}
): Promise<{
  conclusion: ResearchConclusion;
  state: ResearchRunState;
  trailEntry: ReturnType<typeof formatResearchTrailEntry>;
}> {
  const notify = (stateUpdate: Partial<ResearchRunState>) => {
    runState = { ...runState, ...stateUpdate };
    if (options.onProgress) {
      options.onProgress(runState);
    }
  };

  let runState: ResearchRunState = {
    stage: 'PLANNING',
    currentStepIndex: 0,
    totalPlannedSteps: 0,
    hypotheses: [],
    evidenceList: [],
    evaluations: [],
  };

  // STAGE 1: Intent & Question Classification
  notify({ stage: 'PLANNING' });
  const question = classifyResearchQuestion(query, {
    asset: options.asset,
    strategy: options.strategy,
  });
  if (options.startDate) question.startDate = options.startDate;
  if (options.endDate) question.endDate = options.endDate;

  // STAGE 2: Hypothesis Formulation
  notify({ stage: 'HYPOTHESIS', question });
  const hypotheses = generateHypotheses(question);
  notify({ hypotheses });

  // STAGE 3: Experiment Planning
  const plan = createResearchPlan(question, hypotheses);
  notify({ plan, totalPlannedSteps: plan.steps.length });

  // STAGE 4: Deterministic Tool Execution & Evidence Collection
  notify({ stage: 'TESTING' });
  const evidenceList: EvidenceItem[] = [];

  for (let i = 0; i < plan.steps.length && i < MAX_RESEARCH_TOOL_EXECUTIONS; i++) {
    const step = plan.steps[i];
    notify({
      stage: 'TESTING',
      currentStepIndex: i + 1,
      activeToolName: step.toolName,
    });

    const evidence = await executeExperimentStep(step, i + 1);
    evidenceList.push(evidence);
    notify({
      stage: 'EVIDENCE',
      evidenceList: [...evidenceList],
    });
  }

  // STAGE 5: Contradiction Check (MANDATORY)
  notify({ stage: 'CONTRADICTION CHECK' });
  const evaluations: ContradictionEvaluation[] = evaluateContradictions(hypotheses, evidenceList);
  notify({ evaluations });

  // STAGE 6: Synthesis & Conclusion
  notify({ stage: 'SYNTHESIS' });
  const conclusion = synthesizeResearchConclusion(question, hypotheses, evidenceList, evaluations);
  const trailEntry = formatResearchTrailEntry(conclusion);

  // STAGE 7: Complete
  notify({
    stage: 'COMPLETE',
    conclusion,
  });

  return {
    conclusion,
    state: runState,
    trailEntry,
  };
}
