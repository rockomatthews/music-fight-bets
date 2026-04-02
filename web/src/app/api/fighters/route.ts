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
    .select("id, stage_name, archetype, genre, avatar_url")
    .order("stage_name", { ascending: true })
    .limit(500);

  if (error) return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, fighters: data || [] });
}
