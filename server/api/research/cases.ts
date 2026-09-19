/**
 * BLACKBOX X — Research Persistence Server API Handlers
 * 
 * SERVER-ONLY: This file runs in the Vite dev server / Node.js server context.
 * Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for trusted writes.
 * 
 * ⚠️ SECURITY CRITICAL:
 *   Do NOT import this file in any client-side code.
 *   Do NOT pass service role key to API responses.
 * 
 * Offline-first: All handlers return success-shaped responses even when
 * Supabase is not configured (offline mode).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SERVER-SIDE CLIENT (service role key — bypasses RLS for writes)
// ============================================================

let _serverClient: SupabaseClient | null = null;

function normalizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return trimmed;
}

function getServerClient(): SupabaseClient | null {
  if (_serverClient) return _serverClient;

  const rawUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const url = normalizeSupabaseUrl(rawUrl);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url.trim()) return null;

  const key = serviceRoleKey.trim() || anonKey.trim();
  if (!key) return null;

  _serverClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _serverClient;
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function handleResearchHealthRequest(): Promise<{
  ok: boolean;
  supabase: string;
  timestamp: string;
  error?: string;
}> {
  const client = getServerClient();
  if (!client) {
    return {
      ok: false,
      supabase: 'NOT_CONFIGURED',
      timestamp: new Date().toISOString(),
      error: 'SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_URL not set',
    };
  }

  try {
    // Lightweight ping: query research_cases with limit 0
    const { error } = await client
      .from('research_cases')
      .select('id')
      .limit(1);

    if (error) {
      return {
        ok: false,
        supabase: 'UNREACHABLE',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }

    return {
      ok: true,
      supabase: 'ONLINE',
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      supabase: 'ERROR',
      timestamp: new Date().toISOString(),
      error: (err as Error).message,
    };
  }
}

// ============================================================
// SAVE RESEARCH CASE (full case + all child records)
// ============================================================

export async function handleSaveResearchCase(body: {
  caseRow: Record<string, unknown>;
  sessionRow?: Record<string, unknown>;
  hypothesisRows?: Record<string, unknown>[];
  experimentRows?: Record<string, unknown>[];
  evidenceRows?: Record<string, unknown>[];
  claimRows?: Record<string, unknown>[];
  memoRow?: Record<string, unknown>;
  auditEventRows?: Record<string, unknown>[];
  replayRow?: Record<string, unknown>;
}): Promise<{ success: boolean; caseId?: string; dbId?: string; error?: string }> {
  const client = getServerClient();
  if (!client) {
    // Offline mode: gracefully acknowledge
    return {
      success: true,
      caseId: body.caseRow?.case_id as string,
      dbId: 'LOCAL',
    };
  }

  try {
    // 1. Upsert the research case
    const { data: caseData, error: caseError } = await client
      .from('research_cases')
      .upsert(body.caseRow, { onConflict: 'case_id' })
      .select('id')
      .single();

    if (caseError) {
      console.error('[BLACKBOX X Persistence] Failed to save research case:', caseError.message);
      return { success: false, error: caseError.message };
    }

    const caseDbId = caseData?.id as string;

    // 2. Upsert the research session
    if (body.sessionRow) {
      const sessionRow = { ...body.sessionRow, case_id: caseDbId };
      const { error: sessionError } = await client
        .from('research_sessions')
        .upsert(sessionRow, { onConflict: 'session_id' })
        .select('id')
        .single();

      if (sessionError) {
        console.warn('[BLACKBOX X Persistence] Session save failed (non-fatal):', sessionError.message);
      }
    }

    // 3. Insert hypotheses (delete-and-reinsert for clean update)
    if (body.hypothesisRows?.length) {
      // Get session_id from DB
      const { data: sessionData } = await client
        .from('research_sessions')
        .select('id')
        .eq('session_id', body.sessionRow?.session_id || '')
        .maybeSingle();

      if (sessionData?.id) {
        const sessionDbId = sessionData.id as string;
        const hypothesesWithDbIds = body.hypothesisRows.map(h => ({
          ...h,
          session_id: sessionDbId,
        }));

        await client
          .from('research_hypotheses')
          .upsert(hypothesesWithDbIds, { onConflict: 'session_id,hypothesis_id' });
      }
    }

    // 4. Insert evidence records
    if (body.evidenceRows?.length) {
      const { data: sessionData } = await client
        .from('research_sessions')
        .select('id')
        .eq('session_id', body.sessionRow?.session_id || '')
        .maybeSingle();

      if (sessionData?.id) {
        const sessionDbId = sessionData.id as string;
        const evidenceWithDbIds = body.evidenceRows.map(e => ({
          ...e,
          session_id: sessionDbId,
        }));

        await client
          .from('research_evidence')
          .upsert(evidenceWithDbIds, { onConflict: 'session_id,evidence_id' });
      }
    }

    // 5. Insert claims
    if (body.claimRows?.length) {
      const { data: sessionData } = await client
        .from('research_sessions')
        .select('id')
        .eq('session_id', body.sessionRow?.session_id || '')
        .maybeSingle();

      if (sessionData?.id) {
        const sessionDbId = sessionData.id as string;
        const claimsWithDbIds = body.claimRows.map(c => ({
          ...c,
          session_id: sessionDbId,
        }));

        await client
          .from('research_claims')
          .upsert(claimsWithDbIds, { onConflict: 'session_id,claim_id' });
      }
    }

    // 6. Insert research memo
    if (body.memoRow) {
      const { data: sessionData } = await client
        .from('research_sessions')
        .select('id')
        .eq('session_id', body.sessionRow?.session_id || '')
        .maybeSingle();

      if (sessionData?.id) {
        await client
          .from('research_memos')
          .upsert({ ...body.memoRow, session_id: sessionData.id }, { onConflict: 'session_id,memo_id' });
      }
    }

    // 7. Insert audit events (append-only, no upsert)
    if (body.auditEventRows?.length) {
      const { data: sessionData } = await client
        .from('research_sessions')
        .select('id')
        .eq('session_id', body.sessionRow?.session_id || '')
        .maybeSingle();

      if (sessionData?.id) {
        const auditEventsWithDbIds = body.auditEventRows.map(e => ({
          ...e,
          session_id: sessionData.id,
        }));

        await client.from('research_audit_events').insert(auditEventsWithDbIds);
      }
    }

    // 8. Insert replay verification
    if (body.replayRow) {
      const replayRowWithCaseId = { ...body.replayRow, case_id: caseDbId };
      await client.from('research_replay_verifications').insert(replayRowWithCaseId);
    }

    return {
      success: true,
      caseId: body.caseRow?.case_id as string,
      dbId: caseDbId,
    };
  } catch (err) {
    console.error('[BLACKBOX X Persistence] Unexpected save error:', (err as Error).message);
    return { success: false, error: (err as Error).message };
  }
}

// ============================================================
// LIST RESEARCH CASES
// ============================================================

export async function handleListResearchCases(
  params: URLSearchParams
): Promise<{ cases: Record<string, unknown>[]; total: number }> {
  const client = getServerClient();
  if (!client) {
    return { cases: [], total: 0 };
  }

  try {
    const isDemo = params.get('is_demo');
    const limit = parseInt(params.get('limit') || '20', 10);
    const offset = parseInt(params.get('offset') || '0', 10);

    let query = client
      .from('research_cases')
      .select('id, case_id, title, question, status, case_version, is_demo, fingerprint, created_at, sealed_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (isDemo !== null) {
      query = query.eq('is_demo', isDemo === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[BLACKBOX X Persistence] List cases failed:', error.message);
      return { cases: [], total: 0 };
    }

    return { cases: data ?? [], total: count ?? 0 };
  } catch (err) {
    console.error('[BLACKBOX X Persistence] List cases error:', (err as Error).message);
    return { cases: [], total: 0 };
  }
}

// ============================================================
// GET SINGLE RESEARCH CASE
// ============================================================

export async function handleGetResearchCase(
  caseId: string
): Promise<{ caseData: Record<string, unknown> | null }> {
  const client = getServerClient();
  if (!client) {
    return { caseData: null };
  }

  try {
    const { data, error } = await client
      .from('research_cases')
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle();

    if (error) {
      console.error('[BLACKBOX X Persistence] Get case failed:', error.message);
      return { caseData: null };
    }

    return { caseData: data };
  } catch (err) {
    console.error('[BLACKBOX X Persistence] Get case error:', (err as Error).message);
    return { caseData: null };
  }
}

// ============================================================
// SAVE REPLAY VERIFICATION
// ============================================================

export async function handleSaveReplayVerification(
  caseId: string,
  body: { verification: Record<string, unknown> }
): Promise<{ success: boolean; error?: string }> {
  const client = getServerClient();
  if (!client) {
    return { success: true }; // Offline: graceful ack
  }

  try {
    // Look up case DB UUID from BBX case_id
    const { data: caseData, error: caseLookupError } = await client
      .from('research_cases')
      .select('id')
      .eq('case_id', caseId)
      .maybeSingle();

    if (caseLookupError || !caseData?.id) {
      return { success: false, error: caseLookupError?.message || 'Case not found' };
    }

    const verificationRow = {
      ...body.verification,
      case_id: caseData.id,
    };

    const { error: insertError } = await client
      .from('research_replay_verifications')
      .insert(verificationRow);

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
