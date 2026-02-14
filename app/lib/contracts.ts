/**
 * Transaction builders for DVB_TEAM smart contract
 * Each function returns a Transaction object ready to be signed and executed
 */

import { Transaction } from "@mysten/sui/transactions";

const MODULE = "DVB_TEAM";

// ═══════════════════════════════════════════════════════════════
// 1. PROFILE
// ═══════════════════════════════════════════════════════════════

export function createProfileTx(packageId: string, registryId: string): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::create_profile`,
    arguments: [tx.object(registryId)],
  });
  return tx;
}

export function updateDisplayNameTx(
  packageId: string,
  profileId: string,
  newName: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::update_display_name`,
    arguments: [tx.object(profileId), tx.pure.string(newName)],
  });
  return tx;
}

export function updateBioTx(
  packageId: string,
  profileId: string,
  newBio: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::update_bio`,
    arguments: [tx.object(profileId), tx.pure.string(newBio)],
  });
  return tx;
}

export function setSubscriptionPriceTx(
  packageId: string,
  profileId: string,
  newPrice: number
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::set_subscription_price`,
    arguments: [tx.object(profileId), tx.pure.u64(newPrice)],
  });
  return tx;
}

// ═══════════════════════════════════════════════════════════════
// 2. SUBSCRIPTION (Hot Potato — 2 steps in 1 PTB)
// ═══════════════════════════════════════════════════════════════

export function subscribeTx(
  packageId: string,
  creatorProfileId: string,
  subscriberProfileId: string,
  amountMist: number
): Transaction {
  const tx = new Transaction();

  // Step 1: request_subscription → returns SubscriptionTicket
  const [ticket] = tx.moveCall({
    target: `${packageId}::${MODULE}::request_subscription`,
    arguments: [tx.object(creatorProfileId)],
  });

  // Split exact coin for payment
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);

  // Step 2: complete_subscription → consumes ticket
  tx.moveCall({
    target: `${packageId}::${MODULE}::complete_subscription`,
    arguments: [
      ticket,
      tx.object(creatorProfileId),
      tx.object(subscriberProfileId),
      payment,
    ],
  });

  return tx;
}

// ═══════════════════════════════════════════════════════════════
// 3. MARKETPLACE — List, Favorite, Delist
// ═══════════════════════════════════════════════════════════════

export function listNftTx(
  packageId: string,
  profileId: string,
  nftId: string,
  nftType: string,
  priceMist: number,
  title: string,
  description: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::list_nft_for_sale`,
    typeArguments: [nftType],
    arguments: [
      tx.object(profileId),
      tx.object(nftId),
      tx.pure.u64(priceMist),
      tx.pure.string(title),
      tx.pure.string(description),
    ],
  });
  return tx;
}

export function toggleFavoriteTx(
  packageId: string,
  profileId: string,
  listingId: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::toggle_favorite`,
    arguments: [tx.object(profileId), tx.object(listingId)],
  });
  return tx;
}

export function delistNftTx(
  packageId: string,
  listingId: string,
  nftType: string
): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::${MODULE}::delist_and_take`,
    typeArguments: [nftType],
    arguments: [tx.object(listingId)],
  });
  return tx;
}

// ═══════════════════════════════════════════════════════════════
// 4. PURCHASE (Hot Potato — 2 steps in 1 PTB)
// ═══════════════════════════════════════════════════════════════

export function buyNftTx(
  packageId: string,
  listingId: string,
  nftType: string,
  priceMist: number
): Transaction {
  const tx = new Transaction();

  // Step 1: initiate_purchase → returns PurchaseTicket
  const [ticket] = tx.moveCall({
    target: `${packageId}::${MODULE}::initiate_purchase`,
    arguments: [tx.object(listingId)],
  });

  // Split exact coin for payment
  const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)]);

  // Step 2: buy_and_take → consumes ticket, transfers NFT to buyer
  tx.moveCall({
    target: `${packageId}::${MODULE}::buy_and_take`,
    typeArguments: [nftType],
    arguments: [ticket, tx.object(listingId), payment],
  });

  return tx;
}
