import { create } from 'zustand';
import { Asset, PRICE_DATA } from '../core/data';
import { StrategyType, StrategyParams, DEFAULT_PARAMS, generateSignals } from '../core/strategies';
import { runBacktest, BacktestResult } from '../core/backtest';
import { computeMetrics, MetricsResult } from '../core/metrics';
import { computeCorrelationMatrix, CorrelationMatrix } from '../core/correlations';
import {
  detectRegimes, computeRegimePeriods, RegimePoint, RegimePeriod,
  strategyPerformanceByRegime, RegimeStrategyPerf,
} from '../core/regimes';
import {
  runRobustnessSweep, generateDefaultConfigs, RobustnessResult,
} from '../core/robustness';
import { getDataInRange } from '../core/data';

import { ResearchInsight } from '../core/insights';
import {
  StressScenarioId, CustomShockParams, StressResult,
  DEFAULT_CUSTOM_SHOCK, runStressSimulation,
} from '../core/stressTesting';
import { GenomeMode, GenomeCorrelationMode, GenomeRollingWindow } from '../core/strategyGenome';
import { buildResearchPack, ResearchPack } from '../core/researchPack';
import { RiskCommitteeBrief } from '../core/riskBriefValidator';
import { requestRiskCommitteeBrief, RiskBriefStatus } from '../services/riskCommittee';
import {
  AssistantMessageData,
  AssistantMode,
  ToolActivityItem,
  AssistantChatResponse,
} from '../services/ai/types';
import {
  ResearchConclusion,
  ResearchRunState,
  runAutonomousResearch,
} from '../core/researchAgent';
import { globalResearchCaseStore } from '../core/research/audit/researchCaseStore';

export interface ResearchEntry {
  id: string;
  observation: string;
  hypothesis: string;
  evidence: string;
  impact: string;
  nextTest: string;
  timestamp: Date;
}

export interface SavedResearchNote {
  id: string;
  timestamp: Date;
  insight: ResearchInsight;
  asset: Asset;
  strategy: StrategyType;
}

interface ResearchStore {
  // Selected asset & config
  selectedAsset: Asset;
  selectedStrategy: StrategyType;
  strategyParams: StrategyParams;
  initialCapital: number;
  positionSizePct: number;
  transactionCostPct: number;
  startDate: string;
  endDate: string;
  activeSection: string;

  // Computed results
  metrics: MetricsResult | null;
  backtestResult: BacktestResult | null;
  correlationMatrix: CorrelationMatrix | null;
  regimePoints: RegimePoint[];
  regimePeriods: RegimePeriod[];
  regimePerformance: RegimeStrategyPerf[];
  isBacktesting: boolean;

  // Robustness
  robustnessResults: RobustnessResult[];
  isRobustnessTesting: boolean;

  // Stress Testing
  selectedStressScenario: StressScenarioId;
  customStressParams: CustomShockParams;
  stressResult: StressResult | null;
  isStressTesting: boolean;

  // Research trail
  researchTrail: ResearchEntry[];
  savedNotes: SavedResearchNote[];

  // Strategy Genome
  selectedGenomeMode: GenomeMode;
  selectedGenomeNodeId: string | null;
  selectedGenomeEdgeId: string | null;
  genomeCorrelationMode: GenomeCorrelationMode;
  genomeCorrelationWindow: GenomeRollingWindow;

  // AI Risk Committee (Phase 3.4)
  riskBrief: RiskCommitteeBrief | null;
  riskBriefStatus: RiskBriefStatus;
  riskBriefError: string | null;
  riskBriefDetails: string[];
  lastBriefFingerprint: string | null;
  isGeneratingRiskBrief: boolean;

  // BLACKBOX AI Research Assistant (Phase 3.5)
  assistantMessages: AssistantMessageData[];
  isAssistantThinking: boolean;
  assistantActiveMode: AssistantMode;
  currentToolActivity: ToolActivityItem[];
  assistantError: string | null;
  assistantConfigured: boolean;

