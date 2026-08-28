import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ── Server-only ASSETS R2 client ─────────────────────────────────────────────
// Credentials live in Vercel environment variables — never in the browser bundle.
const assetsR2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ASSETS_ENDPOINT,
  credentials: {
    accessKeyId:     process.env.R2_ASSETS_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_ASSETS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const BUCKET       = process.env.R2_ASSETS_BUCKET || 'image';
const PUBLIC_URL   = process.env.R2_ASSETS_PUBLIC_URL || 'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev';

// Files larger than this go through multipart
const MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10 MB

// Max single upload size guard (100 MB)
const MAX_SIZE = 100 * 1024 * 1024;

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://itsharing.vercel.app';

/**
 * POST /api/upload-asset
 *
 * Body: { key, contentType, size, bucket? }
 *   For small files (< 10 MB): returns { uploadUrl, publicUrl }
 *   For large files: returns { uploadId, key, publicUrl } for client-driven multipart
 *
 * POST /api/upload-asset?action=part
 * Body: { key, uploadId, partNumber, size }
 *   Returns: { signedUrl } — browser PUTs the chunk directly
 *
 * POST /api/upload-asset?action=complete
 * Body: { key, uploadId, parts: [{ PartNumber, ETag }] }
 *   Returns: { publicUrl }
 *
 * POST /api/upload-asset?action=abort
 * Body: { key, uploadId }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.query;
  const body = req.body || {};

  // ── Part upload: sign a URL for one chunk ──────────────────────────────────
  if (action === 'part') {
    const { key, uploadId, partNumber, size } = body;
    if (!key || !uploadId || !partNumber) return res.status(400).json({ error: 'Missing fields' });

    const cmd = new UploadPartCommand({
      Bucket:     BUCKET,
      Key:        sanitizeKey(key),
      UploadId:   uploadId,
      PartNumber: Number(partNumber),
      ContentLength: size,
    });
    const signedUrl = await getSignedUrl(assetsR2, cmd, { expiresIn: 300 });
    return res.status(200).json({ signedUrl });
  }

  // ── Complete multipart ──────────────────────────────────────────────────────
  if (action === 'complete') {
    const { key, uploadId, parts } = body;
    if (!key || !uploadId || !Array.isArray(parts)) return res.status(400).json({ error: 'Missing fields' });

    await assetsR2.send(new CompleteMultipartUploadCommand({
      Bucket:   BUCKET,
      Key:      sanitizeKey(key),
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    }));
    return res.status(200).json({ publicUrl: `${PUBLIC_URL}/${sanitizeKey(key)}` });
  }

  // ── Abort multipart ─────────────────────────────────────────────────────────
  if (action === 'abort') {
    const { key, uploadId } = body;
    if (!key || !uploadId) return res.status(400).json({ error: 'Missing fields' });

    try {
      await assetsR2.send(new AbortMultipartUploadCommand({
        Bucket:   BUCKET,
        Key:      sanitizeKey(key),
        UploadId: uploadId,
      }));
    } catch (e) {
      console.warn('[upload-asset] Abort warning:', e.message);
    }
    return res.status(200).json({ ok: true });
  }

  // ── Initiate upload (small: signed PUT URL; large: multipart init) ──────────
  const { key, contentType, size } = body;

  if (!key || !contentType || !size) {
    return res.status(400).json({ error: 'Missing required fields: key, contentType, size' });
  }
  if (size > MAX_SIZE) {
    return res.status(400).json({ error: 'File too large. Max 100 MB.' });
  }

  const safeKey = sanitizeKey(key);

  try {
    if (size >= MULTIPART_THRESHOLD) {
      // Initiate multipart — client handles the chunks
      const initRes = await assetsR2.send(new CreateMultipartUploadCommand({
        Bucket:      BUCKET,
        Key:         safeKey,
        ContentType: contentType,
      }));
      return res.status(200).json({
        uploadId:  initRes.UploadId,
        key:       safeKey,
        publicUrl: `${PUBLIC_URL}/${safeKey}`,
      });
    } else {
      // Small file: single pre-signed PUT
      const cmd = new PutObjectCommand({
        Bucket:        BUCKET,
        Key:           safeKey,
        ContentType:   contentType,
        ContentLength: size,
      });
      const uploadUrl = await getSignedUrl(assetsR2, cmd, { expiresIn: 120 });
      return res.status(200).json({
        uploadUrl,
        publicUrl: `${PUBLIC_URL}/${safeKey}?v=${Date.now()}`,
      });
    }
  } catch (err) {
    console.error('[upload-asset] Error:', err);
    return res.status(500).json({ error: 'Server error generating upload URL' });
  }
}

function sanitizeKey(key) {
  return key.replace(/\.\./g, '').replace(/^\/+/, '');
}
