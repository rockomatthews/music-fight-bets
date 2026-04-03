import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // lightweight redirect to the existing streaming endpoint
  // relative redirect works on Vercel
  return NextResponse.redirect(`/api/video/${encodeURIComponent(params.id)}/content`);
}
