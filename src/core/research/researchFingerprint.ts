/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * Deterministic Fingerprinting & Canonical Serialization
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import { computeDeterministicHash } from '../researchPack';

/**
 * Canonical JSON serialization with recursively sorted object keys
 * and consistent numerical formatting.
 */
export function canonicalSerialize(obj: any): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj === 'number') {
    if (isNaN(obj)) return '"NaN"';
    if (!isFinite(obj)) return obj > 0 ? '"Infinity"' : '"-Infinity"';
    // Format to fixed 8 decimals if float to prevent minor cross-platform float variances
    return Number.isInteger(obj) ? obj.toString() : obj.toFixed(8);
  }
  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }
  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalSerialize(item)).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    return (
      '{' +
      keys
        .map(k => `${JSON.stringify(k)}:${canonicalSerialize(obj[k])}`)
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(obj);
}

/**
 * Synchronized dataset fingerprint for the canonical 1,825 observation dataset (2019-01-01 to 2023-12-31).
 */
export const DATASET_FINGERPRINT_1825 = 'bx-sync-1825-gold-btc-nvda-v1';

/**
 * Generate a deterministic fingerprint for an experiment invocation.
 */
export function generateExperimentFingerprint(
  toolName: string,
  args: Record<string, any>,
  dataWindow: { startDate: string; endDate: string },
  seed?: number
): string {
  const payload = {
    toolName,
    args,
    dataWindow,
    seed: seed ?? 42,
    dataset: DATASET_FINGERPRINT_1825,
  };
  return computeDeterministicHash(`exp:${canonicalSerialize(payload)}`);
}

/**
 * Generate a deterministic fingerprint for a completed evidence record.
 */
export function generateEvidenceFingerprint(
  experimentId: string,
  toolName: string,
  result: Record<string, any>
): string {
  const payload = {
    experimentId,
    toolName,
    result,
  };
  return computeDeterministicHash(`ev:${canonicalSerialize(payload)}`);
}

/**
 * Generate canonical session fingerprint for full audit reproducibility.
 */
export function generateSessionFingerprint(params: {
  researchQuestion: string;
  datasetFingerprint: string;
  experimentIds: string[];
  hypothesisIds: string[];
  deterministicSeed: number;
  configuration?: Record<string, any>;
}): string {
  const payload = {
    q: params.researchQuestion.trim().toLowerCase(),
    ds: params.datasetFingerprint,
    exp: [...params.experimentIds].sort(),
    hyp: [...params.hypothesisIds].sort(),
    seed: params.deterministicSeed,
    cfg: params.configuration ?? {},
  };
  return computeDeterministicHash(`session:${canonicalSerialize(payload)}`);
}
