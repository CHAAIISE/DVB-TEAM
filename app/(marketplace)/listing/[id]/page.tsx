"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/nft/FavoriteButton";
import { useListingDetail, useBuyNft, useDelistNft } from "@/hooks/useContract";
import { useUser } from "@/contexts/UserContext";

function mistToSui(mist: number): string {
  const sui = mist / 1_000_000_000;
  return sui % 1 === 0 ? sui.toString() : sui.toFixed(2);
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { walletAddress } = useUser();
  const { listing, loading } = useListingDetail(listingId);
  const { buyNft, loading: buying } = useBuyNft();
  const { delistNft, loading: delisting } = useDelistNft();

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground animate-pulse">Loading listing...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Annonce non trouvée</h1>
        <Button onClick={() => router.push("/home")}>Retour au feed</Button>
      </div>
    );
  }

  const isOwner = walletAddress === listing.seller;
  const imageUrl = listing.nftImageUrl || "/placeholder.svg";
  const name = listing.nftName || listing.title;
  const description = listing.nftDescription || listing.description;
  const sellerInitials = listing.seller.slice(2, 4).toUpperCase();
  const shortSeller = `${listing.seller.slice(0, 8)}...${listing.seller.slice(-6)}`;

  const handleBuy = async () => {
    if (!listing.nftType) {
      alert("Cannot determine NFT type for this listing");
      return;
    }
    try {
      await buyNft(listing.objectId, listing.nftType, listing.price);
      alert("Achat effectué avec succès !");
      router.push("/home");
    } catch (error) {
      console.error("Error buying NFT:", error);
      alert("Erreur lors de l'achat");
    }
  };

  return (
    <div className="container max-w-6xl py-4 sm:py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 sm:mb-6"
      >
        {"<- Retour"}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div className="relative">
          <Link
            href={`/profile/${listing.seller}`}
            className="absolute top-4 left-4 z-10"
          >
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-black/70 transition">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {sellerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">
                {shortSeller}
              </span>
            </div>
          </Link>

          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={name}
              width={800}
              height={800}
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-4">
            <h1 className="text-xl sm:text-2xl font-bold break-words">{name}</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <p className="text-2xl sm:text-3xl font-bold">{mistToSui(listing.price)} SUI</p>
              <FavoriteButton listingId={listing.objectId} size="lg" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listing ID</span>
                <span className="font-mono text-xs">
                  {listing.objectId.slice(0, 10)}...{listing.objectId.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">NFT ID</span>
                <span className="font-mono text-xs">
                  {listing.nftId.slice(0, 10)}...{listing.nftId.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seller</span>
                <span className="font-mono text-xs">{shortSeller}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{listing.isActive ? "Active" : "Sold / Delisted"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Favorites</span>
                <span>{listing.favoriteCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain</span>
                <span>Sui</span>
              </div>
            </div>
          </div>

          {listing.isActive && !isOwner && (
            <Button size="lg" className="w-full" onClick={handleBuy} disabled={buying}>
              {buying ? "Processing..." : "Buy now"}
            </Button>
          )}
          {isOwner && listing.isActive && (
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground">This is your listing</p>
              <Button
                size="lg"
                variant="destructive"
                className="w-full"
                disabled={delisting}
                onClick={async () => {
                  if (!listing.nftType) {
                    alert("Cannot determine NFT type for this listing");
                    return;
                  }
                  try {
                    await delistNft(listing.objectId, listing.nftType);
                    alert("Listing cancelled — your NFT has been returned.");
                    router.push("/profile/me");
                  } catch (error) {
                    console.error("Error delisting NFT:", error);
                    alert("Error cancelling listing");
                  }
                }}
              >
                {delisting ? "Cancelling..." : "Cancel Listing"}
              </Button>
            </div>
          )}
          {!listing.isActive && (
            <p className="text-center text-sm text-muted-foreground">This listing is no longer active</p>
          )}
        </div>
      </div>
    </div>
  );
}
