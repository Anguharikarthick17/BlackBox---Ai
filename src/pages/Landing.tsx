import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  Lock,
  GitBranch,
  Search,
  Sliders,
  ChevronRight,
  Activity,
  CheckCircle2,
  Database,
  Compass,
  Menu,
  X,
} from 'lucide-react';
import { BlackboxCore3D } from '../components/three/BlackboxCore3D';
import { MarketUniverse3D } from '../components/three/MarketUniverse3D';
import { StressSpatialScene } from '../components/three/StressSpatialScene';
import { BxLogo } from '../components/bx/BxLogo';
import { BxDataBadge } from '../components/bx/BxDataBadge';
import { StressScenarioId } from '../core/stressTesting';
import { PRICE_DATA, Asset } from '../core/data';
import { computeMetrics } from '../core/metrics';
import { useResearchStore } from '../store/researchStore';
import { LiveDemoModal } from '../components/demo/LiveDemoModal';

interface LandingProps {
  onEnterWorkspace: (section?: string) => void;
}

const RESEARCH_STAGES = [
  { num: '01', id: 'question', title: 'QUESTION', desc: 'Formulate falsifiable empirical hypothesis without bias' },
  { num: '02', id: 'hypothesis', title: 'HYPOTHESIS', desc: 'Deterministic parameter bounding across macro regimes' },
  { num: '03', id: 'experiment', title: 'EXPERIMENT', desc: 'Execution across 4 algorithmic engines with real friction' },
  { num: '04', id: 'evidence', title: 'EVIDENCE', desc: 'Immutable record generation with SHA-256 fingerprint' },
  { num: '05', id: 'challenge', title: 'CHALLENGE', desc: 'Counter-factual verification and adversarial stress' },
  { num: '06', id: 'conclusion', title: 'CONCLUSION', desc: 'Formal confidence rating bound to grounded data' },
  { num: '07', id: 'replay', title: 'REPLAY', desc: 'Bit-level deterministic re-execution & audit trail' },
];

