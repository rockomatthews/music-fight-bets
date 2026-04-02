/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";

type Fighter = {
  id: string;
  stage_name: string;
  archetype: string;
  genre: string;
  avatar_url: string | null;
};

function fallbackAvatar(id: string) {
  const s = encodeURIComponent(id);
  return `https://api.dicebear.com/7.x/bottts/png?seed=${s}&backgroundColor=070712&radius=24&size=128`;
}

export default function FightersClient() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [status, setStatus] = useState<string>("");

  async function load() {
    setStatus("Loading...");
    const res = await fetch("/api/fighters");
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Error: ${j?.error || "unknown"}`);
      return;
    }
    setFighters(j.fighters || []);
    setStatus("");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography variant="h4">Fighters</Typography>
      <Typography sx={{ opacity: 0.78 }}>
        Every fighter should have a recognizable look. If an avatar isn’t set yet, we show a placeholder.
      </Typography>

      {status ? <Typography sx={{ opacity: 0.8 }}>{status}</Typography> : null}

      <Stack spacing={1.2}>
        {fighters.map((f) => {
          const src = f.avatar_url || fallbackAvatar(f.id);
          return (
            <Card key={f.id}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Image
                  src={src}
                  alt={f.stage_name}
                  width={56}
                  height={56}
                  style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)" }}
                />
                <div style={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950 }}>{f.stage_name}</Typography>
                  <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{f.archetype} • {f.genre}</Typography>
                  <Typography sx={{ opacity: 0.55, fontSize: 12 }}>{f.id}</Typography>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {!fighters.length && !status ? <Typography sx={{ opacity: 0.8 }}>No fighters yet. Run Seed in Admin.</Typography> : null}
    </Stack>
  );
}
