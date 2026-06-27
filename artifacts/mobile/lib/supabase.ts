import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

const configured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!configured) {
  console.warn("[Supabase] URL or ANON key not configured. Using local fallback.");
}

export const supabase = createClient(
  configured ? SUPABASE_URL : "https://placeholder.supabase.co",
  configured ? SUPABASE_ANON_KEY : "placeholder-anon-key",
  {
    auth: {
      autoRefreshToken: configured,
      persistSession: configured,
      detectSessionInUrl: false,
    },
  }
);

export const isSupabaseConfigured = configured;
