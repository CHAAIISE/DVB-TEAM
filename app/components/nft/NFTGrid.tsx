import { Listing } from "@/types";
import { NFTCard } from "./NFTCard";

interface NFTGridProps {
  listings: Listing[];
  emptyMessage?: string;
}

export function NFTGrid({ listings, emptyMessage = "Aucune annonce disponible" }: NFTGridProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="px-8 md:px-16 lg:px-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {listings.map((listing) => (
          <div key={listing.id} className="scale-[0.85]">
            <NFTCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
}
