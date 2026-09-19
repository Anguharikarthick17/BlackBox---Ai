import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  GitBranch,
  FlaskConical,
  Activity,
  Globe,
  BookOpen,
  Sliders,
  ShieldAlert,
  Network,
  ShieldCheck,
  Sparkles,
  Compass,
  PieChart,
  ScrollText,
  Eye,
  Command,
  ChevronRight,
  Box,
  RotateCcw,
} from 'lucide-react';
import { MarketContext } from '../components/workspace/MarketContext';
import { QuantAnalysis } from '../components/workspace/QuantAnalysis';
import { CorrelationView } from '../components/workspace/CorrelationView';
import { StrategyLab } from '../components/workspace/StrategyLab';
import { RobustnessLab } from '../components/workspace/RobustnessLab';
import { MarketRegimes } from '../components/workspace/MarketRegimes';
import { StressLab } from '../components/workspace/StressLab';
import { StrategyGenome } from '../components/workspace/StrategyGenome';
import { RiskCommittee } from '../components/workspace/RiskCommittee';
import { ResearchTrail } from '../components/workspace/ResearchTrail';
import { BlackboxAssistant } from '../components/workspace/BlackboxAssistant';
import { ResearchAgent } from '../components/workspace/ResearchAgent';
import { PortfolioCockpit } from '../components/workspace/portfolio/PortfolioCockpit';
import { ResearchWorkspace } from '../components/workspace/research/ResearchWorkspace';
import { ResearchObservatory } from '../components/workspace/research/observatory';
import { AssetUniverse } from '../components/three/AssetUniverse';
import { useResearchStore } from '../store/researchStore';
import { PRICE_DATA, ASSET_COLORS, Asset } from '../core/data';
import { computeMetrics } from '../core/metrics';
import { BxLogo, BxDataBadge, BxStatus } from '../components/bx';

export const NAV_ITEMS = [
  { id: 'observatory', label: 'Observatory', icon: Eye, group: 'research' },
  { id: 'research-agent', label: 'Quant Agent', icon: Compass, group: 'research' },
  { id: 'research', label: 'Research Notebook', icon: ScrollText, group: 'research' },
  { id: 'trail', label: 'Ghost Mode', icon: BookOpen, group: 'research' },
  { id: 'market', label: 'Market Context', icon: Globe, group: 'markets' },
  { id: 'analysis', label: 'Quant Analysis', icon: BarChart3, group: 'markets' },
  { id: 'correlation', label: 'Correlation', icon: GitBranch, group: 'markets' },
  { id: 'regimes', label: 'Regimes', icon: Activity, group: 'markets' },
  { id: 'strategy', label: 'Strategy Lab', icon: FlaskConical, group: 'strategies' },
  { id: 'robustness', label: 'Robustness', icon: Sliders, group: 'strategies' },
  { id: 'genome', label: 'Strategy Genome', icon: Network, group: 'strategies' },
  { id: 'portfolio', label: 'Portfolio Lab', icon: PieChart, group: 'portfolio' },
  { id: 'stress', label: 'Stress Lab', icon: ShieldAlert, group: 'risk' },
  { id: 'committee', label: 'Risk Committee', icon: ShieldCheck, group: 'risk' },
  { id: 'assistant', label: 'Blackbox AI', icon: Sparkles, group: 'intelligence' },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]['id'];

interface NavGroupDef {
  id: string;
  label: string;
  subItemIds: NavId[];
}

const NAV_GROUPS: NavGroupDef[] = [
  { id: 'research', label: 'RESEARCH', subItemIds: ['observatory', 'research-agent', 'research', 'trail'] },
  { id: 'markets', label: 'MARKETS', subItemIds: ['market', 'analysis', 'correlation', 'regimes'] },
  { id: 'strategies', label: 'STRATEGIES', subItemIds: ['strategy', 'robustness', 'genome'] },
  { id: 'portfolio', label: 'PORTFOLIO', subItemIds: ['portfolio'] },
  { id: 'risk', label: 'RISK', subItemIds: ['stress', 'committee'] },
  { id: 'intelligence', label: 'INTELLIGENCE', subItemIds: ['assistant'] },
];

