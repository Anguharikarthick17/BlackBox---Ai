import React from 'react';
import { MonteCarloSnapshotData } from '../../../../core/research/observatory/observatoryTypes';
import { Activity, ArrowRight, ShieldCheck, AlertCircle, BarChart3 } from 'lucide-react';

interface MonteCarloSnapshotProps {
  snapshot: MonteCarloSnapshotData;
  onOpenMonteCarlo?: () => void;
}

export const MonteCarloSnapshot: React.FC<MonteCarloSnapshotProps> = ({
  snapshot,
  onOpenMonteCarlo,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">PROBABILISTIC RISK — MONTE CARLO SNAPSHOT</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Simulation Trajectory Fan & Terminal Wealth Distribution
          </h2>
        </div>

        {onOpenMonteCarlo && (
          <button
            onClick={onOpenMonteCarlo}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border text-emerald-600 hover:text-emerald-700"
          >
            <span>Open Monte Carlo Lab</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Mandatory Forecast Disclaimer */}
      <div className="mb-6 p-3 bg-ivory-100 border border-border rounded text-xs font-mono text-graphite-600 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-accent" />
        <span>{snapshot.simulationDisclaimer}</span>
      </div>

      {/* Configuration Strip */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-3 bg-ivory-50 rounded border border-border-light text-xs font-mono text-graphite-500">
        <span>METHOD: <strong className="text-graphite">{snapshot.method}</strong></span>
        <span>PATHS: <strong className="text-graphite">{snapshot.pathCount.toLocaleString()}</strong></span>
        <span>HORIZON: <strong className="text-graphite">{snapshot.horizonDays} days (1 Year)</strong></span>
        <span>SEED: <strong className="text-graphite">{snapshot.seed}</strong></span>
        <span>REBALANCE: <strong className="text-graphite">{snapshot.rebalancingFrequency}</strong></span>
      </div>

      {/* Terminal Wealth Percentiles Fan (P05..P95) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 font-mono text-xs">
        <div className="p-3 bg-rose-50/50 rounded border border-rose-200/60">
          <span className="text-[10px] text-rose-700 uppercase block">5TH PERCENTILE (P05)</span>
          <span className="text-base font-semibold text-rose-700">
            ${snapshot.terminalPercentiles.p05.toLocaleString()}
          </span>
          <span className="text-[10px] text-rose-600 block mt-0.5">Severe tail outcome</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">25TH PERCENTILE (P25)</span>
          <span className="text-base font-semibold text-graphite">
            ${snapshot.terminalPercentiles.p25.toLocaleString()}
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Lower quartile</span>
        </div>

        <div className="p-3 bg-blue-50/50 rounded border border-blue-200/60">
          <span className="text-[10px] text-blue-700 uppercase block">MEDIAN (P50)</span>
          <span className="text-base font-semibold text-blue-800">
            ${snapshot.terminalPercentiles.p50.toLocaleString()}
          </span>
          <span className="text-[10px] text-blue-600 block mt-0.5">50th percentile</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">75TH PERCENTILE (P75)</span>
          <span className="text-base font-semibold text-graphite">
            ${snapshot.terminalPercentiles.p75.toLocaleString()}
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Upper quartile</span>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded border border-emerald-200/60">
          <span className="text-[10px] text-emerald-700 uppercase block">95TH PERCENTILE (P95)</span>
          <span className="text-base font-semibold text-emerald-800">
            ${snapshot.terminalPercentiles.p95.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Favorable tail</span>
        </div>
      </div>

      {/* Downside & Loss Probabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-ivory-100 rounded border border-border-light font-mono text-xs">
        <div>
          <span className="text-graphite-400 uppercase text-[10px] block">MEDIAN DRAWDOWN:</span>
          <span className="text-sm font-semibold text-graphite">{snapshot.medianDrawdownPct}%</span>
        </div>
        <div>
          <span className="text-graphite-400 uppercase text-[10px] block">PROBABILITY OF NET LOSS:</span>
          <span className="text-sm font-semibold text-rose-600">{snapshot.probabilityLossPct}%</span>
        </div>
        <div>
          <span className="text-graphite-400 uppercase text-[10px] block">FREQ(DRAWDOWN &gt; 20%):</span>
          <span className="text-sm font-semibold text-graphite">{snapshot.drawdownExceedance20Pct}%</span>
        </div>
      </div>
    </div>
  );
};
