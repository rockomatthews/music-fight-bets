import type { Metadata } from "next";
import "./globals.css";
import MuiProviders from "./MuiProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://musicfights.com"),
  title: "Music Fights",
  description: "Music-coded fighters. Provably-fair bets. Sora highlight reels.",
  openGraph: {
    title: "Music Fights",
    description: "Music-coded fighters. Provably-fair bets. Sora highlight reels.",
    url: "https://musicfights.com",
    siteName: "Music Fights",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "Music Fights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Music Fights",
    description: "Music-coded fighters. Provably-fair bets. Sora highlight reels.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
