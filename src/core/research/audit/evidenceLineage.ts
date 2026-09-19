/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Bidirectional Evidence Lineage & Provenance Traversal Engine
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 10)
 * Note: Lineage represents provenance tracking, NOT causal inference.
 */

import { ResearchCase, BackwardLineageTrace, ForwardLineageTrace, LineageStep } from './auditTypes';

export class EvidenceLineageEngine {
  /**
   * Traces backward from a specific research claim through evidence, experiment, tool,
   * arguments, data window, and cryptographic fingerprint.
   */
  public static traceBackward(
    caseData: ResearchCase,
    claimId: string
  ): BackwardLineageTrace {
    const claims = caseData.manifest.research.claims;
    const targetClaim = claims.find(c => c.claimId === claimId);

    if (!targetClaim) {
      throw new Error(`Lineage trace failure: Claim "${claimId}" not found in case ${caseData.caseId}.`);
    }

    const chain: LineageStep[] = [];

    // Step 1: CLAIM
    chain.push({
      tier: 'CLAIM',
      entityId: targetClaim.claimId,
      label: `Claim: ${targetClaim.metric}`,
      summary: `Claimed Value: ${targetClaim.value}`,
      metadata: { metric: targetClaim.metric, value: targetClaim.value },
    });

    // Step 2: EVIDENCE
    const boundEvidenceIds = targetClaim.evidenceIds || [];
    const matchedEvidence = caseData.evidence.filter(e => boundEvidenceIds.includes(e.evidenceId));

    for (const ev of matchedEvidence) {
      chain.push({
        tier: 'EVIDENCE',
        entityId: ev.evidenceId,
        label: `Evidence: ${ev.evidenceId}`,
        summary: ev.directEvidence,
        metadata: { directEvidence: ev.directEvidence, order: ev.order },
      });

      // Step 3: EXPERIMENT
      const matchedExp = caseData.experiments.find(exp => exp.experimentId === ev.experimentId);
      chain.push({
        tier: 'EXPERIMENT',
        entityId: matchedExp?.experimentId || ev.experimentId,
        label: `Experiment: ${matchedExp?.experimentId || ev.experimentId}`,
        summary: matchedExp?.purpose || `Execute ${ev.toolName}`,
        metadata: { dependencies: matchedExp?.dependencies || [] },
      });

      // Step 4: TOOL
      chain.push({
        tier: 'TOOL',
        entityId: ev.toolName,
        label: `Tool: ${ev.toolName}`,
        summary: `Quantitative engine allowlist invocation: ${ev.toolName}`,
        metadata: { toolName: ev.toolName },
      });

      // Step 5: ARGUMENTS
      chain.push({
        tier: 'ARGUMENTS',
        entityId: `ARGS-${ev.evidenceId}`,
        label: 'Tool Arguments',
        summary: JSON.stringify(ev.arguments),
        metadata: { ...ev.arguments },
      });

      // Step 6: DATA WINDOW
      chain.push({
        tier: 'DATA',
        entityId: caseData.datasetFingerprint,
        label: 'Data Window',
        summary: `${ev.dataWindow.startDate} to ${ev.dataWindow.endDate} (${ev.dataWindow.observationCount} bars)`,
        metadata: { ...ev.dataWindow },
      });

      // Step 7: ENGINE VERSION
      const engineVersion = caseData.manifest.engines.toolVersions[ev.toolName] || '1.0.0';
      chain.push({
        tier: 'ENGINE_VERSION',
        entityId: engineVersion,
        label: `Engine Version: v${engineVersion}`,
        summary: `SemVer specification for ${ev.toolName}`,
        metadata: { version: engineVersion },
      });

      // Step 8: FINGERPRINT
      chain.push({
        tier: 'FINGERPRINT',
        entityId: ev.fingerprint,
        label: 'Cryptographic Output Fingerprint',
        summary: ev.fingerprint,
        metadata: { fingerprint: ev.fingerprint },
      });
    }

    return {
      claimId: targetClaim.claimId,
      metric: targetClaim.metric,
      claimedValue: targetClaim.value,
      chain,
    };
  }

  /**
   * Traces forward from an experiment to bound evidence, claims, and downstream findings.
   */
  public static traceForward(
    caseData: ResearchCase,
    experimentId: string
  ): ForwardLineageTrace {
    const matchedEvidence = caseData.evidence.filter(e => e.experimentId === experimentId);
    const evidenceIds = matchedEvidence.map(e => e.evidenceId);

    const boundClaims = caseData.manifest.research.claims.filter(c =>
      c.evidenceIds.some(id => evidenceIds.includes(id))
    );

    const downstreamFindings: string[] = [];
    if (caseData.synthesis) {
      downstreamFindings.push(caseData.synthesis.executiveObservation);
      for (const h of caseData.synthesis.hypothesisFindings) {
        downstreamFindings.push(`Hypothesis ${h.hypothesisId}: ${h.status} (${h.summary})`);
      }
    }

    const exp = caseData.experiments.find(e => e.experimentId === experimentId);

    return {
      experimentId,
      toolName: exp?.toolName || 'UNKNOWN',
      boundEvidenceIds: evidenceIds,
      boundClaimIds: boundClaims.map(c => c.claimId),
      downstreamFindings,
    };
  }

  /**
   * Constructs an interactive provenance graph model representation.
   */
  public static buildLineageGraph(caseData: ResearchCase): {
    nodes: Array<{ id: string; label: string; type: string; details: any }>;
    edges: Array<{ id: string; source: string; target: string; label: string }>;
  } {
    const nodes: Array<{ id: string; label: string; type: string; details: any }> = [];
    const edges: Array<{ id: string; source: string; target: string; label: string }> = [];

    // Add Data Window node
    nodes.push({
      id: 'DATA_WINDOW',
      label: `Data (${caseData.provenance.dataWindow.observationCount} bars)`,
      type: 'DATA',
      details: caseData.provenance.dataWindow,
    });

    // Add Experiment nodes
    for (const exp of caseData.experiments) {
      nodes.push({
        id: exp.experimentId,
        label: `${exp.experimentId} (${exp.toolName})`,
        type: 'EXPERIMENT',
        details: exp,
      });
      edges.push({
        id: `EDGE-DATA-${exp.experimentId}`,
        source: 'DATA_WINDOW',
        target: exp.experimentId,
        label: 'evaluated_on',
      });
    }

    // Add Evidence nodes
    for (const ev of caseData.evidence) {
      nodes.push({
        id: ev.evidenceId,
        label: `${ev.evidenceId}: ${ev.directEvidence.slice(0, 30)}...`,
        type: 'EVIDENCE',
        details: ev,
      });
      edges.push({
        id: `EDGE-${ev.experimentId}-${ev.evidenceId}`,
        source: ev.experimentId,
        target: ev.evidenceId,
        label: 'produced',
      });
    }

    // Add Claim nodes
    for (const clm of caseData.manifest.research.claims) {
      nodes.push({
        id: clm.claimId,
        label: `Claim: ${clm.metric} (${clm.value})`,
        type: 'CLAIM',
        details: clm,
      });
      for (const evId of clm.evidenceIds) {
        edges.push({
          id: `EDGE-${evId}-${clm.claimId}`,
          source: evId,
          target: clm.claimId,
          label: 'grounds',
        });
      }
    }

    return { nodes, edges };
  }
}
