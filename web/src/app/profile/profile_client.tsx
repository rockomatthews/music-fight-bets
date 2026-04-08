/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";

import { useWallet } from "../wallet";

const AVATAR_STYLES = [
  "bottts",
  "open-peeps",
  "micah",
  "identicon",
  "big-ears-neutral",
  "big-smile",
  "adventurer",
  "lorelei",
];

function presetAvatar(style: string, seed: string) {
  const s = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/${style}/png?seed=${s}&backgroundColor=070712&radius=24&size=256`;
}

function getSessionId() {
  if (typeof window === "undefined") return "";
  const k = "mfb_session_id";
  let v = window.localStorage.getItem(k);
  if (!v) {
    v = `sess_${crypto.randomUUID().replace(/-/g, "")}`;
    window.localStorage.setItem(k, v);
  }
  return v;
}

export default function ProfileClient() {
  const sessionId = useMemo(() => getSessionId(), []);
  const { address, chainId, connect, switchToBase } = useWallet();

  const [username, setUsername] = useState("Player");
  const [avatarStyle, setAvatarStyle] = useState(AVATAR_STYLES[0]);

  const avatarUrl = useMemo(() => presetAvatar(avatarStyle, sessionId), [avatarStyle, sessionId]);

  return (
    <Stack spacing={2} sx={{ mt: 1, maxWidth: 860 }}>
      <Typography variant="h4">Profile</Typography>

      <Card>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <Image src={avatarUrl} alt={username} width={84} height={84} style={{ borderRadius: 20 }} />
            <Box sx={{ flex: 1 }}>
              <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth />
              <Typography sx={{ opacity: 0.7, fontSize: 12, mt: 0.75 }}>
                (Saved locally for now. We’ll persist to Supabase next.)
              </Typography>
            </Box>
          </Stack>

          <Typography sx={{ fontWeight: 950, mt: 2, mb: 1 }}>Choose avatar</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(4, 1fr)", sm: "repeat(8, 1fr)" }, gap: 1 }}>
            {AVATAR_STYLES.map((s) => {
              const url = presetAvatar(s, sessionId);
              const selected = s === avatarStyle;
              return (
                <button
                  key={s}
                  onClick={() => setAvatarStyle(s)}
                  style={{
                    padding: 0,
                    borderRadius: 16,
                    border: selected ? "2px solid rgba(253,209,4,0.85)" : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <Image src={url} alt={s} width={96} height={96} style={{ width: "100%", height: "auto", display: "block" }} />
                </button>
              );
            })}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography sx={{ fontWeight: 950, mb: 1 }}>Wallet</Typography>

          {!address ? (
            <Stack spacing={1.2}>
              <Typography sx={{ opacity: 0.8 }}>
                No wallet connected.
              </Typography>
              <Button variant="contained" onClick={() => connect().catch(() => null)}>
                Connect MetaMask
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1.2}>
              <Alert severity={chainId === 8453 ? "success" : "warning"}>
                Connected: <b>{address}</b>
              </Alert>
              {chainId !== 8453 ? (
                <Button variant="contained" color="warning" onClick={() => switchToBase().catch(() => null)}>
                  Switch to Base
                </Button>
              ) : null}

              <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                MetaMask doesn’t let sites force-disconnect. To switch accounts, open MetaMask and change the active account, then come back here.
              </Typography>

              <Button variant="outlined" color="inherit" onClick={() => window.location.reload()}>
                Refresh wallet state
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
