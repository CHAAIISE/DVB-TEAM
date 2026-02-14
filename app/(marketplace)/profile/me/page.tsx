"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  return (
    <div className="container max-w-6xl py-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8 pb-8 border-b">
        <Avatar className="h-32 w-32">
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback className="text-4xl">
            {currentUser.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-4">
          {/* Username éditable */}
          <div>
            {isEditingUsername ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      setError("");
                    }}
                    placeholder="Nouveau username"
                    className="max-w-xs"
                  />
                  <Button onClick={handleSaveUsername}>Sauvegarder</Button>
                  <Button
                    variant="ghost"
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
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{currentUser.username}</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingUsername(true)}
                >
                  Changer username
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {currentUser.walletAddress}
            </p>
          </div>

          {/* Bio éditable */}
          <div>
            {isEditingBio ? (
              <div className="space-y-2">
                <Textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Écrivez votre bio..."
                  rows={3}
                  className="max-w-2xl"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveBio}>Sauvegarder</Button>
                  <Button
                    variant="ghost"
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
              <div className="flex items-start gap-2">
                {currentUser.bio && (
                  <p className="text-muted-foreground leading-relaxed flex-1">
                    {currentUser.bio}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBio(true)}
                >
                  Edit description
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="former" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-4xl ml-auto mr-0">
          <TabsTrigger value="current">Current listing ({currentListings.length})</TabsTrigger>
          <TabsTrigger value="former">Former listing ({formerListings.length})</TabsTrigger>
          <TabsTrigger value="favorites">Favourites ({favoriteListings.length})</TabsTrigger>
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
  );
}
