/**
 * BLACKBOX X — Cross-Asset Correlation
 */

import { Asset, PricePoint } from './data';
import { computeReturns } from './metrics';

export type CorrelationMatrix = Record<Asset, Record<Asset, number>>;

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  if (denA === 0 || denB === 0) return 0;
  return parseFloat((num / Math.sqrt(denA * denB)).toFixed(3));
}

export function computeCorrelationMatrix(
  priceData: Record<Asset, PricePoint[]>
): CorrelationMatrix {
  const assets: Asset[] = ['GOLD', 'BTC', 'NVDA'];
  const returnsMap: Record<Asset, number[]> = {
    GOLD: computeReturns(priceData.GOLD),
    BTC: computeReturns(priceData.BTC),
    NVDA: computeReturns(priceData.NVDA),
  };

  const matrix: Partial<CorrelationMatrix> = {};
  for (const a of assets) {
    matrix[a] = {} as Record<Asset, number>;
    for (const b of assets) {
      matrix[a]![b] = a === b ? 1 : pearsonCorrelation(returnsMap[a], returnsMap[b]);
    }
  }
  return matrix as CorrelationMatrix;
}

export function computeRollingCorrelation(
  pricesA: PricePoint[],
  pricesB: PricePoint[],
  window = 60
): { date: string; value: number }[] {
  const rA = computeReturns(pricesA);
  const rB = computeReturns(pricesB);
  const results: { date: string; value: number }[] = [];
  const len = Math.min(rA.length, rB.length);
  for (let i = window; i < len; i++) {
    results.push({
      date: pricesA[i + 1]?.date ?? '',
      value: pearsonCorrelation(rA.slice(i - window, i), rB.slice(i - window, i)),
    });
  }
  return results;
}
