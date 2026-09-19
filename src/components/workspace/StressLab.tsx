import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle, ShieldAlert, Activity, RefreshCw, Zap,
  TrendingDown, TrendingUp, Clock, Info, CheckCircle2,
  Sliders, ArrowRight, Play, Layers, Compass, BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS, Asset } from '../../core/data';
import { STRATEGY_LABELS } from '../../core/strategies';
import {
  StressScenarioId,
  PRESET_SCENARIOS,
  CustomShockParams,
  StressResult,
  AssetStressImpact,
} from '../../core/stressTesting';
import { REGIME_COLORS, REGIME_LABELS } from '../../core/regimes';
import { StressSpatialScene } from '../three/StressSpatialScene';

const SCENARIOS: { id: StressScenarioId; title: string; subtitle: string; tag: string }[] = [
  {
    id: 'GFC_2008',
    title: '2008 Style — Financial Crisis',
    subtitle: 'Systemic liquidity freeze & prolonged recovery',
    tag: 'Deep Deleveraging',
  },
  {
    id: 'COVID_2020',
    title: '2020 Style — COVID Crash',
    subtitle: 'Violent flash compression & V-shaped rebound',
    tag: 'Liquidity Shock',
  },
  {
    id: 'RATE_SHOCK_2022',
    title: '2022 Style — Rate Hike Shock',
    subtitle: 'Persistent multiple compression & duration grind',
    tag: 'Monetary Tightening',
  },
  {
    id: 'CRYPTO_CRASH',
    title: 'Crypto Contagion Crash',
    subtitle: 'Idiosyncratic crypto unwind with isolated spillover',
    tag: 'Sector De-peg',
  },
  {
    id: 'CUSTOM',
    title: 'Custom Stress Scenario',
    subtitle: 'Configurable shock depth, duration, & sensitivity',
    tag: 'User Parameterized',
  },
];

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-md p-3 shadow-elevated text-xs font-mono">
      <p className="text-graphite-400 mb-1 font-sans font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-graphite-400 font-sans">{entry.name}:</span>
          <span className="text-graphite font-medium">
            ${Number(entry.value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export function StressLab() {
  const shouldReduceMotion = useReducedMotion();
  const {
    selectedAsset, setAsset,
    selectedStrategy,
    strategyParams,
    initialCapital,
    startDate, endDate,
    selectedStressScenario, setStressScenario,
    customStressParams, setCustomStressParams,
    stressResult, isStressTesting, runStressTest,
    setActiveSection,
  } = useResearchStore();

  // Run initial simulation on mount if empty
  useEffect(() => {
    if (!stressResult) {
      runStressTest();
    }
  }, []);

  // Time-travel slider state: index into price series (0 to 100%)
  const [sliderPercent, setSliderPercent] = useState<number>(50);

  // Active stress result or auto-computed fallback
  const result: StressResult | null = stressResult;

  // Chart data: merge baseline and stressed equity curves
  const chartData = useMemo(() => {
    if (!result) return [];
    const baseEq = result.baselineBacktest.strategyEquity;
    const stressEq = result.stressedBacktest.strategyEquity;
    const step = Math.max(1, Math.floor(baseEq.length / 150));

    return baseEq
      .filter((_, i) => i % step === 0)
      .map((pt, i) => {
        const originalIndex = i * step;
        return {
          date: pt.date.slice(0, 7),
          fullDate: pt.date,
          index: originalIndex,
          Baseline: Math.round(pt.value),
          Stressed: Math.round(stressEq[originalIndex]?.value ?? pt.value),
        };
      });
  }, [result]);

  // Derived slider data point
  const currentStep = useMemo(() => {
    if (!result || result.stressedPrices.length === 0) return null;
    const total = result.stressedPrices.length;
    const idx = Math.min(total - 1, Math.max(0, Math.floor((sliderPercent / 100) * total)));
    const stressedP = result.stressedPrices[idx];
    const baseP = result.baselinePrices[idx];
    const stressedEq = result.stressedBacktest.strategyEquity[idx]?.value ?? initialCapital;
    const baseEq = result.baselineBacktest.strategyEquity[idx]?.value ?? initialCapital;

    let phase: string = 'NORMAL BASELINE';
    if (idx < result.shockStartIndex) {
      phase = '01 — PRE-SHOCK BASELINE';
    } else if (idx <= result.shockTroughIndex) {
      phase = '02 — SHOCK CONTRACTION';
    } else if (idx <= result.shockTroughIndex + 20) {
      phase = '03 — STRESS TROUGH';
    } else if (idx <= result.recoveryEndIndex) {
      phase = '04 — RECOVERY GLIDE';
    } else {
      phase = '05 — POST-RECOVERY';
    }

    const drawdownFromPeak = ((stressedEq - initialCapital) / initialCapital) * 100;

    return {
      date: stressedP?.date ?? '',
      index: idx,
      phase,
      stressedClose: stressedP?.close ?? 0,
      baseClose: baseP?.close ?? 0,
      stressedEquity: stressedEq,
      baseEquity: baseEq,
      equityDelta: stressedEq - baseEq,
      drawdownFromPeak,
    };
  }, [result, sliderPercent, initialCapital]);

  const comp = result?.comparison;

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <p className="section-label">07 — Macro Stress Testing</p>
          <span className="text-[10px] font-mono bg-red-500/10 text-red-600 px-1.5 py-0.5 rounded font-medium">
            SIMULATION ENGINE
          </span>
        </div>
        <h2 className="editorial-md text-2xl mt-1">Time-Travel Macro Shock Lab</h2>
        <p className="body-sm mt-1 max-w-2xl">
          Stress the portfolio. Observe the damage. Measure the recovery. Apply parameterized mathematical shock transformations to examine capital resilience across liquidity freezes, high-volatility sell-offs, and rate shocks.
        </p>
      </div>

      {/* Provenance Disclaimer Badge */}
      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3 text-xs">
        <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-graphite-600 leading-relaxed">
          <strong className="text-graphite">SIMULATED STRESS SCENARIO — NOT A HISTORICAL PRICE REPLAY:</strong>{' '}
          All scenario paths are generated via continuous mathematical decay and volatility models calibrated to historical crisis archetypes (2008, 2020, 2022). They are deterministic model assumptions designed to test strategy mechanics, not exact historical tick-by-tick replays.
        </div>
      </div>

      {/* Scenario Selector Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Select Market Stress Scenario</p>
          <span className="text-xs text-graphite-400 font-mono">
            Active Asset: <strong className="text-graphite">{ASSET_LABELS[selectedAsset]}</strong> · Strategy: <strong className="text-graphite">{STRATEGY_LABELS[selectedStrategy]}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCENARIOS.map((sc) => {
            const isSelected = selectedStressScenario === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => setStressScenario(sc.id)}
                className={`p-3.5 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-graphite text-white border-graphite shadow-elevated'
                    : 'bg-white border-border hover:border-border-dark hover:bg-ivory-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-ivory-200 text-graphite-400'
                      }`}
                    >
                      {sc.tag}
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                  <h4 className="text-xs font-medium leading-snug">{sc.title}</h4>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                      isSelected ? 'text-white/70' : 'text-graphite-400'
                    }`}
                  >
                    {sc.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Spatial Deformation Visualization */}
      <div className="bg-ivory-100 border border-border rounded-xl p-4 shadow-card overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
            <h3 className="font-display font-bold uppercase text-sm text-graphite tracking-tight">
              SPATIAL STRESS DEFORMATION · 3D TOPOLOGY
            </h3>
          </div>
          <span className="text-[10px] font-mono text-taupe uppercase">
            GEOMETRY COMPRESSION: {selectedStressScenario}
          </span>
        </div>
        <StressSpatialScene scenario={selectedStressScenario} height={320} />
      </div>

      {/* Custom Shock Configuration (if CUSTOM is selected) */}
      {selectedStressScenario === 'CUSTOM' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="research-card border-accent/40 bg-accent-muted/10 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border-light pb-2">
            <h4 className="text-xs font-medium text-graphite flex items-center gap-1.5">
              <Sliders size={13} className="text-accent" />
              Custom Stress Parameters
            </h4>
            <span className="text-[11px] font-mono text-graphite-400">Deterministic Model Inputs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="section-label block mb-1">Base Drawdown Magnitude</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-60"
                  max="-5"
                  step="5"
                  value={customStressParams.drawdownPct}
                  onChange={(e) => setCustomStressParams({ drawdownPct: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="font-mono font-medium text-red-600 w-12 text-right">
                  {customStressParams.drawdownPct}%
                </span>
              </div>
            </div>

            <div>
              <label className="section-label block mb-1">Shock Duration (Decline)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={customStressParams.shockDurationDays}
                  onChange={(e) => setCustomStressParams({ shockDurationDays: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="font-mono font-medium text-graphite w-12 text-right">
                  {customStressParams.shockDurationDays}d
                </span>
              </div>
            </div>

            <div>
              <label className="section-label block mb-1">Volatility Multiplier</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.25"
                  value={customStressParams.volatilityMultiplier}
                  onChange={(e) => setCustomStressParams({ volatilityMultiplier: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="font-mono font-medium text-graphite w-12 text-right">
                  {customStressParams.volatilityMultiplier.toFixed(1)}x
                </span>
              </div>
            </div>

            <div>
              <label className="section-label block mb-1">Recovery Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={customStressParams.recoveryDurationDays}
                  onChange={(e) => setCustomStressParams({ recoveryDurationDays: Number(e.target.value) })}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="font-mono font-medium text-graphite w-12 text-right">
                  {customStressParams.recoveryDurationDays}d
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Chart: Portfolio Stress Path */}
      <div className="research-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-label">Portfolio Stress Path</p>
            <h3 className="text-sm font-medium text-graphite mt-0.5">
              Stressed Equity Curve vs Baseline Path
            </h3>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-graphite-400 inline-block border-dashed" style={{ borderTop: '1px dashed' }} />
              <span className="text-graphite-400">Baseline Portfolio</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-red-500 inline-block rounded-full" />
              <span className="text-graphite font-medium">Stressed Path</span>
            </span>
          </div>
        </div>

        {isStressTesting ? (
          <div className="h-64 flex flex-col items-center justify-center text-graphite-400 text-xs">
            <RefreshCw size={20} className="animate-spin text-accent mb-2" />
            Computing macro shock simulation…
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 12, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" strokeOpacity={0.6} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6B6560', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chartData.length / 5)}
                />
                <YAxis
                  tick={{ fill: '#6B6560', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip content={<ChartTooltip />} />
                {result && (
                  <>
                    <ReferenceLine
                      x={chartData.find(c => c.index >= result.shockStartIndex)?.date}
                      stroke="#EF4444"
                      strokeDasharray="3 3"
                      label={{ value: 'Shock Onset', fill: '#EF4444', fontSize: 9, position: 'top' }}
                    />
                    <ReferenceLine
                      x={chartData.find(c => c.index >= result.shockTroughIndex)?.date}
                      stroke="#F59E0B"
                      strokeDasharray="3 3"
                      label={{ value: 'Trough', fill: '#F59E0B', fontSize: 9, position: 'top' }}
                    />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="Baseline"
                  stroke="#9CA3AF"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Stressed"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Interactive Time-Travel Slider */}
        <div className="pt-3 border-t border-border-light space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="section-label flex items-center gap-1.5">
              <Clock size={11} className="text-accent" />
              Time-Travel Scrub Timeline
            </span>
            {currentStep && (
              <span className="font-mono text-[11px] text-graphite-500">
                Date: <strong className="text-graphite">{currentStep.date}</strong> · Phase: <span className="text-accent font-medium">{currentStep.phase}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPercent}
              onChange={(e) => setSliderPercent(Number(e.target.value))}
              className="w-full accent-graphite cursor-pointer h-1.5 bg-ivory-200 rounded-lg"
            />
          </div>

          {currentStep && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
              <div className="bg-ivory-100 p-2 rounded border border-border-light">
                <span className="text-[10px] text-graphite-400 font-sans block">Stressed Portfolio Value</span>
                <span className="text-sm font-medium text-graphite mt-0.5 block">
                  ${Math.round(currentStep.stressedEquity).toLocaleString('en-US')}
                </span>
              </div>
              <div className="bg-ivory-100 p-2 rounded border border-border-light">
                <span className="text-[10px] text-graphite-400 font-sans block">Delta vs Baseline</span>
                <span className={`text-sm font-medium mt-0.5 block ${currentStep.equityDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {currentStep.equityDelta >= 0 ? '+$' : '-$'}
                  {Math.abs(Math.round(currentStep.equityDelta)).toLocaleString('en-US')}
                </span>
              </div>
              <div className="bg-ivory-100 p-2 rounded border border-border-light">
                <span className="text-[10px] text-graphite-400 font-sans block">Asset Stressed Price</span>
                <span className="text-sm font-medium text-graphite mt-0.5 block">
                  ${currentStep.stressedClose.toLocaleString('en-US')}
                </span>
              </div>
              <div className="bg-ivory-100 p-2 rounded border border-border-light">
                <span className="text-[10px] text-graphite-400 font-sans block">Peak Drawdown</span>
                <span className="text-sm font-medium text-red-600 mt-0.5 block">
                  {currentStep.drawdownFromPeak.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stress Damage Report: 6 KPI Cards */}
      {comp && (
        <div>
          <p className="section-label mb-3">Stress Damage Report</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="metric-surface">
              <span className="metric-label">Max Drawdown</span>
              <div className="text-lg font-mono font-medium text-red-600 mt-1">
                {comp.stressedDrawdown.toFixed(2)}%
              </div>
              <span className="text-[10px] font-mono text-graphite-400 mt-1 block">
                {comp.drawdownDelta.toFixed(2)}% vs base
              </span>
            </div>

            <div className="metric-surface">
              <span className="metric-label">Total Return</span>
              <div className={`text-lg font-mono font-medium mt-1 ${comp.stressedReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {comp.stressedReturn > 0 ? '+' : ''}{comp.stressedReturn.toFixed(2)}%
              </div>
              <span className="text-[10px] font-mono text-graphite-400 mt-1 block">
                {comp.returnDelta > 0 ? '+' : ''}{comp.returnDelta.toFixed(2)}% delta
              </span>
            </div>

            <div className="metric-surface">
              <span className="metric-label">Sharpe Ratio</span>
              <div className="text-lg font-mono font-medium text-graphite mt-1">
                {comp.stressedSharpe.toFixed(2)}
              </div>
              <span className={`text-[10px] font-mono mt-1 block ${comp.sharpeDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {comp.sharpeDelta > 0 ? '+' : ''}{comp.sharpeDelta.toFixed(2)} vs base
              </span>
            </div>

            <div className="metric-surface">
              <span className="metric-label">Annualized Vol</span>
              <div className="text-lg font-mono font-medium text-graphite mt-1">
                {comp.stressedVolatility.toFixed(2)}%
              </div>
              <span className="text-[10px] font-mono text-amber-600 mt-1 block">
                +{comp.volatilityDelta.toFixed(2)}% expansion
              </span>
            </div>

            <div className="metric-surface">
              <span className="metric-label">Capital Loss</span>
              <div className="text-lg font-mono font-medium text-red-600 mt-1">
                -${Math.abs(comp.capitalDelta).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] font-mono text-graphite-400 mt-1 block">
                End: ${comp.stressedEndingCapital.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
            </div>

            <div className="metric-surface">
              <span className="metric-label">Recovery Speed</span>
              <div className="text-lg font-mono font-medium text-accent mt-1">
                {comp.recoveryDays} days
              </div>
              <span className="text-[10px] font-mono text-graphite-400 mt-1 block">
                {comp.recoveryPct.toFixed(0)}% recovered
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Asset Response & Correlation Under Stress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Sensitivity & Impact */}
        {result && (
          <div className="research-card space-y-4">
            <div>
              <p className="section-label">Multi-Asset Stress Response</p>
              <h4 className="text-xs font-medium text-graphite mt-0.5">
                Asset Sensitivity Coefficients &amp; Maximum Drawdowns
              </h4>
            </div>

            <div className="space-y-2.5">
              {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((a) => {
                const impact: AssetStressImpact | undefined = result.assetImpacts[a];
                if (!impact) return null;
                const isCurrent = selectedAsset === a;

                return (
                  <div
                    key={a}
                    onClick={() => {
                      setAsset(a);
                      runStressTest();
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-ivory-200 border-border-dark shadow-sm'
                        : 'bg-white border-border-light hover:bg-ivory-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ASSET_COLORS[a] }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-graphite">{ASSET_LABELS[a]}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono bg-graphite text-white px-1 rounded">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-graphite-400">
                          Model Sensitivity: {impact.sensitivity.toFixed(2)}x
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div className="text-red-500 font-medium">{impact.maxDrawdown.toFixed(2)}% MDD</div>
                      <div className="text-[11px] text-graphite-400">
                        {impact.stressedReturn > 0 ? '+' : ''}{impact.stressedReturn.toFixed(1)}% return
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-graphite-400 pt-1">
              Click any asset row to switch active research asset and re-execute stress backtest.
            </p>
          </div>
        )}

        {/* Correlation Under Stress */}
        {result && (
          <div className="research-card space-y-4">
            <div>
              <p className="section-label">Cross-Asset Correlation Shift</p>
              <h4 className="text-xs font-medium text-graphite mt-0.5">
                Baseline 5-Year Pearson vs Shock-Period Crisis Correlation
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-graphite-400 text-left font-sans">
                    <th className="pb-2 font-medium">Pair</th>
                    <th className="pb-2 text-right font-medium">Baseline ρ</th>
                    <th className="pb-2 text-right font-medium">Crisis ρ</th>
                    <th className="pb-2 text-right font-medium">Shift Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {[
                    { a: 'BTC' as Asset, b: 'NVDA' as Asset },
                    { a: 'BTC' as Asset, b: 'GOLD' as Asset },
                    { a: 'NVDA' as Asset, b: 'GOLD' as Asset },
                  ].map(({ a, b }) => {
                    const baseCorr = result.baselineCorrelations[a]?.[b] ?? 0;
                    const stressCorr = result.stressedCorrelations[a]?.[b] ?? 0;
                    const shift = stressCorr - baseCorr;

                    return (
                      <tr key={`${a}-${b}`}>
                        <td className="py-2.5 font-sans font-medium text-graphite">
                          {ASSET_LABELS[a]} × {ASSET_LABELS[b]}
                        </td>
                        <td className="py-2.5 text-right text-graphite-500">
                          {baseCorr.toFixed(3)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-graphite">
                          {stressCorr.toFixed(3)}
                        </td>
                        <td className={`py-2.5 text-right font-medium ${shift > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {shift > 0 ? '+' : ''}{shift.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-ivory-100 rounded border border-border-light text-[11px] text-graphite-500 leading-relaxed">
              <strong className="text-graphite">Crisis Correlation Convergence:</strong> In liquidity shocks, risk assets often exhibit spiking cross-asset correlation toward +1.0 as market participants liquidate broadly to raise cash.
            </div>
          </div>
        )}
      </div>

      {/* Methodology & Model Governance Panel */}
      <div className="research-card space-y-4">
        <div className="flex items-center justify-between border-b border-border-light pb-2">
          <h4 className="text-xs font-medium text-graphite flex items-center gap-1.5">
            <Info size={13} className="text-accent" />
            Stress Methodology &amp; Mathematical Formulation
          </h4>
          <span className="text-[10px] font-mono text-graphite-400">Strictly Deterministic Model</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-graphite-600 leading-relaxed">
          <div className="space-y-2">
            <h5 className="font-medium text-graphite font-mono uppercase text-[11px]">Shock Transformation Equation</h5>
            <div className="p-2.5 bg-ivory-100 rounded border border-border-light font-mono text-[11px] text-graphite-700">
              P_stressed(t) = P_base(t) · [1 + D(t) · λ_asset + ε_vol(t)]
            </div>
            <p>
              Where <span className="font-mono">D(t)</span> is an S-curve drawdown descent, <span className="font-mono">λ_asset</span> is the asset sensitivity coefficient, and <span className="font-mono">ε_vol(t)</span> is deterministic harmonic micro-volatility scaled by the volatility multiplier.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-medium text-graphite font-mono uppercase text-[11px]">Model Limitations &amp; Governance</h5>
            <ul className="list-disc list-inside space-y-1 text-graphite-500 text-[11px]">
              <li>All scenario paths are simulated stress benchmarks, not historical price replays.</li>
              <li>Backtest simulation preserves next-bar execution and transaction friction rules.</li>
              <li>Sensitivity parameters are explicit model inputs, not empirical constants.</li>
              <li>Daily close resolution is modeled; intra-day microstructure is not simulated.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
