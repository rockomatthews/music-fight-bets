/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from "@mui/material";
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

  async function bet(matchId: string, side: "A" | "B") {
    const amountUsdc = Number(betAmt);
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) return;

    const res = await fetch("/api/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, side, amountUsdc, sessionId }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Bet failed: ${j?.error || "unknown"}`);
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Stack spacing={2.2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h3">Tonight’s card</Typography>
          <Typography sx={{ opacity: 0.78 }}>
            Simulated betting is live. Real USDC on Base comes next.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <Typography sx={{ fontWeight: 950 }}>Bet amount (USDC)</Typography>
            <TextField value={betAmt} onChange={(e) => setBetAmt(e.target.value)} size="small" sx={{ width: 140 }} />
            <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
              Uses your local sessionId (anonymous) for now.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {status ? <Typography sx={{ opacity: 0.85 }}>{status}</Typography> : null}

      {rows.map((m) => {
        const odds = impliedOdds(m.poolA, m.poolB);
        return (
          <Card key={m.id}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Image
                      src={m.fighterA.avatarUrl || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(m.fighterA.id)}&backgroundColor=070712&radius=16&size=64`}
                      alt={m.fighterA.name}
                      width={36}
                      height={36}
                      style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                      {m.fighterA.name} vs {m.fighterB.name}
                    </Typography>
                    <Image
                      src={m.fighterB.avatarUrl || `https://api.dicebear.com/7.x/bottts/png?seed=${encodeURIComponent(m.fighterB.id)}&backgroundColor=070712&radius=16&size=64`}
                      alt={m.fighterB.name}
                      width={36}
                      height={36}
                      style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)" }}
                    />
                  </Box>
                  <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
                    Pools: A {m.poolA.toFixed(2)} / B {m.poolB.toFixed(2)} • implied odds A {(odds.a * 100).toFixed(0)}% / B {(odds.b * 100).toFixed(0)}%
                  </Typography>
                  <Typography sx={{ opacity: 0.6, mt: 0.25, fontSize: 12 }}>
                    opens {new Date(m.opensAt).toLocaleString()} • closes {new Date(m.closeAt).toLocaleString()} • fights {new Date(m.startAt).toLocaleString()}
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                  <Button variant="contained" onClick={() => bet(m.id, "A")}>Bet {m.fighterA.name}</Button>
                  <Button variant="contained" color="success" onClick={() => bet(m.id, "B")} sx={{ color: "#fff" }}>
                    Bet {m.fighterB.name}
                  </Button>
                  <Button component={Link} href={`/match/${m.id}`} color="inherit">View</Button>
                </Stack>
              </Stack>
              <Divider sx={{ mt: 2, opacity: 0.2 }} />
              {m.status === "resolved" && m.resolvedWinner ? (
                <Typography sx={{ opacity: 0.9, mt: 1, fontSize: 12 }}>
                  Winner: <b>{m.resolvedWinner === "A" ? m.fighterA.name : m.fighterB.name}</b> • prob(A) {m.resolvedMeta?.probA != null ? `${Math.round(m.resolvedMeta.probA * 100)}%` : "n/a"}
                </Typography>
              ) : (
                <Typography sx={{ opacity: 0.65, mt: 1, fontSize: 12 }}>
                  Resolve via Admin → “Resolve due fights” (sim). Real USDC claims later.
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}

      {!rows.length && !status ? <Typography sx={{ opacity: 0.8 }}>No matches yet. Seed fighters + create a match.</Typography> : null}
    </Stack>
  );
}
