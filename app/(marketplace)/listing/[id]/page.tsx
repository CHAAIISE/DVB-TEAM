"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/components/nft/FavoriteButton";
import { mockListings } from "@/mock";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  // Find listing from mock data
  const listing = mockListings.find((l) => l.id === listingId);

  if (!listing) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Annonce non trouvée</h1>
        <Button onClick={() => router.push("/home")}>Retour au feed</Button>
      </div>
    );
  }

  const handleBuy = () => {
    // TODO: Implement buy functionality with blockchain
    console.log("Buying NFT:", listing.nft.id);
    alert("Fonction d'achat à implémenter avec la blockchain!");
  };

  return (
    <div className="container max-w-6xl py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        ← Retour
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Gauche: Image */}
        <div className="relative">
          {/* En haut à gauche de l'image: Vendeur */}
          <Link
            href={`/profile/${listing.seller.walletAddress}`}
            className="absolute top-4 left-4 z-10"
          >
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-black/70 transition">
              <Avatar className="h-8 w-8">
                <AvatarImage src={listing.seller.avatar} />
                <AvatarFallback className="text-xs">
                  {listing.seller.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">
                {listing.seller.username}
              </span>
            </div>
          </Link>

          {/* Image principale */}
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

          {/* En bas de l'image: Info */}
          <div className="flex items-center justify-between mt-4">
            <h1 className="text-2xl font-bold">{listing.nft.name}</h1>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold">{listing.price} SUI</p>
              <FavoriteButton listingId={listing.id} size="lg" />
            </div>
          </div>
        </div>

        {/* Droite: Détails */}
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

          {listing.nft.attributes && listing.nft.attributes.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Attributs</h2>
              <div className="grid grid-cols-2 gap-3">
                {listing.nft.attributes.map((attr, i) => (
                  <Card key={i} className="p-3">
                    <p className="text-sm text-muted-foreground">
                      {attr.trait_type}
                    </p>
                    <p className="font-medium">{attr.value}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold mb-2">Détails</h2>
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
            Acheter maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}
