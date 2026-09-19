import React from 'react';
import { CompletedResearchResult } from '../../../core/research/researchOrchestrator';
import { X, Columns2, CheckCircle2, Shield } from 'lucide-react';

interface ResearchComparisonModalProps {
  sessionA: CompletedResearchResult;
  sessionB: CompletedResearchResult;
  onClose: () => void;
}

export const ResearchComparisonModal: React.FC<ResearchComparisonModalProps> = ({
  sessionA,
  sessionB,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-border rounded-xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-ivory-100/60">
          <div className="flex items-center gap-2.5">
            <Columns2 className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-semibold text-graphite">
                Comparative Session Analysis (Neutral Multi-Engine Audit)
              </h2>
              <p className="text-[11px] text-graphite-400">
                Side-by-side objective evaluation without evaluative rankings or bias.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-graphite-400 hover:text-graphite hover:bg-ivory-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-ivory-100 rounded-lg border border-border space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-accent">Session A Reference</span>
              <div className="font-semibold text-graphite text-xs">{sessionA.session.researchQuestion}</div>
              <div className="text-[10px] font-mono text-graphite-400 truncate">ID: {sessionA.session.sessionId}</div>
            </div>

            <div className="p-3.5 bg-ivory-100 rounded-lg border border-border space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-accent">Session B Reference</span>
              <div className="font-semibold text-graphite text-xs">{sessionB.session.researchQuestion}</div>
              <div className="text-[10px] font-mono text-graphite-400 truncate">ID: {sessionB.session.sessionId}</div>
            </div>
          </div>

          {/* Core Metrics Comparison Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite mb-2.5">
              Structural Metric Comparison
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory-200/60 border-b border-border text-[11px] font-semibold text-graphite">
                    <th className="p-2.5">Dimension</th>
                    <th className="p-2.5 border-l border-border">Session A</th>
                    <th className="p-2.5 border-l border-border">Session B</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-[11px] font-mono">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-graphite">Total Experiments Executed</td>
                    <td className="p-2.5 border-l border-border text-graphite">{sessionA.evidence.length} tool runs</td>
                    <td className="p-2.5 border-l border-border text-graphite">{sessionB.evidence.length} tool runs</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-graphite">Hypotheses Supported</td>
                    <td className="p-2.5 border-l border-border text-emerald-700 font-semibold">
                      {sessionA.hypotheses.filter(h => h.status === 'SUPPORTED').length} / {sessionA.hypotheses.length}
                    </td>
                    <td className="p-2.5 border-l border-border text-emerald-700 font-semibold">
                      {sessionB.hypotheses.filter(h => h.status === 'SUPPORTED').length} / {sessionB.hypotheses.length}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-graphite">Contradictions Identified</td>
                    <td className="p-2.5 border-l border-border text-amber-700">
                      {sessionA.contradictions.length} detected
                    </td>
                    <td className="p-2.5 border-l border-border text-amber-700">
                      {sessionB.contradictions.length} detected
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-graphite">Secondary Tests Dispatched</td>
                    <td className="p-2.5 border-l border-border text-graphite">
                      {sessionA.secondaryTests.length} parameter sweeps
                    </td>
                    <td className="p-2.5 border-l border-border text-graphite">
                      {sessionB.secondaryTests.length} parameter sweeps
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-graphite">Observation Window</td>
                    <td className="p-2.5 border-l border-border text-graphite">
                      {sessionA.session.provenance.dataWindow.startDate} to {sessionA.session.provenance.dataWindow.endDate}
                    </td>
                    <td className="p-2.5 border-l border-border text-graphite">
                      {sessionB.session.provenance.dataWindow.startDate} to {sessionB.session.provenance.dataWindow.endDate}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-graphite">Execution Duration</td>
                    <td className="p-2.5 border-l border-border text-graphite">
                      {sessionA.session.provenance.totalExecutionDurationMs}ms
                    </td>
                    <td className="p-2.5 border-l border-border text-graphite">
                      {sessionB.session.provenance.totalExecutionDurationMs}ms
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Executive Observations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 bg-white border border-border rounded-lg space-y-2">
              <span className="text-[11px] font-semibold text-graphite uppercase tracking-wider block">
                Session A Synthesis Summary
              </span>
              <p className="text-graphite font-sans text-xs leading-relaxed">
                {sessionA.synthesis.executiveObservation}
              </p>
            </div>

            <div className="p-3.5 bg-white border border-border rounded-lg space-y-2">
              <span className="text-[11px] font-semibold text-graphite uppercase tracking-wider block">
                Session B Synthesis Summary
              </span>
              <p className="text-graphite font-sans text-xs leading-relaxed">
                {sessionB.synthesis.executiveObservation}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-ivory-100/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-graphite-400">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>Strictly neutral quantitative audit. No subjective ranking applied.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-graphite text-white hover:bg-graphite-600 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
