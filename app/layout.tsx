import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import Balatro from "@/components/background/Balatro";

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
        <Balatro
          isRotate={false}
          mouseInteraction={true}
          pixelFilter={2000}
          color1="#000000"
          color2="#38bdf8"
          color3="#2563eb"
        />
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
