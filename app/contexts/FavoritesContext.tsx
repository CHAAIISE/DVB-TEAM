"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useToggleFavorite } from '../hooks/useContract';
import { useUser } from './UserContext';

interface FavoritesContextType {
  favorites: Set<string>;
  toggleFavorite: (listingId: string) => void;
  isFavorited: (listingId: string) => boolean;
  favoritesCount: number;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toggleFavorite: doToggle, loading } = useToggleFavorite();
  const { profileId } = useUser();

  const toggleFavorite = useCallback((listingId: string) => {
    // Optimistic update
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(listingId)) {
        newFavorites.delete(listingId);
      } else {
        newFavorites.add(listingId);
      }
      return newFavorites;
    });

    // Send on-chain transaction
    if (profileId) {
      doToggle(profileId, listingId).catch(() => {
        // Revert on error
        setFavorites(prev => {
          const reverted = new Set(prev);
          if (reverted.has(listingId)) {
            reverted.delete(listingId);
          } else {
            reverted.add(listingId);
          }
          return reverted;
        });
      });
    }
  }, [profileId, doToggle]);

  const isFavorited = useCallback((listingId: string): boolean => {
    return favorites.has(listingId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorited,
        favoritesCount: favorites.size,
        loading,
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
