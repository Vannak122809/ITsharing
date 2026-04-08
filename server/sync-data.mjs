import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize firebase admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

function extractArray(filePath, varName) {
    if (!fs.existsSync(filePath)) {
        console.log(`File missing: ${filePath}`);
        return null;
    }
    const code = fs.readFileSync(filePath, 'utf-8');
    const prefix = varName + " = [";
    const startIdx = code.indexOf(prefix);
    if (startIdx === -1) return null;
    
    let start = startIdx + prefix.length - 1;
    let brackets = 0;
    let end = start;
    let inString = false;
    let stringChar = '';

    for (let i = start; i < code.length; i++) {
        const char = code[i];
        if (inString) {
            if (char === stringChar && code[i-1] !== '\\') {
                inString = false;
            }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '[') {
                brackets++;
            } else if (char === ']') {
                brackets--;
                if (brackets === 0) {
                    end = i + 1;
                    break;
                }
            } else if (char === '/') {
                if (code[i+1] === '/') {
                    while (code[i] !== '\n' && i < code.length) i++;
                }
                else if (code[i+1] === '*') {
                    while (!(code[i] === '*' && code[i+1] === '/') && i < code.length) i++;
                    i++;
                }
            }
        }
    }
    
    let arrayStr = code.substring(start, end);
    try {
        return eval(`(${arrayStr})`);
    } catch(err) {
        console.error(`Failed to eval ${varName}`, err);
        return null;
    }
}

async function syncData() {
    console.log('Extracting local data...');
    const srcDir = path.join(__dirname, '../src/pages');
    
    try {
        const courses = extractArray(path.join(srcDir, 'Courses.jsx'), 'courseData');
        const docs = extractArray(path.join(srcDir, 'Documents.jsx'), 'docData');
        const software = extractArray(path.join(srcDir, 'Software.jsx'), 'softwareData');

        console.log(`Found ${courses?.length || 0} courses, ${docs?.length || 0} documents, ${software?.length || 0} software items.`);

        const insertToCollection = async (items, collectionName) => {
            if (!items || !items.length) return;
            const batch = db.batch();
            let count = 0;
            
            // Delete existing documents to prevent duplicates based on some ID
            // Since this is a one-off sync, we just insert. To prevent dupes, we might not need to worry right now,
            // or we can use titles to avoid overriding. But let's just insert them clean.
            
            items.forEach(item => {
                const docRef = db.collection(collectionName).doc();
                item.createdAt = new Date().toISOString();
                item.updatedAt = new Date().toISOString();
                
                // Keep original ID just in case it was used for reference, 
                // but rename it so it doesn't conflict.
                if (item.id) {
                    item.originalId = item.id;
                    delete item.id;
                }
                
                batch.set(docRef, item);
                count++;
            });
            await batch.commit();
            console.log(`Synced ${count} items to [${collectionName}] collection.`);
        };

        if (courses) await insertToCollection(courses, 'courses');
        if (docs) await insertToCollection(docs, 'documents');
        if (software) await insertToCollection(software, 'software');

        console.log('All data synced to Firebase successfully!');
        process.exit(0);
    } catch(e) {
        console.error('Error during sync:', e);
        process.exit(1);
    }
}

syncData();
