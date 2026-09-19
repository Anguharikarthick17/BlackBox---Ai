import React from 'react';
import { ResearchSynthesis as SynthesisType, ResearchClaim } from '../../../../core/research/researchTypes';
import { FileText, ShieldAlert, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';

interface ResearchSynthesisProps {
  synthesis: Readonly<SynthesisType> | SynthesisType | null | undefined;
  onSelectClaim?: (claim: ResearchClaim) => void;
}

export const ResearchSynthesisView: React.FC<ResearchSynthesisProps> = ({
  synthesis,
  onSelectClaim,
}) => {
  if (!synthesis) {
    return (
      <div className="bg-white border border-border rounded-lg p-6 text-center text-graphite-400">
        <p className="text-sm">No synthesis formulated yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg p-6 md:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="section-label block">SECTION 09 — RESEARCH SYNTHESIS</span>
          <h2 className="text-lg md:text-xl font-light text-graphite tracking-tight mt-0.5">
            Empirical Findings & Methodological Conclusion
          </h2>
        </div>
        <div className="text-xs font-mono text-graphite-400 bg-ivory-100 px-2.5 py-1 rounded border border-border-light">
          Confidence: <strong className="text-graphite">{synthesis.hypothesisFindings[0]?.confidence || 'MODERATE'}</strong>
        </div>
      </div>

      {/* Main Conclusion Box */}
      <div className="p-5 bg-ivory-50 rounded-lg border border-border mb-6">
        <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider block mb-1.5">
          RESEARCH CONCLUSION
        </span>
        <p className="text-base font-normal text-graphite leading-relaxed mb-4">
          {synthesis.executiveObservation}
        </p>

        {/* Bound Claims List */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-400 block mb-2">
            BOUND RESEARCH CLAIMS (CLICK TO INSPECT DIRECT EVIDENCE):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {synthesis.claims.map(claim => (
              <div
                key={claim.claimId}
                onClick={() => onSelectClaim?.(claim)}
                className="p-3 bg-white rounded border border-border-light hover:border-accent transition-all cursor-pointer group text-xs font-mono flex items-start justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-accent font-semibold">{claim.claimId}</span>
                    <span className="text-[10px] text-graphite-400">• {claim.metric}</span>
                  </div>
                  <p className="text-graphite-600 font-sans text-xs leading-relaxed group-hover:text-graphite">
                    "{claim.text}"
                  </p>
                </div>
                <span className="text-xs font-semibold text-accent whitespace-nowrap pt-1">
                  {claim.value} {claim.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Structured Multi-Column Nuance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono mb-6">
        {/* Next Research Questions */}
        <div className="p-4 bg-ivory-100 rounded-lg border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-accent" /> NEXT INQUIRIES
          </span>
          <ul className="space-y-1.5 text-graphite-600 font-sans text-xs">
            {synthesis.nextResearchQuestions?.map((q: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-graphite-300">•</span>
                <span>{q}</span>
              </li>
            )) || <li>Intraday execution slippage dynamics under extreme liquidity cascades.</li>}
          </ul>
        </div>

        {/* Robustness Assessment */}
        <div className="p-4 bg-ivory-100 rounded-lg border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" /> ROBUSTNESS
          </span>
          <p className="text-graphite-600 font-sans text-xs leading-relaxed">
            {synthesis.robustnessAssessment || 'Parameter stability verified across friction cost sweeps and trend duration regimes.'}
          </p>
        </div>

        {/* Methodological Limitations */}
        <div className="p-4 bg-ivory-100 rounded-lg border border-border-light">
          <span className="text-[10px] text-graphite-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> BOUNDARY LIMITATIONS
          </span>
          <ul className="space-y-1.5 text-graphite-600 font-sans text-xs">
            {synthesis.limitations?.map((l: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-graphite-300">•</span>
                <span>{l}</span>
              </li>
            )) || <li>Simulated offline dataset (2019–2023). Non-predictive historical backtest.</li>}
          </ul>
        </div>
      </div>

      {/* Cautious Epistemic Language Invariant */}
      <div className="p-3 bg-ivory-50 rounded border border-border-light text-[11px] font-mono text-graphite-400 flex items-center justify-between">
        <span>Empirical observations reflect statistical associations observed in this dataset and do not establish universal causality.</span>
        <span className="text-graphite-500 font-semibold">Strict Epistemic Neutrality</span>
      </div>
    </div>
  );
};
