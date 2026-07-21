import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { readdirSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videoRoot = path.join(__dirname, '..', 'public', 'assets', 'video');
const manifestPath = path.join(__dirname, '..', 'cloudinary-manifest.json');

function findMp4Files(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      results.push(...findMp4Files(fullPath));
    } else if (entry.toLowerCase().endsWith('.mp4')) {
      results.push(fullPath);
    }
  }
  return results;
}

function toPublicId(fullPath) {
  const relative = path.relative(videoRoot, fullPath);
  const withoutExt = relative.slice(0, -path.extname(relative).length);
  return 'shadow-gamma/video/' + withoutExt.split(path.sep).join('/');
}

async function main() {
  const files = findMp4Files(videoRoot);
  console.log(`Found ${files.length} mp4 file(s) under ${videoRoot}`);

  const manifest = {};
  let failures = 0;

  for (const [index, file] of files.entries()) {
    const publicId = toPublicId(file);
    const relative = path.relative(videoRoot, file);
    process.stdout.write(`[${index + 1}/${files.length}] Uploading ${relative} ... `);
    try {
      const result = await cloudinary.uploader.upload(file, {
        resource_type: 'video',
        public_id: publicId,
        overwrite: true,
      });
      manifest[relative.split(path.sep).join('/')] = result.secure_url;
      console.log('done');
    } catch (err) {
      failures++;
      console.log('FAILED');
      console.error(`  ${err.message}`);
    }
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${manifestPath}`);
  console.log(`${files.length - failures}/${files.length} uploaded successfully.`);
  if (failures > 0) process.exitCode = 1;
}

main();
