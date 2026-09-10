import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both public Supabase env vars are present (never invent keys). */
export const supabaseConfigured = Boolean(url?.trim() && anonKey?.trim());

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client (anon key only). Returns null when env is missing so
 * the public board still works offline / without secrets.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || !url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
