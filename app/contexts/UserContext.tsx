"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { useAuth } from './AuthContext';

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  updateUsername: (newUsername: string) => Promise<boolean>;
  updateBio: (newBio: string) => Promise<void>;
  updateSubscriptionPrice: (price: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { authState, updateUser } = useAuth();

  const updateUsername = async (newUsername: string): Promise<boolean> => {
    // TODO: Check if username is already taken via API
    // For now, simulate check
    if (newUsername.length < 3) {
      return false;
    }

    await updateUser({ username: newUsername });
    return true;
  };

  const updateBio = async (newBio: string) => {
    await updateUser({ bio: newBio });
  };

  const updateSubscriptionPrice = async (price: number) => {
    await updateUser({ subscriptionPrice: price });
  };

  return (
    <UserContext.Provider
      value={{
        currentUser: authState.user || null,
        isLoading: authState.isLoading,
        updateUsername,
        updateBio,
        updateSubscriptionPrice,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
