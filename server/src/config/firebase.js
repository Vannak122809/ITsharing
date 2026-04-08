import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
export const initFirebase = () => {
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found in the server root.');
    console.log('Please download it from Firebase Console -> Project Settings -> Service Accounts, and save it as "server/serviceAccountKey.json".');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('🔥 Firebase Admin Connected!');
};

export const getFirestoreDb = () => admin.firestore();
export const getAuth = () => admin.auth();
