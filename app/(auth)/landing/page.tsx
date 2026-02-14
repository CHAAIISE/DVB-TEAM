"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { authState } = useAuth();
  const router = useRouter();

  // Redirection automatique si connecté
  useEffect(() => {
    if (authState.isAuthenticated) {
      router.push("/home");
    }
  }, [authState.isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-12 px-4">
        <div className="space-y-6">
          <h1 className="text-7xl md:text-8xl font-bold text-white">
            NFT Marketplace
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
            Découvrez, achetez et vendez des NFTs uniques
          </p>
        </div>

        <Button
          size="lg"
          className="text-2xl px-16 py-10 rounded-full text-white bg-primary hover:bg-primary/90 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200"
          onClick={() => setShowLoginModal(true)}
        >
          Se connecter
        </Button>
      </div>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </div>
  );
}