  // Autonomous Quant Research Agent (Phase 3.6)
  isResearchRunning: boolean;
  researchRunState: ResearchRunState | null;
  latestConclusion: ResearchConclusion | null;
  researchError: string | null;

  // Actions
  setAsset: (asset: Asset) => void;
  setStrategy: (strategy: StrategyType) => void;
  setStrategyParams: (params: Partial<StrategyParams>) => void;
  setCapital: (capital: number) => void;
  setPositionSize: (pct: number) => void;
  setTransactionCost: (pct: number) => void;
  setDateRange: (start: string, end: string) => void;
  setActiveSection: (section: string) => void;
  runBacktest: () => void;
  runRobustness: () => void;
  setStressScenario: (scenario: StressScenarioId) => void;
  setCustomStressParams: (params: Partial<CustomShockParams>) => void;
  runStressTest: () => void;
  setGenomeMode: (mode: GenomeMode) => void;
  setSelectedGenomeNodeId: (id: string | null) => void;
  setSelectedGenomeEdgeId: (id: string | null) => void;
  setGenomeCorrelationMode: (mode: GenomeCorrelationMode) => void;
  setGenomeCorrelationWindow: (window: GenomeRollingWindow) => void;
  generateRiskBrief: (options?: { force?: boolean; mockFallback?: boolean }) => Promise<void>;
  clearRiskBrief: () => void;
  setRiskBriefStatus: (status: RiskBriefStatus, error?: string, details?: string[]) => void;
  sendAssistantMessage: (content: string, options?: { offlineDemo?: boolean }) => Promise<void>;
  clearAssistantConversation: () => void;
  runAutonomousInvestigation: (query: string) => Promise<void>;
  resetAutonomousResearch: () => void;
  addResearchEntry: (entry: Omit<ResearchEntry, 'id' | 'timestamp'>) => void;
  removeResearchEntry: (id: string) => void;
  saveInsight: (insight: ResearchInsight) => void;
  removeSavedNote: (id: string) => void;
  initCorrelations: () => void;
  resetDemoState: () => void;
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  selectedAsset: 'BTC',
  selectedStrategy: 'EMA_TREND',
  strategyParams: DEFAULT_PARAMS['EMA_TREND'],
  initialCapital: 100000,
  positionSizePct: 0.95,
  transactionCostPct: 0.001,
  startDate: '2020-01-01',
  endDate: '2023-12-31',
  activeSection: 'market',

  // Autonomous Quant Research Agent (Phase 3.6)
  isResearchRunning: false,
  researchRunState: null,
  latestConclusion: null,
  researchError: null,

  metrics: null,
  backtestResult: null,
  correlationMatrix: null,
  regimePoints: [],
  regimePeriods: [],
  regimePerformance: [],
  isBacktesting: false,
  robustnessResults: [],
  isRobustnessTesting: false,
  selectedStressScenario: 'COVID_2020',
  customStressParams: DEFAULT_CUSTOM_SHOCK,
  stressResult: null,
  isStressTesting: false,
  selectedGenomeMode: 'MARKET',
  selectedGenomeNodeId: null,
  selectedGenomeEdgeId: null,
  genomeCorrelationMode: 'STATIC',
  genomeCorrelationWindow: 60,
  riskBrief: null,
  riskBriefStatus: 'IDLE',
  riskBriefError: null,
  riskBriefDetails: [],
  lastBriefFingerprint: null,
  isGeneratingRiskBrief: false,
  assistantMessages: [],
  isAssistantThinking: false,
  assistantActiveMode: 'GENERAL',
  currentToolActivity: [],
  assistantError: null,
  assistantConfigured: true,
  researchTrail: [],
  savedNotes: [],

