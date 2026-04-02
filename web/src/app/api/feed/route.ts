/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../_supabase_admin";

export const runtime = "nodejs";

export async function GET() {
  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const { data: matches, error } = await sb
    .from("mfb_matches")
    // Alias the two joins so PostgREST doesn't collide table names
    .select(
      "id, status, opens_at, close_at, start_at, resolved_winner, resolved_meta, fighter_a_id, fighter_b_id, fighterA:mfb_fighters!mfb_matches_fighter_a_id_fkey(stage_name, archetype, avatar_url), fighterB:mfb_fighters!mfb_matches_fighter_b_id_fkey(stage_name, archetype, avatar_url)"
    )
    .order("created_at", { ascending: false })
    .limit(25);

  if (error)
    return NextResponse.json(
      { ok: false, error: "db_read_failed", detail: { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code } },
      { status: 500 }
    );

  // Pool totals from bets (simulated)
  const matchIds = (matches || []).map((m: any) => m.id);
  const pools: Record<string, { a: number; b: number }> = {};
  for (const id of matchIds) pools[id] = { a: 0, b: 0 };

  if (matchIds.length) {
    const { data: bets, error: bErr } = await sb
      .from("mfb_bets")
      .select("match_id, side, amount_usdc")
      .in("match_id", matchIds);
    if (bErr)
      return NextResponse.json(
        { ok: false, error: "db_read_failed", detail: { message: bErr.message, details: (bErr as any).details, hint: (bErr as any).hint, code: (bErr as any).code } },
        { status: 500 }
      );
    for (const b of bets || []) {
      const amt = Number((b as any).amount_usdc || 0);
      if (!pools[(b as any).match_id]) continue;
      if ((b as any).side === "A") pools[(b as any).match_id].a += amt;
      else pools[(b as any).match_id].b += amt;
    }
  }

  const rows = (matches || []).map((m: any) => {
    const a = m.fighterA?.stage_name || m.fighter_a_id;
    const b = m.fighterB?.stage_name || m.fighter_b_id;
    return {
      id: m.id,
      status: m.status,
      opensAt: m.opens_at,
      closeAt: m.close_at,
      startAt: m.start_at,
      resolvedWinner: m.resolved_winner || null,
      resolvedMeta: m.resolved_meta || null,
      fighterA: { id: m.fighter_a_id, name: a, archetype: m.fighterA?.archetype, avatarUrl: m.fighterA?.avatar_url || null },
      fighterB: { id: m.fighter_b_id, name: b, archetype: m.fighterB?.archetype, avatarUrl: m.fighterB?.avatar_url || null },
      poolA: pools[m.id]?.a || 0,
      poolB: pools[m.id]?.b || 0,
    };
  });

  return NextResponse.json({ ok: true, rows });
}
