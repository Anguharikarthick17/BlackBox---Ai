/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Backtesting & Rebalancing View
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Play, RotateCcw, DollarSign, ArrowUpRight, Scale } from 'lucide-react';
import {
  PortfolioWeights,
  RebalanceFrequency,
} from '../../../core/portfolio/portfolioTypes';
import { runPortfolioBacktest } from '../../../core/portfolio/portfolioBacktest';

interface PortfolioBacktestViewProps {
  weights: PortfolioWeights;
}

export function PortfolioBacktestView({ weights }: PortfolioBacktestViewProps) {
  const [rebalanceFrequency, setRebalanceFrequency] =
    useState<RebalanceFrequency>('MONTHLY');
  const [initialCapital, setInitialCapital] = useState<number>(100000);

  const backtest = useMemo(
    () =>
      runPortfolioBacktest({
        weights,
        initialCapital,
        rebalanceFrequency,
        transactionFee: 0.001, // 10 bps
      }),
    [weights, initialCapital, rebalanceFrequency]
  );

  // Subsample equity curve for smooth rendering
  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(backtest.dates.length / 100));
    const sampled = [];
    for (let i = 0; i < backtest.dates.length; i += step) {
      sampled.push({
        date: backtest.dates[i],
        equity: backtest.equity[i],
        drawdown: backtest.drawdowns[i],
      });
    }
    // ensure last point is included
    if (sampled[sampled.length - 1].date !== backtest.dates[backtest.dates.length - 1]) {
      sampled.push({
        date: backtest.dates[backtest.dates.length - 1],
        equity: backtest.equity[backtest.equity.length - 1],
        drawdown: backtest.drawdowns[backtest.drawdowns.length - 1],
      });
    }
    return sampled;
  }, [backtest]);

  const frequencies: { id: RebalanceFrequency; label: string }[] = [
    { id: 'DAILY', label: 'Daily' },
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'QUARTERLY', label: 'Quarterly' },
    { id: 'THRESHOLD', label: 'Drift ±5%' },
    { id: 'BUY_AND_HOLD', label: 'Buy & Hold' },
  ];

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Scale size={15} className="text-graphite" />
          <h3 className="text-xs font-semibold text-graphite uppercase tracking-wider">
            Portfolio Historical Backtest & Turnover Friction (10 bps)
          </h3>
        </div>

        {/* Schedule Selector */}
        <div className="flex items-center gap-1 bg-ivory-100 p-1 rounded-md border border-border">
          {frequencies.map(f => (
            <button
              key={f.id}
              onClick={() => setRebalanceFrequency(f.id)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                rebalanceFrequency === f.id
                  ? 'bg-graphite text-white'
                  : 'text-graphite-400 hover:text-graphite'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Equity Trajectory Chart */}
      <div className="h-56 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A1917" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#1A1917" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#888' }}
              tickFormatter={d => d.slice(0, 7)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#888' }}
              domain={['auto', 'auto']}
              tickFormatter={val => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-graphite text-white text-[11px] p-2 rounded shadow font-mono">
                      <div>Date: {data.date}</div>
                      <div className="text-emerald-400 font-bold">
                        Equity: ${data.equity.toLocaleString()}
                      </div>
                      <div className="text-rose-400">Drawdown: {data.drawdown}%</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="#1A1917"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#equityGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Friction & Trade Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Ending Capital
          </span>
          <span className="text-sm font-bold text-graphite">
            ${backtest.endingCapital.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">
            +{backtest.totalReturn.toFixed(2)}% Total
          </span>
        </div>

        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Sharpe / Drawdown
          </span>
          <span className="text-sm font-bold text-graphite">{backtest.sharpeRatio.toFixed(2)}</span>
          <span className="text-[10px] text-rose-600 block mt-0.5">
            Max DD: {backtest.maxDrawdown.toFixed(2)}%
          </span>
        </div>

        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Turnover Traded
          </span>
          <span className="text-sm font-bold text-graphite">
            ${backtest.turnover.toLocaleString()}
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">
            {backtest.rebalanceCount} rebalance events
          </span>
        </div>

        <div className="bg-ivory-50 border border-border/70 rounded p-2.5">
          <span className="text-[10px] text-graphite-400 block font-sans uppercase tracking-wider">
            Transaction Friction
          </span>
          <span className="text-sm font-bold text-graphite">
            ${backtest.transactionCosts.toFixed(2)}
          </span>
          <span className="text-[10px] text-graphite-400 block mt-0.5">
            10 bps fee model
          </span>
        </div>
      </div>
    </div>
  );
}
