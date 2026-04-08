/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { envServer } from "../../../../lib/env_server";
import { supabaseAdmin } from "../../../_supabase_admin";
import { generateFighters } from "../../../../lib/fighter_factory";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    count: z.number().int().min(1).max(500).default(250),
    seed: z.number().int().min(1).max(1_000_000_000).default(1337),
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

  const fighters = generateFighters(body.count ?? 250, body.seed ?? 1337);

  const rows = fighters.map((f: any) => ({
    id: f.id,
    stage_name: f.stageName,
    archetype: f.archetype,
    genre: f.genre,
    palette: f.palette || [],
    signature_moves: f.signatureMoves || [],
    prompt_style: f.promptStyle || null,
    avatar_url: f.avatarUrl || null,
    attrs: f.attrs || {},
  }));

  const { error } = await sb.from("mfb_fighters").upsert(rows, { onConflict: "id" });
  if (error)
    return NextResponse.json(
      {
        ok: false,
        error: "db_write_failed",
        detail: {
          message: error.message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        },
      },
      { status: 500 }
    );

  return NextResponse.json({ ok: true, count: rows.length });
}
