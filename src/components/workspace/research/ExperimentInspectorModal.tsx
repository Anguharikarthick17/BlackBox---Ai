import React, { useState } from 'react';
import { ExperimentNode, EvidenceRecord } from '../../../core/research/researchTypes';
import { X, Copy, Check, Terminal, FileCode2, Clock, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExperimentInspectorModalProps {
  experiment: ExperimentNode | null;
  evidence?: EvidenceRecord;
  onClose: () => void;
}

export const ExperimentInspectorModal: React.FC<ExperimentInspectorModalProps> = ({
  experiment,
  evidence,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!experiment) return null;

  const handleCopyRaw = () => {
    const payload = {
      experiment,
      evidence,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-ivory-100/50">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-accent" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-graphite">
                  {experiment.experimentId}
                </span>
                <span className="text-xs font-semibold text-graphite">
                  {experiment.toolName}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                    experiment.status === 'SUCCESS'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : experiment.status === 'FAILED'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {experiment.status}
                </span>
              </div>
              <p className="text-[11px] text-graphite-400 mt-0.5">{experiment.purpose}</p>
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-ivory-100 rounded border border-border">
              <div className="flex items-center gap-1 text-graphite-400 mb-0.5">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] uppercase font-medium">Latency</span>
              </div>
              <span className="font-mono font-semibold text-graphite">
                {experiment.executionLatencyMs !== undefined ? `${experiment.executionLatencyMs}ms` : 'N/A'}
              </span>
            </div>

            <div className="p-2.5 bg-ivory-100 rounded border border-border">
              <div className="flex items-center gap-1 text-graphite-400 mb-0.5">
                <Hash className="w-3 h-3" />
                <span className="text-[10px] uppercase font-medium">PRNG Seed</span>
              </div>
              <span className="font-mono font-semibold text-graphite">
                {experiment.seed ?? 42}
              </span>
            </div>

            <div className="p-2.5 bg-ivory-100 rounded border border-border">
              <div className="flex items-center gap-1 text-graphite-400 mb-0.5">
                <FileCode2 className="w-3 h-3" />
                <span className="text-[10px] uppercase font-medium">Data Window</span>
              </div>
              <span className="font-mono text-graphite truncate block">
                {experiment.dataWindow.startDate} → {experiment.dataWindow.endDate}
              </span>
            </div>
          </div>

          {/* Evidence Separation */}
          {evidence && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold uppercase text-[10px] tracking-wider mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Direct Evidence (Empirical Fact)
                </div>
                <p className="text-graphite font-sans text-xs leading-relaxed">
                  {evidence.directEvidence}
                </p>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-lg">
                <div className="flex items-center gap-1.5 text-blue-800 font-semibold uppercase text-[10px] tracking-wider mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                  Interpretation (Analytical Meaning)
                </div>
                <p className="text-graphite font-sans text-xs leading-relaxed">
                  {evidence.interpretation}
                </p>
              </div>
            </div>
          )}

          {/* Input Arguments */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 block mb-1.5">
              Input Parameters (Read-Only)
            </span>
            <pre className="p-3 bg-graphite text-ivory-100 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-graphite-600">
              {JSON.stringify(experiment.arguments, null, 2)}
            </pre>
          </div>

          {/* Raw Structured Output */}
          {evidence?.result && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400">
                  Deterministic Result Payload (JSON)
                </span>
                <span className="text-[10px] font-mono text-graphite-400">
                  Hash: {evidence.fingerprint}
                </span>
              </div>
              <pre className="p-3 bg-ivory-200 text-graphite font-mono text-[11px] rounded-lg overflow-x-auto max-h-48 border border-border leading-relaxed">
                {JSON.stringify(evidence.result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-ivory-100/50 flex items-center justify-between">
          <div className="text-[10px] font-mono text-graphite-400">
            Node Fingerprint: {experiment.fingerprint || 'N/A'}
          </div>
          <button
            onClick={handleCopyRaw}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-border text-graphite hover:bg-ivory-200 transition-colors shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy JSON'}
          </button>
        </div>
      </div>
    </div>
  );
};
