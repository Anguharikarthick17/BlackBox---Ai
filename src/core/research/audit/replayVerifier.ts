/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Six-Level Replay Verification Algorithm & Structured Mismatch Evaluator
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 8)
 */

import {
  ReplayMismatchType,
  REPLAY_MISMATCH_PRECEDENCE,
  ReplayVerificationRecord,
  ConfigurationMismatch,
  DataWindowMismatch,
  NumericalMismatch,
  EvidenceMismatch,
  ClaimMismatch,
  ResearchCase,
  ResearchManifest,
} from './auditTypes';
import { compareValues, computeCanonicalFingerprint } from './canonicalReproducibility';
import { checkEngineCompatibility } from './versionCompatibility';
import { isToolRegistered } from '../researchToolRegistry';

export interface ReplayExecutionPayload {
  executedManifest: ResearchManifest;
  executedEvidence: Array<{
    evidenceId: string;
    toolName: string;
    result: Record<string, any>;
    directEvidence: string;
  }>;
  totalDurationMs: number;
  runtimeError?: string;
}

/**
 * Resolves the highest-precedence mismatch from an array of detected mismatch codes.
 */
export function resolvePrimaryMismatch(
  mismatches: ReplayMismatchType[]
): { primary?: ReplayMismatchType; precedenceLevel?: number } {
  if (mismatches.length === 0) {
    return { primary: undefined, precedenceLevel: undefined };
  }

  let highest = mismatches[0];
  let minRank = REPLAY_MISMATCH_PRECEDENCE[highest];

  for (const m of mismatches) {
    const rank = REPLAY_MISMATCH_PRECEDENCE[m];
    if (rank < minRank) {
      minRank = rank;
      highest = m;
    }
  }

  return {
    primary: highest,
    precedenceLevel: minRank,
  };
}

/**
 * Executes the 6-level verification audit between the sealed ResearchCase
 * and the replayed execution payload.
 */
