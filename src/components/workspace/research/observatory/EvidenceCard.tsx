import React from 'react';
import { EvidenceRecord } from '../../../../core/research/researchTypes';
import { Network, Database, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';

interface EvidenceCardProps {
  evidence: EvidenceRecord;
  onInspectLineage?: (evidenceId: string) => void;
  onInspectClaim?: (evidence: EvidenceRecord) => void;
  isSelected?: boolean;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  onInspectLineage,
  onInspectClaim,
  isSelected = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border p-5 transition-all flex flex-col justify-between ${
        isSelected
          ? 'border-accent shadow-md ring-1 ring-accent'
          : 'border-border hover:border-graphite-300 shadow-sm'
      }`}
    >
      <div>
        {/* Header Strip */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-border-light">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-accent bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {evidence.evidenceId}
            </span>
            <span className="text-xs font-mono text-graphite-400">
              • {evidence.experimentId}
            </span>
          </div>
          <span className="text-[11px] font-mono text-graphite-500 bg-ivory-100 px-2 py-0.5 rounded border border-border-light">
            {evidence.toolName}
          </span>
        </div>

        {/* DIRECT EVIDENCE BLOCK (Mandatory Visual Distinction) */}
        <div className="mb-3.5 p-3 bg-emerald-50/50 border border-emerald-200/70 rounded">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
              DIRECT EVIDENCE (EMPIRICAL OBSERVATION)
            </span>
          </div>
          <p className="text-xs font-mono text-emerald-950 font-medium leading-relaxed">
            {evidence.directEvidence}
          </p>
        </div>

        {/* ANALYTICAL INTERPRETATION BLOCK (Mandatory Visual Distinction) */}
        <div className="mb-4 p-3 bg-ivory-100 border border-border rounded">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-900">
              ANALYTICAL INTERPRETATION
            </span>
          </div>
          <p className="text-xs font-sans text-graphite-600 leading-relaxed">
            {evidence.interpretation}
          </p>
        </div>

        {/* Key Metrics Pill Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] font-mono">
          <div className="p-2 bg-ivory-50 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 block uppercase">DATA WINDOW</span>
            <span className="text-graphite font-medium">
              {evidence.dataWindow.startDate.substring(0, 4)}–{evidence.dataWindow.endDate.substring(0, 4)}
            </span>
          </div>
          <div className="p-2 bg-ivory-50 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 block uppercase">FINGERPRINT</span>
            <span className="text-graphite-600 truncate block" title={evidence.fingerprint}>
              {evidence.fingerprint ? `${evidence.fingerprint.substring(0, 10)}…` : 'deterministic'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Lineage & Trace Actions */}
      <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs">
        <span className="text-[10px] font-mono text-graphite-400">
          Source: {evidence.toolName}
        </span>

        <div className="flex items-center gap-2">
          {onInspectLineage && (
            <button
              onClick={() => onInspectLineage(evidence.evidenceId)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:text-accent-dark transition-colors"
              title="Trace backward to experiment arguments and forward to claims"
            >
              <Network className="w-3 h-3" />
              <span>Lineage</span>
            </button>
          )}

          {onInspectClaim && (
            <button
              onClick={() => onInspectClaim(evidence)}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-graphite-600 hover:text-graphite transition-colors bg-ivory-100 px-2 py-0.5 rounded border border-border-light"
            >
              <span>Inspect</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
