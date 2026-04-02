import Link from "next/link";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";

export function TopBar() {
  return (
    <div className="mfbTopbar">
      <div className="mfbWrap">
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar disableGutters sx={{ display: "flex", gap: 1.5 }}>
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.4 }}>
                Music Fight Bets
              </Typography>
              <Typography sx={{ opacity: 0.7, fontSize: 13 }}>
                USDC on Base • provably-fair
              </Typography>
            </Box>

            <Button component={Link} href="/" color="inherit" sx={{ opacity: 0.9 }}>
              Feed
            </Button>
            <Button component={Link} href="/fighters" color="inherit" sx={{ opacity: 0.9 }}>
              Fighters
            </Button>
          </Toolbar>
        </AppBar>
      </div>
    </div>
  );
}
