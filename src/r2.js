import { S3Client } from "@aws-sdk/client-s3";

// ── Documents bucket ("document") ────────────────────────────────────────────
export const r2Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId:     import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});
export const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;

// ── Image bucket ("image") — for avatars, cover photos, user uploads ──────────
export const imageR2Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_IMAGE_ENDPOINT,
  credentials: {
    accessKeyId:     import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});
export const IMAGE_BUCKET     = import.meta.env.VITE_R2_IMAGE_BUCKET;
export const IMAGE_PUBLIC_URL = import.meta.env.VITE_R2_IMAGE_PUBLIC_URL;
