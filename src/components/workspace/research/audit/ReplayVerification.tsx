import React from 'react';
import { ReplayVerificationRecord } from '../../../../core/research/audit/auditTypes';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Clock, Fingerprint, ChevronRight } from 'lucide-react';

interface ReplayVerificationProps {
  verification: ReplayVerificationRecord;
}

export const ReplayVerification: React.FC<ReplayVerificationProps> = ({ verification }) => {
  const isMatch = verification.overallStatus === 'MATCHED';
  const isIncompatible = verification.overallStatus === 'INCOMPATIBLE';

  const getStatusBadge = () => {
    if (isMatch) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold tracking-wide">
          <CheckCircle2 className="w-4 h-4" />
          <span>REPLAY VERIFIED ✓</span>
        </div>
      );
    }
    if (isIncompatible) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 text-xs font-semibold tracking-wide">
          <AlertTriangle className="w-4 h-4" />
          <span>ENGINE INCOMPATIBLE</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-400 text-xs font-semibold tracking-wide">
        <XCircle className="w-4 h-4" />
        <span>REPLAY DIVERGENCE</span>
      </div>
    );
  };

  const tiers = [
    {
      level: 'Level 1',
      title: 'Configuration Audit',
      class: 'EXACT',
      status: verification.tierResults.level1Configuration.status,
      desc: 'Asset universe, strategy params, cost bps, weights, and PRNG seed',
      mismatches: verification.tierResults.level1Configuration.mismatches.map(
        m => `${m.parameterPath}: ${m.originalValue} → ${m.replayValue}`
      ),
    },
    {
      level: 'Level 2',
      title: 'Data Window Audit',
      class: 'EXACT',
      status: verification.tierResults.level2DataWindow.status,
      desc: 'Start/End date, synchronized observation count, dataset hash',
      mismatches: verification.tierResults.level2DataWindow.mismatches.map(
        m => `${m.field}: ${m.originalValue} → ${m.replayValue}`
      ),
    },
    {
      level: 'Level 3',
      title: 'Experiment Plan Audit',
      class: 'EXACT',
      status: verification.tierResults.level3ExperimentPlan.status,
      desc: 'Planned DAG nodes, dependency ordering, tool registry allowlist',
      mismatches: verification.tierResults.level3ExperimentPlan.mismatches,
    },
    {
      level: 'Level 4',
      title: 'Evidence Audit',
      class: 'NUMERICAL TOLERANCE',
      status: verification.tierResults.level4EvidenceRecords.status,
      desc: 'Numerical outputs evaluated against metric-specific tolerance budgets',
      mismatches: [
        ...verification.tierResults.level4EvidenceRecords.mismatches.map(m => m.description),
        ...verification.tierResults.level4EvidenceRecords.numericalMismatches.map(
          m => `${m.metric}: |Δ| = ${m.absoluteDelta.toFixed(6)} > budget ${m.toleranceBudget}`
        ),
      ],
    },
    {
      level: 'Level 5',
      title: 'Research Claim Audit',
      class: 'EXACT',
      status: verification.tierResults.level5ResearchClaims.status,
      desc: 'Structured claims bound to verified evidence IDs',
      mismatches: verification.tierResults.level5ResearchClaims.mismatches.map(
        m => `Claim ${m.claimId} (${m.metric}): ${m.reason}`
      ),
    },
    {
      level: 'Level 6',
      title: 'Synthesis Audit',
      class: 'EXACT',
      status: verification.tierResults.level6Synthesis.status,
      desc: 'Findings, contradiction resolutions, and causality flags',
      mismatches: verification.tierResults.level6Synthesis.mismatches,
    },
  ];

  return (
    <div className="space-y-6 text-sm">
      {/* Overall Verification Status Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-100">6-Level Replay Verification Audit</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {verification.verificationId}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Evaluated against canonical-output reproducibility contract.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            {verification.totalReplayLatencyMs} ms
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Primary Mismatch Callout (if divergent) */}
      {verification.primaryMismatchType && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-semibold tracking-wider uppercase">
              <AlertTriangle className="w-4 h-4" />
              Primary Mismatch Code: {verification.primaryMismatchType}
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 font-mono text-[10px]">
              Precedence Level {verification.mismatchPrecedenceLevel} / 10
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Evaluation halted at highest-precedence root cause. All secondary divergences are preserved in the tier breakdown below.
          </p>
        </div>
      )}

      {/* Fingerprint Parity Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Fingerprint className="w-3 h-3 text-indigo-400" />
            Original Canonical Hash
          </div>
          <div className="text-zinc-200 truncate">{verification.fingerprintComparison.originalFingerprint}</div>
        </div>
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
            <Fingerprint className="w-3 h-3 text-cyan-400" />
            Replayed Canonical Hash
          </div>
          <div className={`truncate ${isMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
            {verification.fingerprintComparison.replayFingerprint}
          </div>
        </div>
      </div>

      {/* 6-Level Verification Tiers */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Hierarchical Evidentiary Tiers
        </h4>
        <div className="space-y-2">
          {tiers.map(tier => {
            const passed = tier.status === 'PASS';
            return (
              <div
                key={tier.level}
                className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-zinc-200 text-xs">{tier.level}: {tier.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {tier.class}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                      passed
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    {tier.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{tier.desc}</p>

                {tier.mismatches.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-rose-950/20 border border-rose-900/30 text-[11px] font-mono text-rose-300 space-y-1">
                    {tier.mismatches.map((m, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 text-rose-400" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
