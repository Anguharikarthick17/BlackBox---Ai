import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  Trash2,
  Cpu,
  Layers,
  Activity,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { AssistantMessage } from './AssistantMessage';
import { AssistantInput } from './AssistantInput';
import { ToolActivity } from './ToolActivity';

export const BlackboxAssistant: React.FC = () => {
  const {
    assistantMessages,
    isAssistantThinking,
    assistantActiveMode,
    currentToolActivity,
    assistantError,
    assistantConfigured,
    selectedAsset,
    selectedStrategy,
    regimePeriods,
    sendAssistantMessage,
    clearAssistantConversation
  } = useResearchStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [assistantMessages, isAssistantThinking, currentToolActivity]);

  const handleSend = (text: string) => {
    sendAssistantMessage(text);
  };

  const activeRegime = regimePeriods && regimePeriods.length > 0 ? regimePeriods[0].regime : undefined;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto bg-[#FAF8F4] border border-[#E5E0D8] rounded-2xl shadow-sm overflow-hidden">
      {/* Top Console Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D8] bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1A1917] text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[#B40023]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-mono tracking-tight text-[#1A1917] uppercase">
                BLACKBOX AI
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
              {assistantActiveMode && (
                <span className="text-[10px] font-mono text-[#B40023] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 uppercase font-semibold">
                  {assistantActiveMode}
                </span>
              )}
            </div>
            <p className="text-xs text-[#6E6B65] font-sans">
              Quantitative Research Assistant • Evidence Grounded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Context Capsule */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF8F4] border border-[#E5E0D8] text-xs font-mono text-[#6E6B65]">
            <Layers className="w-3.5 h-3.5 text-[#B40023]" />
            <span>Asset: <strong className="text-[#1A1917]">{selectedAsset}</strong></span>
            <span>•</span>
            <span>Strategy: <strong className="text-[#1A1917]">{selectedStrategy}</strong></span>
            {activeRegime && (
              <>
                <span>•</span>
                <span>Regime: <strong className="text-[#1A1917]">{activeRegime}</strong></span>
              </>
            )}
          </div>

          {/* Model info */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-[#8C887B] px-2.5 py-1 rounded bg-white border border-[#E5E0D8]">
            <Cpu className="w-3.5 h-3.5 text-[#6E6B65]" />
            <span>Featherless LLM</span>
          </div>

          {/* Clear button */}
          <button
            onClick={clearAssistantConversation}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono text-[#8C887B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
            title="Clear conversation history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Configuration Status Notice if API key missing */}
      {!assistantConfigured && (
        <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex items-center justify-between text-xs font-mono text-amber-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Deterministic Offline Engine Active:</strong> Server-side <code className="bg-amber-100 px-1 py-0.5 rounded">FEATHERLESS_API_KEY</code> is unconfigured. All quantitative tool inquiries run directly against BLACKBOX local calculation engines with zero metric fabrication.
            </span>
          </div>
          <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            Safe Mode
          </span>
        </div>
      )}

      {/* Error banner */}
      {assistantError && (
        <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-xs font-mono text-rose-800 flex items-center justify-between">
          <span>Error: {assistantError}</span>
        </div>
      )}

      {/* Scrollable Conversation Timeline */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {assistantMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-[#B40023]" />
            </div>
            <h3 className="text-base font-bold text-[#1A1917] mb-1 font-mono">
              BLACKBOX Research Intelligence
            </h3>
            <p className="text-xs text-[#6E6B65] leading-relaxed mb-6 font-sans">
              Interact with deterministic quant engines, query macroeconomic stress regimes, or combine real-time web research with historical backtests.
            </p>

            <div className="grid grid-cols-1 gap-2 w-full text-left">
              <div className="p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs">
                <div className="font-mono font-semibold text-[#1A1917] flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-[#B40023]" />
                  Deterministic Source of Truth
                </div>
                <p className="text-[11px] text-[#6E6B65]">
                  Calculations are performed by BLACKBOX native engines. AI does not hallucinate financial metrics.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[#E5E0D8] bg-white text-xs">
                <div className="font-mono font-semibold text-[#1A1917] flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Hybrid Web Grounding
                </div>
                <p className="text-[11px] text-[#6E6B65]">
                  External news and market updates are cited with clickable domains and verified sources.
                </p>
              </div>
            </div>
          </div>
        ) : (
          assistantMessages.map((msg) => (
            <AssistantMessage
              key={msg.id}
              message={msg}
              onNextTest={(prompt) => handleSend(prompt)}
            />
          ))
        )}

        {/* Live In-Progress Tool Activity */}
        {isAssistantThinking && (
          <div className="my-4">
            <ToolActivity activities={currentToolActivity} />
            <div className="flex items-center gap-2 text-xs font-mono text-[#8C887B] ml-11">
              <span className="w-2 h-2 rounded-full bg-[#B40023] animate-ping" />
              <span>BLACKBOX AI is formulating evidence-grounded response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <AssistantInput
        onSend={handleSend}
        isLoading={isAssistantThinking}
        onQuickAction={(prompt) => handleSend(prompt)}
      />
    </div>
  );
};
