/**
 * BLACKBOX X — Phase 3.7
 * Efficient Frontier & Capital Allocation Line (CAL) Visualization
 */

import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceDot,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { generateEfficientFrontier } from '../../../core/portfolio/efficientFrontier';
import { PortfolioWeights } from '../../../core/portfolio/portfolioTypes';
import { computePortfolioMetrics } from '../../../core/portfolio/covariance';

interface EfficientFrontierViewProps {
  currentWeights: PortfolioWeights;
}

export function EfficientFrontierView({ currentWeights }: EfficientFrontierViewProps) {
  const frontier = useMemo(() => generateEfficientFrontier(), []);
  const currentMetrics = useMemo(() => computePortfolioMetrics(currentWeights), [currentWeights]);

  // Transform frontier points for Recharts
  const curveData = frontier.points.map(p => ({
    volatility: parseFloat(p.volatility.toFixed(2)),
    expectedReturn: parseFloat(p.achievedReturn.toFixed(2)),
    gold: (p.allocation.GOLD * 100).toFixed(1),
    btc: (p.allocation.BTC * 100).toFixed(1),
    nvda: (p.allocation.NVDA * 100).toFixed(1),
    sharpe: p.sharpeRatio.toFixed(2),
  }));

  const calData = frontier.cal.points.map(p => ({
    volatility: p.volatility,
    calReturn: p.expectedReturn,
  }));

  const currentVol = Number.isFinite(currentMetrics?.annualizedVolatility)
    ? parseFloat(currentMetrics.annualizedVolatility.toFixed(2))
    : 0;
  const currentCagr = Number.isFinite(currentMetrics?.cagr)
    ? parseFloat(currentMetrics.cagr.toFixed(2))
    : 0;

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Deterministic Efficient Frontier & Capital Allocation Line
          </h3>
        </div>
        <span className="text-[10px] font-mono text-graphite-400">
          Feasible Hurdle Range: [{frontier.feasibleRange[0]}% to {frontier.feasibleRange[1]}%]
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <XAxis
              type="number"
              dataKey="volatility"
              name="Volatility"
              unit="%"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#888' }}
              label={{
                value: 'Annualized Volatility (Risk) %',
                position: 'insideBottom',
                offset: -10,
                fontSize: 10,
                fill: '#666',
              }}
            />
            <YAxis
              type="number"
              dataKey="expectedReturn"
              name="Expected Return"
              unit="%"
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#888' }}
              label={{
                value: 'Annualized Return %',
                angle: -90,
                position: 'insideLeft',
                fontSize: 10,
                fill: '#666',
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-graphite text-white text-[11px] p-2 rounded shadow-lg font-mono">
                      <div className="font-semibold text-amber-300">
                        Vol: {data.volatility}% | Return: {data.expectedReturn || data.calReturn}%
                      </div>
                      {data.sharpe && <div>Sharpe: {data.sharpe}</div>}
                      {data.gold && (
                        <div className="text-[10px] text-gray-300 mt-1 pt-1 border-t border-gray-700">
                          Gold: {data.gold}% | BTC: {data.btc}% | NVDA: {data.nvda}%
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Capital Allocation Line */}
            <Line
              data={calData}
              dataKey="calReturn"
              stroke="#D97706"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Capital Allocation Line (Rf=4%)"
            />

            {/* Frontier Scatter Curve */}
            <Scatter
              name="Efficient Frontier (Upper Branch)"
              data={curveData}
              fill="#1A1917"
              line={{ stroke: '#1A1917', strokeWidth: 2 }}
            />

            {/* Reference Dot: Current Portfolio */}
            {Number.isFinite(currentVol) && Number.isFinite(currentCagr) && (
              <ReferenceDot
                x={currentVol}
                y={currentCagr}
                r={6}
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}

            {/* Reference Dot: Tangency / Max Sharpe */}
            <ReferenceDot
              x={parseFloat(frontier.maxSharpePoint.volatility.toFixed(2))}
              y={parseFloat(frontier.maxSharpePoint.achievedReturn.toFixed(2))}
              r={6}
              fill="#D97706"
              stroke="#FFFFFF"
              strokeWidth={2}
            />

            {/* Reference Dot: Global Min Volatility */}
            <ReferenceDot
              x={parseFloat(frontier.minVolPoint.volatility.toFixed(2))}
              y={parseFloat(frontier.minVolPoint.achievedReturn.toFixed(2))}
              r={6}
              fill="#059669"
              stroke="#FFFFFF"
              strokeWidth={2}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Clarification */}
      <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Current Portfolio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Max Sharpe (Tangency)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Global Min Vol
          </span>
          <span className="flex items-center gap-1.5 text-graphite-400">
            <span className="w-4 h-0.5 border-t border-amber-600 border-dashed" /> CAL (Rf=4.0%)
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-graphite-400">
          <Info size={12} />
          <span>{frontier.cal.note}</span>
        </div>
      </div>
    </div>
  );
}
