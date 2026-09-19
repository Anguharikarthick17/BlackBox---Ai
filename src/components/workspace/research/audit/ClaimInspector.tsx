import React from 'react';
import { ClaimInspectionDetail } from '../../../../core/research/audit/auditTypes';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, X, Terminal, Database, Cpu } from 'lucide-react';

interface ClaimInspectorProps {
  inspection: ClaimInspectionDetail | null;
  onClose: () => void;
}

export const ClaimInspector: React.FC<ClaimInspectorProps> = ({ inspection, onClose }) => {
  if (!inspection) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">Claim Provenance Inspector</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                  {inspection.claimId}
                </span>
              </div>
              <p className="text-xs text-zinc-400">Institutional Grounding & Separation Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Claim Summary Card */}
          <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
            <div className="text-xs font-mono uppercase text-zinc-400 mb-1">Target Research Claim</div>
            <div className="text-lg font-bold text-zinc-100 flex items-baseline gap-3">
              <span className="text-emerald-400 font-mono">{String(inspection.value)}</span>
              <span className="text-xs font-normal text-zinc-400 font-mono">{inspection.metric}</span>
            </div>
            <p className="text-xs text-zinc-300 mt-2 italic">"{inspection.claimText}"</p>
          </div>

          {/* Strict Separation Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Direct Evidence */}
            <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  1. Direct Evidence (Empirical)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 font-mono">
                  Engine Output
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-mono flex-1">
                {inspection.directEvidenceStatement}
              </p>
            </div>

            {/* Analytical Interpretation */}
            <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-800/40 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  2. Analytical Interpretation
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 font-mono">
                  Synthesized
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed italic flex-1">
                {inspection.analyticalInterpretation}
              </p>
            </div>
          </div>

          {/* Separation Verification Badge */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
            {inspection.separationVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-zinc-300">
                  <strong className="text-emerald-400">Separation Invariant Verified:</strong> Direct empirical facts and analytical inferences are maintained in separate, distinct data structures.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span className="text-rose-300">
                  <strong>Separation Warning:</strong> Analytical statement duplicates raw output.
                </span>
              </>
            )}
          </div>

          {/* Provenance & Runtime Metadata */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              Underlying Deterministic Engine Run
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">Tool Name</div>
                <div className="text-zinc-200 truncate mt-0.5">{inspection.toolName}</div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">Engine SemVer</div>
                <div className="text-zinc-200 mt-0.5">v{inspection.engineVersion}</div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">PRNG Seed</div>
                <div className="text-zinc-200 mt-0.5">{inspection.seed}</div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase">Evidence ID</div>
                <div className="text-emerald-400 mt-0.5 truncate">{inspection.evidenceId}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-zinc-500 uppercase">Data Observation Window</div>
                  <div className="text-zinc-300">{inspection.dataWindow.startDate} → {inspection.dataWindow.endDate} ({inspection.dataWindow.observationCount} bars)</div>
                </div>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-zinc-500 uppercase">Output Fingerprint</div>
                  <div className="text-zinc-300 truncate">{inspection.evidenceFingerprint}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex justify-end bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
