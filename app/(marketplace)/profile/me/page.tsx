"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/search/SearchBar";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { useUser } from "@/contexts/UserContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useSellerListings, useListings } from "@/hooks/useContract";

export default function MyProfilePage() {
  const {
    walletAddress,
    displayName,
    bio,
    subscriptionPrice,
    subscriberCount,
    subscriptionCount,
    listingCount,
    hasProfile,
    isLoading,
    createProfile,
    updateDisplayName,
    updateBio,
    setSubscriptionPrice,
  } = useUser();
  const { favorites } = useFavorites();

  const { listings: myListings, loading: listingsLoading } = useSellerListings(walletAddress || undefined);
  const { listings: allListings } = useListings();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newUsername, setNewUsername] = useState(displayName);
  const [newBio, setNewBio] = useState(bio);
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState("");
  const [showFullUsername, setShowFullUsername] = useState(false);

  if (!walletAddress) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Connect your wallet to view your profile</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="container py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome to Art-X</h1>
        <p className="text-muted-foreground">Create your on-chain profile to get started</p>
        <Button onClick={createProfile} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Profile"}
        </Button>
      </div>
    );
  }

  const handleSaveUsername = async () => {
    if (newUsername.trim().length < 1) {
      setError("Display name cannot be empty");
      return;
    }

    const success = await updateDisplayName(newUsername.trim());
    if (success) {
      setIsEditingUsername(false);
      setError("");
    } else {
      setError("Failed to update display name");
    }
  };

  const handleSaveBio = async () => {
    const success = await updateBio(newBio.trim());
    if (success) {
      setIsEditingBio(false);
    }
  };

  const handleSavePrice = async () => {
    const priceSui = parseFloat(newPrice);
    if (isNaN(priceSui) || priceSui < 0) {
      setError("Please enter a valid price");
      return;
    }
    const priceMist = Math.round(priceSui * 1_000_000_000);
    if (priceMist === 0) {
      // Contract rejects 0 — default is already 0 (free), so nothing to do
      setIsEditingPrice(false);
      setError("");
      return;
    }
    const success = await setSubscriptionPrice(priceMist);
    if (success) {
      setIsEditingPrice(false);
      setError("");
    } else {
      setError("Failed to update subscription price");
    }
  };

  // Filter listings by status
  const currentListings = myListings.filter((l) => l.isActive);
  const formerListings = myListings.filter((l) => !l.isActive);
  const favoriteListings = allListings.filter((l) => favorites.has(l.objectId));

  // Display name logic
  const showName = displayName || `${walletAddress.slice(0, 4)}...${walletAddress.slice(-3)}`;
  const MAX_USERNAME_LENGTH = 20;
  const shouldTruncateUsername = showName.length > MAX_USERNAME_LENGTH;
  const truncatedUsername = shouldTruncateUsername && !showFullUsername
    ? `${showName.slice(0, 8)}...${showName.slice(-8)}`
    : showName;
  const initials = (displayName || walletAddress).slice(0, 2).toUpperCase();
  const centeredColumnWidth = { width: "min(40rem, 60vw)" };

  return (
    <div className="min-h-screen">
      <main className="py-[3vh] px-[2vw]">
        {/* Header */}
        <div className="flex flex-col items-center gap-[2vh]" style={{ marginBottom: 'min(3rem, 5vh)' }}>
          <h1 className="text-white font-semibold" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
            Art-X
          </h1>

          <div style={centeredColumnWidth}>
            <SearchBar />
          </div>
        </div>

        {/* Profile Card */}
        <div
          className="mx-auto rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden"
          style={centeredColumnWidth}
        >
          {/* Profile header inside card */}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Avatar */}
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 ring-2 ring-white/10">
                <AvatarFallback className="text-2xl sm:text-3xl bg-white/5 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Name & Address */}
              <div className="w-full min-w-0 space-y-1">
                {isEditingUsername ? (
                  <div className="space-y-2">
                    <Input
                      value={newUsername}
                      onChange={(e) => {
                        setNewUsername(e.target.value);
                        setError("");
                      }}
                      placeholder="New display name"
                      className="w-full bg-white/5 border-white/10"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button onClick={handleSaveUsername} size="sm">Save</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingUsername(false);
                          setNewUsername(displayName);
                          setError("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                  </div>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold text-white break-words">
                    {shouldTruncateUsername ? (
                      <>
                        {truncatedUsername.split('...')[0]}
                        <button
                          onClick={() => setShowFullUsername(!showFullUsername)}
                          className="text-white/40 hover:text-white/70 transition-colors"
                          title={showFullUsername ? "Collapse" : "Show full name"}
                        >
                          ...
                        </button>
                        {truncatedUsername.split('...')[1]}
                      </>
                    ) : (
                      showName
                    )}
                  </h1>
                )}
                <p className="text-[11px] sm:text-xs text-white/40 font-mono break-all">
                  {walletAddress}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="font-bold text-lg text-white">{subscriberCount}</p>
                <p className="text-[11px] text-white/40">Subscribers</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="font-bold text-lg text-white">{subscriptionCount}</p>
                <p className="text-[11px] text-white/40">Subscriptions</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="font-bold text-lg text-white">{listingCount}</p>
                <p className="text-[11px] text-white/40">Listings</p>
              </div>
            </div>

            {/* Bio */}
            {isEditingBio ? (
              <div className="space-y-2">
                <Textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Write your bio..."
                  rows={3}
                  className="w-full bg-white/5 border-white/10"
                />
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleSaveBio} size="sm">Save</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingBio(false);
                      setNewBio(bio);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              bio && (
                <p className="text-sm text-white/60 leading-relaxed text-center">
                  {bio}
                </p>
              )
            )}

            {/* Subscription price edit */}
            {isEditingPrice && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Subscription price (SUI)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => {
                    setNewPrice(e.target.value);
                    setError("");
                  }}
                  placeholder="0.00 (free)"
                  className="bg-white/5 border-white/10"
                />
                <p className="text-xs text-white/30">Set to 0 for free subscriptions</p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleSavePrice} size="sm">Save</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingPrice(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewUsername(displayName);
                  setIsEditingUsername(true);
                }}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs"
              >
                Edit name
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewBio(bio);
                  setIsEditingBio(true);
                }}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs"
              >
                Edit bio
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewPrice(subscriptionPrice > 0 ? (subscriptionPrice / 1_000_000_000).toString() : "");
                  setIsEditingPrice(true);
                  setError("");
                }}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs"
              >
                {subscriptionPrice > 0
                  ? `Sub: ${(subscriptionPrice / 1_000_000_000)} SUI`
                  : "Set sub price"}
              </Button>
            </div>
          </div>

          {/* Tabs - inside the card */}
          <div className="border-t border-white/10">
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-transparent rounded-none border-b border-white/5 h-11">
                <TabsTrigger
                  value="current"
                  className="text-xs sm:text-sm text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/5 rounded-none"
                >
                  Current ({currentListings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="former"
                  className="text-xs sm:text-sm text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/5 rounded-none"
                >
                  Former ({formerListings.length})
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="text-xs sm:text-sm text-white/50 data-[state=active]:text-white data-[state=active]:bg-white/5 rounded-none"
                >
                  Favs ({favoriteListings.length})
                </TabsTrigger>
              </TabsList>

              <div className="p-4 sm:p-6">
                <TabsContent value="current" className="mt-0">
                  {listingsLoading ? (
                    <p className="text-center text-white/40 animate-pulse py-8">Loading...</p>
                  ) : (
                    <NFTGrid
                      listings={currentListings}
                      emptyMessage="No active listings"
                    />
                  )}
                </TabsContent>

                <TabsContent value="former" className="mt-0">
                  <NFTGrid
                    listings={formerListings}
                    emptyMessage="No former listings"
                  />
                </TabsContent>

                <TabsContent value="favorites" className="mt-0">
                  <NFTGrid
                    listings={favoriteListings}
                    emptyMessage="No favorite listings"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
