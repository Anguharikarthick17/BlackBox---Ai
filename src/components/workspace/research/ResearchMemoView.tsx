import React, { useState } from 'react';
import { ResearchMemo, ResearchSession, EvidenceRecord } from '../../../core/research/researchTypes';
import { exportResearchSessionJson } from '../../../core/research/researchMemo';
import { FileText, Download, Code2, Printer, Check, Copy, ExternalLink, Shield } from 'lucide-react';

interface ResearchMemoViewProps {
  memo: ResearchMemo;
  session: ResearchSession;
  evidence: EvidenceRecord[];
}

export const ResearchMemoView: React.FC<ResearchMemoViewProps> = ({
  memo,
  session,
  evidence,
}) => {
  const [viewMode, setViewMode] = useState<'EDITORIAL' | 'MARKDOWN'>('EDITORIAL');
  const [copied, setCopied] = useState(false);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([memo.rawMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${memo.memoId}_RESEARCH_MEMO.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = exportResearchSessionJson(session, evidence, session.synthesis);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${memo.memoId}_SESSION.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(memo.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-border bg-ivory-100/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-accent" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-graphite">
                Institutional Research Memo
              </h2>
              <span className="font-mono text-xs text-graphite-400">
                Ref: {memo.memoId}
              </span>
            </div>
            <p className="text-[11px] text-graphite-400">
              Audit-verifiable quantitative report. Every numerical statement bound to evidence records.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-border rounded-md p-0.5 text-xs">
            <button
              onClick={() => setViewMode('EDITORIAL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'EDITORIAL'
                  ? 'bg-graphite text-white'
                  : 'text-graphite-400 hover:text-graphite'
              }`}
            >
              Editorial
            </button>
            <button
              onClick={() => setViewMode('MARKDOWN')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'MARKDOWN'
                  ? 'bg-graphite text-white'
                  : 'text-graphite-400 hover:text-graphite'
              }`}
            >
              Markdown
            </button>
          </div>

          <button
            onClick={handleCopyMarkdown}
            title="Copy Markdown"
            className="p-1.5 bg-white border border-border rounded-md text-graphite hover:bg-ivory-200 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-md text-xs font-medium text-graphite hover:bg-ivory-200 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            .MD
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border rounded-md text-xs font-medium text-graphite hover:bg-ivory-200 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            .JSON
          </button>

          <button
            onClick={handlePrint}
            title="Print Memo"
            className="p-1.5 bg-white border border-border rounded-md text-graphite hover:bg-ivory-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Memo Content */}
      <div className="p-8 max-w-4xl mx-auto">
        {viewMode === 'MARKDOWN' ? (
          <pre className="p-4 bg-graphite text-ivory-100 font-mono text-xs rounded-lg overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {memo.rawMarkdown}
          </pre>
        ) : (
          <article className="prose prose-sm max-w-none text-graphite space-y-8 font-sans">
            {/* Title & Metadata */}
            <div className="border-b border-border pb-6 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-accent tracking-widest block">
                BLACKBOX X QUANTITATIVE INTELLIGENCE MEMORANDUM
              </span>
              <h1 className="text-xl font-bold text-graphite tracking-tight">
                {memo.sections.researchQuestion}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-graphite-400 pt-1">
                <span>Ref: {memo.memoId}</span>
                <span>•</span>
                <span>Audit: {session.configurationFingerprint}</span>
                <span>•</span>
                <span>Date: {new Date(memo.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Section 1: Research Question */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                1. Research Question
              </h3>
              <div className="p-3.5 bg-ivory-100 rounded-lg border-l-4 border-accent font-medium text-graphite text-sm">
                "{memo.sections.researchQuestion}"
              </div>
            </div>

            {/* Section 2: Executive Observation */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                2. Executive Observation
              </h3>
              <p className="text-xs leading-relaxed text-graphite font-sans">
                {memo.sections.executiveObservation}
              </p>
            </div>

            {/* Section 3: Hypotheses */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                3. Hypotheses & Confidence Ratings
              </h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-200/60 border-b border-border font-semibold text-graphite">
                    <tr>
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Proposition</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {memo.sections.hypotheses.map(h => (
                      <tr key={h.id} className="hover:bg-ivory-100/50">
                        <td className="p-2.5 font-mono font-bold text-graphite">{h.id}</td>
                        <td className="p-2.5 font-mono text-[10px] text-graphite-400">{h.category}</td>
                        <td className="p-2.5 text-graphite">{h.statement}</td>
                        <td className="p-2.5 font-mono text-[11px] font-semibold text-emerald-700">{h.status}</td>
                        <td className="p-2.5 font-mono text-[10px] text-graphite-600">{h.confidence.replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4 & 5: Direct Evidence */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                4. Direct Quantitative Evidence (Empirical Fact)
              </h3>
              <ul className="space-y-2 list-none p-0">
                {memo.sections.directEvidence.map(e => (
                  <li
                    key={e.id}
                    className="p-3 bg-ivory-100/70 border border-border rounded-lg text-xs leading-relaxed"
                  >
                    <span className="font-mono font-bold text-accent mr-1.5">[{e.id}]</span>
                    <span className="font-mono text-[10px] text-graphite-400 mr-2">({e.toolName})</span>
                    <span className="text-graphite">{e.statement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 6 & 7: Contradictions & Secondary Tests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                  5. Contradiction Audit
                </h3>
                <div className="p-3 bg-white border border-border rounded-lg text-xs space-y-1">
                  {memo.sections.contradictions.length > 0 ? (
                    memo.sections.contradictions.map((c, i) => <p key={i}>{c}</p>)
                  ) : (
                    <p className="text-graphite-400 italic">No empirical contradictions detected.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                  6. Secondary Sweep Tests
                </h3>
                <div className="p-3 bg-white border border-border rounded-lg text-xs space-y-1">
                  {memo.sections.secondaryTests.length > 0 ? (
                    memo.sections.secondaryTests.map((s, i) => <p key={i}>{s}</p>)
                  ) : (
                    <p className="text-graphite-400 italic">No secondary parameter sweeps triggered.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 8: Quantitative Findings */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                7. Structured Quantitative Claims
              </h3>
              <div className="space-y-2">
                {memo.sections.quantitativeFindings.map(q => (
                  <div
                    key={q.claimId}
                    className="p-3 bg-white border border-border rounded-lg text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono font-bold text-graphite mr-2">[{q.claimId}]</span>
                      <span className="text-graphite">{q.text}</span>
                    </div>
                    <span className="font-mono text-[10px] text-accent shrink-0">
                      Bound: {q.boundEvidence.map(b => `[${b}]`).join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 9 & 10: Risk & Robustness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                  8. Risk & Regime Interpretation
                </h3>
                <p className="text-xs text-graphite leading-relaxed">
                  {memo.sections.riskInterpretation}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                  9. Robustness & Friction Decay
                </h3>
                <p className="text-xs text-graphite leading-relaxed">
                  {memo.sections.robustnessAssessment}
                </p>
              </div>
            </div>

            {/* Section 11 & 12: Limitations & Follow-Ups */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                  10. Methodological Limitations
                </h3>
                <ul className="space-y-1 text-xs text-graphite list-disc pl-4">
                  {memo.sections.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-graphite-400">
                  11. Next Recommended Tests
                </h3>
                <ul className="space-y-1 text-xs text-graphite list-disc pl-4">
                  {memo.sections.nextResearchQuestions.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Section 13, 14, 15: Methodology, Provenance, Disclaimer */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="p-3 bg-ivory-100 rounded text-xs space-y-1 text-graphite-600">
                <span className="font-semibold text-graphite block">Methodology & Provenance:</span>
                <p>{memo.sections.methodology}</p>
                <div className="font-mono text-[10px] text-graphite-400 pt-1">
                  Window: {memo.sections.provenance.dataWindow.startDate} to {memo.sections.provenance.dataWindow.endDate} • Bars: {memo.sections.provenance.dataWindow.observationCount} • Seed: {memo.sections.provenance.deterministicSeed} • Wall-clock: {memo.sections.provenance.totalExecutionDurationMs}ms
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-900 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">NON-INVESTMENT ADVICE NOTICE: </span>
                  {memo.sections.disclaimer}
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};
