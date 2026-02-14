import fs from 'fs';
import path from 'path';

// Walrus public testnet endpoints
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

const STORAGE_EPOCHS = 5; // Nombre d'epochs de stockage (plus = plus longtemps disponible)

export interface WalrusUploadResult {
  blobId: string;
  url: string;
  suiObjectId?: string;
}

/**
 * Upload un fichier sur Walrus via le publisher public testnet
 * Retourne le blobId et l'URL d'accès
 */
export async function uploadToWalrus(filePath: string): Promise<WalrusUploadResult> {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  console.log(`  📤 Uploading ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)...`);

  const response = await fetch(`${PUBLISHER}/v1/blobs?epochs=${STORAGE_EPOCHS}`, {
    method: 'PUT',
    body: fileBuffer,
  });

  if (!response.ok) {
    throw new Error(`Walrus upload failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as any;

  // Walrus retourne soit newlyCreated soit alreadyCertified
  let blobId: string;
  let suiObjectId: string | undefined;

  if (result.newlyCreated) {
    blobId = result.newlyCreated.blobObject.blobId;
    suiObjectId = result.newlyCreated.blobObject.id;
    console.log(`  ✅ Uploaded: ${blobId} (new)`);
  } else if (result.alreadyCertified) {
    blobId = result.alreadyCertified.blobId;
    console.log(`  ✅ Already exists: ${blobId}`);
  } else {
    throw new Error(`Unexpected Walrus response: ${JSON.stringify(result)}`);
  }

  const url = `${AGGREGATOR}/v1/blobs/${blobId}`;

  return { blobId, url, suiObjectId };
}

/**
 * Upload tous les fichiers d'un dossier sur Walrus
 */
export async function uploadDirectoryToWalrus(dirPath: string): Promise<Map<string, WalrusUploadResult>> {
  const results = new Map<string, WalrusUploadResult>();
  const files = fs.readdirSync(dirPath)
    .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error(`No image files found in ${dirPath}`);
  }

  console.log(`\n🖼️  Found ${files.length} images in ${dirPath}\n`);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    try {
      const result = await uploadToWalrus(fullPath);
      results.set(file, result);
    } catch (error) {
      console.error(`  ❌ Failed to upload ${file}:`, error);
    }
  }

  return results;
}

/**
 * Construit l'URL Walrus à partir d'un blobId
 */
export function getWalrusUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}
