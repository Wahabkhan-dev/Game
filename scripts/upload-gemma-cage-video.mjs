import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'public', 'assets', 'images', 'all', 'Gadge.mp4');
const publicId = 'shadow-gamma/video/all/gemma-cage-loop';

async function main() {
  process.stdout.write(`Uploading Gadge.mp4 ... `);
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

main();
