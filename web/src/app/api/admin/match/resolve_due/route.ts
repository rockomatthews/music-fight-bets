/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";

export const runtime = "nodejs";

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function seeded01(seed: string) {
  // simple deterministic hash -> [0,1)
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function fighterScore(attrs: any, state: any) {
  const a = attrs || {};
  const s = state || {};

  const power = Number(a.power ?? 0.5);
  const speed = Number(a.speed ?? 0.5);
  const stamina = Number(a.stamina ?? 0.5);
  const chin = Number(a.chin ?? 0.5);
  const ring_iq = Number(a.ring_iq ?? 0.5);

  // base ability
  let score = power * 0.35 + speed * 0.25 + stamina * 0.2 + chin * 0.1 + ring_iq * 0.1;

  // match-state adjustments
  const sleep = Number(s.sleep_hours ?? 7.0);
  const days = Number(s.days_since_last_fight ?? 14);
  const injury = Number(s.injury_pct ?? 0);

  // Sleep: best around 7.5-8.2
  const sleepPenalty = Math.abs(sleep - 7.8) / 6; // ~0..1
  score -= sleepPenalty * 0.08;

  // Too soon = fatigue, too long = rust (soft)
  const soon = Math.max(0, 7 - days) / 7;
  const rust = Math.max(0, days - 35) / 35;
  score -= soon * 0.06;
  score -= rust * 0.05;

  // Injury is big
  score -= Math.min(0.35, (injury / 100) * 0.9);

  return Math.max(0.01, Math.min(0.99, score));
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

  let sb;
  try {
    sb = supabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "missing_env", detail: String(e?.message || e) }, { status: 500 });
  }

  const nowIso = new Date().toISOString();

  // Pull matches that might need a state transition/resolution
  const { data: matches, error } = await sb
    .from("mfb_matches")
    .select(
      "id,status,opens_at,close_at,start_at,match_state,fighter_a_id,fighter_b_id, fighterA:mfb_fighters!mfb_matches_fighter_a_id_fkey(stage_name,archetype,prompt_style,attrs), fighterB:mfb_fighters!mfb_matches_fighter_b_id_fkey(stage_name,archetype,prompt_style,attrs)"
    )
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error)
    return NextResponse.json(
      { ok: false, error: "db_read_failed", detail: { message: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code } },
      { status: 500 }
    );

  let changed = 0;
  let resolved = 0;

  for (const m of matches || []) {
    const opensAt = new Date((m as any).opens_at).getTime();
    const closeAt = new Date((m as any).close_at).getTime();
    const startAt = new Date((m as any).start_at).getTime();
    const now = Date.now();

    let status = (m as any).status as string;

    // state transitions
    if (status === "scheduled" && now >= opensAt) status = "open";
    if ((status === "scheduled" || status === "open") && now >= closeAt) status = "closed";

    const needsResolve = status === "closed" && now >= startAt;

    if (needsResolve) {
      const state = (m as any).match_state || {};
      const scoreA = fighterScore((m as any).fighterA?.attrs, state.a);
      const scoreB = fighterScore((m as any).fighterB?.attrs, state.b);

      const k = 0.12;
      const probA = sigmoid((scoreA - scoreB) / k);
      const u = seeded01(String((m as any).id));
      const winner = u < probA ? "A" : "B";

      const { error: uErr } = await sb
        .from("mfb_matches")
        .update({
          status: "resolved",
          resolved_winner: winner,
          resolved_meta: { probA, scoreA, scoreB, u, resolved_at: nowIso },
          updated_at: nowIso,
        } as any)
        .eq("id", (m as any).id);

      if (!uErr) {
        resolved++;
        changed++;

        // Kick off a render job (best-effort). If it fails, fight result still stands.
        try {
          const { data: existing } = await sb
            .from("mfb_renders")
            .select("id,status")
            .eq("match_id", (m as any).id)
            .order("created_at", { ascending: false })
            .limit(1);

          const already = existing?.length && ["queued", "in_progress", "completed"].includes((existing[0] as any).status);

          if (!already) {
            const aName = (m as any).fighterA?.stage_name || "Fighter A";
            const bName = (m as any).fighterB?.stage_name || "Fighter B";
            const aStyle = (m as any).fighterA?.prompt_style || (m as any).fighterA?.archetype || "";
            const bStyle = (m as any).fighterB?.prompt_style || (m as any).fighterB?.archetype || "";
            const aAttrs = (m as any).fighterA?.attrs || {};
            const bAttrs = (m as any).fighterB?.attrs || {};
            const winnerName = winner === "A" ? aName : bName;

            const aLook = `${aName} look: ${aAttrs.silhouette || ""}. Props: ${aAttrs.prop || ""}. Stage: ${aAttrs.stage_fx || ""}.`;
            const bLook = `${bName} look: ${bAttrs.silhouette || ""}. Props: ${bAttrs.prop || ""}. Stage: ${bAttrs.stage_fx || ""}.`;

            const prompt = `8-second cinematic music-arena boxing performance (non-graphic). Establishing walkout shot → close face-off → fast exchange → decisive moment. Two original fictional music-fighter archetypes: ${aName} (${aStyle}) vs ${bName} (${bStyle}).

Make it unmistakably musician-coded:
- Visible non-branded stage props (mic stands, amp stacks, cables, spotlights).
- Each fighter carries their signature prop (non-weapon) during walkout and between exchanges.

Fighter looks:
- ${aLook}
- ${bLook}

End with ${winnerName} clearly winning (clean KO pose or referee stop, non-graphic). Vibrant concert lighting, smoke haze, dramatic crowd lights. No logos, no text, no real people, no copyrighted characters.`;

            const key = process.env.OPENAI_API_KEY;
            if (key) {
              const res = await fetch("https://api.openai.com/v1/videos", {
                method: "POST",
                headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "sora-2", prompt, size: "1280x720", seconds: "8" }),
              });
              const j = await res.json().catch(() => null);
              if (res.ok && j?.id) {
                await sb.from("mfb_renders").insert({
                  match_id: (m as any).id,
                  provider: "openai",
                  video_id: j.id,
                  status: j.status || "queued",
                  prompt,
                } as any);
              }
            }
          }
        } catch {
          // ignore
        }
      }

      continue;
    }

    if (status !== (m as any).status) {
      const { error: uErr } = await sb
        .from("mfb_matches")
        .update({ status, updated_at: nowIso } as any)
        .eq("id", (m as any).id);
      if (!uErr) {
        changed++;
      }
    }
  }

  return NextResponse.json({ ok: true, changed, resolved });
}
