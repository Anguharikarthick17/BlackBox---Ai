import React from 'react';
import { ExperimentNode, EvidenceRecord } from '../../../../core/research/researchTypes';
import { Play, CheckCircle2, Clock, XCircle, ChevronRight, Terminal } from 'lucide-react';

interface InvestigationPlanProps {
  experiments: readonly ExperimentNode[] | ExperimentNode[];
  evidenceRecords?: readonly EvidenceRecord[] | EvidenceRecord[];
  onSelectExperiment?: (exp: ExperimentNode, ev?: EvidenceRecord) => void;
  selectedExperimentId?: string;
}

export const InvestigationPlan: React.FC<InvestigationPlanProps> = ({
  experiments,
  evidenceRecords = [],
  onSelectExperiment,
  selectedExperimentId,
}) => {
  if (!experiments || experiments.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No scheduled experiments in DAG plan.</p>
      </div>
    );
  }

  const getStatusIcon = (status: ExperimentNode['status']) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'RUNNING':
        return <Play className="w-3.5 h-3.5 text-accent animate-pulse" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'SKIPPED':
        return <Clock className="w-3.5 h-3.5 text-graphite-300" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="section-label block">SECTION 03 — INVESTIGATION PLAN</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Bounded Analytical Experiment Plan (DAG)
          </h2>
        </div>
        <div className="text-xs font-mono text-graphite-400 flex items-center gap-2">
          <span className="bg-ivory-100 px-2.5 py-1 rounded border border-border-light">
            {experiments.length} Experiments (Cap: 8)
          </span>
          <span className="bg-ivory-100 px-2.5 py-1 rounded border border-border-light">
            Zero Look-Ahead Guarantee
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-ivory-50 text-[11px] font-mono text-graphite-400 uppercase">
              <th className="py-2.5 px-3">EXP ID</th>
              <th className="py-2.5 px-3">TOOL</th>
              <th className="py-2.5 px-3">PURPOSE / HYPOTHESIS TEST</th>
              <th className="py-2.5 px-3">INPUT PARAMETERS</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">EVIDENCE ID</th>
              <th className="py-2.5 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light font-mono">
            {experiments.map(exp => {
              const boundEvidence = evidenceRecords.find(e => e.experimentId === exp.experimentId);
              const isSelected = selectedExperimentId === exp.experimentId;

              return (
                <tr
                  key={exp.experimentId}
                  onClick={() => onSelectExperiment?.(exp, boundEvidence)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-ivory-50'
                  }`}
                >
                  <td className="py-3 px-3 font-semibold text-graphite whitespace-nowrap">
                    {exp.experimentId}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="bg-ivory-200 text-graphite-600 px-2 py-0.5 rounded border border-border text-[11px]">
                      {exp.toolName}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans text-graphite-600 max-w-xs truncate" title={exp.purpose}>
                    {exp.purpose}
                  </td>
                  <td className="py-3 px-3 text-graphite-400 text-[11px] max-w-xs truncate" title={JSON.stringify(exp.arguments)}>
                    {Object.entries(exp.arguments || {})
                      .filter(([k]) => k !== 'startDate' && k !== 'endDate')
                      .map(([k, v]) => `${k}:${v}`)
                      .join(', ') || 'Default asset universe'}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-graphite">
                      {getStatusIcon(exp.status)} {exp.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {boundEvidence ? (
                      <span className="text-accent font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[11px]">
                        {boundEvidence.evidenceId}
                      </span>
                    ) : (
                      <span className="text-graphite-300 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <ChevronRight className="w-3.5 h-3.5 text-graphite-300 group-hover:text-graphite transition-colors inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
