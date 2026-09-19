import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Asset, ASSET_COLORS, ASSET_LABELS } from '../../core/data';
import { CorrelationMatrix } from '../../core/correlations';

interface CorrelationHeatmapProps {
  matrix: CorrelationMatrix;
  onPairClick?: (a: Asset, b: Asset) => void;
}

function getCorrColor(value: number): string {
  const abs = Math.abs(value);
  if (value > 0) {
    const g = Math.round(34 + abs * 160);
    return `rgba(34, ${g}, 94, ${0.1 + abs * 0.55})`;
  } else {
    const r = Math.round(180 + abs * 75);
    return `rgba(${r}, 50, 50, ${0.1 + abs * 0.55})`;
  }
}

function getTextColor(value: number): string {
  const abs = Math.abs(value);
  if (abs === 1) return '#FFFFFF';
  return abs > 0.5 ? '#FFFFFF' : value > 0 ? '#16532C' : '#7F1D1D';
}

const ASSETS: Asset[] = ['GOLD', 'BTC', 'NVDA'];

export function CorrelationHeatmap({ matrix, onPairClick }: CorrelationHeatmapProps) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-20 h-10" />
            {ASSETS.map(b => (
              <th key={b} className="text-xs text-graphite-400 font-medium text-center pb-2" style={{ width: 80 }}>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[b] }} />
                  {ASSET_LABELS[b]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ASSETS.map(a => (
            <tr key={a}>
              <td className="text-xs text-graphite-400 font-medium pr-3 text-right py-1">
                <div className="flex items-center justify-end gap-1.5">
                  {ASSET_LABELS[a]}
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[a] }} />
                </div>
              </td>
              {ASSETS.map(b => {
                const val = matrix[a]?.[b] ?? 0;
                const isClickable = a !== b;
                return (
                  <td key={b} className="py-1 px-1">
                    <motion.div
                      whileHover={isClickable ? { scale: 1.05 } : {}}
                      onClick={() => isClickable && onPairClick?.(a, b)}
                      className={`corr-cell h-14 rounded transition-all ${isClickable ? 'cursor-pointer' : ''}`}
                      style={{ backgroundColor: getCorrColor(val), color: getTextColor(val) }}
                      title={`${ASSET_LABELS[a]} × ${ASSET_LABELS[b]}: ${val}`}
                    >
                      <span className="font-mono text-sm">{val.toFixed(2)}</span>
                    </motion.div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-xs text-graphite-400">Correlation:</span>
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ backgroundColor: 'rgba(180,50,50,0.6)' }} />
          <span className="text-xs text-graphite-400">−1.0</span>
        </div>
        <div className="w-12 h-3 rounded" style={{ background: 'linear-gradient(to right, rgba(180,50,50,0.6), rgba(248,248,245,0.5), rgba(34,194,94,0.65))' }} />
        <div className="flex items-center gap-1">
          <div className="w-6 h-3 rounded" style={{ backgroundColor: 'rgba(34,194,94,0.65)' }} />
          <span className="text-xs text-graphite-400">+1.0</span>
        </div>
      </div>
    </div>
  );
}

interface PairBubbleProps {
  pairs: { a: Asset; b: Asset; correlation: number }[];
}

export function CorrelationBubbles({ pairs }: PairBubbleProps) {
  return (
    <div className="flex flex-col gap-3">
      {pairs.map(({ a, b, correlation }) => {
        const abs = Math.abs(correlation);
        const positive = correlation >= 0;
        return (
          <div key={`${a}-${b}`} className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
              <span className="text-xs font-medium text-graphite">{ASSET_LABELS[a]}</span>
              <span className="text-graphite-400 text-xs">×</span>
              <span className="text-xs font-medium text-graphite">{ASSET_LABELS[b]}</span>
            </div>
            <div className="flex-1 relative h-2 bg-ivory-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${abs * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ backgroundColor: positive ? '#22C55E' : '#EF4444' }}
              />
            </div>
            <span className={`text-xs font-mono font-medium w-12 text-right ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
              {correlation > 0 ? '+' : ''}{correlation.toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function useCorrelationPairs(matrix: CorrelationMatrix | null) {
  return useMemo(() => {
    if (!matrix) return [];
    const pairs: { a: Asset; b: Asset; correlation: number }[] = [];
    const assets: Asset[] = ['GOLD', 'BTC', 'NVDA'];
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        pairs.push({ a: assets[i], b: assets[j], correlation: matrix[assets[i]][assets[j]] });
      }
    }
    return pairs;
  }, [matrix]);
}
