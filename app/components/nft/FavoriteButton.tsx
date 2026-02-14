"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  listingId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FavoriteButton({ listingId, size = "md", className }: FavoriteButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(listingId);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(sizeClasses[size], "hover:bg-red-50 dark:hover:bg-red-950", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(listingId);
      }}
    >
      <Heart
        className={cn(
          iconSizes[size],
          favorited
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-500"
        )}
      />
    </Button>
  );
}
