"use client";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { networkConfig } from "./networkConfig";
import { useState } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { UserProvider } from "./contexts/UserContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <AuthProvider>
              <UserProvider>
                <FavoritesProvider>
                  {children}
                </FavoritesProvider>
              </UserProvider>
            </AuthProvider>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}