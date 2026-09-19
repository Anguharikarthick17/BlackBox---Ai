import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Settings2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS, Asset, getDataInRange } from '../../core/data';
import { STRATEGY_LABELS, STRATEGY_DESCRIPTIONS, StrategyType, DEFAULT_PARAMS } from '../../core/strategies';
import { BacktestChart, SignalsChart } from '../charts/Charts';

const STRATEGIES: StrategyType[] = ['SMA_CROSSOVER', 'EMA_TREND', 'MOMENTUM', 'MEAN_REVERSION'];
const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

function NumberTransition({ value, prefix = '', suffix = '', decimals = 2 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="font-mono"
    >
      {prefix}{value.toFixed(decimals)}{suffix}
    </motion.span>
  );
}

function MetricResult({ label, value, positive, format = 'pct', big = false }: {
  label: string; value: number; positive?: boolean; format?: 'pct' | 'ratio' | 'currency' | 'count'; big?: boolean;
}) {
  const formatted = format === 'pct' ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
    : format === 'ratio' ? value.toFixed(2)
    : format === 'currency' ? `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    : `${Math.round(value)}`;

  const colorClass = positive === true ? 'text-emerald-600'
    : positive === false ? 'text-red-500'
    : 'text-graphite';

  return (
    <div className="metric-surface">
      <span className="metric-label">{label}</span>
      <div className={`${big ? 'metric-value text-2xl' : 'text-lg font-light tabular-nums'} mt-1 ${colorClass}`}>
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {formatted}
        </motion.span>
      </div>
    </div>
  );
}

export function StrategyLab() {
  const {
    selectedAsset, setAsset,
    selectedStrategy, setStrategy,
    strategyParams, setStrategyParams,
    initialCapital, setCapital,
    positionSizePct, setPositionSize,
    transactionCostPct, setTransactionCost,
    startDate, endDate, setDateRange,
    backtestResult, isBacktesting,
    runBacktest: runBacktestAction,
  } = useResearchStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeChart, setActiveChart] = useState<'equity' | 'signals'>('equity');

  const prices = useMemo(() => getDataInRange(selectedAsset, startDate, endDate), [selectedAsset, startDate, endDate]);
  const params = strategyParams;
  const strategyColor = ASSET_COLORS[selectedAsset];

  const narrativeSummary = useMemo(() => {
    if (!backtestResult) return null;
    const { startCapital, endCapital, numTrades, totalReturn, buyHoldReturn } = backtestResult;
    const beat = totalReturn > buyHoldReturn;
    return {
      headline: `Your strategy transformed $${startCapital.toLocaleString()} into $${endCapital.toLocaleString()} across ${numTrades} historical trades.`,
      verdict: beat
        ? `The ${STRATEGY_LABELS[selectedStrategy]} strategy outperformed Buy & Hold by ${(totalReturn - buyHoldReturn).toFixed(2)}%.`
        : `The ${STRATEGY_LABELS[selectedStrategy]} strategy underperformed Buy & Hold by ${(buyHoldReturn - totalReturn).toFixed(2)}%.`,
      beat,
    };
  }, [backtestResult, selectedStrategy]);

  return (
    <section className="space-y-8">
      <div>
        <p className="section-label">04 — Strategy Lab</p>
        <h2 className="editorial-md text-2xl mt-1">Strategy Research</h2>
        <p className="body-sm mt-1 max-w-lg">
          Configure a trading strategy and run a historical backtest. See how it performs against a simple Buy &amp; Hold.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-5">
          <div className="research-card space-y-5">
            {/* Asset */}
            <div>
              <label className="section-label block mb-2">Asset</label>
              <div className="grid grid-cols-3 gap-2">
                {ASSETS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAsset(a)}
                    className={`asset-chip justify-center ${selectedAsset === a ? 'asset-chip-active' : 'asset-chip-inactive'}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[a] }} />
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy */}
            <div>
              <label className="section-label block mb-2">Strategy</label>
              <select
                value={selectedStrategy}
                onChange={e => setStrategy(e.target.value as StrategyType)}
                className="research-select"
              >
                {STRATEGIES.map(s => (
                  <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>
                ))}
              </select>
              <p className="text-xs text-graphite-400 mt-1.5">{STRATEGY_DESCRIPTIONS[selectedStrategy]}</p>
            </div>

            {/* Strategy parameters */}
            <div>
              <label className="section-label block mb-2">Parameters</label>
              <div className="space-y-3">
                {(selectedStrategy === 'SMA_CROSSOVER' || selectedStrategy === 'EMA_TREND') && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-graphite-400">Short Period</span>
                        <span className="text-xs font-mono text-graphite">{params.shortPeriod ?? 20}</span>
                      </div>
                      <input
                        type="range" min="5" max="50" step="1"
                        value={params.shortPeriod ?? 20}
                        onChange={e => setStrategyParams({ shortPeriod: Number(e.target.value) })}
                        className="w-full accent-accent"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-graphite-400">Long Period</span>
                        <span className="text-xs font-mono text-graphite">{params.longPeriod ?? 50}</span>
                      </div>
                      <input
                        type="range" min="20" max="200" step="5"
                        value={params.longPeriod ?? 50}
                        onChange={e => setStrategyParams({ longPeriod: Number(e.target.value) })}
                        className="w-full accent-accent"
                      />
                    </div>
                  </>
                )}
                {selectedStrategy === 'MOMENTUM' && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-graphite-400">Lookback Period</span>
                      <span className="text-xs font-mono text-graphite">{params.lookback ?? 20} days</span>
                    </div>
                    <input
                      type="range" min="5" max="60" step="1"
                      value={params.lookback ?? 20}
                      onChange={e => setStrategyParams({ lookback: Number(e.target.value) })}
                      className="w-full accent-accent"
                    />
                  </div>
                )}
                {selectedStrategy === 'MEAN_REVERSION' && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-graphite-400">MA Period</span>
                        <span className="text-xs font-mono text-graphite">{params.maPeriod ?? 20}</span>
                      </div>
                      <input
                        type="range" min="5" max="50" step="1"
                        value={params.maPeriod ?? 20}
                        onChange={e => setStrategyParams({ maPeriod: Number(e.target.value) })}
                        className="w-full accent-accent"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-graphite-400">Z-Score Threshold</span>
                        <span className="text-xs font-mono text-graphite">{(params.threshold ?? 1.5).toFixed(1)}σ</span>
                      </div>
                      <input
                        type="range" min="0.5" max="3.0" step="0.1"
                        value={params.threshold ?? 1.5}
                        onChange={e => setStrategyParams({ threshold: Number(e.target.value) })}
                        className="w-full accent-accent"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Capital */}
            <div>
              <label className="section-label block mb-2">Initial Capital</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400 text-sm">$</span>
                <input
                  type="number" min="1000" max="10000000" step="1000"
                  value={initialCapital}
                  onChange={e => setCapital(Number(e.target.value))}
                  className="research-input !pl-7"
                />
              </div>
            </div>

            {/* Advanced settings */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs text-graphite-400 hover:text-graphite transition-colors w-full"
            >
              <Settings2 size={12} />
              Advanced Settings
              {showAdvanced ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-graphite-400">Position Size</span>
                      <span className="text-xs font-mono text-graphite">{(positionSizePct * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0.1" max="1" step="0.05"
                      value={positionSizePct}
                      onChange={e => setPositionSize(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-graphite-400">Transaction Cost</span>
                      <span className="text-xs font-mono text-graphite">{(transactionCostPct * 100).toFixed(2)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="0.01" step="0.0005"
                      value={transactionCostPct}
                      onChange={e => setTransactionCost(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="section-label block mb-1.5">From</label>
                      <input type="date" value={startDate} min="2019-01-01" max="2023-12-31"
                        onChange={e => setDateRange(e.target.value, endDate)}
                        className="research-input text-xs" />
                    </div>
                    <div>
                      <label className="section-label block mb-1.5">To</label>
                      <input type="date" value={endDate} min="2019-01-01" max="2023-12-31"
                        onChange={e => setDateRange(startDate, e.target.value)}
                        className="research-input text-xs" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Run button */}
            <motion.button
              onClick={runBacktestAction}
              disabled={isBacktesting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-accent w-full justify-center text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBacktesting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Running Backtest…
                </>
              ) : (
                <>
                  <Play size={16} />
                  RUN BACKTEST
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {backtestResult ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Narrative */}
                {narrativeSummary && (
                  <div className="research-card border-l-2" style={{ borderLeftColor: strategyColor }}>
                    <p className="section-label mb-2">Research Finding</p>
                    <p className="text-base text-graphite leading-relaxed">{narrativeSummary.headline}</p>
                    <p className={`text-sm mt-2 font-medium ${narrativeSummary.beat ? 'text-emerald-600' : 'text-red-500'}`}>
                      {narrativeSummary.verdict}
                    </p>
                  </div>
                )}

                {/* Chart with tabs */}
                <div className="research-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveChart('equity')}
                        className={`px-2.5 py-1 text-xs rounded transition-colors ${
                          activeChart === 'equity'
                            ? 'bg-graphite text-white font-medium'
                            : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
                        }`}
                      >
                        Equity Curve
                      </button>
                      <button
                        onClick={() => setActiveChart('signals')}
                        className={`px-2.5 py-1 text-xs rounded transition-colors ${
                          activeChart === 'signals'
                            ? 'bg-graphite text-white font-medium'
                            : 'text-graphite-400 hover:text-graphite hover:bg-ivory-200'
                        }`}
                      >
                        Signals &amp; Indicators
                      </button>
                    </div>

                    {activeChart === 'equity' ? (
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-0.5 bg-accent inline-block" />
                          Strategy
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-0.5 bg-graphite-400 inline-block border-dashed" style={{ borderTop: '1px dashed' }} />
                          Buy &amp; Hold
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-xs text-graphite-400">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">▲ Entry</span>
                        <span className="flex items-center gap-1 text-red-500 font-medium">▼ Exit</span>
                      </div>
                    )}
                  </div>

                  {activeChart === 'equity' ? (
                    <BacktestChart
                      strategyEquity={backtestResult.strategyEquity}
                      buyHoldEquity={backtestResult.buyHoldEquity}
                      height={230}
                    />
                  ) : (
                    <SignalsChart
                      prices={prices}
                      signals={backtestResult.signalSeries}
                      shortPeriod={params.shortPeriod ?? 20}
                      longPeriod={params.longPeriod ?? 50}
                      color={strategyColor}
                      height={230}
                    />
                  )}
                </div>

                {/* Benchmark Comparison Table: Strategy vs. Buy & Hold */}
                <div className="research-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="section-label">Benchmark Comparison — Strategy vs Buy &amp; Hold</p>
                    <span className="text-[11px] text-graphite-400 font-mono">Normalized to ${backtestResult.startCapital.toLocaleString()}</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left text-graphite-400">
                          <th className="pb-2 font-medium">Metric</th>
                          <th className="pb-2 text-right font-medium">Strategy</th>
                          <th className="pb-2 text-right font-medium">Buy &amp; Hold</th>
                          <th className="pb-2 text-right font-medium">Delta / Alpha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-light font-mono">
                        <tr>
                          <td className="py-2 text-graphite font-sans">Total Return</td>
                          <td className={`py-2 text-right font-medium ${backtestResult.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {backtestResult.totalReturn > 0 ? '+' : ''}{backtestResult.totalReturn.toFixed(2)}%
                          </td>
                          <td className={`py-2 text-right ${backtestResult.buyHoldReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {backtestResult.buyHoldReturn > 0 ? '+' : ''}{backtestResult.buyHoldReturn.toFixed(2)}%
                          </td>
                          <td className={`py-2 text-right font-medium ${backtestResult.totalReturn >= backtestResult.buyHoldReturn ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(backtestResult.totalReturn - backtestResult.buyHoldReturn) > 0 ? '+' : ''}
                            {(backtestResult.totalReturn - backtestResult.buyHoldReturn).toFixed(2)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-graphite font-sans">Annualized Return</td>
                          <td className={`py-2 text-right ${backtestResult.annualizedReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {backtestResult.annualizedReturn > 0 ? '+' : ''}{backtestResult.annualizedReturn.toFixed(2)}%
                          </td>
                          <td className={`py-2 text-right ${backtestResult.buyHoldAnnualizedReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {backtestResult.buyHoldAnnualizedReturn > 0 ? '+' : ''}{backtestResult.buyHoldAnnualizedReturn.toFixed(2)}%
                          </td>
                          <td className={`py-2 text-right ${backtestResult.annualizedReturn >= backtestResult.buyHoldAnnualizedReturn ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(backtestResult.annualizedReturn - backtestResult.buyHoldAnnualizedReturn) > 0 ? '+' : ''}
                            {(backtestResult.annualizedReturn - backtestResult.buyHoldAnnualizedReturn).toFixed(2)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-graphite font-sans">Annualized Volatility (1σ)</td>
                          <td className="py-2 text-right text-graphite">{backtestResult.volatility.toFixed(2)}%</td>
                          <td className="py-2 text-right text-graphite-400">{backtestResult.buyHoldVolatility.toFixed(2)}%</td>
                          <td className={`py-2 text-right ${backtestResult.volatility <= backtestResult.buyHoldVolatility ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {(backtestResult.volatility - backtestResult.buyHoldVolatility).toFixed(2)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-graphite font-sans">Sharpe Ratio (rf=4%)</td>
                          <td className={`py-2 text-right font-medium ${backtestResult.sharpeRatio >= 1 ? 'text-emerald-600' : 'text-graphite'}`}>
                            {backtestResult.sharpeRatio.toFixed(2)}
                          </td>
                          <td className="py-2 text-right text-graphite-400">{backtestResult.buyHoldSharpe.toFixed(2)}</td>
                          <td className={`py-2 text-right font-medium ${(backtestResult.sharpeRatio - backtestResult.buyHoldSharpe) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(backtestResult.sharpeRatio - backtestResult.buyHoldSharpe) > 0 ? '+' : ''}
                            {(backtestResult.sharpeRatio - backtestResult.buyHoldSharpe).toFixed(2)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-graphite font-sans">Maximum Drawdown</td>
                          <td className="py-2 text-right text-red-500">{backtestResult.maxDrawdown.toFixed(2)}%</td>
                          <td className="py-2 text-right text-red-400">{backtestResult.buyHoldMaxDrawdown.toFixed(2)}%</td>
                          <td className={`py-2 text-right ${backtestResult.maxDrawdown >= backtestResult.buyHoldMaxDrawdown ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(backtestResult.maxDrawdown - backtestResult.buyHoldMaxDrawdown) > 0 ? '+' : ''}
                            {(backtestResult.maxDrawdown - backtestResult.buyHoldMaxDrawdown).toFixed(2)}%
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-graphite font-sans">Ending Capital</td>
                          <td className="py-2 text-right font-medium text-graphite">${backtestResult.endCapital.toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
                          <td className="py-2 text-right text-graphite-400">${backtestResult.buyHoldEndCapital.toLocaleString('en-US', { minimumFractionDigits: 0 })}</td>
                          <td className={`py-2 text-right font-medium ${backtestResult.endCapital >= backtestResult.buyHoldEndCapital ? 'text-emerald-600' : 'text-red-500'}`}>
                            {(backtestResult.endCapital - backtestResult.buyHoldEndCapital) > 0 ? '+$' : '-$'}
                            {Math.abs(backtestResult.endCapital - backtestResult.buyHoldEndCapital).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Execution discipline note */}
                  <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between text-[11px] text-graphite-400">
                    <span>Execution: Next-bar close execution (zero look-ahead bias)</span>
                    <span>Cost Model: {(transactionCostPct * 100).toFixed(2)}% per trade</span>
                  </div>
                </div>

                {/* Key execution stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricResult label="No. of Trades" value={backtestResult.numTrades} format="count" />
                  <MetricResult label="Win Rate" value={backtestResult.winRate} positive={backtestResult.winRate >= 50} format="pct" />
                  <MetricResult label="Best Trade" value={backtestResult.bestTrade} positive={true} format="pct" />
                  <MetricResult label="Worst Trade" value={backtestResult.worstTrade} positive={false} format="pct" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="research-card border-dashed flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-accent-muted flex items-center justify-center mb-4">
                  <Play size={20} className="text-accent" />
                </div>
                <p className="text-sm font-medium text-graphite mb-1">Configure your strategy</p>
                <p className="text-xs text-graphite-400 max-w-xs">
                  Select an asset, choose a strategy, set your parameters, then click Run Backtest to see results.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
