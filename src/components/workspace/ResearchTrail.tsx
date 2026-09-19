import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  BookOpen, Eye, Lightbulb, BarChart3, Zap, ArrowRight,
  Bookmark, BookmarkCheck, RefreshCw, Sliders, AlertCircle,
  Clock, CheckCircle2, ShieldCheck, TrendingUp, Compass,
  ChevronDown, ChevronUp, Layers, Trash2, Sparkles, Flame, Activity, Shuffle, Network,
} from 'lucide-react';
import { useResearchStore, SavedResearchNote } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS, Asset, getDataInRange } from '../../core/data';
import { STRATEGY_LABELS, StrategyType } from '../../core/strategies';
import {
  generateResearchInsights,
  ResearchInsight,
  ResearchEvidence,
  NextTestAction,
  InsightCategory,
} from '../../core/insights';

// Color & icon mappings for insight categories
const CATEGORY_META: Record<InsightCategory, { color: string; bg: string; icon: any }> = {
  VOLATILITY_SHIFT: { color: '#F59E0B', bg: 'bg-amber-500/10', icon: TrendingUp },
  DRAWDOWN_PRESSURE: { color: '#EF4444', bg: 'bg-red-500/10', icon: AlertCircle },
  STRATEGY_PERFORMANCE: { color: '#B40023', bg: 'bg-accent/10', icon: BarChart3 },
  COST_PRESSURE: { color: '#8B5CF6', bg: 'bg-purple-500/10', icon: Zap },
  CORRELATION_SHIFT: { color: '#10B981', bg: 'bg-emerald-500/10', icon: Compass },
  REGIME_BEHAVIOR: { color: '#06B6D4', bg: 'bg-cyan-500/10', icon: Layers },
  ROBUSTNESS_STABILITY: { color: '#6366F1', bg: 'bg-indigo-500/10', icon: ShieldCheck },
  STRESS_SENSITIVITY: { color: '#DC2626', bg: 'bg-red-600/10', icon: Flame },
  RECOVERY_PRESSURE: { color: '#2563EB', bg: 'bg-blue-600/10', icon: Activity },
  CORRELATION_CONVERGENCE: { color: '#D97706', bg: 'bg-amber-600/10', icon: Shuffle },
  GENOME_RELATIONSHIP_SHIFT: { color: '#8B5CF6', bg: 'bg-purple-600/10', icon: Network },
};

