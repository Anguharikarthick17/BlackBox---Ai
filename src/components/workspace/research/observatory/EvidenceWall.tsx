import React, { useState } from 'react';
import { EvidenceRecord } from '../../../../core/research/researchTypes';
import { EvidenceCard } from './EvidenceCard';
import { ShieldCheck, Filter } from 'lucide-react';

interface EvidenceWallProps {
  evidenceRecords: readonly EvidenceRecord[] | EvidenceRecord[];
  onInspectLineage?: (evidenceId: string) => void;
  onInspectClaim?: (evidence: EvidenceRecord) => void;
  selectedEvidenceId?: string;
}

export const EvidenceWall: React.FC<EvidenceWallProps> = ({
  evidenceRecords,
  onInspectLineage,
  onInspectClaim,
  selectedEvidenceId,
}) => {
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('ALL');

  if (!evidenceRecords || evidenceRecords.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No evidence records collected yet. Run investigation to populate evidence wall.</p>
      </div>
    );
  }

  const toolNames = Array.from(new Set(evidenceRecords.map(e => e.toolName)));
  const filteredRecords = selectedToolFilter === 'ALL'
    ? evidenceRecords
    : evidenceRecords.filter(e => e.toolName === selectedToolFilter);

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 04 / 05 — EVIDENCE WALL</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Immutable Empirical Evidence Records
          </h2>
          <p className="text-xs text-graphite-400 mt-1 font-mono">
            Every record strictly binds direct numerical observations and analytical interpretations.
          </p>
        </div>

        {/* Tool Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-ivory-100 p-1 rounded-md border border-border-light text-xs font-mono">
          <button
            onClick={() => setSelectedToolFilter('ALL')}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedToolFilter === 'ALL'
                ? 'bg-white text-graphite font-semibold shadow-xs'
                : 'text-graphite-400 hover:text-graphite'
            }`}
          >
            ALL ({evidenceRecords.length})
          </button>
          {toolNames.map(tool => (
            <button
              key={tool}
              onClick={() => setSelectedToolFilter(tool)}
              className={`px-2 py-1 rounded transition-colors ${
                selectedToolFilter === tool
                  ? 'bg-white text-graphite font-semibold shadow-xs'
                  : 'text-graphite-400 hover:text-graphite'
              }`}
            >
              {tool.replace('get_', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecords.map(ev => (
          <EvidenceCard
            key={ev.evidenceId}
            evidence={ev}
            isSelected={selectedEvidenceId === ev.evidenceId}
            onInspectLineage={onInspectLineage}
            onInspectClaim={onInspectClaim}
          />
        ))}
      </div>
    </div>
  );
};
