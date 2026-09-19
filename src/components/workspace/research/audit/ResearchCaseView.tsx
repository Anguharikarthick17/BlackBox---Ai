import React, { useState, useCallback } from 'react';
import { ResearchCase, ReplayVerificationRecord } from '../../../../core/research/audit/auditTypes';
import { ResearchCaseFile } from './ResearchCaseFile';
import { ReplayPanel } from './ReplayPanel';
import { EvidenceLineage } from './EvidenceLineage';
import { ResearchDiffView } from './ResearchDiffView';
import { AuditTimeline } from './AuditTimeline';
import { CaseExportPanel } from './CaseExportPanel';
import { globalAuditTimeline } from '../../../../core/research/audit/auditTimeline';
import { globalResearchCaseStore } from '../../../../core/research/audit/researchCaseStore';
import { saveResearchCase } from '../../../../core/persistence/researchPersistenceService';
import { PersistenceStatusBadge } from '../PersistenceStatusBadge';
import {
  FileText,
  RotateCcw,
  Network,
  Scale,
  Clock,
  Download,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  CloudUpload,
} from 'lucide-react';

interface ResearchCaseViewProps {
  caseData: ResearchCase;
  onBack?: () => void;
}

export const ResearchCaseView: React.FC<ResearchCaseViewProps> = ({ caseData, onBack }) => {
  const [activeTab, setActiveTab] = useState<'CASE_FILE' | 'REPLAY' | 'LINEAGE' | 'DIFF' | 'TIMELINE' | 'EXPORT'>(
    'CASE_FILE'
  );
  const [latestVerification, setLatestVerification] = useState<ReplayVerificationRecord | undefined>(undefined);

  // Persistence state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const handleSaveCase = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const result = await saveResearchCase(caseData, {
        isDemo: false,
        replayVerification: latestVerification,
      });
      if (result.success) {
        setLastSavedAt(new Date());
      } else {
        setSaveError(result.offline
          ? 'Saved locally (Supabase offline)'
          : result.error || 'Save failed'
        );
        // Even on remote failure, treat local save as success for UX
        if (result.offline) setLastSavedAt(new Date());
      }
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  }, [caseData, latestVerification]);

  const allStoredCases = globalResearchCaseStore.listCases();
  const comparisonCandidates = allStoredCases.filter(c => c.caseId !== caseData.caseId);
  const [compareTargetId, setCompareTargetId] = useState<string>(
    comparisonCandidates[0]?.caseId || ''
  );

  const diffResult = compareTargetId
    ? globalResearchCaseStore.compareCases(caseData.caseId, compareTargetId)
    : null;

  const timelineEvents = globalAuditTimeline.getEvents(caseData.caseId);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Master Institutional Header */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono mb-1.5">
              <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                {caseData.caseId}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-semibold">
                {caseData.status}
              </span>
              <span className="text-zinc-500">
                Sealed {new Date(caseData.sealedAt).toLocaleTimeString()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-zinc-100 font-mono">
              Research Decision Case File & Audit Console
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <PersistenceStatusBadge lastSavedAt={lastSavedAt} />
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              <span>{caseData.reproducibilityMetadata.canonicalOutputFingerprint.slice(0, 16)}</span>
            </div>
            <button
              onClick={handleSaveCase}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-900/40 hover:bg-cyan-900/70 border border-cyan-800/50 text-cyan-400 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Persist this sealed case to Supabase research storage"
            >
              <CloudUpload className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
          {[
            { id: 'CASE_FILE', label: '17-Section Case File', icon: FileText },
            { id: 'REPLAY', label: 'Decision Replay Audit', icon: RotateCcw },
            { id: 'LINEAGE', label: 'Evidence Lineage', icon: Network },
            { id: 'DIFF', label: 'Research Diff', icon: Scale },
            { id: 'TIMELINE', label: 'Audit Timeline', icon: Clock },
            { id: 'EXPORT', label: 'Export Packet', icon: Download },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'CASE_FILE' && (
          <ResearchCaseFile caseData={caseData} latestVerification={latestVerification} />
        )}

        {activeTab === 'REPLAY' && (
          <ReplayPanel
            caseData={caseData}
            onVerificationComplete={v => setLatestVerification(v)}
          />
        )}

        {activeTab === 'LINEAGE' && <EvidenceLineage caseData={caseData} />}

        {activeTab === 'DIFF' && (
          <div className="space-y-4">
            {comparisonCandidates.length > 0 ? (
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-4">
                <label className="text-xs text-zinc-300 font-semibold uppercase">
                  Select Comparison Target Case:
                </label>
                <select
                  value={compareTargetId}
                  onChange={e => setCompareTargetId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200"
                >
                  {comparisonCandidates.map(c => (
                    <option key={c.caseId} value={c.caseId}>
                      {c.caseId} — {c.question.slice(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
                Only one research case currently exists in the store. Seal another case to run a side-by-side comparative diff.
              </div>
            )}

            {diffResult && <ResearchDiffView diff={diffResult} />}
          </div>
        )}

        {activeTab === 'TIMELINE' && (
          <AuditTimeline
            events={timelineEvents}
            timelineChecksum={caseData.auditMetadata.timelineChecksum}
          />
        )}

        {activeTab === 'EXPORT' && (
          <CaseExportPanel caseData={caseData} latestVerification={latestVerification} />
        )}
      </div>
    </div>
  );
};
