/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

// preview is pinned in mfb_site_config (key='preview')

const SLIDES = [
  "Review Musicians fight stats",
  "Pick a musician to fight",
  "Win money if they win the fight!",
];

export default function HomeClient() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [, setRenderStatus] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  async function load() {
    setStatus("Loading preview...");

    // Prefer pinned site preview
    const res = await fetch(`/api/site/preview`);
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Preview error: ${j?.error || "unknown"}`);
      return;
    }

    const vid = j?.videoId as string | undefined;
    const st = (j?.status as string | undefined) || null;
    const progress = j?.progress ?? null;
    const lastCheckedAt = j?.lastCheckedAt ?? null;
    const lastError = j?.lastError ?? null;

    setRenderStatus(st);

    if (!vid) {
      setStatus("Preview not set yet. Generate one in Admin.");
      setVideoId(null);
      return;
    }

    // If the render isn't completed yet, don't try to stream it.
    if (st && st !== "completed") {
      const bits = [
        `Preview render is ${st}`,
        progress != null ? `progress ${progress}%` : null,
        lastCheckedAt ? `checked ${new Date(lastCheckedAt).toLocaleTimeString()}` : null,
      ].filter(Boolean);

      if (st === "failed") {
        setStatus(`Preview failed. ${lastError ? `Error: ${typeof lastError === "string" ? lastError : JSON.stringify(lastError)}` : ""}`);
      } else {
        setStatus(bits.join(" • ") + "…");
      }
      setVideoId(null);
      return;
    }

    // Completed render can still have an expired download URL (48h).
    // If streaming fails, /api/video/[id]/content will return 502 with detail.
    setVideoId(vid);
    setStatus("");
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <Stack spacing={2.2} sx={{ mt: 1 }}>
      {/* homepage-only logo */}
      <Box sx={{ display: "flex", justifyContent: "center", py: { xs: 1.5, sm: 2.5 } }}>
        <Image
          src="/logo.png"
          alt="Music Fights"
          width={520}
          height={520}
          priority
          style={{
            width: "min(360px, 78vw)",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.55))",
          }}
        />
      </Box>

      {/* slider */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          minHeight: 46,
          mb: 1.2,
        }}
      >
        <Typography
          key={slide}
          sx={{
            color: "#fdd104",
            fontWeight: 950,
            fontStyle: "italic",
            fontSize: { xs: 18, sm: 22 },
            textAlign: "center",
            letterSpacing: -0.2,
            animation: "mfbFade 2.6s ease-in-out",
          }}
        >
          {SLIDES[slide]}
        </Typography>
      </Box>

      <Box sx={{ borderRadius: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
        {videoId ? (
          <video
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", display: "block" }}
            src={`/api/video/${encodeURIComponent(videoId)}/content`}
            onError={() => {
              setStatus("Preview video expired (downloads expire after ~48h). Generate a new preview in Admin.");
              setVideoId(null);
            }}
          />
        ) : (
          <div style={{ padding: 18 }}>
            <Typography sx={{ opacity: 0.85 }}>{status || "No preview available."}</Typography>
            <Button onClick={load} variant="outlined" sx={{ mt: 1.5 }}>
              Retry
            </Button>
          </div>
        )}
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
        <Button component={Link} href="/arena" variant="contained" size="large">
          Enter Arena
        </Button>
      </Stack>
    </Stack>
  );
}
