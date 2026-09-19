import React, { useState, useEffect } from 'react';
import {
  runResearchSession,
  CompletedResearchResult,
  ResearchProgressUpdate,
} from '../../../core/research/researchOrchestrator';
import { ExperimentNode, EvidenceRecord } from '../../../core/research/researchTypes';
import { ResearchPlanView } from './ResearchPlanView';
import { HypothesisBoard } from './HypothesisBoard';
import { ExperimentTimeline } from './ExperimentTimeline';
import { EvidenceGraph } from './EvidenceGraph';
import { ContradictionPanel } from './ContradictionPanel';
import { SecondaryTestPanel } from './SecondaryTestPanel';
import { ExperimentInspectorModal } from './ExperimentInspectorModal';
import { ResearchMemoView } from './ResearchMemoView';
import { ResearchComparisonModal } from './ResearchComparisonModal';
import { ResearchProvenance } from './ResearchProvenance';
import { ResearchCaseView } from './audit/ResearchCaseView';
import { sealResearchSession, globalResearchCaseStore, ResearchCase } from '../../../core/research/audit';
import {
  Compass,
  Sparkles,
  Play,
  RotateCcw,
  Network,
  FileText,
  AlertTriangle,
  Layers,
  Columns2,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  Terminal,
  ShieldCheck,
} from 'lucide-react';

const SUGGESTED_INQUIRIES = [
  'Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?',
  'Does starting regime alter simulated Monte Carlo tail risk?',
  'How sensitive is active trend alpha to transaction cost friction?',
  'Which assets drive portfolio volatility and risk concentration?',
  'How does the portfolio absorb a macroeconomic crash stress scenario?',
];

const LIFECYCLE_STAGES = [
  'QUESTION',
  'PLANNING',
  'RUNNING',
  'ANALYZING',
  'CONTRADICTION_CHECK',
  'SECONDARY_TEST',
  'SYNTHESIZING',
  'COMPLETE',
] as const;