export function Landing({ onEnterWorkspace }: LandingProps) {
  const [activeStage, setActiveStage] = useState('evidence');
  const [selectedStressScenario, setSelectedStressScenario] = useState<StressScenarioId>('GFC_2008');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Real engine metrics
  const btcMetrics = computeMetrics(PRICE_DATA.BTC);
  const goldMetrics = computeMetrics(PRICE_DATA.GOLD);
  const nvdaMetrics = computeMetrics(PRICE_DATA.NVDA);

  return (
    <div className="min-h-screen bg-cream text-graphite selection:bg-crimson/20 selection:text-crimson font-sans overflow-x-hidden">
      {/* Precision Institutional Global Header (Predictable 76px height, 3 Explicit Regions) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-b border-border h-[76px]">
        <div className="page-container h-full flex items-center justify-between gap-4">
          {/* REGION 1: HEADER BRAND */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="cursor-pointer flex items-center"
            >
              <BxLogo size="md" showSubtitle />
            </button>
            <div className="hidden 2xl:flex items-center gap-3 pl-5 border-l border-border h-8 text-[11px] font-mono text-taupe tracking-wider">
              <span className="text-graphite font-bold uppercase">INSTITUTIONAL RESEARCH</span>
              <span>•</span>
              <span>DETERMINISTIC SIMULATION</span>
            </div>
          </div>

          {/* REGION 2: HEADER NAVIGATION */}
          <div className="hidden md:flex items-center gap-5 lg:gap-7 xl:gap-8 text-xs font-mono uppercase tracking-widest text-taupe font-medium whitespace-nowrap">
            <a href="#section-core" className="hover:text-crimson transition-colors">3D Core</a>
            <a href="#section-pipeline" className="hover:text-crimson transition-colors">Pipeline</a>
            <a href="#section-universe" className="hover:text-crimson transition-colors">Universe</a>
            <a href="#section-stress" className="hover:text-crimson transition-colors">Stress</a>
            <a href="#section-monte-carlo" className="hover:text-crimson transition-colors">Monte Carlo</a>
          </div>

          {/* REGION 3: HEADER ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            <BxDataBadge variant="simulated" className="hidden sm:inline-flex" />
            <button
              onClick={() => setIsDemoOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-crimson/60 bg-crimson/5 text-crimson hover:bg-crimson hover:text-cream text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-xs cursor-pointer"
            >
              <Sparkles size={13} />
              <span>TRY DEMO →</span>
            </button>
            <button
              onClick={() => onEnterWorkspace('observatory')}
              className="btn-crimson text-xs !px-5 !py-2.5 shadow-md group whitespace-nowrap hidden sm:inline-flex"
            >
              <span>ENTER RESEARCH</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded border border-border bg-white text-graphite hover:border-graphite cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-cream border-b border-border px-6 py-4 space-y-3 font-mono text-xs uppercase tracking-wider text-graphite shadow-elevated">
            <a
              href="#section-core"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-border/50 hover:text-crimson"
            >
              3D Core
            </a>
            <a
              href="#section-pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-border/50 hover:text-crimson"
            >
              Pipeline
            </a>
            <a
              href="#section-universe"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-border/50 hover:text-crimson"
            >
              Universe
            </a>
            <a
              href="#section-stress"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-border/50 hover:text-crimson"
            >
              Stress
            </a>
            <a
              href="#section-monte-carlo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-border/50 hover:text-crimson"
            >
              Monte Carlo
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsDemoOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-crimson text-cream font-mono text-xs uppercase font-bold cursor-pointer shadow-sm"
            >
              <Sparkles size={13} />
              <span>TRY DEMO →</span>
            </button>
            <div className="pt-2 flex items-center justify-between">
              <BxDataBadge variant="simulated" />
            </div>
          </div>
        )}
      </nav>

      {/* =========================================================================
          SECTION 01: THE BLACKBOX CORE (Unified Centered Editorial Hero)
          ========================================================================= */}
      <section id="section-core" className="relative min-h-[calc(100vh-76px)] flex items-center pt-28 pb-14 bg-cream bg-technical-grid border-b border-border overflow-hidden">
        <div className="hero-inner w-full grid grid-cols-1 lg:grid-cols-[minmax(0,470px)_minmax(0,530px)] gap-6 lg:gap-8 justify-center items-center">
          {/* Left: Hero Copy Column */}
          <div className="hero-copy z-10 flex flex-col items-start text-left w-full max-w-[470px]">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-border rounded-full mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-[0.24em] font-bold text-graphite">
                QUANTITATIVE RESEARCH INSTRUMENT
              </span>
            </div>

            <h1 className="display-xl text-graphite mb-6">
              ASK THE<br />
              MARKET<br />
              <span className="text-crimson">A QUESTION.</span>
            </h1>

            <p className="text-base text-taupe font-normal leading-relaxed max-w-lg mb-8">
              BLACKBOX X turns quantitative questions into empirical experiments, cryptographic evidence, adversarial challenges, and reproducible research cases.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-8">
              <button
                onClick={() => setIsDemoOpen(true)}
                className="btn-crimson text-xs sm:text-sm !px-7 !py-3.5 shadow-md group whitespace-nowrap flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>TRY DEMO →</span>
              </button>

              <button
                onClick={() => onEnterWorkspace('observatory')}
                className="btn-graphite text-xs sm:text-sm !px-6 !py-3.5 shadow-xs group whitespace-nowrap cursor-pointer"
              >
                <span>ENTER RESEARCH →</span>
              </button>

              <button
                onClick={() => {
                  document.getElementById('section-pipeline')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-cream text-xs !px-6 !py-3.5 whitespace-nowrap cursor-pointer"
              >
                EXPLORE THE SYSTEM →
              </button>
            </div>

            <div className="w-full pt-6 border-t border-border grid grid-cols-3 gap-4 text-xs font-mono text-taupe">
              <div>
                <span className="font-bold text-graphite uppercase block text-[10px] tracking-wider mb-0.5">COVERAGE</span>
                <span className="text-graphite font-medium">Gold · BTC · NVDA</span>
              </div>
              <div>
                <span className="font-bold text-graphite uppercase block text-[10px] tracking-wider mb-0.5">LOGIC</span>
                <span className="text-graphite font-medium">4 Native Engines</span>
              </div>
              <div>
                <span className="font-bold text-emerald-800 uppercase block text-[10px] tracking-wider mb-0.5">REPLAY</span>
                <span className="text-emerald-800 font-semibold">100% Deterministic</span>
              </div>
            </div>
          </div>

          {/* Right: Spatial 3D Quantitative Universe (Tightly Centered) */}
          <div className="hero-universe w-full flex items-center justify-center z-[2] max-w-[530px]">
            <div className="relative w-full h-[460px] sm:h-[500px] lg:h-[560px] xl:h-[600px] flex items-center justify-center select-none">
              <BlackboxCore3D
                height="100%"
                onSelectNode={(id) => {
                  if (id === 'GOLD' || id === 'BTC' || id === 'NVDA') {
                    useResearchStore.getState().setAsset(id as Asset);
                    // Safe asynchronous navigation allows R3F pointer events to finish cleanly
                    setTimeout(() => {
                      if (window.location.hash) {
                        try {
                          window.history.replaceState(null, '', window.location.pathname + window.location.search);
                        } catch (_) {}
                      }
                      window.scrollTo({ top: 0, behavior: 'instant' });
                      onEnterWorkspace('market');
                    }, 60);
                  } else if (id === 'STRATEGY') {
                    setTimeout(() => onEnterWorkspace('strategy'), 60);
                  } else if (id === 'RISK') {
                    setTimeout(() => onEnterWorkspace('stress'), 60);
                  } else if (id === 'REGIME') {
                    setTimeout(() => onEnterWorkspace('regimes'), 60);
                  } else if (id === 'EVIDENCE') {
                    setTimeout(() => onEnterWorkspace('observatory'), 60);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 02: FROM QUESTION TO EVIDENCE (Full-Width Burgundy Pipeline)
          ========================================================================= */}
      <section id="section-pipeline" className="py-24 bg-burgundy text-cream border-b border-crimson/40">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-6 border-b border-crimson/30 gap-6">
            <div>
              <div className="text-[11px] font-mono tracking-[0.3em] uppercase text-crimson-300 font-bold mb-2">
                EMPIRICAL DISCOVERY CYCLE
              </div>
              <h2 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight text-cream">
                FROM QUESTION TO EVIDENCE
              </h2>
            </div>
            <p className="text-sm text-crimson-100 max-w-md font-sans leading-relaxed">
              Every quantitative inquiry advances through seven immutable verification gates before sealing into an archival research case.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {RESEARCH_STAGES.map((s) => {
              const isActive = s.id === activeStage;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStage(s.id)}
                  className={`p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative ${
                    isActive
                      ? 'bg-crimson border-crimson-300 shadow-crimson-glow text-white'
                      : 'bg-graphite/40 border-crimson/30 hover:border-crimson-400 text-cream/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs font-bold mb-3">
                    <span className={isActive ? 'text-cream' : 'text-crimson-300'}>{s.num}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-cream animate-pulse" />}
                  </div>
                  <h4 className="font-display text-lg font-bold uppercase tracking-tight mb-2">
                    {s.title}
                  </h4>
                  <p className="text-xs font-sans leading-relaxed opacity-85">
                    {s.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 03: THE MARKET UNIVERSE (3D Spatial Asset Dynamics)
          ========================================================================= */}
      <section id="section-universe" className="py-24 bg-cream border-b border-border bg-technical-dots">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-border gap-4">
            <div>
              <div className="bx-eyebrow mb-2">SYSTEMIC MULTI-ASSET DYNAMICS</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-graphite">
                THE MARKET UNIVERSE
              </h2>
            </div>
            <p className="text-sm text-taupe max-w-md font-sans">
              Five years of synchronized market geometry across Gold, Bitcoin, and NVIDIA. Volatility scales orbital distance and spatial sphere radii.
            </p>
          </div>

          <div className="bg-ivory-100 border border-border rounded-2xl p-2 shadow-card overflow-hidden">
            <MarketUniverse3D />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 04: STRATEGY GENOME (Algorithmic Relationship Topology)
          ========================================================================= */}
      <section className="py-24 bg-ivory-200 border-b border-border">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-border gap-4">
            <div>
              <div className="bx-eyebrow mb-2">QUANTITATIVE DNA</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-graphite">
                STRATEGY GENOME TOPOLOGY
              </h2>
            </div>
            <button
              onClick={() => onEnterWorkspace('genome')}
              className="btn-cream text-xs !px-5 !py-2.5"
            >
              LAUNCH FULL GENOME LAB →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'SMA', title: 'SMA CROSSOVER', asset: 'BTC / GOLD', type: 'Trend Following', ret: '+312.4%', sharpe: '1.28' },
              { id: 'EMA', title: 'EMA TREND', asset: 'NVDA / BTC', type: 'Momentum Filter', ret: '+480.1%', sharpe: '1.45' },
              { id: 'MOM', title: 'MOMENTUM', asset: 'NVDA', type: 'Cross-Sectional', ret: '+620.8%', sharpe: '1.62' },
              { id: 'REV', title: 'MEAN REVERSION', asset: 'GOLD', type: 'Z-Score Oscillator', ret: '+94.2%', sharpe: '0.98' },
            ].map((st) => (
              <div
                key={st.id}
                onClick={() => onEnterWorkspace('strategy')}
                className="p-6 bg-white border border-border rounded-xl shadow-xs hover:border-crimson hover:shadow-elevated transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-crimson font-bold">
                    {st.type}
                  </span>
                  <span className="text-xs font-mono font-bold text-graphite group-hover:text-crimson">
                    {st.asset}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold uppercase text-graphite mb-4">
                  {st.title}
                </h3>
                <div className="pt-4 border-t border-border/80 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[9px] uppercase text-taupe block">RETURN</span>
                    <span className="text-sm font-bold text-emerald-800">{st.ret}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase text-taupe block">SHARPE</span>
                    <span className="text-sm font-bold text-graphite">{st.sharpe}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 05: RISK UNDER PRESSURE (Spatial Stress Simulation Experience)
          ========================================================================= */}
      <section id="section-stress" className="py-24 bg-cream border-b border-border bg-technical-grid">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-border gap-4">
            <div>
              <div className="bx-eyebrow mb-2">SPATIAL RISK LAB</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-graphite">
                RISK UNDER PRESSURE
              </h2>
            </div>
            <p className="text-sm text-taupe max-w-md font-sans">
              Dynamic spatial deformation. Selecting macro scenarios physically tightens correlation tension and expands volatility shock shells.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Scenario Switchers */}
            <div className="lg:col-span-4 space-y-2.5">
              {[
                { id: 'GFC_2008', title: '2008 Systemic Deleveraging', desc: 'Liquidity freeze & persistent multiple unwind' },
                { id: 'COVID_2020', title: '2020 Flash Liquidity Crash', desc: 'Violent compression with extreme volatility' },
                { id: 'RATE_SHOCK_2022', title: '2022 Duration Compression', desc: 'Sustained discount rate repricing' },
                { id: 'CRYPTO_CRASH', title: 'Crypto Contagion Shock', desc: 'Idiosyncratic sector liquidation' },
              ].map((sc) => {
                const isSelected = selectedStressScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSelectedStressScenario(sc.id as StressScenarioId)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-crimson text-white border-crimson shadow-md'
                        : 'bg-white text-graphite border-border hover:border-graphite'
                    }`}
                  >
                    <div className="font-display font-bold uppercase text-base tracking-tight mb-1">
                      {sc.title}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-cream/90' : 'text-taupe'}`}>
                      {sc.desc}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => onEnterWorkspace('stress')}
                className="w-full btn-cream text-xs !py-3 mt-4 text-center justify-center"
              >
                OPEN DEEP STRESS LAB →
              </button>
            </div>

            {/* 3D Stress Spatial Viewer */}
            <div className="lg:col-span-8 bg-ivory-100 border border-border rounded-2xl overflow-hidden shadow-card">
              <StressSpatialScene scenario={selectedStressScenario} height={420} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 06: PROBABILITY, NOT PREDICTION (Monte Carlo Probability Field)
          ========================================================================= */}
      <section id="section-monte-carlo" className="py-24 bg-ivory-100 border-b border-border">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-border gap-4">
            <div>
              <div className="bx-eyebrow mb-2">10,000 PATH SIMULATION</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-graphite">
                PROBABILITY, NOT PREDICTION
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded text-xs font-mono text-amber-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>SIMULATION · NOT A FORECAST</span>
            </div>
          </div>

          <div className="bg-white border border-border rounded-2xl p-8 shadow-card">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
              <div className="font-mono text-xs text-taupe">
                WEALTH DISPERSION ENVELOPE · <span className="text-graphite font-bold">$100,000 INITIAL CAPITAL</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-burgundy/40 inline-block" /> P05-P95 Fan</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-crimson inline-block" /> P50 Median</span>
              </div>
            </div>

            {/* Graphic SVG Probability Field */}
            <div className="w-full h-64 bg-cream/30 rounded-xl border border-border/70 p-4 relative flex items-center justify-center">
              <svg viewBox="0 0 800 200" className="w-full h-full font-mono text-[9px]">
                <line x1="40" y1="180" x2="780" y2="180" stroke="#E5DDCB" strokeWidth="1" />
                <line x1="40" y1="100" x2="780" y2="100" stroke="#E5DDCB" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="40" y1="30" x2="780" y2="30" stroke="#E5DDCB" strokeWidth="1" />

                {/* Outer Fan Area */}
                <polygon points="40,100 200,80 400,50 600,30 780,20 780,175 600,165 400,150 200,120" fill="#5C0012" fillOpacity="0.1" />
                {/* Interquartile Area */}
                <polygon points="40,100 200,90 400,75 600,60 780,55 780,140 600,130 400,120 200,110" fill="#B40023" fillOpacity="0.18" />
                {/* P50 Median Line */}
                <path d="M40,100 Q200,92 400,82 T780,72" fill="none" stroke="#B40023" strokeWidth="2.5" />

                <text x="50" y="105" fill="#746E67">$100k Base</text>
                <text x="730" y="30" fill="#059669" fontWeight="bold">P95: +84%</text>
                <text x="730" y="70" fill="#B40023" fontWeight="bold">P50: +28%</text>
                <text x="730" y="170" fill="#E11D48" fontWeight="bold">P05: -34%</text>
              </svg>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border font-mono text-xs">
              <div>
                <span className="text-taupe block text-[10px]">P05 DOWNSIDE</span>
                <span className="text-crimson font-bold">$66,240 (-33.8%)</span>
              </div>
              <div>
                <span className="text-taupe block text-[10px]">P50 EXPECTED MEDIAN</span>
                <span className="text-graphite font-bold">$128,450 (+28.4%)</span>
              </div>
              <div>
                <span className="text-taupe block text-[10px]">P95 TAIL EXPANSION</span>
                <span className="text-emerald-800 font-bold">$184,300 (+84.3%)</span>
              </div>
              <div>
                <span className="text-taupe block text-[10px]">LOSS FREQUENCY</span>
                <span className="text-graphite font-bold">14.8% of paths</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 07: AUTONOMOUS RESEARCH (Quant Agent Workflow)
          ========================================================================= */}
      <section className="py-24 bg-cream border-b border-border bg-technical-grid">
        <div className="page-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 pb-6 border-b border-border gap-4">
            <div>
              <div className="bx-eyebrow mb-2">AUTONOMOUS QUANT RESEARCH AGENT</div>
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-graphite">
                SYSTEMATIC INQUIRY ENGINE
              </h2>
            </div>
            <button
              onClick={() => onEnterWorkspace('research-agent')}
              className="btn-crimson text-xs !px-5 !py-2.5"
            >
              LAUNCH QUANT AGENT →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'HYPOTHESIS FORMULATION', desc: 'Translates natural language quantitative questions into strictly testable assertions.' },
              { step: '02', title: 'BOUNDED EXECUTION', desc: 'Orchestrates 4 deterministic engines with hard safety limits (max 8 tools).' },
              { step: '03', title: 'CONTRADICTION CHECK', desc: 'Actively searches for falsifying evidence, drawdown clusters, and regime shifts.' },
              { step: '04', title: 'FORMAL SYNTHESIS', desc: 'Binds claims directly to verified data windows with SHA-256 output hashes.' },
            ].map((s) => (
              <div key={s.step} className="p-6 bg-white border border-border rounded-xl shadow-xs">
                <span className="font-mono text-xs font-bold text-crimson block mb-2">{s.step}</span>
                <h4 className="font-display text-lg font-bold uppercase text-graphite mb-2">{s.title}</h4>
                <p className="text-xs text-taupe leading-relaxed font-sans">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 08 & 09: EVIDENCE GRAPH & REPRODUCIBILITY BY DESIGN
          ========================================================================= */}
      <section className="py-24 bg-graphite text-cream border-b border-graphite-700">
        <div className="page-container">
          <div className="max-w-3xl mb-16">
            <div className="text-[11px] font-mono tracking-[0.3em] uppercase text-crimson font-bold mb-2">
              AUDITABILITY & LINEAGE
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight text-cream mb-4">
              REPRODUCIBLE BY DESIGN
            </h2>
            <p className="text-base text-taupe leading-relaxed font-sans">
              Zero evaluative ranking hallucinations. Every research case is sealed with an immutable cryptographic manifest and validated via bit-level replay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-graphite-800 border border-graphite-600">
              <Database className="w-6 h-6 text-crimson mb-4" />
              <h4 className="font-display text-xl font-bold uppercase text-cream mb-2">Evidence Graph</h4>
              <p className="text-xs text-taupe font-sans leading-relaxed">
                Separates direct empirical measurement from analytical interpretation with strict causal lineage.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-graphite-800 border border-graphite-600">
              <Lock className="w-6 h-6 text-crimson mb-4" />
              <h4 className="font-display text-xl font-bold uppercase text-cream mb-2">Sealed Research Cases</h4>
              <p className="text-xs text-taupe font-sans leading-relaxed">
                Permanent canonical identifiers (BBX-CASE-YYYY-XXXX) signed with complete parameter manifests.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-graphite-800 border border-graphite-600">
              <Activity className="w-6 h-6 text-crimson mb-4" />
              <h4 className="font-display text-xl font-bold uppercase text-cream mb-2">Deterministic Replay</h4>
              <p className="text-xs text-taupe font-sans leading-relaxed">
                Bit-level re-execution verifies that replayed fingerprints identically match canonical sealed cases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: ENTER BLACKBOX X (Strong Final CTA)
          ========================================================================= */}
      <section className="py-28 bg-cream relative">
        <div className="page-container max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border rounded-full mb-6 text-xs font-mono text-graphite">
            <span className="w-2 h-2 rounded-full bg-crimson" />
            <span>INSTITUTIONAL QUANTITATIVE ENVIRONMENT READY</span>
          </div>

          <h2 className="display-lg text-graphite mb-6">
            ENTER BLACKBOX X
          </h2>

          <p className="text-base text-taupe max-w-xl mx-auto mb-10 font-sans leading-relaxed">
            Begin your quantitative research with multi-asset backtests, spatial stress simulations, and reproducible evidence graphs.
          </p>

          <button
            onClick={() => onEnterWorkspace('observatory')}
            className="btn-crimson text-sm !px-10 !py-4 shadow-elevated group inline-flex items-center gap-3"
          >
            <span className="font-bold tracking-wider">OPEN RESEARCH OBSERVATORY</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-cream">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-taupe">
          <div className="flex items-center gap-3">
            <BxLogo size="sm" />
            <span>Deterministic Research Platform</span>
          </div>
          <div>
            FOR RESEARCH PURPOSES ONLY · NOT FINANCIAL ADVICE
          </div>
        </div>
      </footer>

      {/* Live Demonstration Modal */}
      <LiveDemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
        onEnterResearch={() => onEnterWorkspace('observatory')}
      />
    </div>
  );
}
