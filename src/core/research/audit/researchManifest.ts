/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Machine-Readable Research Manifest Factory & Validator
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Sections 5, 6)
 */

import { computeDeterministicHash } from '../../researchPack';
import { ResearchSession, ResearchMemo } from '../researchTypes';
import { DATASET_FINGERPRINT_1825 } from '../researchFingerprint';
import { ACTIVE_ENGINE_VERSIONS } from './versionCompatibility';
import { canonicalStringify } from './canonicalReproducibility';
import { ResearchManifest } from './auditTypes';

// ============================================================================
// 1. PROMPT INJECTION SANITIZATION
// ============================================================================

const INJECTION_PATTERNS = [
  /system\s+override/gi,
  /ignore\s+(all\s+)?prior\s+(instructions|rules)/gi,
  /you\s+are\s+now\s+in\s+developer\s+mode/gi,
  /disregard\s+guardrails/gi,
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /eval\s*\(/gi,
  /new\s+Function\s*\(/gi,
];

/**
 * Sanitizes input research questions and memo text against prompt injection
 * and code execution vectors.
 */
export function sanitizePromptText(text: string): string {
  let sanitized = text;
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED_SECURITY_POLICY]');
  }
  return sanitized.trim();
}

// ============================================================================
// 2. MANIFEST BUILDER
// ============================================================================

export interface BuildManifestOptions {
  caseId: string;
  strategy?: string;
  strategyParams?: Record<string, any>;
  transactionCostBps?: number;
  weights?: Record<string, number>;
  simulationMethod?: 'HISTORICAL_BOOTSTRAP' | 'STUDENT_T' | 'PARAMETRIC_GAUSSIAN' | 'REGIME_SWITCHING_MARKOV';
  pathCount?: number;
  horizonDays?: number;
  startingRegime?: string;
  benchmark?: string;
}

/**
 * Builds a complete, machine-readable ResearchManifest capturing parameter closure.
 */
