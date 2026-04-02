import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#070712",
      paper: "rgba(255,255,255,0.06)",
    },
    primary: { main: "#fdd104" }, // electric yellow
    secondary: { main: "#ff2bd6" }, // neon magenta
    info: { main: "#34d3ff" }, // neon cyan
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
    h1: { fontWeight: 950, letterSpacing: -1.2 },
    h2: { fontWeight: 950, letterSpacing: -1.0 },
    h3: { fontWeight: 950, letterSpacing: -0.8 },
    h4: { fontWeight: 950, letterSpacing: -0.6 },
    button: { fontWeight: 950, textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          paddingLeft: 16,
          paddingRight: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.10)",
          backgroundImage:
            "radial-gradient(600px 120px at 20% 0%, rgba(253,209,4,0.10), transparent 60%), radial-gradient(800px 160px at 90% 10%, rgba(255,43,214,0.08), transparent 55%)",
        },
      },
    },
  },
});
