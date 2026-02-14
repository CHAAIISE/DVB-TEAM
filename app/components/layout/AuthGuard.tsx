"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push("/landing");
    }
  }, [authState.isLoading, authState.isAuthenticated, router]);

  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
