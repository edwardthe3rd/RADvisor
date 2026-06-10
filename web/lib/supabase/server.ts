import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Anon-key client for server components and route handlers. Read-only in
 * practice: RLS only exposes active rows to the anon role.
 */
export function supabaseServer() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Service-role client — bypasses RLS. Server-side only (admin dashboard
 * mutations, seed scripts). Throws if the key is missing so a misconfigured
 * deploy fails loudly instead of silently writing nothing.
 */
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — admin writes are unavailable.",
    );
  }
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
