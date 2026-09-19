import React from 'react';
import { ResearchCase } from '../../../../core/research/audit/auditTypes';
import { ShieldCheck, Clock, Layers, Hash, Activity, RefreshCw } from 'lucide-react';

interface ObservatoryHeaderProps {
  researchCase: ResearchCase | null;
  isRunning?: boolean;
  onReset?: () => void;
  onRefreshReplay?: () => void;
}

export const ObservatoryHeader: React.FC<ObservatoryHeaderProps> = ({
  researchCase,
  isRunning = false,
  onReset,
  onRefreshReplay,
}) => {
  if (!researchCase) {
    return (
      <div className="border-b border-border bg-white p-6 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-accent inline-block animate-pulse" />
              <span className="text-xs font-mono font-semibold tracking-wider text-graphite-400 uppercase">
                BLACKBOX X — RESEARCH OBSERVATORY
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light text-graphite tracking-tight">
              Institutional Research Environment
            </h1>
            <p className="text-xs md:text-sm text-graphite-400 mt-1 max-w-2xl font-normal leading-relaxed">
              Investigate asset behaviour, deconstruct strategy performance, stress-test hypotheses,
              and inspect reproducible evidence across deterministic quantitative engines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-ivory-200 text-graphite-400 border border-border text-xs font-mono rounded">
              STATUS: READY TO RESEARCH
            </span>
          </div>
        </div>
      </div>
    );
  }

  const manifest = researchCase.manifest;
  const statusColor =
    researchCase.status === 'REPLAY_VERIFIED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : researchCase.status === 'SEALED'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : researchCase.status === 'REPLAY_DIVERGENT' || researchCase.status === 'REVOKED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <div className="border-b border-border bg-white p-6 md:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-accent inline-block" />
              <span className="text-xs font-mono font-semibold tracking-wider text-graphite-400 uppercase">
                RESEARCH OBSERVATORY
              </span>
              <span className="text-xs text-graphite-300">•</span>
              <span className="text-xs font-mono font-bold text-graphite bg-ivory-200 px-2 py-0.5 rounded border border-border">
                {researchCase.caseId}
              </span>
              <span className={`text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${statusColor}`}>
                {researchCase.status}
              </span>
              {isRunning && (
                <span className="flex items-center gap-1.5 text-xs font-mono text-accent bg-blue-50 px-2 py-0.5 rounded border border-blue-100 animate-pulse">
                  <Activity className="w-3 h-3 animate-spin" /> RUNNING EXPERIMENTS
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl lg:text-3xl font-light text-graphite tracking-tight">
              "{researchCase.question}"
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRefreshReplay && (
              <button
                onClick={onRefreshReplay}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border"
                title="Re-run deterministic replay"
              >
                <RefreshCw className="w-3.5 h-3.5 text-graphite-400" />
                <span>Replay</span>
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="btn-ghost text-xs px-3 py-1.5 text-graphite-400 hover:text-graphite border border-border"
              >
                New Inquiry
              </button>
            )}
          </div>
        </div>

        {/* Institutional Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-border-light text-xs font-mono">
          <div className="p-2.5 bg-ivory-100 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 uppercase tracking-wider block">DATA WINDOW</span>
            <span className="font-semibold text-graphite">
              {manifest.data.startDate.substring(0, 4)}–{manifest.data.endDate.substring(0, 4)}
            </span>
            <span className="text-[10px] text-graphite-400 block mt-0.5">
              {manifest.data.observationCount.toLocaleString()} synchronized bars
            </span>
          </div>

          <div className="p-2.5 bg-ivory-100 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 uppercase tracking-wider block">ASSET UNIVERSE</span>
            <span className="font-semibold text-graphite">
              {manifest.data.assetUniverse.join(' / ')}
            </span>
            <span className="text-[10px] text-graphite-400 block mt-0.5">Primary: BTC</span>
          </div>

          <div className="p-2.5 bg-ivory-100 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 uppercase tracking-wider block">STRATEGY</span>
            <span className="font-semibold text-graphite">
              {manifest.strategy.strategy.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-graphite-400 block mt-0.5">Param: Fast 12 / Slow 26</span>
          </div>

          <div className="p-2.5 bg-ivory-100 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 uppercase tracking-wider block">EXECUTION</span>
            <span className="font-semibold text-graphite">NEXT-BAR CLOSE</span>
            <span className="text-[10px] text-graphite-400 block mt-0.5">Zero look-ahead bias</span>
          </div>

          <div className="p-2.5 bg-ivory-100 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 uppercase tracking-wider block">TRANSACTION COST</span>
            <span className="font-semibold text-graphite">
              {manifest.strategy.transactionCostBps} bps
            </span>
            <span className="text-[10px] text-graphite-400 block mt-0.5">Per-turn execution fee</span>
          </div>

          <div className="p-2.5 bg-ivory-100 rounded border border-border-light">
            <span className="text-[10px] text-graphite-400 uppercase tracking-wider block">FINGERPRINT</span>
            <span className="font-semibold text-accent truncate block" title={researchCase.reproducibilityMetadata.canonicalOutputFingerprint}>
              {researchCase.reproducibilityMetadata.canonicalOutputFingerprint.substring(0, 12)}…
            </span>
            <span className="text-[10px] text-graphite-400 block mt-0.5">Canonical Output SHA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
