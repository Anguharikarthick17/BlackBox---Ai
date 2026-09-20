/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Allocation Controls
 */

import React from 'react';
import { Sliders, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { PortfolioWeights } from '../../../core/portfolio/portfolioTypes';
import { ASSET_COLORS, Asset } from '../../../core/data';

interface AllocationControlsProps {
  weights: PortfolioWeights;
  onChange: (weights: PortfolioWeights) => void;
  onApplyPreset: (weights: PortfolioWeights) => void;
}

const ASSET_LABELS: Record<Asset, string> = {
  GOLD: 'Gold (XAU)',
  BTC: 'Bitcoin (BTC)',
  NVDA: 'NVIDIA (NVDA)',
};

export function AllocationControls({
  weights,
  onChange,
  onApplyPreset,
}: AllocationControlsProps) {
  const sum = weights.GOLD + weights.BTC + weights.NVDA;
  const isNormalized = Math.abs(sum - 1.0) < 0.005;

  const handleSliderChange = (asset: Asset, value: number) => {
    const newWeights = { ...weights, [asset]: value / 100 };
    onChange(newWeights);
  };

  const handleNormalize = () => {
    const total = (weights.GOLD + weights.BTC + weights.NVDA) || 1.0;
    onChange({
      GOLD: weights.GOLD / total,
      BTC: weights.BTC / total,
      NVDA: weights.NVDA / total,
    });
  };

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Portfolio Allocation (Simplex $\Delta^2$)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isNormalized ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <CheckCircle2 size={12} /> 100.0% Fully Invested
            </span>
          ) : (
            <button
              onClick={handleNormalize}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded transition-colors"
            >
              <AlertCircle size={12} /> Sum: {(sum * 100).toFixed(1)}% (Click to Normalize)
            </button>
          )}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-4 mb-5">
        {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map(asset => {
          const pct = Math.round(weights[asset] * 100);
          return (
            <div key={asset} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() =>
                    onApplyPreset({
                      GOLD: asset === 'GOLD' ? 1.0 : 0.0,
                      BTC: asset === 'BTC' ? 1.0 : 0.0,
                      NVDA: asset === 'NVDA' ? 1.0 : 0.0,
                    })
                  }
                  title={`Click to set 100% ${ASSET_LABELS[asset]}`}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ASSET_COLORS[asset] }}
                  />
                  <span className="font-medium text-graphite hover:underline">{ASSET_LABELS[asset]}</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-graphite w-12 text-right">
                    {(weights[asset] * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={pct}
                  onChange={e => handleSliderChange(asset, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-ivory-300 rounded-lg appearance-none cursor-pointer accent-graphite"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Allocations */}
      <div>
        <p className="text-[10px] font-semibold text-graphite-400 uppercase tracking-wider mb-2">
          Allocation Presets
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <button
            onClick={() => onApplyPreset({ GOLD: 0.4, BTC: 0.3, NVDA: 0.3 })}
            className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-ivory-100 hover:bg-ivory-200 text-graphite transition-colors text-center"
          >
            40/30/30
          </button>
          <button
            onClick={() => onApplyPreset({ GOLD: 1 / 3, BTC: 1 / 3, NVDA: 1 / 3 })}
            className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-ivory-100 hover:bg-ivory-200 text-graphite transition-colors text-center"
          >
            1/N Equal
          </button>
          <button
            onClick={() => onApplyPreset({ GOLD: 0.6, BTC: 0.2, NVDA: 0.2 })}
            className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-ivory-100 hover:bg-ivory-200 text-graphite transition-colors text-center"
          >
            60/40 Def
          </button>
          <button
            onClick={() => onApplyPreset({ GOLD: 1.0, BTC: 0.0, NVDA: 0.0 })}
            className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-ivory-100 hover:bg-ivory-200 text-graphite transition-colors text-center"
          >
            100% Gold
          </button>
          <button
            onClick={() => onApplyPreset({ GOLD: 0.0, BTC: 1.0, NVDA: 0.0 })}
            className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-ivory-100 hover:bg-ivory-200 text-graphite transition-colors text-center"
          >
            100% BTC
          </button>
          <button
            onClick={() => onApplyPreset({ GOLD: 0.0, BTC: 0.0, NVDA: 1.0 })}
            className="text-[11px] font-mono px-2 py-1.5 rounded border border-border bg-ivory-100 hover:bg-ivory-200 text-graphite transition-colors text-center"
          >
            100% NVDA
          </button>
        </div>
      </div>
    </div>
  );
}
