"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface ProfileResult {
  id: string;
  owner_address: string;
  display_name: string | null;
  suins_name: string | null;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const searchProfiles = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const trimmed = q.trim();
    setIsSearching(true);
    try {
      // 1) Search Supabase profiles
      const res = await fetch(`/api/profiles?search=${encodeURIComponent(trimmed)}&limit=10`);
      const data = await res.json();
      let profiles: ProfileResult[] = res.ok && data.profiles ? data.profiles : [];

      // 2) If no Supabase results and looks like a .sui name, try SuiNS resolution
      if (profiles.length === 0 && !trimmed.startsWith("0x") && /^[a-zA-Z0-9.-]+$/.test(trimmed)) {
        try {
          const suinsRes = await fetch(`/api/suins?query=${encodeURIComponent(trimmed)}`);
          const suinsData = await suinsRes.json();
          if (suinsRes.ok && suinsData.found && suinsData.address) {
            profiles = [{
              id: suinsData.address,
              owner_address: suinsData.address,
              display_name: null,
              suins_name: suinsData.name || trimmed,
            }];
          }
        } catch { /* ignore */ }
      }

      // 3) If still nothing and looks like a wallet address, show direct link
      if (profiles.length === 0 && trimmed.startsWith("0x") && trimmed.length >= 6) {
        profiles = [{
          id: trimmed,
          owner_address: trimmed,
          display_name: null,
          suins_name: null,
        }];
      }

      setResults(profiles);
      setShowResults(true);
    } catch {
      // Fallback for raw address
      if (trimmed.startsWith("0x") && trimmed.length >= 6) {
        setResults([{ id: trimmed, owner_address: trimmed, display_name: null, suins_name: null }]);
        setShowResults(true);
      } else {
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchProfiles(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchProfiles]);

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
    if (results.length === 1) {
      handleResultClick(results[0].owner_address);
    } else if (query.trim().startsWith("0x") && query.trim().length >= 6) {
      handleResultClick(query.trim());
    }
  };

  const handleResultClick = (address: string) => {
    router.push(`/profile/${address}`);
    setShowResults(false);
    setQuery("");
  };

  const getDisplayLabel = (profile: ProfileResult) => {
    return profile.display_name || profile.suins_name || null;
  };

  const getInitials = (profile: ProfileResult) => {
    const label = getDisplayLabel(profile);
    if (label) return label.slice(0, 2).toUpperCase();
    return profile.owner_address.slice(2, 4).toUpperCase();
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        {isSearching ? (
          <Loader2
            className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin"
            style={{ left: 'min(0.75rem, 2vw)', width: 'min(1.25rem, 3vw)', height: 'min(1.25rem, 3vw)' }}
          />
        ) : (
          <Search
            className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground"
            style={{ left: 'min(0.75rem, 2vw)', width: 'min(1.25rem, 3vw)', height: 'min(1.25rem, 3vw)' }}
          />
        )}
        <Input
          type="text"
          placeholder="Search by address, name or .sui..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && results.length > 0 && setShowResults(true)}
          style={{
            paddingLeft: 'min(2.5rem, 6vw)',
            height: 'min(3rem, 6vh)',
            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)'
          }}
        />
      </form>

      {/* Résultats de recherche */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg max-h-[60vh] sm:max-h-96 overflow-y-auto z-50">
          <div className="p-1 sm:p-2">
            {results.map((profile) => (
              <button
                key={profile.owner_address}
                onClick={() => handleResultClick(profile.owner_address)}
                className="w-full text-left px-2 sm:px-3 py-2 hover:bg-muted rounded-md transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 bg-muted text-foreground flex items-center justify-center text-[10px] sm:text-xs font-semibold">
                    {getInitials(profile)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {getDisplayLabel(profile) && (
                      <p className="font-medium text-xs sm:text-sm truncate text-foreground">
                        {getDisplayLabel(profile)}
                      </p>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-mono">
                      {profile.owner_address}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucun résultat */}
      {showResults && query.trim() && !isSearching && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg p-4 z-50">
          <p className="text-sm text-muted-foreground text-center">
            No profile found
          </p>
        </div>
      )}
    </div>
  );
}
