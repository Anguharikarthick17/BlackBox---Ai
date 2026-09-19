import React from 'react';

interface BxDataBadgeProps {
  variant?: 'deterministic' | 'simulated' | 'provenance';
  compact?: boolean;
  className?: string;
}

export const BxDataBadge: React.FC<BxDataBadgeProps> = ({
  variant = 'deterministic',
  compact = false,
  className = '',
}) => {
  if (variant === 'simulated') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-800 rounded font-mono text-[10px] tracking-wider uppercase font-semibold ${className}`}
        title="Simulated backtesting data — does not constitute financial advice or real execution guarantees."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span>SIMULATED DATA · NOT A FORECAST</span>
      </div>
    );
  }

  if (variant === 'provenance') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-ivory-200 border border-border rounded font-mono text-[11px] text-graphite-600 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-graphite-400" />
        <span className="font-semibold uppercase tracking-wider text-graphite-700">DATA PROVENANCE:</span>
        <span>Deterministic Multi-Asset Suite (Gold · BTC · NVDA)</span>
      </div>
    );
  }

  // deterministic (default)
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-graphite/5 border border-graphite/20 text-graphite-600 rounded font-mono text-[10px] tracking-wider uppercase font-medium ${className}`}
      title="Deterministic research dataset calibrated for quantitative reproducibility."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      <span>{compact ? 'DETERMINISTIC DATA' : 'DETERMINISTIC RESEARCH DATA'}</span>
    </div>
  );
};
