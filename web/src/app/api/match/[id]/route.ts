/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../_supabase_admin";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const { data: m, error } = await sb
    .from("mfb_matches")
    .select(
      "id,status,opens_at,close_at,start_at,resolved_winner,resolved_meta, fighterA:mfb_fighters!mfb_matches_fighter_a_id_fkey(id,stage_name,archetype), fighterB:mfb_fighters!mfb_matches_fighter_b_id_fkey(id,stage_name,archetype)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });
  if (!m) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { data: r } = await sb
    .from("mfb_renders")
    .select("id,status,video_id")
    .eq("match_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1);

  return NextResponse.json({ ok: true, match: m, render: r?.[0] || null });
}
