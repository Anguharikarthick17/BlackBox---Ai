import React, { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  ComposedChart, Bar,
} from 'recharts';
import { PricePoint } from '../../core/data';
import { normalizedPrices, computeDrawdownSeries, computeRollingReturns } from '../../core/metrics';
import { computeRollingCorrelation } from '../../core/correlations';
import { Signal } from '../../core/strategies';

// Shared chart theme
const CHART_THEME = {
  grid: '#E8E4DC',
  text: '#6B6560',
  accent: '#B40023',
  gold: '#C9A84C',
  btc: '#F7931A',
  nvda: '#76B900',
};

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-md p-3 shadow-elevated text-xs">
      <p className="text-graphite-400 mb-2 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-graphite-400">{entry.name}:</span>
          <span className="text-graphite font-medium font-mono">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const TickStyle = { fill: CHART_THEME.text, fontSize: 10, fontFamily: 'Inter' };

// ── Price Chart ───────────────────────────────────────────────────────────────
interface PriceChartProps {
  data: PricePoint[];
  color?: string;
  label?: string;
  height?: number;
}

export function PriceChart({ data, color = CHART_THEME.accent, label = 'Price', height = 220 }: PriceChartProps) {
  const chartData = useMemo(() =>
    data.filter((_, i) => i % 5 === 0).map(p => ({ date: p.date.slice(0, 7), value: p.close })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.15} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}`} width={50} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />} />
        <Area type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={1.5} fill={`url(#grad-${label})`} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Normalized Chart ──────────────────────────────────────────────────────────
interface NormalizedChartProps {
  prices: { GOLD: PricePoint[]; BTC: PricePoint[]; NVDA: PricePoint[] };
  height?: number;
}

export function NormalizedChart({ prices, height = 240 }: NormalizedChartProps) {
  const chartData = useMemo(() => {
    const gold = normalizedPrices(prices.GOLD).filter((_, i) => i % 5 === 0);
    const btc = normalizedPrices(prices.BTC).filter((_, i) => i % 5 === 0);
    const nvda = normalizedPrices(prices.NVDA).filter((_, i) => i % 5 === 0);
    return gold.map((g, i) => ({
      date: g.date.slice(0, 7),
      GOLD: g.value,
      BTC: btc[i]?.value,
      NVDA: nvda[i]?.value,
    }));
  }, [prices]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}`} width={45} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(1)} (base 100)`} />} />
        <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 10, color: CHART_THEME.text, paddingTop: 8 }} />
        <Line type="monotone" dataKey="GOLD" stroke={CHART_THEME.gold} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="BTC" stroke={CHART_THEME.btc} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="NVDA" stroke={CHART_THEME.nvda} strokeWidth={1.5} dot={false} activeDot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Drawdown Chart ────────────────────────────────────────────────────────────
interface DrawdownChartProps {
  data: PricePoint[];
  color?: string;
  height?: number;
}

export function DrawdownChart({ data, color = CHART_THEME.accent, height = 160 }: DrawdownChartProps) {
  const chartData = useMemo(() =>
    computeDrawdownSeries(data).filter((_, i) => i % 5 === 0),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="dd-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={45} />
        <ReferenceLine y={0} stroke={CHART_THEME.grid} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(2)}%`} />} />
        <Area type="monotone" dataKey="drawdown" name="Drawdown" stroke="#EF4444" strokeWidth={1.5} fill="url(#dd-grad)" dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Backtest Equity Curve Chart ───────────────────────────────────────────────
interface BacktestChartProps {
  strategyEquity: { date: string; value: number }[];
  buyHoldEquity: { date: string; value: number }[];
  height?: number;
}

export function BacktestChart({ strategyEquity, buyHoldEquity, height = 260 }: BacktestChartProps) {
  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(strategyEquity.length / 120));
    return strategyEquity.filter((_, i) => i % step === 0).map((s, i) => ({
      date: s.date.slice(0, 7),
      Strategy: parseFloat(s.value.toFixed(0)),
      'Buy & Hold': parseFloat((buyHoldEquity[i * step]?.value ?? s.value).toFixed(0)),
    }));
  }, [strategyEquity, buyHoldEquity]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={50} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `$${v.toLocaleString()}`} />} />
        <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 10, color: CHART_THEME.text, paddingTop: 8 }} />
        <Line type="monotone" dataKey="Strategy" stroke={CHART_THEME.accent} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="Buy & Hold" stroke={CHART_THEME.text} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Regime Bar Chart ──────────────────────────────────────────────────────────
interface RegimeBarChartProps {
  data: { regime: string; strategyReturn: number; buyHoldReturn: number }[];
  height?: number;
}

export function RegimeBarChart({ data, height = 220 }: RegimeBarChartProps) {
  const colors: Record<string, string> = {
    BULL: '#22C55E', BEAR: '#EF4444', HIGH_VOL: '#F59E0B', LOW_VOL: '#3B82F6',
  };

  const chartData = data.map(d => ({
    name: d.regime === 'HIGH_VOL' ? 'High Vol' : d.regime === 'LOW_VOL' ? 'Low Vol' : d.regime,
    Strategy: d.strategyReturn,
    'Buy & Hold': d.buyHoldReturn,
    fill: colors[d.regime] ?? '#999',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="name" tick={TickStyle} tickLine={false} axisLine={false} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
        <ReferenceLine y={0} stroke={CHART_THEME.grid} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(2)}%`} />} />
        <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 10, color: CHART_THEME.text, paddingTop: 8 }} />
        <Bar dataKey="Strategy" fill={CHART_THEME.accent} radius={[2, 2, 0, 0]} maxBarSize={28} opacity={0.85} />
        <Bar dataKey="Buy & Hold" fill={CHART_THEME.text} radius={[2, 2, 0, 0]} maxBarSize={28} opacity={0.4} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Rolling Volatility Chart ──────────────────────────────────────────────────
