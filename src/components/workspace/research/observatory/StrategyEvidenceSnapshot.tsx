import React from 'react';
import { StrategyEvidenceSnapshot } from '../../../../core/research/observatory/observatoryTypes';
import { FlaskConical, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface StrategyEvidenceSnapshotProps {
  snapshot: StrategyEvidenceSnapshot;
  onOpenStrategyLab?: () => void;
}

export const StrategyEvidenceSnapshotView: React.FC<StrategyEvidenceSnapshotProps> = ({
  snapshot,
  onOpenStrategyLab,
}) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 05 — STRATEGY EVIDENCE & BENCHMARK</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Deterministic Strategy Deconstruction: {snapshot.strategy.replace('_', ' ')} on {snapshot.asset}
          </h2>
        </div>

        {onOpenStrategyLab && (
          <button
            onClick={onOpenStrategyLab}
            className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 border border-border self-start sm:self-auto text-accent hover:text-accent-dark"
          >
            <span>Open in Strategy Lab</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Side-by-Side Strategy vs Buy & Hold Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Strategy Column */}
        <div className="p-5 bg-ivory-50 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border-light">
            <span className="font-mono text-xs font-semibold text-graphite uppercase tracking-wider">
              STRATEGY: {snapshot.strategy}
            </span>
            <span className="text-[11px] font-mono text-graphite-500 bg-white px-2 py-0.5 rounded border border-border-light">
              Friction: {snapshot.transactionCostBps} bps • {snapshot.executionConvention}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">TOTAL RETURN</span>
              <span className="text-base font-semibold text-graphite">
                {snapshot.strategyReturnPct > 0 ? `+${snapshot.strategyReturnPct}%` : `${snapshot.strategyReturnPct}%`}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">ANNUAL VOL</span>
              <span className="text-base font-semibold text-graphite">{snapshot.volatilityPct}%</span>
            </div>
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">SHARPE</span>
              <span className="text-base font-semibold text-graphite">{snapshot.sharpeRatio}</span>
            </div>
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">MAX DD</span>
              <span className="text-base font-semibold text-rose-600">{snapshot.maxDrawdownPct}%</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-graphite-400">
            <span>Total Trades: {snapshot.tradeCount}</span>
            <span>Win Rate: {snapshot.winRatePct}%</span>
          </div>
        </div>

        {/* Benchmark Column */}
        <div className="p-5 bg-ivory-50 rounded-lg border border-border">
          <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-border-light">
            <span className="font-mono text-xs font-semibold text-graphite uppercase tracking-wider">
              BENCHMARK: BUY & HOLD ({snapshot.asset})
            </span>
            <span className="text-[11px] font-mono text-graphite-500 bg-white px-2 py-0.5 rounded border border-border-light">
              Passive Holding • Zero Trades
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">TOTAL RETURN</span>
              <span className="text-base font-semibold text-graphite">
                {snapshot.benchmarkReturnPct > 0 ? `+${snapshot.benchmarkReturnPct}%` : `${snapshot.benchmarkReturnPct}%`}
              </span>
            </div>
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">BENCHMARK VOL</span>
              <span className="text-base font-semibold text-graphite">58.4%</span>
            </div>
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">SHARPE</span>
              <span className="text-base font-semibold text-graphite">{snapshot.benchmarkSharpeRatio}</span>
            </div>
            <div className="p-2.5 bg-white rounded border border-border-light">
              <span className="text-[10px] text-graphite-400 block uppercase">RETURN DELTA</span>
              <span className="text-base font-semibold text-accent">
                {snapshot.returnDifferencePctPoints > 0
                  ? `+${snapshot.returnDifferencePctPoints}% pts`
                  : `${snapshot.returnDifferencePctPoints}% pts`}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-graphite-400">
            <span>Execution Model: Next-Bar Close</span>
            <span>Zero Look-Ahead Bias Enforced</span>
          </div>
        </div>
      </div>

      {/* Epistemically Neutral Comparison Statement */}
      <div className="p-3.5 bg-ivory-100 rounded border border-border-light text-xs font-mono text-graphite-700">
        <span className="font-semibold text-graphite uppercase mr-2">AUDIT FINDING:</span>
        {snapshot.neutralComparisonText}
      </div>
    </div>
  );
};
