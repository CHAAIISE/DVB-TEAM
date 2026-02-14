"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "./FavoriteButton";
import { Listing } from "@/types";
import TiltedCard from "@/components/ui/TiltedCard";

interface NFTCardProps {
  listing: Listing;
}

export function NFTCard({ listing }: NFTCardProps) {
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    router.push(`/listing/${listing.id}`);
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${listing.sellerId}`);
  };

  // Obtenir les 2 premiers caractères (username ou wallet address)
  const initials = (listing.seller.username || listing.seller.walletAddress).slice(0, 2).toUpperCase();

  return (
    <Card
      className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-md bg-black/30 border-white/10"
      style={{ height: 'fit-content' }}
    >
      {/* Image avec effet TiltedCard */}
      <div className="relative aspect-square overflow-hidden bg-muted/50 backdrop-blur-sm">
        <TiltedCard
          imageSrc={listing.nft.imageUrl}
          altText={listing.nft.name}
          captionText={listing.nft.name}
          containerHeight="100%"
          containerWidth="100%"
          imageHeight="85%"
          imageWidth="85%"
          scaleOnHover={0.8}
          rotateAmplitude={15}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={false}
          onClick={handleClick}
        />

        {/* Initiales du vendeur en bas à gauche */}
        <button
          onClick={handleSellerClick}
          className="absolute bottom-2 left-2 z-10 hover:scale-110 transition-transform bg-black/90 backdrop-blur-sm text-white rounded-full h-10 w-10 flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg"
          title={`Voir le profil de ${listing.seller.username || listing.seller.walletAddress}`}
        >
          {initials}
        </button>
      </div>

      {/* Content avec hauteur fixe */}
      <CardContent
        className="p-4 backdrop-blur-sm bg-black/20"
        style={{ minHeight: '120px', maxHeight: '120px', display: 'flex', flexDirection: 'column' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-2xl font-bold">{listing.price} SUI</p>
          <FavoriteButton listingId={listing.id} size="sm" />
        </div>
        <div
          className="flex-1 overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <p
            className="text-sm text-muted-foreground transition-all duration-300"
            style={{
              maxHeight: isHovering ? '200px' : '3.6em',
              overflowY: isHovering ? 'auto' : 'hidden',
              lineHeight: '1.2em'
            }}
          >
            {listing.nft.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
