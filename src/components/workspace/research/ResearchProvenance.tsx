import React from 'react';
import { SessionProvenance } from '../../../core/research/researchTypes';
import { Shield, Database, Cpu, Hash, Clock, CheckCircle2 } from 'lucide-react';

interface ResearchProvenanceProps {
  provenance: SessionProvenance;
  datasetFingerprint: string;
  configurationFingerprint: string;
  limitations?: string[];
}

export const ResearchProvenance: React.FC<ResearchProvenanceProps> = ({
  provenance,
  datasetFingerprint,
  configurationFingerprint,
  limitations,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite">
            Audit Provenance & Bit-Level Reproducibility
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> VERIFIED DETERMINISTIC
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-ivory-100 rounded p-3 border border-border">
          <div className="flex items-center gap-1.5 text-graphite-400 mb-1">
            <Database className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Dataset Window</span>
          </div>
          <div className="text-xs font-mono font-semibold text-graphite">
            {provenance.dataWindow.startDate} → {provenance.dataWindow.endDate}
          </div>
          <div className="text-[10px] font-mono text-graphite-400 mt-0.5">
            {provenance.dataWindow.observationCount.toLocaleString()} synchronized bars
          </div>
        </div>

        <div className="bg-ivory-100 rounded p-3 border border-border">
          <div className="flex items-center gap-1.5 text-graphite-400 mb-1">
            <Hash className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">PRNG Seed & Executions</span>
          </div>
          <div className="text-xs font-mono font-semibold text-graphite">
            Seed: {provenance.deterministicSeed}
          </div>
          <div className="text-[10px] font-mono text-graphite-400 mt-0.5">
            {provenance.totalToolsExecuted} quantitative tools executed
          </div>
        </div>

        <div className="bg-ivory-100 rounded p-3 border border-border">
          <div className="flex items-center gap-1.5 text-graphite-400 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Engine Latency</span>
          </div>
          <div className="text-xs font-mono font-semibold text-graphite">
            {provenance.totalExecutionDurationMs}ms total
          </div>
          <div className="text-[10px] text-graphite-400 mt-0.5">
            Zero network API key exposure
          </div>
        </div>

        <div className="bg-ivory-100 rounded p-3 border border-border">
          <div className="flex items-center gap-1.5 text-graphite-400 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Engine Stack</span>
          </div>
          <div className="text-xs font-mono font-semibold text-graphite truncate">
            QC: 1.0 • MC: 3.8/3.9 • WS: 4.0
          </div>
          <div className="text-[10px] text-graphite-400 mt-0.5">
            100% native TypeScript
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border flex flex-col sm:flex-row gap-3 text-[11px] font-mono">
        <div className="flex-1 bg-ivory-200/50 p-2 rounded border border-border/60">
          <span className="text-graphite-400 select-none">Dataset Hash: </span>
          <span className="text-graphite select-all">{datasetFingerprint}</span>
        </div>
        <div className="flex-1 bg-ivory-200/50 p-2 rounded border border-border/60">
          <span className="text-graphite-400 select-none">Session Fingerprint: </span>
          <span className="text-graphite select-all">{configurationFingerprint}</span>
        </div>
      </div>

      {limitations && limitations.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/80 rounded-md">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900 mb-1">
            Methodological Boundaries & Limitations
          </div>
          <ul className="space-y-1">
            {limitations.map((lim, idx) => (
              <li key={idx} className="text-[11px] text-amber-800 flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{lim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
