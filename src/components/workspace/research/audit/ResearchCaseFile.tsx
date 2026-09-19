import React, { useState } from 'react';
import { ResearchCase, ReplayVerificationRecord, ClaimInspectionDetail } from '../../../../core/research/audit/auditTypes';
import { ClaimInspector } from './ClaimInspector';
import { ClaimInspector as ClaimInspectorEngine } from '../../../../core/research/audit/claimInspector';
import { FileText, Shield, ChevronDown, ChevronRight, Fingerprint, Database, Cpu, ExternalLink } from 'lucide-react';

interface ResearchCaseFileProps {
  caseData: ResearchCase;
  latestVerification?: ReplayVerificationRecord;
}

export const ResearchCaseFile: React.FC<ResearchCaseFileProps> = ({ caseData, latestVerification }) => {
  const [selectedClaimInspection, setSelectedClaimInspection] = useState<ClaimInspectionDetail | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sec: string) => {
    setCollapsedSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleInspectClaim = (claimId: string) => {
    try {
      const detail = ClaimInspectorEngine.inspectClaim(caseData, claimId);
      setSelectedClaimInspection(detail);
    } catch (err: any) {
      console.error(err);
    }
  };

  const man = caseData.manifest;

  return (
    <div className="space-y-6 text-sm">
      {/* Institutional Case Header */}
      <div className="p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded bg-zinc-800 font-mono text-zinc-300">
                {caseData.caseId}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono font-semibold">
                STATUS: {caseData.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-zinc-100 mt-2 font-mono">
              BLACKBOX X — AUDITABLE RESEARCH CASE FILE
            </h2>
          </div>

          <div className="text-right text-xs font-mono text-zinc-400 space-y-1">
            <div>Sealed: {new Date(caseData.sealedAt).toLocaleDateString()}</div>
            <div>Auditor: {caseData.auditMetadata.sealedBy}</div>
          </div>
        </div>

        {/* Question Blockquote */}
        <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800">
          <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1">
            Section 2: Research Question & Scope
          </div>
          <blockquote className="text-sm font-serif italic text-zinc-200">
            "{caseData.question}"
          </blockquote>
        </div>

        {/* Provenance Key-Value Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-900">
            <div className="text-[10px] text-zinc-500 uppercase">Dataset Window</div>
            <div className="text-zinc-300 mt-0.5">{man.data.startDate} → {man.data.endDate}</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-900">
            <div className="text-[10px] text-zinc-500 uppercase">Observation Count</div>
            <div className="text-zinc-300 mt-0.5">{man.data.observationCount} bars</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-900">
            <div className="text-[10px] text-zinc-500 uppercase">Canonical Hash</div>
            <div className="text-cyan-400 mt-0.5 truncate">{caseData.reproducibilityMetadata.canonicalOutputFingerprint}</div>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-900">
            <div className="text-[10px] text-zinc-500 uppercase">Evidence Records</div>
            <div className="text-emerald-400 mt-0.5">{caseData.evidence.length} collected</div>
          </div>
        </div>
      </div>

      {/* Section 12: Claims with Click-To-Inspect */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Section 12: Empirical Research Claims (Click Value to Inspect Provenance)
          </h3>
          <span className="text-xs text-zinc-500 font-mono">
            {man.research.claims.length} claims registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {man.research.claims.map(claim => (
            <div
              key={claim.claimId}
              onClick={() => handleInspectClaim(claim.claimId)}
              className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/60 cursor-pointer transition-all group space-y-1.5"
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-emerald-400 font-bold group-hover:underline flex items-center gap-1.5">
                  {String(claim.value)}
                  <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400" />
                </span>
                <span className="text-zinc-500 text-[10px]">{claim.claimId}</span>
              </div>
              <div className="text-xs font-mono text-zinc-300 truncate">{claim.metric}</div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Bound Evidence: {claim.evidenceIds.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 9: Direct Quantitative Evidence */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Section 9: Direct Quantitative Evidence Catalog
        </h3>

        <div className="space-y-3">
          {caseData.evidence.map(ev => (
            <div key={ev.evidenceId} className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-200 font-semibold">{ev.evidenceId} ({ev.toolName})</span>
                <span className="text-zinc-500 text-[10px]">Hash: {ev.fingerprint.slice(0, 14)}</span>
              </div>
              <p className="text-xs font-mono text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-900/40">
                {ev.directEvidence}
              </p>
              <p className="text-xs text-zinc-400 italic">
                {ev.interpretation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 15: Synthesis & Limitations */}
      <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Section 15: Research Synthesis & Boundary Specification
        </h3>
        <p className="text-xs text-zinc-200 leading-relaxed italic bg-zinc-950 p-3.5 rounded-lg border border-zinc-800">
          {caseData.synthesis?.executiveObservation || caseData.memo?.sections.executiveObservation || 'Synthesis compiled.'}
        </p>
      </div>

      {/* Claim Inspector Drawer / Modal */}
      <ClaimInspector
        inspection={selectedClaimInspection}
        onClose={() => setSelectedClaimInspection(null)}
      />
    </div>
  );
};
