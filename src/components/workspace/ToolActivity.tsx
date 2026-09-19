import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Wrench, Globe, Clock } from 'lucide-react';
import type { ToolActivityItem } from '../../services/ai/types';

interface ToolActivityProps {
  activities: ToolActivityItem[];
}

export const ToolActivity: React.FC<ToolActivityProps> = ({ activities }) => {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="my-3 p-3.5 rounded-lg bg-[#F4F1EA] border border-[#E5E0D8] text-xs font-mono">
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E5E0D8]">
        <span className="text-[10px] uppercase tracking-wider text-[#6E6B65] font-semibold flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-[#B40023]" />
          Autonomous Tool Execution
        </span>
        <span className="text-[10px] text-[#8C887B]">
          {activities.length} {activities.length === 1 ? 'action' : 'actions'}
        </span>
      </div>

      <div className="space-y-2">
        {activities.map((activity, idx) => {
          const isWeb = activity.toolName.includes('web') || activity.toolName.includes('search');
          const isRunning = activity.status === 'RUNNING' || activity.status === 'running';
          const isSuccess = activity.status === 'COMPLETED' || activity.status === 'success';
          const isError = activity.status === 'ERROR' || activity.status === 'error';

          return (
            <div
              key={activity.id || idx}
              className="flex items-center justify-between p-2 rounded bg-white/70 border border-[#E5E0D8]/60 transition-all hover:bg-white"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {isRunning && (
                  <Loader2 className="w-3.5 h-3.5 text-[#B40023] animate-spin shrink-0" />
                )}
                {isSuccess && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                {isError && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}

                {isWeb ? (
                  <Globe className="w-3 h-3 text-[#B40023] shrink-0" />
                ) : (
                  <Wrench className="w-3 h-3 text-[#6E6B65] shrink-0" />
                )}

                <span className="font-medium text-[#1A1917] truncate">
                  {activity.toolName}
                </span>

                {(activity.label || activity.inputSummary || activity.resultSnippet) && (
                  <span className="text-[#8C887B] truncate max-w-[240px]">
                    ({activity.label || activity.inputSummary || activity.resultSnippet})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[10px] text-[#8C887B]">
                {activity.durationMs !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {activity.durationMs}ms
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-bold ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-700'
                      : isError
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
