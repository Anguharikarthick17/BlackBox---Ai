import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  TrendingUp,
  ArrowRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { EvidenceItem, ContradictionEvaluation, ResearchConclusion, ConfidenceLevel } from '../../core/researchAgent/researchTypes';

interface ResearchEvidenceProps {
  conclusion?: ResearchConclusion;
  evidenceList: EvidenceItem[];
  evaluations: ContradictionEvaluation[];
}

function getConfidenceBadge(level: ConfidenceLevel) {
  switch (level) {
    case 'HIGH_EVIDENCE':
      return {
        label: 'HIGH EVIDENCE',
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
        dot: 'bg-emerald-500',
      };
    case 'MODERATE_EVIDENCE':
      return {
        label: 'MODERATE EVIDENCE',
        bg: 'bg-blue-50 border-blue-300 text-blue-800',
        dot: 'bg-blue-500',
      };
    case 'LIMITED_EVIDENCE':
      return {
        label: 'LIMITED EVIDENCE',
        bg: 'bg-amber-50 border-amber-300 text-amber-800',
        dot: 'bg-amber-500',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'INCONCLUSIVE',
        bg: 'bg-zinc-100 border-zinc-300 text-zinc-700',
        dot: 'bg-zinc-400',
      };
  }
}

function getStatusBadge(status: ContradictionEvaluation['status']) {
  switch (status) {
    case 'SUPPORTED':
      return {
        icon: CheckCircle2,
        label: 'SUPPORTED',
        className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    case 'CONTRADICTED':
      return {
        icon: XCircle,
        label: 'CONTRADICTED',
        className: 'text-rose-700 bg-rose-50 border-rose-200',
      };
    case 'PARTIALLY_SUPPORTED':
      return {
        icon: AlertTriangle,
        label: 'PARTIALLY SUPPORTED',
        className: 'text-amber-700 bg-amber-50 border-amber-200',
      };
    case 'INCONCLUSIVE':
    default:
      return {
        icon: HelpCircle,
        label: 'INCONCLUSIVE',
        className: 'text-zinc-700 bg-zinc-100 border-zinc-200',
      };
  }
}

export const ResearchEvidence: React.FC<ResearchEvidenceProps> = ({
  conclusion,
  evidenceList,
  evaluations,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Contradiction Evaluation Panel */}
      {evaluations.length > 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E5E0D8] pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B40023]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1A1917]">
                Hypothesis Contradiction Check
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#6E6B65]">
              Empirical Falsification Protocol
            </span>
          </div>

          <div className="space-y-3">
            {evaluations.map((ev) => {
              const badge = getStatusBadge(ev.status);
              const StatusIcon = badge.icon;
              const isContradicted = ev.status === 'CONTRADICTED';

              return (
                <div
                  key={ev.hypothesisId}
                  className={`p-4 rounded-lg border ${
                    isContradicted
                      ? 'border-rose-200 bg-rose-50/40'
                      : ev.status === 'SUPPORTED'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-[#E5E0D8] bg-[#FAF8F4]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#1A1917]">
                        {ev.hypothesisId}
                      </span>
                      <p className="text-xs font-semibold text-[#1A1917]">
                        {ev.hypothesisStatement}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>

                  {ev.directEvidence && ev.interpretation ? (
                    <div className="space-y-2 mb-3">
                      <div className="p-2.5 rounded bg-white/70 border border-[#E5E0D8] text-xs">
                        <span className="font-mono text-[10px] font-bold text-[#B40023] uppercase tracking-wider block mb-0.5">
                          Direct Quantitative Evidence:
                        </span>
                        <span className="text-[#1A1917] font-medium">{ev.directEvidence}</span>
                      </div>
                      <div className="p-2.5 rounded bg-white/70 border border-[#E5E0D8] text-xs">
                        <span className="font-mono text-[10px] font-bold text-[#6E6B65] uppercase tracking-wider block mb-0.5">
                          Research Interpretation:
                        </span>
                        <span className="text-[#4A4742]">{ev.interpretation}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#4A4742] leading-relaxed mb-3">
                      {ev.explanation}
                    </p>
                  )}

                  {/* Supporting/Contradicting Evidence Links */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                    {ev.supportingEvidenceIds.length > 0 && (
                      <div className="flex items-center gap-1 text-emerald-800">
                        <span className="font-semibold">Supporting:</span>
                        {ev.supportingEvidenceIds.map((id) => (
                          <span key={id} className="px-1.5 py-0.5 rounded bg-white border border-emerald-200">
                            {id}
                          </span>
                        ))}
                      </div>
                    )}
                    {ev.contradictingEvidenceIds.length > 0 && (
                      <div className="flex items-center gap-1 text-rose-800">
                        <span className="font-semibold">Contradicting:</span>
                        {ev.contradictingEvidenceIds.map((id) => (
                          <span key={id} className="px-1.5 py-0.5 rounded bg-white border border-rose-200">
                            {id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Structured Evidence Graph */}
      {evidenceList.length > 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E5E0D8] pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#B40023]" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#1A1917]">
                Evidence Records ({evidenceList.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#6E6B65]">
              Deterministic Engine Trace
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidenceList.map((ev) => (
              <div
                key={ev.evidenceId}
                className="p-4 rounded-lg border border-[#E5E0D8] bg-[#FAF8F4] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#B40023] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {ev.evidenceId}
                      </span>
                      <span className="text-[10px] font-mono text-[#6E6B65]">
                        Linked: {ev.hypothesisId}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                        ev.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-semibold text-[#1A1917] mb-1">
                    Tool: <span className="text-[#B40023]">{ev.toolName}</span>
                  </div>

                  <p className="text-xs text-[#4A4742] mb-3 leading-relaxed">
                    {ev.summary}
                  </p>
                </div>

                <div>
                  {/* Key Metrics Chips */}
                  {Object.keys(ev.keyMetrics).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {Object.entries(ev.keyMetrics).map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center gap-1 text-[10px] font-mono bg-white px-2 py-1 rounded border border-[#E5E0D8]"
                        >
                          <span className="text-[#6E6B65]">{k}:</span>
                          <span className="font-bold text-[#1A1917]">
                            {typeof v === 'number' ? (k.includes('Return') || k.includes('Drawdown') || k.includes('Rate') ? `${v}%` : v) : v}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Data window provenance */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6E6B65] pt-2 border-t border-[#E5E0D8]">
                    <Calendar className="w-3 h-3 text-[#B40023]" />
                    <span>Data Window: {ev.dataWindow}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Research Conclusion & Findings */}
      {conclusion && (
        <div className="bg-[#1A1917] text-white rounded-xl p-6 shadow-md border border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-neutral-800 pb-4">
            <div>
              <span className="text-[10px] font-mono text-[#B40023] uppercase font-bold tracking-wider">
                Formal Research Conclusion
              </span>
              <h2 className="text-base font-bold font-sans text-white mt-0.5">
                {conclusion.question}
              </h2>
            </div>

            {(() => {
              const badge = getConfidenceBadge(conclusion.confidence);
              return (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold ${badge.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                  {badge.label}
                </div>
              );
            })()}
          </div>

          {/* Confidence Rationale */}
          <div className="mb-5 bg-neutral-900/80 border border-neutral-800 rounded-lg p-3.5 text-xs text-neutral-300 font-mono">
            <span className="text-[#B40023] font-bold">CONFIDENCE RATIONALE: </span>
            {conclusion.confidenceReason}
          </div>

          {/* Findings */}
          <div className="mb-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Key Empirical Findings
            </h4>
            <div className="space-y-2">
              {conclusion.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-neutral-200 leading-relaxed">
                  <span className="text-[#B40023] font-bold mt-0.5">•</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations */}
          <div className="mb-5 pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Analytical Limitations
            </h4>
            <div className="space-y-1.5">
              {conclusion.limitations.map((lim, i) => (
                <div key={i} className="text-[11px] text-neutral-400 leading-relaxed">
                  - {lim}
                </div>
              ))}
            </div>
          </div>

          {/* Next Research Question */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-[#B40023] uppercase font-bold">
                Next Recommended Investigation
              </span>
              <p className="text-xs font-medium text-neutral-200 mt-0.5">
                "{conclusion.nextResearchQuestion}"
              </p>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded">
              ✓ Committed to Research Trail
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
