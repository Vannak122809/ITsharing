import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME } from "./r2";
import { db } from "./firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";

// The Cloudflare R2 public URL base you configured in your dashboard
// Example: "https://pub-xxxxxxxxxxxxx.r2.dev"
const R2_PUBLIC_URL = "https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev"; // Please replace with your actual R2.dev URL if you have one enabled

/**
 * Uploads a file directly to Cloudflare R2
 * @param {File} file 
 * @param {string} folder 
 * @returns {Promise<string>} The file key/path in R2
 */
export const uploadFileToR2 = async (file, folder = "documents") => {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
    });

    await r2Client.send(command);
    return fileName;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};

/**
 * Generates a signed URL for secure download (If bucket is private)
 * or returns the public URL (If bucket is public)
 */
export const getFileUrl = async (fileKey) => {
  // Option A: If bucket has public access turned on (Faster, best for CDN)
  return `${R2_PUBLIC_URL}/${fileKey}`;
  
  // Option B: If bucket is private, generate a 1-hour signed URL:
  /*
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  */
};

/**
 * Saves document metadata into Firestore after uploading to R2
 */
export const saveDocumentRecord = async (docData) => {
  try {
    const docRef = await addDoc(collection(db, "documents"), {
      ...docData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving doc record:", error);
    throw error;
  }
};

/**
 * Fetches all document metadata from Firestore
 */
export const fetchAllDocuments = async () => {
  try {
    const q = query(collection(db, "documents"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });
    return docs;
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};
