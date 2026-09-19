/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Local & In-Memory Research Case Repository Store
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 17)
 * Strictly local/in-memory: No external database dependencies.
 */

import { ResearchCase, CaseStatus, ResearchDiffResult } from './auditTypes';
import { evolveCaseStatus, validateResearchCase } from './researchCase';
import { ResearchDiffEngine } from './researchDiff';
import { CaseExportEngine } from './caseExport';

export class ResearchCaseStore {
  private cases: Map<string, Readonly<ResearchCase>> = new Map();

  /**
   * Saves a validated, sealed ResearchCase.
   */
  public saveCase(caseData: Readonly<ResearchCase>): void {
    const validation = validateResearchCase(caseData);
    if (!validation.valid) {
      throw new Error(`Cannot save invalid case "${caseData.caseId}": ${validation.errors.join('; ')}`);
    }
    this.cases.set(caseData.caseId, caseData);
  }

  /**
   * Retrieves a ResearchCase by caseId.
   */
  public getCase(caseId: string): Readonly<ResearchCase> | undefined {
    return this.cases.get(caseId);
  }

  /**
   * Lists all stored ResearchCases ordered by creation timestamp (newest first).
   */
  public listCases(): Readonly<ResearchCase>[] {
    return Array.from(this.cases.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Updates case status in a copy-on-write manner, preserving immutability.
   */
  public updateCaseStatus(
    caseId: string,
    newStatus: CaseStatus,
    options?: { actor?: 'SYSTEM' | 'RESEARCHER' | 'AI_AUDITOR'; reason?: string }
  ): Readonly<ResearchCase> {
    const existing = this.cases.get(caseId);
    if (!existing) {
      throw new Error(`Case "${caseId}" not found in case store.`);
    }

    const evolved = evolveCaseStatus(existing, newStatus, options);
    this.cases.set(caseId, evolved);
    return evolved;
  }

  /**
   * Compares two cases stored in the repository neutrally.
   */
  public compareCases(caseAId: string, caseBId: string): ResearchDiffResult {
    const caseA = this.getCase(caseAId);
    const caseB = this.getCase(caseBId);

    if (!caseA) throw new Error(`Case "${caseAId}" not found in case store.`);
    if (!caseB) throw new Error(`Case "${caseBId}" not found in case store.`);

    return ResearchDiffEngine.compareCases(caseA, caseB);
  }

  /**
   * Exports a stored case to the requested format.
   */
  public exportCase(caseId: string, format: 'json' | 'markdown' | 'html'): string {
    const caseData = this.getCase(caseId);
    if (!caseData) throw new Error(`Case "${caseId}" not found in case store.`);

    if (format === 'json') return CaseExportEngine.exportToJSON(caseData);
    if (format === 'markdown') return CaseExportEngine.exportToMarkdown(caseData);
    return CaseExportEngine.exportToPrintableHTML(caseData);
  }

  /**
   * Returns recent cases up to a specified limit.
   */
  public getRecentCases(limit = 10): Readonly<ResearchCase>[] {
    return this.listCases().slice(0, limit);
  }

  /**
   * Clears the store (for testing).
   */
  public clear(): void {
    this.cases.clear();
  }
}

export const globalResearchCaseStore = new ResearchCaseStore();
