import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY;
const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-east-005';
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'Adobefamily';

const b2Client = new S3Client({
  endpoint: B2_ENDPOINT,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_KEY_ID,
    secretAccessKey: B2_APP_KEY,
  },
});

/**
 * GET /api/download-b2?key=<fileKey>&json=true|false
 * Generates an authorized, high-speed download link for Backblaze B2 (Adobefamily).
 * Defaults to a 302 redirect for direct browser downloads.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query || {};
  const fileKey = query.key || query.file;
  if (!fileKey) {
    return res.status(400).json({ error: 'Missing file key parameter (key or file)' });
  }

  const cleanKey = decodeURIComponent(fileKey).replace(/^[/\\]+/, '').replace(/\.\./g, '');
  const fileName = cleanKey.split('/').pop();

  try {
    const cmd = new GetObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: cleanKey,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    // Authorized download link valid for 24 hours
    const downloadUrl = await getSignedUrl(b2Client, cmd, { expiresIn: 86400 });

    if (query.json === 'true') {
      return res.status(200).json({
        downloadUrl,
        key: cleanKey,
        bucket: B2_BUCKET_NAME,
        provider: 'backblazeb2'
      });
    }

    res.setHeader('Location', downloadUrl);
    return res.status(302).end();
  } catch (err) {
    console.error('[download-b2] Error generating download URL:', err);
    return res.status(500).json({ error: `Download authorization failed: ${err.message}` });
  }
}
