import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ── Server-only R2 client — secrets never reach the browser ──────────────────
// These env vars are set in Vercel Dashboard (NOT prefixed with VITE_)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB hard limit

/**
 * POST /api/upload-url
 * Body: { bucket, key, contentType, size }
 * Returns: { uploadUrl, publicUrl }
 *
 * The browser calls this to get a short-lived signed URL, then
 * uploads the file directly to R2 using that URL. The R2 secret
 * key is NEVER sent to the browser.
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Security headers ───────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://itsharing.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  const { bucket, key, contentType, size } = req.body || {};

  // ── Input validation ───────────────────────────────────────────────────────
  if (!bucket || !key || !contentType || !size) {
    return res.status(400).json({ error: 'Missing required fields: bucket, key, contentType, size' });
  }

  // Only allow image buckets — prevent arbitrary bucket access
  const ALLOWED_BUCKETS = [
    process.env.R2_BUCKET_NAME || 'document',
    process.env.R2_IMAGE_BUCKET || 'image',
  ];
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return res.status(403).json({ error: 'Forbidden bucket' });
  }

  // Only allow image content types
  if (!ALLOWED_TYPES.includes(contentType)) {
    return res.status(400).json({ error: 'Unsupported file type. Only JPG, PNG, WebP, GIF allowed.' });
  }

  // Size check
  if (size > MAX_SIZE_BYTES) {
    return res.status(400).json({ error: `File too large. Max 5 MB.` });
  }

  // Sanitize the key — prevent path traversal (e.g. ../../etc/passwd)
  const safeKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
  if (!safeKey) {
    return res.status(400).json({ error: 'Invalid file key' });
  }

  try {
    // Generate a pre-signed PUT URL valid for 60 seconds
    const command = new PutObjectCommand({
      Bucket:      bucket,
      Key:         safeKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 60 });

    // Build the public CDN URL that the browser will use to display the image
    const publicBaseUrl = bucket === (process.env.R2_IMAGE_BUCKET || 'image')
      ? process.env.R2_IMAGE_PUBLIC_URL
      : process.env.R2_PUBLIC_URL;

    const publicUrl = `${publicBaseUrl}/${safeKey}?v=${Date.now()}`;

    return res.status(200).json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error('[upload-url] Error generating signed URL:', err);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}
