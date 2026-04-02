import { createClient } from "@supabase/supabase-js";
import { envPublic } from "../lib/env_public";
import { envServer } from "../lib/env_server";

export function supabaseAdmin() {
  const pub = envPublic();
  const srv = envServer();
  return createClient(pub.NEXT_PUBLIC_SUPABASE_URL, srv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
