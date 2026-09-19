import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { PRICE_DATA, ASSET_COLORS, ASSET_LABELS, Asset } from '../../core/data';
import { computeMetrics } from '../../core/metrics';
import { PriceChart, NormalizedChart } from '../charts/Charts';

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};

interface MetricPillProps {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

function MetricPill({ label, value, trend, color }: MetricPillProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-graphite-400';
  return (
    <div className="metric-surface flex flex-col gap-1">
      <span className="metric-label">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="metric-value text-2xl" style={color ? { color } : {}}>{value}</span>
        {trend && <TrendIcon size={14} className={trendColor} />}
      </div>
    </div>
  );
}

interface AssetSnapshotProps {
  asset: Asset;
  index: number;
}

function AssetSnapshot({ asset, index }: AssetSnapshotProps) {
  const prices = PRICE_DATA[asset];
  const metrics = useMemo(() => computeMetrics(prices), [prices]);
  const color = ASSET_COLORS[asset];
  const label = ASSET_LABELS[asset];

  const currentPrice = prices[prices.length - 1]?.close ?? 0;
  const prevPrice = prices[prices.length - 2]?.close ?? currentPrice;
  const dailyChange = ((currentPrice - prevPrice) / prevPrice) * 100;

  return (
    <motion.div
      custom={index}
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      className="research-card hover:shadow-elevated transition-shadow duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <div>
            <span className="text-sm font-medium text-graphite">{label}</span>
            <span className="text-xs text-graphite-400 ml-2">{asset === 'GOLD' ? 'XAU/USD' : asset === 'BTC' ? 'BTC/USD' : 'NVDA'}</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium font-mono ${dailyChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {dailyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <span className="text-3xl font-light tabular-nums text-graphite">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Mini chart */}
      <div className="mb-4 -mx-2">
        <PriceChart data={prices.slice(-365)} color={color} label={label} height={110} />
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricPill label="Total Return" value={`${metrics.totalReturn > 0 ? '+' : ''}${metrics.totalReturn}%`} trend={metrics.totalReturn > 0 ? 'up' : 'down'} />
        <MetricPill label="Annualized" value={`${metrics.annualizedReturn > 0 ? '+' : ''}${metrics.annualizedReturn}%`} trend={metrics.annualizedReturn > 0 ? 'up' : 'down'} />
        <MetricPill label="Volatility" value={`${metrics.volatility}%`} />
        <MetricPill label="Max Drawdown" value={`${metrics.maxDrawdown}%`} trend="down" />
      </div>
    </motion.div>
  );
}

export function MarketContext() {
  const { startDate, endDate, setDateRange } = useResearchStore();
  const allPrices = PRICE_DATA;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="section-label"
        >
          01 — Market Context
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="editorial-md text-2xl mt-1"
        >
          Asset Universe Overview
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="body-sm mt-1 max-w-lg"
        >
          Five years of historical price data for Gold, Bitcoin, and NVIDIA. Observe how each asset behaves across different market conditions.
        </motion.p>
      </div>

      {/* Data Source Provenance Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="p-3.5 bg-accent-muted/20 border border-accent-muted rounded-lg flex items-start gap-3 text-xs"
      >
        <span className="text-[10px] font-mono font-medium text-accent bg-white border border-accent/30 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">
          Data Engine
        </span>
        <div className="text-graphite-600 leading-relaxed">
          <span className="font-medium text-graphite">Offline Calibrated Demonstration Dataset (2019–2023):</span>{' '}
          Prices generated via deterministic calibrated random walks matching historical asset drift and volatility characteristics for Gold (XAU), Bitcoin (BTC), and NVIDIA (NVDA). Designed for reproducible research without look-ahead bias or external API dependencies.
        </div>
      </motion.div>

      {/* Date range selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-4 p-4 bg-white rounded-lg border border-border"
      >
        <span className="section-label">Research Period</span>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-graphite-400">From</span>
            <input
              type="date"
              value={startDate}
              min="2019-01-01"
              max="2023-12-31"
              onChange={e => setDateRange(e.target.value, endDate)}
              className="research-input !w-36 !py-1.5 text-xs"
            />
          </div>
          <span className="text-graphite-400">→</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-graphite-400">To</span>
            <input
              type="date"
              value={endDate}
              min="2019-01-01"
              max="2023-12-31"
              onChange={e => setDateRange(startDate, e.target.value)}
              className="research-input !w-36 !py-1.5 text-xs"
            />
          </div>
        </div>
      </motion.div>

      {/* Asset cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['GOLD', 'BTC', 'NVDA'] as Asset[]).map((asset, i) => (
          <AssetSnapshot key={asset} asset={asset} index={i} />
        ))}
      </div>

      {/* Normalized comparison */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="research-card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-label">Normalized Performance</p>
            <p className="text-sm text-graphite mt-0.5">All assets rebased to 100 — compare relative returns directly</p>
          </div>
        </div>
        <NormalizedChart prices={allPrices} height={220} />
        <p className="text-xs text-graphite-400 mt-3 flex items-center gap-1">
          <AlertTriangle size={11} />
          Past performance does not guarantee future results. This is a research tool, not financial advice.
        </p>
      </motion.div>
    </section>
  );
}
