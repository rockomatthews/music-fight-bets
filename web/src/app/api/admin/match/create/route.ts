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
    closeInMinutes: z.number().int().min(1).max(24 * 60).default(60),
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

  const closeAt = new Date(Date.now() + body.data.closeInMinutes * 60_000).toISOString();
  const id = makeId();

  const { error } = await sb.from("mfb_matches").insert({
    id,
    chain_id: 8453,
    contract_address: "SIMULATED",
    match_index: 0,
    fighter_a_id: body.data.fighterAId,
    fighter_b_id: body.data.fighterBId,
    status: "open",
    close_at: closeAt,
  } as any);

  if (error) return NextResponse.json({ ok: false, error: "db_write_failed", detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id });
}
