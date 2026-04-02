import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { TopBar } from "../../components/TopBar";

export default async function MatchPage({ params }: { params: { id: string } }) {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="h4">Match: {params.id}</Typography>

          <Card>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Velvet Fugue</Typography>
                  <Typography sx={{ opacity: 0.75 }}>Baroque Virtuoso</Typography>
                </Box>
                <Button variant="contained" size="large">Bet A (USDC)</Button>
              </Stack>

              <Divider sx={{ my: 2, opacity: 0.2 }} />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 950, fontSize: 18 }}>Neon Keys</Typography>
                  <Typography sx={{ opacity: 0.75 }}>Synthwave Idol</Typography>
                </Box>
                <Button variant="outlined" size="large">Bet B (USDC)</Button>
              </Stack>

              <Typography sx={{ opacity: 0.7, mt: 2, fontSize: 13 }}>
                This is UI scaffold only. Next: wallet connect + approve + bet tx + pool odds.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </div>
    </>
  );
}
