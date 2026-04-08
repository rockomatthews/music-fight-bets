/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.number().int().min(1).max(2000).default(1000),
  })
  .partial()
  .strict();

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";

  let env;
  try {
    env = envServer();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  if (secret !== env.MFB_ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const bodyRaw = await req.json().catch(() => ({}));
  const body = BodySchema.parse(bodyRaw);

  const day = body.day || new Date().toISOString().slice(0, 10);

  const { data: fighters, error: fErr } = await sb.from("mfb_fighters").select("id").limit(body.limit ?? 1000);
  if (fErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: fErr.message }, { status: 500 });

  let upserted = 0;
  for (const f of fighters || []) {
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
