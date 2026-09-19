/**
 * BLACKBOX X — 3D PROCESS UNIVERSE HEADS-UP DISPLAY (HUD)
 * Minimalist Institutional Floating Interface Overlay
 * 
 * Source of Truth: docs/TRY-DEMO-ARCHITECTURE.md
 */

import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Database,
  Layers,
  FileText,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { DemoState, ViewMode, ProcessUniverseStageId } from '../../../core/demo/demoTypes';
import { DemoOrchestrator } from '../../../core/demo/demoOrchestrator';
import { UNIVERSE_STAGES, mapDemoStageToUniverseStage } from './universeStages';

interface ProcessUniverseHUDProps {
  demoState: DemoState;
  orchestrator: DemoOrchestrator;
  onOpenDataInspector: () => void;
  onClose: () => void;
  onEnterResearch?: () => void;
}

export const ProcessUniverseHUD: React.FC<ProcessUniverseHUDProps> = ({
  demoState,
  orchestrator,
  onOpenDataInspector,
  onClose,
  onEnterResearch,
}) => {
  const { currentStage, status, results, timeRemainingInStageMs } = demoState;
  const isPaused = status === 'PAUSED';
  const isRunning = status === 'RUNNING';
  const isComplete = currentStage === 'COMPLETE' || status === 'COMPLETE';

  // Active 3D stage
  const activeStageId = mapDemoStageToUniverseStage(currentStage);
  const activeConfig = UNIVERSE_STAGES.find((s) => s.id === activeStageId) || UNIVERSE_STAGES[0];
  const activeIndex = UNIVERSE_STAGES.findIndex((s) => s.id === activeStageId);

  // Dynamic real metric summary badge based on calculated stage
  const getStageMetricBadge = () => {
    switch (activeStageId) {
      case 'DATA':
      case 'TRANSFORM':
        return `1,826 DAILY BARS · 5Y BTC`;
      case 'INDICATORS':
        return `EMA(12) · EMA(26) COMPUTED`;
      case 'SIGNALS':
        return `${results.backtest?.trades?.length || 42} SIGNALS GENERATED`;
      case 'EXECUTION':
        return `SLIPPAGE: 5 BPS · COMM: 10 BPS`;
      case 'PORTFOLIO':
        return results.backtest
          ? `EQUITY: $${results.backtest.endCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
          : 'PORTFOLIO COMPUTED';
      case 'RISK':
        return results.backtest
          ? `SHARPE: ${results.backtest.sharpeRatio.toFixed(2)} · MAX DD: ${(results.backtest.maxDrawdown * 100).toFixed(1)}%`
          : 'RISK SATELLITES';
      case 'ROBUSTNESS':
        return results.robustnessSweep
          ? `${results.robustnessSweep.length} CONFIGS TESTED`
          : 'PERMUTATIONS';
      case 'REGIMES':
        return results.regimePerformance
          ? `${results.regimePerformance.length} MARKET REGIMES ANALYZED`
          : 'REGIME QUADRANTS';
      case 'STRESS':
        return results.stressResult
          ? `STRESS DD: ${(results.stressResult.stressedBacktest.maxDrawdown * 100).toFixed(1)}%`
          : 'SHOCK APPLIED';
      case 'SIMULATION':
        return results.monteCarloResult
          ? `P50: ${(results.monteCarloResult.totalReturn.p50 * 100).toFixed(1)}% · 500 PATHS`
          : 'FAN SIMULATION';
      case 'EVIDENCE':
        return results.evidenceGraph
          ? `${results.evidenceGraph.nodes.length} EVIDENCE NODES VERIFIED`
          : 'DAG ASSEMBLED';
      case 'RESEARCH':
        return results.researchMemo
          ? `${results.researchMemo.sections.quantitativeFindings.length} FINDINGS AUDITED`
          : 'MEMO GENERATED';
      case 'REPLAY':
        return results.replayVerification
          ? `7/7 GATES IDENTICAL · SEALED`
          : 'CRYPTOGRAPHIC AUDIT';
      default:
        return 'BLACKBOX QUANT ENGINE';
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-5 z-20 font-sans select-none overflow-hidden">
      
      {/* ==================================================================== */}
      {/* TOP FLOATING BAR                                                     */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
        {/* Left: Brand & Stage Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#151515]/90 backdrop-blur-md px-3.5 py-2 border border-white/10 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase font-bold text-cream tracking-widest flex items-center gap-1.5">
              <span>BLACKBOX X</span>
              <span className="text-white/30">|</span>
              <span className="text-crimson">3D PROCESS UNIVERSE</span>
            </span>
            <span className="text-[11px] font-mono text-cream/70 font-medium">
              {String(activeIndex + 1).padStart(2, '0')} / 14 — {activeConfig.subtitle}
            </span>
          </div>
        </div>

        {/* Center: Stage Headline / Metric Tag */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-3 bg-[#151515]/90 backdrop-blur-md px-4 py-2 border border-white/10 shadow-xl">
          <span className="text-xs font-serif text-cream italic max-w-md truncate">
            &ldquo;{activeConfig.explanation}&rdquo;
          </span>
          <span className="px-2 py-0.5 bg-crimson/20 border border-crimson/50 font-mono text-[10px] text-cream font-bold uppercase tracking-wider">
            {getStageMetricBadge()}
          </span>
        </div>

        {/* Right: View Mode Toggle & Actions */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#151515]/90 backdrop-blur-md border border-white/10 p-0.5 shadow-xl font-mono text-[11px]">
            <button
              type="button"
              onClick={() => orchestrator.setViewMode('PROCESS_UNIVERSE')}
              className={`flex items-center gap-1 px-3 py-1.5 font-bold transition-all ${
                demoState.viewMode === 'PROCESS_UNIVERSE'
                  ? 'bg-crimson text-cream shadow-sm'
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'
              }`}
              title="Interactive 3D Process Universe"
            >
              <Globe className="w-3 h-3" />
              <span>3D UNIVERSE</span>
            </button>
            <button
              type="button"
              onClick={() => orchestrator.setViewMode('RESEARCH_VIEW')}
              className={`px-3 py-1.5 font-medium transition-all ${
                demoState.viewMode === 'RESEARCH_VIEW'
                  ? 'bg-cream text-graphite font-bold shadow-sm'
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'
              }`}
              title="Pedagogical Research View"
            >
              RESEARCH
            </button>
            <button
              type="button"
              onClick={() => orchestrator.setViewMode('SYSTEM_VIEW')}
              className={`flex items-center gap-1 px-3 py-1.5 font-medium transition-all ${
                demoState.viewMode === 'SYSTEM_VIEW'
                  ? 'bg-cream text-graphite font-bold shadow-sm'
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'
              }`}
              title="System Data Flow View"
            >
              <Zap className="w-3 h-3 text-amber-500" />
              <span>SYSTEM</span>
            </button>
          </div>

          {/* Inspect Data Button */}
          <button
            type="button"
            onClick={onOpenDataInspector}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#151515]/90 backdrop-blur-md border border-white/10 hover:border-crimson/80 text-cream font-mono text-[11px] font-semibold transition-colors shadow-xl"
            title="Inspect Data Drawer"
          >
            <Database className="w-3.5 h-3.5 text-crimson" />
            <span className="hidden sm:inline">INSPECT DATA</span>
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-[#151515]/90 backdrop-blur-md border border-white/10 hover:border-crimson text-cream/70 hover:text-cream transition-colors shadow-xl"
            title="Exit Demo"
            aria-label="Exit Demo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM CONTROLS & TIMELINE DOCK                                     */}
      {/* ==================================================================== */}
      <div className="flex flex-col gap-2.5 w-full max-w-5xl mx-auto">
        {/* Stage Nodes Quick Scrubber */}
        <div className="pointer-events-auto flex items-center justify-between gap-1 bg-[#151515]/90 backdrop-blur-md border border-white/10 px-3 py-2 overflow-x-auto scrollbar-none shadow-2xl">
          {UNIVERSE_STAGES.map((stg, idx) => {
            const isCurrent = stg.id === activeStageId;
            const isPast = idx < activeIndex;

            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => {
                  // Jump orchestrator to corresponding core stage
                  orchestrator.jumpToStage(stg.demoStage);
                }}
                className={`group flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono transition-all whitespace-nowrap rounded-none ${
                  isCurrent
                    ? 'bg-crimson text-cream font-bold shadow-md ring-1 ring-crimson/60'
                    : isPast
                    ? 'bg-white/5 text-cream/80 hover:bg-white/10 hover:text-cream'
                    : 'text-cream/35 hover:text-cream/70 hover:bg-white/5'
                }`}
                title={`${stg.label}: ${stg.subtitle}`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <span className={isCurrent ? 'text-cream' : 'text-cream/40'}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                )}
                <span className="hidden md:inline uppercase">{stg.id}</span>
              </button>
            );
          })}
        </div>

        {/* Playback Controls & Integrity Bar */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-[#151515]/95 backdrop-blur-md border border-white/10 px-4 py-2.5 shadow-2xl">
          {/* Controls: Play/Pause, Step, Restart */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (isPaused ? orchestrator.resume() : orchestrator.pause())}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold transition-all ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-cream'
                  : 'bg-cream/10 hover:bg-cream/20 text-cream border border-white/10'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{isPaused ? 'RESUME PLAY' : 'PAUSE'}</span>
            </button>

            <button
              type="button"
              onClick={() => orchestrator.previousStage()}
              className="p-1.5 bg-cream/5 hover:bg-cream/15 text-cream border border-white/10 transition-colors"
              title="Previous Stage"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => orchestrator.nextStage()}
              className="p-1.5 bg-cream/5 hover:bg-cream/15 text-cream border border-white/10 transition-colors"
              title="Next Stage"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => orchestrator.restart()}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-cream/5 hover:bg-cream/15 text-cream/70 hover:text-cream border border-white/10 font-mono text-xs transition-colors"
              title="Restart from beginning"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">RESET</span>
            </button>
          </div>

          {/* Central Scientific Badges */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-cream/50">
            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10">NEXT-BAR EXEC</span>
            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10">15 BPS COSTS</span>
            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10">ZERO LOOKAHEAD</span>
          </div>

          {/* Right Action: Enter Research or Jump */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {onEnterResearch && (
              <button
                type="button"
                onClick={onEnterResearch}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-crimson hover:bg-crimson/90 text-cream font-bold transition-all shadow-md"
              >
                <span>OPEN WORKSPACE</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
