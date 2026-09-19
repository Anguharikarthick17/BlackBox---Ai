/**
 * BLACKBOX X — Phase 3.7
 * Portfolio Metrics & Provenance Display
 */

import React from 'react';
import { Shield, TrendingUp, Activity, BarChart2, AlertTriangle, Calendar, Info } from 'lucide-react';
import { PortfolioMetrics } from '../../../core/portfolio/portfolioTypes';

interface PortfolioMetricsViewProps {
  metrics: PortfolioMetrics;
}

export function PortfolioMetricsView({ metrics }: PortfolioMetricsViewProps) {
  const cards = [
    {
      label: 'Total Return',
      value: `${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`,
      sub: 'Cumulative period compounding',
      positive: metrics.totalReturn >= 0,
      icon: TrendingUp,
    },
    {
      label: 'Annualized Return (CAGR)',
      value: `${metrics.cagr >= 0 ? '+' : ''}${metrics.cagr.toFixed(2)}%`,
      sub: '252 trading days / year',
      positive: metrics.cagr >= 0,
      icon: TrendingUp,
    },
    {
      label: 'Annualized Volatility',
      value: `${metrics.annualizedVolatility.toFixed(2)}%`,
      sub: 'Covariance quadratic form wᵀΣw',
      positive: false,
      neutral: true,
      icon: Activity,
    },
    {
      label: 'Sharpe Ratio',
      value: metrics.sharpeRatio.toFixed(2),
      sub: 'Rf = 4.0% annualized benchmark',
      positive: metrics.sharpeRatio > 1.0,
      neutral: metrics.sharpeRatio >= 0 && metrics.sharpeRatio <= 1.0,
      icon: BarChart2,
    },
    {
      label: 'Max Drawdown',
      value: `${metrics.maxDrawdown.toFixed(2)}%`,
      sub: 'Peak-to-trough equity loss',
      negative: true,
      icon: AlertTriangle,
    },
    {
      label: 'Calmar Ratio',
      value: metrics.calmarRatio.toFixed(2),
      sub: 'CAGR / |Max Drawdown|',
      positive: metrics.calmarRatio > 1.0,
      neutral: true,
      icon: Shield,
    },
    {
      label: 'Historical VaR (95% / 99%)',
      value: `${metrics.var95.toFixed(2)}% / ${metrics.var99.toFixed(2)}%`,
      sub: 'Positive loss magnitude (1-day)',
      negative: true,
      icon: AlertTriangle,
    },
    {
      label: 'Historical CVaR (95% / 99%)',
      value: `${metrics.cvar95.toFixed(2)}% / ${metrics.cvar99.toFixed(2)}%`,
      sub: 'Expected Shortfall tail loss',
      negative: true,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-3">
      {/* 8 Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-border rounded-lg p-3.5 shadow-subtle flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-graphite-400 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {card.label}
                </span>
                <Icon size={12} />
              </div>
              <div
                className={`text-lg font-mono font-bold ${
                  card.positive
                    ? 'text-emerald-600'
                    : card.negative
                    ? 'text-rose-600'
                    : 'text-graphite'
                }`}
              >
                {card.value}
              </div>
              <span className="text-[10px] text-graphite-400 mt-1">{card.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Data Provenance & Calendar Synchronization Bar */}
      <div className="bg-ivory-100 border border-border rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-graphite-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-graphite-400" />
            <span className="font-mono text-[11px]">
              {metrics.startDate} → {metrics.endDate} ({metrics.observationCount} synchronized daily observations)
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Info size={13} className="text-graphite-400" />
            <span className="text-[11px] text-graphite-500">
              Offline simulated common daily calendar (contemporaneous daily observations across all assets without forward-fill)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-border text-graphite-500">
            {metrics.dataSourceLabel} DATASET
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-border text-graphite-500">
            Rf = 4.0%
          </span>
        </div>
      </div>
    </div>
  );
}
