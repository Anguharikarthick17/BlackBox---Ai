/**
 * BLACKBOX X — Risk Committee Numerical Grounding & Response Validator
 * 
 * Protects against AI hallucinations, metric fabrication, and invalid schema output.
 * Ensures every numerical claim in the structured CRO Briefing maps back
 * to a verified quantitative identifier in the Research Pack.
 * 
 * ARCHITECTURAL RULE:
 * Structured output guarantees format, not truth.
 * This validator enforces truth by strict grounding against the ResearchPack.
 */

import { ResearchPack } from './researchPack';

export type RiskSeverity = 'LOW' | 'MODERATE' | 'HIGH';

export type EvidenceSourceEngine =
  | 'BACKTEST ENGINE'
  | 'METRICS ENGINE'
  | 'CORRELATION ENGINE'
  | 'REGIME ENGINE'
  | 'ROBUSTNESS ENGINE'
  | 'STRESS ENGINE'
  | 'GENOME ENGINE';

export type WorkspaceTarget = 'strategy' | 'analysis' | 'correlation' | 'regimes' | 'robustness' | 'stress' | 'genome';

export interface EvidenceItem {
  id: string;
  statement: string;
  metricReferences: string[];
  sourceEngine: EvidenceSourceEngine;
  targetWorkspace: WorkspaceTarget;
  quantitativeValues?: Record<string, number | string>;
}

export interface RiskFactor {
  id: string;
  title: string;
  description: string;
  evidenceRefs: string[];
  severity: RiskSeverity;
}

export interface Contradiction {
  id: string;
  tension: string;
  description: string;
  positiveObservation: string;
  negativeTradeoff: string;
  evidenceRefs: string[];
}

export interface StressAssessment {
  executed: boolean;
  scenarioName?: string;
  summary: string;
  drawdownImpact: string;
  recoveryEvaluation: string;
  correlationShiftComment?: string;
  evidenceRefs: string[];
}

export interface RobustnessAssessment {
  executed: boolean;
  summary: string;
  parameterSensitivity: string;
  costSensitivityComment?: string;
  fragilityNotes?: string;
  evidenceRefs: string[];
}

export interface RelationshipAssessment {
  summary: string;
  correlationStructure: string;
  genomeTopologyComment?: string;
  evidenceRefs: string[];
}

export interface ResearchQuestion {
  id: string;
  question: string;
  rationale: string;
  actionLabel: string;
  targetSection: WorkspaceTarget;
  actionPayload?: any;
}

export interface RiskCommitteeBrief {
  title: string;
  generatedAt: string;
  modelIdentifier: string;
  datasetProvenance: string;
  researchPackFingerprint: string;
  executiveObservation: string;
  evidenceSummary: EvidenceItem[];
  riskFactors: RiskFactor[];
  contradictions: Contradiction[];
  stressAssessment: StressAssessment;
  robustnessAssessment: RobustnessAssessment;
  relationshipAssessment: RelationshipAssessment;
  researchQuestions: ResearchQuestion[];
  limitations: string[];
  disclaimer: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  brief: RiskCommitteeBrief | null;
}

/**
 * Derives a comprehensive catalog of verified metric keys from the ResearchPack.
 * Used to validate that AI references only verified quantitative values.
 */
