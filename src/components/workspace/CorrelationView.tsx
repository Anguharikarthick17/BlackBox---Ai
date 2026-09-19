import React from 'react';
import { motion } from 'framer-motion';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS, Asset, PRICE_DATA } from '../../core/data';
import { CorrelationHeatmap, CorrelationBubbles, useCorrelationPairs } from '../charts/CorrelationMatrix';
import { RollingCorrelationChart } from '../charts/Charts';

export function CorrelationView() {
  const { correlationMatrix, initCorrelations, selectedAsset, setAsset } = useResearchStore();

  React.useEffect(() => {
    if (!correlationMatrix) initCorrelations();
  }, [correlationMatrix, initCorrelations]);

  const pairs = useCorrelationPairs(correlationMatrix);
  const [rollA, setRollA] = React.useState<Asset>('BTC');
  const [rollB, setRollB] = React.useState<Asset>('NVDA');
  const [rollWindow, setRollWindow] = React.useState<number>(60);

  const getInsight = (corr: number) => {
    if (Math.abs(corr) < 0.1) return 'Essentially uncorrelated. Portfolio diversification is effective.';
    if (corr > 0.7) return 'Strong positive correlation. Assets tend to move together.';
    if (corr > 0.3) return 'Moderate positive correlation. Some co-movement observed.';
    if (corr < -0.3) return 'Negative correlation. Assets tend to move in opposite directions.';
    return 'Weak correlation. Limited co-movement over this period.';
  };

  return (
    <section className="space-y-8">
      <div>
        <p className="section-label">03 — Correlation</p>
        <h2 className="editorial-md text-2xl mt-1">Cross-Asset Relationships</h2>
        <p className="body-sm mt-1 max-w-lg">
          Pearson correlation of daily returns across the full 5-year dataset. Strong correlations reduce diversification benefits.
        </p>
      </div>

      {correlationMatrix ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="research-card"
            >
              <p className="section-label mb-4">Correlation Matrix</p>
              <CorrelationHeatmap
                matrix={correlationMatrix}
                onPairClick={(a, b) => setAsset(a)}
              />
            </motion.div>

            {/* Bubble bars */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="research-card"
            >
              <p className="section-label mb-4">Pairwise Correlation Strength</p>
              <CorrelationBubbles pairs={pairs} />

              <div className="mt-6 space-y-3">
                {pairs.map(({ a, b, correlation }) => (
                  <div key={`${a}-${b}`} className="p-3 rounded-md bg-ivory-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-graphite">
                        {ASSET_LABELS[a]} × {ASSET_LABELS[b]}
                      </span>
                      <span className={`text-xs font-mono ml-auto ${correlation >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ρ = {correlation > 0 ? '+' : ''}{correlation.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-xs text-graphite-400">{getInsight(correlation)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Interpretation guide */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="research-card bg-accent-muted/30"
          >
            <p className="section-label mb-3">Understanding Correlation</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { range: 'ρ > +0.7', label: 'High Positive', desc: 'Assets move strongly together. Adding both reduces diversification.', color: 'text-emerald-700' },
                { range: '-0.3 to +0.3', label: 'Low Correlation', desc: 'Assets behave independently. Combining improves portfolio stability.', color: 'text-graphite' },
                { range: 'ρ < -0.3', label: 'Negative', desc: 'Assets move in opposite directions. Natural hedge in a portfolio.', color: 'text-red-600' },
              ].map(item => (
                <div key={item.range}>
                  <span className={`text-sm font-mono font-medium ${item.color}`}>{item.range}</span>
                  <p className="text-xs font-medium text-graphite mt-0.5">{item.label}</p>
                  <p className="text-xs text-graphite-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dynamic Rolling Correlation Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="research-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="section-label">Rolling Correlation Dynamics</p>
                <p className="text-sm text-graphite mt-0.5">
                  Track how cross-asset correlation evolves over time across market regimes and stress periods.
                </p>
              </div>

              {/* Pair & window selectors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-ivory-200 px-2 py-1 rounded-md text-xs">
                  <select
                    value={rollA}
                    onChange={(e) => setRollA(e.target.value as Asset)}
                    className="bg-transparent font-medium text-graphite focus:outline-none cursor-pointer"
                  >
                    <option value="GOLD">Gold (XAU)</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="NVDA">NVIDIA (NVDA)</option>
                  </select>
                  <span className="text-graphite-400 font-mono">×</span>
                  <select
                    value={rollB}
                    onChange={(e) => setRollB(e.target.value as Asset)}
                    className="bg-transparent font-medium text-graphite focus:outline-none cursor-pointer"
                  >
                    <option value="GOLD">Gold (XAU)</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="NVDA">NVIDIA (NVDA)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-ivory-200 p-1 rounded-md text-xs">
                  {[30, 60, 90].map((w) => (
                    <button
                      key={w}
                      onClick={() => setRollWindow(w)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        rollWindow === w
                          ? 'bg-graphite text-white font-medium'
                          : 'text-graphite-400 hover:text-graphite'
                      }`}
                    >
                      {w}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <RollingCorrelationChart
              pricesA={PRICE_DATA[rollA]}
              pricesB={PRICE_DATA[rollB]}
              labelA={ASSET_LABELS[rollA]}
              labelB={ASSET_LABELS[rollB]}
              window={rollWindow}
              height={200}
            />
          </motion.div>
        </>
      ) : (
        <div className="research-card text-center py-12">
          <div className="shimmer h-4 rounded mb-2 max-w-xs mx-auto" />
          <div className="shimmer h-4 rounded mb-2 max-w-sm mx-auto" />
          <p className="text-sm text-graphite-400 mt-4">Computing correlations…</p>
        </div>
      )}
    </section>
  );
}
