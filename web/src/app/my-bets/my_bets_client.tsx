/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, Stack, Typography } from "@mui/material";
import { getSessionId } from "../_session";

type Row = {
  id: string;
  createdAt: string;
  matchId: string;
  side: "A" | "B";
  amountUsdc: number;
  matchup: string;
  pick: string;
  matchStatus: string | null;
  resolvedWinner: string | null;
  isWin: boolean | null;
};

export default function MyBetsClient() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<string>("");

  async function load() {
    setStatus("Loading...");
    const res = await fetch(`/api/my_bets?sessionId=${encodeURIComponent(sessionId)}&limit=100`);
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      setStatus(`Error: ${j?.error || "unknown"}`);
      return;
    }
    setRows(j.rows || []);
    setStatus("");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography variant="h4">My Bets</Typography>
      <Typography sx={{ opacity: 0.78, fontSize: 13 }}>
        Bets are tracked per device/session for now.
      </Typography>

      {status ? <Typography sx={{ opacity: 0.8 }}>{status}</Typography> : null}

      <Stack spacing={1.2}>
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
                <Typography sx={{ fontWeight: 950, flex: 1 }}>
                  {r.matchup}
                </Typography>
                <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
                  {new Date(r.createdAt).toLocaleString()}
                </Typography>
              </Stack>

              <Typography sx={{ opacity: 0.85, mt: 0.75 }}>
                Pick: <b>{r.pick}</b> • Amount: <b>{r.amountUsdc.toFixed(2)} USDC</b>
              </Typography>

              <Typography sx={{ opacity: 0.75, fontSize: 12, mt: 0.5 }}>
                Status: {r.matchStatus || "?"}
                {r.isWin === true ? " • ✅ won" : r.isWin === false ? " • ❌ lost" : ""}
              </Typography>

              <Typography sx={{ mt: 1, fontSize: 13 }}>
                <Link href={`/match/${r.matchId}`} style={{ textDecoration: "underline" }}>
                  View match
                </Link>
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {!rows.length && !status ? <Typography sx={{ opacity: 0.8 }}>No bets yet.</Typography> : null}
    </Stack>
  );
}
