import React from 'react';

interface BxMetricProps {
  label: string;
  value: string | number;
  delta?: string | number;
  deltaPositive?: boolean;
  subtext?: string;
  variant?: 'neutral' | 'positive' | 'negative' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BxMetric: React.FC<BxMetricProps> = ({
  label,
  value,
  delta,
  deltaPositive,
  subtext,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: {
      value: 'text-lg',
      label: 'text-[10px]',
      padding: 'p-3',
    },
    md: {
      value: 'text-2xl md:text-3xl',
      label: 'text-xs',
      padding: 'p-4',
    },
    lg: {
      value: 'text-4xl md:text-5xl',
      label: 'text-xs md:text-sm',
      padding: 'p-5',
    },
  };

  const variantStyles = {
    neutral: 'text-graphite',
    positive: 'text-emerald-700',
    negative: 'text-rose-700',
    accent: 'text-accent',
  };

  return (
    <div
      className={`bg-white border border-border rounded-lg ${sizeStyles[size].padding} flex flex-col justify-between shadow-sm transition-all hover:border-graphite-400 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className={`font-mono uppercase tracking-[0.2em] text-graphite-400 font-medium ${sizeStyles[size].label}`}
        >
          {label}
        </span>
        {delta !== undefined && (
          <span
            className={`text-xs font-mono font-medium ${
              deltaPositive === true
                ? 'text-emerald-600'
                : deltaPositive === false
                ? 'text-rose-600'
                : 'text-graphite-400'
            }`}
          >
            {delta}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div
          className={`font-mono font-light tracking-tight tabular-nums ${variantStyles[variant]} ${sizeStyles[size].value}`}
        >
          {value}
        </div>
      </div>

      {subtext && (
        <span className="text-[11px] text-graphite-400 font-sans mt-1">
          {subtext}
        </span>
      )}
    </div>
  );
};
