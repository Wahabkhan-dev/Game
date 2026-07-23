import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videoRoot = path.join(__dirname, '..', 'public', 'assets', 'video', 'Level 6');

const files = [
  { file: 'intro-l6.mp4',       publicId: 'shadow-gamma/video/Level 6/intro-l6' },
  { file: 'conclusion-l6.mp4',  publicId: 'shadow-gamma/video/Level 6/conclusion-l6' },
];

async function main() {
  for (const { file, publicId } of files) {
    const filePath = path.join(videoRoot, file);
    process.stdout.write(`Uploading ${file} ... `);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        public_id: publicId,
        overwrite: true,
      });
      console.log('done ->', result.secure_url);
    } catch (err) {
      console.log('FAILED');
      console.error(`  ${err.message}`);
      process.exitCode = 1;
    }
  }
}

main();