function EvidenceCard({ evidence }: { evidence: ResearchEvidence }) {
  return (
    <div className="p-3 bg-white rounded-lg border border-border-light hover:border-border transition-colors">
      <span className="text-[10px] font-mono text-graphite-400 block uppercase tracking-wider">
        {evidence.label}
      </span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-base font-medium font-mono text-graphite">
          {evidence.value}
        </span>
        {evidence.comparison && (
          <span className="text-[11px] font-mono text-accent">
            {evidence.comparison}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <span className="text-[9px] font-mono text-graphite-400 bg-ivory-200 px-1.5 py-0.5 rounded">
          {evidence.source}
        </span>
      </div>
    </div>
  );
}

interface InsightPipelineCardProps {
  insight: ResearchInsight;
  index: number;
  onExecuteAction: (action: NextTestAction) => void;
  onSaveInsight: (insight: ResearchInsight) => void;
  isSaved: boolean;
}

function InsightPipelineCard({
  insight,
  index,
  onExecuteAction,
  onSaveInsight,
  isSaved,
}: InsightPipelineCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const meta = CATEGORY_META[insight.category] ?? { color: '#B40023', bg: 'bg-accent/10', icon: BarChart3 };
  const CategoryIcon = meta.icon;
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="research-card border border-border hover:shadow-elevated transition-all duration-300 relative overflow-hidden"
    >
      {/* Category accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: meta.color }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center ${meta.bg}`}
            style={{ color: meta.color }}
          >
            <CategoryIcon size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-graphite-400">
                {insight.categoryLabel}
              </span>
              <span className="text-[9px] font-mono bg-ivory-200 text-graphite-400 px-1 rounded">
                VERIFIED ENGINE OUTPUT
              </span>
            </div>
            <h3 className="text-sm font-medium text-graphite mt-0.5">
              {insight.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => onSaveInsight(insight)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 font-medium'
                : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
            }`}
            title={isSaved ? 'Saved to session notebook' : 'Pin to session notebook'}
          >
            {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            <span>{isSaved ? 'Pinned' : 'Pin'}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-graphite-400 hover:text-graphite hover:bg-ivory-200 rounded transition-colors"
            aria-label={expanded ? 'Collapse pipeline' : 'Expand pipeline'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* 01 — OBSERVATION */}
            <div className="relative pl-7 border-l-2 border-border-light">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-graphite-400 flex items-center justify-center">
                <Eye size={8} className="text-graphite" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-400">
                  01 — Observation
                </span>
                <p className="text-sm text-graphite font-normal leading-relaxed mt-1">
                  {insight.observation}
                </p>
              </div>
            </div>

            {/* 02 — HYPOTHESIS */}
            <div className="relative pl-7 border-l-2 border-border-light">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-accent flex items-center justify-center">
                <Lightbulb size={8} className="text-accent" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-medium">
                  02 — Hypothesis
                </span>
                <p className="text-sm text-graphite-600 leading-relaxed mt-1 italic">
                  "{insight.hypothesis}"
                </p>
              </div>
            </div>

            {/* 03 — EVIDENCE */}
            <div className="relative pl-7 border-l-2 border-border-light">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center">
                <BarChart3 size={8} className="text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-medium">
                  03 — Evidence (Quantitative Metrics)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-2">
                  {insight.evidence.map((ev, i) => (
                    <EvidenceCard key={i} evidence={ev} />
                  ))}
                </div>
              </div>
            </div>

            {/* 04 — IMPACT */}
            <div className="relative pl-7 border-l-2 border-border-light">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center">
                <Zap size={8} className="text-amber-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-medium">
                  04 — Strategy Impact
                </span>
                <p className="text-xs text-graphite-600 leading-relaxed mt-1 bg-ivory-100 p-2.5 rounded border border-border-light">
                  {insight.impact}
                </p>
              </div>
            </div>

            {/* 05 — NEXT TEST */}
            <div className="relative pl-7">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-graphite flex items-center justify-center">
                <ArrowRight size={8} className="text-white" />
              </div>
              <div className="p-3.5 bg-ivory-200/80 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-500 font-medium">
                    05 — Next Test (Actionable Experiment)
                  </span>
                  <p className="text-xs font-medium text-graphite mt-0.5">
                    {insight.nextTest.description}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onExecuteAction(insight.nextTest)}
                  className="btn-primary !py-1.5 !px-3 text-xs whitespace-nowrap flex items-center gap-1.5 shrink-0"
                >
                  <span>{insight.nextTest.label}</span>
                  <ArrowRight size={12} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export function ResearchTrail() {
  const {
    selectedAsset, setAsset,
    selectedStrategy, setStrategy,
    strategyParams, setStrategyParams,
    startDate, endDate,
    initialCapital, positionSizePct, transactionCostPct, setTransactionCost,
    metrics, backtestResult, correlationMatrix,
    regimePoints, regimePeriods, regimePerformance,
    robustnessResults, runRobustness,
    stressResult,
    setActiveSection,
    savedNotes, saveInsight, removeSavedNote,
  } = useResearchStore();

  const [activeTab, setActiveTab] = useState<'trail' | 'notebook'>('trail');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Compute live research insights deterministically
  const insights = useMemo(() => {
    return generateResearchInsights({
      asset: selectedAsset,
      strategy: selectedStrategy,
      params: strategyParams,
      startDate,
      endDate,
      initialCapital,
      positionSizePct,
      transactionCostPct,
      metrics,
      backtestResult,
      correlationMatrix,
      regimePoints,
      regimePeriods,
      regimePerformance,
      robustnessResults,
      stressResult,
    });
  }, [
    selectedAsset, selectedStrategy, strategyParams,
    startDate, endDate, initialCapital, positionSizePct, transactionCostPct,
    metrics, backtestResult, correlationMatrix,
    regimePoints, regimePeriods, regimePerformance,
    robustnessResults,
    stressResult,
  ]);

  // Filter insights by category if selected
  const filteredInsights = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return insights;
    return insights.filter(i => i.category === selectedCategoryFilter);
  }, [insights, selectedCategoryFilter]);

  // Handle interactive Next Test action execution
  const handleExecuteAction = useCallback((action: NextTestAction) => {
    switch (action.actionType) {
      case 'NAVIGATE':
        if (action.targetSection) {
          setActiveSection(action.targetSection);
        }
        break;
      case 'UPDATE_PARAMS':
        if (action.payload) {
          setStrategyParams(action.payload);
          setActiveSection('strategy');
        }
        break;
      case 'SET_STRATEGY':
        if (action.payload) {
          setStrategy(action.payload as StrategyType);
          setActiveSection('strategy');
        }
        break;
      case 'SET_TRANSACTION_COST':
        if (typeof action.payload === 'number') {
          setTransactionCost(action.payload);
          setActiveSection('strategy');
        }
        break;
      case 'RUN_ROBUSTNESS':
        runRobustness();
        setActiveSection('robustness');
        break;
      case 'SET_ASSET':
        if (action.payload) {
          setAsset(action.payload as Asset);
        }
        break;
    }
  }, [setActiveSection, setStrategyParams, setStrategy, setTransactionCost, runRobustness, setAsset]);

  const savedIds = useMemo(() => new Set(savedNotes.map(n => n.insight.id)), [savedNotes]);

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <p className="section-label">06 — Ghost Mode 2.0</p>
          <span className="text-[10px] font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
            DYNAMIC RESEARCH TRAIL
          </span>
        </div>
        <h2 className="editorial-md text-2xl mt-1">Quantitative Analyst Notebook</h2>
        <p className="body-sm mt-1 max-w-2xl">
          Automated quantitative reasoning pipeline generated from verified simulation outputs. Explains observations, formulates hypotheses, presents underlying mathematical evidence, measures strategy impact, and recommends iterative experiments.
        </p>
      </div>

      {/* Active Research Context & Provenance Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg border border-border">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[selectedAsset] }} />
            <span className="text-graphite-400">Asset:</span>
            <span className="font-medium text-graphite">{ASSET_LABELS[selectedAsset]}</span>
          </div>

          <div className="w-px h-3 bg-border" />

          <div className="flex items-center gap-1.5">
            <span className="text-graphite-400">Strategy:</span>
            <span className="font-medium text-graphite">{STRATEGY_LABELS[selectedStrategy]}</span>
          </div>

          <div className="w-px h-3 bg-border" />

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-graphite-500">
            <span>{startDate}</span>
            <span>→</span>
            <span>{endDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-graphite-400 bg-ivory-200 px-2 py-0.5 rounded border border-border-light">
            Dataset: Offline Calibrated (2019–2023)
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Zero-Fabrication Mode
          </span>
        </div>
      </div>

      {/* View Tabs & Category Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('trail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'trail'
                ? 'bg-graphite text-white'
                : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
            }`}
          >
            <Compass size={13} />
            Active Research Trail ({insights.length})
          </button>

          <button
            onClick={() => setActiveTab('notebook')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'notebook'
                ? 'bg-graphite text-white'
                : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
            }`}
          >
            <BookOpen size={13} />
            Pinned Notes ({savedNotes.length})
          </button>
        </div>

        {activeTab === 'trail' && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-2 py-1 rounded transition-colors text-[11px] font-mono ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-graphite text-white font-medium'
                  : 'text-graphite-400 hover:text-graphite'
              }`}
            >
              All Categories
            </button>
            {Object.keys(CATEGORY_META).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2 py-1 rounded transition-colors text-[11px] font-mono ${
                  selectedCategoryFilter === cat
                    ? 'bg-graphite text-white font-medium'
                    : 'text-graphite-400 hover:text-graphite'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'trail' ? (
        <div className="space-y-6">
          {filteredInsights.length > 0 ? (
            filteredInsights.map((insight, index) => (
              <InsightPipelineCard
                key={insight.id}
                insight={insight}
                index={index}
                onExecuteAction={handleExecuteAction}
                onSaveInsight={saveInsight}
                isSaved={savedIds.has(insight.id)}
              />
            ))
          ) : (
            <div className="research-card text-center py-16">
              <Sparkles size={24} className="text-accent mx-auto mb-3" />
              <p className="text-sm font-medium text-graphite">No active insights for this filter</p>
              <p className="text-xs text-graphite-400 mt-1 max-w-sm mx-auto">
                Try selecting All Categories or adjusting your strategy parameters in Strategy Lab.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Pinned Notes / Session History */
        <div className="space-y-4">
          {savedNotes.length > 0 ? (
            savedNotes.map((note) => (
              <div
                key={note.id}
                className="research-card border border-border hover:shadow-elevated transition-shadow relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[note.asset] }} />
                    <span className="text-xs font-medium text-graphite">
                      {ASSET_LABELS[note.asset]} · {STRATEGY_LABELS[note.strategy]}
                    </span>
                    <span className="text-[10px] font-mono text-graphite-400">
                      {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => removeSavedNote(note.id)}
                    className="p-1 text-graphite-400 hover:text-red-500 rounded transition-colors"
                    title="Remove from notebook"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <h4 className="text-sm font-medium text-graphite mb-2">
                  {note.insight.title}
                </h4>

                <div className="space-y-2 text-xs text-graphite-600 bg-ivory-100 p-3 rounded border border-border-light">
                  <p><strong className="text-graphite">Observation:</strong> {note.insight.observation}</p>
                  <p><strong className="text-accent">Hypothesis:</strong> {note.insight.hypothesis}</p>
                  <p><strong className="text-amber-700">Impact:</strong> {note.insight.impact}</p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-border-light text-[11px]">
                  <span className="text-graphite-400">Next Recommended Test:</span>
                  <button
                    onClick={() => handleExecuteAction(note.insight.nextTest)}
                    className="text-accent hover:underline flex items-center gap-1 font-medium"
                  >
                    {note.insight.nextTest.label}
                    <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="research-card text-center py-16">
              <Bookmark size={24} className="text-graphite-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-graphite">No pinned research notes yet</p>
              <p className="text-xs text-graphite-400 mt-1 max-w-sm mx-auto">
                As you review the active research trail, click "Pin" on any observation to preserve it in your analyst notebook for this session.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
