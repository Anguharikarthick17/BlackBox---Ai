import React, { useState } from 'react';
import { EvidenceGraph as EvidenceGraphType, GraphNode } from '../../../core/research/researchTypes';
import { Network, Info, ArrowDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EvidenceGraphProps {
  graph: EvidenceGraphType;
  onSelectNode?: (node: GraphNode) => void;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ graph, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  const getNodeStyle = (type: GraphNode['type']) => {
    switch (type) {
      case 'QUESTION':
        return 'bg-graphite text-white border-graphite-600';
      case 'HYPOTHESIS':
        return 'bg-blue-50 text-blue-900 border-blue-300';
      case 'EXPERIMENT':
        return 'bg-ivory-100 text-graphite border-border';
      case 'EVIDENCE':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300';
      case 'CONTRADICTION':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      case 'SECONDARY_TEST':
        return 'bg-purple-50 text-purple-900 border-purple-300';
      case 'SYNTHESIS':
        return 'bg-graphite text-white border-accent';
      default:
        return 'bg-white text-graphite border-border';
    }
  };

  // Group nodes by type for institutional hierarchical visual presentation
  const questionNodes = graph.nodes.filter(n => n.type === 'QUESTION');
  const hypothesisNodes = graph.nodes.filter(n => n.type === 'HYPOTHESIS');
  const experimentNodes = graph.nodes.filter(n => n.type === 'EXPERIMENT');
  const evidenceNodes = graph.nodes.filter(n => n.type === 'EVIDENCE');
  const contradictionNodes = graph.nodes.filter(n => n.type === 'CONTRADICTION');
  const secondaryTestNodes = graph.nodes.filter(n => n.type === 'SECONDARY_TEST');
  const synthesisNodes = graph.nodes.filter(n => n.type === 'SYNTHESIS');

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite flex items-center gap-2">
            <Network className="w-4 h-4 text-accent" />
            Inspectable Evidence Graph (DAG)
          </h3>
          <p className="text-[11px] text-graphite-400 mt-0.5">
            Non-causal topological evidentiary structure connecting inquiries to bound findings.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-graphite-400">
          <span>{graph.nodes.length} Nodes</span>
          <span>•</span>
          <span>{graph.edges.length} Edges</span>
        </div>
      </div>

      {/* Hierarchical DAG Visualizer */}
      <div className="bg-ivory-100/50 p-6 rounded-lg border border-border space-y-6 overflow-x-auto">
        {/* Layer 1: Question */}
        <div className="flex justify-center">
          {questionNodes.map(node => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`px-4 py-2 rounded-lg border text-xs font-mono font-medium shadow-xs hover:scale-102 transition-all max-w-md text-center ${getNodeStyle(
                node.type
              )}`}
            >
              [QUESTION] {node.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-4 h-4 text-graphite-300" />
        </div>

        {/* Layer 2: Hypotheses */}
        <div className="flex flex-wrap justify-center gap-3">
          {hypothesisNodes.map(node => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium shadow-xs hover:scale-102 transition-all max-w-xs text-left truncate ${getNodeStyle(
                node.type
              )}`}
            >
              [HYP] {node.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-4 h-4 text-graphite-300" />
        </div>

        {/* Layer 3: Experiments */}
        <div className="flex flex-wrap justify-center gap-2">
          {experimentNodes.map(node => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`px-2.5 py-1 rounded border text-[11px] font-mono shadow-xs hover:scale-102 transition-all ${getNodeStyle(
                node.type
              )}`}
            >
              ⚙ {node.label}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-4 h-4 text-graphite-300" />
        </div>

        {/* Layer 4: Evidence */}
        <div className="flex flex-wrap justify-center gap-2">
          {evidenceNodes.map(node => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`px-2.5 py-1 rounded border text-[11px] font-mono shadow-xs hover:scale-102 transition-all ${getNodeStyle(
                node.type
              )}`}
            >
              ✓ {node.label}
            </button>
          ))}
        </div>

        {/* Layer 5: Contradictions & Secondary Tests (if any) */}
        {(contradictionNodes.length > 0 || secondaryTestNodes.length > 0) && (
          <>
            <div className="flex justify-center">
              <ArrowDown className="w-4 h-4 text-graphite-300" />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {contradictionNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono shadow-xs hover:scale-102 transition-all ${getNodeStyle(
                    node.type
                  )}`}
                >
                  ⚡ {node.label}
                </button>
              ))}
              {secondaryTestNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono shadow-xs hover:scale-102 transition-all ${getNodeStyle(
                    node.type
                  )}`}
                >
                  🔬 {node.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-center">
          <ArrowDown className="w-4 h-4 text-graphite-300" />
        </div>

        {/* Layer 6: Synthesis */}
        <div className="flex justify-center">
          {synthesisNodes.map(node => (
            <button
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`px-4 py-2 rounded-lg border text-xs font-mono font-bold shadow-xs hover:scale-102 transition-all max-w-sm text-center ${getNodeStyle(
                node.type
              )}`}
            >
              🏛 {node.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detail Drawer if Node Selected */}
      {selectedNode && (
        <div className="p-4 bg-ivory-100 rounded-lg border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <span className="font-semibold text-graphite">
                Node Detail: {selectedNode.id} ({selectedNode.type})
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-[11px] text-graphite-400 hover:text-graphite font-mono"
            >
              Dismiss
            </button>
          </div>
          <div className="p-3 bg-white rounded border border-border font-mono text-[11px] overflow-x-auto max-h-36">
            <pre>{JSON.stringify(selectedNode.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
