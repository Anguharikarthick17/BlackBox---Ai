import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS } from '../../core/data';
import { STRATEGY_LABELS } from '../../core/strategies';
import { RobustnessResult } from '../../core/robustness';

function RobustnessRow({
  result,
  index,
  isBaseline,
}: {
  result: RobustnessResult;
  index: number;
  isBaseline: boolean;
}) {
  const alphaPositive = result.alpha >= 0;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`border-b border-border-light hover:bg-ivory-100 transition-colors ${isBaseline ? 'bg-accent-muted/20' : ''}`}
    >
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          {isBaseline && (
            <span className="text-[10px] font-medium text-accent bg-accent-muted px-1.5 py-0.5 rounded uppercase tracking-wide">
              Baseline
            </span>
          )}
          <span className="text-xs font-medium text-graphite">{result.label}</span>
        </div>
        <div className="text-[11px] text-graphite-400 mt-0.5 font-mono">
          Cost: {(result.transactionCostPct * 100).toFixed(2)}%
          {result.strategyParams.shortPeriod !== undefined && (
            <> · {result.strategyParams.shortPeriod}/{result.strategyParams.longPeriod}</>
          )}
          {result.strategyParams.lookback !== undefined && (
            <> · lb={result.strategyParams.lookback}</>
          )}
          {result.strategyParams.threshold !== undefined && (
            <> · σ={result.strategyParams.threshold}</>
          )}
        </div>
      </td>
      <td className={`py-3 pr-3 text-right font-mono text-xs font-medium ${result.totalReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {result.totalReturn > 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
      </td>
      <td className={`py-3 pr-3 text-right font-mono text-xs ${result.buyHoldReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {result.buyHoldReturn > 0 ? '+' : ''}{result.buyHoldReturn.toFixed(2)}%
      </td>
      <td className={`py-3 pr-3 text-right font-mono text-xs font-medium ${alphaPositive ? 'text-emerald-600' : 'text-red-500'}`}>
        {alphaPositive ? '+' : ''}{result.alpha.toFixed(2)}%
      </td>
      <td className={`py-3 pr-3 text-right font-mono text-xs ${result.sharpeRatio >= 1 ? 'text-graphite' : result.sharpeRatio >= 0 ? 'text-graphite-400' : 'text-red-500'}`}>
        {result.sharpeRatio.toFixed(2)}
      </td>
      <td className="py-3 pr-3 text-right font-mono text-xs text-graphite">
        {result.volatility.toFixed(1)}%
      </td>
      <td className="py-3 pr-3 text-right font-mono text-xs text-red-500">
        {result.maxDrawdown.toFixed(1)}%
      </td>
      <td className="py-3 text-right font-mono text-xs text-graphite-400">
        {result.numTrades}
      </td>
    </motion.tr>
  );
}

