import React from 'react';
import { ResearchHypothesis, HypothesisStatus, ConfidenceRating } from '../../../core/research/researchTypes';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, ShieldCheck } from 'lucide-react';

interface HypothesisBoardProps {
  hypotheses: ResearchHypothesis[];
}

function getStatusBadge(status: HypothesisStatus) {
  switch (status) {
    case 'SUPPORTED':
      return {
        label: 'SUPPORTED',
        icon: CheckCircle2,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'PARTIALLY_SUPPORTED':
      return {
        label: 'PARTIALLY SUPPORTED',
        icon: AlertTriangle,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'CONTRADICTED':
      return {
        label: 'CONTRADICTED',
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'INCONCLUSIVE',
        icon: HelpCircle,
        className: 'bg-gray-100 text-gray-700 border-gray-300',
      };
  }
}

function getConfidenceBadge(confidence: ConfidenceRating) {
  switch (confidence) {
    case 'HIGH_EVIDENCE':
      return 'bg-emerald-100/70 text-emerald-800 border-emerald-200';
    case 'MODERATE_EVIDENCE':
      return 'bg-blue-100/70 text-blue-800 border-blue-200';
    case 'LIMITED_EVIDENCE':
      return 'bg-amber-100/70 text-amber-800 border-amber-200';
    case 'INCONCLUSIVE':
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

export const HypothesisBoard: React.FC<HypothesisBoardProps> = ({ hypotheses }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          Falsifiable Hypotheses & Evaluated Confidence
        </h3>
        <span className="text-[11px] font-mono text-graphite-400">
          {hypotheses.length} Empirical Inquiries Formulated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hypotheses.map(hyp => {
          const status = getStatusBadge(hyp.status);
          const StatusIcon = status.icon;
          const confClass = getConfidenceBadge(hyp.confidence);

          return (
            <div
              key={hyp.hypothesisId}
              className="bg-white border border-border rounded-lg p-4 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-graphite bg-ivory-200 px-2 py-0.5 rounded">
                      {hyp.hypothesisId}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-graphite-400 uppercase">
                      {hyp.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${status.className}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <p className="text-xs text-graphite font-sans leading-relaxed">
                  {hyp.statement}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/80 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-graphite-400">Evidence Tier:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${confClass}`}>
                    {hyp.confidence.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-graphite-400">
                  <span>Bound Tests:</span>
                  <div className="flex gap-1">
                    {hyp.testIds.map(t => (
                      <span key={t} className="bg-ivory-200 px-1 py-0.5 rounded text-graphite">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {hyp.expectedEvidence.length > 0 && (
                  <div className="text-[10px] text-graphite-400">
                    <span className="font-semibold text-graphite-600">Expected: </span>
                    <span>{hyp.expectedEvidence[0]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
