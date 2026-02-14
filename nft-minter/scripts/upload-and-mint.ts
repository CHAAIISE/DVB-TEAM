import { uploadToWalrus } from './walrus.js';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import fs from 'fs';
import path from 'path';

/**
 * Script tout-en-un: Upload images sur Walrus → Mint NFTs
 * 
 * Usage: pnpm mint:all
 * 
 * Prérequis:
 * 1. Avoir déployé le smart contract
 * 2. Avoir des images dans nft-minter/images/
 * 3. Avoir configuré .env avec PACKAGE_ID et PRIVATE_KEY
 */

const SUI_NETWORK = 'testnet';
const suiClient = new SuiClient({ url: `https://fullnode.${SUI_NETWORK}.sui.io:443` });

function loadEnv() {
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

  if (!packageId || !privateKey) {
    console.error('❌ Configure .env avec PACKAGE_ID et PRIVATE_KEY');
    process.exit(1);
  }

  const { secretKey } = decodeSuiPrivateKey(privateKey);
  const keypair = Ed25519Keypair.fromSecretKey(secretKey);

  return { packageId, keypair };
}

async function main() {
  const { packageId, keypair } = loadEnv();
  const sender = keypair.toSuiAddress();
  const imagesDir = path.join(import.meta.dirname, '..', 'images');

  if (!fs.existsSync(imagesDir)) {
    console.error(`❌ Dossier images/ introuvable. Crée-le et ajoute tes images.`);
    process.exit(1);
  }

  const files = fs.readdirSync(imagesDir)
    .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error('❌ Aucune image dans images/');
    process.exit(1);
  }

  console.log(`\n🚀 Upload & Mint — ${files.length} NFTs`);
  console.log(`📦 Package: ${packageId}`);
  console.log(`👤 Wallet: ${sender}\n`);

  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const nameWithoutExt = path.parse(file).name
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    console.log(`\n[${i + 1}/${files.length}] ${file}`);

    try {
      // 1. Upload sur Walrus
      const walrusResult = await uploadToWalrus(path.join(imagesDir, file));

      // 2. Mint le NFT
      console.log(`  🎨 Minting "${nameWithoutExt}"...`);
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::demo_nft::mint`,
        arguments: [
          tx.pure.string(nameWithoutExt),
          tx.pure.string(`Digital artwork from DVB Team collection`),
          tx.pure.string(walrusResult.url),
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
        console.log(`  ✅ Done! NFT: ${createdNft.objectId}`);
      }
      console.log(`     TX: https://suiscan.xyz/${SUI_NETWORK}/tx/${result.digest}`);

      successCount++;
    } catch (error) {
      console.error(`  ❌ Erreur:`, error instanceof Error ? error.message : error);
    }

    // Délai entre les mints
    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n🎉 ${successCount}/${files.length} NFTs créés avec succès!\n`);
}

main().catch(console.error);
