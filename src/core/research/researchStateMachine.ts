/**
 * BLACKBOX X — PHASE 4.0: INSTITUTIONAL RESEARCH WORKSPACE
 * State Machine Transition Validator
 * 
 * Source of Truth: docs/INSTITUTIONAL-RESEARCH-ARCHITECTURE.md
 */

import { ResearchSessionStatus } from './researchTypes';

/**
 * Valid state transitions mapping.
 * 
 * Primary flow:
 * DRAFT -> PLANNING -> RUNNING -> ANALYZING -> CONTRADICTION_CHECK -> SYNTHESIZING -> COMPLETE
 * 
 * Conditional branch:
 * CONTRADICTION_CHECK -> SECONDARY_TEST -> ANALYZING -> CONTRADICTION_CHECK
 * 
 * Failure / Cancellation:
 * Any non-terminal state -> FAILED
 */
const VALID_TRANSITIONS: Record<ResearchSessionStatus, ResearchSessionStatus[]> = {
  DRAFT: ['PLANNING', 'FAILED'],
  PLANNING: ['RUNNING', 'FAILED'],
  RUNNING: ['ANALYZING', 'FAILED'],
  ANALYZING: ['CONTRADICTION_CHECK', 'FAILED'],
  CONTRADICTION_CHECK: ['SECONDARY_TEST', 'SYNTHESIZING', 'FAILED'],
  SECONDARY_TEST: ['ANALYZING', 'FAILED'],
  SYNTHESIZING: ['COMPLETE', 'FAILED'],
  COMPLETE: [], // Terminal
  FAILED: [],   // Terminal
};

export function isValidTransition(
  from: ResearchSessionStatus,
  to: ResearchSessionStatus
): boolean {
  if (from === to) return false;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function validateStateTransition(
  from: ResearchSessionStatus,
  to: ResearchSessionStatus
): void {
  if (!isValidTransition(from, to)) {
    throw new Error(
      `Illegal research state transition: cannot transition from ${from} to ${to}. ` +
      `Permitted target states from ${from}: [${(VALID_TRANSITIONS[from] || []).join(', ')}]`
    );
  }
}
