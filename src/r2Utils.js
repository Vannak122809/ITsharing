import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_NAME } from "./r2";
import { db } from "./firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";

// The Cloudflare R2 public URL base you configured in your dashboard
// Example: "https://pub-xxxxxxxxxxxxx.r2.dev"
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL; // Please replace with your actual R2.dev URL if you have one enabled

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

// ─────────────────────────────────────────────────────────────────────────────
// USER PHOTO UPLOADS
// ─────────────────────────────────────────────────────────────────────────────

/** Allowed image types and max size */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE_MB  = 2;
const MAX_COVER_SIZE_MB   = 4;

/**
 * Validate image before upload
 * @returns {string|null} error message, or null if valid
 */
export const validateImageFile = (file, maxMB = 2) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WebP, or GIF images are allowed.';
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Image must be smaller than ${maxMB} MB.`;
  }
  return null;
};

/**
 * Delete an old object from the DOCUMENT bucket (best-effort)
 */
const deleteFromDocR2 = async (key) => {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch (e) {
    console.warn('[R2] Could not delete old file:', key, e.message);
  }
};

/**
 * Upload user AVATAR to R2
 * - Stores at: avatars/{uid}.{ext}
 * - Deletes previous avatar first (best-effort)
 * - Returns the full public URL with cache-bust query param
 *
 * @param {string} uid       Firebase user UID
 * @param {File}   file      Image file from <input type="file">
 * @param {string} [oldKey]  Previous R2 key to delete (optional)
 * @returns {Promise<{ url: string, key: string }>}
 */
export const uploadAvatarToR2 = async (uid, file, oldKey = null) => {
  const err = validateImageFile(file, MAX_AVATAR_SIZE_MB);
  if (err) throw new Error(err);

  // Store in document bucket under images/avatars/
  const ext = file.name.split('.').pop().toLowerCase();
  const key = `images/avatars/${uid}.${ext}`;

  if (oldKey && oldKey !== key) await deleteFromDocR2(oldKey);

  const arrayBuffer = await file.arrayBuffer();

  // Upload → document bucket (public CDN: pub-564a73...r2.dev)
  await r2Client.send(new PutObjectCommand({
    Bucket:      BUCKET_NAME,
    Key:         key,
    Body:        new Uint8Array(arrayBuffer),
    ContentType: file.type,
  }));

  const url = `${R2_PUBLIC_URL}/${key}?v=${Date.now()}`;
  return { url, key };
};

/**
 * Upload user COVER PHOTO to R2
 * - Stores at: covers/{uid}.{ext}
 * - Deletes previous cover first (best-effort)
 * - Returns the full public URL with cache-bust query param
 *
 * @param {string} uid       Firebase user UID
 * @param {File}   file      Image file from <input type="file">
 * @param {string} [oldKey]  Previous R2 key to delete (optional)
 * @returns {Promise<{ url: string, key: string }>}
 */
export const uploadCoverToR2 = async (uid, file, oldKey = null) => {
  const err = validateImageFile(file, MAX_COVER_SIZE_MB);
  if (err) throw new Error(err);

  // Store in document bucket under images/covers/
  const ext = file.name.split('.').pop().toLowerCase();
  const key = `images/covers/${uid}.${ext}`;

  if (oldKey && oldKey !== key) await deleteFromDocR2(oldKey);

  const arrayBuffer = await file.arrayBuffer();

  // Upload → document bucket
  await r2Client.send(new PutObjectCommand({
    Bucket:      BUCKET_NAME,
    Key:         key,
    Body:        new Uint8Array(arrayBuffer),
    ContentType: file.type,
  }));

  const url = `${R2_PUBLIC_URL}/${key}?v=${Date.now()}`;
  return { url, key };
};
