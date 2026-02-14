"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useProfile, useCreateProfile, useUpdateProfile } from '../hooks/useContract';

/**
 * Sync a profile field to Supabase (best-effort, non-blocking).
 * The indexer handles ProfileCreated events, but display_name/bio updates
 * have no on-chain event, so we sync them directly here.
 */
async function syncProfileToSupabase(profileId: string, fields: Record<string, unknown>) {
  try {
    await fetch('/api/profiles/' + profileId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
  } catch {
    // Best-effort — don't block the UI
  }
}

interface UserContextType {
  /** Wallet address of the connected user */
  walletAddress: string | null;
  /** On-chain profile object ID (null if no profile created yet) */
  profileId: string | null;
  /** Display name from on-chain profile */
  displayName: string;
  /** Bio from on-chain profile */
  bio: string;
  /** Subscription price in MIST */
  subscriptionPrice: number;
  /** Number of subscribers */
  subscriberCount: number;
  /** Number of subscriptions */
  subscriptionCount: number;
  /** Number of listings */
  listingCount: number;
  /** Whether profile data is loading */
  isLoading: boolean;
  /** Whether the user has created an on-chain profile */
  hasProfile: boolean;
  /** Create an on-chain profile */
  createProfile: () => Promise<void>;
  /** Update display name on-chain */
  updateDisplayName: (name: string) => Promise<boolean>;
  /** Update bio on-chain */
  updateBio: (bio: string) => Promise<boolean>;
  /** Set subscription price on-chain */
  setSubscriptionPrice: (priceMist: number) => Promise<boolean>;
  /** Refetch profile from chain */
  refetchProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const currentAccount = useCurrentAccount();
  const walletAddress = currentAccount?.address || null;
  const { profile, loading, refetch } = useProfile();
  const { createProfile: doCreateProfile, loading: createLoading } = useCreateProfile();
  const { updateDisplayName: doUpdateName, updateBio: doUpdateBio, setSubscriptionPrice: doSetPrice, loading: updateLoading } = useUpdateProfile();

  const createProfile = async () => {
    try {
      await doCreateProfile();
    } catch (e: unknown) {
      // If profile already exists on-chain (EProfileAlreadyExists = abort code 0),
      // just refetch — the user already has a profile.
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('MoveAbort') && msg.includes('create_profile')) {
        console.warn('Profile already exists on-chain, refetching...');
        await refetch();
        return;
      }
      throw e;
    }
    // Wait a bit for chain to process, then refetch
    setTimeout(() => refetch(), 2000);
  };

  const updateDisplayName = async (name: string): Promise<boolean> => {
    if (!profile) return false;
    try {
      await doUpdateName(profile.objectId, name);
      syncProfileToSupabase(profile.objectId, { display_name: name });
      setTimeout(() => refetch(), 2000);
      return true;
    } catch {
      return false;
    }
  };

  const updateBio = async (bio: string): Promise<boolean> => {
    if (!profile) return false;
    try {
      await doUpdateBio(profile.objectId, bio);
      syncProfileToSupabase(profile.objectId, { bio });
      setTimeout(() => refetch(), 2000);
      return true;
    } catch {
      return false;
    }
  };

  const setSubscriptionPrice = async (priceMist: number): Promise<boolean> => {
    if (!profile) return false;
    try {
      await doSetPrice(profile.objectId, priceMist);
      setTimeout(() => refetch(), 2000);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <UserContext.Provider
      value={{
        walletAddress,
        profileId: profile?.objectId || null,
        displayName: profile?.displayName || "",
        bio: profile?.bio || "",
        subscriptionPrice: profile?.subscriptionPrice || 0,
        subscriberCount: profile?.subscriberCount || 0,
        subscriptionCount: profile?.subscriptionCount || 0,
        listingCount: profile?.listingCount || 0,
        isLoading: loading || createLoading || updateLoading,
        hasProfile: !!profile,
        createProfile,
        updateDisplayName,
        updateBio,
        setSubscriptionPrice,
        refetchProfile: refetch,
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