  setAsset: (asset) => set({ selectedAsset: asset }),
  setStrategy: (strategy) => set({ selectedStrategy: strategy, strategyParams: DEFAULT_PARAMS[strategy] }),
  setStrategyParams: (params) => set(s => ({ strategyParams: { ...s.strategyParams, ...params } })),
  setCapital: (capital) => set({ initialCapital: capital }),
  setPositionSize: (pct) => set({ positionSizePct: pct }),
  setTransactionCost: (pct) => set({ transactionCostPct: pct }),
  setDateRange: (start, end) => set({ startDate: start, endDate: end }),
  setActiveSection: (section) => set({ activeSection: section }),

  runBacktest: () => {
    const state = get();
    set({ isBacktesting: true });

    setTimeout(() => {
      const prices = getDataInRange(state.selectedAsset, state.startDate, state.endDate);
      if (prices.length < 10) {
        set({ isBacktesting: false });
        return;
      }

      const metrics = computeMetrics(prices);
      const signals = generateSignals(prices, state.selectedStrategy, state.strategyParams);
      const result = runBacktest(prices, signals, {
        initialCapital: state.initialCapital,
        positionSizePct: state.positionSizePct,
        transactionCostPct: state.transactionCostPct,
      });

      const regimePoints = detectRegimes(prices);
      const regimePeriods = computeRegimePeriods(regimePoints);
      const regimePerformance = strategyPerformanceByRegime(
        regimePoints,
        result.strategyEquity,
        result.buyHoldEquity,
        result.trades,
      );

      set({
        metrics,
        backtestResult: result,
        regimePoints,
        regimePeriods,
        regimePerformance,
        isBacktesting: false,
      });
    }, 600);
  },

  runRobustness: () => {
    const state = get();
    set({ isRobustnessTesting: true });

    setTimeout(() => {
      const configs = generateDefaultConfigs(
        state.selectedStrategy,
        state.strategyParams,
        state.startDate,
        state.endDate,
        state.transactionCostPct,
      );

      const results = runRobustnessSweep(
        PRICE_DATA[state.selectedAsset],
        state.selectedStrategy,
        configs,
        state.initialCapital,
        (start, end) => getDataInRange(state.selectedAsset, start, end),
      );

      set({ robustnessResults: results, isRobustnessTesting: false });
    }, 400);
  },

  setStressScenario: (scenario) => {
    set({ selectedStressScenario: scenario });
    get().runStressTest();
  },

  setCustomStressParams: (params) => {
    set(s => ({ customStressParams: { ...s.customStressParams, ...params } }));
    if (get().selectedStressScenario === 'CUSTOM') {
      get().runStressTest();
    }
  },

  runStressTest: () => {
    const state = get();
    set({ isStressTesting: true });

    setTimeout(() => {
      const result = runStressSimulation({
        scenarioId: state.selectedStressScenario,
        customParams: state.customStressParams,
        asset: state.selectedAsset,
        strategy: state.selectedStrategy,
        strategyParams: state.strategyParams,
        initialCapital: state.initialCapital,
        positionSizePct: state.positionSizePct,
        transactionCostPct: state.transactionCostPct,
        startDate: state.startDate,
        endDate: state.endDate,
      });

      set({ stressResult: result, isStressTesting: false });
    }, 200);
  },

  setGenomeMode: (mode) => set({ selectedGenomeMode: mode, selectedGenomeNodeId: null, selectedGenomeEdgeId: null }),
  setSelectedGenomeNodeId: (id) => set({ selectedGenomeNodeId: id, selectedGenomeEdgeId: null }),
  setSelectedGenomeEdgeId: (id) => set({ selectedGenomeEdgeId: id, selectedGenomeNodeId: null }),
  setGenomeCorrelationMode: (mode) => set({ genomeCorrelationMode: mode }),
  setGenomeCorrelationWindow: (window) => set({ genomeCorrelationWindow: window }),

