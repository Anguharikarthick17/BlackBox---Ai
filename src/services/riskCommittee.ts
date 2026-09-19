/**
 * BLACKBOX X — Client-Side Risk Committee AI Service
 * 
 * Communicates with the server-side /api/risk-brief endpoint.
 * Dispatches the deterministic ResearchPack, validates response structure,
 * and exposes typed results to the Research Store and UI.
 * 
 * NO FINANCIAL CALCULATIONS HAPPEN HERE.
 */

import { ResearchPack } from '../core/researchPack';
import { RiskCommitteeBrief, validateRiskCommitteeBrief } from '../core/riskBriefValidator';

export type RiskBriefStatus =
  | 'IDLE'
  | 'ANALYZING'
  | 'CONNECTED'
  | 'NOT_CONFIGURED'
  | 'VALIDATION_FAILED'
  | 'ERROR';

export interface RiskBriefResponse {
  success: boolean;
  status: RiskBriefStatus;
  brief: RiskCommitteeBrief | null;
  error?: string;
  details?: string[];
  fingerprint: string;
  model?: string;
  isMockFallback?: boolean;
}

export async function requestRiskCommitteeBrief(
  pack: ResearchPack,
  options?: { mockFallback?: boolean }
): Promise<RiskBriefResponse> {
  try {
    const response = await fetch('/api/risk-brief', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        researchPack: pack,
        mockFallback: options?.mockFallback ?? false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        status: 'ERROR',
        brief: null,
        error: `Server responded with status ${response.status}: ${errorText}`,
        fingerprint: pack.provenance.fingerprint,
      };
    }

    const data = await response.json();

    if (data.status === 'NOT_CONFIGURED') {
      return {
        success: false,
        status: 'NOT_CONFIGURED',
        brief: null,
        error: data.error || 'GEMINI_API_KEY is not configured on the server.',
        fingerprint: pack.provenance.fingerprint,
      };
    }

    if (data.status === 'VALIDATION_FAILED') {
      return {
        success: false,
        status: 'VALIDATION_FAILED',
        brief: null,
        error: data.error || 'Briefing validation failed against quantitative evidence.',
        details: data.details || [],
        fingerprint: pack.provenance.fingerprint,
      };
    }

    if (data.status === 'ERROR' || !data.brief) {
      return {
        success: false,
        status: 'ERROR',
        brief: null,
        error: data.error || 'Failed to generate Risk Committee briefing.',
        fingerprint: pack.provenance.fingerprint,
      };
    }

    // Client-side defense-in-depth re-validation
    const validation = validateRiskCommitteeBrief(data.brief, pack, data.model);
    if (!validation.isValid || !validation.brief) {
      return {
        success: false,
        status: 'VALIDATION_FAILED',
        brief: null,
        error: 'Client validation failed: AI output violated numerical grounding rules.',
        details: validation.errors,
        fingerprint: pack.provenance.fingerprint,
      };
    }

    return {
      success: true,
      status: 'CONNECTED',
      brief: validation.brief,
      fingerprint: pack.provenance.fingerprint,
      model: data.model,
      isMockFallback: data.isMockFallback,
    };
  } catch (err) {
    return {
      success: false,
      status: 'ERROR',
      brief: null,
      error: (err as Error).message || 'Network failure communicating with Risk Committee API.',
      fingerprint: pack.provenance.fingerprint,
    };
  }
}
