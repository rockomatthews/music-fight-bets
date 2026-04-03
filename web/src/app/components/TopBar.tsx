import Image from "next/image";
import Link from "next/link";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { ConnectButton } from "./ConnectButton";

export function TopBar() {
  return (
    <div className="mfbTopbar">
      <div className="mfbWrap">
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar disableGutters sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Image
                src="/logo.png"
                alt="Music Fights"
                width={44}
                height={44}
                style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.14)" }}
                priority
              />
              <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
                Music Fights
              </Typography>
              <Typography sx={{ opacity: 0.7, fontSize: 13 }}>
                USDC on Base • provably-fair
              </Typography>
            </Box>

            <Button component={Link} href="/home" color="inherit" sx={{ opacity: 0.9 }}>
              Home
            </Button>
            <Button component={Link} href="/" color="inherit" sx={{ opacity: 0.9 }}>
              Feed
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
