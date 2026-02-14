"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/profile/FollowButton";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { useProfile, useSellerListings } from "@/hooks/useContract";

function mistToSui(mist: number): string {
  const sui = mist / 1_000_000_000;
  return sui % 1 === 0 ? sui.toString() : sui.toFixed(2);
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const walletAddress = params.wallet as string;

  const { profile, loading: profileLoading } = useProfile(walletAddress);
  const { listings, loading: listingsLoading } = useSellerListings(walletAddress);

  if (profileLoading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
  }

  const displayName = profile?.displayName || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const initials = (profile?.displayName || walletAddress).slice(0, 2).toUpperCase();
  const shortAddress = `${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}`;
  const activeListings = listings.filter((l) => l.isActive);

  return (
    <div className="min-h-screen">
      <main className="py-[3vh] px-[2vw]">
        <div className="mx-auto w-full" style={{ maxWidth: "min(40rem, 90vw)" }}>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 sm:mb-6 text-white/60 hover:text-white hover:bg-white/5"
          >
            {"← Back"}
          </Button>

          {/* Profile Card */}
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden">
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
                  <h1 className="text-xl sm:text-2xl font-bold text-white break-words">{displayName}</h1>
                  <p className="text-[11px] sm:text-xs text-white/40 font-mono break-all">
                    {shortAddress}
                  </p>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-white/60 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Subscribe button */}
              {profile && (
                <div className="flex justify-center">
                  <FollowButton
                    creatorProfileId={profile.objectId}
                    creatorAddress={profile.owner}
                    subscriptionPrice={profile.subscriptionPrice}
                  />
                </div>
              )}

              {/* Stats row */}
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="font-bold text-lg text-white">{activeListings.length}</p>
                  <p className="text-[11px] text-white/40">Listings</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="font-bold text-lg text-white">{profile?.subscriberCount || 0}</p>
                  <p className="text-[11px] text-white/40">Subscribers</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-center">
                  <p className="font-bold text-lg text-white">
                    {profile?.subscriptionPrice ? mistToSui(profile.subscriptionPrice) : "Free"}
                  </p>
                  <p className="text-[11px] text-white/40">Sub price</p>
                </div>
              </div>
            </div>

            {/* Listings section */}
            <div className="border-t border-white/10 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-4 text-center">Current Listings</h2>
              {listingsLoading ? (
                <p className="text-center text-white/40 animate-pulse py-8">Loading...</p>
              ) : (
                <NFTGrid
                  listings={activeListings}
                  emptyMessage="This user has no active listings"
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
