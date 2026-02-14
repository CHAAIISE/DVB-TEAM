import { NFT } from './nft';
import { User } from './user';

export type ListingStatus = 'active' | 'sold' | 'cancelled';

export interface Listing {
  id: string;
  nft: NFT;
  sellerId: string; // Wallet address
  seller: User;
  price: number; // Prix en SUI
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  soldAt?: Date;
  soldTo?: string; // Wallet address
}

export interface FeedPost extends Listing {
  isFavorited: boolean;
}
