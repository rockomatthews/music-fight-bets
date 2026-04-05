"use client";

import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log full error in client console for debugging
    // eslint-disable-next-line no-console
    console.error("App error:", error);
  }, [error]);

  return (
    <Box sx={{ minHeight: "100vh", background: "#070712", color: "#fff", padding: 3 }}>
      <Stack spacing={1.5} sx={{ maxWidth: 720, margin: "0 auto", paddingTop: 10 }}>
        <Typography variant="h4" sx={{ fontWeight: 950 }}>
          Application error
        </Typography>
        <Typography sx={{ opacity: 0.8 }}>
          Something crashed while rendering. Try again.
        </Typography>
        {error?.digest ? (
          <Typography sx={{ opacity: 0.7, fontSize: 12 }}>Digest: {error.digest}</Typography>
        ) : null}
        <Stack direction="row" spacing={1.2}>
          <Button variant="contained" onClick={() => reset()}>
            Retry
          </Button>
          <Button variant="outlined" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
