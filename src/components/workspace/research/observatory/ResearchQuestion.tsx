import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, Activity, HelpCircle } from 'lucide-react';
import { CURATED_OBSERVATORY_INQUIRIES, OBSERVATORY_DISCLAIMERS } from '../../../../core/research/observatory/observatoryTypes';

interface ResearchQuestionProps {
  onRunQuestion: (question: string) => void;
  isRunning?: boolean;
  activeQuestion?: string;
}

export const ResearchQuestion: React.FC<ResearchQuestionProps> = ({
  onRunQuestion,
  isRunning = false,
  activeQuestion = '',
}) => {
  const [inputQuery, setInputQuery] = useState(activeQuestion || CURATED_OBSERVATORY_INQUIRIES[0].query);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize input query when active question updates
  React.useEffect(() => {
    if (activeQuestion) {
      setInputQuery(activeQuestion);
    }
  }, [activeQuestion]);

  const handleLaunch = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query) {
      setValidationError('Please enter a quantitative research question or select an institutional template.');
      return;
    }
    if (isRunning) return;

    setValidationError(null);
    onRunQuestion(query);
  };

  const handleSelectCurated = (query: string) => {
    setInputQuery(query);
    setValidationError(null);
  };

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <div>
          <span className="section-label block">SECTION 01 — RESEARCH QUESTION</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Formulate Quantitative Inquiry
          </h2>
        </div>
        <div className="text-xs text-graphite-400 font-mono flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-accent" />
          <span>Falsifiable • Bounded DAG • Deterministic Execution</span>
        </div>
      </div>

      {/* Core Institutional Framing Banner */}
      <div className="mb-6 p-3.5 bg-ivory-100 border border-border-light rounded text-xs text-graphite-500 leading-relaxed font-sans">
        <strong className="text-graphite font-semibold">Institutional Research Charter:</strong> {OBSERVATORY_DISCLAIMERS.EPISTEMIC_ROLE}
      </div>

      <form onSubmit={handleLaunch} className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-graphite-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputQuery}
              onChange={e => {
                setInputQuery(e.target.value);
                if (validationError) setValidationError(null);
              }}
              disabled={isRunning}
              placeholder="e.g. Why did BTC EMA Trend underperform Buy & Hold during 2020-2023?"
              className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-md text-sm text-graphite placeholder:text-graphite-300 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-normal"
            />
          </div>

          <button
            type="submit"
            onClick={handleLaunch}
            disabled={isRunning || !inputQuery.trim()}
            data-testid="launch-investigation-btn"
            className="btn-accent px-6 py-3 text-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <span>Launch Investigation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {validationError && (
          <p className="text-xs text-rose-600 font-mono mt-2 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{validationError}</span>
          </p>
        )}
      </form>

      {/* Curated Suggested Questions */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-400 block mb-2">
          Or Select an Institutional Research Template:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CURATED_OBSERVATORY_INQUIRIES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectCurated(item.query)}
              disabled={isRunning}
              className={`p-3 text-left rounded border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                inputQuery === item.query
                  ? 'border-accent bg-blue-50/50 text-graphite'
                  : 'border-border-light bg-ivory-50 hover:bg-ivory-100 hover:border-border text-graphite-500'
              }`}
            >
              <span className="font-medium text-graphite line-clamp-1">{item.title}</span>
              <span className="text-[11px] text-graphite-400 line-clamp-2 leading-relaxed font-mono">
                "{item.query}"
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