export function verifyReplayExecution(
  sealedCase: ResearchCase,
  replayed: ReplayExecutionPayload
): ReplayVerificationRecord {
  const allMismatchTypes: ReplayMismatchType[] = [];
  const origManifest = sealedCase.manifest;
  const replayManifest = replayed.executedManifest;

  // 0. CHECK FOR RUNTIME / WORKER CRASH (Rank 10)
  if (replayed.runtimeError) {
    allMismatchTypes.push('REPLAY_FAILURE');
  }

  // 1. LEVEL 1: CONFIGURATION AUDIT (EXACT)
  const configMismatches: ConfigurationMismatch[] = [];

  // Check transaction costs
  if (origManifest.strategy.transactionCostBps !== replayManifest.strategy.transactionCostBps) {
    configMismatches.push({
      parameterPath: 'strategy.transactionCostBps',
      originalValue: origManifest.strategy.transactionCostBps,
      replayValue: replayManifest.strategy.transactionCostBps,
      precedence: 4,
    });
  }

  // Check strategy parameters
  const origParams = origManifest.strategy.parameters || {};
  const replayParams = replayManifest.strategy.parameters || {};
  for (const key of Object.keys({ ...origParams, ...replayParams })) {
    if (origParams[key] !== replayParams[key]) {
      configMismatches.push({
        parameterPath: `strategy.parameters.${key}`,
        originalValue: origParams[key],
        replayValue: replayParams[key],
        precedence: 4,
      });
    }
  }

  // Check PRNG seed
  if (origManifest.simulation.seed !== replayManifest.simulation.seed) {
    configMismatches.push({
      parameterPath: 'simulation.seed',
      originalValue: origManifest.simulation.seed,
      replayValue: replayManifest.simulation.seed,
      precedence: 4,
    });
  }

  // Check portfolio target weights
  const origWeights = origManifest.portfolio.weights || {};
  const replayWeights = replayManifest.portfolio.weights || {};
  for (const asset of Object.keys({ ...origWeights, ...replayWeights })) {
    const comp = compareValues('portfolio_weights', origWeights[asset], replayWeights[asset]);
    if (!comp.matches) {
      configMismatches.push({
        parameterPath: `portfolio.weights.${asset}`,
        originalValue: origWeights[asset],
        replayValue: replayWeights[asset],
        precedence: 4,
      });
    }
  }

  if (configMismatches.length > 0) {
    allMismatchTypes.push('CONFIGURATION_MISMATCH');
  }

  // 2. LEVEL 2: DATA WINDOW AUDIT (EXACT)
  const dataMismatches: DataWindowMismatch[] = [];
  if (origManifest.data.startDate !== replayManifest.data.startDate) {
    dataMismatches.push({
      field: 'startDate',
      originalValue: origManifest.data.startDate,
      replayValue: replayManifest.data.startDate,
      precedence: 5,
    });
  }
  if (origManifest.data.endDate !== replayManifest.data.endDate) {
    dataMismatches.push({
      field: 'endDate',
      originalValue: origManifest.data.endDate,
      replayValue: replayManifest.data.endDate,
      precedence: 5,
    });
  }
  if (origManifest.data.observationCount !== replayManifest.data.observationCount) {
    dataMismatches.push({
      field: 'observationCount',
      originalValue: origManifest.data.observationCount,
      replayValue: replayManifest.data.observationCount,
      precedence: 5,
    });
  }
  if (origManifest.data.datasetFingerprint !== replayManifest.data.datasetFingerprint) {
    dataMismatches.push({
      field: 'dataFingerprint',
      originalValue: origManifest.data.datasetFingerprint,
      replayValue: replayManifest.data.datasetFingerprint,
      precedence: 5,
    });
  }

  if (dataMismatches.length > 0) {
    allMismatchTypes.push('DATA_MISMATCH');
  }

  // 3. LEVEL 3: EXPERIMENT PLAN & TOOL AUDIT (EXACT)
  const planMismatches: string[] = [];
  const requiredTools = origManifest.research.experimentDAG.map(d => d.toolName);
  for (const tool of requiredTools) {
    if (!isToolRegistered(tool)) {
      planMismatches.push(`Required analytical tool "${tool}" is missing from registry.`);
      allMismatchTypes.push('TOOL_UNAVAILABLE');
    }
  }

  // Check version compatibility
  const verCheck = checkEngineCompatibility(origManifest.engines.engineVersions);
  if (verCheck.status === 'INCOMPATIBLE') {
    allMismatchTypes.push('VERSION_MISMATCH');
    planMismatches.push('Engine semver incompatibility detected across core quantitative engines.');
  }

  // 4. LEVEL 4: EVIDENCE AUDIT (NUMERICAL TOLERANCE & CANONICAL EXACT)
  const evidenceMismatches: EvidenceMismatch[] = [];
  const numericalMismatches: NumericalMismatch[] = [];

  const origEvidence = sealedCase.evidence;
  const replayEvidence = replayed.executedEvidence;

  if (origEvidence.length !== replayEvidence.length) {
    evidenceMismatches.push({
      evidenceId: 'ALL',
      toolName: 'MULTIPLE',
      divergenceType: 'RECORD_COUNT',
      description: `Evidence count diverged: original emitted ${origEvidence.length}, replay emitted ${replayEvidence.length}.`,
      precedence: 7,
    });
    allMismatchTypes.push('EVIDENCE_MISMATCH');
  } else {
    for (let i = 0; i < origEvidence.length; i++) {
      const origItem = origEvidence[i];
      const replayItem = replayEvidence[i];

      if (origItem.toolName !== replayItem.toolName) {
        evidenceMismatches.push({
          evidenceId: origItem.evidenceId,
          toolName: origItem.toolName,
          divergenceType: 'PAYLOAD_SCHEMA',
          description: `Tool mismatch at index ${i}: expected "${origItem.toolName}", got "${replayItem.toolName}".`,
          precedence: 7,
        });
        allMismatchTypes.push('EVIDENCE_MISMATCH');
        continue;
      }

      // Check numerical results using Metric-Specific Tolerances
      const origRes = origItem.result || {};
      const replayRes = replayItem.result || {};

      for (const key of Object.keys(origRes)) {
        // Skip non-deterministic wall-clock runtime/latency metrics
        if (key === 'executionDurationMs' || key === 'executionLatencyMs' || key === 'latencyMs' || key === 'runtimeMs') {
          continue;
        }
        const valOrig = origRes[key];
        const valReplay = replayRes[key];

        if (typeof valOrig === 'number') {
          const comp = compareValues(key, valOrig, valReplay);
          if (!comp.matches) {
            numericalMismatches.push({
              metric: key,
              comparisonClass: 'NUMERICAL_TOLERANCE',
              toleranceBudget: comp.tolerance,
              originalValue: valOrig,
              replayValue: valReplay,
              absoluteDelta: comp.delta,
              relativeDeltaPct: comp.relativeDeltaPct,
              withinTolerance: false,
              precedence: 6,
            });
            allMismatchTypes.push('NUMERICAL_MISMATCH');
          }
        }
      }
    }
  }

  // 5. LEVEL 5: RESEARCH CLAIM AUDIT (EXACT EVIDENCE BINDING & VALUE WITHIN TOLERANCE)
  const claimMismatches: ClaimMismatch[] = [];
  for (const claim of origManifest.research.claims) {
    if (!claim.evidenceIds || claim.evidenceIds.length === 0) {
      claimMismatches.push({
        claimId: claim.claimId,
        metric: claim.metric,
        originalClaimText: `Claim ${claim.claimId}`,
        boundEvidenceId: 'NONE',
        replayedEvidenceValue: 'UNBOUND',
        reason: 'Claim has no bound evidence record.',
        precedence: 8,
      });
      allMismatchTypes.push('CLAIM_MISMATCH');
      continue;
    }

    // Check bound evidence
    const boundEv = replayEvidence.find(e => claim.evidenceIds.includes(e.evidenceId));
    if (!boundEv) {
      claimMismatches.push({
        claimId: claim.claimId,
        metric: claim.metric,
        originalClaimText: `Claim ${claim.claimId}`,
        boundEvidenceId: claim.evidenceIds.join(','),
        replayedEvidenceValue: 'MISSING_IN_REPLAY',
        reason: 'Bound evidence was not reproduced in replay run.',
        precedence: 8,
      });
      allMismatchTypes.push('CLAIM_MISMATCH');
    }
  }

  // 6. LEVEL 6: SYNTHESIS AUDIT
  const synthesisMismatches: string[] = [];
  if (sealedCase.synthesis && !replayManifest.research.claims.length && sealedCase.synthesis.claims.length > 0) {
    synthesisMismatches.push('Replayed session failed to synthesize claims.');
    allMismatchTypes.push('SYNTHESIS_MISMATCH');
  }

  // 7. COMPUTE REPLAY FINGERPRINT
  const replayFingerprintPayload = {
    caseId: sealedCase.caseId,
    manifestChecksum: replayManifest.security.checksum,
    evidence: replayEvidence.map(ev => ({
      id: ev.evidenceId,
      tool: ev.toolName,
      direct: ev.directEvidence,
      result: ev.result,
    })),
    claims: replayManifest.research.claims,
    seed: replayManifest.simulation.seed,
  };

  const originalFingerprint = sealedCase.reproducibilityMetadata.canonicalOutputFingerprint;
  const replayFingerprint = computeCanonicalFingerprint(replayFingerprintPayload, 'bx-case');
  const identical = originalFingerprint === replayFingerprint && allMismatchTypes.length === 0;

  // Resolve highest-precedence mismatch
  const uniqueMismatches = Array.from(new Set(allMismatchTypes));
  const { primary, precedenceLevel } = resolvePrimaryMismatch(uniqueMismatches);

  let overallStatus: ReplayVerificationRecord['overallStatus'] = 'MATCHED';
  if (allMismatchTypes.includes('VERSION_MISMATCH')) {
    overallStatus = 'INCOMPATIBLE';
  } else if (allMismatchTypes.includes('REPLAY_FAILURE')) {
    overallStatus = 'FAILED';
  } else if (uniqueMismatches.length > 0 || !identical) {
    overallStatus = 'MISMATCHED';
  }

  const verificationId = `VRF-${sealedCase.caseId}-${Date.now()}`;

  return {
    verificationId,
    caseId: sealedCase.caseId,
    replayedAt: Date.now(),
    overallStatus,
    primaryMismatchType: primary,
    mismatchPrecedenceLevel: precedenceLevel,
    allMismatchTypes: uniqueMismatches,
    tierResults: {
      level1Configuration: {
        status: configMismatches.length === 0 ? 'PASS' : 'FAIL',
        mismatches: configMismatches,
      },
      level2DataWindow: {
        status: dataMismatches.length === 0 ? 'PASS' : 'FAIL',
        mismatches: dataMismatches,
      },
      level3ExperimentPlan: {
        status: planMismatches.length === 0 ? 'PASS' : 'FAIL',
        mismatches: planMismatches,
      },
      level4EvidenceRecords: {
        status: evidenceMismatches.length === 0 && numericalMismatches.length === 0 ? 'PASS' : 'FAIL',
        mismatches: evidenceMismatches,
        numericalMismatches,
      },
      level5ResearchClaims: {
        status: claimMismatches.length === 0 ? 'PASS' : 'FAIL',
        mismatches: claimMismatches,
      },
      level6Synthesis: {
        status: synthesisMismatches.length === 0 ? 'PASS' : 'FAIL',
        mismatches: synthesisMismatches,
      },
    },
    fingerprintComparison: {
      originalFingerprint,
      replayFingerprint,
      identical,
    },
    totalReplayLatencyMs: replayed.totalDurationMs,
  };
}
