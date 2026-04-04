/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase_admin";

export const runtime = "nodejs";

export async function GET() {
  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const { data, error } = await sb.from("mfb_site_config").select("key,value").eq("key", "preview").maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });

  const videoId = (data as any)?.value?.video_id || null;
  const status = (data as any)?.value?.status || null;
  const progress = (data as any)?.value?.progress ?? null;
  const lastCheckedAt = (data as any)?.value?.last_checked_at ?? null;
  const lastError = (data as any)?.value?.last_error ?? null;

  return NextResponse.json({ ok: true, videoId, status, progress, lastCheckedAt, lastError });
}
