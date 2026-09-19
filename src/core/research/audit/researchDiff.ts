/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Neutral Research Diff Engine
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 9)
 * Note: Epistemic Neutrality Protocol strictly forbids rankings or subjective adjectives.
 */

import { ResearchCase, ResearchDiffResult, ResearchDiffSection, QuantitativeMetricDelta, CategoricalDelta, DiffDirection } from './auditTypes';
import { compareValues } from './canonicalReproducibility';

const PROHIBITED_EVALUATIVE_TERMS = [
  'better', 'worse', 'best', 'worst', 'superior', 'inferior',
  'winner', 'loser', 'outperform', 'underperform', 'good', 'bad',
];

/**
 * Validates that a string adheres strictly to the epistemic neutrality protocol.
 */
export function assertNeutrality(text: string): boolean {
  const lower = text.toLowerCase();
  for (const term of PROHIBITED_EVALUATIVE_TERMS) {
    // Check word boundaries
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(lower)) {
      throw new Error(
        `Epistemic neutrality violation: Diff text contains subjective evaluative adjective "${term}". ` +
        `The Research Diff Engine must report only objective mathematical deltas without ranking cases.`
      );
    }
  }
  return true;
}

function computeDirection(a: number, b: number): DiffDirection {
  if (Math.abs(b - a) < 1e-12) return 'IDENTICAL';
  return b > a ? 'INCREASED' : 'DECREASED';
}

function computeQuantDelta(
  metric: string,
  valA: number,
  valB: number
): QuantitativeMetricDelta {
  const absDelta = Math.abs(valB - valA);
  const denom = Math.abs(valA) > 1e-12 ? Math.abs(valA) : 1.0;
  const relPct = ((valB - valA) / denom) * 100;
  const comp = compareValues(metric, valA, valB);

  return {
    metric,
    caseAValue: valA,
    caseBValue: valB,
    absoluteDelta: absDelta,
    relativeDeltaPct: Math.round(relPct * 100) / 100,
    direction: computeDirection(valA, valB),
    comparisonClass: comp.comparisonClass,
  };
}

