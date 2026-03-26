/**
 * set-r2-cors.mjs
 * ─────────────────────────────────────
 * Run once to configure CORS on both R2 buckets:
 *   node set-r2-cors.mjs
 */

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

// ── CORS Rules (allow browsers from any origin to upload/read) ────────────
const CORS_RULES = {
  CORSRules: [
    {
      AllowedOrigins: ['*'],          // Replace '*' with your domain in production
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders:  ['ETag'],
      MaxAgeSeconds:  86400,
    },
  ],
};

// ── Client factory ────────────────────────────────────────────────────────
const makeClient = (endpoint) => new S3Client({
  region:   'auto',
  endpoint,
  credentials: {
    accessKeyId:     process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

async function setCors(client, bucketName, label) {
  try {
    await client.send(new PutBucketCorsCommand({
      Bucket:            bucketName,
      CORSConfiguration: CORS_RULES,
    }));
    console.log(`✅ CORS set on bucket: "${bucketName}" (${label})`);
  } catch (err) {
    console.error(`❌ Failed to set CORS on "${bucketName}":`, err.message);
  }
}

async function main() {
  const endpoint      = process.env.VITE_R2_ENDPOINT;
  const docBucket     = process.env.VITE_R2_BUCKET_NAME;
  const imageBucket   = process.env.VITE_R2_IMAGE_BUCKET;

  console.log('🔧 Setting CORS on R2 buckets...\n');
  console.log(`   Endpoint    : ${endpoint}`);
  console.log(`   Doc bucket  : ${docBucket}`);
  console.log(`   Image bucket: ${imageBucket}\n`);

  const client = makeClient(endpoint);

  await setCors(client, docBucket,   'documents');
  await setCors(client, imageBucket, 'images / avatars');

  console.log('\n✅ Done! CORS has been applied. Restart your dev server.');
}

main();
