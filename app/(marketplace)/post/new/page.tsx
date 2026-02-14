"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/contexts/UserContext";
import { mockNFTs } from "@/mock";
import { NFT } from "@/types";

export default function CreateListingPage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!currentUser) {
    return null;
  }

  // Get user's NFTs (mock data filtered by user)
  const userNFTs = mockNFTs.filter((nft) => nft.owner === currentUser.walletAddress);

  const handlePost = async () => {
    if (!selectedNFT || !price) {
      alert("Veuillez sélectionner un NFT et définir un prix");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement listing creation on blockchain
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      console.log("Creating listing for NFT:", selectedNFT.id, "at price:", price);

      alert("Annonce créée avec succès!");
      router.push("/home");
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Erreur lors de la création de l'annonce");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          ← Retour
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Poster une annonce</h1>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Étape 1: Sélection NFT */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Sélectionnez un NFT de votre wallet
            </Label>

            {userNFTs.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Vous n'avez aucun NFT dans votre wallet
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => setSelectedNFT(nft)}
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedNFT?.id === nft.id
                        ? "border-primary shadow-lg scale-105"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={nft.imageUrl}
                        alt={nft.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2 bg-muted">
                      <p className="text-sm font-medium truncate">{nft.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aperçu NFT sélectionné */}
          {selectedNFT && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm font-semibold mb-2">NFT sélectionné:</p>
              <div className="flex gap-4">
                <div className="relative h-20 w-20 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={selectedNFT.imageUrl}
                    alt={selectedNFT.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedNFT.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedNFT.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Prix */}
          <div>
            <Label htmlFor="price" className="text-base font-semibold mb-2 block">
              Prix de vente (SUI)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-lg"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Définissez le prix de votre NFT en SUI
            </p>
          </div>

          {/* Étape 3: Bouton Post */}
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedNFT || !price || isLoading}
            onClick={handlePost}
          >
            {isLoading ? "Publication..." : "Publier l'annonce"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
