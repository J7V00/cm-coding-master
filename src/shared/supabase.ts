import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://wkoyeiydytlgtoknypkd.supabase.co";
const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_r3BxLBSCV85_7qR6WvYBdw_Bf9qCZe0";

let client: SupabaseClient | null = null;

/** Public anon client only. Never put service-role keys in the frontend. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anon) {
    console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
    return null;
  }

  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
