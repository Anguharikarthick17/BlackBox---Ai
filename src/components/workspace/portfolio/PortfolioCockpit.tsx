/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Intelligence & Optimization Cockpit
 *
 * Master container integrating:
 * 1. Asset Universe & Allocation Controls
 * 2. Institutional Portfolio Metrics (CAGR, Vol, Sharpe, VaR95, CVaR95)
 * 3. Euler Risk Decomposition (Marginal & Component Risk)
 * 4. Deterministic Optimizer Lab (Max Sharpe, Min Vol, Risk Parity, Target Return)
 * 5. Monotonic Efficient Frontier & Capital Allocation Line (CAL)
 * 6. Historical Portfolio Backtest with Rebalance Schedules & Friction
 * 7. Multi-Asset Macro Stress Lab Integration
 * 8. Regime-Dependent Performance & Risk Allocation
 */

import React, { useState, useMemo } from 'react';
import { Layers, PieChart, Sparkles, BookOpen, Scale } from 'lucide-react';
import {
  PortfolioWeights,
  DEFAULT_PORTFOLIO_WEIGHTS,
} from '../../../core/portfolio/portfolioTypes';
import { computePortfolioMetrics } from '../../../core/portfolio/covariance';
import { computeRiskContribution } from '../../../core/portfolio/riskContribution';
import { ASSET_COLORS, Asset } from '../../../core/data';
import { AllocationControls } from './AllocationControls';
import { PortfolioMetricsView } from './PortfolioMetricsView';
import { RiskContributionView } from './RiskContributionView';
import { OptimizationLab } from './OptimizationLab';
import { EfficientFrontierView } from './EfficientFrontierView';
import { PortfolioBacktestView } from './PortfolioBacktestView';
import { PortfolioStressView } from './PortfolioStressView';
import { PortfolioRegimesView } from './PortfolioRegimesView';
import { MonteCarloLab } from './MonteCarloLab';
import { RegimeIntelligenceLab } from './RegimeIntelligenceLab';
import { PortfolioErrorBoundary } from './PortfolioErrorBoundary';

import { useResearchStore } from '../../../store/researchStore';
import { validateWeights } from '../../../core/portfolio/portfolioTypes';

