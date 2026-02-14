"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mockUsers } from "@/mock";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<typeof mockUsers>([]);
  const [displayCount, setDisplayCount] = useState(5); // 5 au départ, 15 après Enter
  const [isFullSearch, setIsFullSearch] = useState(false); // true après avoir appuyé sur Enter
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Recherche en temps réel (5 résultats)
  useEffect(() => {
    if (query.trim()) {
      const filtered = mockUsers
        .filter(
          (user) =>
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.walletAddress.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => a.username.localeCompare(b.username));

      setResults(filtered);
      setShowResults(true);

      // Si pas en mode recherche complète, montrer seulement 5 résultats
      if (!isFullSearch) {
        setDisplayCount(5);
      }
    } else {
      setShowResults(false);
      setResults([]);
      setIsFullSearch(false);
      setDisplayCount(5);
    }
  }, [query, isFullSearch]);

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
        <Search
          className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground"
          style={{ left: 'min(0.75rem, 2vw)', width: 'min(1.25rem, 3vw)', height: 'min(1.25rem, 3vw)' }}
        />
        <Input
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setShowResults(true)}
          style={{
            paddingLeft: 'min(2.5rem, 6vw)',
            height: 'min(3rem, 6vh)',
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
          }}
        />
      </form>

      {/* Résultats de recherche */}
      {showResults && displayedResults.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-[60vh] sm:max-h-96 overflow-y-auto z-50">
          <div className="p-1 sm:p-2">
            {displayedResults.map((user) => (
              <button
                key={user.walletAddress}
                onClick={() => handleUserClick(user.walletAddress)}
                className="w-full text-left px-2 sm:px-3 py-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 bg-gray-200 text-gray-700 flex items-center justify-center text-[10px] sm:text-xs font-semibold">
                    {user.username.slice(0, 2).toUpperCase() || "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm truncate">{user.username}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate font-mono">
                      {user.walletAddress}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Bouton Find more */}
          {hasMore && (
            <div className="border-t border-gray-200 p-1 sm:p-2">
              <Button
                variant="ghost"
                className="w-full text-xs sm:text-sm h-8 sm:h-10"
                onClick={handleLoadMore}
              >
                Find more ({results.length - displayCount})
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
