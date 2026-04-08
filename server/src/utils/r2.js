import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a signed URL for a file in R2
 * @param {string} bucket - Bucket name
 * @param {string} key - File key (path)
 * @param {number} expiresIn - Expiration in seconds (default 1 hour)
 */
export const getPresignedUrl = async (bucket, key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn });
};

export default s3Client;
