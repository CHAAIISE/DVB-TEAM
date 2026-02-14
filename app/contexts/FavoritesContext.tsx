"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (listingId: string) => void;
  isFavorited: (listingId: string) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (listingId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(listingId)) {
        newFavorites.delete(listingId);
      } else {
        newFavorites.add(listingId);
      }
      return newFavorites;
    });
  };

  const isFavorited = (listingId: string): boolean => {
    return favorites.has(listingId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorited,
        favoritesCount: favorites.size,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