export function PortfolioCockpit() {
  const [weights, setWeights] = useState<PortfolioWeights>(DEFAULT_PORTFOLIO_WEIGHTS);
  const selectedAsset = useResearchStore((s) => s.selectedAsset);
  const setAsset = useResearchStore((s) => s.setAsset);

  // Safely normalize weights for calculation engines that require simplex coordinates w in Delta^2
  const normalizedWeights = useMemo(() => {
    return validateWeights(weights).normalizedWeights;
  }, [weights]);

  const metrics = useMemo(() => computePortfolioMetrics(normalizedWeights), [normalizedWeights]);
  const riskContribution = useMemo(() => computeRiskContribution(normalizedWeights), [normalizedWeights]);

  return (
    <PortfolioErrorBoundary onReset={() => setWeights(DEFAULT_PORTFOLIO_WEIGHTS)}>
      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Cockpit Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-graphite rounded-sm flex items-center justify-center">
              <PieChart size={13} className="text-white" />
            </div>
            <h1 className="text-sm font-bold text-graphite uppercase tracking-wider">
              Portfolio Intelligence & Optimization Lab
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-graphite text-white font-medium">
              PHASE 3.7
            </span>
          </div>
          <p className="text-xs text-graphite-400 mt-1">
            Multi-Asset Portfolio Construction • Euler Risk Decomposition • Deterministic Convex Optimization • Efficient Frontier
          </p>
        </div>

        {/* Global Universe Tag (Interactive Asset Buttons) */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {([
            { id: 'GOLD', label: 'Gold (XAU)', color: '#E5A93C' },
            { id: 'BTC', label: 'Bitcoin (BTC)', color: '#F7931A' },
            { id: 'NVDA', label: 'NVIDIA (NVDA)', color: '#76B900' },
          ] as const).map(({ id, label, color }) => {
            const is100 = weights[id] >= 0.99;
            const isSelected = selectedAsset === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setWeights({
                    GOLD: id === 'GOLD' ? 1.0 : 0.0,
                    BTC: id === 'BTC' ? 1.0 : 0.0,
                    NVDA: id === 'NVDA' ? 1.0 : 0.0,
                  });
                  setAsset(id);
                }}
                title={`Click to set 100% allocation to ${label}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all cursor-pointer ${
                  is100 || isSelected
                    ? 'bg-white border-graphite text-graphite shadow-xs font-bold'
                    : 'bg-white/80 border-border text-graphite-500 hover:border-graphite/50 hover:text-graphite'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spatial Divergence: Capital Allocation vs Euler Risk Decomposition */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-graphite uppercase">
              Capital Weight vs. Euler Risk Decomposition
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream border border-border text-taupe-dark font-medium">
              EULER IDENTITY VERIFIED
            </span>
          </div>
          <div className="text-[11px] font-mono text-taupe">
            Nominal Capital w_i does NOT equal Effective Portfolio Risk Contribution RC_i
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['GOLD', 'BTC', 'NVDA'] as const).map(asset => {
            const capWeight = Math.max(0, (weights[asset] || 0) * 100);
            const rawRisk = (riskContribution?.percentageRisk?.[asset] ?? 0) * 100;
            const riskWeight = Math.abs(rawRisk) < 0.001 ? 0 : rawRisk;
            const diff = riskWeight - capWeight;
            const isRiskDominant = diff > 5;
            const isDampener = diff < -5;

            return (
              <div
                key={asset}
                onClick={() =>
                  setWeights({
                    GOLD: asset === 'GOLD' ? 1.0 : 0.0,
                    BTC: asset === 'BTC' ? 1.0 : 0.0,
                    NVDA: asset === 'NVDA' ? 1.0 : 0.0,
                  })
                }
                title={`Click to set 100% allocation to ${asset}`}
                className="border border-border/80 rounded-md p-3.5 bg-ivory-50/70 hover:border-graphite/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ backgroundColor: ASSET_COLORS[asset] }}
                    />
                    <span className="font-mono text-xs font-bold text-graphite">{asset}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isRiskDominant
                        ? 'bg-crimson/10 text-crimson border border-crimson/20'
                        : isDampener
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-graphite/5 text-graphite border border-border'
                    }`}
                  >
                    {isRiskDominant ? 'RISK AMPLIFIER' : isDampener ? 'RISK DAMPENER' : 'BALANCED'}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-taupe">
                    <span>Nominal Capital Weight:</span>
                    <span className="font-bold text-graphite">{capWeight.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-cream-300 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, capWeight))}%`, backgroundColor: ASSET_COLORS[asset] }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-taupe pt-1">
                    <span>Euler Risk Contribution:</span>
                    <span className="font-bold text-crimson">{riskWeight.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-cream-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-crimson rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, riskWeight))}%` }}
                    />
                  </div>

                  <div className="pt-2 text-[10px] text-taupe border-t border-border/50 flex justify-between">
                    <span>Risk/Capital Divergence:</span>
                    <span className={`font-bold ${diff > 0 ? 'text-crimson' : 'text-emerald-700'}`}>
                      {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 1: Allocation Sliders & Euler Risk Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AllocationControls
          weights={weights}
          onChange={setWeights}
          onApplyPreset={setWeights}
        />
        <RiskContributionView
          weights={normalizedWeights}
          riskContribution={riskContribution}
        />
      </div>

      {/* Row 2: Institutional Quantitative Metrics & Provenance */}
      <PortfolioMetricsView metrics={metrics} />

      {/* Row 3: Deterministic Optimization Lab */}
      <OptimizationLab onApplyAllocation={setWeights} />

      {/* Row 4: Efficient Frontier & Capital Allocation Line */}
      <EfficientFrontierView currentWeights={normalizedWeights} />

      {/* Row 5: Rebalancing Backtest & Turnover Friction */}
      <PortfolioBacktestView weights={normalizedWeights} />

      {/* Row 6: Monte Carlo & Probabilistic Risk Intelligence */}
      <MonteCarloLab weights={normalizedWeights} />

      {/* Row 7: Regime-Aware Probabilistic Intelligence Lab (Phase 3.9) */}
      <RegimeIntelligenceLab weights={normalizedWeights} />

      {/* Row 8: Market Regime Breakdown & Stress Replay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioRegimesView weights={normalizedWeights} />
        <PortfolioStressView weights={normalizedWeights} />
      </div>
      </div>
    </PortfolioErrorBoundary>
  );
}
