import React from 'react';

export interface PipelineStage {
  num: string;
  id: string;
  name: string;
  description: string;
  toolReference?: string;
}

export const DEFAULT_RESEARCH_STAGES: PipelineStage[] = [
  {
    num: '01',
    id: 'question',
    name: 'QUESTION',
    description: 'Empirical market hypothesis formulation without predictive bias',
    toolReference: 'Hypothesis Engine',
  },
  {
    num: '02',
    id: 'hypothesis',
    name: 'FORMULATE',
    description: 'Deterministic parameter bounding across regimes and stress vectors',
    toolReference: 'Parameter Matrix',
  },
  {
    num: '03',
    id: 'experiment',
    name: 'EXPERIMENT',
    description: 'Execution via 4 distinct quantitative engines with realistic transaction friction',
    toolReference: 'Backtest / Monte Carlo',
  },
  {
    num: '04',
    id: 'evidence',
    name: 'EVIDENCE',
    description: 'Immutable record generation with SHA-256 fingerprint validation',
    toolReference: 'Evidence Graph',
  },
  {
    num: '05',
    id: 'challenge',
    name: 'CHALLENGE',
    description: 'Counter-evidence search, regime shifts, and adversarial cross-examination',
    toolReference: 'Ghost Mode & Committee',
  },
  {
    num: '06',
    id: 'conclusion',
    name: 'CONCLUSION',
    description: 'Sealed research case with full audit trail and bit-level replay integrity',
    toolReference: 'Research Case Sealed',
  },
];

interface BxResearchPipelineProps {
  currentStageId?: string;
  onSelectStage?: (stageId: string) => void;
  stages?: PipelineStage[];
  className?: string;
  dark?: boolean;
}

export const BxResearchPipeline: React.FC<BxResearchPipelineProps> = ({
  currentStageId = 'evidence',
  onSelectStage,
  stages = DEFAULT_RESEARCH_STAGES,
  className = '',
  dark = false,
}) => {
  return (
    <div className={`w-full overflow-x-auto no-scrollbar ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 min-w-[720px]">
        {stages.map((stage) => {
          const isActive = stage.id === currentStageId;
          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage && onSelectStage(stage.id)}
              className={`group text-left p-4 rounded-lg border transition-all duration-200 relative ${
                isActive
                  ? dark
                    ? 'bg-accent/20 border-accent text-white shadow-crimson-glow'
                    : 'bg-white border-accent shadow-card border-l-4'
                  : dark
                  ? 'bg-graphite-800/80 border-graphite-600 hover:border-graphite-400 text-graphite-300'
                  : 'bg-white/70 border-border hover:border-graphite-400 text-graphite'
              } ${onSelectStage ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {/* Stage number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-[11px] font-semibold tracking-widest ${
                    isActive ? 'text-accent font-bold' : dark ? 'text-graphite-400' : 'text-graphite-400'
                  }`}
                >
                  {stage.num}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                )}
              </div>

              {/* Stage title */}
              <h4
                className={`font-display text-base font-bold uppercase tracking-tight mb-1.5 ${
                  isActive ? (dark ? 'text-white' : 'text-graphite') : dark ? 'text-graphite-100' : 'text-graphite'
                }`}
              >
                {stage.name}
              </h4>

              {/* Description */}
              <p
                className={`text-xs leading-relaxed font-sans line-clamp-2 ${
                  dark ? 'text-graphite-400' : 'text-graphite-500'
                }`}
              >
                {stage.description}
              </p>

              {/* Sub-label tool reference */}
              {stage.toolReference && (
                <div
                  className={`mt-2 pt-2 border-t text-[9px] font-mono tracking-wider uppercase truncate ${
                    dark ? 'border-graphite-700 text-graphite-400' : 'border-border/60 text-graphite-400'
                  }`}
                >
                  {stage.toolReference}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
