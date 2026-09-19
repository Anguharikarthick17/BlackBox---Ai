/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Multi-Asset Stress Testing View
 */

import React, { useState, useMemo } from 'react';
import { ShieldAlert, AlertTriangle, ArrowDownRight, RotateCcw } from 'lucide-react';
import { PortfolioWeights } from '../../../core/portfolio/portfolioTypes';
import { runPortfolioStressTest } from '../../../core/portfolio/portfolioStress';
import { StressScenarioId } from '../../../core/stressTesting';
import { ASSET_COLORS, Asset } from '../../../core/data';

interface PortfolioStressViewProps {
  weights: PortfolioWeights;
}

export function PortfolioStressView({ weights }: PortfolioStressViewProps) {
  const [scenarioId, setScenarioId] = useState<Exclude<StressScenarioId, 'CUSTOM'>>('COVID_2020');

  const stressResult = useMemo(
    () => runPortfolioStressTest(weights, scenarioId),
    [weights, scenarioId]
  );

  const scenarios: { id: Exclude<StressScenarioId, 'CUSTOM'>; label: string; desc: string }[] = [
    {
      id: 'COVID_2020',
      label: '2020 COVID Crash',
      desc: 'Violent multi-asset liquidity flush & fast V-recovery',
    },
    {
      id: 'GFC_2008',
      label: '2008 GFC',
      desc: 'Systemic liquidity contagion & prolonged deleveraging',
    },
    {
      id: 'RATE_SHOCK_2022',
      label: '2022 Rate Hike',
      desc: 'Persistent multiple compression & duration shock',
    },
    {
      id: 'CRYPTO_CRASH',
      label: 'Crypto Contagion',
      desc: 'Asymmetric leverage unwind isolated to crypto',
    },
  ];

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Macro Shock Replay (Stress Lab Integration)
          </h3>
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {scenarios.map(sc => {
          const isSelected = scenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => setScenarioId(sc.id)}
              className={`p-3 rounded text-left transition-all border ${
                isSelected
                  ? 'border-graphite bg-ivory-100 shadow-sm'
                  : 'border-border bg-white hover:bg-ivory-50 text-graphite-500'
              }`}
            >
              <div className="font-semibold text-xs text-graphite">{sc.label}</div>
              <p className="text-[10px] text-graphite-400 mt-0.5 line-clamp-1">{sc.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs font-mono">
        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Stressed Return
          </span>
          <span className="text-sm font-bold text-rose-600">
            {stressResult.stressedReturn.toFixed(2)}%
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">
            Base: {stressResult.baselineReturn.toFixed(2)}%
          </span>
        </div>

        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Stressed Max Drawdown
          </span>
          <span className="text-sm font-bold text-rose-600">
            {stressResult.stressedDrawdown.toFixed(2)}%
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">
            Trough impact
          </span>
        </div>

        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Stressed Sharpe
          </span>
          <span className="text-sm font-bold text-graphite">
            {stressResult.stressedSharpe.toFixed(2)}
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">
            Under expanded vol
          </span>
        </div>

        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Recovery Horizon
          </span>
          <span className="text-sm font-bold text-graphite">
            {stressResult.recoveryDays} days
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">
            To baseline trajectory
          </span>
        </div>
      </div>

      {/* Asset Damage Contributions */}
      <div className="border border-border/70 rounded-md p-3 bg-ivory-50/50 mb-3">
        <span className="text-[10px] font-semibold text-graphite-400 uppercase tracking-wider block mb-2">
          Asset Loss Contribution to Portfolio Drawdown
        </span>
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map(asset => (
            <div key={asset} className="flex items-center justify-between p-2 rounded bg-white border border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[asset] }} />
                <span>{asset}:</span>
              </div>
              <strong className="text-graphite">
                {stressResult.damageContribution[asset].toFixed(1)}%
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="bg-ivory-100 border border-border/70 rounded px-3 py-2 text-[10px] text-graphite-500 flex items-center gap-2">
        <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
        <span>{stressResult.disclaimer}</span>
      </div>
    </div>
  );
}
