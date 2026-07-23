import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videoRoot = path.join(__dirname, '..', 'public', 'assets', 'video', 'levell 7');

const files = [];
for (let i = 1; i <= 8; i++) {
  files.push({ file: `Video ${i}.mp4`, publicId: `shadow-gamma/video/Level 7/video-${i}` });
}

async function main() {
  const results = {};
  for (const { file, publicId } of files) {
    const filePath = path.join(videoRoot, file);
    process.stdout.write(`Uploading ${file} ... `);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video',
        public_id: publicId,
        overwrite: true,
      });
      results[file] = result.secure_url;
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
