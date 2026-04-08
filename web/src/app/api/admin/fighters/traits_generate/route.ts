/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    limit: z.number().int().min(1).max(2000).default(1000),
    seed: z.number().int().min(1).max(1_000_000_000).default(1337),
    overwrite: z.boolean().default(false),
  })
  .partial()
  .strict();

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRENGTHS = [
  "Explosive combos",
  "Footwork",
  "Counterpunching",
  "Cardio",
  "Clutch factor",
  "Ring IQ",
  "Pressure",
  "Timing",
  "Reach control",
  "Chin",
  "Body shots",
  "Rhythm disruption",
  "Feints",
  "Dirty boxing",
  "Clinching",
  "Southpaw tricks",
  "Power",
  "Speed",
  "Precision",
  "Momentum swings",
];

const WEAKNESSES = [
  "Glass chin",
  "Gasses out",
  "Overextends",
  "Telegraphs strikes",
  "Susceptible to counters",
  "Poor clinch defense",
  "Low output",
  "Wild under pressure",
  "Bad footwork",
  "Injury prone",
  "Slow starter",
  "Gets sloppy late",
  "Weak body defense",
  "Falls for feints",
  "One-dimensional",
  "Bad distance management",
  "Panics when hurt",
  "Can’t cut off the ring",
];

const STYLE_TAGS = [
  "brawler",
  "sniper",
  "counter",
  "pressure",
  "tempo",
  "trickster",
  "iron-jaw",
  "glass-cannon",
  "volume",
  "power",
  "slick",
];

function pickN<T>(arr: T[], n: number, rnd: () => number): T[] {
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length) {
    const i = Math.floor(rnd() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
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

  const bodyRaw = await req.json().catch(() => ({}));
  const body = BodySchema.parse(bodyRaw);

  const { data: fighters, error: fErr } = await sb
    .from("mfb_fighters")
    .select("id,strengths,weaknesses,style_tags")
    .limit(body.limit ?? 1000);
  if (fErr) return NextResponse.json({ ok: false, error: "db_read_failed", detail: fErr.message }, { status: 500 });

  const rnd = mulberry32(body.seed ?? 1337);

  let updated = 0;
  for (const f of fighters || []) {
    const has = (arr: any) => Array.isArray(arr) && arr.length;
    if (!body.overwrite && (has((f as any).strengths) || has((f as any).weaknesses) || has((f as any).style_tags))) continue;

    const strengths = pickN(STRENGTHS, 3, rnd);
    const weaknesses = pickN(WEAKNESSES, 2, rnd);

    // Make "fair" kits: if high power, give a control weakness sometimes.
    const tags = pickN(STYLE_TAGS, 2, rnd);
    const isPower = tags.includes("power") || strengths.includes("Power");
    if (isPower && !weaknesses.includes("Overextends") && rnd() < 0.6) weaknesses[0] = "Overextends";

    const { error } = await sb
      .from("mfb_fighters")
      .update({ strengths, weaknesses, style_tags: tags })
      .eq("id", (f as any).id);
    if (!error) updated++;
  }

  return NextResponse.json({ ok: true, updated });
}
