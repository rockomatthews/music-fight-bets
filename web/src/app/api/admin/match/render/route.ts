/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";
import { openaiJson, openaiKey } from "../../../_openai";

export const runtime = "nodejs";

const BodySchema = z.object({ matchId: z.string().min(3) }).strict();

function promptForMatch(m: any) {
  const aName = m.fighterA?.stage_name || "Fighter A";
  const bName = m.fighterB?.stage_name || "Fighter B";
  const aStyle = m.fighterA?.prompt_style || m.fighterA?.archetype || "";
  const bStyle = m.fighterB?.prompt_style || m.fighterB?.archetype || "";
  const aAttrs = m.fighterA?.attrs || {};
  const bAttrs = m.fighterB?.attrs || {};
  const winner = m.resolved_winner === "A" ? aName : bName;

  const aLook = `${aName} look: ${aAttrs.silhouette || ""}. Props: ${aAttrs.prop || ""}. Stage: ${aAttrs.stage_fx || ""}.`;
  const bLook = `${bName} look: ${bAttrs.silhouette || ""}. Props: ${bAttrs.prop || ""}. Stage: ${bAttrs.stage_fx || ""}.`;

  return `12-second cinematic music-arena boxing performance (non-graphic). Establishing walkout shot → close face-off → fast exchange → decisive moment. Two original fictional music-fighter archetypes: ${aName} (${aStyle}) vs ${bName} (${bStyle}).

Make it unmistakably musician-coded:
- Visible non-branded stage props (mic stands, amp stacks, cables, spotlights).
- Each fighter carries their signature prop (non-weapon) during walkout and between exchanges.

Fighter looks:
- ${aLook}
- ${bLook}

End with a clear finishing blow: the winner uses their signature prop to strike the opponent (stylized, non-graphic, safe). The prop impact must be visible in-frame, then cut to ${winner} victory pose holding the prop.

Vibrant concert lighting, smoke haze, dramatic crowd lights. No logos, no text, no real people, no copyrighted characters.`;
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

  const { data: existing } = await sb
    .from("mfb_renders")
    .select("id, status, video_id")
    .eq("match_id", body.data.matchId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existing?.length && ["queued", "in_progress", "completed"].includes((existing[0] as any).status)) {
    return NextResponse.json({ ok: true, reused: true, render: existing[0] });
  }

  const { data: m, error: mErr } = await sb
    .from("mfb_matches")
    .select(
      "id,status,resolved_winner, fighterA:mfb_fighters!mfb_matches_fighter_a_id_fkey(stage_name, archetype, prompt_style, attrs), fighterB:mfb_fighters!mfb_matches_fighter_b_id_fkey(stage_name, archetype, prompt_style, attrs)"
    )
    .eq("id", body.data.matchId)
    .maybeSingle();

  if (mErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: mErr.message }, { status: 500 });
  if (!m) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (m.status !== "resolved") return NextResponse.json({ ok: false, error: "not_resolved" }, { status: 400 });

  const prompt = promptForMatch(m);

  try {
    const key = openaiKey();

    // Start Sora job
    const video = await openaiJson<any>("https://api.openai.com/v1/videos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sora-2",
        prompt,
        size: "1280x720",
        seconds: "12",
      }),
    });

    const { error: iErr } = await sb.from("mfb_renders").insert({
      match_id: body.data.matchId,
      provider: "openai",
      video_id: video.id,
      status: video.status || "queued",
      prompt,
    } as any);

    if (iErr) {
      return NextResponse.json({ ok: false, error: "db_write_failed", detail: iErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, video });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "openai_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
