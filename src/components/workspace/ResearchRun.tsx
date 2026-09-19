import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Compass,
  FileQuestion,
  FlaskConical,
  Database,
  ShieldCheck,
  CheckCircle,
  Loader2,
  Clock,
  Layers,
  Cpu,
  AlertCircle
} from 'lucide-react';
import {
  ResearchRunState,
  ResearchAgentStage,
  ResearchHypothesis,
} from '../../core/researchAgent/researchTypes';
import { MAX_RESEARCH_TOOL_EXECUTIONS } from '../../core/researchAgent/researchPolicy';

interface ResearchRunProps {
  runState: ResearchRunState;
}

const STAGES: { stage: ResearchAgentStage; label: string; icon: any }[] = [
  { stage: 'PLANNING', label: 'Planning', icon: Compass },
  { stage: 'HYPOTHESIS', label: 'Hypotheses', icon: FileQuestion },
  { stage: 'TESTING', label: 'Testing Tools', icon: FlaskConical },
  { stage: 'EVIDENCE', label: 'Evidence', icon: Database },
  { stage: 'CONTRADICTION CHECK', label: 'Contradiction Check', icon: ShieldCheck },
  { stage: 'SYNTHESIS', label: 'Synthesis', icon: Layers },
  { stage: 'COMPLETE', label: 'Complete', icon: CheckCircle },
];

function getStageIndex(stage: ResearchAgentStage): number {
  return STAGES.findIndex((s) => s.stage === stage);
}

export const ResearchRun: React.FC<ResearchRunProps> = ({ runState }) => {
  const shouldReduceMotion = useReducedMotion();
  const currentStageIndex = getStageIndex(runState.stage);

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs space-y-6">
      {/* 1. Header & Execution Budget Meter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
        <div>
          <span className="text-[10px] font-mono text-[#B40023] uppercase font-bold tracking-wider">
            Autonomous Investigation State
          </span>
          <h3 className="text-sm font-bold font-sans text-[#1A1917] mt-0.5">
            {runState.question?.query || 'Analyzing Quantitative Question...'}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Tool Execution Budget */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#E5E0D8] text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-[#B40023]" />
            <span className="text-[#6E6B65]">Execution Budget:</span>
            <span className="font-bold text-[#1A1917]">
              {runState.evidenceList.length} / {runState.totalPlannedSteps || MAX_RESEARCH_TOOL_EXECUTIONS}
            </span>
            <span className="text-[10px] text-[#6E6B65]">
              (Max: {MAX_RESEARCH_TOOL_EXECUTIONS})
            </span>
          </div>

          {/* Stage Badge */}
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full border bg-rose-50 text-[#B40023] border-rose-200">
            {runState.stage}
          </span>
        </div>
      </div>

      {/* 2. Deterministic Stage Stepper */}
      <div className="overflow-x-auto no-scrollbar py-2">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isPassed = currentStageIndex > idx || runState.stage === 'COMPLETE';
            const isCurrent = currentStageIndex === idx && runState.stage !== 'COMPLETE';

            return (
              <React.Fragment key={s.stage}>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[#B40023] text-white ring-4 ring-rose-100 animate-pulse'
                        : 'bg-[#FAF8F4] border border-[#E5E0D8] text-[#8C887E]'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-mono font-medium whitespace-nowrap ${
                      isPassed
                        ? 'text-emerald-800'
                        : isCurrent
                        ? 'text-[#B40023] font-bold'
                        : 'text-[#8C887E]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {idx < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 min-w-[24px] mb-4 transition-colors ${
                      currentStageIndex > idx ? 'bg-emerald-500' : 'bg-[#E5E0D8]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Active Tool Execution Callout */}
      {runState.activeToolName && runState.stage === 'TESTING' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
          className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-[#B40023] animate-spin" />
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#B40023]">
                Executing Quantitative Engine
              </span>
              <p className="text-xs font-mono font-semibold text-[#1A1917]">
                {runState.activeToolName} (Step {runState.currentStepIndex} of {runState.totalPlannedSteps})
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#6E6B65]">
            Deterministic Tool Execution
          </span>
        </motion.div>
      )}

      {/* 4. Hypotheses Under Evaluation */}
      {runState.hypotheses.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6E6B65] mb-3">
            Formulated Research Hypotheses ({runState.hypotheses.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {runState.hypotheses.map((h) => {
              const statusColor =
                h.status === 'SUPPORTED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : h.status === 'CONTRADICTED'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : h.status === 'TESTING'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-[#FAF8F4] text-[#6E6B65] border-[#E5E0D8]';

              return (
                <div
                  key={h.id}
                  className="p-3.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F4] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#1A1917] px-2 py-0.5 rounded bg-white border border-[#E5E0D8]">
                        {h.id}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {h.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#1A1917] leading-snug mb-2">
                      {h.statement}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-[#6E6B65] pt-2 border-t border-[#E5E0D8]">
                    Tool: <span className="text-[#B40023] font-semibold">{h.primaryTool}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
