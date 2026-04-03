/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    fighterAId: z.string().min(2).default("vf_barogue"),
    fighterBId: z.string().min(2).default("nk_neonkeys"),
  })
  .partial()
  .strict();

export async function POST(req: Request) {
  const secret = req.headers.get("x-admin-secret") || "";

  let env;
  try {
    env = envServer();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }
  if (secret !== env.MFB_ADMIN_SECRET) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const body = BodySchema.safeParse(json);
  if (!body.success) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "missing_openai_key" }, { status: 500 });

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  // Load fighter look bibles
  const { data: fighters, error: fErr } = await sb
    .from("mfb_fighters")
    .select("id, stage_name, archetype, prompt_style, attrs")
    .in("id", [body.data.fighterAId, body.data.fighterBId]);
  if (fErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: fErr.message }, { status: 500 });

  const fa = (fighters || []).find((f: any) => f.id === body.data.fighterAId);
  const fb = (fighters || []).find((f: any) => f.id === body.data.fighterBId);
  if (!fa || !fb) return NextResponse.json({ ok: false, error: "fighter_not_found" }, { status: 404 });

  const aName = fa.stage_name;
  const bName = fb.stage_name;
  const aStyle = fa.prompt_style || fa.archetype || "";
  const bStyle = fb.prompt_style || fb.archetype || "";
  const aAttrs = fa.attrs || {};
  const bAttrs = fb.attrs || {};

  const aLook = `${aName} look: ${aAttrs.silhouette || ""}. Props: ${aAttrs.prop || ""}. Stage: ${aAttrs.stage_fx || ""}.`;
  const bLook = `${bName} look: ${bAttrs.silhouette || ""}. Props: ${bAttrs.prop || ""}. Stage: ${bAttrs.stage_fx || ""}.`;

  const prompt = `8-second cinematic music-arena boxing performance (non-graphic). Establishing walkout shot → face-off → fast exchange → decisive moment. Two original fictional music-fighter archetypes: ${aName} (${aStyle}) vs ${bName} (${bStyle}).

Make it unmistakably musician-coded:
- Visible non-branded stage props (mic stands, amp stacks, cables, spotlights).
- Each fighter carries their signature prop (non-weapon) during walkout and between exchanges.

Fighter looks:
- ${aLook}
- ${bLook}

End with a clear winner pose (non-graphic). Vibrant concert lighting, smoke haze, dramatic crowd lights. No logos, no text, no real people, no copyrighted characters.`;

  const res = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sora-2", prompt, size: "1280x720", seconds: "8" }),
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.id) {
    return NextResponse.json({ ok: false, error: "openai_failed", detail: j || null }, { status: 500 });
  }

  // store as pinned site preview
  const { error: uErr } = await sb.from("mfb_site_config").upsert(
    {
      key: "preview",
      value: { video_id: j.id, status: j.status || "queued", fighters: [fa.id, fb.id] },
      updated_at: new Date().toISOString(),
    } as any,
    { onConflict: "key" }
  );

  if (uErr) return NextResponse.json({ ok: false, error: "db_write_failed", detail: uErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, video: j });
}
