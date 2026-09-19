import React from 'react';
import { MarketEvidenceSnapshot } from '../../../../core/research/observatory/observatoryTypes';
import { Globe, ArrowRight, TrendingUp, Activity, BarChart2, ShieldAlert } from 'lucide-react';

interface MarketEvidenceSnapshotProps {
  snapshot: MarketEvidenceSnapshot;
  onOpenMarketContext?: () => void;
}

export const MarketEvidenceSnapshotView: React.FC<MarketEvidenceSnapshotProps> = ({
  snapshot,
  onOpenMarketContext,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 04 — MARKET CONTEXT EVIDENCE</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Macro Asset Profile & Historical Dynamics: {snapshot.asset}
          </h2>
        </div>

        {onOpenMarketContext && (
          <button
            onClick={onOpenMarketContext}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border self-start sm:self-auto text-accent hover:text-accent-dark"
          >
            <span>Inspect full market analysis</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Grid of Key Empirical Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">TOTAL RETURN</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.totalReturnPct > 0 ? `+${snapshot.totalReturnPct}%` : `${snapshot.totalReturnPct}%`}
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">5-Year cumulative</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">ANNUAL RETURN</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.annualizedReturnPct > 0 ? `+${snapshot.annualizedReturnPct}%` : `${snapshot.annualizedReturnPct}%`}
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Compound CAGR</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">ANNUALIZED VOL</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.annualizedVolatilityPct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Discrete standard dev</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">SHARPE RATIO</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.sharpeRatio}
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Rf = 4.0% annualized</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">MAX DRAWDOWN</span>
          <span className="text-base md:text-lg font-mono font-semibold text-rose-600">
            {snapshot.maxDrawdownPct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Peak-to-trough</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">ROLLING 30D VOL</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.rollingVolatility30dPct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Current window</span>
        </div>
      </div>

      {/* Cross-Asset Correlation Strip */}
      <div className="p-4 bg-ivory-100 rounded-lg border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold text-graphite uppercase tracking-wider block">
            PAIRWISE PEARSON CORRELATION WITH PEERS:
          </span>
          <span className="text-xs text-graphite-500 font-sans">
            Computed over synchronized discrete log daily return vectors across full 1,825 observation sample.
          </span>
        </div>

        <div className="flex items-center gap-3">
          {Object.entries(snapshot.pairwiseCorrelations).map(([peer, corr]) => (
            <div key={peer} className="px-3 py-1.5 bg-white rounded border border-border-light text-xs font-mono">
              <span className="text-graphite-400">{snapshot.asset} ↔ {peer}: </span>
              <span className="font-semibold text-graphite">{corr > 0 ? `+${corr.toFixed(3)}` : corr.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-graphite-400">
        <span>{snapshot.provenanceDisclaimer}</span>
        <span>WINDOW: {snapshot.dataWindow.startDate} TO {snapshot.dataWindow.endDate}</span>
      </div>
    </div>
  );
};
