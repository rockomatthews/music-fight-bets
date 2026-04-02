import Link from "next/link";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { TopBar } from "./components/TopBar";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <Stack spacing={2.2}>
          <Stack spacing={0.7} sx={{ mt: 1 }}>
            <Typography variant="h3">Tonight’s card</Typography>
            <Typography sx={{ opacity: 0.78 }}>
              Original music-legend archetype fighters. Chain resolves winners. Sora generates highlights.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: "wrap" }}>
              <Chip label="Base" />
              <Chip label="USDC" />
              <Chip label="Parimutuel" />
              <Chip label="Sora highlights" />
            </Stack>
          </Stack>

          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Demo match (placeholder)</Typography>
                  <Typography sx={{ opacity: 0.75, mt: 0.5 }}>
                    Velvet Fugue vs Neon Keys • bets open
                  </Typography>
                </Box>
                <Button component={Link} href="/match/demo" variant="contained" size="large">
                  View match
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 950, fontSize: 16 }}>Next steps</Typography>
              <Typography sx={{ opacity: 0.75, mt: 0.75 }}>
                We’ll wire: fighters from Supabase → create matches → USDC bet txs → VRF resolve → claim payouts → Sora render.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </div>
    </>
  );
}
