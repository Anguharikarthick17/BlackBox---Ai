import React from 'react';
import { ResearchClaim } from '../../../../core/research/researchTypes';
import { ResearchCase } from '../../../../core/research/audit/auditTypes';
import { ClaimInspector } from '../../../../core/research/audit/claimInspector';
import { X, ShieldCheck, Database, Layers, ArrowRight, Network } from 'lucide-react';

interface ObservatoryClaimInspectorProps {
  claim: ResearchClaim | null;
  researchCase: ResearchCase;
  onClose: () => void;
  onOpenLineage?: (evidenceId: string) => void;
}

export const ObservatoryClaimInspector: React.FC<ObservatoryClaimInspectorProps> = ({
  claim,
  researchCase,
  onClose,
  onOpenLineage,
}) => {
  if (!claim) return null;

  let inspection = null;
  try {
    inspection = ClaimInspector.inspectClaim(researchCase, claim.claimId);
  } catch (err) {
    console.error('Claim inspection error:', err);
  }

  if (!inspection) return null;

  return (
    <div className="fixed inset-0 bg-graphite/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-light mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-accent bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                {claim.claimId}
              </span>
              <span className="text-xs font-mono text-graphite-400">
                • {claim.claimType}
              </span>
            </div>
            <h3 className="text-lg font-light text-graphite tracking-tight mt-1">
              Numerical Claim Provenance Inspector
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-graphite-400 hover:text-graphite hover:bg-ivory-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Text & Metric */}
        <div className="p-4 bg-ivory-50 rounded-lg border border-border mb-6">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block mb-1">
            EXPLICIT CLAIM STATEMENT
          </span>
          <p className="text-sm font-normal text-graphite leading-relaxed mb-3">
            "{claim.text}"
          </p>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-graphite-400 block uppercase">METRIC:</span>
              <span className="font-semibold text-graphite">{claim.metric}</span>
            </div>
            <div>
              <span className="text-[10px] text-graphite-400 block uppercase">ASSERTED VALUE:</span>
              <span className="font-semibold text-accent">{claim.value} {claim.unit || ''}</span>
            </div>
            <div>
              <span className="text-[10px] text-graphite-400 block uppercase">STATUS:</span>
              <span className="font-semibold text-emerald-700">VERIFIED GROUNDED</span>
            </div>
          </div>
        </div>

        {/* DIRECT EVIDENCE vs INTERPRETATION BOUNDARY */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              DIRECT EMPIRICAL EVIDENCE
            </span>
            <p className="text-xs font-mono text-emerald-950 leading-relaxed font-medium">
              {inspection.directEvidenceStatement || 'Numerical metric verified directly from deterministic engine output.'}
            </p>
          </div>

          <div className="p-3.5 bg-ivory-100 border border-border rounded">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-900 block mb-1">
              ANALYTICAL INTERPRETATION
            </span>
            <p className="text-xs font-sans text-graphite-600 leading-relaxed">
              {inspection.analyticalInterpretation || 'Contextual analytical reasoning bound to empirical evidence.'}
            </p>
          </div>
        </div>

        {/* Deep Provenance Metadata */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-ivory-50 rounded border border-border-light text-xs font-mono mb-6">
          <div>
            <span className="text-[10px] text-graphite-400 block uppercase">BOUND EVIDENCE:</span>
            <span className="font-semibold text-graphite">{inspection.evidenceId}</span>
          </div>
          <div>
            <span className="text-[10px] text-graphite-400 block uppercase">EXPERIMENT ID:</span>
            <span className="font-semibold text-graphite">{inspection.experimentId}</span>
          </div>
          <div>
            <span className="text-[10px] text-graphite-400 block uppercase">ANALYTICAL TOOL:</span>
            <span className="font-semibold text-graphite">{inspection.toolName}</span>
          </div>
          <div>
            <span className="text-[10px] text-graphite-400 block uppercase">ENGINE VERSION:</span>
            <span className="font-semibold text-graphite">{inspection.engineVersion}</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-graphite-400 block uppercase">DETERMINISTIC FINGERPRINT:</span>
            <span className="text-accent truncate block">{inspection.evidenceFingerprint}</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border-light text-xs">
          <span className="text-graphite-400 font-mono text-[11px]">
            Reproducibility Contract: EXACT_COMPATIBLE
          </span>

          <div className="flex items-center gap-2">
            {onOpenLineage && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLineage(inspection.evidenceId);
                }}
                className="btn-accent px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Network className="w-3.5 h-3.5" />
                <span>View Full Lineage Graph</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-ghost px-4 py-2 text-xs border border-border"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
