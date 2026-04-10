/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

// Reuse the same logic by importing the admin resolver and calling it via fetch isn't ideal.
// We'll inline-call the handler by dynamically importing it.

export const runtime = "nodejs";

function bearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] || "";
}

function querySecret(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("secret") || "";
}

function vercelCron(req: Request) {
  return (req.headers.get("x-vercel-cron") || "") === "1";
}

function cronAuthed(req: Request) {
  // Allow Vercel Cron without extra config
  if (vercelCron(req)) return true;

  // Preferred: Cron secret via Authorization header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) return bearer(req) === cronSecret;

  // Back-compat: custom query secret
  const legacy = process.env.MFB_CRON_SECRET;
  if (legacy) return querySecret(req) === legacy;

  return false;
}

export async function GET(req: Request) {
  if (!cronAuthed(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Import and call the admin resolve_due handler
  const mod = await import("../../admin/match/resolve_due/route");
  // Fake the header auth expected by that route
  const headers = new Headers();
  headers.set("x-admin-secret", process.env.MFB_ADMIN_SECRET || "");
  const r = await mod.POST(new Request(req.url, { method: "POST", headers }));
  const j = await r.json().catch(() => null);

  return NextResponse.json({ ok: true, upstream: j });
}
