"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useWallet } from "../wallet";

export function ConnectButton() {
  const { address, chainId, connect, switchToBase } = useWallet();

  if (!address) {
    return (
      <Button variant="outlined" onClick={() => connect().catch(() => null)}>
        Connect wallet
      </Button>
    );
  }

  const wrong = chainId != null && chainId !== 8453;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {wrong ? (
        <Button variant="contained" color="warning" onClick={() => switchToBase().catch(() => null)}>
          Switch to Base
        </Button>
      ) : null}
      <Typography sx={{ opacity: 0.8, fontSize: 12 }}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </Typography>
    </Stack>
  );
}
