"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

type FeedRow = {
  id: string;
  status: string;
  closeAt: string;
  fighterA: { id: string; name: string };
  fighterB: { id: string; name: string };
  poolA: number;
  poolB: number;
};

function getSecret(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("mfb_admin_secret") || "";
}

function setSecret(v: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("mfb_admin_secret", v);
}

export default function AdminClient() {
  const [secret, setSecretState] = useState("");
  const [status, setStatus] = useState<string>("");
  const [feed, setFeed] = useState<FeedRow[]>([]);

  const [fighterAId, setFighterAId] = useState("vf_barogue");
  const [fighterBId, setFighterBId] = useState("nk_neonkeys");
  const [opensInMinutes, setOpensInMinutes] = useState("0");
  const [closeInMinutes, setCloseInMinutes] = useState("10");
  const [startInMinutes, setStartInMinutes] = useState("12");

  const headerSecret = useMemo(() => secret.trim(), [secret]);

  async function loadFeed() {
    const res = await fetch("/api/feed");
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
      setStatus(`Feed error: ${j?.error || "unknown"}${d}`);
      return;
    }
    setFeed(j.rows || []);
  }

  async function seedFighters() {
    setStatus("Seeding fighters...");
    const res = await fetch("/api/admin/seed", {
      method: "POST",
      headers: {
        "x-admin-secret": headerSecret,
      },
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
      setStatus(`Seed failed: ${j?.error || "unknown"}${d}`);
      return;
    }
    setStatus(`Seeded ${j.count} fighters.`);
  }

  async function generateFighters(count = 250) {
    setStatus(`Generating ${count} fighters...`);
    const res = await fetch("/api/admin/fighters/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": headerSecret,
      },
      body: JSON.stringify({ count }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
      setStatus(`Generate failed: ${j?.error || "unknown"}${d}`);
      return;
    }
    setStatus(`Generated ${j.count} fighters.`);
  }

  async function createMatch() {
    const o = Number(opensInMinutes);
    const c = Number(closeInMinutes);
    const s = Number(startInMinutes);
    if (!Number.isFinite(o) || o < 0) {
      setStatus("Bad opensInMinutes");
      return;
    }
    if (!Number.isFinite(c) || c <= 0) {
      setStatus("Bad closeInMinutes");
      return;
    }
    if (!Number.isFinite(s) || s <= 0) {
      setStatus("Bad startInMinutes");
      return;
    }

    setStatus("Creating match...");
    const res = await fetch("/api/admin/match/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": headerSecret,
      },
      body: JSON.stringify({ fighterAId, fighterBId, opensInMinutes: o, closeInMinutes: c, startInMinutes: s }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
      setStatus(`Create match failed: ${j?.error || "unknown"}${d}`);
      return;
    }
    setStatus(`Created match ${j.id}`);
    await loadFeed();
  }

  useEffect(() => {
    const s = getSecret();
    setSecretState(s);
    loadFeed();
  }, []);

  return (
    <Stack spacing={2.2} sx={{ mt: 1 }}>
      <Typography variant="h4">Admin</Typography>

      <Alert severity="warning">
        This page uses <b>MFB_ADMIN_SECRET</b> stored in your browser localStorage.
        Don’t share it.
      </Alert>

      <Card>
        <CardContent>
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 950 }}>Admin secret</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
              <TextField
                value={secret}
                onChange={(e) => {
                  setSecretState(e.target.value);
                  setSecret(e.target.value);
                }}
                placeholder="paste MFB_ADMIN_SECRET"
                fullWidth
                size="small"
              />
              <Button variant="outlined" onClick={loadFeed}>Refresh</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 950 }}>Seed fighters</Typography>
                <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                  Loads the starter fighter roster from the repo seed file into Supabase.
                </Typography>
              </Box>
              <Button variant="contained" onClick={seedFighters}>Seed 10</Button>
            </Stack>

            <Divider sx={{ opacity: 0.15 }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 950 }}>Generate fighters</Typography>
                <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                  Creates lots of original fighters (no real people) with a basic look bible (silhouette/prop/stage_fx).
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1 }>
                <Button variant="outlined" onClick={() => generateFighters(50)}>+50</Button>
                <Button variant="outlined" onClick={() => generateFighters(250)}>+250</Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950 }}>Generate new home preview clip</Typography>
              <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                Creates a fresh 8s Sora clip using two fighters’ look bibles and pins it to /home.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={async () => {
                setStatus("Generating preview...");
                const res = await fetch("/api/admin/preview/generate", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-admin-secret": headerSecret,
                  },
                  body: JSON.stringify({ fighterAId, fighterBId }),
                });
                const j = await res.json().catch(() => null);
                if (!res.ok || !j?.ok) {
                  const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
                  setStatus(`Preview generate failed: ${j?.error || "unknown"}${d}`);
                  return;
                }
                setStatus(`Preview started: ${j.video.id} (${j.video.status})`);
              }}
            >
              Generate
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 950 }}>Create match</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                label="Fighter A id"
                value={fighterAId}
                onChange={(e) => setFighterAId(e.target.value)}
                size="small"
                fullWidth
              />
              <TextField
                label="Fighter B id"
                value={fighterBId}
                onChange={(e) => setFighterBId(e.target.value)}
                size="small"
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
              <TextField
                label="Opens in (min)"
                value={opensInMinutes}
                onChange={(e) => setOpensInMinutes(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              />
              <TextField
                label="Closes in (min)"
                value={closeInMinutes}
                onChange={(e) => setCloseInMinutes(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              />
              <TextField
                label="Fight in (min)"
                value={startInMinutes}
                onChange={(e) => setStartInMinutes(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              />
              <Button variant="contained" onClick={createMatch}>Create</Button>
            </Stack>
            <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
              Scheduled matches auto-transition via “Resolve due fights”.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {status ? <Alert severity="info">{status}</Alert> : null}

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950 }}>Current matches</Typography>
              <Typography sx={{ opacity: 0.75, fontSize: 13 }}>
                From /api/feed
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={async () => {
                setStatus("Resolving due fights...");
                const res = await fetch("/api/admin/match/resolve_due", {
                  method: "POST",
                  headers: { "x-admin-secret": headerSecret },
                });
                const j = await res.json().catch(() => null);
                if (!res.ok || !j?.ok) {
                  const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
                  setStatus(`Resolve failed: ${j?.error || "unknown"}${d}`);
                  return;
                }
                setStatus(`Resolve ok. changed=${j.changed} resolved=${j.resolved}`);
                await loadFeed();
              }}
            >
              Resolve due fights
            </Button>
          </Stack>
          <Divider sx={{ my: 1.5, opacity: 0.2 }} />
          <Stack spacing={1.2}>
            {feed.map((m) => (
              <Box
                key={m.id}
                sx={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 2,
                  padding: 1.2,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 950 }}>{m.fighterA.name} vs {m.fighterB.name}</Typography>
                  <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                    {m.id} • {m.status} • closes {new Date(m.closeAt).toLocaleString()}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 950, opacity: 0.85, fontSize: 13 }}>
                  A {m.poolA.toFixed(2)} / B {m.poolB.toFixed(2)}
                </Typography>
              </Box>
            ))}
            {!feed.length ? <Typography sx={{ opacity: 0.75 }}>No matches yet.</Typography> : null}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
