/**
 * BLACKBOX X — Supabase Browser-Safe Client
 * 
 * SECURITY BOUNDARY: This file is safe to import in React components and client code.
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only.
 * 
 * The anon key is safe for browser exposure — it is scoped by Row Level Security (RLS).
 * NEVER import server.ts in client components.
 * 
 * Offline-first: Returns null client when Supabase is not configured.
 * The app must continue working without Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe access to import.meta.env — falls back to process.env in Node.js/test environments
const _env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as any).env != null
    ? (import.meta as any).env
    : process.env;

const supabaseUrl = _env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = _env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Returns true if both Supabase URL and anon key are configured.
 * The app must function normally if this returns false (offline-first).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl?.trim() && supabaseAnonKey?.trim());
}

/**
 * Browser-safe Supabase client singleton.
 * Will be null if environment variables are not configured.
 * 
 * Usage:
 *   import { supabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
 *   if (!isSupabaseConfigured() || !supabaseClient) {
 *     // offline mode — continue locally
 *   }
 */
export let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      // Disable auto-refresh in browser for our current pre-auth phase
      // When user auth is implemented, enable auto-refresh with proper session handling
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns the configured Supabase client, or throws a clear error
 * if called when Supabase is not configured (for internal use only).
 * 
 * For UI code: always check isSupabaseConfigured() first.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      '[BLACKBOX X] Supabase client is not configured. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
      'Quantitative engines continue to function offline.'
    );
  }
  return supabaseClient;
}

export type { SupabaseClient };