export function buildResearchManifest(
  session: ResearchSession,
  memo?: ResearchMemo,
  options?: BuildManifestOptions
): ResearchManifest {
  const caseId = options?.caseId || `BBX-CASE-${new Date().getFullYear()}-${session.sessionId.slice(0, 4).toUpperCase()}`;
  const manifestId = `MNF-${caseId}`;
  const nowUtc = new Date().toISOString();

  // 1. DATA SECTION
  const assetUniverse = ['GOLD', 'BTC', 'NVDA'];
  const assetCanonicalOrdering = ['GOLD', 'BTC', 'NVDA'];
  const startDate = session.provenance.dataWindow.startDate || '2019-01-01';
  const endDate = session.provenance.dataWindow.endDate || '2023-12-31';
  const observationCount = session.provenance.dataWindow.observationCount || 1825;
  const datasetFingerprint = session.datasetFingerprint || DATASET_FINGERPRINT_1825;

  // 2. STRATEGY SECTION
  const strategy = options?.strategy || 'MOMENTUM_EMA_CROSS';
  const strategyParams = options?.strategyParams || { fastPeriod: 20, slowPeriod: 50 };
  const transactionCostBps = options?.transactionCostBps ?? 10;
  const benchmark = options?.benchmark || 'BENCHMARK_EQUAL_WEIGHT';

  // 3. PORTFOLIO SECTION
  const weights = options?.weights || { GOLD: 0.33333333, BTC: 0.33333333, NVDA: 0.33333334 };

  // 4. SIMULATION SECTION
  const simMethod = options?.simulationMethod || 'REGIME_SWITCHING_MARKOV';
  const pathCount = Math.min(options?.pathCount ?? 1000, 10000); // Strict 10,000 ceiling
  const horizonDays = options?.horizonDays ?? 252;
  const seed = session.provenance.deterministicSeed ?? 42;
  const startingRegime = options?.startingRegime;

  // 5. ENGINE SECTION
  const engineVersions = { ...ACTIVE_ENGINE_VERSIONS, ...session.provenance.engineVersions };
  const methodologyVersions = {
    methodology: '4.1.0',
    compliance: '2.0.0',
    stress: '3.2.0',
    monteCarlo: '3.8.0',
    regimeMonteCarlo: '3.9.0',
  };
  const toolVersions = {
    get_strategy_metrics: '1.0.0',
    get_benchmark_metrics: '1.0.0',
    get_correlation_matrix: '1.0.0',
    get_drawdown_analysis: '1.0.0',
    get_portfolio_metrics: '1.0.0',
    get_regime_monte_carlo_risk: '1.0.0',
    get_monte_carlo_risk: '1.0.0',
  };

  // 6. RESEARCH SECTION
  const sanitizedQuestion = sanitizePromptText(session.researchQuestion);
  const normalizedQuestion = sanitizedQuestion.toLowerCase();

  const hypotheses = (memo?.sections.hypotheses ?? []).map(h => ({
    id: h.id,
    statement: sanitizePromptText(h.statement),
    category: h.category,
  }));

  // Build experiment DAG description
  const experimentDAG: Array<{ experimentId: string; toolName: string; dependencies: string[] }> = [];
  const experimentArguments: Record<string, Record<string, any>> = {};

  if (memo?.sections.directEvidence) {
    memo.sections.directEvidence.forEach((ev, idx) => {
      const expId = `EXP-${String(idx + 1).padStart(3, '0')}`;
      experimentDAG.push({
        experimentId: expId,
        toolName: ev.toolName,
        dependencies: idx > 0 ? [`EXP-${String(idx).padStart(3, '0')}`] : [],
      });
      experimentArguments[expId] = {
        toolName: ev.toolName,
        dataWindow: { startDate, endDate },
        seed,
      };
    });
  }

  const claims = (memo?.sections.quantitativeFindings ?? []).map(f => ({
    claimId: f.claimId,
    metric: f.metric,
    value: f.value,
    evidenceIds: f.boundEvidence,
  }));

  // 7. SECURITY SECTION
  const draftManifest: Omit<ResearchManifest, 'security'> = {
    manifestVersion: '4.1.0',
    manifestId,
    caseId,
    createdAt: nowUtc,
    data: {
      assetUniverse,
      assetCanonicalOrdering,
      startDate,
      endDate,
      observationCount,
      synchronizationPolicy: 'EXACT_CALENDAR_INTERSECTION',
      datasetFingerprint,
      provenanceSource: 'BLACKBOX_SYNCHRONIZED_PRICE_SERIES',
    },
    strategy: {
      strategy,
      parameters: strategyParams,
      executionConvention: 'NEXT_BAR_OPEN',
      positionSizing: 'EQUAL_WEIGHT',
      transactionCostBps,
      benchmark,
    },
    portfolio: {
      weights,
      rebalancePolicy: 'DAILY',
      optimizationConfig: {
        riskFreeRate: 0.0,
        simplexTolerance: 1e-6,
      },
    },
    simulation: {
      method: simMethod,
      pathCount,
      horizonDays,
      seed,
      startingRegime,
      rebalancingEnabled: true,
    },
    engines: {
      engineVersions,
      methodologyVersions,
      toolVersions,
    },
    research: {
      question: sanitizedQuestion,
      normalizedQuestion,
      hypotheses,
      experimentDAG,
      experimentArguments,
      evidenceIds: session.evidenceIds,
      contradictionIds: session.contradictionIds,
      secondaryTestIds: [],
      claims,
    },
  };

  const payloadChecksum = computeDeterministicHash(
    `manifest:${canonicalStringify(draftManifest)}`
  );

  return {
    ...draftManifest,
    security: {
      secretsExcluded: true,
      apiKeysExcluded: true,
      executableCodeExcluded: true,
      checksum: payloadChecksum,
    },
  };
}

// ============================================================================
// 3. MANIFEST VALIDATOR
// ============================================================================

/**
 * Validates manifest completeness, bounds, and security invariants.
 */
export function validateManifestSchema(manifest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not a valid JSON object.'] };
  }

  // Version check
  if (manifest.manifestVersion !== '4.1.0') {
    errors.push(`Unsupported manifest version: ${manifest.manifestVersion}; expected 4.1.0.`);
  }

  // Section existence
  const requiredSections = ['data', 'strategy', 'portfolio', 'simulation', 'engines', 'research', 'security'];
  for (const sec of requiredSections) {
    if (!manifest[sec] || typeof manifest[sec] !== 'object') {
      errors.push(`Manifest is missing required section: "${sec}".`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Data section checks
  if (!manifest.data.startDate || !manifest.data.endDate || !manifest.data.observationCount) {
    errors.push('Manifest data section missing required temporal parameters.');
  }

  // Simulation bounds check (ceiling: 10,000)
  if (manifest.simulation.pathCount > 10000) {
    errors.push(
      `Simulation path count ${manifest.simulation.pathCount} exceeds maximum security ceiling of 10,000.`
    );
  }

  // Security checks: Check for prohibited keys or arbitrary code
  const serialized = JSON.stringify(manifest).toLowerCase();
  const prohibitedTokens = ['"apikey":', '"api_key":', '"secret":', 'bearer ', 'eval(', 'new function('];
  for (const token of prohibitedTokens) {
    if (serialized.includes(token)) {
      errors.push(`Security violation: Manifest payload contains forbidden token ${token}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
