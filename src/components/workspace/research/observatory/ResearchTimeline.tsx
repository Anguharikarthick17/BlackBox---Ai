import React from 'react';
import { AuditEvent } from '../../../../core/research/audit/auditTypes';
import { Clock, ShieldCheck, CheckCircle2, Play, AlertCircle, FileText } from 'lucide-react';

interface ResearchTimelineProps {
  auditEvents: readonly AuditEvent[] | AuditEvent[];
}

export const ResearchTimeline: React.FC<ResearchTimelineProps> = ({ auditEvents }) => {
  if (!auditEvents || auditEvents.length === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No timeline events recorded yet.</p>
      </div>
    );
  }

  const getEventIcon = (type: AuditEvent['eventType']) => {
    switch (type) {
      case 'CASE_SEALED':
      case 'REPLAY_COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'REPLAY_MISMATCH':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'EXPERIMENT_STARTED':
      case 'REPLAY_STARTED':
        return <Play className="w-3.5 h-3.5 text-accent" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-graphite-400" />;
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">LIFECYCLE AUDIT TRAIL</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Monotonic Chronological Research Timeline
          </h2>
        </div>
        <span className="text-xs font-mono text-graphite-400 bg-ivory-100 px-2.5 py-1 rounded border border-border-light">
          {auditEvents.length} Verified Ledger Events
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
        {auditEvents.map(evt => (
          <div key={evt.eventId} className="relative flex items-start gap-3">
            <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-white border border-border flex items-center justify-center">
              {getEventIcon(evt.eventType)}
            </div>

            <div className="flex-1 p-3 bg-ivory-50 rounded border border-border-light text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-graphite">
                  {evt.eventType.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-graphite-400">
                  {new Date(evt.timestamp).toLocaleTimeString()} • {evt.actor}
                </span>
              </div>

              {evt.fingerprint && (
                <div className="text-[10px] text-graphite-400 truncate mt-0.5">
                  Fingerprint: <span className="text-accent">{evt.fingerprint}</span>
                </div>
              )}

              {evt.details && Object.keys(evt.details).length > 0 && (
                <div className="text-[11px] text-graphite-500 font-sans mt-1">
                  {Object.entries(evt.details)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' • ')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
