import React from 'react';
import { ResearchCase } from '../../../../core/research/audit/auditTypes';
import { RefreshCw, ShieldCheck, Download, Columns2, CheckCircle2, Lock } from 'lucide-react';

interface ReplayCTAProps {
  researchCase: ResearchCase | null;
  onReplayCase?: () => void;
  onVerifyEvidence?: () => void;
  onCompareCase?: () => void;
  onExportCase?: () => void;
  isReplaying?: boolean;
}

export const ReplayCTA: React.FC<ReplayCTAProps> = ({
  researchCase,
  onReplayCase,
  onVerifyEvidence,
  onCompareCase,
  onExportCase,
  isReplaying = false,
}) => {
  if (!researchCase) return null;

  return (
    <div className="bg-white border-2 border-accent/20 rounded-xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
            <span className="section-label">SECTION 10 — REPRODUCIBILITY & AUDIT LAYER</span>
          </div>
          <h2 className="text-xl md:text-2xl font-light text-graphite tracking-tight">
            Reproduce This Quantitative Research Case
          </h2>
          <p className="text-xs md:text-sm text-graphite-400 mt-1 font-mono">
            Same Engine + Same Data + Same Params + Same Seed = Identical Canonical Fingerprint
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> IMMUTABLE RECORD
          </span>
        </div>
      </div>

      {/* Case Identity & Engine Spec Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-ivory-50 rounded-lg border border-border mb-6 text-xs font-mono">
        <div>
          <span className="text-[10px] text-graphite-400 block uppercase">CASE IDENTIFIER:</span>
          <span className="font-bold text-graphite">{researchCase.caseId}</span>
        </div>
        <div>
          <span className="text-[10px] text-graphite-400 block uppercase">DETERMINISTIC SEED:</span>
          <span className="font-semibold text-graphite">{researchCase.manifest.simulation.seed}</span>
        </div>
        <div>
          <span className="text-[10px] text-graphite-400 block uppercase">EXPERIMENT COUNT:</span>
          <span className="font-semibold text-graphite">{researchCase.experiments.length} Bounded Experiments</span>
        </div>
        <div>
          <span className="text-[10px] text-graphite-400 block uppercase">CANONICAL FINGERPRINT:</span>
          <span className="text-accent truncate block font-bold" title={researchCase.reproducibilityMetadata.canonicalOutputFingerprint}>
            {researchCase.reproducibilityMetadata.canonicalOutputFingerprint}
          </span>
        </div>
      </div>

      {/* Replay & Action CTA Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {onReplayCase && (
          <button
            onClick={onReplayCase}
            disabled={isReplaying}
            className="btn-accent py-3 px-4 text-xs font-mono font-semibold flex items-center justify-center gap-2 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin' : ''}`} />
            <span>{isReplaying ? 'Replaying...' : 'REPLAY CASE'}</span>
          </button>
        )}

        {onVerifyEvidence && (
          <button
            onClick={onVerifyEvidence}
            className="btn-ghost py-3 px-4 text-xs font-mono font-semibold flex items-center justify-center gap-2 border border-border rounded-lg bg-white hover:bg-ivory-100 text-graphite"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>VERIFY EVIDENCE</span>
          </button>
        )}

        {onCompareCase && (
          <button
            onClick={onCompareCase}
            className="btn-ghost py-3 px-4 text-xs font-mono font-semibold flex items-center justify-center gap-2 border border-border rounded-lg bg-white hover:bg-ivory-100 text-graphite"
          >
            <Columns2 className="w-3.5 h-3.5 text-accent" />
            <span>COMPARE CASE</span>
          </button>
        )}

        {onExportCase && (
          <button
            onClick={onExportCase}
            className="btn-ghost py-3 px-4 text-xs font-mono font-semibold flex items-center justify-center gap-2 border border-border rounded-lg bg-white hover:bg-ivory-100 text-graphite"
          >
            <Download className="w-3.5 h-3.5 text-graphite-500" />
            <span>EXPORT CASE FILE</span>
          </button>
        )}
      </div>
    </div>
  );
};
