/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Deterministic Replay Engine & Tool Re-Execution Coordinator
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Sections 7, 8)
 */

import { executeRegisteredTool, isToolRegistered } from '../researchToolRegistry';
import { ResearchCase, ResearchManifest, ReplayVerificationRecord } from './auditTypes';
import { validateManifestSchema } from './researchManifest';
import { checkEngineCompatibility } from './versionCompatibility';
import { verifyReplayExecution, ReplayExecutionPayload } from './replayVerifier';
import { globalAuditTimeline } from './auditTimeline';

export interface ReplayOptions {
  overrideParameters?: Record<string, any>;
  overrideTransactionCostBps?: number;
  overrideSeed?: number;
  overrideDataWindow?: { startDate: string; endDate: string; observationCount?: number };
}

export class ResearchReplayEngine {
  /**
   * Replays a sealed ResearchCase deterministically and generates a full verification record.
   */
  public static async replayCase(
    sealedCase: ResearchCase,
    options?: ReplayOptions
  ): Promise<{
    verification: ReplayVerificationRecord;
    replayedPayload: ReplayExecutionPayload;
  }> {
    const caseId = sealedCase.caseId;
    const originalManifest = sealedCase.manifest;

    // Log REPLAY_STARTED to audit timeline
    globalAuditTimeline.appendEvent({
      caseId,
      eventType: 'REPLAY_STARTED',
      actor: 'SYSTEM',
      fingerprint: sealedCase.reproducibilityMetadata.canonicalOutputFingerprint,
      details: {
        hasOverrides: Boolean(options && Object.keys(options).length > 0),
      },
    });

    const startTime = performance.now();

    // 1. PRE-EXECUTION VALIDATION: MANIFEST SCHEMA CHECK (Rank 1: SCHEMA_MISMATCH)
    const schemaCheck = validateManifestSchema(originalManifest);
    if (!schemaCheck.valid) {
      const payload: ReplayExecutionPayload = {
        executedManifest: originalManifest,
        executedEvidence: [],
        totalDurationMs: Math.round(performance.now() - startTime),
        runtimeError: `Manifest schema violation: ${schemaCheck.errors.join('; ')}`,
      };
      const verification = verifyReplayExecution(sealedCase, payload);
      verification.allMismatchTypes.push('SCHEMA_MISMATCH');
      verification.primaryMismatchType = 'SCHEMA_MISMATCH';
      verification.mismatchPrecedenceLevel = 1;
      verification.overallStatus = 'FAILED';
      return { verification, replayedPayload: payload };
    }

    // 2. PRE-EXECUTION VALIDATION: ENGINE COMPATIBILITY CHECK (Rank 2: VERSION_MISMATCH)
    const verCheck = checkEngineCompatibility(originalManifest.engines.engineVersions);
    if (verCheck.status === 'INCOMPATIBLE') {
      const payload: ReplayExecutionPayload = {
        executedManifest: originalManifest,
        executedEvidence: [],
        totalDurationMs: Math.round(performance.now() - startTime),
        runtimeError: 'Incompatible engine semver version detected.',
      };
      const verification = verifyReplayExecution(sealedCase, payload);
      return { verification, replayedPayload: payload };
    }

    // 3. PRE-EXECUTION VALIDATION: TOOL AVAILABILITY (Rank 3: TOOL_UNAVAILABLE)
    const requiredTools = originalManifest.research.experimentDAG.map(d => d.toolName);
    for (const tool of requiredTools) {
      if (!isToolRegistered(tool)) {
        const payload: ReplayExecutionPayload = {
          executedManifest: originalManifest,
          executedEvidence: [],
          totalDurationMs: Math.round(performance.now() - startTime),
          runtimeError: `Required research tool "${tool}" is missing from registry.`,
        };
        const verification = verifyReplayExecution(sealedCase, payload);
        return { verification, replayedPayload: payload };
      }
    }

    // 4. CLONE MANIFEST AND APPLY ANY PARAMETER OVERRIDES
    const replayManifest: ResearchManifest = JSON.parse(JSON.stringify(originalManifest));

    if (options?.overrideTransactionCostBps !== undefined) {
      replayManifest.strategy.transactionCostBps = options.overrideTransactionCostBps;
    }
    if (options?.overrideSeed !== undefined) {
      replayManifest.simulation.seed = options.overrideSeed;
    }
    if (options?.overrideParameters) {
      replayManifest.strategy.parameters = {
        ...replayManifest.strategy.parameters,
        ...options.overrideParameters,
      };
    }
    if (options?.overrideDataWindow) {
      replayManifest.data.startDate = options.overrideDataWindow.startDate;
      replayManifest.data.endDate = options.overrideDataWindow.endDate;
      if (options.overrideDataWindow.observationCount !== undefined) {
        replayManifest.data.observationCount = options.overrideDataWindow.observationCount;
      }
    }

    // 5. RE-EXECUTE PLANNED EXPERIMENTS THROUGH TOOL REGISTRY
    const executedEvidence: ReplayExecutionPayload['executedEvidence'] = [];
    let runtimeError: string | undefined;

    try {
      for (let i = 0; i < sealedCase.evidence.length; i++) {
        const origEv = sealedCase.evidence[i];
        const toolName = origEv.toolName;

        // Build execution arguments preserving exact original experiment parameters
        const execArgs: Record<string, any> = {
          ...origEv.arguments,
        };

        // Fall back to evidence dataWindow dates if arguments omitted explicit dates
        if (!execArgs.startDate && origEv.dataWindow?.startDate) {
          execArgs.startDate = origEv.dataWindow.startDate;
        }
        if (!execArgs.endDate && origEv.dataWindow?.endDate) {
          execArgs.endDate = origEv.dataWindow.endDate;
        }

        // Selectively apply sensitivity overrides if specified
        if (options?.overrideTransactionCostBps !== undefined) {
          if ('frictionBps' in execArgs) execArgs.frictionBps = options.overrideTransactionCostBps;
          if ('transactionCostPct' in execArgs) execArgs.transactionCostPct = options.overrideTransactionCostBps / 10000;
          if ('costSweepBps' in execArgs) execArgs.costSweepBps = [0, 5, options.overrideTransactionCostBps];
        }
        if (options?.overrideSeed !== undefined && 'seed' in execArgs) {
          execArgs.seed = options.overrideSeed;
        }
        if (options?.overrideDataWindow !== undefined) {
          if ('startDate' in execArgs) execArgs.startDate = options.overrideDataWindow.startDate;
          if ('endDate' in execArgs) execArgs.endDate = options.overrideDataWindow.endDate;
        }
        if (options?.overrideParameters) {
          Object.assign(execArgs, options.overrideParameters);
        }

        // Enforce simulation path ceiling (<= 10,000)
        if (execArgs.simulations && typeof execArgs.simulations === 'number') {
          execArgs.simulations = Math.min(execArgs.simulations, 10000);
        }

        // Execute natively via Registered Allowlist Tool
        const execResult = await executeRegisteredTool(toolName, execArgs);

        executedEvidence.push({
          evidenceId: origEv.evidenceId,
          toolName,
          result: execResult.result,
          directEvidence: origEv.directEvidence,
        });
      }
    } catch (err: any) {
      runtimeError = err?.message || 'Replay execution runtime fault.';
    }

    const totalDurationMs = Math.round(performance.now() - startTime);

    const replayedPayload: ReplayExecutionPayload = {
      executedManifest: replayManifest,
      executedEvidence,
      totalDurationMs,
      runtimeError,
    };

    // 6. RUN 6-LEVEL VERIFICATION AUDIT
    const verification = verifyReplayExecution(sealedCase, replayedPayload);

    // Log completion to audit ledger
    globalAuditTimeline.appendEvent({
      caseId,
      eventType: verification.overallStatus === 'MATCHED' ? 'REPLAY_COMPLETED' : 'REPLAY_MISMATCH',
      actor: 'SYSTEM',
      fingerprint: verification.fingerprintComparison.replayFingerprint,
      details: {
        status: verification.overallStatus,
        primaryMismatch: verification.primaryMismatchType,
        latencyMs: totalDurationMs,
      },
    });

    return {
      verification,
      replayedPayload,
    };
  }
}
