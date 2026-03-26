/**
 * fix-firestore-avatars.mjs
 * Finds all users with broken R2 storage URLs and replaces them
 * with the correct public r2.dev URL.
 */
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const app = initializeApp({
  apiKey:     process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

const OLD_PREFIX = 'https://baefceb90c0d256e27440b3d07f4631e.r2.cloudflarestorage.com';
const NEW_CDN    = 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev';

console.log('\n=== Fixing Firestore Avatar URLs ===');
console.log('Replacing:', OLD_PREFIX);
console.log('With:     ', NEW_CDN);

const snap = await getDocs(collection(db, 'users'));
let fixed = 0;

for (const d of snap.docs) {
  const data = d.data();
  const updates = {};
  let needsUpdate = false;

  // Fix avatarUrl
  if (data.avatarUrl?.includes(OLD_PREFIX)) {
    // Extract path after /image/
    const path = data.avatarUrl.split('/image/')[1]?.split('?')[0] || '';
    updates.avatarUrl = path ? `${NEW_CDN}/${path}` : '';
    console.log(`\n👤 User: ${data.email || d.id}`);
    console.log('  OLD avatarUrl:', data.avatarUrl.substring(0, 80) + '...');
    console.log('  NEW avatarUrl:', updates.avatarUrl);
    needsUpdate = true;
  }

  // Fix coverUrl
  if (data.coverUrl?.includes(OLD_PREFIX)) {
    const path = data.coverUrl.split('/image/')[1]?.split('?')[0] || '';
    updates.coverUrl = path ? `${NEW_CDN}/${path}` : '';
    console.log('  OLD coverUrl:', data.coverUrl.substring(0, 80) + '...');
    console.log('  NEW coverUrl:', updates.coverUrl);
    needsUpdate = true;
  }

  if (needsUpdate) {
    await updateDoc(doc(db, 'users', d.id), updates);
    fixed++;
    console.log('  ✅ Fixed!');
  }
}

if (fixed === 0) {
  console.log('\n✅ No broken URLs found — all users already have correct URLs or no avatar.');
  console.log('   The avatarUrl may be empty. Upload a new photo to set it.');
} else {
  console.log(`\n🎉 Fixed ${fixed} user(s) — Reload the profile page to see avatars!`);
}

process.exit(0);
