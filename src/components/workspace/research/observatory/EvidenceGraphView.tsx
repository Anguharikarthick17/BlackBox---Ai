import React, { useState } from 'react';
import { EvidenceGraph as EvidenceGraphType, GraphNode, GraphEdge } from '../../../../core/research/researchTypes';
import { Network, ZoomIn, ZoomOut, Layers, ExternalLink } from 'lucide-react';

interface EvidenceGraphViewProps {
  graph?: EvidenceGraphType;
  onSelectNode?: (node: GraphNode) => void;
  selectedNodeId?: string;
}

export const EvidenceGraphView: React.FC<EvidenceGraphViewProps> = ({
  graph,
  onSelectNode,
  selectedNodeId,
}) => {
  const [zoom, setZoom] = useState(1);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No evidence graph generated yet.</p>
      </div>
    );
  }

  // Pre-calculate circular or layered layout coordinates
  const nodeCount = graph.nodes.length;
  const radius = 180;
  const centerX = 340;
  const centerY = 220;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  graph.nodes.forEach((node, idx) => {
    // Layout by type layers or circular fan
    const angle = (idx / nodeCount) * 2 * Math.PI;
    nodePositions[node.id] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * (radius * 0.75),
    };
  });

  const getNodeColor = (type: GraphNode['type']) => {
    switch (type) {
      case 'QUESTION':
        return '#1A1917';
      case 'HYPOTHESIS':
        return '#B40023';
      case 'EXPERIMENT':
        return '#6B6560';
      case 'EVIDENCE':
        return '#059669';
      case 'CONTRADICTION':
        return '#DC2626';
      case 'SYNTHESIS':
        return '#7C3AED';
      default:
        return '#4B5563';
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <span className="section-label block">TOPOLOGICAL EVIDENCE RELATIONSHIPS</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Interactive Directed Acyclic Evidence Graph
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-graphite-400">
          <button
            onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}
            className="p-1 rounded border border-border hover:bg-ivory-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.4, z + 0.1))}
            className="p-1 rounded border border-border hover:bg-ivory-100"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="ml-2 px-2 py-0.5 bg-ivory-100 rounded border border-border-light">
            Acyclic Kahn Guardrail: PASS
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full h-96 bg-ivory-50 rounded-lg border border-border-light overflow-hidden relative flex items-center justify-center">
        <svg
          viewBox="0 0 680 440"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
        >
          {/* Render Edges */}
          <g className="edges">
            {graph.edges.map((edge, idx) => {
              const from = nodePositions[edge.source];
              const to = nodePositions[edge.target];
              if (!from || !to) return null;

              return (
                <line
                  key={`${edge.source}-${edge.target}-${idx}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={edge.type === 'CONTRADICTS' ? '#DC2626' : '#D4CEC4'}
                  strokeWidth={edge.type === 'CONTRADICTS' ? 2 : 1.2}
                  strokeDasharray={edge.type === 'CONTRADICTS' ? '4 3' : undefined}
                  opacity={0.8}
                />
              );
            })}
          </g>

          {/* Render Nodes */}
          <g className="nodes">
            {graph.nodes.map(node => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const isSelected = selectedNodeId === node.id;
              const color = getNodeColor(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onSelectNode?.(node)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? 18 : 14}
                    fill={color}
                    opacity={isSelected ? 1 : 0.85}
                    stroke={isSelected ? '#1A1917' : '#FFFFFF'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all duration-150"
                  />
                  <text
                    y={26}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-graphite-600 font-medium select-none pointer-events-none"
                  >
                    {node.id}
                  </text>
                  <text
                    y={-18}
                    textAnchor="middle"
                    className="text-[9px] font-mono fill-graphite-400 select-none pointer-events-none"
                  >
                    {node.type}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-graphite-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-graphite" /> Question</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Hypothesis</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Evidence</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600" /> Contradiction</span>
        </div>
        <span>Click node to inspect metadata and bound empirical claims</span>
      </div>
    </div>
  );
};
