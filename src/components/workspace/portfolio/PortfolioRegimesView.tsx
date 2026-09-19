/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Market Regime Performance View
 */

import React, { useMemo } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { PortfolioWeights } from '../../../core/portfolio/portfolioTypes';
import { analyzePortfolioRegimes } from '../../../core/portfolio/portfolioRegimes';
import { ASSET_COLORS, Asset } from '../../../core/data';

interface PortfolioRegimesViewProps {
  weights: PortfolioWeights;
}

const REGIME_BADGES: Record<string, { bg: string; text: string }> = {
  Bull: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Bull Market' },
  Bear: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Bear Market' },
  'High Volatility': { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'High Volatility' },
  'Low Volatility': { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Low Volatility' },
};

export function PortfolioRegimesView({ weights }: PortfolioRegimesViewProps) {
  const regimeResults = useMemo(
    () => analyzePortfolioRegimes(weights),
    [weights]
  );

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Portfolio Behavior Across Macro Regimes (60-Day Rolling Filter)
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {regimeResults.map(r => {
          const badge = REGIME_BADGES[r.regime] || { bg: 'bg-ivory-100 text-graphite', text: r.regime };
          return (
            <div key={r.regime} className="border border-border rounded-lg p-3.5 bg-ivory-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg}`}>
                  {badge.text}
                </span>
                <span className="text-[10px] font-mono text-graphite-400">{r.totalDays} days</span>
              </div>

              <div className="space-y-1.5 font-mono text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-graphite-400 font-sans text-[11px]">CAGR:</span>
                  <strong className={r.cagr >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {r.cagr >= 0 ? '+' : ''}{r.cagr.toFixed(1)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-graphite-400 font-sans text-[11px]">Volatility:</span>
                  <span className="text-graphite">{r.volatility.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-graphite-400 font-sans text-[11px]">Sharpe:</span>
                  <span className="text-graphite font-bold">{r.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-graphite-400 font-sans text-[11px]">Max DD:</span>
                  <span className="text-rose-600">{r.maxDrawdown.toFixed(1)}%</span>
                </div>
              </div>

              {/* Risk Contributions during Regime */}
              <div className="pt-2 border-t border-border/50 text-[10px] font-mono">
                <span className="text-graphite-400 font-sans block mb-1">Regime Risk Share (PRC):</span>
                <div className="flex items-center justify-between text-graphite-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ASSET_COLORS.GOLD }} />
                    {r.riskContribution.GOLD}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ASSET_COLORS.BTC }} />
                    {r.riskContribution.BTC}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ASSET_COLORS.NVDA }} />
                    {r.riskContribution.NVDA}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
