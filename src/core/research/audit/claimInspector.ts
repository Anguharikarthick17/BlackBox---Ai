/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Claim Inspection & Empirical Grounding Verifier
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 11)
 */

import { ResearchCase, ClaimInspectionDetail } from './auditTypes';

export class ClaimInspector {
  /**
   * Resolves complete provenance and empirical backing for a specific research claim.
   * Strictly separates DIRECT EVIDENCE from ANALYTICAL INTERPRETATION.
   */
  public static inspectClaim(
    caseData: ResearchCase,
    claimId: string
  ): ClaimInspectionDetail {
    const claim = caseData.manifest.research.claims.find(c => c.claimId === claimId);
    if (!claim) {
      throw new Error(`Claim inspection error: Claim "${claimId}" does not exist in case ${caseData.caseId}.`);
    }

    if (!claim.evidenceIds || claim.evidenceIds.length === 0) {
      throw new Error(
        `Unsupported claim rejection: Claim "${claimId}" lacks bound evidence records. ` +
        `Institutional research protocol forbids unsubstantiated numerical claims.`
      );
    }

    const primaryEvidenceId = claim.evidenceIds[0];
    const evidence = caseData.evidence.find(e => e.evidenceId === primaryEvidenceId);

    if (!evidence) {
      throw new Error(
        `Grounding failure: Evidence record "${primaryEvidenceId}" bound to claim "${claimId}" is missing from case file.`
      );
    }

    // Strict Separation Verification: Direct evidence statement must be distinct from interpretation
    const directStatement = evidence.directEvidence.trim();
    const interpretationStatement = evidence.interpretation.trim();
    const separationVerified = directStatement.length > 0 && directStatement !== interpretationStatement;

    const engineVersion = caseData.manifest.engines.toolVersions[evidence.toolName] || '1.0.0';

    return {
      claimId: claim.claimId,
      metric: claim.metric,
      value: claim.value,
      claimText: `Claim ${claim.claimId}: ${claim.metric} = ${claim.value}`,

      directEvidenceStatement: directStatement,
      analyticalInterpretation: interpretationStatement,
      separationVerified,

      evidenceId: evidence.evidenceId,
      experimentId: evidence.experimentId,
      toolName: evidence.toolName,
      arguments: { ...evidence.arguments },
      dataWindow: { ...evidence.dataWindow },
      engineVersion,
      seed: caseData.manifest.simulation.seed,
      evidenceFingerprint: evidence.fingerprint,
      sessionFingerprint: caseData.sessionFingerprint,
    };
  }

  /**
   * Inspects all claims in a case and flags any unsupported or ungrounded assertions.
   */
  public static inspectAllClaims(caseData: ResearchCase): {
    inspections: ClaimInspectionDetail[];
    unsupportedClaims: string[];
    allSeparationsVerified: boolean;
  } {
    const inspections: ClaimInspectionDetail[] = [];
    const unsupportedClaims: string[] = [];
    let allSeparationsVerified = true;

    for (const claim of caseData.manifest.research.claims) {
      try {
        const detail = this.inspectClaim(caseData, claim.claimId);
        inspections.push(detail);
        if (!detail.separationVerified) {
          allSeparationsVerified = false;
        }
      } catch (err: any) {
        unsupportedClaims.push(claim.claimId);
        allSeparationsVerified = false;
      }
    }

    return {
      inspections,
      unsupportedClaims,
      allSeparationsVerified,
    };
  }
}
