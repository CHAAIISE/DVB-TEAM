export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

export interface NFT {
  id: string;
  objectId: string; // Sui object ID
  name: string;
  description: string;
  imageUrl: string;
  collection?: string;
  attributes?: NFTAttribute[];
  owner: string; // Wallet address
  createdAt: Date;
}
