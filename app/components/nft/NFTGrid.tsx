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
    <div className="px-[2vw]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[2vw] max-w-[95vw] mx-auto">
        {listings.map((listing) => (
          <div key={listing.id} className="w-full flex justify-center">
            <div className="w-full" style={{ maxWidth: 'min(400px, 100%)' }}>
              <NFTCard listing={listing} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
