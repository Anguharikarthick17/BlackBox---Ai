import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_COLORS, ASSET_LABELS, Asset, getDataInRange as _getRange } from '../../core/data';
import { computeMetrics, computeRollingVolatility, computeRollingSharpe } from '../../core/metrics';
import { DrawdownChart, RollingVolChart, RollingReturnsChart } from '../charts/Charts';

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
      <span className="text-xs text-graphite-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium font-mono text-graphite">{value}</span>
        {sub && <span className="text-xs text-graphite-400 ml-1">({sub})</span>}
      </div>
    </div>
  );
}

interface AssetMetricsCardProps {
  asset: Asset;
  startDate: string;
  endDate: string;
}

function AssetMetricsCard({ asset, startDate, endDate }: AssetMetricsCardProps) {
  const prices = useMemo(() => _getRange(asset, startDate, endDate), [asset, startDate, endDate]);
  const metrics = useMemo(() => computeMetrics(prices), [prices]);
  const rollingVol = useMemo(() => computeRollingVolatility(prices, 30), [prices]);
  const rollingSharpe = useMemo(() => computeRollingSharpe(prices, 60), [prices]);
  const color = ASSET_COLORS[asset];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="research-card"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-medium text-graphite">{ASSET_LABELS[asset]}</h3>
        <span className="text-xs text-graphite-400 ml-auto font-mono">
          {startDate} → {endDate}
        </span>
      </div>

      {/* Metrics table */}
      <div className="mb-5">
        <StatRow label="Total Return" value={`${metrics.totalReturn > 0 ? '+' : ''}${metrics.totalReturn}%`} />
        <StatRow label="Annualized Return" value={`${metrics.annualizedReturn > 0 ? '+' : ''}${metrics.annualizedReturn}%`} />
        <StatRow label="Annualized Volatility" value={`${metrics.volatility}%`} sub="1σ" />
        <StatRow label="Sharpe Ratio" value={metrics.sharpeRatio.toFixed(2)} sub="rf=4%" />
        <StatRow label="Maximum Drawdown" value={`${metrics.maxDrawdown}%`} />
        <StatRow label="Calmar Ratio" value={metrics.calmarRatio.toFixed(2)} />
        <StatRow label="Start Price" value={`$${metrics.startPrice.toLocaleString()}`} />
        <StatRow label="End Price" value={`$${metrics.endPrice.toLocaleString()}`} />
        <StatRow label="Trading Days" value={metrics.days.toLocaleString()} />
      </div>

      {/* Drawdown chart */}
      <div>
        <p className="section-label mb-2">Drawdown from Peak</p>
        <DrawdownChart data={prices} color={color} height={120} />
      </div>

      {/* Rolling volatility */}
      {rollingVol.length > 0 && (
        <div className="mt-4">
          <p className="section-label mb-2">Rolling 30-Day Volatility (ann.)</p>
          <RollingVolChart data={rollingVol} color={color} height={100} />
        </div>
      )}

      {/* Rolling returns */}
      <div className="mt-4">
        <p className="section-label mb-2">Rolling 20-Day Return</p>
        <RollingReturnsChart prices={prices} window={20} color={color} height={100} />
      </div>
    </motion.div>
  );
}

export function QuantAnalysis() {
  const { startDate, endDate, selectedAsset, setAsset } = useResearchStore();

  return (
    <section className="space-y-8">
      <div>
        <p className="section-label">02 — Quantitative Analysis</p>
        <h2 className="editorial-md text-2xl mt-1">Performance Metrics</h2>
        <p className="body-sm mt-1 max-w-lg">
          Measure return, risk-adjusted performance, and drawdown profiles for each asset over the selected research period.
        </p>
      </div>

      {/* Asset selector tabs */}
      <div className="flex items-center gap-2">
        <span className="section-label mr-2">Asset Focus</span>
        {ASSETS.map(a => (
          <button
            key={a}
            onClick={() => setAsset(a)}
            className={`asset-chip ${selectedAsset === a ? 'asset-chip-active' : 'asset-chip-inactive'}`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[a] }} />
            {ASSET_LABELS[a]}
          </button>
        ))}
        <button
          onClick={() => {}}
          className="ml-auto text-xs text-graphite-400 hover:text-graphite transition-colors"
        >
          View all →
        </button>
      </div>

      {/* Single focused card for selected asset */}
      <AssetMetricsCard asset={selectedAsset} startDate={startDate} endDate={endDate} />

      {/* All three side-by-side key metrics */}
      <div>
        <p className="section-label mb-4">Cross-Asset Comparison</p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {ASSETS.map(asset => {
            const prices = _getRange(asset, startDate, endDate);
            const m = computeMetrics(prices);
            const color = ASSET_COLORS[asset];
            return (
              <div
                key={asset}
                onClick={() => setAsset(asset)}
                className="research-card cursor-pointer hover:shadow-elevated transition-all duration-200 group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-graphite">{ASSET_LABELS[asset]}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Return', value: `${m.totalReturn > 0 ? '+' : ''}${m.totalReturn}%`, positive: m.totalReturn >= 0 },
                    { label: 'Sharpe', value: m.sharpeRatio.toFixed(2), positive: m.sharpeRatio >= 1 },
                    { label: 'Max DD', value: `${m.maxDrawdown}%`, positive: false },
                    { label: 'Volatility', value: `${m.volatility}%`, positive: null },
                  ].map(({ label, value, positive }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-graphite-400">{label}</span>
                      <span className={`text-xs font-mono font-medium ${
                        positive === true ? 'text-emerald-600' :
                        positive === false && label !== 'Volatility' ? 'text-red-500' :
                        'text-graphite'
                      }`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


