/**
 * r2Assets.js — Secure client-side asset upload helper
 *
 * All R2 credentials live in server-side environment variables.
 * The browser NEVER sees a secret key — it only fetches signed URLs from /api/upload-asset.
 *
 * Supports:
 *  - Small files  (< 10 MB):  single pre-signed PUT
 *  - Large files  (≥ 10 MB):  server-assisted multipart upload
 */

const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : '';

// Public CDN base URL (read-only, safe to expose)
export const ASSETS_PUBLIC_URL = import.meta.env.VITE_R2_ASSETS_PUBLIC_URL
  || 'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev';

export const ASSETS_BUCKET = 'image';

const CHUNK_SIZE          = 10 * 1024 * 1024;  // 10 MB per part
const MULTIPART_THRESHOLD = 10 * 1024 * 1024;  // files >= this use multipart

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

/**
 * Upload a small file via a single server-signed PUT URL.
 */
async function smallUpload(file, key, onProgress) {
  const { uploadUrl, publicUrl } = await apiPost('/api/upload-asset', {
    key,
    contentType: file.type || 'application/octet-stream',
    size:        file.size,
  });

  await fetch(uploadUrl, {
    method:  'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body:    file,
  }).then((r) => {
    if (!r.ok) throw new Error(`R2 PUT failed (${r.status})`);
  });

  if (onProgress) onProgress(100);
  return { key, publicUrl };
}

/**
 * Upload a large file using server-assisted multipart.
 * Each chunk is PUT directly to R2 via a part-specific signed URL.
 */
async function multipartUpload(file, key, contentType, onProgress) {
  // 1. Initiate upload on server
  const initData = await apiPost('/api/upload-asset', {
    key,
    contentType: contentType || 'application/octet-stream',
    size:        file.size,
  });
  const { uploadId, key: safeKey, publicUrl } = initData;

  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  const parts      = [];
  let   uploaded   = 0;

  try {
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start  = (partNumber - 1) * CHUNK_SIZE;
      const end    = Math.min(start + CHUNK_SIZE, file.size);
      const chunk  = file.slice(start, end);
      const chunkSize = end - start;

      // Get a signed URL for this specific part
      const { signedUrl } = await apiPost('/api/upload-asset?action=part', {
        key:        safeKey,
        uploadId,
        partNumber,
        size:       chunkSize,
      });

      // PUT chunk directly to R2 with retry
      let etag;
      for (let attempt = 1; attempt <= 3; attempt++) {
        const r = await fetch(signedUrl, {
          method:  'PUT',
          headers: {
            'Content-Type':   contentType || 'application/octet-stream',
            'Content-Length': String(chunkSize),
          },
          body: chunk,
        });
        if (r.ok) {
          etag = r.headers.get('ETag') || r.headers.get('etag');
          break;
        }
        if (attempt === 3) throw new Error(`Part ${partNumber} upload failed (${r.status})`);
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
      }

      parts.push({ PartNumber: partNumber, ETag: etag });
      uploaded += chunkSize;
      if (onProgress) onProgress(Math.round((uploaded / file.size) * 100));
    }

    // Complete multipart on server
    await apiPost('/api/upload-asset?action=complete', {
      key: safeKey, uploadId, parts,
    });

    return { key: safeKey, publicUrl };

  } catch (err) {
    // Best-effort abort
    apiPost('/api/upload-asset?action=abort', { key: safeKey, uploadId }).catch(() => {});
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload an asset file to R2.
 * Automatically picks between single PUT and multipart based on size.
 *
 * @param {File}     file        File to upload
 * @param {string}   folder      R2 folder prefix (e.g. "Photoshop", "PNG", "display")
 * @param {string}   [bucket]    Ignored — kept for API compatibility
 * @param {Function} [onProgress] (percent: number) => void
 * @returns {Promise<string>}    The R2 object key
 */
export const uploadAssetToR2 = async (file, folder = 'PNG', bucket = null, onProgress = null) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const key      = `${folder}/${Date.now()}-${safeName}`;
  const ct       = file.type || 'application/octet-stream';

  let result;
  if (file.size >= MULTIPART_THRESHOLD) {
    result = await multipartUpload(file, key, ct, onProgress);
  } else {
    result = await smallUpload(file, key, onProgress);
  }

  return result.key;
};

/**
 * Convert an image file to WebP using the Canvas API.
 * PNG files with alpha are passed through unchanged to preserve transparency.
 *
 * @param {File}   file    Source image
 * @param {number} quality 0–1 compression quality
 * @returns {Promise<Blob>}
 */
export const convertToWebP = (file, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload  = (evt) => {
      const img    = new Image();
      img.onerror  = () => reject(new Error('Image load error'));
      img.onload   = () => {
        const MAX_WIDTH = 4096;
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width  = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('WebP conversion failed')),
          'image/webp',
          quality,
        );
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
};
