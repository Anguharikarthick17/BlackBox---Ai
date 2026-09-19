import React, { useState } from 'react';
import { ResearchCase, ReplayVerificationRecord } from '../../../../core/research/audit/auditTypes';
import { ResearchReplayEngine } from '../../../../core/research/audit/replayEngine';
import { ReplayVerification } from './ReplayVerification';
import { Play, RotateCcw, Sliders, Shield, AlertCircle, Loader2 } from 'lucide-react';

interface ReplayPanelProps {
  caseData: ResearchCase;
  onVerificationComplete?: (record: ReplayVerificationRecord) => void;
}

export const ReplayPanel: React.FC<ReplayPanelProps> = ({ caseData, onVerificationComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [verification, setVerification] = useState<ReplayVerificationRecord | null>(null);
  const [showOverrides, setShowOverrides] = useState(false);

  // Override states for sensitivity audits
  const [frictionBps, setFrictionBps] = useState<number>(caseData.manifest.strategy.transactionCostBps);
  const [seed, setSeed] = useState<number>(caseData.manifest.simulation.seed);

  const handleRunReplay = async () => {
    setIsRunning(true);
    setVerification(null);

    try {
      const options = showOverrides
        ? {
            overrideTransactionCostBps: frictionBps,
            overrideSeed: seed,
          }
        : undefined;

      const result = await ResearchReplayEngine.replayCase(caseData, options);
      setVerification(result.verification);
      if (onVerificationComplete) {
        onVerificationComplete(result.verification);
      }
    } catch (err: any) {
      console.error('Replay failed to complete:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            Deterministic Replay Execution
          </h3>
          <p className="text-xs text-zinc-400">
            Re-executes the complete research experiment DAG natively using registered analytical tools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverrides(!showOverrides)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showOverrides
                ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Sensitivity Audits</span>
          </button>

          <button
            onClick={handleRunReplay}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Replaying Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Replay Decision Case</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sensitivity Overrides Drawer */}
      {showOverrides && (
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-zinc-300 font-semibold">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Adversarial Friction & Seed Overrides</span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            Test parameter drift and observe structured mismatch diagnostics (`CONFIGURATION_MISMATCH`).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">
                Transaction Cost Friction (bps): {frictionBps}
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={frictionBps}
                onChange={e => setFrictionBps(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="text-[10px] text-zinc-500 font-mono flex justify-between">
                <span>0 bps (zero friction)</span>
                <span>Original: {caseData.manifest.strategy.transactionCostBps} bps</span>
                <span>50 bps (high friction)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">
                Mulberry32 PRNG Seed: {seed}
              </label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 font-mono text-xs"
              />
              <div className="text-[10px] text-zinc-500 font-mono">
                Original Seed: {caseData.manifest.simulation.seed}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Output */}
      {verification && (
        <div className="pt-2">
          <ReplayVerification verification={verification} />
        </div>
      )}
    </div>
  );
};
