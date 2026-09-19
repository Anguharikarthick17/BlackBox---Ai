/**
 * BLACKBOX X — AI Risk Committee / CRO Briefing
 * 
 * Institutional-grade quantitative research memo providing evidence-grounded
 * interpretation of current backtest, regime, correlation, and stress testing states.
 * 
 * CORE PRINCIPLE:
 * BLACKBOX X CALCULATES. GEMINI INTERPRETS.
 * Zero financial calculations happen here; all metrics originate from deterministic engines.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, XCircle,
  Clock, ArrowRight, Copy, Check, Printer, RefreshCw, Layers,
  ExternalLink, FileText, ChevronRight, Activity, Zap, Compass,
  Sliders, ShieldCheck, Database, Info, GitBranch,
} from 'lucide-react';
import { useResearchStore } from '../../store/researchStore';
import { ASSET_LABELS, ASSET_COLORS } from '../../core/data';
import { STRATEGY_LABELS } from '../../core/strategies';
import { EvidenceItem, RiskFactor, Contradiction, ResearchQuestion } from '../../core/riskBriefValidator';

export function RiskCommittee() {
  const shouldReduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);

  const {
    selectedAsset,
    selectedStrategy,
    strategyParams,
    startDate,
    endDate,
    initialCapital,
    transactionCostPct,
    metrics,
    backtestResult,
    stressResult,
    robustnessResults,
    riskBrief,
    riskBriefStatus,
    riskBriefError,
    riskBriefDetails,
    lastBriefFingerprint,
    isGeneratingRiskBrief,
    generateRiskBrief,
    clearRiskBrief,
    setActiveSection,
  } = useResearchStore();

  const handleGenerate = (force = false, mockFallback = false) => {
    generateRiskBrief({ force, mockFallback });
  };

  const handleCopy = () => {
    if (!riskBrief) return;
    const memo = `# BLACKBOX X — CRO RISK COMMITTEE BRIEFING
**Title:** ${riskBrief.title}
**Generated:** ${new Date(riskBrief.generatedAt).toLocaleString()}
**Model:** ${riskBrief.modelIdentifier}
**Fingerprint:** ${riskBrief.researchPackFingerprint}
**Dataset Provenance:** ${riskBrief.datasetProvenance}

---

## Executive Observation
${riskBrief.executiveObservation}

---

## Key Evidence Summary
${riskBrief.evidenceSummary.map(e => `- [${e.sourceEngine}] ${e.statement} (Refs: ${e.metricReferences.join(', ')})`).join('\n')}

---

## Structural Risk Factors
${riskBrief.riskFactors.map(r => `### [${r.severity}] ${r.title}\n${r.description}`).join('\n\n')}

---

## Analytical Trade-Offs & Contradictions
${riskBrief.contradictions.map(c => `### ${c.tension}\n- **Observation:** ${c.positiveObservation}\n- **Trade-off:** ${c.negativeTradeoff}\n${c.description}`).join('\n\n')}

---

## Stress Assessment
${riskBrief.stressAssessment.summary}
- Impact: ${riskBrief.stressAssessment.drawdownImpact}
- Recovery: ${riskBrief.stressAssessment.recoveryEvaluation}

---

## Robustness & Sensitivity
${riskBrief.robustnessAssessment.summary}
- Sensitivity: ${riskBrief.robustnessAssessment.parameterSensitivity}

---

## Market Relationships (Strategy Genome)
${riskBrief.relationshipAssessment.summary}
- Correlation Structure: ${riskBrief.relationshipAssessment.correlationStructure}

---

## Next Research Hypotheses
${riskBrief.researchQuestions.map(q => `- **${q.question}**: ${q.rationale}`).join('\n')}

---
*Disclaimer: ${riskBrief.disclaimer}*
`;
    navigator.clipboard.writeText(memo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = useMemo(() => {
    switch (riskBriefStatus) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI INTERPRETATION CONNECTED
          </span>
        );
      case 'ANALYZING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-accent/10 text-accent border border-accent/20">
            <RefreshCw size={11} className="animate-spin text-accent" />
            INTERPRETING RESEARCH PACK...
          </span>
        );
      case 'NOT_CONFIGURED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <AlertTriangle size={11} />
            AI ANALYSIS NOT CONFIGURED (API KEY MISSING)
          </span>
        );
      case 'VALIDATION_FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-red-500/10 text-red-700 border border-red-500/20">
            <XCircle size={11} />
            AI GROUNDING VALIDATION FAILED
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-red-500/10 text-red-700 border border-red-500/20">
            <AlertTriangle size={11} />
            API ERROR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-graphite/5 text-graphite-500 border border-border">
            <Clock size={11} />
            AWAITING BRIEF GENERATION
          </span>
        );
    }
  }, [riskBriefStatus]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[10px] font-mono text-graphite-400 uppercase tracking-wider">
              QUANTITATIVE AI INTERPRETATION · PHASE 3.4
            </span>
          </div>
          <h1 className="editorial-lg text-3xl font-semibold text-graphite">
            AI Risk Committee / CRO Briefing
          </h1>
          <p className="text-xs text-graphite-500 mt-1 max-w-2xl leading-relaxed">
            Evidence-grounded qualitative interpretation of verified quantitative results.
            BLACKBOX X engines calculate; Google Gemini interprets within strict mathematical bounds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {statusBadge}
        </div>
      </div>

      {/* Top Summary & Control Bar */}
      <div className="p-5 bg-white border border-border rounded-xl shadow-xs space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
            <span className="text-[10px] font-mono text-graphite-400 uppercase block">Underlying Asset</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ASSET_COLORS[selectedAsset] }} />
              <span className="text-xs font-semibold text-graphite">{ASSET_LABELS[selectedAsset]}</span>
            </div>
          </div>

          <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
            <span className="text-[10px] font-mono text-graphite-400 uppercase block">Tested Strategy</span>
            <span className="text-xs font-semibold text-graphite mt-1 block truncate">
              {STRATEGY_LABELS[selectedStrategy]}
            </span>
          </div>

          <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
            <span className="text-[10px] font-mono text-graphite-400 uppercase block">Simulation Horizon</span>
            <span className="text-xs font-semibold text-graphite mt-1 block">
              {startDate.slice(0, 4)} – {endDate.slice(0, 4)} (5Y)
            </span>
          </div>

          <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
            <span className="text-[10px] font-mono text-graphite-400 uppercase block">Stress Test State</span>
            <span className="text-xs font-semibold mt-1 block truncate text-graphite">
              {stressResult ? stressResult.scenario.name : 'Un-Stressed (Baseline)'}
            </span>
          </div>

          <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
            <span className="text-[10px] font-mono text-graphite-400 uppercase block">Dataset Provenance</span>
            <span className="text-xs font-semibold text-graphite mt-1 block truncate">
              Calibrated Offline (2019–2023)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-light">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleGenerate(true, false)}
              disabled={isGeneratingRiskBrief}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-accent-600 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingRiskBrief ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Interpreting Research Pack...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>{riskBrief ? 'Regenerate CRO Brief' : 'Generate CRO Brief'}</span>
                </>
              )}
            </button>

            {/* Offline Grounded Mock Brief for Demo/Verification */}
            <button
              onClick={() => handleGenerate(true, true)}
              disabled={isGeneratingRiskBrief}
              title="Run with deterministic offline grounded brief (ideal for testing without external Gemini API key)"
              className="px-3 py-2 bg-ivory-200 text-graphite border border-border rounded-lg text-xs font-medium hover:bg-ivory-300 transition-colors cursor-pointer"
            >
              Run Grounded Demo Brief
            </button>

            {riskBrief && (
              <button
                onClick={clearRiskBrief}
                className="px-3 py-2 text-xs text-graphite-400 hover:text-graphite transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {riskBrief && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-graphite hover:bg-ivory-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? 'Copied Memo' : 'Copy Brief'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white border border-border rounded-lg text-xs text-graphite hover:bg-ivory-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={12} />
                <span>Print Memo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unconfigured Alert / Fallback Notice */}
      {riskBriefStatus === 'NOT_CONFIGURED' && !riskBrief && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900">
                Gemini API Key Required for Live AI Interpretation
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                To connect live Google Gemini, configure <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[11px]">GEMINI_API_KEY</code> in your environment or <code className="px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[11px]">.env</code> file.
                Your key remains strictly server-side and is never sent to the browser.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleGenerate(true, true)}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-medium hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  Load Grounded Demo Brief (Offline Mode)
                </button>
                <span className="text-[11px] text-amber-700">
                  Runs full numerical grounding validation on active quantitative metrics.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Failed Error Box */}
      {riskBriefStatus === 'VALIDATION_FAILED' && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-xl space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Numerical Grounding Validation Rejected AI Output</h3>
              <p className="text-xs text-red-700 mt-0.5">
                {riskBriefError || 'The generated AI response violated strict quantitative grounding rules.'}
              </p>
              {riskBriefDetails.length > 0 && (
                <ul className="mt-2 text-[11px] font-mono text-red-800 list-disc list-inside space-y-1">
                  {riskBriefDetails.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {riskBriefStatus === 'ERROR' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <XCircle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-800">{riskBriefError}</p>
        </div>
      )}

      {/* Empty State */}
      {!riskBrief && riskBriefStatus === 'IDLE' && (
        <div className="p-12 bg-white border border-border rounded-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent-muted flex items-center justify-center mx-auto text-accent">
            <FileText size={22} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-semibold text-graphite">No Briefing Generated Yet</h3>
            <p className="text-xs text-graphite-500 mt-1 leading-relaxed">
              Click <strong>Generate CRO Brief</strong> to compile the deterministic Research Pack across all 5 engines and receive an evidence-grounded risk briefing.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => handleGenerate(false, false)}
              className="px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-600 transition-colors cursor-pointer"
            >
              Generate Live Brief
            </button>
            <button
              onClick={() => handleGenerate(false, true)}
              className="px-4 py-2 bg-ivory-200 text-graphite border border-border rounded-lg text-xs font-medium hover:bg-ivory-300 transition-colors cursor-pointer"
            >
              Load Demo Brief
            </button>
          </div>
        </div>
      )}

      {/* Structured CRO Briefing Document */}
      <AnimatePresence>
        {riskBrief && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* 1. Executive Observation */}
            <div className="p-6 bg-white border border-border rounded-xl shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold">
                  EXECUTIVE OBSERVATION
                </span>
                <span className="text-[10px] font-mono text-graphite-400">· CHIEF RISK OFFICER MEMO</span>
              </div>
              <p className="editorial-lg text-xl text-graphite leading-relaxed font-medium">
                "{riskBrief.executiveObservation}"
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-mono text-graphite-400 border-t border-border-light pt-3">
                <span>Model: <strong className="text-graphite">{riskBrief.modelIdentifier}</strong></span>
                <span>Pack Fingerprint: <code className="bg-ivory-200 px-1.5 py-0.5 rounded text-graphite">{riskBrief.researchPackFingerprint}</code></span>
                <span>Generated: {new Date(riskBrief.generatedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* 2. Evidence Board */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide">
                    Evidence Board
                  </h3>
                  <p className="text-xs text-graphite-500">
                    Citations directly mapped to deterministic BLACKBOX X engine outputs. Click any card to inspect.
                  </p>
                </div>
                <span className="text-xs font-mono text-graphite-400">
                  {riskBrief.evidenceSummary.length} Verified Claims
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {riskBrief.evidenceSummary.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    onClick={() => setActiveSection(ev.targetWorkspace)}
                    className="p-4 bg-white border border-border rounded-xl hover:border-accent/40 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-ivory-200 text-graphite-600 uppercase border border-border-light">
                        {ev.sourceEngine}
                      </span>
                      <span className="text-[11px] text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open Workspace</span>
                        <ArrowRight size={11} />
                      </span>
                    </div>

                    <p className="text-xs text-graphite font-medium leading-relaxed">
                      {ev.statement}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-border-light">
                      {ev.metricReferences.map((ref, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-1.5 py-0.5 rounded bg-ivory-100 font-mono text-[10px] text-graphite-500 border border-border-light"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Trade-offs & Contradictions */}
            {riskBrief.contradictions.length > 0 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide">
                    Analytical Tensions & Contradictions
                  </h3>
                  <p className="text-xs text-graphite-500">
                    Structural trade-offs identified between competing quantitative indicators.
                  </p>
                </div>

                <div className="space-y-3">
                  {riskBrief.contradictions.map((c, idx) => (
                    <div key={c.id || idx} className="p-5 bg-white border border-border rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        <h4 className="text-xs font-semibold text-graphite uppercase tracking-wider font-mono">
                          {c.tension}
                        </h4>
                      </div>

                      <p className="text-xs text-graphite-600 leading-relaxed">
                        {c.description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                          <span className="text-[10px] font-mono text-emerald-700 uppercase font-semibold block mb-1">
                            Observed Performance
                          </span>
                          <p className="text-xs text-graphite leading-relaxed">
                            {c.positiveObservation}
                          </p>
                        </div>
                        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <span className="text-[10px] font-mono text-amber-700 uppercase font-semibold block mb-1">
                            Structural Offset / Trade-off
                          </span>
                          <p className="text-xs text-graphite leading-relaxed">
                            {c.negativeTradeoff}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Structural Risk Factors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide">
                    Structural Risk Factors
                  </h3>
                  <p className="text-xs text-graphite-500">
                    Quantitative vulnerability factors categorized by objective risk severity.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {riskBrief.riskFactors.map((rf, idx) => {
                  const severityStyle = rf.severity === 'HIGH'
                    ? 'bg-red-500/10 text-red-700 border-red-500/20'
                    : rf.severity === 'MODERATE'
                    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';

                  return (
                    <div key={rf.id || idx} className="p-4 bg-white border border-border rounded-xl space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-semibold border ${severityStyle}`}>
                            {rf.severity} RISK
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-graphite mb-1">
                          {rf.title}
                        </h4>
                        <p className="text-xs text-graphite-500 leading-relaxed">
                          {rf.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border-light flex flex-wrap gap-1">
                        {rf.evidenceRefs.map((r, ri) => (
                          <span key={ri} className="text-[9px] font-mono text-graphite-400 bg-ivory-100 px-1 py-0.5 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Stress Testing Assessment */}
            <div className="p-5 bg-white border border-border rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-accent" />
                  <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide">
                    Stress Assessment — Time-Travel Macro Shock Lab
                  </h3>
                </div>
                {riskBrief.stressAssessment.executed ? (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/20">
                    SCENARIO: {riskBrief.stressAssessment.scenarioName}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-graphite-400">
                    NO SCENARIO EXECUTED
                  </span>
                )}
              </div>

              {/* Stress Metrics Cards (calculated from engine) */}
              {stressResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
                    <span className="text-[10px] font-mono text-graphite-400 block">Baseline Drawdown</span>
                    <span className="text-sm font-mono font-semibold text-graphite mt-0.5 block">
                      {stressResult.comparison.baselineDrawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                    <span className="text-[10px] font-mono text-red-700 block">Stressed Drawdown</span>
                    <span className="text-sm font-mono font-semibold text-red-600 mt-0.5 block">
                      {stressResult.comparison.stressedDrawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
                    <span className="text-[10px] font-mono text-graphite-400 block">Capital Destruction</span>
                    <span className="text-sm font-mono font-semibold text-graphite mt-0.5 block">
                      ${Math.abs(stressResult.comparison.capitalDelta).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-ivory-100 rounded-lg border border-border-light">
                    <span className="text-[10px] font-mono text-graphite-400 block">Recovery Time</span>
                    <span className="text-sm font-mono font-semibold text-graphite mt-0.5 block">
                      {stressResult.comparison.recoveryDays} Days
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-ivory-50 rounded-lg border border-border-light space-y-2">
                <p className="text-xs text-graphite-600 leading-relaxed font-medium">
                  {riskBrief.stressAssessment.summary}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-graphite-500 pt-1">
                  <div><strong>Drawdown Impact:</strong> {riskBrief.stressAssessment.drawdownImpact}</div>
                  <div><strong>Recovery Dynamics:</strong> {riskBrief.stressAssessment.recoveryEvaluation}</div>
                </div>
              </div>

              {!riskBrief.stressAssessment.executed && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-graphite-400">
                    Stress Lab has not been executed for this state. Run a macro shock scenario to analyze tail risk.
                  </span>
                  <button
                    onClick={() => setActiveSection('stress')}
                    className="px-3 py-1.5 bg-graphite text-white rounded text-xs font-medium hover:bg-graphite-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Stress Lab</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* 6. Robustness & Market Relationships Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Robustness Assessment */}
              <div className="p-5 bg-white border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders size={14} className="text-accent" />
                    <h3 className="text-xs font-semibold text-graphite uppercase tracking-wide">
                      Robustness & Sensitivity
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSection('robustness')}
                    className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lab</span>
                    <ArrowRight size={10} />
                  </button>
                </div>

                <p className="text-xs text-graphite-600 leading-relaxed">
                  {riskBrief.robustnessAssessment.summary}
                </p>

                <div className="text-xs text-graphite-500 space-y-1 pt-1">
                  <p><strong>Parameter Sensitivity:</strong> {riskBrief.robustnessAssessment.parameterSensitivity}</p>
                  {riskBrief.robustnessAssessment.fragilityNotes && (
                    <p className="text-amber-700"><strong>Fragility Notes:</strong> {riskBrief.robustnessAssessment.fragilityNotes}</p>
                  )}
                </div>
              </div>

              {/* Relationship Assessment */}
              <div className="p-5 bg-white border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch size={14} className="text-accent" />
                    <h3 className="text-xs font-semibold text-graphite uppercase tracking-wide">
                      Market Relationships (Strategy Genome)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSection('genome')}
                    className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Genome</span>
                    <ArrowRight size={10} />
                  </button>
                </div>

                <p className="text-xs text-graphite-600 leading-relaxed">
                  {riskBrief.relationshipAssessment.summary}
                </p>

                <div className="text-xs text-graphite-500 space-y-1 pt-1">
                  <p><strong>Correlation Topology:</strong> {riskBrief.relationshipAssessment.correlationStructure}</p>
                  {riskBrief.relationshipAssessment.genomeTopologyComment && (
                    <p><strong>Structural Note:</strong> {riskBrief.relationshipAssessment.genomeTopologyComment}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 7. Next Research Hypotheses */}
            <div className="p-5 bg-white border border-border rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-graphite uppercase tracking-wide">
                  Next Research Hypotheses (Non-Directional Testing)
                </h3>
                <p className="text-xs text-graphite-500">
                  Actionable quantitative questions to stress-test your strategy hypotheses.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {riskBrief.researchQuestions.map((rq, idx) => (
                  <div
                    key={rq.id || idx}
                    className="p-4 bg-ivory-100 rounded-lg border border-border-light flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-graphite leading-relaxed">
                        "{rq.question}"
                      </p>
                      <p className="text-[11px] text-graphite-400 mt-1 leading-relaxed">
                        Rationale: {rq.rationale}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border-light flex items-center justify-between">
                      <span className="text-[10px] font-mono text-graphite-400 uppercase">
                        Target: {rq.targetSection}
                      </span>
                      <button
                        onClick={() => setActiveSection(rq.targetSection)}
                        className="px-2.5 py-1 bg-white border border-border rounded text-[11px] font-medium text-accent hover:bg-accent hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{rq.actionLabel}</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Audit Trail & Data Provenance */}
            <div className="p-4 bg-ivory-200 border border-border rounded-xl text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-graphite-500 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <Database size={12} className="text-accent" />
                  <strong>DATA PROVENANCE:</strong> {riskBrief.datasetProvenance}
                </span>
                <span>FINGERPRINT: <code className="bg-white px-1.5 py-0.5 rounded border border-border-light">{riskBrief.researchPackFingerprint}</code></span>
              </div>

              <div className="text-[11px] text-graphite-400 border-t border-border-light pt-2 space-y-1">
                {riskBrief.limitations.map((lim, li) => (
                  <p key={li}>• {lim}</p>
                ))}
              </div>

              <p className="text-[10px] text-graphite-400 italic pt-1">
                {riskBrief.disclaimer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
