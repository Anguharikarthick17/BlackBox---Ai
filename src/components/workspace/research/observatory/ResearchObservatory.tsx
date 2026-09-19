import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  runResearchSession,
  CompletedResearchResult,
} from '../../../../core/research/researchOrchestrator';
import {
  sealResearchSession,
  globalResearchCaseStore,
  ResearchCase,
  ResearchReplayEngine,
  globalAuditTimeline,
  AuditEvent,
} from '../../../../core/research/audit';
import {
  ExperimentNode,
  EvidenceRecord,
  ResearchClaim,
  GraphNode,
} from '../../../../core/research/researchTypes';
import {
  ObservatoryStage,
  deriveMarketEvidenceSnapshot,
  deriveStrategyEvidenceSnapshot,
  deriveRiskSnapshot,
  deriveRegimeSnapshot,
  deriveStressSnapshot,
  deriveMonteCarloSnapshot,
} from '../../../../core/research/observatory';
import { ObservatoryHeader } from './ObservatoryHeader';
import { ResearchQuestion } from './ResearchQuestion';
import { HypothesisPanel } from './HypothesisPanel';
import { InvestigationPlan } from './InvestigationPlan';
import { EvidenceWall } from './EvidenceWall';
import { MarketEvidenceSnapshotView } from './MarketEvidenceSnapshot';
import { StrategyEvidenceSnapshotView } from './StrategyEvidenceSnapshot';
import { RiskSnapshot } from './RiskSnapshot';
import { RegimeSnapshot } from './RegimeSnapshot';
import { ContradictionCenter } from './ContradictionCenter';
import { GenomeSnapshot } from './GenomeSnapshot';
import { StressSnapshot } from './StressSnapshot';
import { MonteCarloSnapshot } from './MonteCarloSnapshot';
import { ResearchTimeline } from './ResearchTimeline';
import { EvidenceGraphView } from './EvidenceGraphView';
import { ObservatoryClaimInspector } from './ObservatoryClaimInspector';
import { ResearchSynthesisView } from './ResearchSynthesis';
import { ResearchMemo } from './ResearchMemo';
import { ReplayCTA } from './ReplayCTA';
import { ObservatoryCore3D } from './ObservatoryCore3D';
import { CaseExportPanel } from '../audit/CaseExportPanel';
import { ResearchDiffView } from '../audit/ResearchDiffView';
import { ResearchDiffEngine } from '../../../../core/research/audit/researchDiff';
import { ReplayVerification } from '../audit/ReplayVerification';
import { useResearchStore } from '../../../../store/researchStore';
import {
  Compass,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck,
  Activity,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

const PROGRESS_RAIL: Array<{ id: ObservatoryStage; label: string; sectionId: string }> = [
  { id: 'ASK', label: 'ASK', sectionId: 'sec-question' },
  { id: 'INVESTIGATE', label: 'INVESTIGATE', sectionId: 'sec-plan' },
  { id: 'INSPECT', label: 'INSPECT', sectionId: 'sec-evidence' },
  { id: 'CHALLENGE', label: 'CHALLENGE', sectionId: 'sec-challenge' },
  { id: 'CONCLUDE', label: 'CONCLUDE', sectionId: 'sec-synthesis' },
  { id: 'REPLAY', label: 'REPLAY', sectionId: 'sec-replay' },
];

export const ResearchObservatory: React.FC = () => {
  const { setActiveSection } = useResearchStore();
  const [activeStage, setActiveStage] = useState<ObservatoryStage>('ASK');
  const [isRunning, setIsRunning] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentResult, setCurrentResult] = useState<CompletedResearchResult | null>(null);
  const [researchCase, setResearchCase] = useState<ResearchCase | null>(null);
  const [auditEvents, setAuditEvents] = useState<readonly AuditEvent[]>([]);

  // Modals & Drawers
  const [selectedClaim, setSelectedClaim] = useState<ResearchClaim | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | undefined>(undefined);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | undefined>(undefined);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [replayVerificationResult, setReplayVerificationResult] = useState<any>(null);

  // Auto-run default inquiry on initial mount if empty
  useEffect(() => {
    const existingCases = globalResearchCaseStore.listCases();
    if (existingCases.length > 0) {
      const latest = existingCases[0];
      setResearchCase(latest);
      setAuditEvents(globalAuditTimeline.getEvents(latest.caseId));
    } else {
      handleLaunchInquiry('Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?');
    }
  }, []);

  const handleLaunchInquiry = async (queryText: string) => {
    if (!queryText.trim() || isRunning) return;
    setIsRunning(true);

    try {
      const result = await runResearchSession(queryText);
      setCurrentResult(result);

      const sealed = sealResearchSession(result.session, result.memo, {
        evidenceRecords: result.evidence,
      });
      globalResearchCaseStore.saveCase(sealed);
      setResearchCase(sealed);
      setAuditEvents(globalAuditTimeline.getEvents(sealed.caseId));
      setActiveStage('INSPECT');
    } catch (err) {
      console.error('Observatory research execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReplayCase = async () => {
    if (!researchCase || isReplaying) return;
    setIsReplaying(true);
    try {
      const result = await ResearchReplayEngine.replayCase(researchCase);
      setReplayVerificationResult(result.verification);
      setAuditEvents(globalAuditTimeline.getEvents(researchCase.caseId));
      setActiveStage('REPLAY');
    } catch (err) {
      console.error('Replay failed:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleScrollToSection = (sectionId: string, stage: ObservatoryStage) => {
    setActiveStage(stage);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Derive quantitative snapshots directly from existing engines
  const marketSnapshot = useMemo(() => deriveMarketEvidenceSnapshot('BTC'), []);
  const strategySnapshot = useMemo(() => deriveStrategyEvidenceSnapshot('BTC', 'EMA_TREND'), []);
  const riskSnapshot = useMemo(() => deriveRiskSnapshot(), []);
  const regimeSnapshot = useMemo(() => deriveRegimeSnapshot('BTC'), []);
  const stressSnapshot = useMemo(() => deriveStressSnapshot('COVID_2020'), []);
  const monteCarloSnapshot = useMemo(() => deriveMonteCarloSnapshot(), []);

  return (
    <div className="min-h-screen bg-ivory-50 text-graphite pb-24 font-sans">
      {/* 1. Master Header */}
      <ObservatoryHeader
        researchCase={researchCase}
        isRunning={isRunning}
        onReset={() => handleLaunchInquiry('Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?')}
        onRefreshReplay={handleReplayCase}
      />

      {/* 2. Sticky Persistent Research Progress Rail */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-border py-2.5 px-4 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-0.5 no-scrollbar text-xs font-mono">
            {PROGRESS_RAIL.map((rail, idx) => {
              const isActive = activeStage === rail.id;
              return (
                <React.Fragment key={rail.id}>
                  <button
                    onClick={() => handleScrollToSection(rail.sectionId, rail.id)}
                    className={`px-3 py-1 rounded transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-crimson text-cream font-bold shadow-xs'
                        : 'text-graphite-400 hover:text-graphite hover:bg-ivory-100'
                    }`}
                  >
                    <span>0{idx + 1}</span>
                    <span>{rail.label}</span>
                  </button>
                  {idx < PROGRESS_RAIL.length - 1 && (
                    <span className="text-graphite-300 select-none text-[10px]">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-graphite-400">
            <span>Deterministic • Bounded • Reproducible</span>
          </div>
        </div>
      </div>

      {/* 3. Continuous Progressive Disclosure Research Canvas */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* Section 01: Research Question */}
        <section id="sec-question" className="scroll-mt-20">
          <ResearchQuestion
            onRunQuestion={handleLaunchInquiry}
            isRunning={isRunning}
            activeQuestion={researchCase?.question}
          />
        </section>

        {/* Section 02: Hypothesis Panel */}
        {researchCase && (
          <section id="sec-hypothesis" className="scroll-mt-20">
            <HypothesisPanel
              hypotheses={researchCase.hypotheses}
              question={researchCase.question}
            />
          </section>
        )}

        {/* Section 03: Investigation Plan */}
        {researchCase && (
          <section id="sec-plan" className="scroll-mt-20">
            <InvestigationPlan
              experiments={researchCase.experiments}
              evidenceRecords={researchCase.evidence}
              selectedExperimentId={selectedExperimentId}
              onSelectExperiment={(exp, ev) => {
                setSelectedExperimentId(exp.experimentId);
                if (ev) setSelectedEvidenceId(ev.evidenceId);
              }}
            />
          </section>
        )}

        {/* Section 04: Market Evidence */}
        <section id="sec-market" className="scroll-mt-20">
          <MarketEvidenceSnapshotView
            snapshot={marketSnapshot}
            onOpenMarketContext={() => setActiveSection('market')}
          />
        </section>

        {/* Section 05: Strategy Evidence */}
        <section id="sec-strategy" className="scroll-mt-20">
          <StrategyEvidenceSnapshotView
            snapshot={strategySnapshot}
            onOpenStrategyLab={() => setActiveSection('strategy')}
          />
        </section>

        {/* Section 06: Risk & Stress */}
        <section id="sec-risk" className="scroll-mt-20">
          <RiskSnapshot
            snapshot={riskSnapshot}
            onOpenStressLab={() => setActiveSection('stress')}
            onOpenMonteCarlo={() => setActiveSection('portfolio')}
            onOpenPortfolioRisk={() => setActiveSection('portfolio')}
          />
        </section>

        {/* Section 07: Regime Behaviour */}
        <section id="sec-regime" className="scroll-mt-20">
          <RegimeSnapshot
            snapshot={regimeSnapshot}
            onOpenRegimes={() => setActiveSection('regimes')}
          />
        </section>

        {/* Section 08: Contradiction Center (Challenge) */}
        {researchCase && (
          <section id="sec-challenge" className="scroll-mt-20">
            <ContradictionCenter
              contradictions={researchCase.contradictions}
              secondaryTests={researchCase.secondaryTests}
            />
          </section>
        )}

        {/* Section 09: Central Evidence Wall */}
        {researchCase && (
          <section id="sec-evidence" className="scroll-mt-20">
            <EvidenceWall
              evidenceRecords={researchCase.evidence}
              selectedEvidenceId={selectedEvidenceId}
              onInspectLineage={evId => setSelectedEvidenceId(evId)}
              onInspectClaim={ev => {
                const boundClaim = researchCase.manifest.research.claims.find(c =>
                  c.evidenceIds.includes(ev.evidenceId)
                );
                if (boundClaim) {
                  setSelectedClaim({
                    claimId: boundClaim.claimId,
                    metric: boundClaim.metric,
                    value: boundClaim.value,
                    text: `Claim ${boundClaim.claimId}: ${boundClaim.metric} = ${boundClaim.value}`,
                    claimType: 'DIRECT_OBSERVATION',
                    evidenceIds: boundClaim.evidenceIds,
                  });
                }
              }}
            />
          </section>
        )}

        {/* 3D Research Evidence Core & Genome Integration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ObservatoryCore3D />
          <GenomeSnapshot onOpenGenome={() => setActiveSection('genome')} />
        </div>

        {/* Stress & Monte Carlo Deep Dives */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StressSnapshot
            snapshot={stressSnapshot}
            onOpenStressLab={() => setActiveSection('stress')}
          />
          <MonteCarloSnapshot
            snapshot={monteCarloSnapshot}
            onOpenMonteCarlo={() => setActiveSection('portfolio')}
          />
        </div>

        {/* Evidence Graph & Lifecycle Timeline */}
        {currentResult?.graph && (
          <section className="scroll-mt-20">
            <EvidenceGraphView
              graph={currentResult.graph}
              onSelectNode={node => {
                if (node.type === 'EVIDENCE') {
                  setSelectedEvidenceId(node.id);
                  handleScrollToSection('sec-evidence', 'INSPECT');
                }
              }}
            />
          </section>
        )}

        <section className="scroll-mt-20">
          <ResearchTimeline auditEvents={auditEvents} />
        </section>

        {/* Section 09: Research Synthesis & Memo */}
        {researchCase && (
          <section id="sec-synthesis" className="scroll-mt-20 space-y-6">
            <ResearchSynthesisView
              synthesis={researchCase.synthesis}
              onSelectClaim={c => setSelectedClaim(c)}
            />

            <ResearchMemo
              memo={researchCase.memo}
              researchCase={researchCase}
              onOpenExportPanel={() => setIsExportOpen(true)}
              onOpenFullMemo={() => setActiveSection('research')}
            />
          </section>
        )}

        {/* Section 10: Replay & Audit Layer CTA */}
        {researchCase && (
          <section id="sec-replay" className="scroll-mt-20">
            <ReplayCTA
              researchCase={researchCase}
              onReplayCase={handleReplayCase}
              onVerifyEvidence={handleReplayCase}
              onCompareCase={() => setIsDiffOpen(true)}
              onExportCase={() => setIsExportOpen(true)}
              isReplaying={isReplaying}
            />

            {/* Replay Verification Result Card if executed */}
            {replayVerificationResult && (
              <div className="mt-6">
                <ReplayVerification verification={replayVerificationResult} />
              </div>
            )}
          </section>
        )}
      </main>

      {/* Claim Inspector Modal */}
      {selectedClaim && researchCase && (
        <ObservatoryClaimInspector
          claim={selectedClaim}
          researchCase={researchCase}
          onClose={() => setSelectedClaim(null)}
          onOpenLineage={() => {
            // Scroll to evidence wall
            handleScrollToSection('sec-evidence', 'INSPECT');
          }}
        />
      )}

      {/* Case Export Dialog */}
      {isExportOpen && researchCase && (
        <div className="fixed inset-0 bg-graphite/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-base font-semibold text-graphite font-mono">
                Institutional Research Case Export
              </h3>
              <button
                onClick={() => setIsExportOpen(false)}
                className="btn-ghost text-xs px-2.5 py-1 border border-border"
              >
                Close
              </button>
            </div>
            <CaseExportPanel
              caseData={researchCase}
              latestVerification={replayVerificationResult || undefined}
            />
          </div>
        </div>
      )}

      {/* Case Diff Dialog */}
      {isDiffOpen && researchCase && (
        <div className="fixed inset-0 bg-graphite/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border-light mb-4">
              <h3 className="text-base font-semibold text-graphite font-mono">
                Neutral Comparative Research Diff
              </h3>
              <button
                onClick={() => setIsDiffOpen(false)}
                className="btn-ghost text-xs px-2.5 py-1 border border-border"
              >
                Close
              </button>
            </div>
            <ResearchDiffView diff={ResearchDiffEngine.compareCases(researchCase, researchCase)} />
          </div>
        </div>
      )}
    </div>
  );
};
