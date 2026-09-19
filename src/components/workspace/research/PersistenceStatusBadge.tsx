/**
 * BLACKBOX X — Persistence Status Badge
 * 
 * Displays the current persistence layer status in the UI.
 * Shows ONLINE, OFFLINE (LOCAL ONLY), or UNCONFIGURED states.
 * 
 * Pings /api/research/health on mount and updates reactively.
 * The app never breaks if Supabase is unavailable.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type PersistenceStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED' | 'SAVED';

interface PersistenceStatusBadgeProps {
  /** If provided, show a specific "saved" state */
  lastSavedAt?: Date | null;
  /** Show the full label, or compact icon-only */
  compact?: boolean;
  className?: string;
}

export const PersistenceStatusBadge: React.FC<PersistenceStatusBadgeProps> = ({
  lastSavedAt,
  compact = false,
  className = '',
}) => {
  const [status, setStatus] = useState<PersistenceStatus>('CHECKING');
  const [message, setMessage] = useState('Checking persistence...');

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const resp = await fetch('/api/research/health');
        if (!mounted) return;
        if (resp.ok) {
          const data = await resp.json();
          if (data.supabase === 'ONLINE') {
            setStatus('ONLINE');
            setMessage('Research persistence active');
          } else if (data.supabase === 'NOT_CONFIGURED') {
            setStatus('UNCONFIGURED');
            setMessage('Persistence unconfigured — local only');
          } else {
            setStatus('OFFLINE');
            setMessage('Persistence offline — local only');
          }
        } else {
          setStatus('OFFLINE');
          setMessage('Persistence offline — local only');
        }
      } catch {
        if (mounted) {
          setStatus('OFFLINE');
          setMessage('Persistence offline — local only');
        }
      }
    };

    check();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (lastSavedAt) {
      setStatus('SAVED');
      setMessage(`Saved ${formatRelativeTime(lastSavedAt)}`);
    }
  }, [lastSavedAt]);

  const config = STATUS_CONFIG[status];

  if (compact) {
    return (
      <motion.span
        className={`inline-flex items-center gap-1 ${className}`}
        title={message}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
        {status === 'CHECKING' && (
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse absolute" />
        )}
      </motion.span>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${config.badgeClass} ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        title={message}
      >
        {/* Status dot */}
        <span className="relative flex h-2 w-2">
          {(status === 'ONLINE' || status === 'SAVED') && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
        </span>

        {/* Label */}
        <span>{config.label}</span>

        {/* Icon */}
        {config.icon && (
          <span className="text-xs">{config.icon}</span>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================
// STATUS CONFIGS
// ============================================================

const STATUS_CONFIG: Record<PersistenceStatus, {
  label: string;
  badgeClass: string;
  dotColor: string;
  pingColor: string;
  icon?: string;
}> = {
  CHECKING: {
    label: 'Connecting...',
    badgeClass: 'bg-slate-800/60 text-slate-400 border border-slate-700/50',
    dotColor: 'bg-slate-500',
    pingColor: 'bg-slate-400',
    icon: '⟳',
  },
  ONLINE: {
    label: 'Persistence Active',
    badgeClass: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40',
    dotColor: 'bg-emerald-400',
    pingColor: 'bg-emerald-300',
    icon: '🔒',
  },
  SAVED: {
    label: 'Case Saved',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40',
    dotColor: 'bg-cyan-400',
    pingColor: 'bg-cyan-300',
    icon: '✓',
  },
  OFFLINE: {
    label: 'Local Only',
    badgeClass: 'bg-amber-950/60 text-amber-400 border border-amber-800/40',
    dotColor: 'bg-amber-400',
    pingColor: 'bg-amber-300',
    icon: '⚠',
  },
  UNCONFIGURED: {
    label: 'No Persistence',
    badgeClass: 'bg-slate-800/60 text-slate-500 border border-slate-700/50',
    dotColor: 'bg-slate-500',
    pingColor: 'bg-slate-400',
    icon: '○',
  },
};

// ============================================================
// HELPERS
// ============================================================

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
