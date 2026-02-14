"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { AuthState, AuthMethod, User } from '../types';
import { mockUsers } from '../mock';

interface AuthContextType {
  authState: AuthState;
  login: (method: AuthMethod) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Priority: wallet first, then OAuth
    if (currentAccount?.address) {
      // Wallet authentication
      let user = mockUsers.find(u => u.walletAddress === currentAccount.address);

      if (!user) {
        // Create new user with wallet address as username
        user = {
          walletAddress: currentAccount.address,
          username: currentAccount.address,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      setAuthState({
        isAuthenticated: true,
        authMethod: 'wallet',
        walletAddress: currentAccount.address,
        user,
        isLoading: false,
      });
    } else if (session?.user) {
      // OAuth authentication
      const oauthUser: User = {
        walletAddress: session.user.id || session.user.email || 'oauth-user',
        username: session.user.name || session.user.email?.split('@')[0] || 'user',
        avatar: session.user.image || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setAuthState({
        isAuthenticated: true,
        authMethod: 'oauth',
        user: oauthUser,
        isLoading: false,
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        isLoading: status === 'loading',
      });
    }
  }, [currentAccount, session, status]);

  const login = async (method: AuthMethod) => {
    // For wallet, connection is handled by @mysten/dapp-kit
    // For OAuth, would integrate with NextAuth.js
    setAuthState(prev => ({ ...prev, authMethod: method }));
  };

  const logout = async () => {
    // Si l'utilisateur est connecté via OAuth, déconnecter NextAuth
    if (authState.authMethod === 'oauth') {
      await nextAuthSignOut({ redirect: false });
    }
    // Pour wallet, la déconnexion se fait via le ConnectButton de dapp-kit
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!authState.user) return;

    const updatedUser = {
      ...authState.user,
      ...updates,
      updatedAt: new Date(),
    };

    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
    }));
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
