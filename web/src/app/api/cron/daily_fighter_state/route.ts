/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase_admin";

export const runtime = "nodejs";

function bearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || "";
}

function cronAuthed(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) return bearer(req) === cronSecret;

  const legacy = process.env.MFB_CRON_SECRET;
  if (legacy) {
    const url = new URL(req.url);
    return (url.searchParams.get("secret") || "") === legacy;
  }
  return false;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function GET(req: Request) {
  if (!cronAuthed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const today = new Date();
  const day = today.toISOString().slice(0, 10);

  const { data: fighters, error: fErr } = await sb.from("mfb_fighters").select("id, record_w, record_l").limit(1000);
  if (fErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: fErr.message }, { status: 500 });

  let upserted = 0;

  for (const f of fighters || []) {
    // naive daily generation (MVP): random within reasonable bounds
    const row = {
      fighter_id: (f as any).id,
      day,
      sleep_hours: Math.round(rand(5.5, 9.1) * 10) / 10,
      injury_pct: Math.round(rand(0, 18) * 100) / 100,
      morale: clamp01(rand(0.35, 0.95)),
      camp_quality: clamp01(rand(0.35, 0.95)),
      travel_fatigue: clamp01(rand(0.05, 0.65)),
      days_since_last_fight: Math.round(rand(2, 28)),
      notes: null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb.from("mfb_fighter_daily").upsert(row as any, { onConflict: "fighter_id,day" });
    if (!error) upserted++;
  }

  return NextResponse.json({ ok: true, day, fighters: (fighters || []).length, upserted });
}
