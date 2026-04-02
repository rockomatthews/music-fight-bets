/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../_supabase_admin";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    matchId: z.string().min(3),
    side: z.enum(["A", "B"]),
    amountUsdc: z.number().positive().max(10_000),
    sessionId: z.string().min(8),
  })
  .strict();

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const body = BodySchema.safeParse(json);
  if (!body.success) return NextResponse.json({ ok: false, error: "bad_request", detail: body.error.flatten() }, { status: 400 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const { data: m, error: mErr } = await sb.from("mfb_matches").select("id,status,close_at").eq("id", body.data.matchId).maybeSingle();
  if (mErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: mErr.message }, { status: 500 });
  if (!m) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (m.status !== "open") return NextResponse.json({ ok: false, error: "not_open" }, { status: 400 });
  if (new Date(m.close_at).getTime() <= Date.now()) return NextResponse.json({ ok: false, error: "closed" }, { status: 400 });

  const { error } = await sb.from("mfb_bets").insert({
    match_id: body.data.matchId,
    session_id: body.data.sessionId,
    side: body.data.side,
    amount_usdc: body.data.amountUsdc,
    wallet: null,
    tx_hash: null,
  } as any);

  if (error)
    return NextResponse.json(
      { ok: false, error: "db_write_failed", detail: { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code } },
      { status: 500 }
    );

  return NextResponse.json({ ok: true });
}