export class ResearchDiffEngine {
  /**
   * Compares two ResearchCases across all 12 dimensions with strict epistemic neutrality.
   */
  public static compareCases(
    caseA: ResearchCase,
    caseB: ResearchCase
  ): ResearchDiffResult {
    const manA = caseA.manifest;
    const manB = caseB.manifest;

    // 1. SETUP SECTION
    const setupCategorical: CategoricalDelta[] = [
      { dimension: 'Question', caseAValue: caseA.question, caseBValue: caseB.question, identical: caseA.question === caseB.question },
      { dimension: 'Case Status', caseAValue: caseA.status, caseBValue: caseB.status, identical: caseA.status === caseB.status },
    ];
    const setupSection: ResearchDiffSection = {
      sectionName: 'Case Setup & Status',
      categoricalDeltas: setupCategorical,
      quantitativeDeltas: [],
    };

    // 2. DATA SECTION
    const dataCategorical: CategoricalDelta[] = [
      { dimension: 'Start Date', caseAValue: manA.data.startDate, caseBValue: manB.data.startDate, identical: manA.data.startDate === manB.data.startDate },
      { dimension: 'End Date', caseAValue: manA.data.endDate, caseBValue: manB.data.endDate, identical: manA.data.endDate === manB.data.endDate },
      { dimension: 'Asset Universe', caseAValue: manA.data.assetUniverse.join(', '), caseBValue: manB.data.assetUniverse.join(', '), identical: JSON.stringify(manA.data.assetUniverse) === JSON.stringify(manB.data.assetUniverse) },
      { dimension: 'Dataset Fingerprint', caseAValue: manA.data.datasetFingerprint, caseBValue: manB.data.datasetFingerprint, identical: manA.data.datasetFingerprint === manB.data.datasetFingerprint },
    ];
    const dataQuant: QuantitativeMetricDelta[] = [
      computeQuantDelta('observationCount', manA.data.observationCount, manB.data.observationCount),
    ];
    const dataSection: ResearchDiffSection = {
      sectionName: 'Data & Asset Universe',
      categoricalDeltas: dataCategorical,
      quantitativeDeltas: dataQuant,
    };

    // 3. STRATEGY SECTION
    const stratCategorical: CategoricalDelta[] = [
      { dimension: 'Strategy', caseAValue: manA.strategy.strategy, caseBValue: manB.strategy.strategy, identical: manA.strategy.strategy === manB.strategy.strategy },
      { dimension: 'Parameters', caseAValue: JSON.stringify(manA.strategy.parameters), caseBValue: JSON.stringify(manB.strategy.parameters), identical: JSON.stringify(manA.strategy.parameters) === JSON.stringify(manB.strategy.parameters) },
      { dimension: 'Execution Convention', caseAValue: manA.strategy.executionConvention, caseBValue: manB.strategy.executionConvention, identical: manA.strategy.executionConvention === manB.strategy.executionConvention },
    ];
    const stratQuant: QuantitativeMetricDelta[] = [
      computeQuantDelta('transactionCostBps', manA.strategy.transactionCostBps, manB.strategy.transactionCostBps),
    ];
    const strategySection: ResearchDiffSection = {
      sectionName: 'Strategy & Execution Parameters',
      categoricalDeltas: stratCategorical,
      quantitativeDeltas: stratQuant,
    };

    // 4. PORTFOLIO SECTION
    const portCategorical: CategoricalDelta[] = [
      { dimension: 'Rebalance Policy', caseAValue: manA.portfolio.rebalancePolicy, caseBValue: manB.portfolio.rebalancePolicy, identical: manA.portfolio.rebalancePolicy === manB.portfolio.rebalancePolicy },
      { dimension: 'Target Weights', caseAValue: JSON.stringify(manA.portfolio.weights), caseBValue: JSON.stringify(manB.portfolio.weights), identical: JSON.stringify(manA.portfolio.weights) === JSON.stringify(manB.portfolio.weights) },
    ];
    const portfolioSection: ResearchDiffSection = {
      sectionName: 'Portfolio Allocation & Rebalance Policy',
      categoricalDeltas: portCategorical,
      quantitativeDeltas: [],
    };

    // 5. SIMULATION SECTION
    const simCategorical: CategoricalDelta[] = [
      { dimension: 'Simulation Method', caseAValue: manA.simulation.method, caseBValue: manB.simulation.method, identical: manA.simulation.method === manB.simulation.method },
    ];
    const simQuant: QuantitativeMetricDelta[] = [
      computeQuantDelta('seed', manA.simulation.seed, manB.simulation.seed),
      computeQuantDelta('pathCount', manA.simulation.pathCount, manB.simulation.pathCount),
      computeQuantDelta('horizonDays', manA.simulation.horizonDays, manB.simulation.horizonDays),
    ];
    const simulationSection: ResearchDiffSection = {
      sectionName: 'Simulation Configuration',
      categoricalDeltas: simCategorical,
      quantitativeDeltas: simQuant,
    };

    // 6. REGIME SECTION
    const regimeCategorical: CategoricalDelta[] = [
      { dimension: 'Starting Regime', caseAValue: manA.simulation.startingRegime || 'DEFAULT', caseBValue: manB.simulation.startingRegime || 'DEFAULT', identical: manA.simulation.startingRegime === manB.simulation.startingRegime },
    ];
    const regimeSection: ResearchDiffSection = {
      sectionName: 'Regime Intelligence',
      categoricalDeltas: regimeCategorical,
      quantitativeDeltas: [],
    };

    // 7. HYPOTHESES SECTION
    const hypCategorical: CategoricalDelta[] = [
      { dimension: 'Hypothesis Count', caseAValue: String(caseA.hypotheses.length), caseBValue: String(caseB.hypotheses.length), identical: caseA.hypotheses.length === caseB.hypotheses.length },
    ];
    const hypothesesSection: ResearchDiffSection = {
      sectionName: 'Research Hypotheses',
      categoricalDeltas: hypCategorical,
      quantitativeDeltas: [
        computeQuantDelta('hypothesisCount', caseA.hypotheses.length, caseB.hypotheses.length),
      ],
    };

    // 8. EXPERIMENTS SECTION
    const expSection: ResearchDiffSection = {
      sectionName: 'Planned Experiment DAG',
      categoricalDeltas: [
        { dimension: 'Experiment Count', caseAValue: String(caseA.experiments.length), caseBValue: String(caseB.experiments.length), identical: caseA.experiments.length === caseB.experiments.length },
      ],
      quantitativeDeltas: [
        computeQuantDelta('experimentCount', caseA.experiments.length, caseB.experiments.length),
      ],
    };

    // 9. EVIDENCE SECTION
    const evSection: ResearchDiffSection = {
      sectionName: 'Evidence Records',
      categoricalDeltas: [
        { dimension: 'Evidence Count', caseAValue: String(caseA.evidence.length), caseBValue: String(caseB.evidence.length), identical: caseA.evidence.length === caseB.evidence.length },
      ],
      quantitativeDeltas: [
        computeQuantDelta('evidenceCount', caseA.evidence.length, caseB.evidence.length),
      ],
    };

    // 10. CLAIMS SECTION
    const claimsQuant: QuantitativeMetricDelta[] = [];
    const claimsA = manA.research.claims || [];
    const claimsB = manB.research.claims || [];

    for (const ca of claimsA) {
      const cb = claimsB.find(c => c.metric === ca.metric);
      if (cb && typeof ca.value === 'number' && typeof cb.value === 'number') {
        claimsQuant.push(computeQuantDelta(ca.metric, ca.value, cb.value));
      }
    }

    const claimsSection: ResearchDiffSection = {
      sectionName: 'Empirical Research Claims',
      categoricalDeltas: [
        { dimension: 'Claim Count', caseAValue: String(claimsA.length), caseBValue: String(claimsB.length), identical: claimsA.length === claimsB.length },
      ],
      quantitativeDeltas: claimsQuant,
    };

    // 11. SYNTHESIS SECTION
    const synSection: ResearchDiffSection = {
      sectionName: 'Research Synthesis',
      categoricalDeltas: [
        { dimension: 'Synthesis Available', caseAValue: String(Boolean(caseA.synthesis)), caseBValue: String(Boolean(caseB.synthesis)), identical: Boolean(caseA.synthesis) === Boolean(caseB.synthesis) },
      ],
      quantitativeDeltas: [],
    };

    // 12. REPRODUCIBILITY SECTION
    const repCategorical: CategoricalDelta[] = [
      { dimension: 'Canonical Output Fingerprint', caseAValue: caseA.reproducibilityMetadata.canonicalOutputFingerprint, caseBValue: caseB.reproducibilityMetadata.canonicalOutputFingerprint, identical: caseA.reproducibilityMetadata.canonicalOutputFingerprint === caseB.reproducibilityMetadata.canonicalOutputFingerprint },
      { dimension: 'Session Fingerprint', caseAValue: caseA.sessionFingerprint, caseBValue: caseB.sessionFingerprint, identical: caseA.sessionFingerprint === caseB.sessionFingerprint },
    ];
    const repQuant: QuantitativeMetricDelta[] = [
      computeQuantDelta('verificationCount', caseA.reproducibilityMetadata.verificationCount, caseB.reproducibilityMetadata.verificationCount),
    ];
    const reproducibilitySection: ResearchDiffSection = {
      sectionName: 'Reproducibility & Lineage Fingerprints',
      categoricalDeltas: repCategorical,
      quantitativeDeltas: repQuant,
    };

    const neutralSummary = `Objective comparative delta between Case ${caseA.caseId} and Case ${caseB.caseId}. ` +
      `Reports parameter variances, observation delta, and empirical claim shifts. Zero qualitative ranking applied.`;

    assertNeutrality(neutralSummary);

    return {
      caseAId: caseA.caseId,
      caseBId: caseB.caseId,
      comparedAt: Date.now(),
      neutralSummary,
      sections: {
        setup: setupSection,
        data: dataSection,
        strategy: strategySection,
        portfolio: portfolioSection,
        simulation: simulationSection,
        regime: regimeSection,
        hypotheses: hypothesesSection,
        experiments: expSection,
        evidence: evSection,
        claims: claimsSection,
        synthesis: synSection,
        reproducibility: reproducibilitySection,
      },
    };
  }
}
