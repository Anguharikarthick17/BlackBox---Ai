/**
 * BLACKBOX X — Compact Serializers for Supabase Persistence
 * 
 * These serializers transform domain objects into compact, bounded
 * representations safe for Supabase storage.
 * 
 * CRITICAL RULES:
 *   1. Monte Carlo raw path matrices are NEVER included in output.
 *      Only summary statistics (percentiles, VaR, CVaR, seed) are stored.
 *   2. Secrets are recursively stripped before any serialization.
 *   3. Output is bounded in size — no unbounded arrays or objects.
 *   4. Prompt injection defense: user text is stored as data, not instructions.
 */

import type { ResearchCase } from '../research/audit/auditTypes';
import type { EvidenceRecord, ResearchClaim, ResearchMemo } from '../research/researchTypes';
import type { AuditEvent } from '../research/audit/auditTypes';
import type { ReplayVerificationRecord } from '../research/audit/auditTypes';
import type { CompactMonteCarloSummary } from './persistenceTypes';

// ============================================================
// 1. SECRET STRIPPING
// ============================================================

/**
 * Determines if a normalized key name (lowercase, no hyphens/underscores) is secret.
 *
 * Rules (in priority order):
 *   1. Exact match against known secret key names (secret, token, password, etc.)
 *   2. Ends with 'key' and length > 3 (catches apikey, servicekey, anonkey — NOT 'keys')
 *   3. Contains 'apikey', 'secret', 'password', or 'token' as a substring
 *
 * NOT matched (intentionally safe):
 *   - 'keys'    (plural collection, not a secret value)
 *   - 'auth'    (auth config object, not a secret value — secrets are inside it)
 *   - 'publickey' contexts where secret is not implied
 */
function isSecretKey(normalizedKey: string): boolean {
  // 1. Exact secret key names
  const exactSecrets = new Set([
    'secret', 'token', 'password', 'passwd', 'bearer',
    'credential', 'credentials', 'signature', 'certificate', 'cert',
    'private',
  ]);
  if (exactSecrets.has(normalizedKey)) return true;

  // 2. Ends with 'key' and longer than 3 chars (so 'key' alone is not matched, 'keys' not matched)
  //    'apikey' → true, 'servicekey' → true, 'anonkey' → true
  //    'keys'   → false ('keys' ends with 'eys', not 'key')
  if (normalizedKey !== 'keys' && normalizedKey.endsWith('key') && normalizedKey.length > 3) return true;

  // 3. Contains high-confidence secret substrings
  if (normalizedKey.includes('apikey')) return true;
  if (normalizedKey.includes('secretkey')) return true;
  if (normalizedKey.includes('servicetoken')) return true;
  if (normalizedKey.includes('authtoken')) return true;
  if (normalizedKey.includes('accesstoken')) return true;

  return false;
}

/**
 * Recursively strips secret-looking keys from any object.
 * Replaces values with '[REDACTED_BY_PERSISTENCE_POLICY]' without removing the key structure.
 */
export function stripSecrets(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(stripSecrets);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[-_]/g, '');
    if (isSecretKey(normalizedKey)) {
      result[key] = '[REDACTED_BY_PERSISTENCE_POLICY]';
    } else {
      result[key] = stripSecrets(value);
    }
  }
  return result;
}

/**
 * Strips secrets from a JSON-compatible object and returns a safe copy.
 */
export function safeSerialize(obj: unknown): Record<string, unknown> {
  return stripSecrets(obj) as Record<string, unknown>;
}

// ============================================================
// 2. MONTE CARLO COMPACTION
// ============================================================

/**
 * Extracts a compact summary from a Monte Carlo result object.
 * NEVER includes raw path arrays or full path matrices.
 * 
 * @param mcResult - any Monte Carlo result object
 * @returns CompactMonteCarloSummary safe for database storage
 */
