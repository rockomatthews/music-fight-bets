/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

const PREVIEW_MATCH_ID = "m_93d453835df54d8c9fce9a20b107471c";

export default function HomeClient() {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  async function load() {
    setStatus("Loading preview...");
    const res = await fetch(`/api/match/${encodeURIComponent(PREVIEW_MATCH_ID)}`);
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Preview error: ${j?.error || "unknown"}`);
      return;
    }
    const vid = j?.render?.video_id as string | undefined;
    if (!vid) {
      setStatus("Preview not ready yet.");
      setVideoId(null);
      return;
    }
    setVideoId(vid);
    setStatus("");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2.2} sx={{ mt: 1 }}>
      <Stack spacing={0.75}>
        <Typography variant="h2">Music Fights</Typography>
        <Typography sx={{ opacity: 0.78, maxWidth: 780 }}>
          Pick a side. Bet USDC on Base. Winners get paid. Each matchup gets a cinematic AI fight clip.
          (Fighters are original characters — no real people.)
        </Typography>
      </Stack>

      <Box sx={{ borderRadius: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)" }}>
        {videoId ? (
          <video
            controls
            playsInline
            preload="metadata"
            style={{ width: "100%", display: "block" }}
            src={`/api/video/${encodeURIComponent(videoId)}/content`}
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

      <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
        Preview match <Link href={`/match/${PREVIEW_MATCH_ID}`}>{PREVIEW_MATCH_ID}</Link>
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
        <Button component={Link} href="/" variant="contained" size="large">
          Enter Feed
        </Button>
      </Stack>

      <Typography sx={{ fontWeight: 950, mt: 1 }}>How it works</Typography>
      <Stack spacing={0.6}>
        <Typography sx={{ opacity: 0.78 }}>1) Fights are scheduled (betting window opens/closes).</Typography>
        <Typography sx={{ opacity: 0.78 }}>2) You bet on Fighter A or Fighter B.</Typography>
        <Typography sx={{ opacity: 0.78 }}>3) The fight resolves and the winner is posted.</Typography>
        <Typography sx={{ opacity: 0.78 }}>4) A highlight clip is generated for the match.</Typography>
      </Stack>
    </Stack>
  );
}
