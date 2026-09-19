/**
 * BLACKBOX X — Supabase Server-Only Client
 * 
 * ⚠️  SECURITY CRITICAL ⚠️
 * 
 * This module MUST ONLY be imported by server-side code (Vite API handlers,
 * Node.js server scripts, server/api/* files).
 * 
 * NEVER import this file in:
 *   - React components
 *   - src/core/**
 *   - src/components/**
 *   - src/store/**
 *   - src/services/**
 *   - Any file that ships in the browser bundle
 * 
 * Uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
 * Exposing the service role key to the browser would compromise all data security.
 * 
 * Runtime guard: Will throw a hard error if accidentally imported in a browser context.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// RUNTIME GUARD: Prevent browser-side import
// This will throw immediately if this file is bundled into client code.
// ============================================================
if (typeof window !== 'undefined') {
  throw new Error(
    '[BLACKBOX X] SECURITY VIOLATION: server.ts (Supabase server client) was imported in a browser context. ' +
    'The SUPABASE_SERVICE_ROLE_KEY must NEVER reach the browser. ' +
    'Use src/lib/supabase/client.ts for browser-safe Supabase access.'
  );
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Returns true if the server Supabase client can be initialized.
 */
export function isServerSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl?.trim() && (serviceRoleKey?.trim() || anonKey?.trim()));
}

/**
 * Lazily-initialized server Supabase client singleton.
 * Uses the service-role key if available, falls back to anon key.
 * Returns null if Supabase is not configured.
 */
let _serverClient: SupabaseClient | null = null;

export function getServerSupabaseClient(): SupabaseClient | null {
  if (_serverClient) return _serverClient;

  if (!supabaseUrl?.trim()) return null;

  const key = serviceRoleKey?.trim() || anonKey?.trim();
  if (!key) return null;

  _serverClient = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _serverClient;
}

/**
 * Returns the server Supabase client, throwing a clear error if unavailable.
 * Use isServerSupabaseConfigured() before calling this.
 */
export function requireServerSupabaseClient(): SupabaseClient {
  const client = getServerSupabaseClient();
  if (!client) {
    throw new Error(
      '[BLACKBOX X] Server Supabase client is not configured. ' +
      'Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server environment variables.'
    );
  }
  return client;
}

export type { SupabaseClient };
