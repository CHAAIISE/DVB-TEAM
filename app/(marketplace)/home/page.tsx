"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { useListings, useSubscribedCreators } from "@/hooks/useContract";
import { useMemo } from "react";

export default function HomePage() {
  const { listings, loading } = useListings();
  const { creators: subscribedCreators, loading: subsLoading } = useSubscribedCreators();

  const feedListings = useMemo(() => {
    return listings.filter((l) => subscribedCreators.includes(l.seller));
  }, [listings, subscribedCreators]);

  const isLoading = loading || subsLoading;

  return (
    <div className="min-h-screen bg-background">
      <main className="py-[3vh] px-[2vw]">
        {/* Titre et SearchBar centrés */}
        <div className="flex flex-col items-center gap-[2vh]" style={{ marginBottom: 'min(3rem, 5vh)' }}>
          <h1 className="text-white font-semibold" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
            Art-X
          </h1>

          <div style={{ width: 'min(40rem, 60vw)' }}>
            <SearchBar />
          </div>
        </div>

        {/* Feed title */}
        <div className="text-center" style={{ marginBottom: 'min(2rem, 4vh)' }}>
          <h2 className="font-semibold" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)' }}>
            Feed
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground animate-pulse">Loading feed...</p>
          </div>
        ) : feedListings.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground">No listings from your subscriptions yet</p>
            <p className="text-sm text-muted-foreground">Subscribe to creators to see their listings here</p>
          </div>
        ) : (
          <NFTGrid listings={feedListings} />
        )}
      </main>
    </div>
  );
}
