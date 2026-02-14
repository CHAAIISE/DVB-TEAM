/**
 * React hooks for DVB_TEAM smart contract interactions
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import {
  createProfileTx,
  updateDisplayNameTx,
  updateBioTx,
  setSubscriptionPriceTx,
  subscribeTx,
  listNftTx,
  toggleFavoriteTx,
  buyNftTx,
  delistNftTx,
} from "../lib/contracts";
import {
  fetchUserProfile,
  fetchActiveListings,
  fetchListing,
  fetchListingsBySeller,
  fetchOwnedNFTs,
  fetchSubscribedCreators,
  OnChainProfile,
  OnChainListing,
  OwnedNFT,
} from "../lib/queries";

// ═══════════════════════════════════════════════════════════════
// Profile hooks
// ═══════════════════════════════════════════════════════════════

export function useProfile(address?: string) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const targetAddress = address || currentAccount?.address;

  const [profile, setProfile] = useState<OnChainProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!targetAddress) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const p = await fetchUserProfile(client, targetAddress);
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [client, targetAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, error, refetch };
}

export function useCreateProfile() {
  const packageId = useNetworkVariable("packageId");
  const registryId = useNetworkVariable("registryId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const createProfile = useCallback(async () => {
    setLoading(true);
    try {
      const tx = createProfileTx(packageId, registryId);
      const result = await signAndExecute({ transaction: tx });
      return result;
    } finally {
      setLoading(false);
    }
  }, [packageId, registryId, signAndExecute]);

  return { createProfile, loading };
}

export function useUpdateProfile() {
  const packageId = useNetworkVariable("packageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const updateDisplayName = useCallback(
    async (profileId: string, newName: string) => {
      setLoading(true);
      try {
        const tx = updateDisplayNameTx(packageId, profileId, newName);
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  const updateBio = useCallback(
    async (profileId: string, newBio: string) => {
      setLoading(true);
      try {
        const tx = updateBioTx(packageId, profileId, newBio);
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  const setSubscriptionPrice = useCallback(
    async (profileId: string, priceMist: number) => {
      setLoading(true);
      try {
        const tx = setSubscriptionPriceTx(packageId, profileId, priceMist);
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  return { updateDisplayName, updateBio, setSubscriptionPrice, loading };
}

// ═══════════════════════════════════════════════════════════════
// Subscription hooks
// ═══════════════════════════════════════════════════════════════

export function useSubscribe() {
  const packageId = useNetworkVariable("packageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const subscribe = useCallback(
    async (
      creatorProfileId: string,
      subscriberProfileId: string,
      amountMist: number
    ) => {
      setLoading(true);
      try {
        const tx = subscribeTx(
          packageId,
          creatorProfileId,
          subscriberProfileId,
          amountMist
        );
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  return { subscribe, loading };
}

// ═══════════════════════════════════════════════════════════════
// Marketplace hooks
// ═══════════════════════════════════════════════════════════════

export function useListings() {
  const client = useSuiClient();
  const [listings, setListings] = useState<OnChainListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveListings(client);
      setListings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { listings, loading, error, refetch };
}

export function useSubscribedCreators(address?: string) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const targetAddress = address || currentAccount?.address;

  const [creators, setCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!targetAddress) {
      setCreators([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSubscribedCreators(client, targetAddress);
      setCreators(data);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [client, targetAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { creators, loading, refetch };
}

export function useListingDetail(listingId: string) {
  const client = useSuiClient();
  const [listing, setListing] = useState<OnChainListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetchListing(client, listingId)
      .then(setListing)
      .finally(() => setLoading(false));
  }, [client, listingId]);

  return { listing, loading };
}

export function useSellerListings(sellerAddress?: string) {
  const client = useSuiClient();
  const [listings, setListings] = useState<OnChainListing[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!sellerAddress) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchListingsBySeller(client, sellerAddress);
      setListings(data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [client, sellerAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { listings, loading, refetch };
}

export function useListNft() {
  const packageId = useNetworkVariable("packageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const listNft = useCallback(
    async (
      profileId: string,
      nftId: string,
      nftType: string,
      priceMist: number,
      title: string,
      description: string
    ) => {
      setLoading(true);
      try {
        const tx = listNftTx(
          packageId,
          profileId,
          nftId,
          nftType,
          priceMist,
          title,
          description
        );
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  return { listNft, loading };
}

export function useBuyNft() {
  const packageId = useNetworkVariable("packageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const buyNft = useCallback(
    async (listingId: string, nftType: string, priceMist: number) => {
      setLoading(true);
      try {
        const tx = buyNftTx(packageId, listingId, nftType, priceMist);
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  return { buyNft, loading };
}

export function useDelistNft() {
  const packageId = useNetworkVariable("packageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const delistNft = useCallback(
    async (listingId: string, nftType: string) => {
      setLoading(true);
      try {
        const tx = delistNftTx(packageId, listingId, nftType);
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  return { delistNft, loading };
}

export function useToggleFavorite() {
  const packageId = useNetworkVariable("packageId");
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [loading, setLoading] = useState(false);

  const toggleFavorite = useCallback(
    async (profileId: string, listingId: string) => {
      setLoading(true);
      try {
        const tx = toggleFavoriteTx(packageId, profileId, listingId);
        return await signAndExecute({ transaction: tx });
      } finally {
        setLoading(false);
      }
    },
    [packageId, signAndExecute]
  );

  return { toggleFavorite, loading };
}

// ═══════════════════════════════════════════════════════════════
// NFT hooks
// ═══════════════════════════════════════════════════════════════

export function useOwnedNFTs(address?: string) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const targetAddress = address || currentAccount?.address;

  const [nfts, setNfts] = useState<OwnedNFT[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!targetAddress) {
      setNfts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchOwnedNFTs(client, targetAddress);
      setNfts(data);
    } catch {
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [client, targetAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { nfts, loading, refetch };
}
