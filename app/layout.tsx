import type { Metadata, Viewport } from "next";
import "./globals.css";

import { DM_Sans } from "next/font/google";

import PWARegister from "./components/PWARegister";
import HamburgerMenu from "./components/HamburgerMenu";

const calmFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

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
      <body className={calmFont.className} style={{ margin: 0 }}>
        <PWARegister />
        <HamburgerMenu />
        {children}
      </body>
    </html>
  );
}
