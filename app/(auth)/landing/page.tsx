"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirection automatique si connecté
  useEffect(() => {
    if (authState.isAuthenticated) {
      router.push("/home");
    }
  }, [authState.isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Content */}
      <div
        className={`relative z-10 text-center space-y-16 px-6 transition-all duration-1000 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Logo / Title */}
        <div className="space-y-6">
          <div className="inline-block">
            <h1
              className="text-8xl sm:text-9xl md:text-[10rem] font-black tracking-tighter text-white"
              style={{
                textShadow: "0 0 80px rgba(37, 99, 235, 0.5), 0 0 160px rgba(56, 189, 248, 0.2)",
              }}
            >
              ART-X
            </h1>
          </div>

          <div
            className={`space-y-3 transition-all duration-1000 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-light tracking-wide max-w-xl mx-auto">
              NFT Marketplace on{" "}
              <span className="text-sky-400 font-medium">Sui</span>
            </p>
            <p className="text-sm sm:text-base text-white/40 font-light max-w-md mx-auto">
              Discover, collect & trade unique digital art
            </p>
          </div>
        </div>

        {/* CTA */}
        <div
          className={`transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            className="group relative text-lg sm:text-xl px-12 sm:px-16 py-7 sm:py-8 rounded-full text-white border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/40 shadow-[0_0_40px_rgba(56,189,248,0.15)] hover:shadow-[0_0_60px_rgba(56,189,248,0.3)] transform hover:scale-105 transition-all duration-300"
            onClick={() => setShowLoginModal(true)}
          >
            <span className="relative z-10 font-medium tracking-wide">
              Connect Wallet
            </span>
          </Button>
        </div>

        {/* Stats / Trust signals */}
        <div
          className={`flex items-center justify-center gap-8 sm:gap-12 text-white/30 text-xs sm:text-sm transition-all duration-1000 delay-700 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/60 font-semibold text-base sm:text-lg">Sui</span>
            <span>Testnet</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/60 font-semibold text-base sm:text-lg">0%</span>
            <span>Fees</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-white/60 font-semibold text-base sm:text-lg">On-chain</span>
            <span>Subscriptions</span>
          </div>
        </div>
      </div>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  );
}
