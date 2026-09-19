import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  FileQuestion,
  Database,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { ResearchRun } from './ResearchRun';
import { ResearchEvidence } from './ResearchEvidence';

const PRESET_RESEARCH_QUESTIONS = [
  {
    category: 'Performance Discrepancy (Primary Demo)',
    question: 'Why did BTC EMA Trend underperform Buy & Hold?',
    description: 'Investigate regime drag, transaction friction, and recovery asymmetry.',
  },
  {
    category: 'Drawdown Investigation',
    question: 'Why did NVDA experience its largest drawdown?',
    description: 'Examine structural volatility shifts and macro liquidity shock correlation.',
  },
  {
    category: 'Robustness Evaluation',
    question: 'Is the BTC momentum strategy robust to transaction costs?',
    description: 'Evaluate parameter stability and execution slippage cliff.',
  },
  {
    category: 'Regime Behavior',
    question: 'How did Gold behave across different market regimes?',
    description: 'Decompose risk-adjusted return and volatility across Bull, Bear, and Chop clusters.',
  },
  {
    category: 'Correlation & Stress',
    question: 'Did correlation between BTC and NVDA increase during stress?',
    description: 'Analyze rolling 60-day correlation during liquidity shocks and crisis periods.',
  },
];

export const ResearchAgent: React.FC = () => {
  const {
    isResearchRunning,
    researchRunState,
    latestConclusion,
    researchError,
    runAutonomousInvestigation,
    resetAutonomousResearch,
    selectedAsset,
    selectedStrategy,
    setActiveSection,
  } = useResearchStore();

  const [inputQuery, setInputQuery] = useState(
    'Why did BTC EMA Trend underperform Buy & Hold?'
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isResearchRunning) return;
    runAutonomousInvestigation(inputQuery.trim());
  };

  const handleSelectPreset = (presetQuestion: string) => {
    setInputQuery(presetQuestion);
    runAutonomousInvestigation(presetQuestion);
  };

  const hasActiveRun = isResearchRunning || researchRunState !== null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Institutional Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white border border-[#E5E0D8] rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#1A1917] text-white flex items-center justify-center shadow-sm">
            <Compass className="w-6 h-6 text-[#B40023]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-mono tracking-tight text-[#1A1917] uppercase">
                Autonomous Quant Research Agent
              </h1>
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                PHASE 3.6
              </span>
            </div>
            <p className="text-xs text-[#6E6B65] font-sans mt-0.5">
              Hypothesis Formulation • Bounded Tool Execution • Contradiction Verification • Ghost Mode Trail
            </p>
          </div>
        </div>

        {/* Operational Guard Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F4] border border-[#E5E0D8] text-[11px] font-mono text-[#4A4742]">
            <Cpu className="w-3.5 h-3.5 text-[#B40023]" />
            <span>MAX 8 TOOLS</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F4] border border-[#E5E0D8] text-[11px] font-mono text-[#4A4742]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>CONTRADICTION CHECK</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F4] border border-[#E5E0D8] text-[11px] font-mono text-[#4A4742]">
            <Database className="w-3.5 h-3.5 text-[#B40023]" />
            <span>ZERO FABRICATION</span>
          </div>
        </div>
      </div>

      {/* 2. Research Input Console */}
      <div className="p-6 bg-white border border-[#E5E0D8] rounded-2xl shadow-xs space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#1A1917] flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-[#B40023]" />
              Quantitative Research Question
            </label>
            <span className="text-[11px] font-mono text-[#6E6B65]">
              Target Context: <span className="font-semibold text-[#1A1917]">{selectedAsset}</span> / <span className="font-semibold text-[#1A1917]">{selectedStrategy}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="e.g. Why did BTC EMA Trend underperform Buy & Hold?"
                disabled={isResearchRunning}
                className="w-full px-4 py-3 text-xs md:text-sm font-mono text-[#1A1917] bg-[#FAF8F4] border border-[#E5E0D8] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#B40023] focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isResearchRunning || !inputQuery.trim()}
              className="flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-mono font-bold text-white bg-[#1A1917] hover:bg-neutral-800 disabled:opacity-50 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
            >
              {isResearchRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Investigating...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-[#B40023] fill-[#B40023]" />
                  <span>Run Investigation</span>
                </>
              )}
            </button>

            {hasActiveRun && !isResearchRunning && (
              <button
                type="button"
                onClick={resetAutonomousResearch}
                className="p-3 text-[#6E6B65] hover:text-[#1A1917] bg-[#FAF8F4] hover:bg-[#F3EFE9] border border-[#E5E0D8] rounded-xl transition-all cursor-pointer"
                title="Reset Investigation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>

        {/* Preset Questions Chips */}
        <div>
          <div className="text-[11px] font-mono text-[#6E6B65] mb-2 font-medium">
            Standard Research Inquiries:
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_RESEARCH_QUESTIONS.map((pq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(pq.question)}
                disabled={isResearchRunning}
                className="text-left text-xs font-mono px-3 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F4] hover:bg-white hover:border-[#B40023]/50 text-[#1A1917] transition-all disabled:opacity-50 cursor-pointer"
              >
                {pq.question}
              </button>
            ))}
          </div>
        </div>

        {researchError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{researchError}</span>
          </div>
        )}
      </div>

      {/* 3. Live Research Run Stepper */}
      {researchRunState && (
        <ResearchRun runState={researchRunState} />
      )}

      {/* 4. Structured Evidence & Conclusion */}
      {researchRunState && (
        <ResearchEvidence
          conclusion={latestConclusion || researchRunState.conclusion}
          evidenceList={researchRunState.evidenceList}
          evaluations={researchRunState.evaluations}
        />
      )}

      {/* 5. Default Protocol Overview when Idle */}
      {!hasActiveRun && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white border border-[#E5E0D8] rounded-2xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#B40023] flex items-center justify-center font-mono font-bold text-xs">
              01
            </div>
            <h3 className="text-xs font-mono font-bold uppercase text-[#1A1917]">
              Hypothesis Formulation
            </h3>
            <p className="text-xs text-[#6E6B65] leading-relaxed">
              Transforms user questions into falsifiable quantitative propositions testable exclusively with verified BLACKBOX engines.
            </p>
          </div>

          <div className="p-5 bg-white border border-[#E5E0D8] rounded-2xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-mono font-bold text-xs">
              02
            </div>
            <h3 className="text-xs font-mono font-bold uppercase text-[#1A1917]">
              Contradiction Testing
            </h3>
            <p className="text-xs text-[#6E6B65] leading-relaxed">
              Mandatory falsification check. Challenges initial hypotheses against baseline metrics, counterfactual costs, and regime decompositions.
            </p>
          </div>

          <div className="p-5 bg-white border border-[#E5E0D8] rounded-2xl shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-mono font-bold text-xs">
              03
            </div>
            <h3 className="text-xs font-mono font-bold uppercase text-[#1A1917]">
              Research Trail Logging
            </h3>
            <p className="text-xs text-[#6E6B65] leading-relaxed">
              Converts grounded conclusions directly into institutional Research Trail entries integrated with Ghost Mode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