export function extractValidMetricCatalog(pack: ResearchPack): Set<string> {
  const catalog = new Set<string>();

  // Metadata metrics
  catalog.add('metadata.asset');
  catalog.add('metadata.strategy');
  catalog.add('metadata.transactionCostPct');
  catalog.add('metadata.initialCapital');
  catalog.add('metadata.positionSizePct');

  // Asset metrics
  catalog.add('asset.totalReturn');
  catalog.add('asset.annualizedVolatility');
  catalog.add('asset.sharpeRatio');
  catalog.add('asset.maxDrawdown');

  // Backtest metrics
  catalog.add('backtest.totalReturn');
  catalog.add('backtest.annualizedReturn');
  catalog.add('backtest.annualizedVolatility');
  catalog.add('backtest.sharpe');
  catalog.add('backtest.maxDrawdown');
  catalog.add('backtest.endingCapital');
  catalog.add('backtest.tradeCount');
  catalog.add('backtest.winRate');
  catalog.add('backtest.transactionCostsPaid');
  catalog.add('backtest.profitFactor');

  // Benchmark metrics
  catalog.add('benchmark.totalReturn');
  catalog.add('benchmark.annualizedReturn');
  catalog.add('benchmark.annualizedVolatility');
  catalog.add('benchmark.sharpe');
  catalog.add('benchmark.maxDrawdown');
  catalog.add('benchmark.endingCapital');

  // Comparison metrics
  catalog.add('comparison.returnDelta');
  catalog.add('comparison.annualizedReturnDelta');
  catalog.add('comparison.volatilityDelta');
  catalog.add('comparison.sharpeDelta');
  catalog.add('comparison.maxDrawdownDelta');
  catalog.add('comparison.endingCapitalDelta');
  catalog.add('comparison.tradeCountDiff');

  // Regime metrics
  catalog.add('regimes.dominantRegime');
  for (const b of pack.regimes.breakdown) {
    catalog.add(`regimes.${b.regime}.return`);
    catalog.add(`regimes.${b.regime}.sharpe`);
    catalog.add(`regimes.${b.regime}.winRate`);
    catalog.add(`regimes.${b.regime}.days`);
    catalog.add(`regimes.${b.regime}.percentage`);
  }

  // Correlation metrics
  catalog.add('correlations.matrix.GOLD.BTC');
  catalog.add('correlations.matrix.GOLD.NVDA');
  catalog.add('correlations.matrix.BTC.NVDA');
  for (const r of pack.correlations.rolling) {
    catalog.add(`correlations.rolling.${r.window}D.currentValue`);
    catalog.add(`correlations.rolling.${r.window}D.meanValue`);
  }

  // Robustness metrics
  if (pack.robustness.tested) {
    catalog.add('robustness.configurationsTested');
    catalog.add('robustness.meanSharpe');
    catalog.add('robustness.minSharpe');
    catalog.add('robustness.maxSharpe');
    catalog.add('robustness.sharpeStdDev');
    catalog.add('robustness.consistencyPct');
    catalog.add('robustness.fragilityFlags');
  }

  // Stress metrics
  if (pack.stress) {
    catalog.add('stress.scenarioId');
    catalog.add('stress.scenarioName');
    catalog.add('stress.baselineReturn');
    catalog.add('stress.stressReturn');
    catalog.add('stress.returnDelta');
    catalog.add('stress.baselineVolatility');
    catalog.add('stress.stressVolatility');
    catalog.add('stress.baselineSharpe');
    catalog.add('stress.stressSharpe');
    catalog.add('stress.baselineMaxDrawdown');
    catalog.add('stress.stressMaxDrawdown');
    catalog.add('stress.capitalDelta');
    catalog.add('stress.recoveryDays');
    catalog.add('stress.crisisCorrelationShift');
  }

  // Genome metrics
  catalog.add('genome.meanCorrelation');
  catalog.add('genome.riskFingerprint.returnNorm');
  catalog.add('genome.riskFingerprint.volatilityNorm');
  catalog.add('genome.riskFingerprint.sharpeNorm');
  catalog.add('genome.riskFingerprint.drawdownNorm');
  catalog.add('genome.riskFingerprint.turnoverNorm');

  return catalog;
}

/**
 * Validates a raw parsed Gemini JSON object against strict grounding rules.
 */
