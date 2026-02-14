"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/UserContext";
import { useOwnedNFTs, useListNft } from "@/hooks/useContract";
import { OwnedNFT } from "@/lib/queries";

export default function CreateListingPage() {
  const router = useRouter();
  const { walletAddress, profileId, hasProfile, createProfile, isLoading: profileLoading } = useUser();
  const { nfts, loading: nftsLoading } = useOwnedNFTs();
  const { listNft, loading: listingLoading } = useListNft();

  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const [price, setPrice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (!walletAddress) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Connect your wallet to create a listing</p>
      </div>
    );
  }

  if (!hasProfile && !profileLoading) {
    return (
      <div className="container max-w-2xl py-8 px-4 text-center space-y-4">
        <h1 className="text-2xl font-bold">Create your profile first</h1>
        <p className="text-muted-foreground">You need an on-chain profile to list NFTs</p>
        <Button onClick={createProfile} disabled={profileLoading}>
          {profileLoading ? "Creating..." : "Create Profile"}
        </Button>
      </div>
    );
  }

  const handlePost = async () => {
    if (!selectedNFT || !price || !profileId) {
      alert("Please select an NFT and set a price");
      return;
    }

    const priceSui = parseFloat(price);
    if (isNaN(priceSui) || priceSui <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const priceMist = Math.round(priceSui * 1_000_000_000);
    const listingTitle = title.trim() || selectedNFT.name;
    const listingDescription = description.trim() || selectedNFT.description;

    try {
      await listNft(
        profileId,
        selectedNFT.objectId,
        selectedNFT.type,
        priceMist,
        listingTitle,
        listingDescription
      );
      alert("Listing created successfully!");
      router.push("/home");
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Error creating listing. Check console for details.");
    }
  };

  return (
    <div className="container max-w-2xl py-4 sm:py-8 px-4">
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Retour
        </Button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Post a listing</h1>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Step 1: Select NFT */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Select an NFT from your wallet
            </Label>

            {nftsLoading ? (
              <p className="text-muted-foreground text-sm animate-pulse">Loading your NFTs...</p>
            ) : nfts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                You don&apos;t have any NFTs in your wallet
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nfts.map((nft) => (
                  <div
                    key={nft.objectId}
                    onClick={() => {
                      setSelectedNFT(nft);
                      if (!title) setTitle(nft.name);
                      if (!description) setDescription(nft.description);
                    }}
                    className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                      selectedNFT?.objectId === nft.objectId
                        ? "border-primary shadow-lg scale-105"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={nft.imageUrl || "/placeholder.svg"}
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

          {/* Selected NFT preview */}
          {selectedNFT && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm font-semibold mb-2">Selected NFT:</p>
              <div className="flex gap-4">
                <div className="relative h-20 w-20 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={selectedNFT.imageUrl || "/placeholder.svg"}
                    alt={selectedNFT.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold">{selectedNFT.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedNFT.description}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {selectedNFT.objectId.slice(0, 10)}...{selectedNFT.objectId.slice(-6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Title */}
          <div>
            <Label htmlFor="title" className="text-base font-semibold mb-2 block">
              Listing title
            </Label>
            <Input
              id="title"
              placeholder="Title for your listing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Step 3: Description */}
          <div>
            <Label htmlFor="description" className="text-base font-semibold mb-2 block">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your NFT listing..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Step 4: Price */}
          <div>
            <Label htmlFor="price" className="text-base font-semibold mb-2 block">
              Price (SUI)
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
              Set the sale price in SUI
            </p>
          </div>

          {/* Step 5: Post */}
          <Button
            size="lg"
            className="w-full"
            disabled={!selectedNFT || !price || listingLoading}
            onClick={handlePost}
          >
            {listingLoading ? "Publishing..." : "Publish listing"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
