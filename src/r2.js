/**
 * r2.js — Browser-safe R2 configuration
 *
 * Only public CDN URLs are exposed here.
 * All write operations go through the server-side /api/upload-url endpoint.
 * The S3Client is kept for any legacy read-only list operations in admin tooling,
 * but secrets are now server-only — set VITE_R2_* only for public read-only values.
 */

// Public CDN base URLs — safe to expose in the browser bundle
export const BUCKET_NAME      = import.meta.env.VITE_R2_BUCKET_NAME || 'document';
export const IMAGE_BUCKET     = import.meta.env.VITE_R2_IMAGE_BUCKET || 'image';
export const IMAGE_PUBLIC_URL = import.meta.env.VITE_R2_IMAGE_PUBLIC_URL;

// For backward compat: anything importing r2Client for reads uses the public URL helper below
// DO NOT import this for write operations — use /api/upload-url instead
export const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

// Dummy stub so old imports don't crash. Write calls must be migrated to /api/upload-url.
// This intentionally throws if used for writes so we catch any missed migrations.
export const r2Client = {
  send: () => {
    throw new Error(
      '[r2Client] Direct R2 writes from the browser are disabled for security. ' +
      'Use /api/upload-url instead.'
    );
  },
};

export const imageR2Client = r2Client;
