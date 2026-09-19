/**
 * BLACKBOX X — PHASE 4.1: RESEARCH REPRODUCIBILITY & DECISION AUDIT LAYER
 * Engine Version Compatibility & Divergence Evaluator
 * 
 * Authoritative Source: docs/RESEARCH-AUDIT-ARCHITECTURE.md (Section 15)
 */

import { EngineCompatibilityStatus, VersionCompatibilityCheck } from './auditTypes';

// ============================================================================
// 1. ACTIVE LIVE ENGINE VERSIONS CATALOG
// ============================================================================

export const ACTIVE_ENGINE_VERSIONS: Record<string, string> = {
  quantCore: '1.0.0',
  psCompliance: '2.0.0',
  backtestEngine: '2.4.0',
  stressEngine: '3.2.0',
  strategyGenome: '3.3.0',
  riskCommittee: '3.4.0',
  assistant: '3.5.0',
  quantAgent: '3.6.0',
  portfolio: '3.7.0',
  monteCarlo: '3.8.0',
  regimeMonteCarlo: '3.9.0',
  institutionalResearch: '4.0.0',
  researchAudit: '4.1.0',
};

// ============================================================================
// 2. SEMVER COMPATIBILITY RULES
// ============================================================================

function parseSemVer(v: string): { major: number; minor: number; patch: number } {
  const parts = v.split('.').map(p => parseInt(p, 10));
  return {
    major: isNaN(parts[0]) ? 0 : parts[0],
    minor: isNaN(parts[1]) ? 0 : parts[1],
    patch: isNaN(parts[2]) ? 0 : parts[2],
  };
}

/**
 * Checks recorded engine versions from a ResearchManifest or ResearchCase
 * against the current active runtime engine versions.
 */
export function checkEngineCompatibility(
  recordedVersions: Record<string, string>
): VersionCompatibilityCheck {
  const divergences: VersionCompatibilityCheck['divergences'] = [];
  let hasMajorBreaking = false;
  let hasMinorWarning = false;

  for (const [engine, activeVer] of Object.entries(ACTIVE_ENGINE_VERSIONS)) {
    const recordedVer = recordedVersions[engine];

    // If recorded version is missing, treat as warning unless it's a core quantitative engine
    if (!recordedVer) {
      if (['monteCarlo', 'regimeMonteCarlo', 'backtestEngine', 'portfolio'].includes(engine)) {
        divergences.push({
          engine,
          recorded: 'UNSPECIFIED',
          active: activeVer,
          severity: 'MAJOR_BREAKING',
          impact: `Critical quantitative engine "${engine}" was not recorded in manifest. Mathematical parity cannot be verified.`,
        });
        hasMajorBreaking = true;
      } else {
        divergences.push({
          engine,
          recorded: 'UNSPECIFIED',
          active: activeVer,
          severity: 'MINOR_WARNING',
          impact: `Engine "${engine}" version unspecified; assuming compatible default.`,
        });
        hasMinorWarning = true;
      }
      continue;
    }

    const recordedParsed = parseSemVer(recordedVer);
    const activeParsed = parseSemVer(activeVer);

    if (recordedParsed.major !== activeParsed.major) {
      divergences.push({
        engine,
        recorded: recordedVer,
        active: activeVer,
        severity: 'MAJOR_BREAKING',
        impact: `Breaking major semver divergence (${recordedVer} vs ${activeVer}). Mathematical models or contracts have structurally changed.`,
      });
      hasMajorBreaking = true;
    } else if (recordedParsed.minor !== activeParsed.minor) {
      divergences.push({
        engine,
        recorded: recordedVer,
        active: activeVer,
        severity: 'MINOR_WARNING',
        impact: `Minor semver variance (${recordedVer} vs ${activeVer}). Underlying algorithms maintain compatibility, but diagnostic output may vary.`,
      });
      hasMinorWarning = true;
    } else {
      divergences.push({
        engine,
        recorded: recordedVer,
        active: activeVer,
        severity: 'EXACT',
        impact: 'Identical engine version.',
      });
    }
  }

  let status: EngineCompatibilityStatus = 'EXACT_COMPATIBLE';
  if (hasMajorBreaking) {
    status = 'INCOMPATIBLE';
  } else if (hasMinorWarning) {
    status = 'COMPATIBLE_WITH_WARNING';
  }

  return {
    status,
    recordedVersions: { ...recordedVersions },
    activeVersions: { ...ACTIVE_ENGINE_VERSIONS },
    divergences,
  };
}

/**
 * Convenience helper returning whether the environment can proceed with replay.
 */
export function canSafelyReplay(recordedVersions: Record<string, string>): boolean {
  const check = checkEngineCompatibility(recordedVersions);
  return check.status !== 'INCOMPATIBLE';
}