  generateRiskBrief: async (options) => {
    const state = get();
    const pack = buildResearchPack({
      asset: state.selectedAsset,
      strategy: state.selectedStrategy,
      params: state.strategyParams,
      startDate: state.startDate,
      endDate: state.endDate,
      initialCapital: state.initialCapital,
      positionSizePct: state.positionSizePct,
      transactionCostPct: state.transactionCostPct,
      metrics: state.metrics,
      backtestResult: state.backtestResult,
      correlationMatrix: state.correlationMatrix,
      regimePoints: state.regimePoints,
      regimePeriods: state.regimePeriods,
      regimePerformance: state.regimePerformance,
      robustnessResults: state.robustnessResults,
      stressResult: state.stressResult,
      genomeMode: state.selectedGenomeMode,
      genomeCorrelationMode: state.genomeCorrelationMode,
      genomeCorrelationWindow: state.genomeCorrelationWindow,
    });

    if (!options?.force && state.riskBrief && state.lastBriefFingerprint === pack.provenance.fingerprint) {
      return;
    }

    set({ isGeneratingRiskBrief: true, riskBriefStatus: 'ANALYZING', riskBriefError: null, riskBriefDetails: [] });

    const res = await requestRiskCommitteeBrief(pack, options);

    set({
      riskBrief: res.brief,
      riskBriefStatus: res.status,
      riskBriefError: res.error ?? null,
      riskBriefDetails: res.details ?? [],
      lastBriefFingerprint: res.fingerprint,
      isGeneratingRiskBrief: false,
    });
  },

  clearRiskBrief: () => set({ riskBrief: null, riskBriefStatus: 'IDLE', riskBriefError: null, riskBriefDetails: [] }),
  setRiskBriefStatus: (status, error, details) => set({
    riskBriefStatus: status,
    riskBriefError: error ?? null,
    riskBriefDetails: details ?? [],
  }),

  sendAssistantMessage: async (content, options) => {
    const state = get();
    if (!content.trim()) return;

    const userMsg: AssistantMessageData = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      mode: 'GENERAL',
    };

    const updatedMessages = [...state.assistantMessages, userMsg];
    set({
      assistantMessages: updatedMessages,
      isAssistantThinking: true,
      assistantError: null,
      currentToolActivity: [],
    });

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          currentContext: {
            asset: state.selectedAsset,
            strategy: state.selectedStrategy,
            regime: state.regimePoints.length > 0 ? state.regimePoints[state.regimePoints.length - 1].regime : undefined,
            capital: state.initialCapital,
          },
          offlineDemo: options?.offlineDemo,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data: AssistantChatResponse = await response.json();

