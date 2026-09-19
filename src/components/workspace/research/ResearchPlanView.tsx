import React from 'react';
import { ExperimentPlan } from '../../../core/research/researchTypes';
import { Layers, Clock, Zap, CornerDownRight, CheckSquare } from 'lucide-react';

interface ResearchPlanViewProps {
  plan: ExperimentPlan | null;
}

export const ResearchPlanView: React.FC<ResearchPlanViewProps> = ({ plan }) => {
  if (!plan) return null;

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent" />
            Bounded Experiment Plan (DAG)
          </h3>
          <p className="text-[11px] text-graphite-400 mt-0.5">
            Strict execution schedule strictly bounded to a maximum of 8 tool invocations.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1 text-graphite-400">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Budget: <strong className="text-graphite">{plan.experiments.length} / {plan.totalBudget}</strong>
          </span>
          <span className="flex items-center gap-1 text-graphite-400">
            <Clock className="w-3.5 h-3.5" />
            Est. ~{plan.estimatedDurationMs}ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {plan.experiments.map((exp, idx) => (
          <div
            key={exp.experimentId}
            className="p-3.5 bg-ivory-100/60 border border-border rounded-lg space-y-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-graphite">
                {exp.experimentId}
              </span>
              <span className="font-mono text-[10px] text-accent font-semibold px-2 py-0.5 bg-accent/10 rounded">
                {exp.toolName}
              </span>
            </div>

            <p className="text-graphite font-sans leading-relaxed">
              {exp.purpose}
            </p>

            <div className="pt-2 border-t border-border/80 flex items-center justify-between text-[10px] font-mono text-graphite-400">
              <div className="flex items-center gap-1">
                <CornerDownRight className="w-3 h-3" />
                <span>Deps: {exp.dependencies.length > 0 ? exp.dependencies.join(', ') : 'Root'}</span>
              </div>
              <span>Max runs: {exp.maximumExecutions}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
