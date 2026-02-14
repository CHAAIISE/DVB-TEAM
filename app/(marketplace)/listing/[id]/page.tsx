"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/nft/FavoriteButton";
import { mockListings } from "@/mock";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const listing = mockListings.find((l) => l.id === listingId);

  if (!listing) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Annonce non trouvee</h1>
        <Button onClick={() => router.push("/home")}>Retour au feed</Button>
      </div>
    );
  }

  const handleBuy = () => {
    console.log("Buying NFT:", listing.nft.id);
    alert("Fonction d'achat a implementer avec la blockchain!");
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
            href={`/profile/${listing.seller.walletAddress}`}
            className="absolute top-4 left-4 z-10"
          >
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-black/70 transition">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {listing.seller.username.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">
                {listing.seller.username}
              </span>
            </div>
          </Link>

          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={listing.nft.imageUrl}
              alt={listing.nft.name}
              width={800}
              height={800}
              className="object-cover w-full h-full"
              priority
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-4">
            <h1 className="text-xl sm:text-2xl font-bold break-words">{listing.nft.name}</h1>
            <div className="flex items-center gap-3 sm:gap-4">
              <p className="text-2xl sm:text-3xl font-bold">{listing.price} SUI</p>
              <FavoriteButton listingId={listing.id} size="lg" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              {listing.nft.description}
            </p>
          </div>

          {listing.nft.collection && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Collection</h2>
              <p className="font-medium">{listing.nft.collection}</p>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Address</span>
                <span className="font-mono text-xs">
                  {listing.nft.objectId.slice(0, 10)}...{listing.nft.objectId.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token ID</span>
                <span className="font-mono text-xs">{listing.nft.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Blockchain</span>
                <span>Sui</span>
              </div>
            </div>
          </div>

          <Button size="lg" className="w-full" onClick={handleBuy}>
            buy now
          </Button>
        </div>
      </div>
    </div>
  );
}
