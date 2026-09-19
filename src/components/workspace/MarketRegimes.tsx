import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wind, BarChart2 } from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { REGIME_LABELS, REGIME_COLORS, RegimeType } from '../../core/regimes';
import { RegimeBarChart } from '../charts/Charts';

const REGIME_ICONS: Record<RegimeType, React.ReactNode> = {
  BULL: <TrendingUp size={16} />,
  BEAR: <TrendingDown size={16} />,
  HIGH_VOL: <Wind size={16} />,
  LOW_VOL: <BarChart2 size={16} />,
};

const REGIME_DESCRIPTIONS: Record<RegimeType, string> = {
  BULL: 'Annualized returns >5%, moderate volatility. Trend-following strategies typically perform well.',
  BEAR: 'Sustained negative momentum. Drawdown protection and defensive positioning are critical.',
  HIGH_VOL: 'Volatility >35% annualized. Mean reversion strategies may overtrade; trend strategies may whipsaw.',
  LOW_VOL: 'Volatility <15% annualized. Low friction environment; most strategies show reduced signal strength.',
};

export function MarketRegimes() {
  const { regimePoints, regimePeriods, regimePerformance, backtestResult } = useResearchStore();

  const regimeSummary = useMemo(() => {
    if (regimePeriods.length === 0) return null;
    const counts: Record<RegimeType, number> = { BULL: 0, BEAR: 0, HIGH_VOL: 0, LOW_VOL: 0 };
    for (const p of regimePeriods) counts[p.regime] += p.durationDays;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([regime, days]) => ({
      regime: regime as RegimeType,
      days,
      pct: total > 0 ? ((days / total) * 100).toFixed(1) : '0',
    }));
  }, [regimePeriods]);

  const hasResults = backtestResult && regimePoints.length > 0;

  return (
    <section className="space-y-8">
      <div>
        <p className="section-label">06 — Market Regimes</p>
        <h2 className="editorial-md text-2xl mt-1">Behaviour Across Market Conditions</h2>
        <p className="body-sm mt-1 max-w-lg">
          Markets cycle through distinct regimes. Understanding how your strategy behaves in each one is essential for robustness.
        </p>
      </div>

      {/* Regime cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['BULL', 'BEAR', 'HIGH_VOL', 'LOW_VOL'] as RegimeType[]).map((regime, i) => {
          const color = REGIME_COLORS[regime];
          const summary = regimeSummary?.find(s => s.regime === regime);
          const perf = regimePerformance.find(p => p.regime === regime);
          return (
            <motion.div
              key={regime}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="research-card"
              style={{ borderTop: `2px solid ${color}` }}
            >
              <div className="flex items-center gap-2 mb-3" style={{ color }}>
                {REGIME_ICONS[regime]}
                <span className="text-xs font-medium">{REGIME_LABELS[regime]}</span>
              </div>

              {summary && (
                <div className="mb-3">
                  <div className="text-2xl font-light text-graphite tabular-nums">{summary.pct}%</div>
                  <div className="text-xs text-graphite-400">of research period</div>
                  <div className="mt-1.5 h-1.5 bg-ivory-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${summary.pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 + 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-graphite-400 leading-relaxed">{REGIME_DESCRIPTIONS[regime]}</p>

              {perf && hasResults && (
                <div className="mt-3 pt-3 border-t border-border-light">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-graphite-400">Strategy</span>
                    <span className={`font-mono font-medium ${perf.strategyReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {perf.strategyReturn > 0 ? '+' : ''}{perf.strategyReturn}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-graphite-400">Buy &amp; Hold</span>
                    <span className={`font-mono font-medium ${perf.buyHoldReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {perf.buyHoldReturn > 0 ? '+' : ''}{perf.buyHoldReturn}%
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Strategy vs Buy&Hold by regime bar chart */}
      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="research-card"
          >
            <div className="mb-4">
              <p className="section-label">Strategy vs Buy & Hold by Regime</p>
              <p className="text-xs text-graphite-400 mt-0.5">
                Returns attributed to each market regime over the backtested period.
              </p>
            </div>
            <RegimeBarChart data={regimePerformance} height={220} />
          </motion.div>
        )}
      </AnimatePresence>

      {!hasResults && (
        <div className="research-card border-dashed text-center py-12">
          <p className="text-sm text-graphite-400">
            Run a backtest in the Strategy Lab to see regime-specific performance.
          </p>
        </div>
      )}

      {/* Recent regime periods table */}
      {regimePeriods.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="research-card"
        >
          <p className="section-label mb-4">Detected Regime Periods</p>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Regime', 'Start', 'End', 'Duration', 'Avg. Return', 'Avg. Vol'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-graphite-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regimePeriods.slice(0, 12).map((p, i) => {
                  const color = REGIME_COLORS[p.regime];
                  return (
                    <tr key={i} className="border-b border-border-light hover:bg-ivory-200 transition-colors">
                      <td className="py-2 pr-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          {REGIME_LABELS[p.regime]}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-graphite-400">{p.startDate}</td>
                      <td className="py-2 pr-4 font-mono text-graphite-400">{p.endDate}</td>
                      <td className="py-2 pr-4 font-mono text-graphite">{p.durationDays}d</td>
                      <td className={`py-2 pr-4 font-mono ${p.return >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.return > 0 ? '+' : ''}{p.return.toFixed(1)}%
                      </td>
                      <td className="py-2 font-mono text-graphite">{p.volatility.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {regimePeriods.length > 12 && (
              <p className="text-xs text-graphite-400 mt-2">+{regimePeriods.length - 12} more periods</p>
            )}
          </div>
        </motion.div>
      )}
    </section>
  );
}
