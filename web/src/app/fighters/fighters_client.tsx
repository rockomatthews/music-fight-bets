/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Card, CardContent, Chip, Divider, Drawer, Stack, Typography, useMediaQuery } from "@mui/material";

type FighterDaily = {
  day: string;
  sleep_hours: number | null;
  injury_pct: number | null;
  morale: number | null;
  camp_quality: number | null;
  travel_fatigue: number | null;
  days_since_last_fight: number | null;
  notes: string | null;
} | null;

type Fighter = {
  id: string;
  stage_name: string;
  archetype: string;
  genre: string;
  avatar_url: string | null;
  record_w?: number;
  record_l?: number;
  strengths?: string[];
  weaknesses?: string[];
  style_tags?: string[];
  attrs?: any;
  daily?: FighterDaily;
};

function fallbackAvatar(id: string) {
  const s = encodeURIComponent(id);
  return `https://api.dicebear.com/7.x/bottts/png?seed=${s}&backgroundColor=070712&radius=24&size=128`;
}

export default function FightersClient() {
  const isMobile = useMediaQuery("(max-width:700px)");
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [status, setStatus] = useState<string>("");
  const [openId, setOpenId] = useState<string | null>(null);

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

  const current = fighters.find((f) => f.id === openId) || null;

  return (
    <>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Typography variant="h4">Fighters</Typography>
        <Typography sx={{ opacity: 0.78 }}>
          Tap a fighter to see the full stat sheet: record, strengths/weaknesses, and today’s condition.
        </Typography>

        {status ? <Typography sx={{ opacity: 0.8 }}>{status}</Typography> : null}

        <Stack spacing={1.2}>
          {fighters.map((f) => {
            const src = f.avatar_url || fallbackAvatar(f.id);
            const w = f.record_w ?? 0;
            const l = f.record_l ?? 0;
            return (
              <Card
                key={f.id}
                sx={{
                  backgroundColor: "rgba(10,10,18,0.98)",
                  backgroundImage: "none",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <CardContent
                  onClick={() => setOpenId(f.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    cursor: "pointer",
                    px: 1.5,
                    py: 1.25,
                    "&:active": { opacity: 0.9 },
                  }}
                >
                  <Image
                    src={src}
                    alt={f.stage_name}
                    width={52}
                    height={52}
                    style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 950 }} noWrap>
                      {f.stage_name}
                    </Typography>
                    <Typography sx={{ opacity: 0.78, fontSize: 13 }} noWrap>
                      {f.archetype} • {f.genre}
                    </Typography>
                    <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                      Record: {w}-{l}
                    </Typography>
                  </div>

                  <ChevronRightIcon style={{ opacity: 0.6 }} />
                </CardContent>
              </Card>
            );
          })}
        </Stack>

        {!fighters.length && !status ? <Typography sx={{ opacity: 0.8 }}>No fighters yet. Run Seed in Admin.</Typography> : null}
      </Stack>

      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={!!openId}
        onClose={() => setOpenId(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#0a0a12",
            backgroundImage: "none",
          },
        }}
        ModalProps={{
          BackdropProps: {
            sx: {
              backgroundColor: "rgba(0,0,0,0.75)",
            },
          },
        }}
      >
        <div style={{ width: isMobile ? "auto" : 420, maxWidth: "90vw", padding: 18 }}>
          {current ? (
            <>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Image
                  src={current.avatar_url || fallbackAvatar(current.id)}
                  alt={current.stage_name}
                  width={72}
                  height={72}
                  style={{ borderRadius: 22, border: "1px solid rgba(255,255,255,0.12)" }}
                />
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 950 }}>{current.stage_name}</Typography>
                  <Typography sx={{ opacity: 0.75 }}>{current.archetype} • {current.genre}</Typography>
                  <Typography sx={{ opacity: 0.85, fontWeight: 900 }}>
                    Record: {(current.record_w ?? 0)}-{(current.record_l ?? 0)}
                  </Typography>
                </div>
              </Stack>

              <Divider sx={{ my: 2, opacity: 0.2 }} />

              <Typography sx={{ fontWeight: 950, mb: 1 }}>Strengths</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {(current.strengths || []).length
                  ? (current.strengths || []).map((s) => <Chip key={s} label={s} />)
                  : <Typography sx={{ opacity: 0.7 }}>Not set yet.</Typography>}
              </Stack>

              <Typography sx={{ fontWeight: 950, mt: 2, mb: 1 }}>Weaknesses</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {(current.weaknesses || []).length
                  ? (current.weaknesses || []).map((s) => <Chip key={s} label={s} variant="outlined" />)
                  : <Typography sx={{ opacity: 0.7 }}>Not set yet.</Typography>}
              </Stack>

              <Typography sx={{ fontWeight: 950, mt: 2, mb: 1 }}>Today’s condition</Typography>
              {current.daily ? (
                <Stack spacing={0.6}>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>Sleep: {current.daily.sleep_hours ?? "n/a"}h</Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>Injury: {current.daily.injury_pct ?? "n/a"}%</Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>Morale: {current.daily.morale ?? "n/a"}</Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>Camp: {current.daily.camp_quality ?? "n/a"}</Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>Travel fatigue: {current.daily.travel_fatigue ?? "n/a"}</Typography>
                  <Typography sx={{ opacity: 0.85, fontSize: 13 }}>Days since last fight: {current.daily.days_since_last_fight ?? "n/a"}</Typography>
                  {current.daily.notes ? <Typography sx={{ opacity: 0.75, fontSize: 13 }}>Notes: {current.daily.notes}</Typography> : null}
                </Stack>
              ) : (
                <Typography sx={{ opacity: 0.7 }}>
                  No daily row yet. The daily cron will generate it (or we can add a manual generate button).
                </Typography>
              )}

              <Divider sx={{ my: 2, opacity: 0.2 }} />
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setOpenId(null);
                }}
                style={{
                  width: "100%",
                  textAlign: "center",
                  padding: "12px 14px",
                  borderRadius: 14,
                  fontWeight: 950,
                  background: "rgba(253,209,4,0.92)",
                  color: "#0a0a12",
                  cursor: "pointer",
                }}
              >
                Close
              </div>
            </>
          ) : (
            <Typography sx={{ opacity: 0.8 }}>No fighter selected.</Typography>
          )}
        </div>
      </Drawer>
    </>
  );
}
