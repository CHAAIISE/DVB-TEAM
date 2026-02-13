import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types pour TypeScript
export interface UserProfile {
  id: string;
  owner_address: string;
  display_name?: string;
  bio?: string;
  subscription_price?: number;
  subscriber_count: number;
  subscription_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  subscriber_id: string;
  creator_id: string;
  amount_paid: number;
  timestamp: string;
  tx_digest: string;
}

export interface NftListing {
  id: string;
  seller_id: string;
  nft_type: string;
  price: number;
  favorite_count: number;
  is_active: boolean;
  created_at: string;
}

export interface NftPurchase {
  id: number;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  timestamp: string;
  tx_digest: string;
}

export interface Favorite {
  user_id: string;
  listing_id: string;
  created_at: string;
}
