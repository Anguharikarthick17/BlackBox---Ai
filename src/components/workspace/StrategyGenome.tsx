import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  GitBranch, Compass, Layers, Flame, Sliders, Info,
  RotateCcw, ArrowRight, Activity, BarChart3, TrendingUp,
  ShieldAlert, Sparkles, Check,
} from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS, Asset } from '../../core/data';
import { STRATEGY_LABELS, StrategyType } from '../../core/strategies';
import {
  buildStrategyGenome,
  GenomeNode,
  GenomeEdge,
  GenomeMode,
  GenomeCorrelationMode,
  GenomeRollingWindow,
} from '../../core/strategyGenome';
import { REGIME_LABELS, REGIME_COLORS } from '../../core/regimes';

export function StrategyGenome() {
  const shouldReduceMotion = useReducedMotion();
  const {
    selectedAsset, setAsset,
    selectedStrategy, setStrategy,
    strategyParams,
    initialCapital,
    positionSizePct,
    transactionCostPct,
    startDate, endDate,
    stressResult,
    selectedGenomeMode, setGenomeMode,
    selectedGenomeNodeId, setSelectedGenomeNodeId,
    selectedGenomeEdgeId, setSelectedGenomeEdgeId,
    genomeCorrelationMode, setGenomeCorrelationMode,
    genomeCorrelationWindow, setGenomeCorrelationWindow,
    setActiveSection,
  } = useResearchStore();

  // Hover state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Zoom / Pan transformation state
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // Build the Genome graph snapshot deterministically
  const snapshot = useMemo(() => {
    return buildStrategyGenome({
      mode: selectedGenomeMode,
      asset: selectedAsset,
      strategy: selectedStrategy,
      strategyParams,
      initialCapital,
      positionSizePct,
      transactionCostPct,
      startDate,
      endDate,
      correlationMode: genomeCorrelationMode,
      correlationWindow: genomeCorrelationWindow,
      stressResult,
    });
  }, [
    selectedGenomeMode,
    selectedAsset,
    selectedStrategy,
    strategyParams,
    initialCapital,
    positionSizePct,
    transactionCostPct,
    startDate,
    endDate,
    genomeCorrelationMode,
    genomeCorrelationWindow,
    stressResult,
  ]);

  const activeNode = useMemo(() => {
    if (!selectedGenomeNodeId) return null;
    return snapshot.nodes.find(n => n.id === selectedGenomeNodeId) ?? null;
  }, [snapshot.nodes, selectedGenomeNodeId]);

  const activeEdge = useMemo(() => {
    if (!selectedGenomeEdgeId) return null;
    return snapshot.edges.find(e => e.id === selectedGenomeEdgeId) ?? null;
  }, [snapshot.edges, selectedGenomeEdgeId]);

  // Handle node selection
  const handleNodeClick = (node: GenomeNode) => {
    if (selectedGenomeNodeId === node.id) {
      setSelectedGenomeNodeId(null);
    } else {
      setSelectedGenomeNodeId(node.id);
    }
  };

  // Handle edge selection
  const handleEdgeClick = (edge: GenomeEdge) => {
    if (selectedGenomeEdgeId === edge.id) {
      setSelectedGenomeEdgeId(null);
    } else {
      setSelectedGenomeEdgeId(edge.id);
    }
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <p className="section-label">08 — Structural Topology</p>
          <span className="text-[10px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
            QUANTITATIVE RELATIONSHIP MODEL
          </span>
        </div>
        <h2 className="editorial-md text-2xl mt-1">Strategy Genome</h2>
        <p className="body-sm mt-1 max-w-2xl">
          Map the structural fingerprint behind the numbers. Inspect how cross-asset correlations, annualized volatility, strategy configurations, market regimes, and macro stress responses interconnect across the research environment.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white rounded-lg border border-border">
        {/* Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-graphite-400 mr-1">Mode:</span>
          {(['MARKET', 'STRATEGY', 'REGIME', 'STRESS'] as GenomeMode[]).map(m => (
            <button
              key={m}
              onClick={() => setGenomeMode(m)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedGenomeMode === m
                  ? 'bg-graphite text-white shadow-sm'
                  : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Mode-Specific Sub-Controls */}
        <div className="flex items-center gap-3">
          {selectedGenomeMode === 'MARKET' && (
            <>
              {/* Correlation Type Toggle */}
              <div className="flex items-center gap-1 bg-ivory-200 p-0.5 rounded text-xs">
                <button
                  onClick={() => setGenomeCorrelationMode('STATIC')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    genomeCorrelationMode === 'STATIC'
                      ? 'bg-white text-graphite font-medium shadow-xs'
                      : 'text-graphite-400 hover:text-graphite'
                  }`}
                >
                  Static 5Y
                </button>
                <button
                  onClick={() => setGenomeCorrelationMode('ROLLING')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    genomeCorrelationMode === 'ROLLING'
                      ? 'bg-white text-graphite font-medium shadow-xs'
                      : 'text-graphite-400 hover:text-graphite'
                  }`}
                >
                  Rolling
                </button>
              </div>

              {/* Rolling Window */}
              {genomeCorrelationMode === 'ROLLING' && (
                <div className="flex items-center gap-1 bg-ivory-200 p-0.5 rounded text-xs font-mono">
                  {([30, 60, 90] as GenomeRollingWindow[]).map(w => (
                    <button
                      key={w}
                      onClick={() => setGenomeCorrelationWindow(w)}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        genomeCorrelationWindow === w
                          ? 'bg-graphite text-white font-medium'
                          : 'text-graphite-400 hover:text-graphite'
                      }`}
                    >
                      {w}d
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Target Asset Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-graphite-400 mr-1">Target:</span>
            {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map(a => (
              <button
                key={a}
                onClick={() => setAsset(a)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedAsset === a
                    ? 'bg-ivory-200 text-graphite font-medium border border-border'
                    : 'text-graphite-400 hover:text-graphite'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Reset Zoom */}
          <button
            onClick={() => setZoomLevel(1.0)}
            className="p-1 text-graphite-400 hover:text-graphite hover:bg-ivory-200 rounded transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout: Relationship Graph + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph Canvas Panel (8 cols) */}
        <div className="lg:col-span-8 research-card !p-0 overflow-hidden flex flex-col relative">
          <div className="px-4 py-3 border-b border-border-light flex items-center justify-between text-xs bg-white/60">
            <span className="section-label">Topology Canvas — {selectedGenomeMode} MODE</span>
            <span className="font-mono text-[11px] text-graphite-400">
              {snapshot.summary.nodeCount} Nodes · {snapshot.summary.edgeCount} Connections
            </span>
          </div>

          {/* SVG Graph Viewport */}
          <div className="relative w-full h-[380px] bg-ivory-50 flex items-center justify-center select-none overflow-hidden">
            <svg
              viewBox="0 0 600 420"
              className="w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                {/* Glow Filter */}
                <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Grid Pattern */}
              <pattern id="canvas-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.75" fill="#D5D0C5" opacity="0.6" />
              </pattern>
              <rect width="600" height="420" fill="url(#canvas-dots)" />

              {/* 1. EDGES */}
              <g className="edges-layer">
                {snapshot.edges.map(edge => {
                  const src = snapshot.nodes.find(n => n.id === edge.source);
                  const tgt = snapshot.nodes.find(n => n.id === edge.target);
                  if (!src || !tgt) return null;

                  const isSelected = selectedGenomeEdgeId === edge.id;
                  const isHovered = hoveredEdgeId === edge.id;
                  const midX = (src.x + tgt.x) / 2;
                  const midY = (src.y + tgt.y) / 2;

                  return (
                    <g
                      key={edge.id}
                      className="cursor-pointer"
                      onClick={() => handleEdgeClick(edge)}
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                    >
                      {/* Invisible wider stroke for easy click hit area */}
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke="transparent"
                        strokeWidth={16}
                      />

                      {/* Visible Edge Line */}
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={edge.color}
                        strokeWidth={isSelected ? edge.strokeWidth + 2 : isHovered ? edge.strokeWidth + 1 : edge.strokeWidth}
                        strokeDasharray={edge.isDashed ? '5,4' : undefined}
                        opacity={isSelected ? 1.0 : isHovered ? 0.9 : 0.65}
                      />

                      {/* Midpoint Value Badge */}
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x="-32"
                          y="-9"
                          width="64"
                          height="18"
                          rx="3"
                          fill="#FFFFFF"
                          stroke={isSelected ? '#1A1917' : '#E8E4DC'}
                          strokeWidth={isSelected ? 1.5 : 1}
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="9"
                          fontFamily="JetBrains Mono"
                          fill="#1A1917"
                          fontWeight={isSelected ? '600' : '500'}
                        >
                          {edge.value > 0 ? '+' : ''}{edge.value.toFixed(2)}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* 2. NODES */}
              <g className="nodes-layer">
                {snapshot.nodes.map(node => {
                  const isSelected = selectedGenomeNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className="cursor-pointer"
                      onClick={() => handleNodeClick(node)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* Outer Selection Ring */}
                      {isSelected && (
                        <circle
                          r={node.size + 6}
                          fill="none"
                          stroke="#1A1917"
                          strokeWidth="2"
                          strokeDasharray="3 2"
                        />
                      )}

                      {/* Node Body */}
                      <circle
                        r={node.size}
                        fill="#FFFFFF"
                        stroke={node.color}
                        strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 2}
                        filter={isSelected ? 'url(#node-glow)' : undefined}
                      />

                      {/* Subtle Color Dot */}
                      <circle
                        r={node.size * 0.4}
                        fill={node.color}
                        opacity="0.18"
                      />

                      {/* Node Primary Label */}
                      <text
                        textAnchor="middle"
                        y={-2}
                        fontSize="11"
                        fontFamily="Inter"
                        fontWeight="600"
                        fill="#1A1917"
                      >
                        {node.id}
                      </text>

                      {/* Node Secondary Metric Value */}
                      <text
                        textAnchor="middle"
                        y={11}
                        fontSize="8.5"
                        fontFamily="JetBrains Mono"
                        fill="#6B6560"
                      >
                        {node.value}
                      </text>

                      {/* Node Type Tag */}
                      <text
                        textAnchor="middle"
                        y={node.size + 14}
                        fontSize="9"
                        fontFamily="Inter"
                        fill="#6B6560"
                        fontWeight="500"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Graph Legend Footer */}
          <div className="px-4 py-2.5 bg-white border-t border-border-light flex flex-wrap items-center justify-between gap-3 text-[11px] text-graphite-500 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-graphite inline-block" />
                <span>Node Radius = Annualized Volatility</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-emerald-500 inline-block" />
                <span>Solid = Positive (ρ &gt; 0)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-red-500 inline-block border-dashed" style={{ borderTop: '1px dashed #EF4444' }} />
                <span>Dashed = Negative (ρ &lt; 0)</span>
              </span>
            </div>
            <span className="text-graphite-400">Click any node or connection to inspect</span>
          </div>
        </div>

        {/* Genome Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 research-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border-light pb-2 mb-3">
              <span className="section-label">Genome Inspector</span>
              <span className="text-[10px] font-mono text-graphite-400 uppercase">Live Output</span>
            </div>

            {/* If Node Selected */}
            {activeNode && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeNode.color }} />
                  <div>
                    <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
                      {activeNode.type} NODE
                    </span>
                    <h4 className="text-sm font-medium text-graphite">{activeNode.label}</h4>
                  </div>
                </div>

                <div className="divide-y divide-border-light text-xs font-mono">
                  {Object.entries(activeNode.metadata).map(([key, val]) => {
                    if (typeof val === 'object' || key === 'isSelected' || key === 'isCurrent') return null;
                    return (
                      <div key={key} className="py-2 flex items-center justify-between">
                        <span className="text-graphite-400 font-sans capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium text-graphite">
                          {typeof val === 'number' ? val.toFixed(2) : String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {activeNode.type === 'ASSET' && (
                  <button
                    onClick={() => setAsset(activeNode.id as Asset)}
                    className="btn-primary w-full !py-1.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Set Active Asset to {activeNode.id}</span>
                    <ArrowRight size={12} />
                  </button>
                )}

                {activeNode.type === 'STRATEGY' && (
                  <button
                    onClick={() => {
                      setStrategy(activeNode.id as StrategyType);
                      setActiveSection('strategy');
                    }}
                    className="btn-primary w-full !py-1.5 text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Apply &amp; Test {activeNode.label}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </motion.div>
            )}

            {/* If Edge Selected */}
            {activeEdge && !activeNode && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
                    RELATIONSHIP LINK
                  </span>
                  <h4 className="text-sm font-medium text-graphite mt-0.5">
                    {activeEdge.source} ↔ {activeEdge.target}
                  </h4>
                </div>

                <div className="p-3 bg-ivory-100 rounded border border-border-light space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-graphite-400">Measured Value:</span>
                    <span className="font-medium text-graphite">{activeEdge.formattedValue}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-graphite-400">Type:</span>
                    <span className="text-graphite font-sans">{activeEdge.relationship.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* Why this relationship explanation */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
                    Why This Relationship?
                  </span>
                  <p className="text-xs text-graphite-600 leading-relaxed bg-white p-2.5 rounded border border-border-light">
                    {activeEdge.relationship.startsWith('CORRELATION') ? (
                      activeEdge.value > 0.5 ? (
                        `Strong positive co-movement observed. Over the analyzed period, returns for ${activeEdge.source} and ${activeEdge.target} exhibited synchronized directional trends.`
                      ) : activeEdge.value < -0.2 ? (
                        `Inverse co-movement observed. ${activeEdge.source} and ${activeEdge.target} tended to move in opposite directions, suggesting diversification potential.`
                      ) : (
                        `Weak correlation indicates largely independent price behavior. Combining these assets provides effective portfolio diversification.`
                      )
                    ) : activeEdge.relationship === 'STRATEGY_LINK' ? (
                      `Exemplifies backtest execution of ${activeEdge.target} deployed on ${activeEdge.source}. Edge strength corresponds to win-rate and capture efficiency.`
                    ) : activeEdge.relationship === 'REGIME_LINK' ? (
                      `Maps performance asymmetry of ${activeEdge.source} under ${activeEdge.target} market conditions.`
                    ) : (
                      `Shows macro stress response and crisis correlation convergence under simulated market shocks.`
                    )}
                  </p>
                </div>
              </motion.div>
            )}

            {/* If Nothing Selected */}
            {!activeNode && !activeEdge && (
              <div className="py-12 text-center text-graphite-400 space-y-2">
                <Sparkles size={20} className="mx-auto text-accent mb-1" />
                <p className="text-xs font-medium text-graphite">Select a node or relationship</p>
                <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto">
                  Click any asset, strategy, regime, or correlation edge on the canvas to inspect underlying mathematical properties.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border-light flex items-center justify-between text-[11px] text-graphite-400 font-mono">
            <span>Dominant: {snapshot.summary.dominantRelationship}</span>
          </div>
        </div>
      </div>

      {/* Strategy Risk Fingerprint (5-Dimensional Radar / Quantitative Summary) */}
      <div className="research-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-light pb-2">
          <div>
            <p className="section-label">Quantitative Topology</p>
            <h3 className="text-sm font-medium text-graphite mt-0.5">
              Strategy Risk Fingerprint — {STRATEGY_LABELS[selectedStrategy]} ({ASSET_LABELS[selectedAsset]})
            </h3>
          </div>
          <span className="text-[11px] font-mono text-graphite-400">
            Normalized 0–100 Dimensional Profile (Strictly Derived)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Return Dimension */}
          <div className="p-3 bg-ivory-100 rounded border border-border-light space-y-1.5">
            <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
              Cumulative Return
            </span>
            <div className="text-base font-mono font-medium text-graphite">
              {snapshot.fingerprint.rawValues.totalReturn > 0 ? '+' : ''}
              {snapshot.fingerprint.rawValues.totalReturn.toFixed(2)}%
            </div>
            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-border-light">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${snapshot.fingerprint.returnNorm}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-graphite-400 block text-right">
              Score: {snapshot.fingerprint.returnNorm.toFixed(0)}/100
            </span>
          </div>

          {/* 2. Sharpe Dimension */}
          <div className="p-3 bg-ivory-100 rounded border border-border-light space-y-1.5">
            <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
              Sharpe Ratio (rf=4%)
            </span>
            <div className="text-base font-mono font-medium text-graphite">
              {snapshot.fingerprint.rawValues.sharpeRatio.toFixed(2)}
            </div>
            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-border-light">
              <div
                className="bg-accent h-full rounded-full"
                style={{ width: `${snapshot.fingerprint.sharpeNorm}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-graphite-400 block text-right">
              Score: {snapshot.fingerprint.sharpeNorm.toFixed(0)}/100
            </span>
          </div>

          {/* 3. Volatility Stability */}
          <div className="p-3 bg-ivory-100 rounded border border-border-light space-y-1.5">
            <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
              Volatility Stability
            </span>
            <div className="text-base font-mono font-medium text-graphite">
              {snapshot.fingerprint.rawValues.volatility.toFixed(2)}%
            </div>
            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-border-light">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${snapshot.fingerprint.volatilityNorm}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-graphite-400 block text-right">
              Stability: {snapshot.fingerprint.volatilityNorm.toFixed(0)}/100
            </span>
          </div>

          {/* 4. Drawdown Resilience */}
          <div className="p-3 bg-ivory-100 rounded border border-border-light space-y-1.5">
            <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
              Drawdown Resilience
            </span>
            <div className="text-base font-mono font-medium text-red-600">
              {snapshot.fingerprint.rawValues.maxDrawdown.toFixed(2)}%
            </div>
            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-border-light">
              <div
                className="bg-red-500 h-full rounded-full"
                style={{ width: `${snapshot.fingerprint.drawdownNorm}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-graphite-400 block text-right">
              Cushion: {snapshot.fingerprint.drawdownNorm.toFixed(0)}/100
            </span>
          </div>

          {/* 5. Trade Turnover */}
          <div className="p-3 bg-ivory-100 rounded border border-border-light space-y-1.5">
            <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
              Trade Turnover
            </span>
            <div className="text-base font-mono font-medium text-graphite">
              {snapshot.fingerprint.rawValues.tradeCount} trades
            </div>
            <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-border-light">
              <div
                className="bg-purple-500 h-full rounded-full"
                style={{ width: `${snapshot.fingerprint.turnoverNorm}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-graphite-400 block text-right">
              Frequency: {snapshot.fingerprint.turnoverNorm.toFixed(0)}/100
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
