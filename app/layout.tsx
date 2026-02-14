import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import BalatroBackground from "@/components/background/BalatroBackground";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Art-X - NFT Marketplace",
  description: "Decentralized NFT marketplace & creator subscription platform on Sui",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          <BalatroBackground />
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