      set(s => ({
        assistantMessages: [...s.assistantMessages, data.message],
        assistantActiveMode: data.mode,
        currentToolActivity: data.message.toolActivity || [],
        assistantConfigured: data.configured,
        isAssistantThinking: false,
      }));
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to communicate with AI Assistant.';
      const fallbackMsg: AssistantMessageData = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `**BLACKBOX AI temporary issue**\n\n${errorMsg}\n\n*All deterministic BLACKBOX engines remain operational.*`,
        timestamp: new Date(),
        mode: 'GENERAL',
        error: errorMsg,
      };

      set(s => ({
        assistantMessages: [...s.assistantMessages, fallbackMsg],
        isAssistantThinking: false,
        assistantError: errorMsg,
      }));
    }
  },

  clearAssistantConversation: () => set({
    assistantMessages: [],
    isAssistantThinking: false,
    currentToolActivity: [],
    assistantError: null,
  }),

  runAutonomousInvestigation: async (query: string) => {
    const state = get();
    set({
      isResearchRunning: true,
      researchError: null,
      latestConclusion: null,
      researchRunState: {
        stage: 'PLANNING',
        currentStepIndex: 0,
        totalPlannedSteps: 0,
        hypotheses: [],
        evidenceList: [],
        evaluations: [],
      },
    });

    try {
      // 1. Try server-side endpoint first (/api/ai/research)
      let serverRes: any = null;
      try {
        const response = await fetch('/api/ai/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            asset: state.selectedAsset,
            strategy: state.selectedStrategy,
            startDate: state.startDate,
            endDate: state.endDate,
          }),
        });
        if (response.ok) {
          serverRes = await response.json();
        }
      } catch {}

      if (serverRes && serverRes.success && serverRes.conclusion) {
        set({
          isResearchRunning: false,
          researchRunState: serverRes.state,
          latestConclusion: serverRes.conclusion,
        });

        if (serverRes.trailEntry) {
          get().addResearchEntry(serverRes.trailEntry);
        }
        return;
      }

      // 2. Direct fallback runner with real-time UI state transitions
      const result = await runAutonomousResearch(query, {
        asset: state.selectedAsset,
        strategy: state.selectedStrategy,
        startDate: state.startDate,
        endDate: state.endDate,
        onProgress: (progressState) => {
          set({ researchRunState: { ...progressState } });
        },
      });

      set({
        isResearchRunning: false,
        researchRunState: result.state,
        latestConclusion: result.conclusion,
      });

      get().addResearchEntry(result.trailEntry);
    } catch (err: any) {
      set({
        isResearchRunning: false,
        researchError: err.message || 'Autonomous research investigation failed.',
      });
    }
  },

  resetAutonomousResearch: () => set({
    isResearchRunning: false,
    researchRunState: null,
    latestConclusion: null,
    researchError: null,
  }),

  initCorrelations: () => {
    const matrix = computeCorrelationMatrix(PRICE_DATA);
    set({ correlationMatrix: matrix });
  },

  addResearchEntry: (entry) => {
    const newEntry: ResearchEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    set(s => ({ researchTrail: [newEntry, ...s.researchTrail] }));
  },

  removeResearchEntry: (id) => {
    set(s => ({ researchTrail: s.researchTrail.filter(e => e.id !== id) }));
  },

  saveInsight: (insight) => {
    const state = get();
    const newNote: SavedResearchNote = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      insight,
      asset: state.selectedAsset,
      strategy: state.selectedStrategy,
    };
    set(s => ({ savedNotes: [newNote, ...s.savedNotes] }));
  },

  removeSavedNote: (id) => {
    set(s => ({ savedNotes: s.savedNotes.filter(n => n.id !== id) }));
  },

  resetDemoState: () => {
    globalResearchCaseStore.clear();
    set({
      selectedAsset: 'BTC',
      selectedStrategy: 'EMA_TREND',
      strategyParams: DEFAULT_PARAMS['EMA_TREND'],
      initialCapital: 100000,
      positionSizePct: 0.95,
      transactionCostPct: 0.001,
      startDate: '2020-01-01',
      endDate: '2023-12-31',
      activeSection: 'observatory',
      isResearchRunning: false,
      researchRunState: null,
      latestConclusion: null,
      researchError: null,
      metrics: null,
      backtestResult: null,
      regimePoints: [],
      regimePeriods: [],
      regimePerformance: [],
      isBacktesting: false,
      robustnessResults: [],
      isRobustnessTesting: false,
      selectedStressScenario: 'COVID_2020',
      customStressParams: DEFAULT_CUSTOM_SHOCK,
      stressResult: null,
      isStressTesting: false,
      selectedGenomeMode: 'MARKET',
      selectedGenomeNodeId: null,
      selectedGenomeEdgeId: null,
      genomeCorrelationMode: 'STATIC',
      genomeCorrelationWindow: 60,
      riskBrief: null,
      riskBriefStatus: 'IDLE',
      riskBriefError: null,
      riskBriefDetails: [],
      lastBriefFingerprint: null,
      isGeneratingRiskBrief: false,
      assistantMessages: [],
      isAssistantThinking: false,
      assistantActiveMode: 'GENERAL',
      currentToolActivity: [],
      assistantError: null,
      researchTrail: [],
      savedNotes: [],
    });
    get().initCorrelations();
  },
}));
