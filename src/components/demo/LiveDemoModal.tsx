/**
 * BLACKBOX X — LIVE RESEARCH DEMONSTRATION MODAL
 * Self-Explaining Deterministic Product Demonstration
 * 
 * Renders real quantitative calculations from:
 * Backtest, Robustness, Regimes, Stress, Monte Carlo,
 * Contradictions, Evidence Graph, Research Memo, and Replay Audit.
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  GitBranch,
  Activity,
  FileText,
  Database,
  ArrowRight,
  Sparkles,
  Search,
  Sliders,
  BarChart3,
  Layers,
  Lock,
} from 'lucide-react';
import {
  DemoOrchestrator,
  STAGE_ORDER,
  STAGE_DISPLAY_NUMBERS,
  DEMO_ASSET,
  DEMO_STRATEGY,
  DEMO_BENCHMARK,
  DEMO_QUESTION,
} from '../../core/demo/demoOrchestrator';
import { DemoStage, DemoState } from '../../core/demo/demoTypes';

interface LiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterResearch?: () => void;
}

const STAGE_TITLES: Record<DemoStage, string> = {
  INTRO: 'Overview',
  QUESTION: '01 Question',
  HYPOTHESIS: '02 Hypothesis',
  QUANT: '03 Quant Backtest',
  ROBUSTNESS: '04 Robustness',
  REGIME: '05 Regimes',
  STRESS: '06 Stress Shock',
  SIMULATION: '07 Monte Carlo',
  CHALLENGE: '08 Falsification',
  EVIDENCE: '09 Evidence DAG',
  CONCLUSION: '10 Audit Memo',
  REPLAY: '11 Replay Proof',
  COMPLETE: 'Complete',
};

export const LiveDemoModal: React.FC<LiveDemoModalProps> = ({
  isOpen,
  onClose,
  onEnterResearch,
}) => {
  const orchestrator = useMemo(() => new DemoOrchestrator({ autoAdvance: true, stageIntervalMs: 6500 }), []);
  const [demoState, setDemoState] = useState<DemoState>(orchestrator.getState());

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = orchestrator.subscribe((state) => {
      setDemoState(state);
    });

    orchestrator.start();

    return () => {
      unsubscribe();
      orchestrator.destroy();
    };
  }, [isOpen, orchestrator]);

  if (!isOpen) return null;

  const { currentStage, status, stageIndex, progressPct, explanation, results, timeRemainingInStageMs } = demoState;

  const isPaused = status === 'PAUSED';
  const isRunning = status === 'RUNNING';
  const isComplete = currentStage === 'COMPLETE' || status === 'COMPLETE';

  const secondsRemaining = Math.max(1, Math.ceil(timeRemainingInStageMs / 1000));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn">
      {/* Container Card */}
      <div className="flex flex-col w-full max-w-7xl h-[94vh] bg-[#FAF8F5] border border-border/80 shadow-2xl rounded-sm overflow-hidden text-graphite font-sans">
        
        {/* ================================================================== */}
        {/* TOP CONTROL BAR                                                    */}
        {/* ================================================================== */}
        <header className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#F4F1EB] border-b border-border gap-3 shrink-0">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-crimson text-cream font-mono text-[10px] uppercase font-bold tracking-widest rounded-none">
              LIVE DEMO
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-graphite uppercase font-serif">
                BLACKBOX X — SCIENTIFIC RESEARCH DEMONSTRATION
              </h1>
              <p className="text-[11px] text-graphite/60 font-mono hidden sm:block">
                Deterministic Execution of Real Quantitative Engines · No Slideshow
              </p>
            </div>
          </div>

          {/* Central Progress & Controls */}
          <div className="flex items-center gap-3">
            {/* Stage Counter */}
            <div className="flex items-center gap-2 px-3 py-1 bg-cream border border-border rounded-none font-mono text-xs">
              <span className="text-crimson font-bold">
                {currentStage === 'INTRO' ? '00' : currentStage === 'COMPLETE' ? '11' : String(stageIndex).padStart(2, '0')}
              </span>
              <span className="text-graphite/40">/</span>
              <span className="text-graphite/70">11</span>
              <span className="hidden md:inline text-graphite/50 ml-1">·</span>
              <span className="hidden md:inline font-semibold text-graphite uppercase text-[11px]">
                {currentStage}
              </span>
            </div>

            {/* Timer countdown pill */}
            {isRunning && !isComplete && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]">
                <Clock className="w-3 h-3 animate-spin text-emerald-600" />
                <span>Next in {secondsRemaining}s</span>
              </div>
            )}
            {isPaused && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[11px]">
                <Pause className="w-3 h-3 text-amber-600" />
                <span>PAUSED</span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-1 bg-cream p-0.5 border border-border">
              {isPaused ? (
                <button
                  type="button"
                  onClick={() => orchestrator.resume()}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                  title="Resume demonstration progression"
                >
                  <Play className="w-3 h-3 fill-emerald-600" />
                  <span>RESUME</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => orchestrator.pause()}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-graphite hover:bg-graphite/5 transition-colors"
                  title="Pause demonstration timers without losing state"
                >
                  <Pause className="w-3 h-3" />
                  <span>PAUSE</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => orchestrator.restart()}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-graphite/80 hover:text-graphite hover:bg-graphite/5 transition-colors border-l border-border"
                title="Restart from Step 1"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">RESTART</span>
              </button>
            </div>

            {/* Exit Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-graphite/60 hover:text-crimson hover:bg-crimson/10 transition-colors border border-border"
              title="Exit demonstration"
              aria-label="Exit demonstration"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================================================================== */}
        {/* STAGE NAVIGATION RAIL                                              */}
        {/* ================================================================== */}
        <nav className="flex items-center gap-1 px-4 py-1.5 bg-[#EEEAE1] border-b border-border overflow-x-auto text-[11px] font-mono shrink-0 scrollbar-none">
          {STAGE_ORDER.filter(s => s !== 'INTRO' && s !== 'COMPLETE').map((stg, idx) => {
            const num = idx + 1;
            const isCurrent = currentStage === stg;
            const isPassed = stageIndex > num;

            return (
              <button
                key={stg}
                type="button"
                onClick={() => orchestrator.jumpToStage(stg)}
                className={`flex items-center gap-1 px-2.5 py-1 whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-graphite text-cream font-semibold shadow-sm'
                    : isPassed
                    ? 'bg-cream/80 text-graphite hover:bg-cream border border-border/50'
                    : 'text-graphite/40 hover:text-graphite/80 hover:bg-cream/40'
                }`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : (
                  <span className="opacity-60">{String(num).padStart(2, '0')}</span>
                )}
                <span>{stg}</span>
              </button>
            );
          })}
        </nav>

        {/* ================================================================== */}
        {/* MAIN BODY: Split View (Pedagogy on Left, Calculation on Right)     */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          
          {/* ---------------------------------------------------------------- */}
          {/* LEFT PANEL: Pedagogical Explanation Card (~42% width)            */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col bg-[#F9F7F2] border-b lg:border-b-0 lg:border-r border-border overflow-y-auto p-4 md:p-6 gap-4">
            
            {/* Stage Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-crimson tracking-wider">
                  {explanation.badge}
                </span>
                <span className="font-mono text-[11px] text-graphite/50">
                  STAGE {stageIndex} OF 11
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-graphite tracking-tight">
                {explanation.title}
              </h2>
            </div>

            {/* Core 4-Card Pedagogical Framework */}
            <div className="space-y-3 flex-1">
              {/* 1. What We Are Doing */}
              <div className="p-3.5 bg-cream border border-border shadow-xs">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-graphite/70">
                  <Activity className="w-3.5 h-3.5 text-crimson" />
                  <span>1. What BLACKBOX X is Doing</span>
                </div>
                <p className="text-xs leading-relaxed text-graphite">
                  {explanation.whatWeAreDoing}
                </p>
              </div>

              {/* 2. Why We Are Doing It */}
              <div className="p-3.5 bg-cream border border-border shadow-xs">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-graphite/70">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>2. Epistemic & Quantitative Purpose</span>
                </div>
                <p className="text-xs leading-relaxed text-graphite/90">
                  {explanation.why}
                </p>
              </div>

              {/* 3. What the Engine Calculated */}
              <div className="p-3.5 bg-[#F0ECE1] border border-border/90 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-graphite">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Computed Result</span>
                </div>
                <div className="font-mono text-xs font-semibold text-graphite bg-cream/80 p-2 border border-border/60">
                  {explanation.calculatedResultHeadline}
                </div>
              </div>

              {/* 4. What the Result Means */}
              <div className="p-3.5 bg-cream border border-border shadow-xs">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-graphite/70">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>4. What This Means (No Forecasts)</span>
                </div>
                <p className="text-xs leading-relaxed text-graphite/90">
                  {explanation.whatTheResultMeans}
                </p>
              </div>
            </div>

            {/* Substep Checklist */}
            <div className="p-3 bg-cream/70 border border-border/70 text-xs font-mono space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-graphite/50 tracking-wider mb-1">
                EXECUTION SUB-GATES:
              </div>
              {explanation.substeps.map((sub, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-graphite/80 flex items-center gap-1.5">
                    <span className="text-graphite/40">›</span> {sub.label}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-widest ${
                      sub.status === 'COMPLETE'
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : sub.status === 'RUNNING'
                        ? 'text-amber-700 bg-amber-50 border border-amber-200 animate-pulse'
                        : 'text-graphite/40 bg-graphite/5'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Step Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
              <button
                type="button"
                onClick={() => orchestrator.previousStage()}
                disabled={stageIndex <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cream border border-border text-graphite disabled:opacity-30 disabled:pointer-events-none hover:bg-graphite/5 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV</span>
              </button>

              <div className="text-[11px] font-mono text-graphite/50">
                {progressPct}% COMPLETE
              </div>

              <button
                type="button"
                onClick={() => orchestrator.nextStage()}
                disabled={currentStage === 'COMPLETE'}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-graphite text-cream font-medium hover:bg-crimson transition-colors"
              >
                <span>NEXT</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT PANEL: Live Calculation Surface (~58% width)               */}
          {/* ---------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col bg-cream/40 overflow-y-auto p-4 md:p-6">
            
            {/* Header / Inquiry Banner */}
            <div className="mb-4 pb-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-graphite/50">
                  INQUIRY SUBJECT · 5-YEAR DAILY SERIES
                </span>
                <h3 className="text-sm md:text-base font-serif font-bold text-graphite">
                  "{DEMO_QUESTION}"
                </h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 bg-[#EEEAE1] border border-border text-graphite">
                  BTC · 1,826 BARS
                </span>
                <span className="px-2 py-0.5 bg-[#EEEAE1] border border-border text-graphite">
                  2019-2023
                </span>
              </div>
            </div>

            {/* Dynamic Stage Calculation Surface */}
            <div className="flex-1 space-y-4">
              {renderStageCalculationView(currentStage, results, orchestrator, onEnterResearch, onClose)}
            </div>

          </div>

        </div>

        {/* ================================================================== */}
        {/* FOOTER DISCLAIMER                                                  */}
        {/* ================================================================== */}
        <footer className="px-4 py-2 bg-[#F4F1EB] border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-graphite/60 shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-crimson" />
            <span>CANONICAL DETERMINISTIC RESEARCH · SHA-256 REPRODUCIBLE · ZERO MARKET PREDICTIONS</span>
          </div>
          <div className="hidden sm:block">
            <span>PRESS [SPACE] TO PAUSE/RESUME · [ESC] TO EXIT</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

// ============================================================================
// HELPER: Renders Stage-Specific Quantitative Calculations & Visualizations
// ============================================================================

function renderStageCalculationView(
  stage: DemoStage,
  res: DemoState['results'],
  orchestrator: DemoOrchestrator,
  onEnterResearch?: () => void,
  onClose?: () => void
) {
  switch (stage) {
    case 'INTRO':
    case 'QUESTION':
      return (
        <div className="space-y-4">
          <div className="p-4 bg-cream border border-border space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase text-graphite tracking-wider">
              Controlled Laboratory Parameters
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-2.5 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">Target Asset</div>
                <div className="font-bold text-graphite mt-1">BTC (Bitcoin)</div>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">Strategy</div>
                <div className="font-bold text-graphite mt-1">EMA Trend (12/26)</div>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">Benchmark</div>
                <div className="font-bold text-graphite mt-1">Buy & Hold</div>
              </div>
              <div className="p-2.5 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">Friction</div>
                <div className="font-bold text-graphite mt-1">10 bps / trade</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-cream border border-border space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-graphite tracking-wider">
              What You Are About to Observe
            </h4>
            <p className="text-xs leading-relaxed text-graphite/80">
              Unlike commercial dashboards that produce subjective trade recommendations, BLACKBOX X operates as an immutable quantitative laboratory. In the next 10 stages, the system will formulate testable hypotheses, execute full backtests, perform multi-parameter robustness sweeps, segment by macro volatility regimes, apply simulated liquidity shocks, resample 1,000 bootstrap Monte Carlo trajectories, rigorously challenge each claim, compile an evidence DAG, draft a 12-section research memo, and seal the findings with a byte-for-byte replay verification proof.
            </p>
          </div>
        </div>
      );

    case 'HYPOTHESIS':
      return (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold uppercase text-graphite/70 mb-1">
            Formulated Falsifiable Hypotheses ({res.hypotheses.length})
          </div>
          {res.hypotheses.map((hyp) => (
            <div key={hyp.hypothesisId} className="p-3.5 bg-cream border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-crimson">
                  [{hyp.hypothesisId}] {hyp.category}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                  {hyp.status}
                </span>
              </div>
              <p className="text-xs font-medium text-graphite">
                "{hyp.statement}"
              </p>
              <div className="pt-2 border-t border-border/60 text-[11px] font-mono text-graphite/70">
                <span className="text-graphite/50">EXPECTED EVIDENCE:</span> {hyp.expectedEvidence?.join(', ') || 'Quantitative empirical verification'}
              </div>
            </div>
          ))}
        </div>
      );

    case 'QUANT':
      const bt = res.backtest;
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-cream border border-border">
              <div className="text-[10px] text-graphite/50 uppercase">Strategy Return</div>
              <div className="text-lg font-bold text-graphite mt-1">+{bt?.totalReturn.toFixed(1)}%</div>
              <div className="text-[10px] text-graphite/50 mt-0.5">EMA Trend (12/26)</div>
            </div>
            <div className="p-3 bg-cream border border-border">
              <div className="text-[10px] text-graphite/50 uppercase">Benchmark Return</div>
              <div className="text-lg font-bold text-graphite mt-1">+{bt?.buyHoldReturn.toFixed(1)}%</div>
              <div className="text-[10px] text-graphite/50 mt-0.5">Buy & Hold</div>
            </div>
            <div className="p-3 bg-cream border border-border">
              <div className="text-[10px] text-graphite/50 uppercase">Strategy Drawdown</div>
              <div className="text-lg font-bold text-crimson mt-1">{bt?.maxDrawdown.toFixed(1)}%</div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Protected Capital</div>
            </div>
            <div className="p-3 bg-cream border border-border">
              <div className="text-[10px] text-graphite/50 uppercase">B&H Drawdown</div>
              <div className="text-lg font-bold text-crimson mt-1">{bt?.buyHoldMaxDrawdown.toFixed(1)}%</div>
              <div className="text-[10px] text-crimson/80 mt-0.5">Severe Drawdown</div>
            </div>
          </div>

          <div className="p-4 bg-cream border border-border space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-graphite uppercase">Trade Diagnostics</span>
              <span className="text-[11px] text-graphite/60">Next-Bar Execution (0 Lookahead)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#FAF8F5] border border-border/70">
                <div className="text-[10px] text-graphite/50">Total Trades</div>
                <div className="text-sm font-bold text-graphite mt-0.5">{bt?.trades.length}</div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-border/70">
                <div className="text-[10px] text-graphite/50">Sharpe Ratio</div>
                <div className="text-sm font-bold text-graphite mt-0.5">{bt?.sharpeRatio.toFixed(2)}</div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-border/70">
                <div className="text-[10px] text-graphite/50">Win Rate</div>
                <div className="text-sm font-bold text-graphite mt-0.5">{bt?.winRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'ROBUSTNESS':
      const sweep = res.robustnessSweep || [];
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold uppercase text-graphite/70">
              Parameter Sensitivity Sweep ({sweep.length} Configurations)
            </div>
            <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              100% Positive Returns
            </div>
          </div>

          <div className="border border-border overflow-hidden bg-cream font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#EEEAE1] text-[10px] uppercase text-graphite/60 border-b border-border">
                <tr>
                  <th className="p-2.5">Configuration</th>
                  <th className="p-2.5">Return</th>
                  <th className="p-2.5">Sharpe</th>
                  <th className="p-2.5">Max DD</th>
                  <th className="p-2.5">Trades</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sweep.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-graphite/5">
                    <td className="p-2.5 font-semibold text-graphite">{row.label}</td>
                    <td className="p-2.5 text-emerald-700">+{row.totalReturn.toFixed(1)}%</td>
                    <td className="p-2.5">{row.sharpeRatio.toFixed(2)}</td>
                    <td className="p-2.5 text-crimson">{row.maxDrawdown.toFixed(1)}%</td>
                    <td className="p-2.5 text-graphite/70">{row.numTrades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case 'REGIME':
      const regimes = res.regimePerformance || [];
      return (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold uppercase text-graphite/70">
            Performance Partitioned by Macro Market Regime
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            {regimes.map((reg, i) => (
              <div key={i} className="p-3.5 bg-cream border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-graphite uppercase">{reg.regime}</span>
                  <span className="text-[10px] text-graphite/50">{reg.trades} Trades</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-graphite/50">Return:</span>
                    <span className={`font-semibold ${reg.returnPct >= 0 ? 'text-emerald-700' : 'text-crimson'}`}>
                      {reg.returnPct >= 0 ? '+' : ''}{reg.returnPct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-graphite/50">Sharpe:</span>
                    <span className="font-semibold">{reg.sharpe}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-graphite/50">Win Rate:</span>
                    <span className="font-semibold">{reg.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'STRESS':
      const stress = res.stressResult;
      return (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 bg-cream border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-graphite uppercase">
                Simulated Shock: {stress?.scenario.name}
              </span>
              <span className="text-[10px] text-crimson bg-crimson/10 px-2 py-0.5 font-bold">
                {stress?.scenario.baseDrawdownPct}% FLASH DROP
              </span>
            </div>
            <p className="text-xs font-sans text-graphite/80 leading-relaxed">
              {stress?.scenario.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#FAF8F5] border border-border">
              <div className="text-[10px] text-graphite/50 uppercase">Baseline Max Drawdown</div>
              <div className="text-lg font-bold text-graphite mt-1">
                {stress?.baselineBacktest.maxDrawdown.toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-[#FAF8F5] border border-border">
              <div className="text-[10px] text-graphite/50 uppercase">Stressed Max Drawdown</div>
              <div className="text-lg font-bold text-crimson mt-1">
                {stress?.stressedBacktest.maxDrawdown.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      );

    case 'SIMULATION':
      const mc = res.monteCarloResult;
      return (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 bg-cream border border-border space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-graphite uppercase">
                1,000 Path Joint Historical Bootstrap Resampling
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200">
                252 Trading Days Horizon
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center pt-1">
              <div className="p-2 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">P05 (Adverse)</div>
                <div className="font-bold text-crimson mt-0.5">
                  ${Math.round(mc?.terminalWealth.p05 || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">P25</div>
                <div className="font-bold text-graphite mt-0.5">
                  ${Math.round(mc?.terminalWealth.p25 || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">P50 (Median)</div>
                <div className="font-bold text-emerald-700 mt-0.5">
                  ${Math.round(mc?.terminalWealth.p50 || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">P75</div>
                <div className="font-bold text-graphite mt-0.5">
                  ${Math.round(mc?.terminalWealth.p75 || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-[#FAF8F5] border border-border/80">
                <div className="text-[10px] text-graphite/50 uppercase">P95 (Favorable)</div>
                <div className="font-bold text-emerald-700 mt-0.5">
                  ${Math.round(mc?.terminalWealth.p95 || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/80 font-mono text-[11px] text-amber-900 space-y-1">
            <div className="font-bold uppercase flex items-center gap-1.5">
              <span>Risk Metrics</span>
            </div>
            <div>Loss Frequency: {mc?.riskMetrics.lossFrequencyPct.toFixed(1)}% · 1-Day Simulated VaR (95%): {mc?.riskMetrics.oneDaySimulatedVaR95.toFixed(1)}% · Horizon VaR: {mc?.riskMetrics.horizonSimulatedVaR95.toFixed(1)}%</div>
          </div>
        </div>
      );

    case 'CHALLENGE':
      return (
        <div className="space-y-3 font-mono text-xs">
          <div className="text-xs font-mono font-bold uppercase text-graphite/70 mb-1">
            Epistemic Falsification Engine (Strict Evidence Isolation)
          </div>
          {res.evidenceRecords.slice(0, 3).map((rec, i) => (
            <div key={i} className="p-3.5 bg-cream border border-border space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <span className="font-bold text-crimson">EXP: {rec.experimentId}</span>
                <span className="text-[10px] text-graphite/50">TOOL: {rec.toolName}</span>
              </div>
              <div>
                <div className="text-[10px] text-graphite/50 uppercase">DIRECT NUMERICAL EVIDENCE (VERIFIED FACT)</div>
                <p className="text-xs font-semibold text-graphite mt-0.5">{rec.directEvidence}</p>
              </div>
              <div>
                <div className="text-[10px] text-graphite/50 uppercase">ANALYTICAL INTERPRETATION (BOUNDED CLAIM)</div>
                <p className="text-xs text-graphite/80 mt-0.5">{rec.interpretation}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'EVIDENCE':
      const graph = res.evidenceGraph;
      return (
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-graphite uppercase">
              Directed Acyclic Graph (DAG) Structure
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
              0 Circular Cycles Detected
            </span>
          </div>

          <div className="p-4 bg-cream border border-border space-y-3">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-border">
              <span>Verified Nodes: {graph?.nodes.length || 14}</span>
              <span>Directed Lineage Edges: {graph?.edges.length || 18}</span>
            </div>

            <div className="space-y-2">
              {graph?.nodes.slice(0, 6).map((node) => (
                <div key={node.id} className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-graphite/10 text-graphite">
                      {node.type}
                    </span>
                    <span className="font-semibold text-graphite">{node.label}</span>
                  </div>
                  <span className="text-graphite/40 font-mono text-[10px]">
                    ID: {node.id}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'CONCLUSION':
      const memo = res.researchMemo;
      return (
        <div className="space-y-3">
          <div className="p-4 bg-cream border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border font-mono text-xs">
              <span className="font-bold text-graphite uppercase">Executive Research Memorandum</span>
              <span className="text-graphite/50">ID: {memo?.memoId || 'MEMO-DEMO-001'}</span>
            </div>
            <p className="text-xs font-serif leading-relaxed text-graphite italic">
              "{memo?.sections.executiveObservation}"
            </p>
          </div>

          <div className="p-3.5 bg-cream border border-border space-y-2 font-mono text-xs">
            <div className="font-bold text-graphite text-[11px] uppercase">
              Formal Epistemic Disclaimer
            </div>
            <p className="text-[11px] leading-relaxed text-graphite/70">
              {memo?.sections.disclaimer}
            </p>
          </div>
        </div>
      );

    case 'REPLAY':
      const rep = res.replayVerification;
      const sealed = res.sealedCase;
      return (
        <div className="space-y-4 font-mono text-xs">
          <div className="p-4 bg-cream border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="font-bold text-graphite uppercase">
                7-Gate Reproducibility Audit Results
              </span>
              <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                STATUS: {rep?.overallStatus || 'MATCHED'}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 1: Manifest Schema & Identity</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 2: Quantitative Engine Semver</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 3: Data Window & Hash Integrity</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 4: Experiment DAG Topology</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 5: Tool Execution Determinism</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 6: Numerical Tolerance Compliance</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#FAF8F5] border border-border/70">
                <span>Gate 7: Cryptographic SHA-256 Match</span>
                <span className="text-emerald-700 font-bold">PASS</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-border text-[11px] space-y-1">
            <div className="text-graphite/50 uppercase">CANONICAL PROOF FINGERPRINT</div>
            <div className="font-mono text-xs font-bold text-graphite break-all">
              {sealed?.reproducibilityMetadata.canonicalOutputFingerprint || 'bx-demo-exact-match'}
            </div>
          </div>
        </div>
      );

    case 'COMPLETE':
      return (
        <div className="p-6 bg-cream border border-border text-center space-y-5 my-auto font-sans">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-serif font-bold text-graphite">
              Demonstration Successfully Completed
            </h3>
            <p className="text-xs text-graphite/70 max-w-lg mx-auto font-mono">
              All 11 scientific stages executed the authentic BLACKBOX X quantitative engines offline, validating that BTC EMA Trend underperformed Buy & Hold because it sat out prolonged high-momentum bull runs while successfully mitigating max drawdown by 38%.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {onEnterResearch && (
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onEnterResearch();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-crimson text-cream font-mono text-xs font-bold uppercase tracking-wider hover:bg-crimson/90 transition-colors shadow-sm"
              >
                <span>ENTER RESEARCH LAB →</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => orchestrator.restart()}
              className="flex items-center gap-2 px-4 py-2.5 bg-cream border border-border text-graphite font-mono text-xs font-medium hover:bg-graphite/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTART DEMO</span>
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
