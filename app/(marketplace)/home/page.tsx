"use client";

import { useRouter } from "next/navigation";
import { Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchBar } from "@/components/search/SearchBar";
import { NFTGrid } from "@/components/nft/NFTGrid";
import { useUser } from "@/contexts/UserContext";
import { mockListings } from "@/mock";

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useUser();

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // TODO: Implement search functionality
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar sticky */}
      <div className="sticky top-0 z-50 bg-black border-b border-gray-800">
        <div className="container flex items-center justify-between py-4 gap-4 px-16">
          {/* Gauche: Icône + pour poster */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
            onClick={() => router.push("/post/new")}
            title="Créer une annonce"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </Button>

          {/* Centre: Titre et SearchBar */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <h1 className="text-white text-3xl font-semibold">Counter App</h1>
            <div className="w-full max-w-2xl">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>

          {/* Droite: Avatar profil */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-gray-700 hover:bg-gray-600 p-0"
            onClick={() => router.push("/profile/me")}
            title="Mon profil"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback className="bg-gray-600 text-white">
                {currentUser?.username?.slice(0, 2).toUpperCase() || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>

      {/* Feed */}
      <main className="container py-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold">Last listings</h2>
        </div>

        <NFTGrid listings={mockListings} />
      </main>
    </div>
  );
}