function StabilityBadge({ results }: { results: RobustnessResult[] }) {
  if (results.length < 2) return null;

  const returns = results.map(r => r.totalReturn);
  const alphas = results.map(r => r.alpha);
  const sharpes = results.map(r => r.sharpeRatio);

  const returnRange = Math.max(...returns) - Math.min(...returns);
  const allPositiveAlpha = alphas.every(a => a > 0);
  const allPositiveSharpe = sharpes.every(s => s > 0);

  let verdict: string;
  let color: string;
  let badgeColor: string;

  if (returnRange < 15 && allPositiveAlpha && allPositiveSharpe) {
    verdict = 'Stable';
    color = 'text-emerald-700';
    badgeColor = 'bg-emerald-50 border-emerald-200';
  } else if (returnRange < 40 && alphas.filter(a => a > 0).length >= 2) {
    verdict = 'Moderate';
    color = 'text-amber-700';
    badgeColor = 'bg-amber-50 border-amber-200';
  } else {
    verdict = 'Sensitive';
    color = 'text-red-700';
    badgeColor = 'bg-red-50 border-red-200';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium ${badgeColor} ${color}`}>
      <FlaskConical size={12} />
      Robustness: {verdict}
      <span className="text-xs font-normal opacity-70">
        · return range: {returnRange.toFixed(1)}%
      </span>
    </div>
  );
}

export function RobustnessLab() {
  const {
    selectedAsset, selectedStrategy, strategyParams,
    transactionCostPct, startDate, endDate, initialCapital,
    robustnessResults, isRobustnessTesting,
    runRobustness,
    backtestResult,
  } = useResearchStore();

  const hasResults = robustnessResults.length > 0;

  return (
    <section className="space-y-8">
      <div>
        <p className="section-label">05 — Robustness Lab</p>
        <h2 className="editorial-md text-2xl mt-1">Strategy Parameter Stability</h2>
        <p className="body-sm mt-1 max-w-lg">
          Test how strategy results change across different parameter configurations.
          The goal is <strong>stability</strong>, not finding the highest historical return.
        </p>
      </div>

      {/* Context card */}
      <div className="research-card bg-amber-50/60 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-amber-800">Avoid Overfitting</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              A strategy that only works under a very specific parameter set on historical data
              is likely overfitted and may fail on new data. Look for configurations
              where performance is reasonably consistent — not the single best result.
            </p>
          </div>
        </div>
      </div>

      {/* Config summary */}
      <div className="research-card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <p className="section-label">Current Configuration</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-graphite">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[selectedAsset] }} />
                {ASSET_LABELS[selectedAsset]}
              </span>
              <span className="text-graphite-400">·</span>
              <span className="text-xs text-graphite">{STRATEGY_LABELS[selectedStrategy]}</span>
              <span className="text-graphite-400">·</span>
              <span className="text-xs font-mono text-graphite-400">{startDate} → {endDate}</span>
              <span className="text-graphite-400">·</span>
              <span className="text-xs font-mono text-graphite-400">
                Cost: {(transactionCostPct * 100).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-graphite-400 mt-1">
              Will test 4 variants: Baseline · Conservative · Aggressive · High-cost stress test
            </p>
          </div>

          <motion.button
            onClick={runRobustness}
            disabled={isRobustnessTesting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="btn-accent !py-2.5 !px-5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRobustnessTesting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Testing…
              </>
            ) : (
              <>
                <FlaskConical size={14} />
                {hasResults ? 'Re-run Robustness Test' : 'Run Robustness Test'}
              </>
            )}
          </motion.button>
        </div>

        {!backtestResult && !hasResults && (
          <p className="text-xs text-graphite-400 mt-3 border-t border-border-light pt-3">
            Tip: Run a backtest in the Strategy Lab first to set your baseline configuration.
          </p>
        )}
      </div>

      {/* Results table */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="research-card"
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="section-label mb-2">Parameter Comparison</p>
                <StabilityBadge results={robustnessResults} />
              </div>
              <button
                onClick={runRobustness}
                className="flex items-center gap-1.5 text-xs text-graphite-400 hover:text-graphite transition-colors"
              >
                <RefreshCw size={11} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      'Configuration',
                      'Strategy Return',
                      'B&H Return',
                      'Alpha (vs B&H)',
                      'Sharpe',
                      'Volatility',
                      'Max DD',
                      'Trades',
                    ].map(h => (
                      <th key={h} className="py-2 pr-3 text-right text-[11px] font-medium text-graphite-400 first:text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {robustnessResults.map((result, i) => (
                    <RobustnessRow
                      key={result.label}
                      result={result}
                      index={i}
                      isBaseline={i === 0}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interpretation */}
            <div className="mt-5 pt-4 border-t border-border-light space-y-2">
              <p className="section-label">Reading These Results</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {[
                  {
                    label: 'Alpha (vs B&H)',
                    desc: 'Return above Buy & Hold. Positive means the strategy added value over simply holding the asset.',
                    color: 'text-emerald-700',
                  },
                  {
                    label: 'Sharpe Ratio',
                    desc: 'Risk-adjusted return (rf = 4%). Below 0 means the strategy lost money on a risk-adjusted basis.',
                    color: 'text-graphite',
                  },
                  {
                    label: 'Stability Signal',
                    desc: 'If results vary wildly across configs, the strategy may be overfitted to specific parameter values.',
                    color: 'text-amber-700',
                  },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-ivory-100 rounded-md">
                    <p className={`text-xs font-medium ${item.color} mb-1`}>{item.label}</p>
                    <p className="text-xs text-graphite-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasResults && !isRobustnessTesting && (
        <div className="research-card border-dashed text-center py-16">
          <div className="w-12 h-12 rounded-full bg-accent-muted flex items-center justify-center mx-auto mb-4">
            <FlaskConical size={20} className="text-accent" />
          </div>
          <p className="text-sm font-medium text-graphite mb-1">Ready to test</p>
          <p className="text-xs text-graphite-400 max-w-xs mx-auto">
            Click "Run Robustness Test" to compare your current strategy across 4 parameter variants.
          </p>
        </div>
      )}
    </section>
  );
}
