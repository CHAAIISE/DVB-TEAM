"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SearchResult {
  walletAddress: string;
  username: string;
  avatar?: string;
  suinsName?: string;
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [displayCount, setDisplayCount] = useState(5);
  const [isFullSearch, setIsFullSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fonction de recherche avec support SUINS
  const searchUsers = useCallback(async (searchQuery: string, fullSearch: boolean) => {
    if (!searchQuery.trim()) {
      setShowResults(false);
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const isSuins = searchQuery.endsWith(".sui") ||
      (!searchQuery.startsWith("0x") && /^[a-zA-Z0-9-]+$/.test(searchQuery) && searchQuery.length > 2);

    try {
      let profileResults: SearchResult[] = [];

      if (isSuins) {
        // Résolution SUINS via API puis recherche profil
        const suinsRes = await fetch(`/api/suins?query=${encodeURIComponent(searchQuery)}`);
        const suinsData = await suinsRes.json();

        if (suinsData.found && suinsData.address) {
          const profileRes = await fetch(`/api/profiles?search=${encodeURIComponent(suinsData.address)}`);
          const profileData = await profileRes.json();
          profileResults = (profileData.profiles || []).map((p: any) => ({
            walletAddress: p.owner_address,
            username: p.display_name || p.suins_name || p.owner_address,
            avatar: p.avatar_url,
            suinsName: p.suins_name || suinsData.name,
          }));
        }
      }

      // Recherche classique en parallèle (par nom, adresse, suins_name)
      if (profileResults.length === 0) {
        const res = await fetch(`/api/profiles?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        profileResults = (data.profiles || []).map((p: any) => ({
          walletAddress: p.owner_address,
          username: p.display_name || p.suins_name || p.owner_address,
          avatar: p.avatar_url,
          suinsName: p.suins_name,
        }));
      }

      setResults(profileResults);
      setShowResults(true);
      if (!fullSearch) setDisplayCount(5);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce de 300ms sur la recherche
  useEffect(() => {
    if (!query.trim()) {
      setShowResults(false);
      setResults([]);
      setIsFullSearch(false);
      setDisplayCount(5);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(query, isFullSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, isFullSearch, searchUsers]);

  // Clic en dehors pour fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsFullSearch(true);
      setDisplayCount(15);
      if (onSearch) {
        onSearch(query.trim());
      }
    }
  };

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 15);
  };

  const handleUserClick = (walletAddress: string) => {
    router.push(`/profile/${walletAddress}`);
    setShowResults(false);
    setQuery("");
  };

  const displayedResults = results.slice(0, displayCount);
  const hasMore = results.length > displayCount;

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par username, adresse wallet ou SUINS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
          className="pl-10 h-12 text-base"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </form>

      {/* Résultats de recherche */}
      {showResults && displayedResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          <div className="p-2">
            {displayedResults.map((user) => (
              <button
                key={user.walletAddress}
                onClick={() => handleUserClick(user.walletAddress)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.username}</p>
                    {user.suinsName && (
                      <p className="text-xs text-blue-500 truncate">🏷️ {user.suinsName}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate font-mono">
                      {user.walletAddress}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Bouton Find more */}
          {hasMore && (
            <div className="border-t border-gray-200 p-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleLoadMore}
              >
                Find more ({results.length - displayCount} more results)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Message si aucun résultat */}
      {showResults && query.trim() && displayedResults.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-muted-foreground text-center">
            Aucun résultat trouvé
          </p>
        </div>
      )}
    </div>
  );
}