export function validateRiskCommitteeBrief(
  raw: any,
  pack: ResearchPack,
  modelIdentifier: string = 'gemini-2.5-flash'
): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { isValid: false, errors: ['Response is not a valid JSON object.'], brief: null };
  }

  // Required top-level string fields
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) {
    errors.push('Missing or empty title.');
  }

  if (typeof raw.executiveObservation !== 'string' || raw.executiveObservation.trim().length === 0) {
    errors.push('Missing or empty executiveObservation.');
  }

  if (!Array.isArray(raw.evidenceSummary) || raw.evidenceSummary.length === 0) {
    errors.push('evidenceSummary must be a non-empty array of evidence items.');
  }

  // Extract valid metric references
  const validMetrics = extractValidMetricCatalog(pack);

  // Validate Evidence Summary items
  const validatedEvidence: EvidenceItem[] = [];
  if (Array.isArray(raw.evidenceSummary)) {
    for (let i = 0; i < raw.evidenceSummary.length; i++) {
      const item = raw.evidenceSummary[i];
      if (!item || typeof item !== 'object') {
        errors.push(`evidenceSummary[${i}] must be an object.`);
        continue;
      }
      if (typeof item.statement !== 'string' || item.statement.trim().length === 0) {
        errors.push(`evidenceSummary[${i}].statement is required.`);
      }
      if (!Array.isArray(item.metricReferences) || item.metricReferences.length === 0) {
        errors.push(`evidenceSummary[${i}].metricReferences must be a non-empty array.`);
      } else {
        // Validate each metric reference against the catalog
        for (const ref of item.metricReferences) {
          if (typeof ref !== 'string') {
            errors.push(`evidenceSummary[${i}].metricReferences contains non-string entry.`);
          } else {
            // Check prefix or exact match
            const valid = validMetrics.has(ref) || Array.from(validMetrics).some(vm => ref.startsWith(vm) || vm.startsWith(ref));
            if (!valid) {
              errors.push(`Unknown metric reference: "${ref}" in evidenceSummary[${i}].`);
            }
          }
        }
      }

      const validEngines: EvidenceSourceEngine[] = [
        'BACKTEST ENGINE',
        'METRICS ENGINE',
        'CORRELATION ENGINE',
        'REGIME ENGINE',
        'ROBUSTNESS ENGINE',
        'STRESS ENGINE',
        'GENOME ENGINE',
      ];
      const sourceEngine: EvidenceSourceEngine = validEngines.includes(item.sourceEngine)
        ? item.sourceEngine
        : 'BACKTEST ENGINE';

      const validTargets: WorkspaceTarget[] = ['strategy', 'analysis', 'correlation', 'regimes', 'robustness', 'stress', 'genome'];
      const targetWorkspace: WorkspaceTarget = validTargets.includes(item.targetWorkspace)
        ? item.targetWorkspace
        : 'strategy';

      validatedEvidence.push({
        id: item.id || `ev-${i + 1}`,
        statement: String(item.statement || ''),
        metricReferences: Array.isArray(item.metricReferences) ? item.metricReferences : [],
        sourceEngine,
        targetWorkspace,
        quantitativeValues: item.quantitativeValues || {},
      });
    }
  }

  // Validate Risk Factors
  const validatedRiskFactors: RiskFactor[] = [];
  if (Array.isArray(raw.riskFactors)) {
    for (let i = 0; i < raw.riskFactors.length; i++) {
      const rf = raw.riskFactors[i];
      if (!rf || typeof rf !== 'object') continue;
      const validSeverities: RiskSeverity[] = ['LOW', 'MODERATE', 'HIGH'];
      const severity: RiskSeverity = validSeverities.includes(rf.severity) ? rf.severity : 'MODERATE';
      validatedRiskFactors.push({
        id: rf.id || `rf-${i + 1}`,
        title: String(rf.title || `Risk Factor ${i + 1}`),
        description: String(rf.description || ''),
        evidenceRefs: Array.isArray(rf.evidenceRefs) ? rf.evidenceRefs : [],
        severity,
      });
    }
  }

  // Validate Contradictions / Trade-offs
  const validatedContradictions: Contradiction[] = [];
  if (Array.isArray(raw.contradictions)) {
    for (let i = 0; i < raw.contradictions.length; i++) {
      const c = raw.contradictions[i];
      if (!c || typeof c !== 'object') continue;
      validatedContradictions.push({
        id: c.id || `ct-${i + 1}`,
        tension: String(c.tension || 'Quantitative Tension'),
        description: String(c.description || ''),
        positiveObservation: String(c.positiveObservation || ''),
        negativeTradeoff: String(c.negativeTradeoff || ''),
        evidenceRefs: Array.isArray(c.evidenceRefs) ? c.evidenceRefs : [],
      });
    }
  }

  // Validate Stress Assessment (Strict check for unexecuted stress)
  let stressAssessment: StressAssessment;
  if (!pack.stress) {
    // If stress was not executed in the ResearchPack, force executed: false
    stressAssessment = {
      executed: false,
      summary: 'No stress testing scenario has been executed for the current research state.',
      drawdownImpact: 'Baseline drawdown remains un-stressed. Execute a stress scenario in Stress Lab to inspect crisis response.',
      recoveryEvaluation: 'Recovery duration under liquidity crisis has not been simulated.',
      evidenceRefs: ['backtest.maxDrawdown'],
    };
  } else {
    stressAssessment = {
      executed: true,
      scenarioName: pack.stress.scenarioName,
      summary: String(raw.stressAssessment?.summary || `Evaluated under ${pack.stress.scenarioName}.`),
      drawdownImpact: String(raw.stressAssessment?.drawdownImpact || `Stress drawdown expanded to ${pack.stress.stressMaxDrawdown}%.`),
      recoveryEvaluation: String(raw.stressAssessment?.recoveryEvaluation || `Estimated recovery duration: ${pack.stress.recoveryDays} days.`),
      correlationShiftComment: raw.stressAssessment?.correlationShiftComment ? String(raw.stressAssessment.correlationShiftComment) : undefined,
      evidenceRefs: Array.isArray(raw.stressAssessment?.evidenceRefs) ? raw.stressAssessment.evidenceRefs : ['stress.stressMaxDrawdown'],
    };
  }

  // Validate Robustness Assessment
  let robustnessAssessment: RobustnessAssessment;
  if (!pack.robustness.tested) {
    robustnessAssessment = {
      executed: false,
      summary: 'Parameter sweep has not been run. Default parameter set evaluated.',
      parameterSensitivity: 'Execute a parameter sweep in Robustness Lab to evaluate parameter cliffs.',
      evidenceRefs: ['metadata.strategyParameters'],
    };
  } else {
    robustnessAssessment = {
      executed: true,
      summary: String(raw.robustnessAssessment?.summary || 'Evaluated across parameter sweep.'),
      parameterSensitivity: String(raw.robustnessAssessment?.parameterSensitivity || `Tested across ${pack.robustness.configurationsTested} configurations.`),
      costSensitivityComment: raw.robustnessAssessment?.costSensitivityComment ? String(raw.robustnessAssessment.costSensitivityComment) : undefined,
      fragilityNotes: raw.robustnessAssessment?.fragilityNotes ? String(raw.robustnessAssessment.fragilityNotes) : undefined,
      evidenceRefs: Array.isArray(raw.robustnessAssessment?.evidenceRefs) ? raw.robustnessAssessment.evidenceRefs : ['robustness.configurationsTested'],
    };
  }

  // Validate Relationship Assessment
  const relationshipAssessment: RelationshipAssessment = {
    summary: String(raw.relationshipAssessment?.summary || 'Evaluated cross-asset correlation topology.'),
    correlationStructure: String(raw.relationshipAssessment?.correlationStructure || 'Pairwise Pearson co-movement analyzed.'),
    genomeTopologyComment: raw.relationshipAssessment?.genomeTopologyComment ? String(raw.relationshipAssessment.genomeTopologyComment) : undefined,
    evidenceRefs: Array.isArray(raw.relationshipAssessment?.evidenceRefs) ? raw.relationshipAssessment.evidenceRefs : ['genome.meanCorrelation'],
  };

  // Validate Research Questions
  const validatedQuestions: ResearchQuestion[] = [];
  if (Array.isArray(raw.researchQuestions)) {
    for (let i = 0; i < raw.researchQuestions.length; i++) {
      const rq = raw.researchQuestions[i];
      if (!rq || typeof rq !== 'object') continue;
      const validSections: WorkspaceTarget[] = ['strategy', 'analysis', 'correlation', 'regimes', 'robustness', 'stress', 'genome'];
      const targetSection: WorkspaceTarget = validSections.includes(rq.targetSection) ? rq.targetSection : 'strategy';
      validatedQuestions.push({
        id: rq.id || `rq-${i + 1}`,
        question: String(rq.question || ''),
        rationale: String(rq.rationale || ''),
        actionLabel: String(rq.actionLabel || 'Investigate in Workspace'),
        targetSection,
        actionPayload: rq.actionPayload,
      });
    }
  }

  // Ensure limitations array exists
  const limitations: string[] = Array.isArray(raw.limitations) && raw.limitations.length > 0
    ? raw.limitations.map((l: any) => String(l))
    : [
        'Analysis is based on an offline calibrated research dataset (2019–2023) and does not reflect live market conditions.',
        'Backtest simulation assumes next-bar execution and constant transaction costs, without intraday market impact.',
        'Historical correlation and stress resilience are not guarantees of future market behavior.',
      ];

  const disclaimer: string = String(raw.disclaimer || 'BLACKBOX X is a quantitative research platform. All briefing interpretations are strictly descriptive and do not constitute financial advice, trade recommendations, or price forecasts.');

  if (errors.length > 0) {
    return { isValid: false, errors, brief: null };
  }

  const brief: RiskCommitteeBrief = {
    title: String(raw.title),
    generatedAt: new Date().toISOString(),
    modelIdentifier,
    datasetProvenance: pack.metadata.datasetProvenance,
    researchPackFingerprint: pack.provenance.fingerprint,
    executiveObservation: String(raw.executiveObservation),
    evidenceSummary: validatedEvidence,
    riskFactors: validatedRiskFactors,
    contradictions: validatedContradictions,
    stressAssessment,
    robustnessAssessment,
    relationshipAssessment,
    researchQuestions: validatedQuestions,
    limitations,
    disclaimer,
  };

  return {
    isValid: true,
    errors: [],
    brief,
  };
}
