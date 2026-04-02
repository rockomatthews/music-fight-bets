import { Card, CardContent, Stack, Typography } from "@mui/material";
import { TopBar } from "../components/TopBar";

export default function FightersPage() {
  return (
    <>
      <TopBar />
      <div className="mfbWrap">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="h4">Fighters</Typography>
          <Typography sx={{ opacity: 0.78 }}>
            Seed roster lives in the repo today; next step is loading from Supabase.
          </Typography>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 950 }}>Velvet Fugue</Typography>
              <Typography sx={{ opacity: 0.75 }}>Baroque Virtuoso • Counterpoint Cross</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 950 }}>Neon Keys</Typography>
              <Typography sx={{ opacity: 0.75 }}>Synthwave Idol • Arp Uppercut</Typography>
            </CardContent>
          </Card>
        </Stack>
      </div>
    </>
  );
}
