import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "missing_openai_key" }, { status: 500 });

  const url = `https://api.openai.com/v1/videos/${encodeURIComponent(params.id)}/content`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "upstream_failed", detail: text }, { status: 500 });
  }

  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "video/mp4",
      "Cache-Control": "public, max-age=300",
    },
  });
}
