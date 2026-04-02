import type { Metadata } from "next";
import "./globals.css";
import MuiProviders from "./MuiProviders";

export const metadata: Metadata = {
  title: "Music Fight Bets",
  description: "Provably-fair USDC fight betting game with Sora highlight reels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MuiProviders>{children}</MuiProviders>
      </body>
    </html>
  );
}
