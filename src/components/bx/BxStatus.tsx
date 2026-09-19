import React from 'react';

export type BxStatusType =
  | 'SEALED'
  | 'ACTIVE'
  | 'PENDING'
  | 'VERIFIED'
  | 'MISMATCH'
  | 'SIMULATED'
  | 'RUNNING';

interface BxStatusProps {
  status: BxStatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const BxStatus: React.FC<BxStatusProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const normalized = status.toUpperCase();

  const getStyle = (s: string) => {
    switch (s) {
      case 'SEALED':
        return {
          bg: 'bg-graphite text-white border-graphite',
          dot: 'bg-emerald-400',
        };
      case 'VERIFIED':
      case 'REPLAY_VERIFIED':
      case 'MATCHED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'ACTIVE':
      case 'RUNNING':
        return {
          bg: 'bg-accent/10 text-accent border-accent/30',
          dot: 'bg-accent animate-pulse',
        };
      case 'MISMATCH':
      case 'FAILED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
        };
      case 'PENDING':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'SIMULATED':
      default:
        return {
          bg: 'bg-ivory-200 text-graphite-600 border-border-dark',
          dot: 'bg-graphite-400',
        };
    }
  };

  const style = getStyle(normalized);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-medium tracking-wider rounded border ${style.bg} ${sizeClass} select-none ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      <span>{label || status}</span>
    </span>
  );
};
