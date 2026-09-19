/**
 * BLACKBOX X — Phase 3.7
 * Euler Risk Contribution Breakdown View
 */

import React from 'react';
import { PieChart, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { RiskContribution, PortfolioWeights } from '../../../core/portfolio/portfolioTypes';
import { ASSET_COLORS, Asset } from '../../../core/data';

interface RiskContributionViewProps {
  weights: PortfolioWeights;
  riskContribution: RiskContribution;
}

const ASSET_NAMES: Record<Asset, string> = {
  GOLD: 'Gold (XAU)',
  BTC: 'Bitcoin (BTC)',
  NVDA: 'NVIDIA (NVDA)',
};

export function RiskContributionView({
  weights,
  riskContribution,
}: RiskContributionViewProps) {
  const assets: Asset[] = ['GOLD', 'BTC', 'NVDA'];
  const { marginalRisk, componentRisk, percentageRisk, eulerSumCrc, portfolioVolatility, isEulerSumVerified } =
    riskContribution;

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Euler Risk Decomposition (Σ CRC_i = σ_p)
          </h3>
        </div>
        <div>
          {isEulerSumVerified ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <CheckCircle2 size={12} /> Euler Sum Identity Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              <AlertTriangle size={12} /> Tolerance Check
            </span>
          )}
        </div>
      </div>

      {/* Comparison Bars: Capital Weight vs Risk Contribution */}
      <div className="space-y-4 mb-6">
        {assets.map(asset => {
          const capPct = (weights[asset] || 0) * 100;
          const riskPct = (percentageRisk[asset] || 0) * 100;
          const isRiskAmplified = riskPct > capPct + 5;

          return (
            <div key={asset} className="border border-border/60 rounded-md p-3 bg-ivory-50/50">
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ASSET_COLORS[asset] }}
                  />
                  <span className="font-medium text-graphite">{ASSET_NAMES[asset]}</span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px]">
                  <span className="text-graphite-500">
                    Cap: <strong className="text-graphite">{capPct.toFixed(1)}%</strong>
                  </span>
                  <span className="text-graphite-500">
                    Risk:{' '}
                    <strong className={isRiskAmplified ? 'text-amber-600 font-bold' : 'text-graphite'}>
                      {riskPct.toFixed(1)}%
                    </strong>
                  </span>
                </div>
              </div>

              {/* Stacked comparison bar */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-graphite-400">
                  <span className="w-16">Capital:</span>
                  <div className="flex-1 bg-ivory-300 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, capPct))}%`,
                        backgroundColor: ASSET_COLORS[asset],
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-graphite-400">
                  <span className="w-16 font-medium text-graphite">Risk Share:</span>
                  <div className="flex-1 bg-ivory-300 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, riskPct))}%`,
                        backgroundColor: ASSET_COLORS[asset],
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Exact Marginal & Component Risk figures */}
              <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-graphite-400">
                <span>MRC (∂σ/∂w): {marginalRisk[asset]?.toFixed(4)}</span>
                <span>CRC (w·MRC): {(componentRisk[asset] * 100)?.toFixed(2)}% vol</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Euler Theorem Verification Footer */}
      <div className="bg-ivory-100/70 border border-border/80 rounded-md p-2.5 text-[11px] flex flex-wrap items-center justify-between gap-2 text-graphite-500 font-mono">
        <div>
          Σ CRC_i = <strong className="text-graphite">{(eulerSumCrc * 100).toFixed(2)}%</strong>
        </div>
        <div>
          Portfolio σ_p = <strong className="text-graphite">{(portfolioVolatility * 100).toFixed(2)}%</strong>
        </div>
        <div>
          Σ PRC_i = <strong className="text-graphite">{(riskContribution.eulerSumPrc * 100).toFixed(2)}%</strong>
        </div>
      </div>
    </div>
  );
}
