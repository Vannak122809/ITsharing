import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const promoteUser = async () => {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: serviceAccountKey.json not found in the server root.');
    console.log('Please download it from Firebase Console -> Project Settings -> Service Accounts, and save it as "server/serviceAccountKey.json".');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const emailToPromote = process.argv[2];
  
  if (!emailToPromote) {
    console.error('❌ Error: Please provide an email address.');
    console.log('Usage: node promote-admin.js <your-email@gmail.com>');
    process.exit(1);
  }

  try {
    const userRecord = await admin.auth().getUserByEmail(emailToPromote);
    
    // Set custom user claims on Firebase
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'super_admin' });
    
    console.log(`✅ Success! Firebase account [${userRecord.email}] is now a super_admin.`);
    console.log('They will need to log out and log back in for the changes to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Firebase Admin Error:', error.message);
    process.exit(1);
  }
};

promoteUser();
