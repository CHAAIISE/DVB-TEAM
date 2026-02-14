import { User } from './user';

export type AuthMethod = 'wallet' | 'google' | 'apple' | 'facebook';

export interface AuthState {
  isAuthenticated: boolean;
  authMethod?: AuthMethod;
  walletAddress?: string;
  user?: User;
  isLoading: boolean;
}

export interface WalletConnection {
  address: string;
  chain: string;
  publicKey: string;
}
