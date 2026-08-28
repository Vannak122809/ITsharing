import { db } from "./firebase";
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { uploadAssetToR2 } from "./r2Assets";

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

/** POST to /api/upload-url and get a signed PUT URL + public URL */
async function getSignedUploadUrl({ bucket, key, contentType, size }) {
  const res = await fetch(`${API_BASE}/api/upload-url`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ bucket, key, contentType, size }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `upload-url API error (${res.status})`);
  }
  return res.json(); // { uploadUrl, publicUrl }
}

// The Cloudflare R2 public URL base you configured in your dashboard
// Example: "https://pub-xxxxxxxxxxxxx.r2.dev"
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL; // Please replace with your actual R2.dev URL if you have one enabled

/**
 * Uploads a file directly to Cloudflare R2.
 * Automatically chooses between standard PUT and chunked Multipart upload based on file size.
 * @param {File} file 
 * @param {string} folder 
 * @param {function} [onProgress]
 * @returns {Promise<string>} The file key/path in R2
 */
export const uploadFileToR2 = async (file, folder = "documents", onProgress = null) => {
  try {
    // Routes through /api/upload-asset — no client-side credentials needed
    const key = await uploadAssetToR2(file, folder, null, onProgress);
    return key;
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
const MAX_AVATAR_SIZE_MB = 2;
const MAX_COVER_SIZE_MB = 4;

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
 * Delete an old object from R2 (best-effort — server-side only).
 * Client-side delete is disabled for security; this is a no-op placeholder.
 * Wire up a server-side /api/delete-object route if deletion is needed.
 */
const deleteFromDocR2 = async (key) => {
  console.warn('[r2Utils] Client-side R2 delete is disabled. Key not deleted:', key);
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

  const ext = file.name.split('.').pop().toLowerCase();
  const key = `images/avatars/${uid}.${ext}`;

  if (oldKey && oldKey !== key) await deleteFromDocR2(oldKey);

  // Upload via server-signed URL — credentials never leave the server
  const { uploadUrl, publicUrl } = await getSignedUploadUrl({
    bucket:      'document',
    key,
    contentType: file.type,
    size:        file.size,
  });

  const res = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': file.type },
    body:    file,
  });
  if (!res.ok) throw new Error(`Avatar R2 PUT failed (${res.status})`);

  const url = `${publicUrl}`;
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

  const ext = file.name.split('.').pop().toLowerCase();
  const key = `images/covers/${uid}.${ext}`;

  if (oldKey && oldKey !== key) await deleteFromDocR2(oldKey);

  // Upload via server-signed URL — credentials never leave the server
  const { uploadUrl, publicUrl } = await getSignedUploadUrl({
    bucket:      'document',
    key,
    contentType: file.type,
    size:        file.size,
  });

  const res = await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': file.type },
    body:    file,
  });
  if (!res.ok) throw new Error(`Cover R2 PUT failed (${res.status})`);

  const url = `${publicUrl}`;
  return { url, key };
};

/**
 * Converts an image file to WebP format using Canvas API
 * @param {File} file The original image file
 * @param {number} quality Compression quality (0 to 1)
 * @returns {Promise<Blob>} The converted WebP image as a Blob
 */
export const convertToWebP = async (file, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas toBlob conversion failed'));
                    }
                }, 'image/webp', quality);
            };
            img.onerror = () => reject(new Error('Failed to load image for WebP conversion'));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file for WebP conversion'));
        reader.readAsDataURL(file);
    });
};
