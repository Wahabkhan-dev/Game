import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The new Level 9 finale video — reused in two spots (see L9_BowRunScene.js's
// "reached home after the Bow Run" and L9_BowTieScene.js's "all puppies
// dressed" ending), so it's uploaded once under one public_id.
const files = [
  { src: 'Level 9/Part 02.mp4', publicId: 'shadow-gamma/video/Level 9/part-02' },
];

const videoRoot = path.join(__dirname, '..', 'public', 'assets', 'video');

async function main() {
  const results = {};
  for (const { src, publicId } of files) {
    const filePath = path.join(videoRoot, src);
    process.stdout.write(`Uploading ${src} ... `);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        public_id: publicId,
        overwrite: true,
      });
      results[src] = result.secure_url;
      console.log('done ->', result.secure_url);
    } catch (err) {
      console.log('FAILED');
      console.error(`  ${err.message}`);
      process.exitCode = 1;
    }
  }
  console.log('\n=== MANIFEST ===');
  console.log(JSON.stringify(results, null, 2));
}

main();
