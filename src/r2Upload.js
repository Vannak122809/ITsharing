/**
 * r2Upload.js — Secure client-side R2 upload helper
 *
 * Instead of calling R2 directly (which requires exposing secret keys in the browser),
 * this module asks our own serverless API for a short-lived signed upload URL,
 * then uploads the file directly to R2 using that signed URL.
 *
 * R2 secret keys NEVER reach the browser.
 */

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

/**
 * Upload a file to R2 via a server-issued pre-signed URL.
 *
 * @param {File}   file   - The File object to upload
 * @param {string} key    - The R2 object key (path), e.g. "images/avatars/uid.jpg"
 * @param {string} bucket - The R2 bucket name ("image" or "document")
 * @returns {Promise<string>} The public CDN URL of the uploaded file
 */
export async function uploadToR2(file, key, bucket = 'image') {
  // Step 1: Ask our API for a signed upload URL
  const metaRes = await fetch(`${API_BASE}/api/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket,
      key,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to get upload URL (${metaRes.status})`);
  }

  const { uploadUrl, publicUrl } = await metaRes.json();

  // Step 2: Upload the file directly to R2 using the signed URL
  // The browser makes a direct PUT to Cloudflare — fast, no proxy overhead
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed (${uploadRes.status})`);
  }

  return publicUrl;
}
