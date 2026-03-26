/**
 * set-test-avatar.mjs
 * Manually sets the avatar for test123@gmail.com in Firestore
 * so it points to the uploaded file in R2.
 */
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const firebaseApp = initializeApp({
  apiKey:     process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(firebaseApp);

const PUBLIC_URL  = process.env.VITE_R2_IMAGE_PUBLIC_URL;
const IMAGE_BUCKET = process.env.VITE_R2_IMAGE_BUCKET;

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.VITE_R2_IMAGE_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

console.log('\n=== All Users in Firestore ===');
const snap = await getDocs(collection(db, 'users'));
snap.docs.forEach(d => {
  const data = d.data();
  console.log(`\n👤 ${data.email || '(no email)'}`);
  console.log('   UID      :', d.id);
  console.log('   nickname :', data.nickname || '(none)');
  console.log('   avatarUrl:', data.avatarUrl || '(EMPTY)');
  console.log('   coverUrl :', data.coverUrl  || '(EMPTY)');
});

console.log('\n=== Files in R2 image bucket (avatars/) ===');
const list = await r2.send(new ListObjectsV2Command({ Bucket: IMAGE_BUCKET, Prefix: 'avatars/' }));
const files = list.Contents || [];
files.forEach(f => {
  console.log(` ✅ ${f.Key}  →  ${PUBLIC_URL}/${f.Key}`);
});

// Match R2 files to Firebase users by UID
console.log('\n=== Fixing missing avatarUrls ===');
let fixed = 0;
for (const d of snap.docs) {
  const uid  = d.id;
  const data = d.data();
  if (data.avatarUrl && !data.avatarUrl.includes('r2.cloudflarestorage.com')) {
    console.log(`⏭ ${data.email} — already has good URL`);
    continue;
  }

  // Find a matching R2 file
  const match = files.find(f => f.Key.includes(uid));
  if (match) {
    const newUrl = `${PUBLIC_URL}/${match.Key}`;
    await updateDoc(doc(db, 'users', uid), { avatarUrl: newUrl });
    console.log(`✅ Fixed ${data.email}: ${newUrl}`);
    fixed++;
  } else {
    console.log(`⚠ No R2 file found for ${data.email} (uid: ${uid})`);
  }
}

console.log(`\n🎉 Done! Fixed ${fixed} user(s).`);
console.log('→ Reload http://localhost:5173/profile to see avatar!');
process.exit(0);