export const ResearchWorkspace: React.FC = () => {
  const [query, setQuery] = useState(SUGGESTED_INQUIRIES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ResearchProgressUpdate | null>(null);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'MEMO' | 'GRAPH' | 'TIMELINE' | 'CONTRADICTIONS' | 'AUDIT'
  >('OVERVIEW');

  const [currentResult, setCurrentResult] = useState<CompletedResearchResult | null>(null);
  const [currentCase, setCurrentCase] = useState<ResearchCase | null>(null);
  const [pastSessions, setPastSessions] = useState<CompletedResearchResult[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<{
    experiment: ExperimentNode;
    evidence?: EvidenceRecord;
  } | null>(null);

  const [comparisonPair, setComparisonPair] = useState<[CompletedResearchResult, CompletedResearchResult] | null>(
    null
  );

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-run baseline on initial mount if empty
  useEffect(() => {
    handleRunResearch(query);
  }, []);

  const handleRunResearch = async (inquiryText: string) => {
    if (!inquiryText.trim() || isRunning) return;
    setIsRunning(true);
    setErrorMessage(null);

    try {
      const result = await runResearchSession(inquiryText, {
        onProgress: update => {
          setProgress(update);
        },
      });

      setCurrentResult(result);
      const sealed = sealResearchSession(result.session, result.memo, {
        evidenceRecords: result.evidence,
      });
      globalResearchCaseStore.saveCase(sealed);
      setCurrentCase(sealed);
      setPastSessions(prev => [result, ...prev.slice(0, 4)]);
      setActiveTab('OVERVIEW');
    } catch (err: any) {
      setErrorMessage(err.message || 'Research session execution failed.');
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const currentStageIndex = progress
    ? LIFECYCLE_STAGES.indexOf(progress.stage as any)
    : currentResult
    ? LIFECYCLE_STAGES.length - 1
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-accent" />
              <h1 className="text-base font-bold text-graphite tracking-tight">
                Institutional Research Workspace
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-accent/10 text-accent border border-accent/20">
                PHASE 4.0 ORCHESTRATION
              </span>
            </div>
            <p className="text-xs text-graphite-400">
              Deterministic, audit-verifiable quantitative research notebook. Zero financial calculations in AI layer.
            </p>
          </div>

          {pastSessions.length >= 2 && currentResult && (
            <button
              onClick={() => setComparisonPair([currentResult, pastSessions[1]])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-ivory-100 hover:bg-ivory-200 border border-border rounded-md text-xs font-medium text-graphite transition-colors shadow-2xs self-start"
            >
              <Columns2 className="w-3.5 h-3.5 text-accent" />
              Compare Past Sessions ({pastSessions.length})
            </button>
          )}
        </div>

        {/* Natural Language Question Input */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRunResearch(query)}
                disabled={isRunning}
                placeholder="Enter quantitative research question (e.g., Why did BTC EMA Trend underperform Buy & Hold?)"
                className="w-full px-4 py-2.5 bg-ivory-100/60 border border-border rounded-lg text-xs font-medium text-graphite focus:outline-hidden focus:ring-1 focus:ring-accent focus:bg-white transition-all pr-8"
              />
            </div>
            <button
              onClick={() => handleRunResearch(query)}
              disabled={isRunning || !query.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-graphite text-white rounded-lg text-xs font-medium hover:bg-graphite-600 disabled:opacity-50 transition-colors shrink-0 shadow-xs"
            >
              {isRunning ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Orchestrating...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Investigate
                </>
              )}
            </button>
          </div>

          {/* Preset Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase text-graphite-400 mr-1">
              Archetypes:
            </span>
            {SUGGESTED_INQUIRIES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(preset);
                  handleRunResearch(preset);
                }}
                disabled={isRunning}
                className="px-2.5 py-1 bg-ivory-200/60 hover:bg-ivory-200 border border-border/80 rounded-md text-[11px] text-graphite transition-colors truncate max-w-xs"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 9-Stage Research Lifecycle Status Bar */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between text-[10px] font-mono text-graphite-400 mb-2">
            <span>SESSION LIFECYCLE: {progress ? progress.stage : currentResult ? 'COMPLETE' : 'IDLE'}</span>
            {progress && <span>{progress.completedExperiments} / {progress.totalExperiments} Tools Dispatched</span>}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {LIFECYCLE_STAGES.map((stg, i) => {
              const isPast = currentStageIndex > i;
              const isCurrent = currentStageIndex === i && isRunning;
              return (
                <div
                  key={stg}
                  className={`p-1.5 rounded border text-[9px] font-mono text-center truncate ${
                    isCurrent
                      ? 'bg-accent text-white border-accent animate-pulse font-bold'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                      : 'bg-ivory-100 text-graphite-400 border-border'
                  }`}
                >
                  {stg.replace(/_/g, ' ')}
                </div>
              );
            })}
          </div>

          {progress && (
            <div className="mt-2 flex items-center gap-2 text-xs font-mono text-graphite bg-ivory-100 p-2 rounded border border-border">
              <Terminal className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>{progress.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Investigation Workspace */}
      {currentResult && (
        <div className="space-y-6">
          {/* View Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-graphite-400 hover:text-graphite'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Investigation Overview
            </button>
            <button
              onClick={() => setActiveTab('MEMO')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'MEMO'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-graphite-400 hover:text-graphite'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Research Memo ({currentResult.memo.memoId})
            </button>
            <button
              onClick={() => setActiveTab('GRAPH')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'GRAPH'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-graphite-400 hover:text-graphite'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Evidence Graph (DAG)
            </button>
            <button
              onClick={() => setActiveTab('TIMELINE')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'TIMELINE'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-graphite-400 hover:text-graphite'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Experiments ({currentResult.evidence.length})
            </button>
            <button
              onClick={() => setActiveTab('CONTRADICTIONS')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-medium transition-all ${
                activeTab === 'CONTRADICTIONS'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-graphite-400 hover:text-graphite'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Contradictions & Sweeps ({currentResult.contradictions.length + currentResult.secondaryTests.length})
            </button>
            {currentCase && (
              <button
                onClick={() => setActiveTab('AUDIT')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-medium transition-all ${
                  activeTab === 'AUDIT'
                    ? 'border-emerald-500 text-emerald-600 font-semibold'
                    : 'border-transparent text-graphite-400 hover:text-graphite'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Audit & Decision Replay ({currentCase.caseId})
              </button>
            )}
          </div>

          {/* Active Tab View */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Executive Observation Card */}
              <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-accent">
                    Executive Quantitative Observation
                  </span>
                  <span className="text-[10px] font-mono text-graphite-400">
                    Ref: {currentResult.memo.memoId}
                  </span>
                </div>
                <p className="text-sm font-sans text-graphite leading-relaxed">
                  {currentResult.synthesis.executiveObservation}
                </p>

                {/* Ghost Mode deterministic insights */}
                {currentResult.ghostInsights.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Ghost Mode 2.0 Quantitative Insights
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentResult.ghostInsights.map((g, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-ivory-100 rounded border border-border text-xs space-y-1"
                        >
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold bg-graphite text-white">
                            {g.type.replace(/_/g, ' ')}
                          </span>
                          <p className="text-graphite text-[11px] font-sans">{g.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Hypotheses Board */}
              <HypothesisBoard hypotheses={currentResult.hypotheses} />

              {/* Planned DAG Overview */}
              <ResearchPlanView plan={currentResult.plan} />

              {/* Contradictions & Secondary Testing */}
              <div className="space-y-4">
                <ContradictionPanel contradictions={currentResult.contradictions} />
                <SecondaryTestPanel secondaryTests={currentResult.secondaryTests} />
              </div>

              {/* Audit Provenance */}
              <ResearchProvenance
                provenance={currentResult.session.provenance}
                datasetFingerprint={currentResult.session.datasetFingerprint}
                configurationFingerprint={currentResult.session.configurationFingerprint}
                limitations={currentResult.session.limitations}
              />
            </div>
          )}

          {activeTab === 'MEMO' && (
            <ResearchMemoView
              memo={currentResult.memo}
              session={currentResult.session}
              evidence={currentResult.evidence}
            />
          )}

          {activeTab === 'GRAPH' && (
            <EvidenceGraph
              graph={currentResult.graph}
              onSelectNode={node => {
                if (node.type === 'EXPERIMENT') {
                  const exp = currentResult.plan.experiments.find(e => e.experimentId === node.id.replace('NODE-', ''));
                  const ev = currentResult.evidence.find(e => e.experimentId === node.id.replace('NODE-', ''));
                  if (exp) setSelectedExperiment({ experiment: exp, evidence: ev });
                }
              }}
            />
          )}

          {activeTab === 'TIMELINE' && (
            <ExperimentTimeline
              experiments={currentResult.plan.experiments}
              evidenceRecords={currentResult.evidence}
              onInspectExperiment={(exp, ev) => setSelectedExperiment({ experiment: exp, evidence: ev })}
            />
          )}

          {activeTab === 'CONTRADICTIONS' && (
            <div className="space-y-6">
              <ContradictionPanel contradictions={currentResult.contradictions} />
              <SecondaryTestPanel secondaryTests={currentResult.secondaryTests} />
            </div>
          )}

          {activeTab === 'AUDIT' && currentCase && (
            <ResearchCaseView caseData={currentCase} />
          )}
        </div>
      )}

      {/* Drilldown Modals */}
      {selectedExperiment && (
        <ExperimentInspectorModal
          experiment={selectedExperiment.experiment}
          evidence={selectedExperiment.evidence}
          onClose={() => setSelectedExperiment(null)}
        />
      )}

      {comparisonPair && (
        <ResearchComparisonModal
          sessionA={comparisonPair[0]}
          sessionB={comparisonPair[1]}
          onClose={() => setComparisonPair(null)}
        />
      )}
    </div>
  );
};
