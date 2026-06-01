import type { Metadata, Viewport } from "next";
import "./globals.css";

import PWARegister from "./components/PWARegister";
import HamburgerMenu from "./components/HamburgerMenu";

export const metadata: Metadata = {
  title: "UAlberta Map",
  description:
    "Installable wrapper for UAlberta ArcGIS Map Series + student resources",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#154734",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <PWARegister />
        <HamburgerMenu />
        {children}
      </body>
    </html>
  );
}
