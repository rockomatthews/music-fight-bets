/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { getSessionId } from "./_session";

type FeedRow = {
  id: string;
  status: string;
  opensAt: string;
  closeAt: string;
  startAt: string;
  resolvedWinner: "A" | "B" | null;
  resolvedMeta: any;
  fighterA: { id: string; name: string; archetype?: string; avatarUrl?: string | null };
  fighterB: { id: string; name: string; archetype?: string; avatarUrl?: string | null };
  poolA: number;
  poolB: number;
};

function impliedOdds(a: number, b: number) {
  const t = a + b;
  if (t <= 0) return { a: 0.5, b: 0.5 };
  return { a: a / t, b: b / t };
}

export default function FeedClient() {
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [status, setStatus] = useState<string>("");

  const [tab, setTab] = useState<"open" | "closed">("open");

  const [betOpen, setBetOpen] = useState(false);
  const [betMatch, setBetMatch] = useState<null | { id: string; side: "A" | "B"; label: string }>(null);
  const [betAmt, setBetAmt] = useState("5");

  const sessionId = useMemo(() => getSessionId(), []);

  async function load() {
    setStatus("Loading...");
    const res = await fetch("/api/feed");
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Not ready: ${j?.error || "unknown"}`);
      return;
    }
    setRows(j.rows || []);
    setStatus("");
  }

  function openBet(matchId: string, side: "A" | "B", label: string) {
    setBetMatch({ id: matchId, side, label });
    setBetOpen(true);
  }

  async function confirmBet() {
    if (!betMatch) return;
    const amountUsdc = Number(betAmt);
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      setStatus("Enter a bet amount");
      return;
    }

    const res = await fetch("/api/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: betMatch.id, side: betMatch.side, amountUsdc, sessionId }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Bet failed: ${j?.error || "unknown"}`);
      return;
    }

    setBetOpen(false);
    setBetMatch(null);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2.2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant={"h4"} sx={{ fontWeight: 950 }}>
            Arena
          </Typography>
          <Typography sx={{ opacity: 0.78, fontSize: { xs: 13, sm: 14 } }}>
            Simulated betting for now. Real USDC on Base comes next.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={load} size={"small"}>
          Refresh
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950 }}>Feed</Typography>
              <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                Open fights are bettable. Closed fights show results + video.
              </Typography>
            </Box>
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              variant="fullWidth"
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Tab value="open" label="Open" />
              <Tab value="closed" label="Closed" />
            </Tabs>
          </Stack>
        </CardContent>
      </Card>

      {status ? <Typography sx={{ opacity: 0.85 }}>{status}</Typography> : null}

      {rows
        .filter((m) => {
          const isClosed = m.status === "resolved" || m.status === "closed";
          return tab === "open" ? !isClosed : isClosed;
        })
        .map((m) => {
        const odds = impliedOdds(m.poolA, m.poolB);
        return (
          <Card
            key={m.id}
            sx={{
              backgroundColor: "#fdd104",
              backgroundImage: "none",
              border: "1px solid rgba(0,0,0,0.18)",
            }}
          >
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Image
                      src={m.fighterA.avatarUrl || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(m.fighterA.id)}&backgroundColor=070712&radius=16&size=64`}
                      alt={m.fighterA.name}
                      width={40}
                      height={40}
                      style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 950, color: "#0a0a12", fontSize: { xs: 16, sm: 18 }, lineHeight: 1.15 }}>
                        {m.fighterA.name}
                        <span style={{ opacity: 0.6, fontWeight: 800 }}> vs </span>
                        {m.fighterB.name}
                      </Typography>
                      <Typography sx={{ opacity: 0.85, color: "#0a0a12", fontSize: 12, mt: 0.4 }}>
                        odds A {(odds.a * 100).toFixed(0)}% • B {(odds.b * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <Image
                      src={m.fighterB.avatarUrl || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(m.fighterB.id)}&backgroundColor=070712&radius=16&size=64`}
                      alt={m.fighterB.name}
                      width={40}
                      height={40}
                      style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                  </Box>

                  <Typography sx={{ opacity: 0.85, color: "#0a0a12", mt: 0.9, fontSize: 12 }}>
                    opens {new Date(m.opensAt).toLocaleString()} • closes {new Date(m.closeAt).toLocaleString()}
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  {new Date(m.closeAt).getTime() > Date.now() && (m.status === "open" || m.status === "scheduled") ? (
                    <>
                      <Button fullWidth variant="contained" onClick={() => openBet(m.id, "A", m.fighterA.name)}>
                        Bet {m.fighterA.name}
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={() => openBet(m.id, "B", m.fighterB.name)}
                        sx={{ color: "#fff" }}
                      >
                        Bet {m.fighterB.name}
                      </Button>
                    </>
                  ) : null}
                  <Button fullWidth component={Link} href={`/match/${m.id}`} color="inherit" variant="outlined">
                    View
                  </Button>
                </Stack>
              </Stack>
              <Divider sx={{ mt: 2, opacity: 0.2 }} />
              {m.status === "resolved" && m.resolvedWinner ? (
                <Typography sx={{ opacity: 0.9, mt: 1, fontSize: 12 }}>
                  Winner: <b>{m.resolvedWinner === "A" ? m.fighterA.name : m.fighterB.name}</b> • prob(A) {m.resolvedMeta?.probA != null ? `${Math.round(m.resolvedMeta.probA * 100)}%` : "n/a"}
                </Typography>
              ) : m.status === "closed" ? (
                <Typography sx={{ opacity: 0.75, mt: 1, fontSize: 12 }}>
                  Betting closed — fight starting soon.
                </Typography>
              ) : (
                <Typography sx={{ opacity: 0.65, mt: 1, fontSize: 12 }}>
                  Scheduled/open fight.
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!rows.length && !status ? <Typography sx={{ opacity: 0.8 }}>No matches yet. Seed fighters + create a match.</Typography> : null}

      <Dialog open={betOpen} onClose={() => setBetOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Place bet</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ pt: 1 }}>
            <Typography sx={{ opacity: 0.8 }}>
              Betting on: <b>{betMatch?.label}</b>
            </Typography>
            <TextField
              label="Amount (USDC)"
              value={betAmt}
              onChange={(e) => setBetAmt(e.target.value)}
              inputMode="decimal"
              autoFocus
            />
            <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
              Simulated for now. Wallet/USDC comes next.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBetOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmBet} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
