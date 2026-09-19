import React from 'react';
import { Asset } from '../../../../core/data';
import { StrategyType } from '../../../../core/strategies';
import { Network, ArrowRight, Dna, Activity, Shield, Layers } from 'lucide-react';

interface GenomeSnapshotProps {
  asset?: Asset;
  strategy?: StrategyType;
  onOpenGenome?: () => void;
}

export const GenomeSnapshot: React.FC<GenomeSnapshotProps> = ({
  asset = 'BTC',
  strategy = 'EMA_TREND',
  onOpenGenome,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">STRATEGY GENOME TOPOLOGY</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Interconnected Quantitative DNA: {asset} • {strategy.replace('_', ' ')}
          </h2>
        </div>

        {onOpenGenome && (
          <button
            onClick={onOpenGenome}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border text-accent hover:text-accent-dark"
          >
            <Dna className="w-3.5 h-3.5" />
            <span>Explore Strategy Genome</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 4 Core Genome Nodes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 font-mono text-xs">
        <div className="p-4 bg-ivory-50 rounded-lg border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-graphite-400 mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[10px] uppercase tracking-wider">ASSET DOMAIN</span>
          </div>
          <span className="text-base font-semibold text-graphite">{asset}</span>
          <span className="text-[10px] text-graphite-400 mt-1">Daily OHLCV • 1,825 bars</span>
        </div>

        <div className="p-4 bg-ivory-50 rounded-lg border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-graphite-400 mb-2">
            <Activity className="w-3.5 h-3.5 text-accent" />
            <span className="text-[10px] uppercase tracking-wider">STRATEGY FAMILY</span>
          </div>
          <span className="text-base font-semibold text-graphite">{strategy}</span>
          <span className="text-[10px] text-graphite-400 mt-1">Trend Following • Discrete</span>
        </div>

        <div className="p-4 bg-ivory-50 rounded-lg border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-graphite-400 mb-2">
            <Network className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] uppercase tracking-wider">REGIME SENSITIVITY</span>
          </div>
          <span className="text-base font-semibold text-graphite">HIGH VOLATILITY</span>
          <span className="text-[10px] text-graphite-400 mt-1">Asymmetric Sharpe drag</span>
        </div>

        <div className="p-4 bg-ivory-50 rounded-lg border border-border flex flex-col justify-between">
          <div className="flex items-center gap-2 text-graphite-400 mb-2">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-[10px] uppercase tracking-wider">RISK FOOTPRINT</span>
          </div>
          <span className="text-base font-semibold text-graphite">-31.2% MAX DD</span>
          <span className="text-[10px] text-graphite-400 mt-1">Drawdown recovery: 142d</span>
        </div>
      </div>

      <div className="p-3 bg-ivory-100 rounded border border-border-light text-[11px] font-mono text-graphite-500 flex items-center justify-between">
        <span>Topology mapping preserves cross-engine relationship bonds between quantitative factors.</span>
        <span className="text-graphite-400">Non-causal relational graph</span>
      </div>
    </div>
  );
};
