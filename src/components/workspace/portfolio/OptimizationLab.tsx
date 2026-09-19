/**
 * BLACKBOX X — Phase 3.7
 * Deterministic Portfolio Optimization Lab
 */

import React, { useState } from 'react';
import { Cpu, Check, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  OptimizationObjective,
  OptimizationResult,
  PortfolioWeights,
} from '../../../core/portfolio/portfolioTypes';
import { optimizePortfolio, OPTIMIZER_METHOD_DESCRIPTION } from '../../../core/portfolio/optimizer';
import { ASSET_COLORS } from '../../../core/data';

interface OptimizationLabProps {
  onApplyAllocation: (weights: PortfolioWeights) => void;
}

export function OptimizationLab({ onApplyAllocation }: OptimizationLabProps) {
  const [selectedObjective, setSelectedObjective] =
    useState<OptimizationObjective>('MAX_SHARPE');
  const [targetReturnPct, setTargetReturnPct] = useState<number>(25.0);
  const [result, setResult] = useState<OptimizationResult>(() =>
    optimizePortfolio('MAX_SHARPE')
  );

  const handleSolve = (obj: OptimizationObjective = selectedObjective) => {
    setSelectedObjective(obj);
    const res = optimizePortfolio(obj, targetReturnPct);
    setResult(res);
  };

  const objectives: { id: OptimizationObjective; label: string; desc: string }[] = [
    {
      id: 'MAX_SHARPE',
      label: 'Maximum Sharpe',
      desc: 'Maximize excess return per unit risk (Tangency Portfolio, Rf=4%)',
    },
    {
      id: 'MIN_VOLATILITY',
      label: 'Minimum Volatility',
      desc: 'Minimize portfolio variance wᵀΣw (Global Minimum Variance)',
    },
    {
      id: 'RISK_PARITY',
      label: 'Risk Parity',
      desc: 'Equalize percentage risk contributions (PRC_i ≈ 33.3%)',
    },
    {
      id: 'TARGET_RETURN',
      label: 'Target Return',
      desc: 'Minimize volatility subject to hurdle return wᵀμ ≥ R_target',
    },
  ];

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Deterministic Optimization Lab
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-ivory-200 text-graphite-600 px-2 py-0.5 rounded border border-border">
          Simplex Grid (δ=0.005) + Local Refinement
        </span>
      </div>

      {/* Objective Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {objectives.map(obj => {
          const isActive = selectedObjective === obj.id;
          return (
            <button
              key={obj.id}
              onClick={() => handleSolve(obj.id)}
              className={`p-3 rounded-md text-left transition-all border ${
                isActive
                  ? 'border-graphite bg-ivory-100 shadow-sm'
                  : 'border-border bg-white hover:bg-ivory-50 text-graphite-500'
              }`}
            >
              <div className="font-semibold text-xs text-graphite mb-0.5">{obj.label}</div>
              <p className="text-[10px] text-graphite-400 line-clamp-2">{obj.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Target Return Input (conditional) */}
      {selectedObjective === 'TARGET_RETURN' && (
        <div className="bg-ivory-50 border border-border/80 rounded-md p-3.5 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-graphite">Target Annualized Return (Hurdle %):</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                value={targetReturnPct}
                onChange={e => setTargetReturnPct(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 text-right font-mono text-xs border border-border rounded bg-white"
              />
              <span className="font-mono text-xs text-graphite-500">%</span>
              <button
                onClick={() => handleSolve('TARGET_RETURN')}
                className="px-2.5 py-1 text-xs font-medium bg-graphite text-white rounded hover:bg-graphite-800 transition-colors"
              >
                Solve
              </button>
            </div>
          </div>
          {result.feasibleRange && (
            <p className="text-[10px] font-mono text-graphite-400">
              Feasible Return Bounds: [{result.feasibleRange[0]}% to {result.feasibleRange[1]}%]
            </p>
          )}
        </div>
      )}

      {/* Infeasible Alert */}
      {result.status === 'INFEASIBLE' && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start gap-2 text-amber-800 text-xs">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">Infeasible Hurdle Target:</span> The requested return of{' '}
            {targetReturnPct}% exceeds the maximum achievable long-only asset return in this universe.
            Reported fallback is the closest boundary allocation.
          </div>
        </div>
      )}

      {/* Optimization Solution Display */}
      <div className="border border-border rounded-lg p-4 bg-ivory-50/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-border/60">
          <div>
            <span className="text-[10px] font-semibold text-graphite-400 uppercase tracking-wider block">
              Optimal Allocation Vector (w*)
            </span>
            <div className="flex items-center gap-4 mt-1 font-mono text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS.GOLD }} />
                Gold: <strong className="text-graphite">{(result.allocation.GOLD * 100).toFixed(1)}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS.BTC }} />
                BTC: <strong className="text-graphite">{(result.allocation.BTC * 100).toFixed(1)}%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS.NVDA }} />
                NVDA: <strong className="text-graphite">{(result.allocation.NVDA * 100).toFixed(1)}%</strong>
              </span>
            </div>
          </div>

          <button
            onClick={() => onApplyAllocation(result.allocation)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-graphite text-white rounded text-xs font-medium hover:bg-graphite-800 transition-colors shadow-sm"
          >
            Apply Allocation <ArrowRight size={12} />
          </button>
        </div>

        {/* Output Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-white border border-border/60 rounded p-2.5">
            <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
              Expected Return
            </span>
            <span className="text-sm font-bold text-graphite">+{result.expectedReturn.toFixed(2)}%</span>
          </div>
          <div className="bg-white border border-border/60 rounded p-2.5">
            <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
              Volatility
            </span>
            <span className="text-sm font-bold text-graphite">{result.volatility.toFixed(2)}%</span>
          </div>
          <div className="bg-white border border-border/60 rounded p-2.5">
            <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
              Sharpe (Rf=4%)
            </span>
            <span className="text-sm font-bold text-graphite">{result.sharpeRatio.toFixed(2)}</span>
          </div>
          <div className="bg-white border border-border/60 rounded p-2.5">
            <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
              Search Status
            </span>
            <span
              className={`text-sm font-bold ${
                result.status === 'BEST_FOUND' ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {result.status === 'BEST_FOUND' ? 'BEST FOUND' : 'INFEASIBLE'}
            </span>
          </div>
        </div>

        {/* Methodology Precision Guarantee */}
        <div className="mt-3 pt-2.5 border-t border-border/40 text-[10px] text-graphite-400 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-graphite-500 flex-shrink-0" />
          <span>{OPTIMIZER_METHOD_DESCRIPTION}</span>
        </div>
      </div>
    </div>
  );
}
