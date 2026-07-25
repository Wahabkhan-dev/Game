import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source folders are named "Level 9" / "Level 10" but the videos inside them
// (by filename) belong to Level 8 and Level 9 respectively — organize the
// Cloudinary public_ids by destination level for clarity.
const files = [
  // "Level 9" folder -> Level 8
  { src: 'Level 9/intro-l8.mp4',                 publicId: 'shadow-gamma/video/Level 8/intro-l8' },
  { src: 'Level 9/reach-home-food.mp4',          publicId: 'shadow-gamma/video/Level 8/reach-home-food' },
  { src: 'Level 9/after-eat-l8.mp4',             publicId: 'shadow-gamma/video/Level 8/after-eat-l8' },
  { src: 'Level 9/decorate-intro-l8.mp4',        publicId: 'shadow-gamma/video/Level 8/decorate-intro-l8' },
  { src: 'Level 9/decorate-home-reach-l8.mp4',   publicId: 'shadow-gamma/video/Level 8/decorate-home-reach-l8' },
  { src: 'Level 9/l8-end.mp4',                   publicId: 'shadow-gamma/video/Level 8/l8-end' },
  // "Level 10" folder -> Level 9
  { src: 'Level 10/intro-L10.mp4',               publicId: 'shadow-gamma/video/Level 9/intro-l10' },
  { src: 'Level 10/gift-open-l10.mp4',           publicId: 'shadow-gamma/video/Level 9/gift-open-l10' },
  { src: 'Level 10/bow-intro-l10.mp4',           publicId: 'shadow-gamma/video/Level 9/bow-intro-l10' },
  { src: 'Level 10/end-l10.mp4',                 publicId: 'shadow-gamma/video/Level 9/end-l10' },
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
