"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Divider, Stack, TextField, Typography } from "@mui/material";
import { getSessionId } from "../../_session";

type MatchRow = {
  id: string;
  status: string;
  closeAt: string;
  fighterA: { id: string; name: string; archetype?: string };
  fighterB: { id: string; name: string; archetype?: string };
  poolA: number;
  poolB: number;
};

export default function MatchClient({ id }: { id: string }) {
  const [m, setM] = useState<MatchRow | null>(null);
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
    const found = (j.rows || []).find((r: { id: string }) => r.id === id);
    setM(found || null);
    setStatus(found ? "" : "Match not found.");
  }

  async function bet(side: "A" | "B") {
    const amountUsdc = Number(betAmt);
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) return;

    const res = await fetch("/api/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: id, side, amountUsdc, sessionId }),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!m) {
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Typography variant="h4">Match</Typography>
        <Typography sx={{ opacity: 0.8 }}>{status || "Loading..."}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">{m.fighterA.name} vs {m.fighterB.name}</Typography>
          <Typography sx={{ opacity: 0.75 }}>Simulated betting (v1)</Typography>
        </Box>
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
            <Typography sx={{ fontWeight: 950 }}>Bet amount (USDC)</Typography>
            <TextField value={betAmt} onChange={(e) => setBetAmt(e.target.value)} size="small" sx={{ width: 140 }} />
            <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
              closes {new Date(m.closeAt).toLocaleString()}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2, opacity: 0.2 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{m.fighterA.name}</Typography>
              <Typography sx={{ opacity: 0.75 }}>{m.fighterA.archetype}</Typography>
              <Typography sx={{ opacity: 0.75, mt: 0.5 }}>Pool: {m.poolA.toFixed(2)}</Typography>
            </Box>
            <Button variant="contained" size="large" onClick={() => bet("A")}>Bet A</Button>
          </Stack>

          <Divider sx={{ my: 2, opacity: 0.2 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{m.fighterB.name}</Typography>
              <Typography sx={{ opacity: 0.75 }}>{m.fighterB.archetype}</Typography>
              <Typography sx={{ opacity: 0.75, mt: 0.5 }}>Pool: {m.poolB.toFixed(2)}</Typography>
            </Box>
            <Button variant="outlined" size="large" onClick={() => bet("B")}>Bet B</Button>
          </Stack>

          {status ? <Typography sx={{ opacity: 0.8, mt: 2 }}>{status}</Typography> : null}
        </CardContent>
      </Card>
    </Stack>
  );
}
