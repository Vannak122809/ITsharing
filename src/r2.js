import { S3Client } from "@aws-sdk/client-s3";

// Your Cloudflare R2 Configuration
// Ensure you create R2 API keys and a bucket in the Cloudflare Dashboard
export const r2Client = new S3Client({
  region: "auto",
  endpoint: "https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "YOUR_R2_ACCESS_KEY_ID",
    secretAccessKey: "YOUR_R2_SECRET_ACCESS_KEY",
  },
});

export const BUCKET_NAME = "it-sharing-bucket";
