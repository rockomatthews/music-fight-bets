/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase_admin";

export const runtime = "nodejs";

function bearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || "";
}

function querySecret(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("secret") || "";
}

function cronAuthed(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Primary: Vercel Cron uses Authorization: Bearer <CRON_SECRET>
  if (cronSecret && bearer(req) === cronSecret) return true;

  // Manual trigger fallback: allow ?secret=<CRON_SECRET>
  if (cronSecret && querySecret(req) === cronSecret) return true;

  // Legacy fallback: ?secret=<MFB_CRON_SECRET>
  const legacy = process.env.MFB_CRON_SECRET;
  if (legacy && querySecret(req) === legacy) return true;

  return false;
}

export async function GET(req: Request) {
  if (!cronAuthed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "missing_openai_key" }, { status: 500 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const { data: cfg, error: cErr } = await sb
    .from("mfb_site_config")
    .select("key,value")
    .eq("key", "preview")
    .maybeSingle();

  if (cErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: cErr.message }, { status: 500 });

  const value = (cfg as any)?.value || {};
  const videoId = value.video_id as string | undefined;
  if (!videoId) return NextResponse.json({ ok: true, skipped: true, reason: "no_video" });

  const res = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(videoId)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const j = await res.json().catch(() => null);

  if (!res.ok || !j?.status) {
    const detail = j?.error?.message || j || null;
    // record failure so UI shows something actionable
    const patch = {
      ...value,
      status: "failed",
      last_checked_at: new Date().toISOString(),
      last_error: detail,
    };
    await sb.from("mfb_site_config").upsert({ key: "preview", value: patch, updated_at: new Date().toISOString() } as any, {
      onConflict: "key",
    });

    return NextResponse.json({ ok: false, error: "openai_status_failed", detail });
  }

  const patch = {
    ...value,
    status: j.status,
    progress: j.progress ?? null,
    last_checked_at: new Date().toISOString(),
    last_error: null,
  };

  const { error: uErr } = await sb
    .from("mfb_site_config")
    .upsert({ key: "preview", value: patch, updated_at: new Date().toISOString() } as any, { onConflict: "key" });

  if (uErr) return NextResponse.json({ ok: false, error: "db_write_failed", detail: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, videoId, status: j.status, progress: j.progress ?? null });
}
