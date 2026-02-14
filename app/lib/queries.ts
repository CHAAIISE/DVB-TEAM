/**
 * On-chain query helpers for DVB_TEAM contract
 */

import { SuiClient, SuiObjectResponse } from "@mysten/sui/client";
import { TESTNET_PACKAGE_ID, TESTNET_REGISTRY_ID, MODULE_NAME } from "../constants";

// ═══════════════════════════════════════════════════════════════
// Types for on-chain data
// ═══════════════════════════════════════════════════════════════

export interface OnChainProfile {
  objectId: string;
  owner: string;
  displayName: string;
  bio: string;
  subscriptionPrice: number;
  subscriberCount: number;
  subscriptionCount: number;
  listingCount: number;
}

export interface OnChainListing {
  objectId: string;
  seller: string;
  price: number;
  title: string;
  description: string;
  nftId: string;
  isActive: boolean;
  favoriteCount: number;
  nftType?: string;
  nftImageUrl?: string;
  nftName?: string;
  nftDescription?: string;
}

// ═══════════════════════════════════════════════════════════════
// Profile queries
// ═══════════════════════════════════════════════════════════════

export function parseProfile(obj: SuiObjectResponse): OnChainProfile | null {
  const content = obj.data?.content;
  if (!content || content.dataType !== "moveObject") return null;

  const fields = content.fields as Record<string, unknown>;
  return {
    objectId: obj.data!.objectId,
    owner: fields.owner as string,
    displayName: fields.display_name as string,
    bio: fields.bio as string,
    subscriptionPrice: Number(fields.subscription_price),
    subscriberCount: Number(fields.subscriber_count),
    subscriptionCount: Number(fields.subscription_count),
    listingCount: Number(fields.listing_count),
  };
}

/**
 * Fetch the UserProfile for a given address.
 * Profiles are shared objects, so we query ProfileCreated events to find the profile ID,
 * then fetch the object directly.
 */
export async function fetchUserProfile(
  client: SuiClient,
  ownerAddress: string,
  packageId: string = TESTNET_PACKAGE_ID
): Promise<OnChainProfile | null> {
  // Query ProfileCreated events to find the profile object ID for this owner
  const { data: events } = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::${MODULE_NAME}::ProfileCreated`,
    },
    limit: 50,
  });

  for (const event of events) {
    const parsed = event.parsedJson as Record<string, unknown>;
    if (parsed.owner === ownerAddress && parsed.profile_id) {
      const profileId = parsed.profile_id as string;
      return fetchProfileById(client, profileId);
    }
  }

  return null;
}

/**
 * Fetch a specific profile by its object ID
 */
export async function fetchProfileById(
  client: SuiClient,
  profileId: string
): Promise<OnChainProfile | null> {
  const obj = await client.getObject({
    id: profileId,
    options: { showContent: true },
  });
  return parseProfile(obj);
}

// ═══════════════════════════════════════════════════════════════
// Listing queries
// ═══════════════════════════════════════════════════════════════

export function parseListing(obj: SuiObjectResponse): OnChainListing | null {
  const content = obj.data?.content;
  if (!content || content.dataType !== "moveObject") return null;

  const fields = content.fields as Record<string, unknown>;
  return {
    objectId: obj.data!.objectId,
    seller: fields.seller as string,
    price: Number(fields.price),
    title: fields.title as string,
    description: fields.description as string,
    nftId: fields.nft_id as string,
    isActive: fields.is_active as boolean,
    favoriteCount: Number(fields.favorite_count),
  };
}

/**
 * Fetch all active listings by querying NftListed events
 */
export async function fetchActiveListings(
  client: SuiClient,
  packageId: string = TESTNET_PACKAGE_ID
): Promise<OnChainListing[]> {
  // Query NftListed events to discover listing IDs
  const { data: events } = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::${MODULE_NAME}::NftListed`,
    },
    order: "descending",
    limit: 50,
  });

  if (events.length === 0) return [];

  // Extract unique listing IDs
  const listingIds = events.map(
    (e) => (e.parsedJson as { listing_id: string }).listing_id
  );
  const uniqueIds = [...new Set(listingIds)];

  // Fetch listing objects
  const objects = await client.multiGetObjects({
    ids: uniqueIds,
    options: { showContent: true },
  });

  // Parse and filter active ones
  const listings = objects
    .map(parseListing)
    .filter((l): l is OnChainListing => l !== null && l.isActive);

  // For each listing, try to get NFT display data via dynamic object field
  for (const listing of listings) {
    try {
      const dof = await client.getDynamicFieldObject({
        parentId: listing.objectId,
        name: { type: "bool", value: true },
      });

      // getDynamicFieldObject doesn't return display by default,
      // fetch the NFT object with showDisplay if we got an objectId
      if (dof.data?.objectId) {
        const nftObj = await client.getObject({
          id: dof.data.objectId,
          options: { showDisplay: true, showType: true },
        });
        if (nftObj.data?.display?.data) {
          const display = nftObj.data.display.data as Record<string, string>;
          listing.nftImageUrl = display.image_url || "";
          listing.nftName = display.name || listing.title;
          listing.nftDescription = display.description || listing.description;
        }
        if (nftObj.data?.type) {
          listing.nftType = nftObj.data.type;
        }
      }
    } catch {
      // NFT may not have Display — use listing title/description
      listing.nftName = listing.title;
      listing.nftDescription = listing.description;
    }
  }

  return listings;
}

