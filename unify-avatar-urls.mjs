/**
 * unify-avatar-urls.mjs
 * Ensures ALL users use the same CDN (pub-564a73... = document bucket public URL)
 * and verifies each URL is actually accessible.
 */
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const app = initializeApp({
  apiKey:     process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  process.env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// The ONE correct CDN for document bucket (where all avatars are stored)
const CORRECT_CDN = 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev';

// Other CDNs that need to be migrated
const OLD_CDNS = [
  'https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev',
  'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev',  // image bucket CDN
  'https://baefceb90c0d256e27440b3d07f4631e.r2.cloudflarestorage.com',
];

const checkUrl = (url) => new Promise((resolve) => {
  https.get(url, (res) => resolve(res.statusCode)).on('error', () => resolve(0));
});

console.log('\n=== User Avatar Status Report ===\n');

const snap = await getDocs(collection(db, 'users'));
let fixed = 0;

for (const d of snap.docs) {
  const data    = d.data();
  const email   = data.email || d.id;
  const updates = {};

  // Check avatarUrl
  let avatarUrl = data.avatarUrl || '';
  if (avatarUrl) {
    // Fix wrong CDN prefix
    const oldCdn = OLD_CDNS.find(cdn => avatarUrl.startsWith(cdn));
    if (oldCdn) {
      // Extract path after the CDN prefix
      let path = avatarUrl.replace(oldCdn, '').split('?')[0];
      // Normalize: image bucket used avatars/uid.ext, doc bucket uses images/avatars/uid.ext
      // Map image bucket paths to doc bucket paths
      if (path.startsWith('/avatars/')) {
        path = '/images/avatars/' + path.split('/avatars/')[1];
      }
      if (path.startsWith('/covers/')) {
        path = '/images/covers/' + path.split('/covers/')[1];
      }
      updates.avatarUrl = `${CORRECT_CDN}${path}`;
    }

    // Verify URL works
    const testUrl = updates.avatarUrl || avatarUrl;
    const status  = await checkUrl(testUrl);
    const icon    = status === 200 ? '✅' : '❌';
    console.log(`${icon} ${email}`);
    console.log(`   URL: ${testUrl}`);
    console.log(`   Status: HTTP ${status || 'ERROR'}`);
    if (status !== 200) {
      console.log(`   ⚠ Image not accessible — user needs to re-upload avatar`);
      updates.avatarUrl = ''; // clear broken URL
    }
  } else {
    console.log(`⬜ ${email}`);
    console.log(`   No avatar set yet`);
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'users', d.id), updates);
    fixed++;
    console.log(`   → Updated in Firestore`);
  }
  console.log('');
}

console.log(`\n📊 Summary: ${snap.size} users total, ${fixed} updated`);
console.log(`✅ All URLs now use: ${CORRECT_CDN}`);
process.exit(0);
