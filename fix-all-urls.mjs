/**
 * fix-all-urls.mjs
 * Replace all old broken pub-6cc8... URLs in Firestore with pub-564a73... (correct CDN)
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

// All known wrong prefixes → replace with correct CDN
const WRONG = 'https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev';
const RIGHT  = 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev';

console.log('\n=== Fixing All Firestore Avatar/Cover URLs ===');
console.log(`WRONG: ${WRONG}`);
console.log(`RIGHT: ${RIGHT}\n`);

const snap = await getDocs(collection(db, 'users'));
let fixed = 0;

for (const d of snap.docs) {
  const data = d.data();
  const updates = {};

  if (data.avatarUrl?.includes(WRONG)) {
    updates.avatarUrl = data.avatarUrl.replace(WRONG, RIGHT).split('?')[0]; // remove cache-bust
    console.log(`✅ ${data.email} → avatarUrl fixed`);
    console.log(`   ${updates.avatarUrl}`);
  }

  if (data.coverUrl?.includes(WRONG)) {
    updates.coverUrl = data.coverUrl.replace(WRONG, RIGHT).split('?')[0];
    console.log(`✅ ${data.email} → coverUrl fixed`);
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'users', d.id), updates);
    fixed++;
  }
}

if (fixed === 0) {
  console.log('No broken URLs found — printing current state:');
  snap.docs.forEach(d => {
    const data = d.data();
    if (data.avatarUrl) console.log(`  ${data.email}: ${data.avatarUrl}`);
  });
} else {
  console.log(`\n🎉 Fixed ${fixed} user(s)!`);
}

process.exit(0);
