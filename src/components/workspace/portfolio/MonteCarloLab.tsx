/**
 * BLACKBOX X — Phase 3.8
 * Monte Carlo & Probabilistic Risk Intelligence Lab
 *
 * Institutional probabilistic risk lab featuring:
 * 1. Historical Joint Bootstrap vs. Parametric Correlated Normal simulation
 * 2. Trajectory percentile bands (P05, P25, P50, P75, P95) & sample path fans
 * 3. Terminal Wealth, Return, and Drawdown percentile distribution tables
 * 4. Tail risk exceedance frequencies (Loss frequency, MDD <= -10%, -20%, -30%)
 * 5. Realized Historical Backtest vs. Monte Carlo reconciliation contract
 * 6. Deterministic PRNG seed control, audit fingerprint, and provenance
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Activity, ShieldAlert, Sliders, RefreshCw, BarChart3, Info, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { PortfolioWeights, RebalanceFrequency } from '../../../core/portfolio/portfolioTypes';
import {
  MonteCarloMethod,
  MonteCarloResult,
  HistoricalVsMonteCarloComparison,
} from '../../../core/portfolio/monteCarloTypes';
import {
  runMonteCarloSimulation,
  compareHistoricalVsMonteCarlo,
} from '../../../core/portfolio/monteCarloEngine';
import { runMonteCarloSimulationAsync } from '../../../core/portfolio/monteCarloWorkerClient';

interface MonteCarloLabProps {
  weights: PortfolioWeights;
}

export function MonteCarloLab({ weights }: MonteCarloLabProps) {
  const [method, setMethod] = useState<MonteCarloMethod>('HISTORICAL_BOOTSTRAP');
  const [simCount, setSimCount] = useState<number>(5000);
  const [horizonDays, setHorizonDays] = useState<number>(252);
  const [rebalanceSchedule, setRebalanceSchedule] = useState<RebalanceFrequency>('MONTHLY');
  const [seed, setSeed] = useState<number>(482910);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Fallback initial synchronous baseline
  const [mcResult, setMcResult] = useState<MonteCarloResult>(() => {
    return runMonteCarloSimulation({
      method: 'HISTORICAL_BOOTSTRAP',
      simulationCount: 5000,
      horizonDays: 252,
      portfolioWeights: weights,
      rebalanceSchedule: 'MONTHLY',
      seed: 482910,
      includeTransactionCosts: true,
      transactionCostBps: 10,
    });
  });

  // Execute simulation off-thread via dedicated Web Worker client
  useEffect(() => {
    let isCancelled = false;
    setIsSimulating(true);

    runMonteCarloSimulationAsync({
      method,
      simulationCount: simCount,
      horizonDays,
      portfolioWeights: weights,
      rebalanceSchedule,
      seed,
      includeTransactionCosts: true,
      transactionCostBps: 10,
    })
      .then((res) => {
        if (!isCancelled) {
          setMcResult(res);
          setIsSimulating(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Async Monte Carlo execution error:', err);
          setIsSimulating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [method, simCount, horizonDays, weights, rebalanceSchedule, seed]);

  const comparisons: HistoricalVsMonteCarloComparison[] = useMemo(() => {
    return compareHistoricalVsMonteCarlo(weights, rebalanceSchedule, mcResult);
  }, [weights, rebalanceSchedule, mcResult]);

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 900000) + 100000);
  };

  // Trajectory bands visualization helpers
  const bands = mcResult.trajectoryBands;
  const maxVal = Math.max(...bands.p95Path, 150000);
  const minVal = Math.min(...bands.p05Path, 80000);
  const range = maxVal - minVal || 1;

  const svgWidth = 700;
  const svgHeight = 220;
  const padLeft = 55;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const getX = (index: number) => padLeft + (index / (bands.days.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - ((val - minVal) / range) * plotH;

  // Build SVG polygon points for P05-P95 and P25-P75 bands
  const p05p95Area = [
    ...bands.p95Path.map((v, i) => `${getX(i)},${getY(v)}`),
    ...bands.p05Path.map((v, i) => `${getX(bands.p05Path.length - 1 - i)},${getY(bands.p05Path[bands.p05Path.length - 1 - i])}`),
  ].join(' ');

  const p25p75Area = [
    ...bands.p75Path.map((v, i) => `${getX(i)},${getY(v)}`),
    ...bands.p25Path.map((v, i) => `${getX(bands.p25Path.length - 1 - i)},${getY(bands.p25Path[bands.p25Path.length - 1 - i])}`),
  ].join(' ');

  const p50Line = bands.p50Path.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  return (
    <div className="bg-white border border-border rounded-sm p-5 space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#B40023] text-white rounded-sm flex items-center justify-center">
              <Activity size={12} />
            </div>
            <h2 className="text-xs font-bold text-graphite uppercase tracking-wider">
              Monte Carlo & Probabilistic Risk Intelligence
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
              SIMULATION — NOT A FORECAST
            </span>
          </div>
          <p className="text-xs text-graphite-400 mt-1">
            Deterministic probabilistic path generation under declared distribution assumptions. Evaluates outcome dispersion, loss frequency, and tail drawdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSimulating ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#B40023] border border-rose-200 rounded-sm bg-rose-50">
              <Loader2 size={11} className="animate-spin" />
              <span>Simulating in Web Worker...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-emerald-700 border border-emerald-200 rounded-sm bg-emerald-50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              <span>Worker Non-Blocking</span>
            </div>
          )}
          <button
            onClick={handleRandomizeSeed}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-graphite-400 hover:text-graphite border border-border rounded-sm bg-[#FAF8F4] hover:bg-white transition-colors"
            title="Cycle deterministic PRNG seed"
          >
            <RefreshCw size={11} />
            <span>Seed: #{seed}</span>
          </button>
        </div>
      </div>

      {/* Provenance & Non-Predictive Disclaimer Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex items-start gap-2.5 text-xs">
        <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-graphite-600 leading-relaxed">
          <strong className="text-graphite">SIMULATION — NOT A FORECAST:</strong>{' '}
          Monte Carlo path generation models distribution dispersion under declared empirical/parametric assumptions. Trajectories are probabilistic scenario simulations, not predictive price forecasts, returns guarantees, or investment advice.
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded bg-[#FAF8F4] border border-border text-xs">
        {/* Simulation Method */}
        <div>
          <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
            Methodology
          </label>
          <select
            value={method}
            onChange={e => setMethod(e.target.value as MonteCarloMethod)}
            className="w-full bg-white border border-border rounded px-2.5 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
          >
            <option value="HISTORICAL_BOOTSTRAP">Historical Joint Bootstrap</option>
            <option value="PARAMETRIC_NORMAL">Parametric Correlated Normal</option>
          </select>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            {method === 'HISTORICAL_BOOTSTRAP' ? 'Resamples complete vectors (zero asset decoupling)' : 'Empirical Σ Cholesky correlated shocks'}
          </span>
        </div>

        {/* Simulation Count */}
        <div>
          <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
            Simulated Paths
          </label>
          <select
            value={simCount}
            onChange={e => setSimCount(Number(e.target.value))}
            className="w-full bg-white border border-border rounded px-2.5 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
          >
            <option value={1000}>1,000 Paths (Fast)</option>
            <option value={5000}>5,000 Paths (Standard)</option>
            <option value={10000}>10,000 Paths (Institutional)</option>
            <option value={20000}>20,000 Paths (High Fidelity)</option>
          </select>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            Evaluated in {mcResult.executionDurationMs}ms
          </span>
        </div>

        {/* Horizon */}
        <div>
          <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
            Forward Horizon
          </label>
          <select
            value={horizonDays}
            onChange={e => setHorizonDays(Number(e.target.value))}
            className="w-full bg-white border border-border rounded px-2.5 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
          >
            <option value={63}>63 Days (~1 Quarter)</option>
            <option value={126}>126 Days (~6 Months)</option>
            <option value={252}>252 Days (1 Year)</option>
            <option value={504}>504 Days (2 Years)</option>
          </select>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            Annualized base = 252 steps
          </span>
        </div>

        {/* Rebalance Schedule */}
        <div>
          <label className="block text-[10px] font-bold text-graphite-400 uppercase mb-1">
            Rebalancing Strategy
          </label>
          <select
            value={rebalanceSchedule}
            onChange={e => setRebalanceSchedule(e.target.value as RebalanceFrequency)}
            className="w-full bg-white border border-border rounded px-2.5 py-1.5 text-xs text-graphite font-mono focus:outline-none focus:border-graphite"
          >
            <option value="BUY_AND_HOLD">Buy & Hold (Organic Drift)</option>
            <option value="DAILY">Daily Rebalance</option>
            <option value="MONTHLY">Monthly Rebalance (21d)</option>
            <option value="QUARTERLY">Quarterly Rebalance (63d)</option>
            <option value="THRESHOLD">Threshold Rebalance (±5%)</option>
          </select>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            10 bps execution friction applied
          </span>
        </div>
      </div>

      {/* Trajectory Fan Chart */}
      <div className="border border-border rounded p-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-bold text-graphite uppercase tracking-wide flex items-center gap-1.5">
            <BarChart3 size={13} className="text-[#B40023]" />
            <span>Simulated Wealth Trajectory Percentile Fan ($100,000 Initial Capital)</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-graphite-400">
            <div className="flex items-center gap-1">
              <span className="w-3 h-2 bg-[#B40023] opacity-15 inline-block rounded-xs" />
              <span>P05–P95 Dispersion</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-2 bg-[#B40023] opacity-35 inline-block rounded-xs" />
              <span>P25–P75 Interquartile</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#B40023] inline-block" />
              <span>P50 Median Path</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-56 select-none font-mono">
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map(pct => {
              const yVal = minVal + pct * range;
              const y = getY(yVal);
              return (
                <g key={pct}>
                  <line x1={padLeft} y1={y} x2={svgWidth - padRight} y2={y} stroke="#ECE8E1" strokeDasharray="3 3" />
                  <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#999">
                    ${(yVal / 1000).toFixed(0)}k
                  </text>
                </g>
              );
            })}

            {/* P05-P95 Fan Area */}
            <polygon points={p05p95Area} fill="#B40023" fillOpacity="0.10" />

            {/* P25-P75 Fan Area */}
            <polygon points={p25p75Area} fill="#B40023" fillOpacity="0.25" />

            {/* 50 Representative Sample Individual Paths */}
            {mcResult.samplePaths.map(sp => {
              const pts = sp.values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
              return <polyline key={sp.pathId} points={pts} fill="none" stroke="#68645E" strokeOpacity="0.12" strokeWidth="0.8" />;
            })}

            {/* Baseline Initial Capital Line ($100k) */}
            <line
              x1={padLeft}
              y1={getY(100000)}
              x2={svgWidth - padRight}
              y2={getY(100000)}
              stroke="#C93B2B"
              strokeDasharray="4 4"
              strokeWidth="1.2"
            />
            <text x={svgWidth - padRight} y={getY(100000) - 4} textAnchor="end" fontSize="9" fill="#C93B2B" fontWeight="bold">
              Break-Even ($100k)
            </text>

            {/* P50 Median Line */}
            <polyline points={p50Line} fill="none" stroke="#B40023" strokeWidth="2.5" />

            {/* X-axis labels */}
            <text x={padLeft} y={svgHeight - 8} fontSize="9" fill="#999">Day 0</text>
            <text x={padLeft + plotW / 2} y={svgHeight - 8} fontSize="9" fill="#999" textAnchor="middle">
              Day {Math.floor(horizonDays / 2)}
            </text>
            <text x={padLeft + plotW} y={svgHeight - 8} fontSize="9" fill="#999" textAnchor="end">
              Day {horizonDays}
            </text>
          </svg>
        </div>
      </div>

      {/* Distribution Percentiles Table */}
      <div>
        <div className="text-xs font-bold text-graphite uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>Simulation Percentiles (Ordered Outcome Distribution)</span>
          <span className="text-[10px] font-mono text-graphite-400 font-normal">
            Term: "Simulation Percentile" • NOT "Confidence Interval"
          </span>
        </div>
        <div className="overflow-x-auto border border-border rounded">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-border text-[10px] text-graphite-400 uppercase">
                <th className="py-2.5 px-3 text-left">Portfolio Metric</th>
                <th className="py-2.5 px-3 text-right text-rose-700">P05 (Adverse)</th>
                <th className="py-2.5 px-3 text-right">P25</th>
                <th className="py-2.5 px-3 text-right font-bold text-graphite">P50 (Median)</th>
                <th className="py-2.5 px-3 text-right">P75</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">P95 (Favorable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-graphite">Terminal Wealth ($)</td>
                <td className="py-2.5 px-3 text-right text-rose-700">${mcResult.terminalWealth.p05.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-2.5 px-3 text-right">${mcResult.terminalWealth.p25.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-2.5 px-3 text-right font-bold text-graphite">${mcResult.terminalWealth.p50.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-2.5 px-3 text-right">${mcResult.terminalWealth.p75.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td className="py-2.5 px-3 text-right text-emerald-700">${mcResult.terminalWealth.p95.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-graphite">Total Return (%)</td>
                <td className="py-2.5 px-3 text-right text-rose-700">{mcResult.totalReturn.p05.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right">{mcResult.totalReturn.p25.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right font-bold text-graphite">{mcResult.totalReturn.p50.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right">{mcResult.totalReturn.p75.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right text-emerald-700">+{mcResult.totalReturn.p95.toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-graphite">Maximum Drawdown (%)</td>
                <td className="py-2.5 px-3 text-right text-rose-700">{mcResult.maxDrawdown.p05.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right">{mcResult.maxDrawdown.p25.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right font-bold text-graphite">{mcResult.maxDrawdown.p50.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right">{mcResult.maxDrawdown.p75.toFixed(2)}%</td>
                <td className="py-2.5 px-3 text-right">{mcResult.maxDrawdown.p95.toFixed(2)}%</td>
              </tr>
              {mcResult.cagr && (
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-graphite">Simulated CAGR (%)</td>
                  <td className="py-2.5 px-3 text-right text-rose-700">{mcResult.cagr.p05.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right">{mcResult.cagr.p25.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right font-bold text-graphite">{mcResult.cagr.p50.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right">{mcResult.cagr.p75.toFixed(2)}%</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">+{mcResult.cagr.p95.toFixed(2)}%</td>
                </tr>
              )}
              {mcResult.sharpeRatio && (
                <tr>
                  <td className="py-2.5 px-3 font-sans font-medium text-graphite">Simulated Sharpe (Rf = 4%)</td>
                  <td className="py-2.5 px-3 text-right text-rose-700">{mcResult.sharpeRatio.p05.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right">{mcResult.sharpeRatio.p25.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-graphite">{mcResult.sharpeRatio.p50.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right">{mcResult.sharpeRatio.p75.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">{mcResult.sharpeRatio.p95.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tail Risk & Loss Frequencies Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-3.5 rounded border border-border bg-[#FAF8F4]">
          <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wide block">
            Fraction Below Initial Capital
          </span>
          <div className="mt-1 text-lg font-bold font-mono text-graphite">
            {mcResult.riskMetrics.lossFrequencyPct.toFixed(1)}%
          </div>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            {Math.round(mcResult.riskMetrics.lossFrequency * simCount).toLocaleString()} of {simCount.toLocaleString()} simulated paths
          </span>
        </div>

        <div className="p-3.5 rounded border border-border bg-[#FAF8F4]">
          <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wide block">
            Severe Drawdown (MDD ≤ -20%)
          </span>
          <div className="mt-1 text-lg font-bold font-mono text-rose-700">
            {mcResult.riskMetrics.drawdownExceedance20Pct.toFixed(1)}%
          </div>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            Paths breaching 20% peak-to-trough decline
          </span>
        </div>

        <div className="p-3.5 rounded border border-border bg-[#FAF8F4]">
          <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wide block">
            Simulated 1-Day VaR95 / CVaR95
          </span>
          <div className="mt-1 text-base font-bold font-mono text-graphite">
            {mcResult.riskMetrics.oneDaySimulatedVaR95.toFixed(2)}% / {mcResult.riskMetrics.oneDaySimulatedCVaR95.toFixed(2)}%
          </div>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            Positive loss convention (L = -R)
          </span>
        </div>

        <div className="p-3.5 rounded border border-border bg-[#FAF8F4]">
          <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wide block">
            Horizon VaR95 / CVaR95
          </span>
          <div className="mt-1 text-base font-bold font-mono text-graphite">
            {mcResult.riskMetrics.horizonSimulatedVaR95.toFixed(2)}% / {mcResult.riskMetrics.horizonSimulatedCVaR95.toFixed(2)}%
          </div>
          <span className="text-[10px] text-graphite-400 mt-1 block">
            Over {horizonDays}-day forward horizon
          </span>
        </div>
      </div>

      {/* Historical vs Monte Carlo Reconciliation Contract */}
      <div>
        <div className="text-xs font-bold text-graphite uppercase tracking-wide mb-2 flex items-center justify-between">
          <span>Realized Historical Backtest vs. Monte Carlo Distribution</span>
          <span className="text-[10px] font-mono text-graphite-400 font-normal">
            Option B: 1,825 Synchronized Daily Observations
          </span>
        </div>
        <div className="border border-border rounded overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-[#FAF8F4] border-b border-border text-[10px] text-graphite-400 uppercase">
                <th className="py-2.5 px-3 text-left">Metric</th>
                <th className="py-2.5 px-3 text-right">Historical Backtest</th>
                <th className="py-2.5 px-3 text-right">Simulation Median (P50)</th>
                <th className="py-2.5 px-3 text-right text-rose-700">P05 Downside</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">P95 Upside</th>
                <th className="py-2.5 px-3 text-left pl-6 font-sans">Quantitative Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {comparisons.map((c, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 px-3 font-sans font-medium text-graphite">{c.metricName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-graphite">
                    {c.metricName.includes('$') ? `$${c.historicalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `${c.historicalValue}%`}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#B40023] font-bold">
                    {c.metricName.includes('$') ? `$${c.monteCarloMedian.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `${c.monteCarloMedian}%`}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700">
                    {c.metricName.includes('$') ? `$${c.monteCarloP05.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `${c.monteCarloP05}%`}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700">
                    {c.metricName.includes('$') ? `$${c.monteCarloP95.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `+${c.monteCarloP95}%`}
                  </td>
                  <td className="py-2.5 px-3 pl-6 font-sans text-graphite-400 text-[11px]">{c.interpretation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provenance & Audit Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-[10px] font-mono text-graphite-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={12} className="text-emerald-700" />
          <span>Audit Fingerprint: {mcResult.fingerprint}</span>
          <span>•</span>
          <span>Observation Base: 1,825 Synchronized Daily Observations</span>
        </div>
        <div>
          <span>Deterministic PRNG: Mulberry32 • Seed #{seed} • {mcResult.executionDurationMs}ms</span>
        </div>
      </div>
    </div>
  );
}
