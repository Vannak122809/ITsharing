/**
 * b2.js — Backblaze B2 Storage Configuration & Direct Upload Client
 *
 * NOTE: All Adobe Family software files, installers, and packages
 * are permanently and strictly designated to be stored in this Backblaze B2 bucket.
 */

export const B2_ADOBE_BUCKET_NAME = 'Adobefamily';
export const B2_ADOBE_BUCKET_ID   = 'a6a2d500fdaf8c33a2070314';
export const B2_ADOBE_ENDPOINT    = 'https://s3.us-east-005.backblazeb2.com';
export const B2_ADOBE_REGION      = 'us-east-005';

// Public CDN base URL for downloading Adobe software
export const B2_ADOBE_PUBLIC_URL = import.meta.env.VITE_B2_ADOBE_PUBLIC_URL || 'https://f005.backblazeb2.com/file/Adobefamily';

export const ADOBE_SOFTWARE_KEYWORDS = [
  'adobe',
  'photoshop',
  'illustrator',
  'premiere',
  'after effects',
  'lightroom',
  'indesign',
  'acrobat',
  'audition',
  'media encoder',
  'substance',
  'bridge',
  'animate',
  'dreamweaver',
  'xd',
  'firefly',
  'fresco',
  'dimension',
  'speedgrade',
  'prelude',
  'flash'
];

/**
 * Checks whether any software item or filename matches the Adobe ecosystem
 * @param {Object|string} input - Object containing title, developer, fileName, folder, or a string
 * @returns {boolean} True if this belongs to Adobe Family
 */
export function isAdobeProduct(input) {
  if (!input) return false;
  let textToTest = '';
  if (typeof input === 'string') {
    textToTest = input.toLowerCase();
  } else {
    textToTest = [
      input.title || '',
      input.developer || '',
      input.fileName || '',
      input.name || '',
      input.folder || '',
      input.subfolder || '',
      input.category || ''
    ].join(' ').toLowerCase();
  }

  return ADOBE_SOFTWARE_KEYWORDS.some(kw => textToTest.includes(kw));
}

/**
 * Generate the public download URL for any Adobe software file in B2
 * @param {string} fileName - Name or key of the file inside Adobefamily bucket
 * @returns {string} Public direct download URL
 */
export function getAdobeDownloadUrl(fileName) {
  if (!fileName) return '';
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
  const cleanKey = fileName.replace(/^\/+/, '');
  return `${B2_ADOBE_PUBLIC_URL}/${cleanKey.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Uploads a software binary directly to Backblaze B2 (Adobefamily bucket)
 * Requests a secure pre-signed PUT URL from /api/upload-b2 and streams with XHR for accurate progress.
 *
 * @param {File} file - Local file object
 * @param {string} folder - Destination subfolder inside Adobefamily bucket (e.g. 'Windows', 'macOS')
 * @param {Function} [onProgress] - Optional callback receiving upload percentage (0-100)
 * @returns {Promise<{ publicUrl: string, key: string, bucket: string }>}
 */
export async function uploadSoftwareToB2(file, folder = '', onProgress = null) {
  if (!file) throw new Error('No file provided for Backblaze B2 upload');

  // 1. Request presigned PUT URL from backend
  const presignRes = await fetch('/api/upload-b2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
      folder: folder || ''
    })
  });

  if (!presignRes.ok) {
    const errData = await presignRes.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to initiate B2 upload (HTTP ${presignRes.status})`);
  }

  const { uploadUrl, publicUrl, key, bucket } = await presignRes.json();

  // 2. Upload file directly to Backblaze B2 via pre-signed URL with accurate progress tracking
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`Backblaze B2 PUT error: HTTP ${xhr.status} ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Backblaze B2 file transmission.'));
    xhr.ontimeout = () => reject(new Error('Backblaze B2 upload timed out.'));

    xhr.send(file);
  });

  return {
    publicUrl,
    key,
    bucket: bucket || B2_ADOBE_BUCKET_NAME,
    provider: 'backblazeb2'
  };
}