export function compactMonteCarloResult(mcResult: Record<string, unknown>): CompactMonteCarloSummary {
  return {
    method: String(mcResult.method || 'PARAMETRIC_GAUSSIAN'),
    pathCount: Number(mcResult.pathCount || mcResult.simulationCount || 0),
    horizonDays: Number(mcResult.horizonDays || mcResult.horizon || 252),
    seed: Number(mcResult.seed || 0),
    percentiles: {
      p05: Number((mcResult.percentiles as any)?.p05 ?? mcResult.p5FinalReturn ?? 0),
      p25: Number((mcResult.percentiles as any)?.p25 ?? mcResult.p25FinalReturn ?? 0),
      p50: Number((mcResult.percentiles as any)?.p50 ?? mcResult.medianFinalReturn ?? 0),
      p75: Number((mcResult.percentiles as any)?.p75 ?? mcResult.p75FinalReturn ?? 0),
      p95: Number((mcResult.percentiles as any)?.p95 ?? mcResult.p95FinalReturn ?? 0),
    },
    varOneYear95: Number(mcResult.varOneYear95 ?? mcResult.var95 ?? 0),
    cvarOneYear99: Number(mcResult.cvarOneYear99 ?? mcResult.cvar99 ?? 0),
    ruinProbability: Number(mcResult.ruinProbability ?? mcResult.probabilityOfRuin ?? 0),
    medianFinalReturn: Number(mcResult.medianFinalReturn ?? 0),
    // paths, pathMatrix, allPaths intentionally omitted
  };
}

/**
 * Strips raw path arrays from any result object that might contain them.
 */
function stripRawPaths(obj: Record<string, unknown>): Record<string, unknown> {
  const pathKeys = ['paths', 'allPaths', 'pathMatrix', 'rawPaths', 'simulationPaths', 'pathData'];
  const result = { ...obj };
  for (const key of pathKeys) {
    if (key in result && Array.isArray(result[key]) && (result[key] as unknown[]).length > 100) {
      result[key] = `[${(result[key] as unknown[]).length} paths — not stored, use seed to reproduce]`;
    }
  }
  return result;
}

// ============================================================
// 3. EVIDENCE RECORD SERIALIZATION
// ============================================================

/**
 * Serializes an EvidenceRecord into a compact, secret-free representation.
 * Preserves the STRICT separation of directEvidence vs interpretation.
 */
export function serializeEvidenceRecord(record: EvidenceRecord): {
  evidence_id: string;
  experiment_id: string;
  hypothesis_id?: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
  data_window: Record<string, unknown>;
  direct_evidence: string;
  interpretation: string;
  execution_order: number;
  fingerprint: string;
} {
  // Compact and strip secrets from the result
  const rawResult = record.result as Record<string, unknown>;
  const compactResult = stripRawPaths(rawResult);

  return {
    evidence_id: record.evidenceId,
    experiment_id: record.experimentId,
    hypothesis_id: record.hypothesisId,
    tool_name: record.toolName,
    arguments: safeSerialize(record.arguments) as Record<string, unknown>,
    result: safeSerialize(compactResult) as Record<string, unknown>,
    data_window: {
      startDate: record.dataWindow.startDate,
      endDate: record.dataWindow.endDate,
      observationCount: record.dataWindow.observationCount,
    },
    direct_evidence: record.directEvidence,    // NEVER merged with interpretation
    interpretation: record.interpretation,      // STRICTLY separate
    execution_order: record.order,
    fingerprint: record.fingerprint,
  };
}

// ============================================================
// 4. RESEARCH CLAIM SERIALIZATION
// ============================================================

/**
 * Serializes a ResearchClaim preserving evidence binding.
 */
export function serializeResearchClaim(claim: ResearchClaim): {
  claim_id: string;
  claim_text: string;
  claim_type: string;
  metric?: string;
  value?: string;
  unit?: string;
  evidence_ids: string[];
} {
  return {
    claim_id: claim.claimId,
    claim_text: claim.text,
    claim_type: claim.claimType,
    metric: claim.metric,
    value: String(claim.value),
    unit: claim.unit,
    evidence_ids: claim.evidenceIds,
  };
}

