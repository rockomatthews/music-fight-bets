/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";

export default function ReRenderButton({ matchId }: { matchId: string }) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<string>("");
  const headerSecret = useMemo(() => secret.trim(), [secret]);

  async function rerender() {
    setStatus("Starting render...");
    const res = await fetch("/api/admin/match/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": headerSecret,
      },
      body: JSON.stringify({ matchId }),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.ok) {
      const d = j?.detail ? ` (${typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail)})` : "";
      setStatus(`Failed: ${j?.error || "unknown"}${d}`);
      return;
    }

    setStatus(`Render started. ${j.video?.id || ""} (${j.video?.status || ""})`);
  }

  return (
    <>
      <Button variant="outlined" color="inherit" onClick={() => setOpen(true)} sx={{ opacity: 0.85 }}>
        Re-render fight
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Re-render fight (admin)</DialogTitle>
        <DialogContent>
          <Stack spacing={1.2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              Requires admin secret. This starts a new Sora render for this match.
            </Alert>

            <TextField
              label="Admin secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="paste MFB_ADMIN_SECRET"
              fullWidth
            />

            <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
              Match: {matchId}
            </Typography>

            {status ? <Typography sx={{ opacity: 0.9 }}>{status}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="inherit">Close</Button>
          <Button onClick={rerender} variant="contained" disabled={!headerSecret}>
            Start render
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
