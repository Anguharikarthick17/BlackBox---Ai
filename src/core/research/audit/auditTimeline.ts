/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Append-Only Structured Audit Timeline Ledger
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 14)
 */

import { computeDeterministicHash } from '../../researchPack';
import { AuditEvent, AuditEventType } from './auditTypes';

// ============================================================================
// 1. AUDIT EVENT SANITIZATION (ZERO-SECRETS POLICY)
// ============================================================================

const FORBIDDEN_SECRET_KEYS = [
  'key', 'apikey', 'secret', 'token', 'password', 'auth', 'bearer',
  'credential', 'private', 'cert', 'signature',
];

/**
 * Recursively removes any property names containing secret patterns.
 */
export function sanitizeAuditDetails(details: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [k, v] of Object.entries(details)) {
    const lowerKey = k.toLowerCase();
    if (FORBIDDEN_SECRET_KEYS.some(secret => lowerKey.includes(secret))) {
      sanitized[k] = '[REDACTED_BY_AUDIT_POLICY]';
      continue;
    }

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      sanitized[k] = sanitizeAuditDetails(v);
    } else if (Array.isArray(v)) {
      sanitized[k] = v.map(item =>
        item && typeof item === 'object' ? sanitizeAuditDetails(item) : item
      );
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
}

// ============================================================================
// 2. AUDIT TIMELINE LEDGER
// ============================================================================

export class AuditTimelineLedger {
  private events: AuditEvent[] = [];

  constructor(initialEvents?: AuditEvent[]) {
    if (initialEvents && Array.isArray(initialEvents)) {
      this.events = [...initialEvents];
      this.validateMonotonicity();
    }
  }

  /**
   * Appends an immutable structured audit event to the ledger.
   */
  public appendEvent(params: {
    caseId: string;
    eventType: AuditEventType;
    actor?: 'SYSTEM' | 'RESEARCHER' | 'AI_AUDITOR';
    entityId?: string;
    fingerprint?: string;
    details?: Record<string, any>;
    timestamp?: number;
  }): AuditEvent {
    const lastTimestamp = this.events.length > 0 ? this.events[this.events.length - 1].timestamp : 0;
    const now = params.timestamp ?? Date.now();
    const monotonicTimestamp = Math.max(now, lastTimestamp);

    const eventId = `EVT-${monotonicTimestamp}-${this.events.length + 1}`;
    const sanitizedDetails = sanitizeAuditDetails(params.details ?? {});

    const event: AuditEvent = {
      eventId,
      caseId: params.caseId,
      timestamp: monotonicTimestamp,
      eventType: params.eventType,
      entityId: params.entityId,
      actor: params.actor ?? 'SYSTEM',
      fingerprint: params.fingerprint,
      details: Object.freeze(sanitizedDetails),
    };

    this.events.push(Object.freeze(event));
    return event;
  }

  /**
   * Retrieves all recorded audit events, optionally filtered by caseId.
   */
  public getEvents(caseId?: string): ReadonlyArray<AuditEvent> {
    if (caseId) {
      return this.events.filter(e => e.caseId === caseId);
    }
    return [...this.events];
  }

  /**
   * Validates strict monotonic timestamp ordering and integrity.
   */
  public validateMonotonicity(): boolean {
    for (let i = 1; i < this.events.length; i++) {
      if (this.events[i].timestamp < this.events[i - 1].timestamp) {
        throw new Error(
          `Audit timeline corruption: Event ${this.events[i].eventId} has non-monotonic timestamp ` +
          `(${this.events[i].timestamp} < ${this.events[i - 1].timestamp}).`
        );
      }
    }
    return true;
  }

  /**
   * Computes a cryptographic checksum of the entire append-only log.
   */
  public computeTimelineChecksum(): string {
    const summary = this.events
      .map(e => `${e.eventId}:${e.caseId}:${e.timestamp}:${e.eventType}:${e.fingerprint ?? 'none'}`)
      .join('|');
    return computeDeterministicHash(`audit-timeline:${summary}`);
  }

  /**
   * Verifies that the timeline has not been tampered with.
   */
  public verifyIntegrity(expectedChecksum?: string): {
    valid: boolean;
    issues: string[];
    computedChecksum: string;
  } {
    const issues: string[] = [];

    // 1. Monotonicity check
    for (let i = 1; i < this.events.length; i++) {
      if (this.events[i].timestamp < this.events[i - 1].timestamp) {
        issues.push(`Non-monotonic timestamp between event ${i - 1} and ${i}.`);
      }
    }

    // 2. Secret check
    for (const evt of this.events) {
      const serialized = JSON.stringify(evt.details).toLowerCase();
      if (FORBIDDEN_SECRET_KEYS.some(secret => serialized.includes(`"${secret}"`))) {
        issues.push(`Event ${evt.eventId} contains prohibited secret key.`);
      }
    }

    const computedChecksum = this.computeTimelineChecksum();
    if (expectedChecksum && computedChecksum !== expectedChecksum) {
      issues.push(`Timeline checksum mismatch (${computedChecksum} vs ${expectedChecksum}).`);
    }

    return {
      valid: issues.length === 0,
      issues,
      computedChecksum,
    };
  }

  /**
   * Clears the ledger (testing only).
   */
  public clear(): void {
    this.events = [];
  }
}

export const globalAuditTimeline = new AuditTimelineLedger();
