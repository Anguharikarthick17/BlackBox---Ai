import React from 'react';
import { ContradictionRecord, SecondaryTestRecord } from '../../../../core/research/researchTypes';
import { AlertTriangle, ShieldCheck, CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface ContradictionCenterProps {
  contradictions: readonly ContradictionRecord[] | ContradictionRecord[];
  secondaryTests?: readonly SecondaryTestRecord[] | SecondaryTestRecord[];
  onOpenContradictionPanel?: () => void;
}

export const ContradictionCenter: React.FC<ContradictionCenterProps> = ({
  contradictions,
  secondaryTests = [],
  onOpenContradictionPanel,
}) => {
  if (!contradictions || contradictions.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
        <span className="section-label block">SECTION 08 — ADVERSARIAL CONTRADICTION CHECK</span>
        <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5 mb-2">
          Challenge Working Hypotheses
        </h2>
        <div className="p-4 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-800 font-mono">
          ✓ No counterfactual contradictions identified across active experiment DAG. All observed evidence aligns with working hypotheses within statistical tolerances.
        </div>
      </div>
    );
  }

  const getResolutionBadge = (res: ContradictionRecord['resolution']) => {
    switch (res) {
      case 'CONTRADICTED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
            CONTRADICTED
          </span>
        );
      case 'HYPOTHESIS_REFINED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
            PARTIALLY SUPPORTED
          </span>
        );
      case 'SECONDARY_TEST_REQUIRED':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
            SECONDARY TEST APPLIED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-50 text-gray-700 border border-gray-200">
            INCONCLUSIVE
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 08 — CONTRADICTION CENTER</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Challenge the Hypotheses & Counterfactual Audits
          </h2>
          <p className="text-xs text-graphite-400 mt-1 font-mono">
            Systematic search for disconfirming data. Neutral reporting without evaluative bias or ranking.
          </p>
        </div>

        {onOpenContradictionPanel && (
          <button
            onClick={onOpenContradictionPanel}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border text-accent hover:text-accent-dark"
          >
            <span>Full Contradiction Audit</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {contradictions.map(contra => {
          const boundSecTest = secondaryTests.find(st => st.contradictionId === contra.contradictionId);

          return (
            <div key={contra.contradictionId} className="p-5 bg-ivory-50 rounded-lg border border-border">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-mono text-xs font-semibold text-graphite">
                    CONTRADICTION {contra.contradictionId} • Testing {contra.hypothesisId}
                  </span>
                </div>
                {getResolutionBadge(contra.resolution)}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 text-xs">
                {/* Supporting Findings */}
                <div className="p-3 bg-white rounded border border-border-light">
                  <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block mb-1">
                    PRIMARY SUPPORTING EVIDENCE
                  </span>
                  <p className="text-graphite-700 font-mono text-[11px] leading-relaxed">
                    Bound Evidence: {contra.supportingEvidenceIds.join(', ') || 'Baseline backtest'}
                  </p>
                </div>

                {/* Challenging Findings */}
                <div className="p-3 bg-white rounded border border-border-light">
                  <span className="text-[10px] font-mono text-rose-600 uppercase tracking-wider block mb-1">
                    COUNTERFACTUAL CHALLENGE
                  </span>
                  <p className="text-graphite-700 font-mono text-[11px] leading-relaxed">
                    Disconfirming Evidence: {contra.disconfirmingEvidenceIds.join(', ') || 'Parameter sweep / zero-fee test'}
                  </p>
                </div>
              </div>

              {/* Analysis & Secondary Resolution */}
              <div className="p-3 bg-white rounded border border-border-light text-xs font-sans text-graphite-600 leading-relaxed">
                <span className="font-mono font-semibold text-graphite block text-[11px] mb-1">
                  METHODOLOGICAL RESOLUTION:
                </span>
                {contra.analysis}
              </div>

              {boundSecTest && (
                <div className="mt-3 pt-2.5 border-t border-border-light flex items-center justify-between text-[11px] font-mono text-graphite-400">
                  <span>SECONDARY TEST: {boundSecTest.testId} ({boundSecTest.parameterName})</span>
                  <span className="text-emerald-700 font-semibold">{boundSecTest.resultSummary}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
