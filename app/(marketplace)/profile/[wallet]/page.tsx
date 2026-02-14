"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/profile/FollowButton";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { mockUsers, mockListings } from "@/mock";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.wallet as string;

  // Find user from mock data
  const user = mockUsers.find((u) => u.walletAddress === walletAddress);

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Utilisateur non trouvé</h1>
        <Button onClick={() => router.push("/home")}>Retour au feed</Button>
      </div>
    );
  }

  // Get user's current listings
  const currentListings = mockListings.filter(
    (l) => l.sellerId === user.walletAddress && l.status === "active"
  );

  return (
    <div className="container max-w-6xl py-8 px-24">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        ← Retour
      </Button>

      {/* Header */}
      <div className="flex items-start gap-6 mb-8 pb-8 border-b mx-auto" style={{ maxWidth: '900px' }}>
        {/* Gauche: Avatar */}
        <Avatar className="h-32 w-32">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-4xl">
            {user.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Centre: Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{user.username}</h1>
            {user.suinsName && (
              <p className="text-sm text-blue-500 font-medium">🏷️ {user.suinsName}</p>
            )}
            <p className="text-sm text-muted-foreground font-mono">
              {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
            </p>
          </div>

          {user.bio && (
            <p className="text-muted-foreground leading-relaxed">
              {user.bio}
            </p>
          )}
        </div>

        {/* Droite: Bouton Follow + Stats */}
        <div className="space-y-4 min-w-[200px]">
          <FollowButton
            userId={user.walletAddress}
            subscriptionPrice={user.subscriptionPrice}
            isFollowing={false}
          />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{currentListings.length}</p>
              <p className="text-sm text-muted-foreground">Listings</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Abonnés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Annonces actuelles uniquement */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Current Listings</h2>
        <NFTGrid
          listings={currentListings}
          emptyMessage="Cet utilisateur n'a aucune annonce active"
        />
      </div>
    </div>
  );
}
