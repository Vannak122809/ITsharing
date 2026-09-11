import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();
if (fs.existsSync('server/.env')) dotenv.config({ path: 'server/.env' });

const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-east-005';
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APPLICATION_KEY;
const BUCKET_NAME = process.env.B2_BUCKET_NAME || 'Adobefamily';

if (!B2_KEY_ID || !B2_APP_KEY) {
  console.error('❌ Missing B2_KEY_ID or B2_APPLICATION_KEY in environment.');
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
});

async function uploadFile(filePath, destinationKey) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const resolvedKey = destinationKey || path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);
  const fileStats = fs.statSync(filePath);

  console.log(`📦 Uploading to Backblaze B2 (Adobefamily):`);
  console.log(`   Source      : ${filePath}`);
  console.log(`   Destination : ${resolvedKey}`);
  console.log(`   Size        : ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`);

  try {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: resolvedKey,
      Body: fileStream,
    });
    const res = await s3.send(cmd);
    console.log(`✅ Upload complete! ETag: ${res.ETag}`);
    console.log(`🔗 Direct Download URL: https://f005.backblazeb2.com/file/${BUCKET_NAME}/${encodeURIComponent(resolvedKey)}`);
  } catch (err) {
    console.error(`❌ Upload failed:`, err.message);
  }
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node scripts/upload-adobe-to-b2.mjs <file_path> [destination_key_optional]');
  process.exit(0);
}

uploadFile(args[0], args[1]);
