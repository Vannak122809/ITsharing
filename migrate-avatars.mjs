/**
 * migrate-avatars.mjs
 * Copies avatar files from document bucket → image bucket,
 * then updates Firestore URLs to the correct public r2.dev URL.
 */
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

// Firebase
const firebaseApp = initializeApp({
  apiKey:     process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(firebaseApp);

// R2 clients
const endpoint   = process.env.VITE_R2_ENDPOINT;
const docBucket  = process.env.VITE_R2_BUCKET_NAME;       // "document"
const imgBucket  = process.env.VITE_R2_IMAGE_BUCKET;      // "image"
const imgCDN     = process.env.VITE_R2_IMAGE_PUBLIC_URL;  // pub-337d5...r2.dev
const creds      = { accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID, secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY };

const r2 = new S3Client({ region: 'auto', endpoint, credentials: creds });

// Helper: stream to Buffer
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
};

console.log('\n=== Migrating Avatars to Image Bucket ===\n');

const snap = await getDocs(collection(db, 'users'));
let migrated = 0;

for (const d of snap.docs) {
  const uid  = d.id;
  const data = d.data();

  // Only fix users whose avatar URL uses the DOCUMENT bucket CDN (pub-6cc8...)
  const isBroken = (url) => url && url.includes('pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev');

  const updates = {};

  // Fix avatarUrl
  if (isBroken(data.avatarUrl)) {
    console.log(`\n👤 ${data.email}`);
    // Extract key from URL: ".../images/avatars/uid.jpg?v=..." → "images/avatars/uid.jpg"
    const oldKey = data.avatarUrl.split('.r2.dev/')[1]?.split('?')[0];
    const ext    = oldKey?.split('.').pop() || 'jpg';
    const newKey = `avatars/${uid}.${ext}`;

    console.log(`  OLD key: ${oldKey}`);
    console.log(`  NEW key: ${newKey} (image bucket)`);

    try {
      // Download from document bucket
      const obj = await r2.send(new GetObjectCommand({ Bucket: docBucket, Key: oldKey }));
      const buf = await streamToBuffer(obj.Body);

      // Upload to image bucket
      await r2.send(new PutObjectCommand({
        Bucket: imgBucket, Key: newKey,
        Body: buf, ContentType: obj.ContentType || 'image/jpeg',
      }));

      updates.avatarUrl = `${imgCDN}/${newKey}`;
      console.log(`  ✅ Copied! New URL: ${updates.avatarUrl}`);
    } catch (e) {
      console.log(`  ❌ Failed to copy avatar: ${e.message}`);
      // If file not found in doc bucket, just clear the bad URL
      updates.avatarUrl = '';
    }
  }

  // Fix coverUrl
  if (isBroken(data.coverUrl)) {
    const oldKey = data.coverUrl.split('.r2.dev/')[1]?.split('?')[0];
    const ext    = oldKey?.split('.').pop() || 'jpg';
    const newKey = `covers/${uid}.${ext}`;
    try {
      const obj = await r2.send(new GetObjectCommand({ Bucket: docBucket, Key: oldKey }));
      const buf = await streamToBuffer(obj.Body);
      await r2.send(new PutObjectCommand({
        Bucket: imgBucket, Key: newKey,
        Body: buf, ContentType: obj.ContentType || 'image/jpeg',
      }));
      updates.coverUrl = `${imgCDN}/${newKey}`;
      console.log(`  ✅ Cover copied! New URL: ${updates.coverUrl}`);
    } catch (e) {
      console.log(`  ❌ Failed to copy cover: ${e.message}`);
      updates.coverUrl = '';
    }
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'users', uid), updates);
    migrated++;
  }
}

if (migrated === 0) {
  console.log('✅ No migration needed — all users already use the image bucket CDN.');
} else {
  console.log(`\n🎉 Migrated ${migrated} user(s) to image bucket CDN.`);
}
console.log('\n→ Reload http://localhost:5173/profile — avatars should now display!');
process.exit(0);
