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
  if (cronSecret) return bearer(req) === cronSecret;

  const legacy = process.env.MFB_CRON_SECRET;
  if (legacy) return querySecret(req) === legacy;

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

  const { data: renders, error } = await sb
    .from("mfb_renders")
    .select("id, video_id, status")
    .in("status", ["queued", "in_progress"])
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });

  let updated = 0;

  for (const r of renders || []) {
    const vid = (r as any).video_id;
    if (!vid) continue;

    const res = await fetch(`https://api.openai.com/v1/videos/${encodeURIComponent(vid)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.status) continue;

    const status = j.status as string;
    const patch: any = { status, updated_at: new Date().toISOString() };

    if (status === "completed") {
      // We stream content via /api/video/[id]/content so no need to store URLs.
      patch.video_url = null;
      patch.thumbnail_url = null;
      patch.spritesheet_url = null;
    }

    const { error: uErr } = await sb.from("mfb_renders").update(patch).eq("id", (r as any).id);
    if (!uErr) updated++;
  }

  return NextResponse.json({ ok: true, checked: (renders || []).length, updated });
}