interface RollingVolChartProps {
  data: { date: string; value: number }[];
  label?: string;
  color?: string;
  height?: number;
}

export function RollingVolChart({ data, label = 'Rolling Vol', color = CHART_THEME.accent, height = 160 }: RollingVolChartProps) {
  const chartData = useMemo(() => data.filter((_, i) => i % 5 === 0), [data]);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id={`vol-grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={40} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(2)}%`} />} />
        <Area type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={1.5} fill={`url(#vol-grad-${label})`} dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Cumulative Return Chart ───────────────────────────────────────────────────
// Shows (portfolioValue / startValue - 1) × 100 as % — different from equity $ curve
interface CumulativeReturnChartProps {
  strategyEquity: { date: string; value: number }[];
  buyHoldEquity: { date: string; value: number }[];
  height?: number;
}

export function CumulativeReturnChart({ strategyEquity, buyHoldEquity, height = 220 }: CumulativeReturnChartProps) {
  const chartData = useMemo(() => {
    if (strategyEquity.length === 0) return [];
    const startStrat = strategyEquity[0].value;
    const startBH = buyHoldEquity[0]?.value ?? startStrat;
    const step = Math.max(1, Math.floor(strategyEquity.length / 120));
    return strategyEquity
      .filter((_, i) => i % step === 0)
      .map((s, idx) => {
        const bh = buyHoldEquity[idx * step];
        return {
          date: s.date.slice(0, 7),
          Strategy: startStrat > 0 ? parseFloat(((s.value / startStrat - 1) * 100).toFixed(2)) : 0,
          'Buy & Hold': (bh && startBH > 0) ? parseFloat(((bh.value / startBH - 1) * 100).toFixed(2)) : 0,
        };
      });
  }, [strategyEquity, buyHoldEquity]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={50} />
        <ReferenceLine y={0} stroke={CHART_THEME.grid} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`} />} />
        <Legend iconType="line" iconSize={12} wrapperStyle={{ fontSize: 10, color: CHART_THEME.text, paddingTop: 8 }} />
        <Line type="monotone" dataKey="Strategy" stroke={CHART_THEME.accent} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
        <Line type="monotone" dataKey="Buy & Hold" stroke={CHART_THEME.text} strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Rolling Correlation Chart ─────────────────────────────────────────────────
interface RollingCorrelationChartProps {
  pricesA: PricePoint[];
  pricesB: PricePoint[];
  labelA: string;
  labelB: string;
  window?: number;
  height?: number;
}

export function RollingCorrelationChart({
  pricesA, pricesB, labelA, labelB, window = 60, height = 180,
}: RollingCorrelationChartProps) {
  const chartData = useMemo(() => {
    if (pricesA.length < window + 2 || pricesB.length < window + 2) return [];
    const rollingCorr = computeRollingCorrelation(pricesA, pricesB, window);
    return rollingCorr.filter((_, i) => i % 5 === 0).map(d => ({
      date: d.date.slice(0, 7),
      correlation: d.value,
    }));
  }, [pricesA, pricesB, window]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="corr-pos-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} domain={[-1, 1]} tickFormatter={(v) => v.toFixed(1)} width={35} />
        <ReferenceLine y={0} stroke={CHART_THEME.grid} />
        <ReferenceLine y={0.7} stroke="#22C55E" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: '0.7', position: 'right', fontSize: 9, fill: '#22C55E' }} />
        <ReferenceLine y={-0.3} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `ρ = ${v.toFixed(3)}`} />} />
        <Area
          type="monotone"
          dataKey="correlation"
          name={`${labelA} × ${labelB} (${window}d)`}
          stroke="#22C55E"
          strokeWidth={1.5}
          fill="url(#corr-pos-grad)"
          dot={false}
          activeDot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Signals Chart (Price + SMA overlay + Entry/Exit markers) ──────────────────
function computeSMAForChart(prices: PricePoint[], period: number): Map<string, number> {
  const result = new Map<string, number>();
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const avg = slice.reduce((s, p) => s + p.close, 0) / period;
    result.set(prices[i].date, parseFloat(avg.toFixed(2)));
  }
  return result;
}

interface SignalsChartProps {
  prices: PricePoint[];
  signals: { date: string; signal: Signal; entryMarker: boolean; exitMarker: boolean }[];
  shortPeriod?: number;
  longPeriod?: number;
  color?: string;
  height?: number;
}

export function SignalsChart({
  prices, signals, shortPeriod = 20, longPeriod = 50,
  color = CHART_THEME.accent, height = 240,
}: SignalsChartProps) {
  const chartData = useMemo(() => {
    if (prices.length === 0) return [];
    const step = Math.max(1, Math.floor(prices.length / 150));
    const smaShortMap = computeSMAForChart(prices, shortPeriod);
    const smaLongMap = computeSMAForChart(prices, longPeriod);
    const signalMap = new Map(signals.map(s => [s.date, s]));

    return prices
      .filter((_, i) => i % step === 0)
      .map(p => {
        const sig = signalMap.get(p.date);
        return {
          date: p.date.slice(0, 7),
          Price: p.close,
          [`SMA ${shortPeriod}`]: smaShortMap.get(p.date) ?? null,
          [`SMA ${longPeriod}`]: smaLongMap.get(p.date) ?? null,
          'Entry ▲': sig?.entryMarker ? p.close : null,
          'Exit ▼': sig?.exitMarker ? p.close : null,
        };
      });
  }, [prices, signals, shortPeriod, longPeriod]);

  const shortKey = `SMA ${shortPeriod}`;
  const longKey = `SMA ${longPeriod}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 5)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={52} />
        <Tooltip content={<CustomTooltip formatter={(v: number | null) => v !== null ? `$${Number(v).toLocaleString()}` : '—'} />} />
        <Legend iconType="line" iconSize={10} wrapperStyle={{ fontSize: 10, color: CHART_THEME.text, paddingTop: 8 }} />
        <Area type="monotone" dataKey="Price" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.05} dot={false} />
        <Line type="monotone" dataKey={shortKey} stroke="#F59E0B" strokeWidth={1.2} dot={false} strokeDasharray="3 2" connectNulls={false} />
        <Line type="monotone" dataKey={longKey} stroke="#6366F1" strokeWidth={1.2} dot={false} strokeDasharray="5 2" connectNulls={false} />
        <Line type="monotone" dataKey="Entry ▲" stroke="#22C55E" strokeWidth={0} dot={{ r: 4, fill: '#22C55E', strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls={false} />
        <Line type="monotone" dataKey="Exit ▼" stroke="#EF4444" strokeWidth={0} dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ── Rolling Returns Chart ─────────────────────────────────────────────────────
interface RollingReturnsChartProps {
  prices: PricePoint[];
  window?: number;
  color?: string;
  height?: number;
}

export function RollingReturnsChart({ prices, window = 20, color = CHART_THEME.accent, height = 140 }: RollingReturnsChartProps) {
  const chartData = useMemo(() => {
    const data = computeRollingReturns(prices, window);
    return data.filter((_, i) => i % 5 === 0);
  }, [prices, window]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="rr-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="date" tick={TickStyle} tickLine={false} axisLine={false} interval={Math.floor(chartData.length / 4)} />
        <YAxis tick={TickStyle} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}%`} width={45} />
        <ReferenceLine y={0} stroke={CHART_THEME.grid} />
        <Tooltip content={<CustomTooltip formatter={(v: number) => `${v.toFixed(2)}%`} />} />
        <Area type="monotone" dataKey="value" name={`${window}d Rolling Return`} stroke={color} strokeWidth={1.5} fill="url(#rr-grad)" dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
