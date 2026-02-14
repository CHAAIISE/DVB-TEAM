import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import fs from 'fs';
import path from 'path';

/**
 * Script pour mint des NFTs à partir des images uploadées sur Walrus
 * 
 * Usage: pnpm mint
 * 
 * Prérequis:
 * 1. Avoir déployé le smart contract (sui client publish)
 * 2. Avoir uploadé les images (pnpm upload)  
 * 3. Avoir configuré .env avec PACKAGE_ID et PRIVATE_KEY
 */

// === Config ===
const SUI_NETWORK = 'testnet';
const suiClient = new SuiClient({ url: `https://fullnode.${SUI_NETWORK}.sui.io:443` });

// NFTs à mint (sera lu depuis nfts.json ou walrus-uploads.json)
interface NFTConfig {
  name: string;
  description: string;
  image_url: string;
}

function loadConfig(): { packageId: string; keypair: Ed25519Keypair } {
  // Cherche dans .env ou variables d'environnement
  const envPath = path.join(import.meta.dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  }

  const packageId = process.env.PACKAGE_ID;
  const privateKey = process.env.PRIVATE_KEY;

  if (!packageId) {
    console.error('❌ PACKAGE_ID manquant dans .env');
    console.error('   Déploie le contrat avec: cd move && sui client publish --gas-budget 100000000');
    process.exit(1);
  }

  if (!privateKey) {
    console.error('❌ PRIVATE_KEY manquant dans .env');
    console.error('   Récupère ta clé privée avec: sui keytool export --key-identity 0xTON_ADRESSE');
    process.exit(1);
  }

  // Decode la private key (format suiprivkey1...)
  const { secretKey } = decodeSuiPrivateKey(privateKey);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);

  return { packageId, keypair };
}

function loadNFTs(): NFTConfig[] {
  const nftsPath = path.join(import.meta.dirname, '..', 'nfts.json');
  const walrusPath = path.join(import.meta.dirname, '..', 'walrus-uploads.json');

  // Option 1: nfts.json configuré manuellement
  if (fs.existsSync(nftsPath)) {
    console.log('📋 Chargement depuis nfts.json');
    return JSON.parse(fs.readFileSync(nftsPath, 'utf-8'));
  }

  // Option 2: Auto-générer depuis walrus-uploads.json
  if (fs.existsSync(walrusPath)) {
    console.log('📋 Génération depuis walrus-uploads.json');
    const uploads = JSON.parse(fs.readFileSync(walrusPath, 'utf-8')) as { file: string; url: string }[];
    return uploads.map((u, i) => ({
      name: `DVB NFT #${i + 1}`,
      description: `Digital artwork from DVB Team collection — ${u.file}`,
      image_url: u.url,
    }));
  }

  console.error('❌ Aucun fichier nfts.json ou walrus-uploads.json trouvé');
  console.error('   Lance d\'abord: pnpm upload');
  process.exit(1);
}

async function main() {
  const { packageId, keypair } = loadConfig();
  const sender = keypair.toSuiAddress();
  const nfts = loadNFTs();

  console.log(`\n🎨 NFT Minter — ${nfts.length} NFTs à mint`);
  console.log(`📦 Package: ${packageId}`);
  console.log(`👤 Wallet: ${sender}\n`);

  let successCount = 0;

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];
    console.log(`  [${i + 1}/${nfts.length}] Minting "${nft.name}"...`);

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::demo_nft::mint`,
        arguments: [
          tx.pure.string(nft.name),
          tx.pure.string(nft.description),
          tx.pure.string(nft.image_url),
        ],
      });

      const result = await suiClient.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
      });

      const createdNft = result.objectChanges?.find(
        (c) => c.type === 'created' && c.objectType.includes('DemoNFT')
      );

      if (createdNft && 'objectId' in createdNft) {
        console.log(`  ✅ Minted! Object ID: ${createdNft.objectId}`);
        console.log(`     TX: https://suiscan.xyz/${SUI_NETWORK}/tx/${result.digest}`);
      } else {
        console.log(`  ✅ TX: ${result.digest}`);
      }

      successCount++;
    } catch (error) {
      console.error(`  ❌ Erreur:`, error instanceof Error ? error.message : error);
    }

    // Petit délai entre les mints pour éviter les conflits d'objets
    if (i < nfts.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n🎉 ${successCount}/${nfts.length} NFTs mintés avec succès!\n`);
}

main().catch(console.error);
