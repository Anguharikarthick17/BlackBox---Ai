import React, { useState } from 'react';
import { ResearchCase, ReplayVerificationRecord } from '../../../../core/research/audit/auditTypes';
import { CaseExportEngine } from '../../../../core/research/audit/caseExport';
import { Download, Copy, Check, Printer, FileText, Code2, Shield } from 'lucide-react';

interface CaseExportPanelProps {
  caseData: ResearchCase;
  latestVerification?: ReplayVerificationRecord;
}

export const CaseExportPanel: React.FC<CaseExportPanelProps> = ({ caseData, latestVerification }) => {
  const [copiedFormat, setCopiedFormat] = useState<'MARKDOWN' | 'JSON' | null>(null);

  const markdownContent = CaseExportEngine.exportToMarkdown(caseData, latestVerification);
  const jsonContent = CaseExportEngine.exportToJSON(caseData);

  const handleCopy = (content: string, format: 'MARKDOWN' | 'JSON') => {
    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const htmlContent = CaseExportEngine.exportToPrintableHTML(caseData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            Institutional Case File Export
          </h3>
          <p className="text-xs text-zinc-400">
            Export machine-readable manifests, 17-section institutional memos, or printable compliance packets.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 border border-zinc-700 transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          Print / PDF Preview
        </button>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Markdown Export Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">17-Section Markdown Memo</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">.md</span>
          </div>
          <p className="text-xs text-zinc-400 flex-1">
            Complete institutional audit document formatted in GitHub-Flavored Markdown for version control and human review.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => handleCopy(markdownContent, 'MARKDOWN')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors"
            >
              {copiedFormat === 'MARKDOWN' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleDownload(markdownContent, `${caseData.caseId}.md`, 'text/markdown')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* JSON Export Card */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">Machine Manifest JSON</h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">.json</span>
          </div>
          <p className="text-xs text-zinc-400 flex-1">
            Declarative reproducibility closure file containing parameters, simulation seeds, and canonical output fingerprints.
          </p>
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => handleCopy(jsonContent, 'JSON')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 transition-colors"
            >
              {copiedFormat === 'JSON' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            <button
              onClick={() => handleDownload(jsonContent, `${caseData.caseId}.json`, 'application/json')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
