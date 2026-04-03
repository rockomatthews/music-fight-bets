import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "missing_openai_key" }, { status: 500 });

  const url = `https://api.openai.com/v1/videos/${encodeURIComponent(params.id)}/content`;

  const range = req.headers.get("range");
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      ...(range ? { Range: range } : {}),
    },
  });

  // allow partial content
  if (!(res.status === 200 || res.status === 206)) {
    const text = await res.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "upstream_failed", detail: text }, { status: 500 });
  }

  const buf = await res.arrayBuffer();

  const headers: Record<string, string> = {
    "Content-Type": res.headers.get("content-type") || "video/mp4",
    "Cache-Control": "public, max-age=300",
    "Accept-Ranges": "bytes",
  };

  const cr = res.headers.get("content-range");
  if (cr) headers["Content-Range"] = cr;
  const cl = res.headers.get("content-length");
  if (cl) headers["Content-Length"] = cl;

  return new NextResponse(buf, {
    status: res.status,
    headers,
  });
}
