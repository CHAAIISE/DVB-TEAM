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
import { mockListings } from "@/mock";

export default function MyProfilePage() {
  const { currentUser, updateUsername, updateBio } = useUser();
  const { favorites } = useFavorites();

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.username || "");
  const [newBio, setNewBio] = useState(currentUser?.bio || "");
  const [error, setError] = useState("");
  const [showFullUsername, setShowFullUsername] = useState(false);

  // Mock stats - à remplacer par de vraies données plus tard
  const stats = {
    followers: 142,
    following: 87,
    currentListings: 0 // Will be calculated below
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // TODO: Implement search functionality
  };

  if (!currentUser) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  const handleSaveUsername = async () => {
    if (newUsername.trim().length < 3) {
      setError("Le username doit contenir au moins 3 caractères");
      return;
    }

    const success = await updateUsername(newUsername.trim());
    if (success) {
      setIsEditingUsername(false);
      setError("");
    } else {
      setError("Ce username est déjà pris");
    }
  };

  const handleSaveBio = async () => {
    await updateBio(newBio.trim());
    setIsEditingBio(false);
  };

  // Get listings
  const currentListings = mockListings.filter(
    (l) => l.sellerId === currentUser.walletAddress && l.status === "active"
  );
  const formerListings = mockListings.filter(
    (l) => l.sellerId === currentUser.walletAddress && l.status === "sold"
  );
  const favoriteListings = mockListings.filter((l) =>
    favorites.has(l.id)
  );

  // Update stats with actual current listings count
  stats.currentListings = currentListings.length;

  // Username ellipsis logic (max 20 chars)
  const MAX_USERNAME_LENGTH = 20;
  const displayUsername = currentUser.username || `${currentUser.walletAddress.slice(0, 4)}...${currentUser.walletAddress.slice(-3)}`;
  const shouldTruncateUsername = displayUsername.length > MAX_USERNAME_LENGTH;
  const truncatedUsername = shouldTruncateUsername && !showFullUsername
    ? `${displayUsername.slice(0, 8)}...${displayUsername.slice(-8)}`
    : displayUsername;
  const centeredColumnWidth = { width: "min(40rem, 60vw)" };

  return (
    <div className="min-h-screen bg-background">
      <main className="py-[3vh] px-[2vw]">
        {/* Titre et SearchBar centrés */}
        <div className="flex flex-col items-center gap-[2vh]" style={{ marginBottom: 'min(3rem, 5vh)' }}>
          <h1 className="text-white font-semibold" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
            Art-X
          </h1>

          <div style={centeredColumnWidth}>
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        <div className="w-full">
          {/* Header */}
          <div className="mx-auto mb-6 sm:mb-8 pb-6 sm:pb-8 border-b space-y-4" style={centeredColumnWidth}>
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
              {/* Avatar */}
              <Avatar className="h-20 w-20 sm:h-32 sm:w-32 shrink-0">
                <AvatarFallback className="text-2xl sm:text-4xl">
                  {currentUser.username.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>

              {/* Username, Address, and Stats */}
              <div className="w-full min-w-0">
                <div className="flex flex-col items-center gap-4">
                  {/* Left: Username and Address */}
                  <div className="w-full min-w-0">
                    {isEditingUsername ? (
                      <div className="space-y-2">
                        <Input
                          value={newUsername}
                          onChange={(e) => {
                            setNewUsername(e.target.value);
                            setError("");
                          }}
                          placeholder="Nouveau username"
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveUsername} size="sm">Sauvegarder</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingUsername(false);
                              setNewUsername(currentUser.username);
                              setError("");
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                      </div>
                    ) : (
                      <h1 className="text-2xl sm:text-3xl font-bold break-words">
                        {shouldTruncateUsername ? (
                          <>
                            {truncatedUsername.split('...')[0]}
                            <button
                              onClick={() => setShowFullUsername(!showFullUsername)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              title={showFullUsername ? "Réduire" : "Voir le nom complet"}
                            >
                              ...
                            </button>
                            {truncatedUsername.split('...')[1]}
                          </>
                        ) : (
                          displayUsername
                        )}
                      </h1>
                    )}
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-1 break-all">
                      {currentUser.walletAddress}
                    </p>

                    {/* Stats on mobile */}
                    <div className="flex gap-6 mt-4 sm:hidden">
                      <div className="text-center">
                        <p className="font-bold text-lg">{stats.followers}</p>
                        <p className="text-xs text-muted-foreground">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{stats.following}</p>
                        <p className="text-xs text-muted-foreground">Following</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{stats.currentListings}</p>
                        <p className="text-xs text-muted-foreground">Listings</p>
                      </div>
                    </div>
                  </div>

                  {/* Center: Stats (desktop only) */}
                  <div className="hidden sm:flex gap-6 shrink-0 justify-center">
                    <div className="text-center">
                      <p className="font-bold text-xl">{stats.followers}</p>
                      <p className="text-sm text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xl">{stats.following}</p>
                      <p className="text-sm text-muted-foreground">Following</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-xl">{stats.currentListings}</p>
                      <p className="text-sm text-muted-foreground">Listings</p>
                    </div>
                  </div>

                  {/* Right: Edit buttons */}
                  <div className="flex flex-col gap-8 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingUsername(true)}
                      className="w-full sm:w-auto whitespace-nowrap"
                    >
                      Edit username
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBio(true)}
                      className="w-full sm:w-auto whitespace-nowrap"
                    >
                      Edit description
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio section */}
            {isEditingBio ? (
              <div className="space-y-2">
                <Textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Écrivez votre bio..."
                  rows={3}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveBio} size="sm">Sauvegarder</Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingBio(false);
                      setNewBio(currentUser.bio || "");
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              currentUser.bio && (
                <p className="text-muted-foreground leading-relaxed">
                  {currentUser.bio}
                </p>
              )
            )}
          </div>

      {/* Tabs - IMPERATIVEMENT alignés avec search bar et titre */}
      <Tabs defaultValue="former" className="w-full flex flex-col items-center">
        <TabsList className="grid grid-cols-3 mx-auto" style={centeredColumnWidth}>
          <TabsTrigger value="current" className="w-full text-center justify-center text-xs sm:text-sm px-2">Current listing ({currentListings.length})</TabsTrigger>
          <TabsTrigger value="former" className="w-full text-center justify-center text-xs sm:text-sm px-2">Former listing ({formerListings.length})</TabsTrigger>
          <TabsTrigger value="favorites" className="w-full text-center justify-center text-xs sm:text-sm px-2">Favourites ({favoriteListings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          <NFTGrid
            listings={favoriteListings}
            emptyMessage="No favorite listings"
          />
        </TabsContent>

        <TabsContent value="former" className="mt-6">
          <NFTGrid
            listings={formerListings}
            emptyMessage="No former listings"
          />
        </TabsContent>

        <TabsContent value="current" className="mt-6">
          <NFTGrid
            listings={currentListings}
            emptyMessage="No active listings"
          />
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  );
}
