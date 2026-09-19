import React, { useState } from 'react';
import { ResearchCase, LineageStep } from '../../../../core/research/audit/auditTypes';
import { EvidenceLineageEngine } from '../../../../core/research/audit/evidenceLineage';
import { Network, ArrowLeft, ArrowRight, Shield, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';

interface EvidenceLineageProps {
  caseData: ResearchCase;
  onSelectClaim?: (claimId: string) => void;
}

export const EvidenceLineage: React.FC<EvidenceLineageProps> = ({ caseData, onSelectClaim }) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string>(
    caseData.manifest.research.claims[0]?.claimId || ''
  );
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const claims = caseData.manifest.research.claims;
  const graph = EvidenceLineageEngine.buildLineageGraph(caseData);

  const backwardTrace = selectedClaimId
    ? EvidenceLineageEngine.traceBackward(caseData, selectedClaimId)
    : null;

  return (
    <div className="space-y-6 text-sm">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Network className="w-4 h-4 text-purple-400" />
            Bidirectional Evidence Lineage Explorer
          </h3>
          <p className="text-xs text-zinc-400">
            Interactive provenance graph tracing empirical claims back to quantitative engine runs and data windows.
          </p>
        </div>
        <div className="px-3 py-1 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400">
          PROVENANCE TRACKING ONLY (NON-CAUSAL)
        </div>
      </div>

      {/* Claim Selection Bar */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Select Empirical Claim for Backward Provenance Trace
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {claims.map(c => {
            const isSelected = c.claimId === selectedClaimId;
            return (
              <button
                key={c.claimId}
                onClick={() => {
                  setSelectedClaimId(c.claimId);
                  if (onSelectClaim) onSelectClaim(c.claimId);
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-600/80 text-zinc-100 shadow-md'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-purple-400 font-semibold">{c.claimId}</span>
                  <span className="text-emerald-400 font-bold">{String(c.value)}</span>
                </div>
                <div className="text-xs font-mono text-zinc-300 truncate">{c.metric}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backward Trace Pipeline */}
      {backwardTrace && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5 text-purple-400" />
            Backward Provenance Chain: {backwardTrace.claimId}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {backwardTrace.chain.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-purple-600/50 transition-colors space-y-1.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase">
                    <span>Tier {idx + 1}: {step.tier}</span>
                    <span className="text-zinc-600">#{idx + 1}</span>
                  </div>
                  <div className="font-semibold text-zinc-200 text-xs mt-1 truncate">
                    {step.label}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    {step.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-800/60 font-mono text-[10px] text-zinc-500 truncate">
                  ID: {step.entityId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topological Nodes View */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Topological Provenance Graph Entities ({graph.nodes.length} nodes, {graph.edges.length} directed links)
        </h4>

        <div className="flex flex-wrap gap-2 text-xs">
          {graph.nodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="text-[10px] text-zinc-500 mr-1.5">[{node.type}]</span>
                <span>{node.label}</span>
              </button>
            );
          })}
        </div>

        {selectedNode && (
          <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono text-zinc-300">
              <span className="text-purple-400 font-bold">{selectedNode.label}</span>
              <span className="text-zinc-500 text-[10px]">Type: {selectedNode.type}</span>
            </div>
            <pre className="text-[11px] font-mono text-zinc-400 bg-zinc-950 p-2 rounded border border-zinc-900 overflow-x-auto">
              {JSON.stringify(selectedNode.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
