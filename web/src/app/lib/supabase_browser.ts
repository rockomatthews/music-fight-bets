import { createClient } from "@supabase/supabase-js";
import { envPublic } from "./env_public";

export function supabaseBrowser() {
  const env = envPublic();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
