/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../_supabase_admin";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    // params.id is a MATCH id, not a video id. Look up the latest render for this match.
    const sb = supabaseAdmin();

    const { data: r, error } = await sb
      .from("mfb_renders")
      .select("video_id, status")
      .eq("match_id", params.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, error: "db_read_failed", detail: error.message }, { status: 500 });
    }

    const render = r?.[0] as any;
    const videoId = render?.video_id as string | undefined;
    if (!videoId) {
      return NextResponse.json({ ok: false, error: "no_render" }, { status: 404 });
    }

    // If not completed, still allow preview; browser will poll by refresh.
    return NextResponse.redirect(`/api/video/${encodeURIComponent(videoId)}/content`);
  } catch (e: any) {
    // Vercel sometimes returns an empty 500 if an exception escapes; force a JSON body.
    return NextResponse.json({ ok: false, error: "preview_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