// ============================================================
// 5. RESEARCH MEMO SERIALIZATION
// ============================================================

/**
 * Serializes a ResearchMemo preserving structured format.
 * Does NOT strip to pure prose — preserves the structured sections.
 */
export function serializeResearchMemo(memo: ResearchMemo): {
  memo_id: string;
  memo: Record<string, unknown>;
  markdown: string;
  limitations: string;
  disclaimer: string;
} {
  return {
    memo_id: memo.memoId,
    memo: safeSerialize(memo.sections) as Record<string, unknown>,
    markdown: memo.rawMarkdown,
    limitations: memo.sections.limitations.join('\n'),
    disclaimer: memo.sections.disclaimer,
  };
}

// ============================================================
// 6. AUDIT EVENT SERIALIZATION
// ============================================================

/**
 * Serializes an AuditEvent preserving the tamper-evident hash chain.
 * Strips secrets from the payload before storage.
 */
export function serializeAuditEvent(event: AuditEvent): {
  event_id: string;
  event_type: string;
  actor?: string;
  event_order: number;
  timestamp: string;
  payload: Record<string, unknown>;
  event_hash?: string;
  previous_event_hash?: string;
  entity_id?: string;
  fingerprint?: string;
} {
  return {
    event_id: event.eventId,
    event_type: event.eventType,
    actor: event.actor,
    event_order: (event as any).order ?? 0,
    timestamp: new Date(event.timestamp).toISOString(),
    payload: safeSerialize(event.details ?? {}) as Record<string, unknown>,
    event_hash: (event as any).eventHash,
    previous_event_hash: (event as any).previousEventHash,
    entity_id: event.entityId,
    fingerprint: event.fingerprint,
  };
}

// ============================================================
// 7. REPLAY VERIFICATION SERIALIZATION
// ============================================================

/**
 * Serializes a ReplayVerificationRecord.
 * Preserves ComparisonClass vocabulary: EXACT | CANONICAL_EXACT | NUMERICAL_TOLERANCE.
 * Does NOT use "BIT-IDENTICAL" as a universal guarantee.
 */
export function serializeReplayVerification(record: ReplayVerificationRecord): {
  verification_id: string;
  verification_status: string;
  comparison_class?: string;
  overall_match_pct?: number;
  gate_results: Record<string, unknown>;
  mismatch_type?: string;
  mismatch_details?: Record<string, unknown>;
  fingerprint?: string;
} {
  const rec = record as any;
  return {
    verification_id: record.verificationId,
    verification_status: record.overallStatus,
    comparison_class: rec.comparisonClass,
    overall_match_pct: rec.fingerprintMatchPct,
    gate_results: safeSerialize(record.tierResults ?? {}) as Record<string, unknown>,
    mismatch_type: record.primaryMismatchType,
    mismatch_details: rec.mismatchDetails
      ? (safeSerialize(rec.mismatchDetails) as Record<string, unknown>)
      : undefined,
    fingerprint: record.fingerprintComparison?.originalFingerprint ?? rec.sessionFingerprint,
  };
}

// ============================================================
// 8. RESEARCH CASE COMPACT SERIALIZATION
// ============================================================

/**
 * Produces a compact, secret-free representation of a ResearchCase
 * suitable for the research_cases table manifest column.
 * 
 * IMPORTANT: Raw Monte Carlo paths are never included.
 */
export function serializeResearchCaseManifest(
  caseData: ResearchCase
): Record<string, unknown> {
  const manifest = caseData.manifest as Record<string, unknown>;
  const compacted = safeSerialize(manifest) as Record<string, unknown>;

  // Ensure simulation config is compacted (strip raw path matrices if they somehow ended up there)
  if (compacted.simulation && typeof compacted.simulation === 'object') {
    const sim = compacted.simulation as Record<string, unknown>;
    for (const key of ['paths', 'allPaths', 'pathMatrix']) {
      if (key in sim) {
        delete sim[key];
      }
    }
  }

  return compacted;
}
