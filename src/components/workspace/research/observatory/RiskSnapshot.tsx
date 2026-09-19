import React from 'react';
import { RiskSnapshotData } from '../../../../core/research/observatory/observatoryTypes';
import { ShieldAlert, ArrowRight, PieChart, Activity, AlertTriangle } from 'lucide-react';

interface RiskSnapshotProps {
  snapshot: RiskSnapshotData;
  onOpenStressLab?: () => void;
  onOpenMonteCarlo?: () => void;
  onOpenPortfolioRisk?: () => void;
}

export const RiskSnapshot: React.FC<RiskSnapshotProps> = ({
  snapshot,
  onOpenStressLab,
  onOpenMonteCarlo,
  onOpenPortfolioRisk,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 06 — RISK & STRESS PROFILE</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Unified Risk & Downside Fragility Metrics
          </h2>
        </div>

        {/* Drilldown Navigation Links */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenPortfolioRisk && (
            <button
              onClick={onOpenPortfolioRisk}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-border text-graphite-600 hover:text-graphite"
            >
              <PieChart className="w-3 h-3 text-accent" />
              <span>Portfolio Risk</span>
            </button>
          )}
          {onOpenStressLab && (
            <button
              onClick={onOpenStressLab}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-border text-graphite-600 hover:text-graphite"
            >
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              <span>Stress Lab</span>
            </button>
          )}
          {onOpenMonteCarlo && (
            <button
              onClick={onOpenMonteCarlo}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-border text-graphite-600 hover:text-graphite"
            >
              <Activity className="w-3 h-3 text-emerald-500" />
              <span>Monte Carlo</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Risk Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">VOLATILITY</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.volatilityPct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Annualized $\sigma$</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">SHARPE RATIO</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.sharpeRatio}
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Risk-adjusted</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">MAX DRAWDOWN</span>
          <span className="text-base md:text-lg font-mono font-semibold text-rose-600">
            {snapshot.maxDrawdownPct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Historical peak</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">PARAMETRIC VAR 95</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.var95Pct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">1-Day horizon</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">PARAMETRIC CVAR 95</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.cvar95Pct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Expected shortfall</span>
        </div>

        <div className="p-3 bg-rose-50/50 rounded border border-rose-200/60">
          <span className="text-[10px] font-mono text-rose-700 uppercase tracking-wider block">STRESS DAMAGE</span>
          <span className="text-base md:text-lg font-mono font-semibold text-rose-700">
            {snapshot.stressDamagePct}%
          </span>
          <span className="text-[10px] font-mono text-rose-600 block mt-0.5">COVID-2020 shock</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block">MC DOWNSIDE FREQ</span>
          <span className="text-base md:text-lg font-mono font-semibold text-graphite">
            {snapshot.monteCarloDownsideFrequencyPct}%
          </span>
          <span className="text-[10px] font-mono text-graphite-400 block mt-0.5">Prob(loss &gt; 0)</span>
        </div>
      </div>

      {/* Euler Risk Contribution Strip */}
      <div className="p-4 bg-ivory-100 rounded-lg border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold text-graphite uppercase tracking-wider block">
            EULER PERCENTAGE RISK DECOMPOSITION ($%RC_i$):
          </span>
          <span className="text-xs text-graphite-500 font-sans">
            Marginal contribution to total portfolio risk satisfying Euler's homogeneous degree-1 relation $\sum %RC_i = 100\%$.
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          {Object.entries(snapshot.eulerRiskContributionPct).map(([asset, pct]) => (
            <div key={asset} className="px-3 py-1.5 bg-white rounded border border-border-light flex items-center gap-1.5">
              <span className="text-graphite-400">{asset}:</span>
              <span className="font-semibold text-graphite">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
