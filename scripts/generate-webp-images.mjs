/**
 * Generate optimized WebP versions of gallery images for better performance.
 * Creates multiple sizes for responsive images with proper dimensions.
 * Run: node scripts/generate-webp-images.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const IMAGES_DIR = "public/images";
const SITE_IMAGES_DIR = "public/images/site";

// Generate multiple sizes for responsive images
const SIZES = [
  { width: 320, suffix: "-320w" },   // Mobile, gallery thumbnails
  { width: 640, suffix: "-640w" },   // Mobile retina, small screens
  { width: 960, suffix: "-960w" },   // Tablets
  { width: 1280, suffix: "-1280w" }, // Desktop
  { width: 1600, suffix: "-1600w" }, // Large desktop, lightbox
];

const QUALITY = 85;

async function generateWebP(sourceFile) {
  const ext = path.extname(sourceFile);
  const baseName = path.basename(sourceFile, ext);
  const dir = path.dirname(sourceFile);
  
  const image = sharp(sourceFile);
  const metadata = await image.metadata();
  
  console.log(`Processing ${path.basename(sourceFile)} (${metadata.width}x${metadata.height})...`);
  
  let generated = 0;
  for (const size of SIZES) {
    // Only generate if source is larger than target size
    if (metadata.width < size.width) continue;
    
    const outputPath = path.join(dir, `${baseName}${size.suffix}.webp`);
    
    await sharp(sourceFile)
      .resize(size.width, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toFile(outputPath);
    
    generated++;
  }
  
  // Also create a full-size WebP version
  const fullSizePath = path.join(dir, `${baseName}.webp`);
  await sharp(sourceFile)
    .webp({ quality: QUALITY })
    .toFile(fullSizePath);
  
  console.log(`  ✓ Generated ${generated + 1} WebP versions`);
}

async function processDirectory(dir) {
  try {
    const files = await fs.readdir(dir);
    const imageFiles = files.filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.includes("-320w") && !f.includes("-640w"));
    
    console.log(`\nProcessing ${dir}:`);
    console.log(`Found ${imageFiles.length} images to convert\n`);
    
    for (const file of imageFiles) {
      const filePath = path.join(dir, file);
      try {
        await generateWebP(filePath);
      } catch (err) {
        console.error(`  ✗ Error processing ${file}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message);
  }
}

console.log("Generating responsive WebP images for gallery...\n");
await processDirectory(IMAGES_DIR);
await processDirectory(SITE_IMAGES_DIR);
console.log("\n✓ Done! WebP images generated.");
