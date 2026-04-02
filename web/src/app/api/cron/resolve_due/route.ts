/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

// Reuse the same logic by importing the admin resolver and calling it via fetch isn't ideal.
// We'll inline-call the handler by dynamically importing it.

export const runtime = "nodejs";

function getSecretFromReq(req: Request) {
  const url = new URL(req.url);
  return url.searchParams.get("secret") || "";
}

export async function GET(req: Request) {
  const secret = getSecretFromReq(req);
  const cronSecret = process.env.MFB_CRON_SECRET || "";
  if (!cronSecret || secret !== cronSecret) {
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
