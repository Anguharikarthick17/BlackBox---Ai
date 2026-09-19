import React from 'react';
import { ContradictionRecord } from '../../../core/research/researchTypes';
import { AlertTriangle, CheckCircle2, RefreshCw, GitPullRequest } from 'lucide-react';

interface ContradictionPanelProps {
  contradictions: ContradictionRecord[];
}

export const ContradictionPanel: React.FC<ContradictionPanelProps> = ({ contradictions }) => {
  if (!contradictions || contradictions.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite">
              Contradiction & Counterfactual Engine
            </h3>
            <p className="text-[11px] text-graphite-400 mt-0.5">
              Zero empirical contradictions detected. Collected evidence records demonstrate internal consistency.
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          CONVERGENT EVIDENCE
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Contradiction Engine & Counterfactual Audit
          </h3>
          <p className="text-[11px] text-graphite-400 mt-0.5">
            Active adversarial challenges and disconfirming empirical signals identified across tools.
          </p>
        </div>
        <span className="text-[11px] font-mono text-amber-700 font-semibold">
          {contradictions.length} Tension Points Found
        </span>
      </div>

      <div className="space-y-3">
        {contradictions.map(c => (
          <div
            key={c.contradictionId}
            className="p-4 bg-amber-50/40 border border-amber-200 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                  {c.contradictionId}
                </span>
                <span className="text-xs font-semibold text-graphite">
                  Challenging Hypothesis: {c.hypothesisId}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-amber-100 text-amber-800 border border-amber-300">
                {c.resolution.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-xs text-graphite font-sans leading-relaxed">
              {c.analysis}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60 text-[11px] font-mono">
              <div className="p-2 bg-white/80 rounded border border-amber-200">
                <div className="flex items-center gap-1 text-emerald-700 font-medium mb-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Confirmatory Evidence</span>
                </div>
                <div className="text-graphite">
                  {c.supportingEvidenceIds.map(id => `[${id}]`).join(', ')}
                </div>
              </div>

              <div className="p-2 bg-white/80 rounded border border-amber-200">
                <div className="flex items-center gap-1 text-red-700 font-medium mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Disconfirming Counterfactuals</span>
                </div>
                <div className="text-graphite">
                  {c.disconfirmingEvidenceIds.map(id => `[${id}]`).join(', ')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
