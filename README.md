# ART-X

A decentralized NFT marketplace built on Sui blockchain with SUINS integration,
real-time indexing, and Walrus storage.

## Pitch

ART-X is a Web3 marketplace platform where users create on-chain profiles,
discover NFTs through intelligent search powered by SUINS name service, and
interact with decentralized assets. The platform indexes blockchain events in
real-time, resolves human-readable addresses via SUINS, and stores NFT images on
Walrus for permanent decentralized hosting.

## Features

- On-chain user profiles with bio, avatar, banner
- SUINS name service integration (resolve .sui domains)
- Full-text search: display name, bio, SUINS, wallet address
- NFT marketplace with grid browsing and favorites
- Real-time event indexer (ProfileCreated, ProfileUpdated)
- Decentralized image storage via Walrus
- PostgreSQL database synchronization
- Checkpoint-based event cursor tracking
- Debounced search with SUINS badge indicators

## Tech Stack

**Frontend**

- Next.js 15.5.3, React 19.1.1, TypeScript 5.9.2
- Tailwind CSS 4.1.13, ShadCN UI
- @mysten/dapp-kit 0.18.0, @mysten/sui 1.38.0, @mysten/suins 1.0.2

**Backend**

- Supabase (PostgreSQL)
- Custom indexer service
- SUINS resolution API

**Storage**

- Walrus (decentralized image hosting)

## Smart Contracts

**Main Package**:
`0xf7b383e94a2d912e61f25222074798e323f751882ef34b2c3117c72a65e524b9`

**NFT Minter (Demo)**:
`0x994d44db3c7048d14fc3a1533c41a8990ff2968caf168a569c2de36582b6f780`

## Demo NFTs

**NFT #1**

- Object ID:
  `0x355e492a27b606848d3836d22020a001c45541633bc08025d70ba24d4595782d`
- Owner: `0xa7ace00cb22b21619fa9cab2453ecbf8917bf44b44107481a08c8383ef4b4cdf`
- [View on SuiScan](https://suiscan.xyz/testnet/tx/scNtJHEjvBTDcMW5THVM8QBopnPiEN18nLZfz9epPGa)

**NFT #2**

- Object ID:
  `0xaab9a52c1d4674a8fdee7d3d4c50ad17fff5775aa25de502f38cbc2d5caeae39`
- Owner: `0xc79252f09b8da52266660ed3da1635a2780bdaf45fa5b1c4a825d1b0ab465f47`
- [View on SuiScan](https://suiscan.xyz/testnet/tx/E9ESsrn5juhC2LPdagTaCbAZbZC27CLUndnr4WVQ8AKs)

## Quick Start

```bash
# Install
pnpm install

# Configure
cp .env.local.example .env.local
# Edit .env.local with Supabase credentials

# Database setup
psql -h <supabase-host> -U postgres -d postgres -f supabase/schema.sql

# Run
pnpm dev

# Build
pnpm build
```

## Project Structure

```
app/
├── (auth)/landing/          # Landing page
├── (marketplace)/           # Marketplace routes
│   ├── home/               # NFT browsing
│   ├── listing/[id]/       # NFT detail
│   ├── post/new/           # Create listing
│   └── profile/            # User profiles
├── api/
│   ├── indexer/           # Event indexer
│   ├── profiles/          # Profile CRUD
│   ├── suins/             # SUINS resolution
│   ├── listings/          # NFT listings
│   └── subscriptions/     # Subscriptions
├── components/            # React components
├── lib/
│   ├── supabase.ts       # Database client
│   └── suins.ts          # SUINS utilities
└── types/                 # TypeScript types

move/                      # Smart contracts
nft-minter/               # NFT minting tool
supabase/                 # Database schema
```
