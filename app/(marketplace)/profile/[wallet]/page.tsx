"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/profile/FollowButton";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { mockUsers, mockListings } from "@/mock";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.wallet as string;

  const user = mockUsers.find((u) => u.walletAddress === walletAddress);

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Utilisateur non trouve</h1>
        <Button onClick={() => router.push("/home")}>Retour au feed</Button>
      </div>
    );
  }

  const currentListings = mockListings.filter(
    (l) => l.sellerId === user.walletAddress && l.status === "active"
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="py-[3vh] px-[2vw]">
        <div className="mx-auto w-full max-w-[95vw]">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 sm:mb-6"
          >
            {"<- Retour"}
          </Button>

          <div className="mx-auto mb-6 sm:mb-8 w-full max-w-4xl border-b pb-6 sm:pb-8">
            <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
              <Avatar className="h-20 w-20 sm:h-32 sm:w-32 shrink-0">
                <AvatarFallback className="text-2xl sm:text-4xl">
                  {user.username.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>

              <div className="w-full max-w-3xl min-w-0 space-y-3 sm:space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold break-words">{user.username}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                    {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
                  </p>
                </div>

                {user.bio && (
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {user.bio}
                  </p>
                )}
              </div>

              <div className="w-full max-w-md space-y-4">
                <FollowButton
                  userId={user.walletAddress}
                  subscriptionPrice={user.subscriptionPrice}
                  isFollowing={false}
                />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{currentListings.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Listings</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">0</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Abonnes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Current Listings</h2>
            <NFTGrid
              listings={currentListings}
              emptyMessage="Cet utilisateur n'a aucune annonce active"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
