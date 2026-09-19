/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Ghost Mode 2.0 Reproducibility & Drift Insights Generator
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 17)
 */

import { ReplayVerificationRecord, ResearchDiffResult } from './auditTypes';

export type GhostAuditInsightType =
  | 'REPRODUCIBILITY_STABLE'
  | 'PARAMETER_DRIFT'
  | 'DATA_DRIFT'
  | 'EVIDENCE_DRIFT'
  | 'VERSION_DRIFT';

export interface GhostAuditInsight {
  type: GhostAuditInsightType;
  headline: string;
  summary: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata: Record<string, any>;
  timestamp: number;
}

export class GhostModeAuditEngine {
  /**
   * Generates deterministic audit insights from a ReplayVerificationRecord.
   */
  public static evaluateReplayInsights(
    verification: ReplayVerificationRecord
  ): GhostAuditInsight[] {
    const insights: GhostAuditInsight[] = [];
    const now = Date.now();

    if (verification.overallStatus === 'MATCHED') {
      insights.push({
        type: 'REPRODUCIBILITY_STABLE',
        headline: 'Canonical Output Invariance Confirmed',
        summary: `Replay verified with 100% canonical-output reproducibility. Fingerprint ${verification.fingerprintComparison.replayFingerprint} matches original.`,
        severity: 'INFO',
        metadata: {
          caseId: verification.caseId,
          fingerprint: verification.fingerprintComparison.replayFingerprint,
          latencyMs: verification.totalReplayLatencyMs,
        },
        timestamp: now,
      });
    }

    if (verification.allMismatchTypes.includes('CONFIGURATION_MISMATCH')) {
      const mismatches = verification.tierResults.level1Configuration.mismatches;
      insights.push({
        type: 'PARAMETER_DRIFT',
        headline: 'Parameter Friction Drift Detected',
        summary: `Replay diverged on ${mismatches.length} configuration parameter(s) prior to execution.`,
        severity: 'WARNING',
        metadata: { mismatches },
        timestamp: now,
      });
    }

    if (verification.allMismatchTypes.includes('DATA_MISMATCH')) {
      const mismatches = verification.tierResults.level2DataWindow.mismatches;
      insights.push({
        type: 'DATA_DRIFT',
        headline: 'Historical Observation Window Drift',
        summary: `Replay detected altered data window or observation counts (${mismatches.map(m => m.field).join(', ')}).`,
        severity: 'WARNING',
        metadata: { mismatches },
        timestamp: now,
      });
    }

    if (verification.allMismatchTypes.includes('NUMERICAL_MISMATCH')) {
      const mismatches = verification.tierResults.level4EvidenceRecords.numericalMismatches;
      insights.push({
        type: 'EVIDENCE_DRIFT',
        headline: 'Numerical Evidence Divergence',
        summary: `Replay exhibited floating-point deltas exceeding metric tolerance budgets on: ${mismatches.map(m => m.metric).join(', ')}.`,
        severity: 'CRITICAL',
        metadata: { mismatches },
        timestamp: now,
      });
    }

    if (verification.allMismatchTypes.includes('VERSION_MISMATCH')) {
      insights.push({
        type: 'VERSION_DRIFT',
        headline: 'Engine SemVer Incompatibility',
        summary: 'Quantitative engine major version divergence detected. Mathematical models have evolved.',
        severity: 'CRITICAL',
        metadata: {
          caseId: verification.caseId,
          primaryMismatch: verification.primaryMismatchType,
        },
        timestamp: now,
      });
    }

    return insights;
  }

  /**
   * Generates deterministic drift insights from a neutral ResearchDiffResult.
   */
  public static evaluateDiffInsights(diff: ResearchDiffResult): GhostAuditInsight[] {
    const insights: GhostAuditInsight[] = [];
    const now = Date.now();

    // Check strategy cost differences
    const costDelta = diff.sections.strategy.quantitativeDeltas.find(d => d.metric === 'transactionCostBps');
    if (costDelta && costDelta.direction !== 'IDENTICAL') {
      insights.push({
        type: 'PARAMETER_DRIFT',
        headline: 'Transaction Cost Sensitivity Delta',
        summary: `Transaction friction shifted from ${costDelta.caseAValue} bps to ${costDelta.caseBValue} bps (${costDelta.direction}).`,
        severity: 'INFO',
        metadata: { ...costDelta },
        timestamp: now,
      });
    }

    // Check fingerprint parity
    const fpDelta = diff.sections.reproducibility.categoricalDeltas.find(d => d.dimension === 'Canonical Output Fingerprint');
    if (fpDelta && !fpDelta.identical) {
      insights.push({
        type: 'EVIDENCE_DRIFT',
        headline: 'Cross-Case Output Fingerprint Variance',
        summary: `Cases exhibit distinct canonical output fingerprints (${fpDelta.caseAValue} vs ${fpDelta.caseBValue}).`,
        severity: 'INFO',
        metadata: { ...fpDelta },
        timestamp: now,
      });
    }

    return insights;
  }
}
