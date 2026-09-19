/**
 * BLACKBOX X — Phase 3.9
 * Regime-Aware Probabilistic Intelligence Lab (Regime Intelligence Lab)
 *
 * Source of Truth: docs/REGIME-PROBABILISTIC-ARCHITECTURE.md
 *
 * Master institutional interface featuring:
 * 1. Historical Regime Sequence Overview (1,825 synchronized days)
 * 2. Empirical 4x4 Transition Matrix Heatmap & Stochastic Row Checks
 * 3. Occupancy, Dwell Time & Markov Duration Diagnostics
 * 4. Conditional Return Statistics & Multi-Asset Moments
 * 5. Starting Regime Conditioning Controls (BULL, BEAR, HIGH_VOL, LOW_VOL, CURRENT, EMPIRICAL)
 * 6. Conditional Outcome Distributions (Terminal Wealth, Return, MDD percentiles)
 * 7. Cross-Regime Comparative Matrix (Neutral, non-evaluative reporting)
 * 8. Simulated Transition Path Analysis & Occupancy Breakdown
 * 9. Conditional Euler Risk Decomposition (Marginal & Percentage Risk)
 * 10. Three-Tier Taxonomy (Historical Backtest vs Unconditional MC vs Regime-Conditioned MC)
 * 11. Ghost Mode 2.0 Deterministic Research Insights
 * 12. Non-Predictive Institutional Provenance & Audit Fingerprints
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  GitBranch,
  Clock,
  Layers,
  Activity,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart2,
  ArrowRight,
} from 'lucide-react';
import { PortfolioWeights, RebalanceFrequency } from '../../../core/portfolio/portfolioTypes';
import {
  RegimeMonteCarloMethod,
  StartingRegimeMode,
  RegimeMonteCarloResult,
  RegimeComparisonMatrixResult,
  ALL_REGIMES,
} from '../../../core/portfolio/regimeMonteCarloTypes';
import { REGIME_LABELS, REGIME_COLORS, RegimeType } from '../../../core/regimes';
import {
  runRegimeMonteCarloSimulation,
  getAlignedRegimeSequence,
  buildRegimeTransitionMatrix,
  buildRegimeReturnPools,
  compareRegimeSimulations,
  generateRegimeGhostInsights,
  RegimeGhostInsight,
} from '../../../core/portfolio/regimeMonteCarlo';
import { runRegimeMonteCarloSimulationAsync } from '../../../core/portfolio/monteCarloWorkerClient';

interface RegimeIntelligenceLabProps {
  weights: PortfolioWeights;
}

export function RegimeIntelligenceLab({ weights }: RegimeIntelligenceLabProps) {
  const [method, setMethod] = useState<RegimeMonteCarloMethod>('REGIME_BOOTSTRAP');
  const [startingMode, setStartingMode] = useState<StartingRegimeMode>('START_CURRENT_OBSERVED');
  const [simCount, setSimCount] = useState<number>(5000);
  const [horizonDays, setHorizonDays] = useState<number>(252);
  const [rebalanceSchedule, setRebalanceSchedule] = useState<RebalanceFrequency>('MONTHLY');
  const [seed, setSeed] = useState<number>(42);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'SIMULATION' | 'COMPARISON' | 'TRANSITION_MATRIX' | 'INSIGHTS'>('SIMULATION');

  // Compute baseline observations and transition matrix
  const observations = useMemo(() => getAlignedRegimeSequence(weights), [weights]);
  const transitionMatrix = useMemo(() => buildRegimeTransitionMatrix(observations), [observations]);
  const returnPools = useMemo(() => buildRegimeReturnPools(observations, weights), [observations, weights]);

  // Initial deterministic result
  const [result, setResult] = useState<RegimeMonteCarloResult>(() => {
    return runRegimeMonteCarloSimulation({
      method: 'REGIME_BOOTSTRAP',
      startingRegimeMode: 'START_CURRENT_OBSERVED',
      portfolioWeights: weights,
      simulationCount: 5000,
      horizonDays: 252,
      rebalanceSchedule: 'MONTHLY',
      seed: 42,
    });
  });

  // Cross-regime comparison matrix (computed on demand or when tab is active)
  const comparisonResult: RegimeComparisonMatrixResult = useMemo(() => {
    return compareRegimeSimulations(weights, method, horizonDays, Math.min(simCount, 5000), seed);
  }, [weights, method, horizonDays, simCount, seed]);

  // Ghost Mode deterministic insights
  const ghostInsights: RegimeGhostInsight[] = useMemo(() => {
    return generateRegimeGhostInsights(result, comparisonResult);
  }, [result, comparisonResult]);

  // Asynchronous Web Worker simulation execution
  useEffect(() => {
    let isCancelled = false;
    setIsSimulating(true);

    runRegimeMonteCarloSimulationAsync({
      method,
      startingRegimeMode: startingMode,
      portfolioWeights: weights,
      simulationCount: simCount,
      horizonDays,
      rebalanceSchedule,
      seed,
    })
      .then((res) => {
        if (!isCancelled) {
          setResult(res);
          setIsSimulating(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Async Regime Monte Carlo error:', err);
          setIsSimulating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [method, startingMode, weights, simCount, horizonDays, rebalanceSchedule, seed]);

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  return (
    <div className="rounded-lg border border-border bg-white p-6 shadow-sm space-y-6">
      {/* 1. Master Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-graphite rounded-sm flex items-center justify-center">
              <Compass size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-graphite uppercase tracking-wider">
              Regime Intelligence Lab
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              PHASE 3.9
            </span>
          </div>
          <p className="text-xs text-graphite-400 mt-1">
            Regime-Conditioned Probabilistic Simulation • Empirical Markov Transitions • Multi-Asset Conditional Vector Pools
          </p>
        </div>

        {/* Status & Worker Indicator */}
        <div className="flex items-center gap-3">
          {isSimulating ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-blue-700 border border-blue-200 rounded-sm bg-blue-50">
              <Loader2 size={11} className="animate-spin" />
              <span>Simulating in Web Worker...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-emerald-700 border border-emerald-200 rounded-sm bg-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              <span>Worker Parity Active</span>
            </div>
          )}
          <button
            onClick={handleRandomizeSeed}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-graphite-400 hover:text-graphite border border-border rounded-sm bg-[#FAF8F4] hover:bg-white transition-colors"
          >
            <RefreshCw size={11} />
            <span>Seed: #{seed}</span>
          </button>
        </div>
      </div>

      {/* Non-Predictive Institutional Notice */}
      <div className="p-3 bg-[#FAF8F4] border border-border rounded text-xs text-graphite-500 leading-relaxed flex items-start gap-2.5">
        <ShieldAlert size={15} className="text-graphite-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-graphite">NON-PREDICTIVE SPECIFICATION: </span>
          BLACKBOX X evaluates how portfolio outcome distributions differ under regime-conditioned simulation assumptions.
          Transition frequencies are empirical counts from the offline synchronized demonstration dataset (2019–2023) and are not forward forecasts.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2 text-xs">
        <button
          onClick={() => setActiveTab('SIMULATION')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeTab === 'SIMULATION' ? 'bg-graphite text-white' : 'text-graphite-400 hover:text-graphite hover:bg-gray-100'
          }`}
        >
          Conditional Simulation
        </button>
        <button
          onClick={() => setActiveTab('COMPARISON')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeTab === 'COMPARISON' ? 'bg-graphite text-white' : 'text-graphite-400 hover:text-graphite hover:bg-gray-100'
          }`}
        >
          Cross-Regime Comparison
        </button>
        <button
          onClick={() => setActiveTab('TRANSITION_MATRIX')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeTab === 'TRANSITION_MATRIX' ? 'bg-graphite text-white' : 'text-graphite-400 hover:text-graphite hover:bg-gray-100'
          }`}
        >
          Transition Matrix & Persistence
        </button>
        <button
          onClick={() => setActiveTab('INSIGHTS')}
          className={`px-3 py-1.5 rounded font-medium transition-colors ${
            activeTab === 'INSIGHTS' ? 'bg-graphite text-white' : 'text-graphite-400 hover:text-graphite hover:bg-gray-100'
          }`}
        >
          Ghost Mode Research Insights ({ghostInsights.length})
        </button>
      </div>

      {/* Tab 1: Conditional Simulation */}
      {activeTab === 'SIMULATION' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded bg-[#FAF8F4] border border-border text-xs">
            {/* Starting Regime Mode */}
            <div>
              <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
                Starting Regime
              </label>
              <select
                value={startingMode}
                onChange={e => setStartingMode(e.target.value as StartingRegimeMode)}
                className="w-full bg-white border border-border rounded px-2 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
              >
                <option value="START_CURRENT_OBSERVED">Latest Historical ({REGIME_LABELS[observations[observations.length - 1].regime]})</option>
                <option value="START_BULL">Bull Market (START_BULL)</option>
                <option value="START_BEAR">Bear Market (START_BEAR)</option>
                <option value="START_HIGH_VOL">High Volatility (START_HIGH_VOL)</option>
                <option value="START_LOW_VOL">Low Volatility (START_LOW_VOL)</option>
                <option value="START_EMPIRICAL_DISTRIBUTION">Sampled Empirical Distribution</option>
              </select>
              <span className="text-[10px] text-graphite-400 mt-1 block">
                Resolved: {result.resolvedStartingRegime}
              </span>
            </div>

            {/* Methodology */}
            <div>
              <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
                Simulation Method
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as RegimeMonteCarloMethod)}
                className="w-full bg-white border border-border rounded px-2 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
              >
                <option value="REGIME_BOOTSTRAP">Regime-Conditioned Bootstrap</option>
                <option value="REGIME_PARAMETRIC">Regime-Conditioned Parametric</option>
              </select>
              <span className="text-[10px] text-graphite-400 mt-1 block">
                {method === 'REGIME_BOOTSTRAP' ? 'Resamples joint vectors in regime' : 'Cholesky Σ_r with stabilization'}
              </span>
            </div>

            {/* Simulated Paths */}
            <div>
              <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
                Path Count
              </label>
              <select
                value={simCount}
                onChange={e => setSimCount(Number(e.target.value))}
                className="w-full bg-white border border-border rounded px-2 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
              >
                <option value={1000}>1,000 Paths</option>
                <option value={5000}>5,000 Paths (Standard)</option>
                <option value={10000}>10,000 Paths (High Precision)</option>
              </select>
              <span className="text-[10px] text-graphite-400 mt-1 block">
                Evaluated in {result.executionDurationMs}ms
              </span>
            </div>

            {/* Forward Horizon */}
            <div>
              <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
                Horizon (Trading Days)
              </label>
              <select
                value={horizonDays}
                onChange={e => setHorizonDays(Number(e.target.value))}
                className="w-full bg-white border border-border rounded px-2 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
              >
                <option value={63}>63 Days (~1 Quarter)</option>
                <option value={126}>126 Days (~6 Months)</option>
                <option value={252}>252 Days (1 Year)</option>
                <option value={504}>504 Days (2 Years)</option>
              </select>
              <span className="text-[10px] text-graphite-400 mt-1 block">
                Annualization base = 252 days
              </span>
            </div>

            {/* Rebalancing Strategy */}
            <div>
              <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
                Rebalancing Strategy
              </label>
              <select
                value={rebalanceSchedule}
                onChange={e => setRebalanceSchedule(e.target.value as RebalanceFrequency)}
                className="w-full bg-white border border-border rounded px-2 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
              >
                <option value="BUY_AND_HOLD">Buy & Hold (Organic Drift)</option>
                <option value="DAILY">Daily Rebalance</option>
                <option value="MONTHLY">Monthly Rebalance (21d)</option>
                <option value="QUARTERLY">Quarterly Rebalance (63d)</option>
                <option value="THRESHOLD">Threshold Rebalance (±5%)</option>
              </select>
              <span className="text-[10px] text-graphite-400 mt-1 block">
                10 bps friction applied
              </span>
            </div>
          </div>

          {/* Outcome Percentile Distribution Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Terminal Wealth Distribution */}
            <div className="p-4 rounded border border-border bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-graphite uppercase">Terminal Wealth</span>
                <span className="text-[10px] font-mono text-graphite-400">Initial: $100,000</span>
              </div>
              <div className="text-2xl font-bold font-mono text-graphite">
                ${Math.round(result.terminalWealth.p50).toLocaleString()}
              </div>
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-border">
                <div className="flex justify-between text-graphite-400">
                  <span>P05 (Adverse Tail):</span>
                  <span className="text-red-600 font-bold">${Math.round(result.terminalWealth.p05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P25 (Lower Quartile):</span>
                  <span>${Math.round(result.terminalWealth.p25).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-graphite font-bold">
                  <span>P50 (Median):</span>
                  <span>${Math.round(result.terminalWealth.p50).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P75 (Upper Quartile):</span>
                  <span>${Math.round(result.terminalWealth.p75).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P95 (Favorable Tail):</span>
                  <span className="text-emerald-600 font-bold">${Math.round(result.terminalWealth.p95).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Total Return Percentiles */}
            <div className="p-4 rounded border border-border bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-graphite uppercase">Simulated Total Return</span>
                <span className="text-[10px] font-mono text-graphite-400">Horizon: {horizonDays}d</span>
              </div>
              <div className={`text-2xl font-bold font-mono ${result.totalReturn.p50 >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {result.totalReturn.p50 >= 0 ? '+' : ''}{result.totalReturn.p50.toFixed(2)}%
              </div>
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-border">
                <div className="flex justify-between text-graphite-400">
                  <span>P05 Return:</span>
                  <span className={result.totalReturn.p05 < 0 ? 'text-red-600' : ''}>{result.totalReturn.p05.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P25 Return:</span>
                  <span>{result.totalReturn.p25.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite font-bold">
                  <span>P50 Median:</span>
                  <span>{result.totalReturn.p50.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P75 Return:</span>
                  <span>{result.totalReturn.p75.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P95 Return:</span>
                  <span className="text-emerald-600 font-bold">{result.totalReturn.p95.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Maximum Drawdown Percentiles */}
            <div className="p-4 rounded border border-border bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-graphite uppercase">Maximum Drawdown</span>
                <span className="text-[10px] font-mono text-graphite-400">Peak-to-Trough</span>
              </div>
              <div className="text-2xl font-bold font-mono text-graphite">
                {result.maxDrawdown.p50.toFixed(2)}%
              </div>
              <div className="space-y-1 text-xs font-mono pt-2 border-t border-border">
                <div className="flex justify-between text-graphite-400">
                  <span>P95 (Severe Drawdown):</span>
                  <span className="text-red-600 font-bold">{result.maxDrawdown.p05.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P75 Drawdown:</span>
                  <span>{result.maxDrawdown.p25.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite font-bold">
                  <span>P50 Median:</span>
                  <span>{result.maxDrawdown.p50.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P25 Drawdown:</span>
                  <span>{result.maxDrawdown.p75.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-graphite-400">
                  <span>P05 (Mildest Drawdown):</span>
                  <span>{result.maxDrawdown.p95.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Metrics & Exceedance Frequencies */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded border border-border bg-white text-xs">
            <div>
              <span className="text-[10px] font-mono text-graphite-400 uppercase block">Loss Frequency</span>
              <span className="text-base font-bold font-mono text-graphite">
                {result.riskMetrics.lossFrequencyPct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-graphite-400 block mt-0.5">Paths ending below $100k</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-graphite-400 uppercase block">MDD &le; -10% Freq</span>
              <span className="text-base font-bold font-mono text-graphite">
                {result.riskMetrics.drawdownExceedance10Pct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-graphite-400 block mt-0.5">Paths hitting &ge; 10% drawdown</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-graphite-400 uppercase block">Horizon VaR (95%)</span>
              <span className="text-base font-bold font-mono text-graphite">
                {result.riskMetrics.horizonSimulatedVaR95.toFixed(2)}%
              </span>
              <span className="text-[10px] text-graphite-400 block mt-0.5">Positive loss standard</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-graphite-400 uppercase block">Horizon CVaR (95%)</span>
              <span className="text-base font-bold font-mono text-red-600">
                {result.riskMetrics.horizonSimulatedCVaR95.toFixed(2)}%
              </span>
              <span className="text-[10px] text-graphite-400 block mt-0.5">Expected tail loss</span>
            </div>
          </div>

          {/* Simulated Transition Path Statistics */}
          <div className="p-4 rounded border border-border bg-[#FAF8F4] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-graphite uppercase">Simulated Path Dynamics</span>
              <span className="font-mono text-graphite-400 text-[10px]">
                Average Regime Switches: {result.pathStats.averageTransitionsPerPath} per path
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ALL_REGIMES.map(reg => (
                <div key={reg} className="p-2.5 rounded bg-white border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[reg] }} />
                    <span className="font-bold text-graphite text-[11px]">{REGIME_LABELS[reg]}</span>
                  </div>
                  <div className="text-[11px] font-mono text-graphite-500 space-y-0.5">
                    <div>Occupancy: {(result.pathStats.occupancyFrequencies[reg] * 100).toFixed(1)}%</div>
                    <div>Avg Dwell: {result.pathStats.averageSimulatedDuration[reg]} days</div>
                    <div>Terminal: {(result.pathStats.terminalRegimeFrequencies[reg] * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cross-Regime Comparison Matrix */}
      {activeTab === 'COMPARISON' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#FAF8F4] border border-border rounded text-xs text-graphite-500">
            <span className="font-bold text-graphite">NEUTRAL COMPARATIVE MATRIX: </span>
            Evaluates how outcome distributions differ across starting regimes under identical weights ({weights.GOLD.toFixed(2)} Gold / {weights.BTC.toFixed(2)} BTC / {weights.NVDA.toFixed(2)} NVDA) and forward horizon ({horizonDays}d). Regimes are reported neutrally without subjective "best" or "worst" ratings.
          </div>

          <div className="overflow-x-auto border border-border rounded">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF8F4] border-b border-border text-graphite-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Starting Regime</th>
                  <th className="p-3">P50 Return</th>
                  <th className="p-3">P95 Drawdown</th>
                  <th className="p-3">Loss Freq %</th>
                  <th className="p-3">Median Terminal $</th>
                  <th className="p-3">Horizon VaR95</th>
                  <th className="p-3">Horizon CVaR95</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonResult.table.map(row => (
                  <tr key={row.startingRegime} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-graphite flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[row.startingRegime] }} />
                      <span>{row.startingRegimeLabel}</span>
                    </td>
                    <td className={`p-3 font-bold ${row.p50ReturnPct >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {row.p50ReturnPct >= 0 ? '+' : ''}{row.p50ReturnPct.toFixed(2)}%
                    </td>
                    <td className="p-3 text-red-600">
                      {row.p95MaxDrawdownPct.toFixed(2)}%
                    </td>
                    <td className="p-3 text-graphite">
                      {row.lossFrequencyPct.toFixed(1)}%
                    </td>
                    <td className="p-3 font-bold text-graphite">
                      ${Math.round(row.medianTerminalWealth).toLocaleString()}
                    </td>
                    <td className="p-3 text-graphite">
                      {row.horizonVaR95.toFixed(2)}%
                    </td>
                    <td className="p-3 text-red-600 font-bold">
                      {row.horizonCVaR95.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Empirical Transition Matrix & Persistence */}
      {activeTab === 'TRANSITION_MATRIX' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4x4 Empirical Transition Heatmap */}
            <div className="border border-border rounded p-4 bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-graphite uppercase">Empirical Transition Matrix (P_ij)</span>
                <span className="text-[10px] font-mono text-graphite-400">Total Transitions: 1,824</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono">
                  <thead>
                    <tr className="text-[10px] text-graphite-400 border-b border-border">
                      <th className="p-2 text-left">From \ To</th>
                      <th className="p-2">BULL</th>
                      <th className="p-2">BEAR</th>
                      <th className="p-2">HIGH_VOL</th>
                      <th className="p-2">LOW_VOL</th>
                      <th className="p-2">Row Sum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ALL_REGIMES.map(from => {
                      const outCount = transitionMatrix.outgoingTransitionCounts[from];
                      const rowSum = ALL_REGIMES.reduce((s, to) => s + transitionMatrix.probabilities[from][to], 0);
                      return (
                        <tr key={from}>
                          <td className="p-2 text-left font-semibold text-graphite flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[from] }} />
                            <span>{from}</span>
                          </td>
                          {ALL_REGIMES.map(to => {
                            const p = transitionMatrix.probabilities[from][to];
                            const count = transitionMatrix.counts[from][to];
                            return (
                              <td key={to} className="p-2">
                                <div className="font-bold text-graphite">{(p * 100).toFixed(1)}%</div>
                                <div className="text-[9px] text-graphite-400 font-mono">(n={count})</div>
                              </td>
                            );
                          })}
                          <td className="p-2 font-mono text-[11px] text-emerald-700 font-semibold">
                            {outCount > 0 ? (rowSum * 100).toFixed(0) + '%' : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Dwell Time & Persistence Diagnostics */}
            <div className="border border-border rounded p-4 bg-[#FAF8F4] space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-graphite uppercase">Regime Dwell Time & Stickiness</span>
                <span className="text-[10px] font-mono text-graphite-400">Switch Rate: {(transitionMatrix.switchingFrequency * 100).toFixed(1)}%</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[10px] text-graphite-400 border-b border-border">
                      <th className="p-2">Regime</th>
                      <th className="p-2">Occupancy</th>
                      <th className="p-2">Obs Dwell</th>
                      <th className="p-2">Stickiness (P_ii)</th>
                      <th className="p-2">Markov Geometric</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ALL_REGIMES.map(r => (
                      <tr key={r}>
                        <td className="p-2 font-semibold text-graphite flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[r] }} />
                          <span>{REGIME_LABELS[r]}</span>
                        </td>
                        <td className="p-2">{(transitionMatrix.occupancy[r] * 100).toFixed(1)}%</td>
                        <td className="p-2">{transitionMatrix.averageDuration[r]}d (med: {transitionMatrix.medianDuration[r]}d)</td>
                        <td className="p-2 font-bold text-graphite">{(transitionMatrix.selfTransitionProbability[r] * 100).toFixed(1)}%</td>
                        <td className="p-2">{Number.isFinite(transitionMatrix.expectedMarkovDuration[r]) ? `${transitionMatrix.expectedMarkovDuration[r]}d` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Conditional Multi-Asset Moments by Regime */}
          <div className="p-4 border border-border rounded bg-white space-y-3 text-xs">
            <span className="font-bold text-graphite uppercase block border-b border-border pb-2">
              Conditional Multi-Asset Volatilities & Euler Percentage Risk Contribution
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_REGIMES.map(r => {
                const pool = returnPools[r];
                return (
                  <div key={r} className="p-3 rounded bg-[#FAF8F4] border border-border space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-graphite">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[r] }} />
                      <span>{REGIME_LABELS[r]} (n={pool.observationCount})</span>
                    </div>
                    <div className="text-[11px] font-mono space-y-1 text-graphite-500">
                      <div>Gold Vol: {pool.volatility.GOLD.toFixed(1)}% | PRC: {pool.riskContribution ? (pool.riskContribution.percentageRisk.GOLD * 100).toFixed(1) : 'N/A'}%</div>
                      <div>BTC Vol: {pool.volatility.BTC.toFixed(1)}% | PRC: {pool.riskContribution ? (pool.riskContribution.percentageRisk.BTC * 100).toFixed(1) : 'N/A'}%</div>
                      <div>NVDA Vol: {pool.volatility.NVDA.toFixed(1)}% | PRC: {pool.riskContribution ? (pool.riskContribution.percentageRisk.NVDA * 100).toFixed(1) : 'N/A'}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Ghost Mode Research Insights */}
      {activeTab === 'INSIGHTS' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#FAF8F4] border border-border rounded text-xs text-graphite-500">
            <span className="font-bold text-graphite">GHOST MODE 2.0 RESEARCH INSIGHTS: </span>
            Deterministic rule-based insights grounded strictly in calculated regime transitions, conditional volatilities, and simulation spreads. No generative hallucinations.
          </div>

          <div className="space-y-3">
            {ghostInsights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded border border-border bg-[#FAF8F4] space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-border pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-graphite text-white font-mono text-[9px] font-semibold">
                      {insight.category}
                    </span>
                    <span className="font-bold text-graphite text-xs">{insight.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-graphite-500">
                  <div>
                    <span className="font-bold text-graphite block">Observation:</span>
                    {insight.observation}
                  </div>
                  <div>
                    <span className="font-bold text-graphite block">Evidence:</span>
                    {insight.evidence}
                  </div>
                  <div>
                    <span className="font-bold text-graphite block">Analytical Impact:</span>
                    {insight.impact}
                  </div>
                  <div>
                    <span className="font-bold text-graphite block">Recommended Next Test:</span>
                    {insight.nextTest}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance Footer */}
      <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-graphite-400">
        <div>
          <span>Audit Fingerprint: </span>
          <span className="text-graphite font-bold">{result.fingerprint}</span>
        </div>
        <div>
          <span>Dataset: 1,825 synchronized daily observations (2019-01-01 to 2023-12-31)</span>
        </div>
      </div>
    </div>
  );
}
