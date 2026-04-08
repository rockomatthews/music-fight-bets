/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../_supabase_admin";

export const runtime = "nodejs";

const QuerySchema = z
  .object({
    sessionId: z.string().min(8),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    sessionId: url.searchParams.get("sessionId") || "",
    limit: url.searchParams.get("limit") || "50",
  });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "bad_request", detail: parsed.error.flatten() }, { status: 400 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const { data: bets, error } = await sb
    .from("mfb_bets")
    .select("id, created_at, match_id, side, amount_usdc")
    .eq("session_id", parsed.data.sessionId)
    .order("created_at", { ascending: false })
    .limit(parsed.data.limit);

  if (error) return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });

  const matchIds = Array.from(new Set((bets || []).map((b: any) => b.match_id)));

  const matchMap: Record<string, any> = {};
  if (matchIds.length) {
    const { data: matches } = await sb
      .from("mfb_matches")
      .select(
        "id,status,opens_at,close_at,start_at,resolved_winner,fighter_a_id,fighter_b_id,fighterA:mfb_fighters!mfb_matches_fighter_a_id_fkey(stage_name),fighterB:mfb_fighters!mfb_matches_fighter_b_id_fkey(stage_name)"
      )
      .in("id", matchIds);

    for (const m of matches || []) matchMap[(m as any).id] = m;
  }

  const rows = (bets || []).map((b: any) => {
    const m = matchMap[b.match_id] || null;
    const aName = m?.fighterA?.stage_name || m?.fighter_a_id || "A";
    const bName = m?.fighterB?.stage_name || m?.fighter_b_id || "B";
    const pick = b.side === "A" ? aName : bName;

    // payout calc is placeholder for now
    const resolvedWinner = m?.resolved_winner || null;
    const isWin = resolvedWinner ? resolvedWinner === b.side : null;

    return {
      id: b.id,
      createdAt: b.created_at,
      matchId: b.match_id,
      side: b.side,
      amountUsdc: Number(b.amount_usdc || 0),
      matchStatus: m?.status || null,
      matchup: m ? `${aName} vs ${bName}` : b.match_id,
      pick,
      resolvedWinner,
      isWin,
    };
  });

  return NextResponse.json({ ok: true, rows });
}
