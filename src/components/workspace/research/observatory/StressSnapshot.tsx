import React from 'react';
import { StressSnapshotData } from '../../../../core/research/observatory/observatoryTypes';
import { ShieldAlert, AlertTriangle, ArrowRight, Activity } from 'lucide-react';

interface StressSnapshotProps {
  snapshot: StressSnapshotData;
  onOpenStressLab?: () => void;
}

export const StressSnapshot: React.FC<StressSnapshotProps> = ({
  snapshot,
  onOpenStressLab,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">MACRO SHOCK LAB — STRESS SNAPSHOT</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Scenario Stress Testing: {snapshot.scenarioName}
          </h2>
        </div>

        {onOpenStressLab && (
          <button
            onClick={onOpenStressLab}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border text-rose-600 hover:text-rose-700"
          >
            <span>Time-Travel Stress Lab</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Mandatory Stress Disclaimer */}
      <div className="mb-6 p-3 bg-rose-50/70 border border-rose-200 rounded text-xs font-mono text-rose-800 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
        <span>{snapshot.simulationDisclaimer}</span>
      </div>

      {/* Grid of Stress Parameters and Outputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono text-xs">
        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">MARKET SHOCK</span>
          <span className="text-base font-semibold text-rose-600">{snapshot.marketShockPct}%</span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Base equity index shock</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">VOL MULTIPLIER</span>
          <span className="text-base font-semibold text-graphite">{snapshot.volatilityMultiplier}x</span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Intraday dispersion</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">SHOCK DURATION</span>
          <span className="text-base font-semibold text-graphite">{snapshot.durationDays}d</span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Combined cycle</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">MAX DAMAGE</span>
          <span className="text-base font-semibold text-rose-600">{snapshot.maxDamagePct}%</span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Portfolio max drawdown</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">STRESSED EQUITY</span>
          <span className="text-base font-semibold text-graphite">${snapshot.stressedEquity.toLocaleString()}</span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Starting: ${snapshot.baselineEquity.toLocaleString()}</span>
        </div>

        <div className="p-3 bg-ivory-50 rounded border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase block">CORRELATION SHIFT</span>
          <span className="text-base font-semibold text-graphite">+{snapshot.correlationShiftDelta}</span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">Covariance expansion</span>
        </div>
      </div>
    </div>
  );
};
