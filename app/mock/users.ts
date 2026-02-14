import { User } from '../types';

export const mockUsers: User[] = [
  {
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    username: "CryptoArtist",
    bio: "Digital artist creating unique NFT collections. Focused on abstract art and generative designs.",
    avatar: "https://i.pravatar.cc/150?img=1",
    subscriptionPrice: 5,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    username: "NFTCollector",
    bio: "Passionate NFT collector and trader. Always looking for the next gem.",
    avatar: "https://i.pravatar.cc/150?img=2",
    subscriptionPrice: 10,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    walletAddress: "0x9876543210fedcba9876543210fedcba98765432",
    username: "PixelMaster",
    bio: "Pixel art enthusiast. Creating retro-inspired NFTs.",
    avatar: "https://i.pravatar.cc/150?img=3",
    subscriptionPrice: 3,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    walletAddress: "0x1111222233334444555566667777888899990000",
    username: "Web3Builder",
    bio: "Building the future of Web3. NFT creator and blockchain developer.",
    avatar: "https://i.pravatar.cc/150?img=4",
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    walletAddress: "0xaaaaaaaaaaaabbbbbbbbbbbbccccccccccccdddd",
    username: "ArtDealer",
    bio: "Professional art dealer transitioning to NFTs. Curating the best digital art.",
    avatar: "https://i.pravatar.cc/150?img=5",
    subscriptionPrice: 15,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
];
