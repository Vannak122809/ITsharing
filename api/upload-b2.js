import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY;
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-east-005';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'Adobefamily';
const B2_PUBLIC_URL = process.env.B2_PUBLIC_URL || 'https://f005.backblazeb2.com/file/Adobefamily';

const b2Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
});

/**
 * POST /api/upload-b2
 * Generates an authorized pre-signed PUT URL directly to Backblaze B2 (Adobefamily).
 * All Adobe Family software files and installers are routed through this endpoint.
 *
 * Body: { fileName, contentType, size, folder }
 * Returns: { uploadUrl, publicUrl, key, bucket }
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  const { fileName, contentType, size, folder } = req.body || {};

  if (!fileName) {
    return res.status(400).json({ error: 'Missing required field: fileName' });
  }

  // Clean filename and prevent path traversal
  const sanitizedBase = fileName
    .replace(/[\\/]/g, '_')
    .replace(/\.\./g, '')
    .trim();

  const folderPrefix = folder ? `${folder.replace(/[\\/]/g, '_').trim()}/` : '';
  const finalKey = `${folderPrefix}${sanitizedBase}`;

  try {
    const cmd = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: finalKey,
      ContentType: contentType || 'application/octet-stream',
    });

    // Valid for 2 hours (7200 seconds) for large Adobe installer uploads
    const uploadUrl = await getSignedUrl(b2Client, cmd, { expiresIn: 7200 });
    const publicUrl = `${B2_PUBLIC_URL}/${encodeURIComponent(finalKey)}`;

    return res.status(200).json({
      uploadUrl,
      publicUrl,
      key: finalKey,
      bucket: B2_BUCKET_NAME,
      provider: 'backblazeb2',
    });
  } catch (err) {
    console.error('[upload-b2] Failed to generate signed URL:', err);
    return res.status(500).json({ error: `B2 Presign Error: ${err.message}` });
  }
}
