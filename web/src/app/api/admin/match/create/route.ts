/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    fighterAId: z.string().min(2),
    fighterBId: z.string().min(2),

    // convenience scheduling
    opensInMinutes: z.number().int().min(0).max(24 * 60).default(0),
    closeInMinutes: z.number().int().min(1).max(24 * 60).default(60),
    startInMinutes: z.number().int().min(1).max(24 * 60).default(65),

    // optional direct timestamps
    opensAt: z.string().datetime().optional(),
    closeAt: z.string().datetime().optional(),
    startAt: z.string().datetime().optional(),
  })
  .strict();

function makeId() {
  return `m_${crypto.randomUUID().replace(/-/g, "")}`;
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

  const json = await req.json().catch(() => ({}));
  const body = BodySchema.safeParse(json);
  if (!body.success) return NextResponse.json({ ok: false, error: "bad_request", detail: body.error.flatten() }, { status: 400 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  if (body.data.fighterAId === body.data.fighterBId) {
    return NextResponse.json({ ok: false, error: "same_fighter" }, { status: 400 });
  }

  const now = Date.now();

  const opensAt = body.data.opensAt
    ? new Date(body.data.opensAt).toISOString()
    : new Date(now + body.data.opensInMinutes * 60_000).toISOString();
  const closeAt = body.data.closeAt
    ? new Date(body.data.closeAt).toISOString()
    : new Date(now + body.data.closeInMinutes * 60_000).toISOString();
  const startAt = body.data.startAt
    ? new Date(body.data.startAt).toISOString()
    : new Date(now + body.data.startInMinutes * 60_000).toISOString();

  if (new Date(closeAt).getTime() <= new Date(opensAt).getTime()) {
    return NextResponse.json({ ok: false, error: "bad_schedule" }, { status: 400 });
  }
  if (new Date(startAt).getTime() < new Date(closeAt).getTime()) {
    return NextResponse.json({ ok: false, error: "bad_schedule_start_before_close" }, { status: 400 });
  }

  // Seed some match-state vars (can be edited later)
  const rand = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;
  const match_state = {
    a: { sleep_hours: rand(5.5, 9.0), days_since_last_fight: Math.round(rand(2, 28)), injury_pct: rand(0, 18) },
    b: { sleep_hours: rand(5.5, 9.0), days_since_last_fight: Math.round(rand(2, 28)), injury_pct: rand(0, 18) },
  };

  const id = makeId();

  const { error } = await sb.from("mfb_matches").insert({
    id,
    chain_id: 8453,
    contract_address: "SIMULATED",
    match_index: 0,
    fighter_a_id: body.data.fighterAId,
    fighter_b_id: body.data.fighterBId,
    status: "scheduled",
    opens_at: opensAt,
    close_at: closeAt,
    start_at: startAt,
    match_state,
  } as any);

  if (error)
    return NextResponse.json(
      { ok: false, error: "db_write_failed", detail: { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code } },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, id });
}
