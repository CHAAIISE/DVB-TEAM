# 🎨 NFT Minter — Mint de NFTs de démo avec Walrus

Outil séparé pour créer des NFTs de démonstration pour la marketplace DVB
Team.  
Les images sont stockées sur **Walrus** (stockage décentralisé SUI).

## Architecture

```
images/ (tes fichiers .png/.jpg)
    │
    ▼  pnpm upload
Walrus (stockage décentralisé)
    │
    ▼  pnpm mint
Smart Contract (demo_nft::mint)
    │
    ▼
NFTs dans ton wallet SUI 🎉
```

## 🚀 Setup rapide

### 1. Installer les dépendances

```bash
cd nft-minter
pnpm install
```

### 2. Déployer le smart contract

```bash
cd move
sui client publish --gas-budget 100000000
```

Note le **Package ID** affiché dans le résultat (format `0x...`).

### 3. Configurer l'environnement

```bash
cp .env.example .env
```

Remplis le `.env` :

```env
PACKAGE_ID=0x...LE_PACKAGE_ID_DU_STEP_2
PRIVATE_KEY=suiprivkey1...TA_CLE_PRIVEE
```

> 💡 Pour récupérer ta clé privée :
>
> ```bash
> sui keytool export --key-identity 0xTON_ADRESSE
> ```

### 4. Préparer les images

Place tes images dans le dossier `images/` :

```bash
mkdir images
# Copie tes images dedans (.png, .jpg, .jpeg, .gif, .webp, .svg)
```

## 📋 Commandes

### Option A — Tout en un (recommandé)

```bash
pnpm mint:all
```

Upload les images sur Walrus + mint les NFTs automatiquement.

### Option B — Étape par étape

```bash
# 1. Upload les images sur Walrus
pnpm upload

# 2. Mint les NFTs (utilise walrus-uploads.json)
pnpm mint
```

### Option C — NFTs personnalisés

1. Copie `nfts.example.json` vers `nfts.json`
2. Modifie les noms, descriptions, et URLs
3. Lance `pnpm mint`

## 📂 Structure

```
nft-minter/
├── move/                    # Smart contract Move
│   ├── Move.toml
│   └── sources/
│       └── demo_nft.move    # Contrat NFT avec Display
├── scripts/
│   ├── walrus.ts            # Utilitaire upload Walrus
│   ├── upload-walrus.ts     # Script d'upload seul
│   ├── mint-nfts.ts         # Script de mint seul
│   └── upload-and-mint.ts   # Script tout-en-un
├── images/                  # Tes images (gitignored)
├── .env                     # Config (gitignored)
├── .env.example
├── nfts.example.json        # Exemple de config NFT
├── package.json
└── README.md
```

## 🔍 Vérification

Après le mint, tu peux voir tes NFTs :

- **Suiscan** : `https://suiscan.xyz/testnet/account/0xTON_ADRESSE`
- **Sui Explorer** :
  `https://explorer.sui.io/address/0xTON_ADRESSE?network=testnet`
- **Dans ton wallet** (Slush/Phantom) : les NFTs apparaîtront avec les images

## 💡 Notes

- **Walrus est gratuit sur testnet** — les images restent disponibles pendant ~5
  epochs
- **Le smart contract utilise `Display`** — les wallets et explorers affichent
  automatiquement les images
- **Gas nécessaire** — assure-toi d'avoir du SUI testnet (`sui client faucet`)
- **Le dossier `move/` du projet principal n'est PAS touché**
