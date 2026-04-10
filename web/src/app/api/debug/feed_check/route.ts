/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "../../_supabase_admin";

export const runtime = "nodejs";

const QuerySchema = z.object({ id: z.string().min(3) }).strict();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ id: url.searchParams.get("id") || "" });
  if (!parsed.success) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const id = parsed.data.id;
  const nowIso = new Date().toISOString();

  const { data: row, error: rowErr } = await sb
    .from("mfb_matches")
    .select("id,status,opens_at,close_at,start_at,resolved_winner")
    .eq("id", id)
    .maybeSingle();

  const { data: qUpcoming, error: qUpErr } = await sb
    .from("mfb_matches")
    .select("id")
    .is("resolved_winner", null)
    .gt("close_at", nowIso)
    .eq("id", id)
    .maybeSingle();

  const { data: qResolved, error: qResErr } = await sb
    .from("mfb_matches")
    .select("id")
    .or(`resolved_winner.not.is.null,close_at.lte.${nowIso}`)
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    nowIso,
    row: row || null,
    rowErr: rowErr ? rowErr.message : null,
    upcomingMatch: qUpcoming || null,
    upcomingErr: qUpErr ? qUpErr.message : null,
    resolvedMatch: qResolved || null,
    resolvedErr: qResErr ? qResErr.message : null,
  });
}
