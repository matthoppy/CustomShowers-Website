/**
 * Shrinks the photos under public/images to web size, in place: at most
 * 1600px on the longest side (2000px for the hero), JPEG at quality 80,
 * rotated the right way up and stripped of camera metadata. A file is only
 * rewritten when the result is smaller. Run it after dropping new photos
 * into the folder by hand; the dashboard's Photos page shrinks its own.
 *
 *   npm run images
 */

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const FOLDERS = ["public/images", "public/images/site"];
const MAX_EDGE = 1600;
const HERO_EDGE = 2000;
const QUALITY = 80;

const mb = (n) => `${(n / 1048576).toFixed(2)} MB`;

async function shrink(file) {
  const before = (await fs.stat(file)).size;
  const name = path.basename(file);
  const edge = /^hero/i.test(name) ? HERO_EDGE : MAX_EDGE;
  const image = sharp(file).rotate();
  const meta = await image.metadata();
  const longest = Math.max(meta.width || 0, meta.height || 0);
  const out = await image
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();
  const isPng = /\.png$/i.test(name);
  const target = isPng ? file.replace(/\.png$/i, ".jpg") : file;
  if (!isPng && out.length >= before) return `  kept   ${name} (${mb(before)}, ${longest}px)`;
  await fs.writeFile(target, out);
  if (isPng) await fs.unlink(file);
  return `  ${mb(before).padStart(8)} → ${mb(out.length).padStart(8)}  ${name}${isPng ? ` → ${path.basename(target)}` : ""} (${longest}px → ${Math.min(longest, edge)}px)`;
}

for (const folder of FOLDERS) {
  const files = (await fs.readdir(folder)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  console.log(`${folder}:`);
  for (const f of files) console.log(await shrink(path.join(folder, f)));
}
