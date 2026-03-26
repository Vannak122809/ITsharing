import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const IMAGE_ENDPOINT   = process.env.VITE_R2_IMAGE_ENDPOINT;
const IMAGE_BUCKET     = process.env.VITE_R2_IMAGE_BUCKET;
const IMAGE_PUBLIC_URL = process.env.VITE_R2_IMAGE_PUBLIC_URL;
const ACCESS_KEY       = process.env.VITE_R2_ACCESS_KEY_ID;
const SECRET_KEY       = process.env.VITE_R2_SECRET_ACCESS_KEY;

const client = new S3Client({
  region: 'auto',
  endpoint: IMAGE_ENDPOINT,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

console.log('\n=== R2 Image Bucket Debug ===');
console.log('Bucket    :', IMAGE_BUCKET);
console.log('Endpoint  :', IMAGE_ENDPOINT);
console.log('Public URL:', IMAGE_PUBLIC_URL);

// 1. List existing avatars
console.log('\n--- Files in bucket ---');
try {
  const list = await client.send(new ListObjectsV2Command({ Bucket: IMAGE_BUCKET, MaxKeys: 20 }));
  if (list.Contents?.length) {
    list.Contents.forEach(o => console.log(' ✅', o.Key, `(${o.Size} bytes)`));
  } else {
    console.log(' (bucket is empty — no uploads yet)');
  }
} catch (e) {
  console.log(' ❌ List error:', e.message);
}

// 2. Upload a tiny test image (1x1 pixel PNG)
const TEST_KEY = 'avatars/test-debug.png';
const PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

console.log('\n--- Uploading test image ---');
try {
  await client.send(new PutObjectCommand({
    Bucket: IMAGE_BUCKET,
    Key: TEST_KEY,
    Body: PIXEL_PNG,
    ContentType: 'image/png',
  }));
  console.log(' ✅ Upload OK');
} catch (e) {
  console.log(' ❌ Upload error:', e.message);
  process.exit(1);
}

// 3. Try to fetch via public URL
const testUrl = `${IMAGE_PUBLIC_URL}/${TEST_KEY}`;
console.log('\n--- Testing public URL ---');
console.log(' URL:', testUrl);

https.get(testUrl, (res) => {
  if (res.statusCode === 200) {
    console.log(' ✅ Public URL works! Status:', res.statusCode);
    console.log('\n🎉 Everything is configured correctly!');
    console.log('   Avatars will display at:', `${IMAGE_PUBLIC_URL}/avatars/{uid}.jpg`);
  } else {
    console.log(' ❌ Public URL failed! Status:', res.statusCode);
    console.log('   Content-Type:', res.headers['content-type']);
    res.on('data', d => console.log('   Response body:', d.toString().substring(0, 200)));
  }
}).on('error', e => {
  console.log(' ❌ Network error:', e.message);
});
