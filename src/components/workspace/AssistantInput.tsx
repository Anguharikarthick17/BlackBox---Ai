import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Terminal, CornerDownLeft, Loader2 } from 'lucide-react';

interface AssistantInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onQuickAction?: (prompt: string) => void;
}

const QUICK_ACTIONS = [
  { label: 'Explain Current Strategy', prompt: 'Analyze my current strategy performance and key drivers.' },
  { label: 'Why Drawdown?', prompt: 'Why did my current strategy experience maximum drawdown?' },
  { label: 'Compare Regimes', prompt: 'How does my strategy perform across high vs low volatility regimes?' },
  { label: 'NVIDIA Web Research', prompt: 'Search today\'s NVIDIA news and compare it with its historical volatility in BLACKBOX.' },
  { label: 'Stress Test Strategy', prompt: 'How would my strategy perform under a 2020-style COVID crash shock?' },
  { label: 'Strategy Genome', prompt: 'Explain the current Strategy Genome relationships and highest correlations.' }
];

export const AssistantInput: React.FC<AssistantInputProps> = ({
  onSend,
  isLoading,
  onQuickAction
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[#E5E0D8] bg-[#FAF8F4] p-4">
      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-none">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#8C887B] shrink-0 font-medium">
          Research Prompts:
        </span>
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (onQuickAction) {
                onQuickAction(action.prompt);
              } else {
                setInput(action.prompt);
              }
            }}
            disabled={isLoading}
            className="text-xs font-mono px-2.5 py-1 rounded-full border border-[#E5E0D8] bg-white hover:border-[#B40023] hover:text-[#B40023] text-[#4A4741] whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end rounded-xl border border-[#D8D2C5] bg-white focus-within:border-[#B40023] focus-within:ring-2 focus-within:ring-[#B40023]/10 transition-all shadow-sm">
          <div className="pl-3.5 pb-3 text-[#8C887B]">
            <Terminal className="w-4 h-4 text-[#B40023]" />
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask BLACKBOX anything... (e.g. 'Why did my SMA strategy underperform?' or 'Search NVIDIA news and compare with historical regimes')"
            className="w-full resize-none border-0 bg-transparent py-3 px-3 text-sm text-[#1A1917] placeholder:text-[#8C887B] focus:outline-none focus:ring-0 leading-relaxed max-h-40 min-h-[44px]"
          />

          <div className="pr-2 pb-2 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                input.trim() && !isLoading
                  ? 'bg-[#B40023] text-white hover:bg-[#87001A] shadow-sm'
                  : 'bg-[#F4F1EA] text-[#8C887B] cursor-not-allowed'
              }`}
              title="Execute research inquiry (Enter)"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#B40023]" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] font-mono text-[#8C887B]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Press <kbd className="px-1 py-0.5 rounded bg-[#F4F1EA] border border-[#E5E0D8] text-[10px]">Enter</kbd> to submit
            </span>
            <span>•</span>
            <span><kbd className="px-1 py-0.5 rounded bg-[#F4F1EA] border border-[#E5E0D8] text-[10px]">Shift + Enter</kbd> for newline</span>
          </div>

          <span className="flex items-center gap-1 text-[10px] text-[#6E6B65]">
            <Sparkles className="w-3 h-3 text-[#B40023]" />
            Evidence Grounded • Zero Metric Fabrication
          </span>
        </div>
      </form>
    </div>
  );
};
