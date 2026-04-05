"use client";

import Image from "next/image";
import Link from "next/link";
import { AppBar, Box, Button, Toolbar, Typography, useMediaQuery } from "@mui/material";
import { ConnectButton } from "./ConnectButton";

export function TopBar() {
  const isMobile = useMediaQuery("(max-width:700px)");

  return (
    <div className="mfbTopbar">
      <div className="mfbWrap">
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar disableGutters sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Link href="/" style={{ display: "inline-flex" }} aria-label="Home">
                <Image
                  src="/logo-print.png"
                  alt="Music Fights"
                  width={isMobile ? 132 : 168}
                  height={isMobile ? 28 : 34}
                  style={{
                    width: isMobile ? 132 : 168,
                    height: isMobile ? 28 : 34,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.12)",
                    objectFit: "contain",
                    padding: 4,
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                  }}
                  priority
                />
              </Link>
              {!isMobile ? (
                <Typography sx={{ opacity: 0.7, fontSize: 13 }}>
                  USDC on Base • provably-fair
                </Typography>
              ) : null}
            </Box>

            <Button component={Link} href="/arena" color="inherit" sx={{ opacity: 0.9 }}>
              Arena
            </Button>
            <Button component={Link} href="/fighters" color="inherit" sx={{ opacity: 0.9 }}>
              Fighters
            </Button>
            <Button
              component={Link}
              href="https://www.coinbase.com/buy/usdc"
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              sx={{ opacity: 0.95 }}
            >
              Add funds
            </Button>
            <Button component={Link} href="/admin" color="inherit" sx={{ opacity: 0.75 }}>
              Admin
            </Button>
            <ConnectButton />
          </Toolbar>
        </AppBar>
      </div>
    </div>
  );
}
