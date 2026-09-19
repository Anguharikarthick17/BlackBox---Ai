import React from 'react';
import { SecondaryTestRecord } from '../../../core/research/researchTypes';
import { SlidersHorizontal, CheckCircle2, FlaskConical, ArrowRight } from 'lucide-react';

interface SecondaryTestPanelProps {
  secondaryTests: SecondaryTestRecord[];
}

export const SecondaryTestPanel: React.FC<SecondaryTestPanelProps> = ({ secondaryTests }) => {
  if (!secondaryTests || secondaryTests.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-graphite flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            Bounded Secondary Sensitivity Sweeps
          </h3>
          <p className="text-[11px] text-graphite-400 mt-0.5">
            Automated secondary parameter sweeps triggered by contradiction resolution (Ceiling: 2 tests).
          </p>
        </div>
        <span className="text-[11px] font-mono text-purple-700 font-semibold">
          {secondaryTests.length} / 2 Secondary Executions
        </span>
      </div>

      <div className="space-y-3">
        {secondaryTests.map(test => (
          <div
            key={test.testId}
            className="p-4 bg-purple-50/40 border border-purple-200 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-900 bg-purple-200/60 px-2 py-0.5 rounded">
                  {test.testId}
                </span>
                <span className="text-xs font-semibold text-graphite">
                  Parameter Sweep: {test.parameterName}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-purple-100 text-purple-800 border border-purple-300">
                Bound to {test.hypothesisId}
              </span>
            </div>

            <p className="text-xs text-graphite font-sans leading-relaxed">
              {test.resultSummary}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono pt-2 border-t border-purple-200/60">
              <span className="text-graphite-400">Tested Values:</span>
              <div className="flex items-center gap-1.5">
                {test.testedValues.map((val, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white border border-purple-200 rounded text-graphite font-semibold"
                  >
                    {val} bps
                  </span>
                ))}
              </div>
              <span className="text-graphite-400 ml-auto">
                Evidence: {test.evidenceIds.map(id => `[${id}]`).join(', ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
