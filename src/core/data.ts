/**
 * BLACKBOX X — Market Data Engine
 *
 * DATA SOURCE: OFFLINE DEMONSTRATION DATASET
 * All price data is deterministically generated using a seeded random walk.
 * It is NOT real historical market data and has NOT been verified against
 * any financial data provider. Results are for research/demonstration only.
 *
 * Architecture: MarketDataProvider interface allows swapping in a real
 * data provider in future without changing consuming code.
 */

// ─────────────────────────────────────────────
// Data Provider Abstraction
// ─────────────────────────────────────────────

export type DataSourceLabel = 'OFFLINE_DEMO' | 'REAL_HISTORICAL';

export interface MarketDataProvider {
  /** Human-readable label shown in the UI */
  sourceLabel: DataSourceLabel;
  /** Warning text to display to users */
  disclaimer: string;
  /** Full dataset for all assets */
  priceData: Record<Asset, PricePoint[]>;
  /** Filter by date range */
  getDataInRange: (asset: Asset, startDate: string, endDate: string) => PricePoint[];
}

// Active provider — swap this to connect real data
export let activeDataSource: DataSourceLabel = 'OFFLINE_DEMO';
export const DATA_DISCLAIMER =
  'Simulated historical dataset — for offline demonstration only. ' +
  'Not verified real market data. Not financial advice.';

export type Asset = 'GOLD' | 'BTC' | 'NVDA';

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Seeded pseudo-random number generator for determinism
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePriceSeries(
  startPrice: number,
  drift: number,
  volatility: number,
  days: number,
  seed: number,
  minPrice: number,
  maxPrice: number
): number[] {
  const rand = mulberry32(seed);
  const prices: number[] = [startPrice];
  for (let i = 1; i < days; i++) {
    const prev = prices[i - 1];
    const shock = (rand() - 0.5) * 2 * volatility;
    const trend = drift;
    let next = prev * (1 + trend + shock);
    next = Math.max(minPrice, Math.min(maxPrice, next));
    prices.push(next);
  }
  return prices;
}

function buildOHLCV(
  closes: number[],
  startDate: Date,
  seed: number
): PricePoint[] {
  const rand = mulberry32(seed + 9999);
  return closes.map((close, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const spread = close * 0.012;
    const open = close + (rand() - 0.5) * spread;
    const high = Math.max(open, close) + rand() * spread;
    const low = Math.min(open, close) - rand() * spread;
    const volume = Math.floor(1e6 + rand() * 9e6);
    return {
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    };
  });
}

const START_DATE = new Date('2019-01-01');
const DAYS = 1826; // ~5 years

// Gold: starts ~$1280, meanders to ~$1900–$2100 range
const goldCloses = generatePriceSeries(1280, 0.00018, 0.008, DAYS, 42, 1100, 2450);
// Bitcoin: starts ~$3500, massive run to ~$65k then correction
const btcCloses = generatePriceSeries(3500, 0.0008, 0.032, DAYS, 77, 2000, 73000);
// NVIDIA: starts ~$130, grows massively to $900
const nvdaCloses = generatePriceSeries(130, 0.00065, 0.022, DAYS, 113, 80, 1000);

export const PRICE_DATA: Record<Asset, PricePoint[]> = {
  GOLD: buildOHLCV(goldCloses, START_DATE, 42),
  BTC: buildOHLCV(btcCloses, START_DATE, 77),
  NVDA: buildOHLCV(nvdaCloses, START_DATE, 113),
};

export const ASSET_LABELS: Record<Asset, string> = {
  GOLD: 'Gold',
  BTC: 'Bitcoin',
  NVDA: 'NVIDIA',
};

export const ASSET_COLORS: Record<Asset, string> = {
  GOLD: '#C9A84C',
  BTC: '#F7931A',
  NVDA: '#76B900',
};

export const ASSET_SYMBOLS: Record<Asset, string> = {
  GOLD: 'XAU',
  BTC: 'BTC',
  NVDA: 'NVDA',
};

export function getDataInRange(asset: Asset, startDate: string, endDate: string): PricePoint[] {
  return PRICE_DATA[asset].filter(p => p.date >= startDate && p.date <= endDate);
}
