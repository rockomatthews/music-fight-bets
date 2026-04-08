/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
  TextField,
  Typography,
} from "@mui/material";
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
  const [betOpen, setBetOpen] = useState(false);
  const [betSide, setBetSide] = useState<"A" | "B" | null>(null);
  const sessionId = useMemo(() => getSessionId(), []);

  const [render, setRender] = useState<{ status: string; video_id: string } | null>(null);

  async function load() {
    setStatus("Loading...");
    const res = await fetch(`/api/match/${encodeURIComponent(id)}`);
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Not ready: ${j?.error || "unknown"}`);
      return;
    }

    const match = j.match;
    setM({
      id: match.id,
      status: match.status,
      closeAt: match.close_at,
      fighterA: { id: match.fighterA.id, name: match.fighterA.stage_name, archetype: match.fighterA.archetype },
      fighterB: { id: match.fighterB.id, name: match.fighterB.stage_name, archetype: match.fighterB.archetype },
      poolA: match.poolA || 0,
      poolB: match.poolB || 0,
    } as any);

    setRender(j.render ? { status: j.render.status, video_id: j.render.video_id } : null);
    setStatus("");
  }

  function openBet(side: "A" | "B") {
    setBetSide(side);
    setBetOpen(true);
  }

  function estPayout(amount: number) {
    // Parimutuel estimate using current pools (will change as others bet).
    const a = m?.poolA ?? 0;
    const b = m?.poolB ?? 0;

    const postA = betSide === "A" ? a + amount : a;
    const postB = betSide === "B" ? b + amount : b;

    const total = postA + postB;
    const fee = total * 0.02;
    const distributable = Math.max(0, total - fee);

    const winPool = betSide === "A" ? postA : postB;
    if (winPool <= 0) return { payout: 0, profit: 0 };

    const payout = (distributable * amount) / winPool;
    const profit = payout - amount;
    return { payout, profit };
  }

  async function confirmBet() {
    if (!betSide) return;
    const amountUsdc = Number(betAmt);
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      setStatus("Enter a bet amount");
      return;
    }

    const res = await fetch("/api/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: id, side: betSide, amountUsdc, sessionId }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Bet failed: ${j?.error || "unknown"}`);
      return;
    }

    setBetOpen(false);
    setBetSide(null);
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
          <Typography sx={{ opacity: 0.75 }}>
            {m.status === "resolved" ? "Fight over" : m.status === "closed" ? "Betting closed" : "Betting live"}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Stack>

      <Card>
        <CardContent>
          {m.status === "open" || m.status === "scheduled" ? (
            <>
              <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                closes {new Date(m.closeAt).toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2, opacity: 0.2 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{m.fighterA.name}</Typography>
                  <Typography sx={{ opacity: 0.75 }}>{m.fighterA.archetype}</Typography>
                  <Typography sx={{ opacity: 0.75, mt: 0.5 }}>Pool: {m.poolA.toFixed(2)}</Typography>
                </Box>
                <Button variant="contained" size="large" onClick={() => openBet("A")}>Bet A</Button>
              </Stack>

              <Divider sx={{ my: 2, opacity: 0.2 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 18 }}>{m.fighterB.name}</Typography>
                  <Typography sx={{ opacity: 0.75 }}>{m.fighterB.archetype}</Typography>
                  <Typography sx={{ opacity: 0.75, mt: 0.5 }}>Pool: {m.poolB.toFixed(2)}</Typography>
                </Box>
                <Button variant="contained" color="success" size="large" onClick={() => openBet("B")} sx={{ color: "#fff" }}>
                  Bet B
                </Button>
              </Stack>
            </>
          ) : m.status === "closed" ? (
            <Typography sx={{ opacity: 0.8 }}>
              Betting is closed. Fight starting soon.
            </Typography>
          ) : (
            <Typography sx={{ opacity: 0.8 }}>
              Fight over.
            </Typography>
          )}

          {status ? <Typography sx={{ opacity: 0.8, mt: 2 }}>{status}</Typography> : null}
        </CardContent>
      </Card>

      {render?.video_id ? (
        <Card>
          <CardContent>
            <Typography sx={{ fontWeight: 950, mb: 1 }}>Fight video</Typography>
            <Typography sx={{ opacity: 0.75, fontSize: 13, mb: 1 }}>
              Status: {render.status}
            </Typography>
            <video
              controls
              playsInline
              style={{ width: "100%", borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)" }}
              src={`/api/video/${encodeURIComponent(render.video_id)}/content`}
            />
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={betOpen} onClose={() => setBetOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Place bet</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ pt: 1 }}>
            <Typography sx={{ opacity: 0.8 }}>
              Betting on: <b>{betSide === "A" ? m.fighterA.name : betSide === "B" ? m.fighterB.name : ""}</b>
            </Typography>
            <TextField
              label="Amount (USDC)"
              value={betAmt}
              onChange={(e) => setBetAmt(e.target.value)}
              inputMode="decimal"
              autoFocus
            />
            {(() => {
              const amt = Number(betAmt);
              if (!Number.isFinite(amt) || amt <= 0) return null;
              const { payout, profit } = estPayout(amt);
              return (
                <Typography sx={{ opacity: 0.85, fontSize: 12 }}>
                  Est. payout if you win: <b>{payout.toFixed(2)} USDC</b> (profit <b>{profit.toFixed(2)} USDC</b>)
                </Typography>
              );
            })()}

            <Typography sx={{ opacity: 0.65, fontSize: 12 }}>
              Estimate uses current pools and a 2% fee. Final payout depends on the closing pools.
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
