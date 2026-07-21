import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, '..', 'cloudinary-manifest.json');
const bootScenePath = path.join(__dirname, '..', 'src', 'scenes', 'BootScene.js');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
let source = readFileSync(bootScenePath, 'utf8');

let replaced = 0;
const unused = [];

for (const [relativePath, url] of Object.entries(manifest)) {
  const target = `assets/video/${relativePath}`;
  if (source.includes(target)) {
    source = source.split(target).join(url);
    replaced++;
  } else {
    unused.push(relativePath);
  }
}

writeFileSync(bootScenePath, source);

console.log(`Replaced ${replaced}/${Object.keys(manifest).length} video path(s) in ${path.relative(process.cwd(), bootScenePath)}`);
if (unused.length) {
  console.log('Not referenced in BootScene.js (left untouched, still uploaded to Cloudinary):');
  for (const u of unused) console.log(`  - ${u}`);
}
