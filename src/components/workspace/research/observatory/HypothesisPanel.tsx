import React from 'react';
import { ResearchHypothesis, HypothesisStatus } from '../../../../core/research/researchTypes';
import { Lightbulb, CheckCircle2, XCircle, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

interface HypothesisPanelProps {
  hypotheses: readonly ResearchHypothesis[] | ResearchHypothesis[];
  question?: string;
  onSelectHypothesis?: (hyp: ResearchHypothesis) => void;
  selectedHypothesisId?: string;
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({
  hypotheses,
  question,
  onSelectHypothesis,
  selectedHypothesisId,
}) => {
  if (!hypotheses || hypotheses.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No hypotheses formulated for this inquiry yet.</p>
      </div>
    );
  }

  const primaryHyp = hypotheses[0];
  const alternatives = hypotheses.slice(1);

  const getStatusBadge = (status: HypothesisStatus) => {
    switch (status) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUPPORTED
          </span>
        );
      case 'PARTIALLY_SUPPORTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3 h-3 text-blue-600" /> PARTIALLY SUPPORTED
          </span>
        );
      case 'CONTRADICTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> CONTRADICTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600" /> INCONCLUSIVE
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="section-label block">SECTION 02 — HYPOTHESIS FORMULATION</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Falsifiable Working Hypotheses
          </h2>
        </div>
        <span className="text-xs font-mono text-graphite-400 bg-ivory-100 px-2.5 py-1 rounded border border-border-light">
          {hypotheses.length} Active Hypotheses
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Hypothesis Card */}
        <div className="lg:col-span-7 bg-ivory-50 border border-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> PRIMARY HYPOTHESIS ({primaryHyp.hypothesisId})
              </span>
              {getStatusBadge(primaryHyp.status)}
            </div>

            <p className="text-base md:text-lg font-normal text-graphite leading-relaxed mb-4">
              "{primaryHyp.statement}"
            </p>

            <div className="space-y-3 pt-3 border-t border-border-light text-xs">
              <div>
                <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block mb-0.5">
                  FALSIFICATION CONDITION
                </span>
                <p className="text-graphite-600 bg-white p-2.5 rounded border border-border-light font-mono leading-relaxed">
                  If the strategy maintains similar performance gaps after transaction cost removal (0 bps) and across parameter perturbations, the cost/parameter hypothesis loses empirical support.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block mb-0.5">
                  EXPECTED EVIDENCE TARGET
                </span>
                <p className="text-graphite-500 italic">
                  Statistically significant return delta conditioned on high-volatility periods or turnover drag.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-light flex items-center justify-between text-[11px] font-mono text-graphite-400">
            <span>CATEGORY: {primaryHyp.category}</span>
            <span>CONFIDENCE: {primaryHyp.confidence}</span>
          </div>
        </div>

        {/* Alternative Hypotheses */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-400 block">
            ALTERNATIVE HYPOTHESES & COUNTER-CLAIMS
          </span>

          {alternatives.map(alt => (
            <div
              key={alt.hypothesisId}
              onClick={() => onSelectHypothesis?.(alt)}
              className={`p-4 rounded-lg border transition-all text-xs cursor-pointer ${
                selectedHypothesisId === alt.hypothesisId
                  ? 'border-accent bg-blue-50/40 shadow-sm'
                  : 'border-border bg-white hover:border-graphite-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-graphite-500 font-medium">
                  {alt.hypothesisId} • {alt.category}
                </span>
                {getStatusBadge(alt.status)}
              </div>
              <p className="text-graphite-700 leading-relaxed">
                "{alt.statement}"
              </p>
            </div>
          ))}

          {/* Cautious Epistemic Disclaimer */}
          <div className="mt-auto p-3 bg-ivory-100 rounded border border-border-light text-[11px] text-graphite-400 font-mono leading-relaxed">
            <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-graphite-400" />
            Hypotheses represent falsifiable analytical conjectures, not established truths. Evidence can support or contradict, but cannot prove universal causality.
          </div>
        </div>
      </div>
    </div>
  );
};
