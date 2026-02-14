"use client";

import { useRouter, usePathname } from "next/navigation";
import { Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SearchBar } from "@/components/search/SearchBar";
import { useUser } from "@/contexts/UserContext";
import { ConnectButton } from "@mysten/dapp-kit";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useUser();

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // TODO: Implement search functionality
  };

  // Ne pas afficher la navbar sur la landing page
  if (pathname === "/landing" || pathname === "/") {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 backdrop-blur-md bg-black/20">
      <div className="grid grid-cols-3 items-center py-2 px-4 sm:py-[1vh] sm:px-[2vw] gap-2 sm:gap-[2vw]">
        {/* Gauche: Icône + et Wallet */}
        <div className="flex items-center gap-2 sm:gap-[1vw] shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-700 hover:bg-gray-600 text-white h-10 w-10 sm:h-auto sm:w-auto"
            style={{ width: 'min(2.5rem, 5vw)', height: 'min(2.5rem, 5vw)' }}
            onClick={() => router.push("/post/new")}
            title="Créer une annonce"
          >
            <Plus className="w-[60%] h-[60%]" strokeWidth={2.5} />
          </Button>

          <div className="text-xs sm:text-sm" style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.875rem)' }}>
            <ConnectButton />
          </div>
        </div>

        {/* Centre: Home button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-700 hover:bg-gray-600 text-white h-10 w-10 sm:h-auto sm:w-auto"
            style={{ width: 'min(2.5rem, 5vw)', height: 'min(2.5rem, 5vw)' }}
            onClick={() => router.push("/home")}
            title="Retour à l'accueil"
          >
            <Home className="w-[60%] h-[60%]" strokeWidth={2.5} />
          </Button>
        </div>

        {/* Droite: Avatar */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full bg-black hover:bg-black/80 p-0 h-10 w-10 sm:h-auto sm:w-auto"
            style={{ width: 'min(2.5rem, 5vw)', height: 'min(2.5rem, 5vw)' }}
            onClick={() => router.push("/profile/me")}
            title="Mon profil"
          >
            <Avatar className="h-10 w-10 sm:h-full sm:w-full">
              <AvatarFallback className="bg-black text-white text-xs sm:text-base">
                {currentUser?.username?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </div>
  );
}
