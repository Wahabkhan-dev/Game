import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '..', 'public', 'assets', 'images', 'Intro.mp4');

cloudinary.uploader.upload(filePath, {
  resource_type: 'video',
  public_id: 'shadow-gamma/video/intro',
  overwrite: true,
}).then((result) => {
  console.log('UPLOADED:', result.secure_url);
}).catch((err) => {
  console.error('FAILED:', err.message);
  process.exitCode = 1;
});
