import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Fallback strings prevent createClient from throwing during Next.js static
// generation (build time). Real values are required at runtime via env vars.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
