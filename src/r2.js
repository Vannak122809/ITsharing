import { S3Client } from "@aws-sdk/client-s3";

// Your Cloudflare R2 Configuration
// Ensure you create R2 API keys and a bucket in the Cloudflare Dashboard
export const r2Client = new S3Client({
  region: "auto",
  endpoint: "https://baefceb90c0d256e27440b3d07f4631e.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "3e6da7821e3dcf7f241da16746438d16",
    secretAccessKey: "47ad76cb6e267453a3e37af30d85dac79d5abc9c445fd77dca8fdc97dac165ab",
  },
});

export const BUCKET_NAME = "document";
