import React from 'react';
import { User, Cpu, ArrowRight, ShieldAlert, BarChart3, Database } from 'lucide-react';
import type { AssistantMessageItem } from '../../services/ai/types';
import { ToolActivity } from './ToolActivity';
import { SourceList } from './SourceList';

interface AssistantMessageProps {
  message: AssistantMessageItem;
  onNextTest?: (prompt: string) => void;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  onNextTest
}) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex items-start gap-3 justify-end my-4">
        <div className="max-w-2xl bg-[#1A1917] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm border border-[#2E2C29]">
          <p className="text-sm font-sans whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
          <div className="text-[10px] font-mono text-[#8C887B] mt-1.5 text-right">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#E5E0D8] text-[#1A1917] flex items-center justify-center shrink-0 border border-[#D8D2C5]">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Assistant Message
  const modeKey = (message.mode || 'BLACKBOX') as 'GENERAL' | 'BLACKBOX' | 'WEB' | 'HYBRID';
  const modeColor = {
    GENERAL: 'bg-slate-100 text-slate-700 border-slate-200',
    BLACKBOX: 'bg-rose-50 text-rose-700 border-rose-200',
    WEB: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    HYBRID: 'bg-purple-50 text-purple-700 border-purple-200'
  }[modeKey] || 'bg-rose-50 text-rose-700 border-rose-200';

  return (
    <div className="flex items-start gap-3 my-5">
      <div className="w-8 h-8 rounded-full bg-[#B40023] text-white flex items-center justify-center shrink-0 shadow-sm">
        <Cpu className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-3xl bg-white rounded-2xl rounded-tl-sm border border-[#E5E0D8] p-5 shadow-sm overflow-hidden">
        {/* Header Badge */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0EBE1]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#1A1917] tracking-tight uppercase">
              BLACKBOX AI
            </span>
            {message.mode && (
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${modeColor}`}>
                {message.mode} MODE
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-[#8C887B]">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Tool Activity Timeline */}
        {message.toolActivity && message.toolActivity.length > 0 && (
          <ToolActivity activities={message.toolActivity} />
        )}

        {/* Primary Markdown / Text Content */}
        <div className="prose prose-sm max-w-none text-[#2C2A26] font-sans leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Evidence Block (if metrics returned) */}
        {message.evidence && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E5E0D8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6E6B65] font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#B40023]" />
                Grounded Quantitative Evidence
              </span>
              <span className="text-[10px] font-mono text-[#8C887B] flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" />
                Deterministic Engine
              </span>
            </div>
            <pre className="text-xs font-mono bg-white p-3 rounded-lg border border-[#E5E0D8] overflow-x-auto text-[#1A1917]">
              {typeof message.evidence === 'string' ? message.evidence : JSON.stringify(message.evidence, null, 2)}
            </pre>
          </div>
        )}

        {/* Web Citations */}
        {message.webSources && message.webSources.length > 0 && (
          <SourceList sources={message.webSources} />
        )}

        {/* Research Actions / Next Steps */}
        {message.nextActions && message.nextActions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8C887B] block mb-2 font-semibold">
              Suggested Next Tests:
            </span>
            <div className="flex flex-wrap gap-2">
              {message.nextActions.map((action: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onNextTest && onNextTest(action)}
                  className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-[#D8D2C5] bg-[#FAF8F4] hover:border-[#B40023] hover:bg-white text-[#1A1917] transition-all"
                >
                  <span>{action}</span>
                  <ArrowRight className="w-3 h-3 text-[#8C887B] group-hover:text-[#B40023] group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Institutional Financial Disclaimer Footer */}
        <div className="mt-4 pt-2.5 border-t border-[#F0EBE1] flex items-center justify-between text-[10px] font-mono text-[#8C887B]">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            Deterministic verification active. Simulated & historical models do not guarantee future performance.
          </span>
        </div>
      </div>
    </div>
  );
};
