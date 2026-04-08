"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { USDC_BASE } from "../abi/usdc";
import { useWallet } from "../wallet";

function formatUsdc(raw: bigint, decimals = 6) {
  const s = raw.toString().padStart(decimals + 1, "0");
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, "");
  return f ? `${i}.${f}` : i;
}

export function ConnectButton() {
  const { address, chainId, connect, switchToBase } = useWallet();
  const [usdc, setUsdc] = useState<string | null>(null);

  const eth = useMemo(() => (globalThis as any)?.ethereum, []);

  async function disconnect() {
    // Wallets typically don't support programmatic disconnect.
    // We only clear local UI state.
    setUsdc(null);
  }

  useEffect(() => {
    async function loadBal() {
      if (!address) return;
      if (!eth) return;
      if (chainId !== 8453) {
        setUsdc(null);
        return;
      }

      try {
        // balanceOf(address)
        const data = "0x70a08231" + address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
        const res = await eth.request({
          method: "eth_call",
          params: [{ to: USDC_BASE, data }, "latest"],
        });
        const bal = BigInt(res);
        setUsdc(formatUsdc(bal));
      } catch {
        setUsdc(null);
      }
    }

    loadBal();
    const t = setInterval(loadBal, 15000);
    return () => clearInterval(t);
  }, [address, chainId, eth]);

  if (!address) {
    return (
      <Button variant="outlined" onClick={() => connect().catch(() => null)}>
        Connect
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
      {!wrong ? (
        <Typography sx={{ opacity: 0.92, fontSize: 12, fontWeight: 950 }}>
          USDC: {usdc ?? "…"}
        </Typography>
      ) : null}
      <Typography sx={{ opacity: 0.75, fontSize: 12 }}>
        {address.slice(0, 6)}…{address.slice(-4)}
      </Typography>
      <Button variant="text" color="inherit" onClick={() => disconnect().catch(() => null)} sx={{ opacity: 0.7 }}>
        Disconnect
      </Button>
    </Stack>
  );
}
