"use client";

import { SearchBar } from "@/components/search/SearchBar";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { mockListings } from "@/mock";

export default function HomePage() {

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // TODO: Implement search functionality
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Feed */}
      <main className="py-[3vh] px-[2vw]">
        {/* Titre et SearchBar centrés */}
        <div className="flex flex-col items-center gap-[2vh]" style={{ marginBottom: 'min(3rem, 5vh)' }}>
          <h1 className="text-white font-semibold" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
            Art-X
          </h1>

          <div style={{ width: 'min(40rem, 60vw)' }}>
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>

        {/* Titre Last listings */}
        <div className="text-center" style={{ marginBottom: 'min(2rem, 4vh)' }}>
          <h2 className="font-semibold" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)' }}>
            Last listings
          </h2>
        </div>

        <NFTGrid listings={mockListings} />
      </main>
    </div>
  );
}
