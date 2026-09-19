import React, { useState } from 'react';
import { ResearchMemo as MemoType } from '../../../../core/research/researchTypes';
import { ResearchCase } from '../../../../core/research/audit/auditTypes';
import { FileText, Download, Copy, Check, ExternalLink } from 'lucide-react';

interface ResearchMemoProps {
  memo: Readonly<MemoType> | MemoType | null | undefined;
  researchCase: Readonly<ResearchCase> | ResearchCase | null;
  onOpenFullMemo?: () => void;
  onOpenExportPanel?: () => void;
}

export const ResearchMemo: React.FC<ResearchMemoProps> = ({
  memo,
  researchCase,
  onOpenFullMemo,
  onOpenExportPanel,
}) => {
  const [copied, setCopied] = useState(false);

  if (!memo) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No research memorandum assembled yet.</p>
      </div>
    );
  }

  const handleCopySummary = () => {
    const text = `BLACKBOX X RESEARCH MEMORANDUM\nInquiry: ${memo.sections.researchQuestion}\nExecutive Observation: ${memo.sections.executiveObservation}\nFindings: ${memo.sections.quantitativeFindings.map(f => f.text).join('; ')}\nFingerprint: ${researchCase?.reproducibilityMetadata.canonicalOutputFingerprint || memo.memoId}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">RESEARCH MEMORANDUM PREVIEW</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            {memo.sections.researchQuestion}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Summary'}</span>
          </button>

          {onOpenExportPanel && (
            <button
              onClick={onOpenExportPanel}
              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border text-accent hover:text-accent-dark"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Case</span>
            </button>
          )}

          {onOpenFullMemo && (
            <button
              onClick={onOpenFullMemo}
              className="btn-accent text-xs px-4 py-1.5 flex items-center gap-1.5"
            >
              <span>View Full Memo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 bg-ivory-50 rounded-lg border border-border mb-6">
        <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block mb-1">
          EXECUTIVE OBSERVATION
        </span>
        <p className="text-sm font-sans text-graphite leading-relaxed">
          {memo.sections.executiveObservation}
        </p>
      </div>

      {/* Top Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {memo.sections.quantitativeFindings.slice(0, 4).map((f, idx) => (
          <div key={idx} className="p-3.5 bg-white rounded border border-border-light text-xs font-mono">
            <span className="text-[10px] text-graphite-400 block uppercase mb-1">
              CLAIM {f.claimId} • {f.metric}
            </span>
            <p className="text-graphite-700 font-sans text-xs leading-relaxed">
              "{f.text}"
            </p>
            <span className="text-[11px] font-semibold text-accent mt-1 block">
              Value: {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* Memo Metadata Footer */}
      <div className="p-3 bg-ivory-100 rounded border border-border-light flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-graphite-400">
        <span>CASE: {researchCase?.caseId || memo.sessionId}</span>
        <span>STATUS: SEALED</span>
        <span className="truncate max-w-xs" title={researchCase?.reproducibilityMetadata.canonicalOutputFingerprint || memo.memoId}>
          FINGERPRINT: {(researchCase?.reproducibilityMetadata.canonicalOutputFingerprint || memo.memoId).substring(0, 14)}…
        </span>
        <span>GENERATED: {new Date(memo.generatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
