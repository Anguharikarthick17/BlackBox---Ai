import React from 'react';
import { ExperimentNode, EvidenceRecord } from '../../../core/research/researchTypes';
import { PlayCircle, CheckCircle2, XCircle, Clock, Search, ChevronRight, CornerDownRight } from 'lucide-react';

interface ExperimentTimelineProps {
  experiments: ExperimentNode[];
  evidenceRecords: EvidenceRecord[];
  onInspectExperiment: (experiment: ExperimentNode, evidence?: EvidenceRecord) => void;
}

export const ExperimentTimeline: React.FC<ExperimentTimelineProps> = ({
  experiments,
  evidenceRecords,
  onInspectExperiment,
}) => {
  const evidenceMap = new Map(evidenceRecords.map(e => [e.experimentId, e]));

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Bounded Experiment Execution Timeline
          </h3>
          <p className="text-[11px] text-graphite-400 mt-0.5">
            Deterministic DAG node dispatches across registered quantitative engines.
          </p>
        </div>
        <span className="text-[11px] font-mono text-graphite-400">
          Budget: {experiments.length} / 8 ceiling
        </span>
      </div>

      <div className="space-y-3">
        {experiments.map((exp, idx) => {
          const ev = evidenceMap.get(exp.experimentId);

          return (
            <div
              key={exp.experimentId}
              className="p-3.5 bg-ivory-100/60 hover:bg-ivory-100 border border-border rounded-lg transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  {exp.status === 'SUCCESS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : exp.status === 'FAILED' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : exp.status === 'RUNNING' ? (
                    <PlayCircle className="w-4 h-4 text-accent animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-graphite-400" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-graphite">
                      {exp.experimentId}
                    </span>
                    <span className="font-mono text-xs font-semibold text-accent">
                      {exp.toolName}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                        exp.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : exp.status === 'FAILED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-ivory-200 text-graphite-600 border border-border'
                      }`}
                    >
                      {exp.status}
                    </span>
                    {exp.executionLatencyMs !== undefined && (
                      <span className="font-mono text-[10px] text-graphite-400">
                        {exp.executionLatencyMs}ms
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-graphite font-sans leading-relaxed">
                    {exp.purpose}
                  </p>

                  {exp.dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-graphite-400 mt-1">
                      <CornerDownRight className="w-3 h-3 text-graphite-400" />
                      <span>Depends on: {exp.dependencies.join(', ')}</span>
                    </div>
                  )}

                  {ev && (
                    <div className="mt-2 p-2 bg-white border border-border/80 rounded text-[11px] font-mono text-graphite">
                      <span className="text-accent font-semibold">[{ev.evidenceId}]</span> {ev.directEvidence}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                <button
                  onClick={() => onInspectExperiment(exp, ev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-ivory-200 border border-border rounded-md text-xs font-medium text-graphite transition-colors shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5 text-accent" />
                  Inspect
                  <ChevronRight className="w-3 h-3 text-graphite-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