/**
 * Fetch a single listing by ID (includes NFT display data via DOF)
 */
export async function fetchListing(
  client: SuiClient,
  listingId: string
): Promise<OnChainListing | null> {
  const obj = await client.getObject({
    id: listingId,
    options: { showContent: true },
  });
  const listing = parseListing(obj);
  if (!listing) return null;

  // Fetch NFT display via dynamic object field
  try {
    const dof = await client.getDynamicFieldObject({
      parentId: listing.objectId,
      name: { type: "bool", value: true },
    });

    if (dof.data?.objectId) {
      const nftObj = await client.getObject({
        id: dof.data.objectId,
        options: { showDisplay: true, showType: true },
      });
      if (nftObj.data?.display?.data) {
        const display = nftObj.data.display.data as Record<string, string>;
        listing.nftImageUrl = display.image_url || "";
        listing.nftName = display.name || listing.title;
        listing.nftDescription = display.description || listing.description;
      }
      if (nftObj.data?.type) {
        listing.nftType = nftObj.data.type;
      }
    }
  } catch {
    listing.nftName = listing.title;
    listing.nftDescription = listing.description;
  }

  return listing;
}

/**
 * Fetch listings created by a specific seller (via events)
 */
export async function fetchListingsBySeller(
  client: SuiClient,
  sellerAddress: string,
  packageId: string = TESTNET_PACKAGE_ID
): Promise<OnChainListing[]> {
  const { data: events } = await client.queryEvents({
    query: {
      MoveEventType: `${packageId}::${MODULE_NAME}::NftListed`,
    },
    order: "descending",
    limit: 50,
  });

  // Filter events by seller
  const sellerListingIds = events
    .filter((e) => (e.parsedJson as { seller: string }).seller === sellerAddress)
    .map((e) => (e.parsedJson as { listing_id: string }).listing_id);

  if (sellerListingIds.length === 0) return [];

  const uniqueIds = [...new Set(sellerListingIds)];
  const objects = await client.multiGetObjects({
    ids: uniqueIds,
    options: { showContent: true },
  });

  const listings = objects
    .map(parseListing)
    .filter((l): l is OnChainListing => l !== null);

  // Fetch NFT display via DOF for each listing
  for (const listing of listings) {
    try {
      const dof = await client.getDynamicFieldObject({
        parentId: listing.objectId,
        name: { type: "bool", value: true },
      });

      if (dof.data?.objectId) {
        const nftObj = await client.getObject({
          id: dof.data.objectId,
          options: { showDisplay: true, showType: true },
        });
        if (nftObj.data?.display?.data) {
          const display = nftObj.data.display.data as Record<string, string>;
          listing.nftImageUrl = display.image_url || "";
          listing.nftName = display.name || listing.title;
          listing.nftDescription = display.description || listing.description;
        }
        if (nftObj.data?.type) {
          listing.nftType = nftObj.data.type;
        }
      }
    } catch {
      listing.nftName = listing.title;
      listing.nftDescription = listing.description;
    }
  }

  return listings;
}

// ═══════════════════════════════════════════════════════════════
// Subscription queries
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch the list of creator addresses the user is subscribed to.
 * Reads SubscriptionReceipt objects owned by the user.
 */
export async function fetchSubscribedCreators(
  client: SuiClient,
  ownerAddress: string,
  packageId: string = TESTNET_PACKAGE_ID
): Promise<string[]> {
  const { data } = await client.getOwnedObjects({
    owner: ownerAddress,
    filter: {
      StructType: `${packageId}::${MODULE_NAME}::SubscriptionReceipt`,
    },
    options: { showContent: true },
    limit: 50,
  });

  const creators: string[] = [];
  for (const obj of data) {
    const content = obj.data?.content;
    if (!content || content.dataType !== "moveObject") continue;
    const fields = content.fields as Record<string, unknown>;
    if (fields.creator) {
      creators.push(fields.creator as string);
    }
  }
  return [...new Set(creators)];
}

// ═══════════════════════════════════════════════════════════════
// NFT queries
// ═══════════════════════════════════════════════════════════════

export interface OwnedNFT {
  objectId: string;
  type: string;
  name: string;
  description: string;
  imageUrl: string;
}

/**
 * Fetch all NFTs owned by a given address (any type with Display)
 */
export async function fetchOwnedNFTs(
  client: SuiClient,
  ownerAddress: string
): Promise<OwnedNFT[]> {
  const { data } = await client.getOwnedObjects({
    owner: ownerAddress,
    options: { showContent: true, showDisplay: true, showType: true },
    limit: 50,
  });

  const nfts: OwnedNFT[] = [];

  for (const obj of data) {
    if (!obj.data) continue;
    const type = obj.data.type || "";

    // Skip SUI coins, UserProfile, SubscriptionReceipt, and system objects
    if (
      type.includes("::coin::") ||
      type.includes("::DVB_TEAM::UserProfile") ||
      type.includes("::DVB_TEAM::SubscriptionReceipt") ||
      type.includes("0x2::")
    ) {
      continue;
    }

    const display = obj.data.display?.data as Record<string, string> | null;
    if (display) {
      nfts.push({
        objectId: obj.data.objectId,
        type,
        name: display.name || "Unnamed NFT",
        description: display.description || "",
        imageUrl: display.image_url || "",
      });
    }
  }

  return nfts;
}
