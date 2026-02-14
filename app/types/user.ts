export interface User {
  walletAddress: string; // PK - adresse wallet
  username: string; // Par défaut = walletAddress, modifiable
  displayName?: string;
  bio?: string;
  avatar?: string;
  suinsName?: string; // Nom SUINS associé (ex: alice.sui)
  subscriptionPrice?: number; // Prix abonnement en SUI (optionnel)
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  currentListingsCount: number;
  formerListingsCount: number;
  favoritesCount: number;
  isFollowing?: boolean; // Pour profils externes
  isSubscribed?: boolean; // Si l'utilisateur courant est abonné
}

export interface UserStats {
  currentListings: number;
  formerListings: number;
  followers: number;
}
