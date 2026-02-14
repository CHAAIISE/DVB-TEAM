"use client";

import { usePathname } from "next/navigation";
import Balatro from "./Balatro";

export default function BalatroBackground() {
  const pathname = usePathname();
  const isLanding = pathname === "/landing" || pathname === "/";

  return (
    <Balatro
      isRotate={false}
      mouseInteraction={true}
      pixelFilter={2000}
      color1="#000000"
      color2="#38bdf8"
      color3="#2563eb"
      timeScale={isLanding ? 0.08 : 1.0}
    />
  );
}
