import { uploadToWalrus } from './walrus.js';
import fs from 'fs';
import path from 'path';

/**
 * Script standalone pour uploader des images sur Walrus
 * Usage: pnpm upload
 * 
 * Place tes images dans nft-minter/images/ avant de lancer
 */

const IMAGES_DIR = path.join(import.meta.dirname, '..', 'images');

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log(`\n📁 Dossier images/ créé. Place tes images dedans puis relance.`);
    console.log(`   Formats supportés: .png, .jpg, .jpeg, .gif, .webp, .svg\n`);
    process.exit(0);
  }

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.log(`\n❌ Aucune image trouvée dans ${IMAGES_DIR}`);
    console.log(`   Formats supportés: .png, .jpg, .jpeg, .gif, .webp, .svg\n`);
    process.exit(1);
  }

  console.log(`\n🐋 Walrus Upload — ${files.length} images\n`);

  const results: { file: string; blobId: string; url: string }[] = [];

  for (const file of files) {
    try {
      const result = await uploadToWalrus(path.join(IMAGES_DIR, file));
      results.push({ file, blobId: result.blobId, url: result.url });
    } catch (error) {
      console.error(`  ❌ ${file}: ${error}`);
    }
  }

  // Sauvegarde les résultats
  const outputPath = path.join(import.meta.dirname, '..', 'walrus-uploads.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n✅ ${results.length}/${files.length} images uploadées`);
  console.log(`📄 Résultats sauvegardés dans walrus-uploads.json\n`);

  // Affiche un résumé
  for (const r of results) {
    console.log(`  ${r.file} → ${r.url}`);
  }
  console.log('');
}

main().catch(console.error);
