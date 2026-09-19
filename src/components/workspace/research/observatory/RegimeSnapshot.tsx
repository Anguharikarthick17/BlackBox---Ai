import React from 'react';
import { RegimeSnapshotData } from '../../../../core/research/observatory/observatoryTypes';
import { Activity, ShieldAlert, BarChart3, AlertCircle } from 'lucide-react';

interface RegimeSnapshotProps {
  snapshot: RegimeSnapshotData;
  onOpenRegimes?: () => void;
}

export const RegimeSnapshot: React.FC<RegimeSnapshotProps> = ({
  snapshot,
  onOpenRegimes,
}) => {
  const getRegimeColor = (regime: string) => {
    switch (regime) {
      case 'BULL':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'BEAR':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'HIGH_VOLATILITY':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 07 — REGIME INTELLIGENCE & PERFORMANCE</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Market State Conditioning: {snapshot.asset}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-graphite-400">ACTIVE REGIME:</span>
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border uppercase ${getRegimeColor(snapshot.activeRegime)}`}>
            {snapshot.activeRegime.replace('_', ' ')}
          </span>
          {onOpenRegimes && (
            <button
              onClick={onOpenRegimes}
              className="btn-ghost text-xs px-2.5 py-1 border border-border ml-2 text-accent hover:text-accent-dark"
            >
              Regime Lab →
            </button>
          )}
        </div>
      </div>

      {/* Regime Sub-period Performance Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-ivory-50 text-[11px] font-mono text-graphite-400 uppercase">
              <th className="py-2.5 px-3">REGIME</th>
              <th className="py-2.5 px-3">CUMULATIVE RETURN</th>
              <th className="py-2.5 px-3">ANNUAL VOLATILITY</th>
              <th className="py-2.5 px-3">SUB-PERIOD SHARPE</th>
              <th className="py-2.5 px-3">WIN RATE</th>
              <th className="py-2.5 px-3">SAMPLE DURATION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light font-mono">
            {snapshot.regimePerformance.map(row => (
              <tr key={row.regime} className="hover:bg-ivory-50 transition-colors">
                <td className="py-2.5 px-3 font-semibold text-graphite">
                  <span className={`px-2 py-0.5 rounded border text-[11px] ${getRegimeColor(row.regime)}`}>
                    {row.regime.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-graphite">
                  {row.returnPct > 0 ? `+${row.returnPct}%` : `${row.returnPct}%`}
                </td>
                <td className="py-2.5 px-3 text-graphite">{row.volatilityPct}%</td>
                <td className="py-2.5 px-3 font-semibold text-graphite">{row.sharpeRatio}</td>
                <td className="py-2.5 px-3 text-graphite">{row.winRatePct}%</td>
                <td className="py-2.5 px-3 text-graphite-400">{row.durationDays} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Triple Population Contrast (Historical vs Unconditional MC vs Regime-Conditioned MC) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-ivory-100 rounded-lg border border-border">
        <div className="p-3 bg-white rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
            1. HISTORICAL SHARPE (ALL BARS)
          </span>
          <span className="text-xl font-mono font-semibold text-graphite mt-1 block">
            {snapshot.historicalSharpe}
          </span>
          <span className="text-[11px] text-graphite-500 font-sans mt-0.5 block">
            Observed across 2019–2023 sample with static return distribution.
          </span>
        </div>

        <div className="p-3 bg-white rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">
            2. UNCONDITIONAL MC SHARPE
          </span>
          <span className="text-xl font-mono font-semibold text-graphite mt-1 block">
            {snapshot.unconditionalMonteCarloSharpe}
          </span>
          <span className="text-[11px] text-graphite-500 font-sans mt-0.5 block">
            Median across stationary joint bootstrap paths with random state sampling.
          </span>
        </div>

        <div className="p-3 bg-white rounded border border-border-light">
          <span className="text-[10px] font-mono text-rose-700 uppercase tracking-wider block">
            3. REGIME-CONDITIONED MC SHARPE
          </span>
          <span className="text-xl font-mono font-semibold text-rose-700 mt-1 block">
            {snapshot.regimeConditionedMonteCarloSharpe}
          </span>
          <span className="text-[11px] text-graphite-500 font-sans mt-0.5 block">
            Conditioned on starting in HIGH VOLATILITY with empirical Markov transitions.
          </span>
        </div>
      </div>
    </div>
  );
};
