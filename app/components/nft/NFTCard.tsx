"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "./FavoriteButton";
import { Listing } from "@/types";
import TiltedCard from "@/components/ui/TiltedCard";

interface NFTCardProps {
  listing: Listing;
}

export function NFTCard({ listing }: NFTCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/listing/${listing.id}`);
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${listing.sellerId}`);
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
    >
      {/* Image avec effet TiltedCard */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <TiltedCard
          imageSrc={listing.nft.imageUrl}
          altText={listing.nft.name}
          captionText={listing.nft.name}
          containerHeight="100%"
          containerWidth="100%"
          imageHeight="100%"
          imageWidth="100%"
          scaleOnHover={0.8}
          rotateAmplitude={15}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent={false}
          onClick={handleClick}
        />

        {/* Avatar du vendeur en haut à gauche */}
        <button
          onClick={handleSellerClick}
          className="absolute top-2 left-2 z-10 hover:scale-110 transition-transform"
          title={`Voir le profil de ${listing.seller.username}`}
        >
          <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
            <AvatarImage src={listing.seller.avatar} />
            <AvatarFallback className="bg-gray-700 text-white text-xs">
              {listing.seller.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-2xl font-bold">{listing.price} SUI</p>
          <FavoriteButton listingId={listing.id} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {listing.nft.description}
        </p>
      </CardContent>
    </Card>
  );
}
