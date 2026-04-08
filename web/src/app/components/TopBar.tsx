"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { ConnectButton } from "./ConnectButton";

export function TopBar() {
  const isMobile = useMediaQuery("(max-width:700px)");
  const [open, setOpen] = useState(false);

  const adminAllowed = useMemo(() => {
    if (typeof window === "undefined") return false;
    const secret = window.localStorage.getItem("mfb_admin_secret") || "";
    if (secret.trim().length >= 10) return true;
    const addr = window.localStorage.getItem("mfb_last_wallet") || "";
    return addr.toLowerCase() === "0x57585874dbf39b18df1ad2b829f18d6bfc2ceb4b";
  }, []);

  const NavList = (
    <Box sx={{ width: 280, paddingTop: 1 }} role="presentation" onClick={() => setOpen(false)}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 2, py: 1.5 }}>
        <Image src="/logo-print.png" alt="Music Fights" width={180} height={38} style={{ width: 180, height: 38 }} />
      </Box>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/">
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/arena">
            <ListItemText primary="Arena" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/fighters">
            <ListItemText primary="Fighters" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/my-bets">
            <ListItemText primary="My Bets" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="https://www.coinbase.com/buy/usdc" target="_blank" rel="noreferrer">
            <ListItemText primary="Add funds" />
          </ListItemButton>
        </ListItem>
        {adminAllowed ? (
          <ListItem disablePadding>
            <ListItemButton component={Link} href="/admin">
              <ListItemText primary="Admin" />
            </ListItemButton>
          </ListItem>
        ) : null}
      </List>
      <Box sx={{ px: 2, pt: 1.5 }}>
        <ConnectButton />
      </Box>
    </Box>
  );

  return (
    <div className="mfbTopbar">
      <div className="mfbWrap">
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar disableGutters sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.2 }}>
              <Link href="/" style={{ display: "inline-flex" }} aria-label="Home">
                <Image
                  src="/logo-print.png"
                  alt="Music Fights"
                  width={isMobile ? 170 : 220}
                  height={isMobile ? 36 : 44}
                  style={{
                    width: isMobile ? 170 : 220,
                    height: isMobile ? 36 : 44,
                    borderRadius: 0,
                    border: "none",
                    objectFit: "contain",
                    padding: 0,
                    background: "transparent",
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

            {isMobile ? (
              <>
                <IconButton onClick={() => setOpen(true)} color="inherit" aria-label="Menu">
                  <MenuIcon />
                </IconButton>
                <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
                  {NavList}
                </Drawer>
              </>
            ) : (
              <>
                <Button component={Link} href="/arena" color="inherit" sx={{ opacity: 0.9 }}>
                  Arena
                </Button>
                <Button component={Link} href="/fighters" color="inherit" sx={{ opacity: 0.9 }}>
                  Fighters
                </Button>
                <Button component={Link} href="/my-bets" color="inherit" sx={{ opacity: 0.9 }}>
                  My Bets
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
                {adminAllowed ? (
                  <Button component={Link} href="/admin" color="inherit" sx={{ opacity: 0.75 }}>
                    Admin
                  </Button>
                ) : null}
                <ConnectButton />
              </>
            )}
          </Toolbar>
        </AppBar>
      </div>
    </div>
  );
}
