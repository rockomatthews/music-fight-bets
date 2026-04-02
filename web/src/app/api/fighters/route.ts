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

  const { data, error } = await sb
    .from("mfb_fighters")
    .select("id, stage_name, archetype, genre, avatar_url, record_w, record_l, strengths, weaknesses, style_tags, attrs")
    .order("stage_name", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });

  const day = new Date().toISOString().slice(0, 10);
  const ids = (data || []).map((f: any) => f.id);

  const dailyMap: Record<string, any> = {};
  if (ids.length) {
    const { data: daily } = await sb
      .from("mfb_fighter_daily")
      .select("fighter_id, day, sleep_hours, injury_pct, morale, camp_quality, travel_fatigue, days_since_last_fight, notes")
      .eq("day", day)
      .in("fighter_id", ids);

    for (const d of daily || []) {
      dailyMap[(d as any).fighter_id] = d;
    }
  }

  const fighters = (data || []).map((f: any) => ({
    ...f,
    daily: dailyMap[f.id] || null,
  }));

  return NextResponse.json({ ok: true, day, fighters });
}