interface WorkspaceProps {
  initialSection?: string;
  onBack: () => void;
}

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

function SectionContent({ section }: { section: NavId }) {
  switch (section) {
    case 'observatory':
      return <ResearchObservatory />;
    case 'assistant':
      return <BlackboxAssistant />;
    case 'research-agent':
      return <ResearchAgent />;
    case 'research':
      return <ResearchWorkspace />;
    case 'portfolio':
      return <PortfolioCockpit />;
    case 'market':
      return <MarketContext />;
    case 'analysis':
      return <QuantAnalysis />;
    case 'correlation':
      return <CorrelationView />;
    case 'strategy':
      return <StrategyLab />;
    case 'robustness':
      return <RobustnessLab />;
    case 'regimes':
      return <MarketRegimes />;
    case 'stress':
      return <StressLab />;
    case 'genome':
      return <StrategyGenome />;
    case 'committee':
      return <RiskCommittee />;
    case 'trail':
      return <ResearchTrail />;
    default:
      return <ResearchObservatory />;
  }
}

export function Workspace({ initialSection = 'observatory', onBack }: WorkspaceProps) {
  const {
    activeSection,
    setActiveSection,
    selectedAsset,
    setAsset,
    correlationMatrix,
    initCorrelations,
    resetDemoState,
  } = useResearchStore();

  const [show3dWidget, setShow3dWidget] = useState(false);

  // Determine current active group
  const currentGroupId = useMemo(() => {
    const item = NAV_ITEMS.find((n) => n.id === activeSection);
    return item ? item.group : 'research';
  }, [activeSection]);

  const currentGroup = useMemo(() => {
    return NAV_GROUPS.find((g) => g.id === currentGroupId) || NAV_GROUPS[0];
  }, [currentGroupId]);

  const currentSubItems = useMemo(() => {
    return NAV_ITEMS.filter((n) => n.group === currentGroup.id);
  }, [currentGroup]);

  useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
    initCorrelations();

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveSection('assistant');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute volatilities for 3D universe
  const volatilities = {
    GOLD: Math.min(1, computeMetrics(PRICE_DATA.GOLD).volatility / 60),
    BTC: Math.min(1, computeMetrics(PRICE_DATA.BTC).volatility / 60),
    NVDA: Math.min(1, computeMetrics(PRICE_DATA.NVDA).volatility / 60),
  };

  const correlations3D = correlationMatrix
    ? {
        GOLD_BTC: correlationMatrix.GOLD.BTC,
        GOLD_NVDA: correlationMatrix.GOLD.NVDA,
        BTC_NVDA: correlationMatrix.BTC.NVDA,
      }
    : undefined;

  return (
    <div className="min-h-screen bg-ivory flex flex-col selection:bg-accent/15 selection:text-accent">
      {/* Tier 1 Primary Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-xs">
        <div className="page-container h-14 flex items-center justify-between gap-4">
          {/* Brand Logo & Back link */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-2 group cursor-pointer"
              title="Return to Platform Overview"
            >
              <BxLogo size="sm" />
            </button>

            <div className="hidden sm:block w-px h-5 bg-border" />

            <button
              onClick={onBack}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-graphite-400 hover:text-accent transition-colors"
            >
              <ArrowLeft size={12} />
              <span>OVERVIEW</span>
            </button>
          </div>

          {/* Grouped Primary Nav (6 Categories) */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            {NAV_GROUPS.map((group) => {
              const isActiveGroup = group.id === currentGroupId;
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    // Switch to first item in that group
                    const firstItem = group.subItemIds[0];
                    setActiveSection(firstItem);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-display uppercase tracking-wider font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActiveGroup
                      ? 'bg-graphite text-white shadow-xs'
                      : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
                  }`}
                >
                  {group.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Controls: Asset Switcher, Command, Data Badge */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Asset Selector */}
            <div className="hidden md:flex items-center bg-ivory-200 p-0.5 rounded border border-border">
              {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((a) => {
                const isSelected = selectedAsset === a;
                return (
                  <button
                    key={a}
                    onClick={() => setAsset(a)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                      isSelected
                        ? 'bg-white text-graphite shadow-xs font-semibold'
                        : 'text-graphite-400 hover:text-graphite'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ASSET_COLORS[a] }}
                    />
                    <span>{a === 'GOLD' ? 'XAU' : a}</span>
                  </button>
                );
              })}
            </div>

            {/* 3D toggle */}
            <button
              onClick={() => setShow3dWidget(!show3dWidget)}
              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                show3dWidget
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'bg-white border-border text-graphite-400 hover:text-graphite'
              }`}
              title="Toggle 3D Core View"
            >
              <Box size={14} />
            </button>

            {/* ⌘K AI Trigger */}
            <button
              onClick={() => setActiveSection('assistant')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border border-border bg-white text-graphite-500 hover:border-accent hover:text-accent transition-colors"
              title="Open BLACKBOX AI (⌘K)"
            >
              <Sparkles size={11} className="text-accent" />
              <span>AI</span>
              <kbd className="px-1 py-0.2 bg-ivory-200 rounded text-[9px] text-graphite-400">⌘K</kbd>
            </button>

            {/* Judge Demo Reset Button */}
            <button
              onClick={() => {
                if (window.confirm('Reset BLACKBOX X workspace to clean canonical demo state?')) {
                  resetDemoState();
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider rounded border border-border bg-white text-graphite-600 hover:border-accent hover:text-accent hover:bg-accent/5 transition-colors cursor-pointer"
              title="Reset workspace to clean canonical demo state"
            >
              <RotateCcw size={11} className="text-graphite-400 group-hover:text-accent" />
              <span className="hidden sm:inline">RESET DEMO</span>
            </button>

            {/* Deterministic Data Badge */}
            <BxDataBadge compact className="hidden xl:inline-flex" />
          </div>
        </div>

        {/* Tier 2 Contextual Submenu Bar */}
        <div className="bg-ivory-100/90 border-t border-border/80 h-10 flex items-center justify-between">
          <div className="page-container h-full flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono tracking-widest uppercase text-accent font-bold mr-2 hidden sm:inline">
                {currentGroup.label} /
              </span>

              {currentSubItems.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveSection(id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-white text-graphite font-semibold shadow-xs border border-border'
                        : 'text-graphite-400 hover:text-graphite hover:bg-white/60'
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-accent' : 'text-graphite-400'} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-graphite-400">
              <span>RUNTIME:</span>
              <span className="text-emerald-700 font-semibold">DETERMINISTIC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 pt-24 pb-12">
        <div className="page-container">
          {/* Optional 3D Knowledge Core Collapsible Panel */}
          <AnimatePresence>
            {show3dWidget && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-white border border-border rounded-lg p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bx-eyebrow text-accent">3D VISUALIZATION</span>
                      <span className="text-xs font-display font-bold uppercase text-graphite">
                        Interactive Asset Universe
                      </span>
                    </div>
                    <button
                      onClick={() => setShow3dWidget(false)}
                      className="text-xs text-graphite-400 hover:text-graphite"
                    >
                      Close ✕
                    </button>
                  </div>
                  <div className="h-64 rounded bg-ivory-100 overflow-hidden border border-border">
                    <AssetUniverse
                      correlations={correlations3D}
                      volatilities={volatilities}
                      selectedAsset={selectedAsset}
                      onAssetClick={setAsset}
                      compact
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Section Content */}
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} {...PAGE_TRANSITION}>
              <SectionContent section={activeSection as NavId} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
