import React from 'react';
import { ResearchDiffResult } from '../../../../core/research/audit/auditTypes';
import { Columns2, ArrowUpRight, ArrowDownRight, Minus, Shield, Scale } from 'lucide-react';

interface ResearchDiffViewProps {
  diff: ResearchDiffResult;
}

export const ResearchDiffView: React.FC<ResearchDiffViewProps> = ({ diff }) => {
  const renderDirectionIcon = (dir: string) => {
    if (dir === 'INCREASED') return <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />;
    if (dir === 'DECREASED') return <ArrowDownRight className="w-3.5 h-3.5 text-amber-400" />;
    return <Minus className="w-3.5 h-3.5 text-zinc-500" />;
  };

  const sections = Object.values(diff.sections);

  return (
    <div className="space-y-6 text-sm">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-zinc-100">Neutral Research Diff Engine</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {diff.neutralSummary}
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            A: {diff.caseAId}
          </span>
          <span className="text-zinc-500">vs</span>
          <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
            B: {diff.caseBId}
          </span>
        </div>
      </div>

      {/* Sections Table */}
      <div className="space-y-4">
        {sections.map(sec => {
          const hasDeltas = sec.categoricalDeltas.length > 0 || sec.quantitativeDeltas.length > 0;
          if (!hasDeltas) return null;

          return (
            <div
              key={sec.sectionName}
              className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3"
            >
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                {sec.sectionName}
              </h4>

              {/* Categorical Deltas */}
              {sec.categoricalDeltas.length > 0 && (
                <div className="space-y-1.5">
                  {sec.categoricalDeltas.map(cat => (
                    <div
                      key={cat.dimension}
                      className="flex flex-col md:flex-row md:items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-900 text-xs font-mono gap-2"
                    >
                      <span className="text-zinc-400 font-semibold">{cat.dimension}</span>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-zinc-300">{cat.caseAValue}</span>
                        <span className="text-zinc-600">→</span>
                        <span className={cat.identical ? 'text-zinc-400' : 'text-cyan-400'}>
                          {cat.caseBValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantitative Deltas Table */}
              {sec.quantitativeDeltas.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] uppercase">
                        <th className="py-2 px-2 font-semibold">Metric</th>
                        <th className="py-2 px-2 font-semibold">Case A</th>
                        <th className="py-2 px-2 font-semibold">Case B</th>
                        <th className="py-2 px-2 font-semibold">Absolute |Δ|</th>
                        <th className="py-2 px-2 font-semibold">Relative %</th>
                        <th className="py-2 px-2 font-semibold">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40 text-zinc-300">
                      {sec.quantitativeDeltas.map(d => (
                        <tr key={d.metric} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-2 px-2 font-semibold text-zinc-200">{d.metric}</td>
                          <td className="py-2 px-2 text-zinc-400">{String(d.caseAValue)}</td>
                          <td className="py-2 px-2 text-zinc-200">{String(d.caseBValue)}</td>
                          <td className="py-2 px-2 text-zinc-300">
                            {d.absoluteDelta !== undefined ? d.absoluteDelta.toFixed(4) : 'N/A'}
                          </td>
                          <td className="py-2 px-2">
                            {d.relativeDeltaPct !== undefined ? `${d.relativeDeltaPct.toFixed(2)}%` : 'N/A'}
                          </td>
                          <td className="py-2 px-2 flex items-center gap-1">
                            {renderDirectionIcon(d.direction)}
                            <span className="text-[10px] uppercase text-zinc-400">{d.direction}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
