/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase_admin";

export const runtime = "nodejs";

function vercelCron(req: Request) {
  return (req.headers.get("x-vercel-cron") || "") === "1";
}

export async function GET(req: Request) {
  if (!vercelCron(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const nowIso = new Date().toISOString();

  // count bettable fights (not resolved, close in future)
  const { data: openRows, error: oErr } = await sb
    .from("mfb_matches")
    .select("id")
    .is("resolved_winner", null)
    .gt("close_at", nowIso)
    .limit(50);
  if (oErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: oErr.message }, { status: 500 });

  const openCount = (openRows || []).length;
  const need = Math.max(0, 3 - openCount);
  if (need === 0) return NextResponse.json({ ok: true, openCount, created: 0 });

  // sample fighters
  const { data: fighters, error: fErr } = await sb.from("mfb_fighters").select("id").limit(800);
  if (fErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: fErr.message }, { status: 500 });

  const ids = (fighters || []).map((f: any) => f.id);
  if (ids.length < 2) return NextResponse.json({ ok: false, error: "no_fighters" }, { status: 400 });

  function pick() {
    return ids[Math.floor(Math.random() * ids.length)];
  }

  const created: string[] = [];
  for (let i = 0; i < need; i++) {
    const a = pick();
    let b = pick();
    let tries = 0;
    while (a === b && tries++ < 10) b = pick();

    const id = `m_${crypto.randomUUID().replace(/-/g, "")}`;
    const now = Date.now();
    const opensAt = new Date(now + 60_000 * (i * 2)).toISOString();
    const closeAt = new Date(now + 60_000 * (10 + i * 2)).toISOString();
    const startAt = new Date(now + 60_000 * (12 + i * 2)).toISOString();

    const { error } = await sb.from("mfb_matches").insert({
      id,
      chain_id: 8453,
      contract_address: "SIMULATED",
      match_index: 0,
      fighter_a_id: a,
      fighter_b_id: b,
      status: "scheduled",
      opens_at: opensAt,
      close_at: closeAt,
      start_at: startAt,
      match_state: {},
    } as any);

    if (!error) created.push(id);
  }

  return NextResponse.json({ ok: true, openCount, created: created.length, ids: created });
}
