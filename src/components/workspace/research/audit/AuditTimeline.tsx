import React from 'react';
import { AuditEvent } from '../../../../core/research/audit/auditTypes';
import { Clock, Shield, CheckCircle2, AlertTriangle, Terminal, Lock } from 'lucide-react';

interface AuditTimelineProps {
  events: ReadonlyArray<AuditEvent>;
  timelineChecksum?: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ events, timelineChecksum }) => {
  const getBadgeStyle = (type: string) => {
    if (type.includes('SEALED') || type.includes('COMPLETED')) {
      return 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60';
    }
    if (type.includes('MISMATCH') || type.includes('REVOKED')) {
      return 'bg-rose-950/40 text-rose-400 border-rose-800/60';
    }
    if (type.includes('STARTED') || type.includes('LOCKED')) {
      return 'bg-cyan-950/40 text-cyan-400 border-cyan-800/60';
    }
    return 'bg-zinc-800/60 text-zinc-300 border-zinc-700';
  };

  return (
    <div className="space-y-4">
      {/* Header & Checksum */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Append-Only Audit Ledger</h3>
            <p className="text-xs text-zinc-400">
              Immutable chronological record of research lifecycle transitions and verification events.
            </p>
          </div>
        </div>

        {timelineChecksum && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-500 uppercase text-[10px]">Ledger Checksum:</span>
            <span className="text-emerald-400">{timelineChecksum.slice(0, 16)}</span>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
        {events.map((evt, idx) => (
          <div key={evt.eventId || idx} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-zinc-950 border-2 border-indigo-500 group-hover:scale-125 transition-transform" />

            {/* Event Card */}
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded border font-mono text-[10px] font-medium tracking-wide ${getBadgeStyle(
                      evt.eventType
                    )}`}
                  >
                    {evt.eventType}
                  </span>
                  <span className="text-zinc-400 font-mono text-[10px]">
                    Actor: {evt.actor}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px]">
                  <Clock className="w-3 h-3" />
                  {new Date(evt.timestamp).toISOString()}
                </div>
              </div>

              {evt.fingerprint && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800/60">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span className="text-zinc-500">Hash:</span>
                  <span className="text-cyan-300 truncate">{evt.fingerprint}</span>
                </div>
              )}

              {evt.details && Object.keys(evt.details).length > 0 && (
                <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-950/50 p-2 rounded border border-zinc-900 overflow-x-auto">
                  {JSON.stringify(evt.details, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
