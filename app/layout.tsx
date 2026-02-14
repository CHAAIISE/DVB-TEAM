import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import BalatroBackground from "@/components/background/BalatroBackground";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Art-X - NFT Marketplace</title>
      </head>
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
