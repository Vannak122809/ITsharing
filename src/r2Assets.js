import { 
    S3Client, 
    PutObjectCommand, 
    CreateMultipartUploadCommand, 
    UploadPartCommand, 
    CompleteMultipartUploadCommand, 
    AbortMultipartUploadCommand 
} from "@aws-sdk/client-s3";

// New API credentials for ASSETS (images bucket)
const ASSETS_R2_CONFIG = {
    endpoint: "https://afc8f38c940133b77dd8471acb9bbe80.r2.cloudflarestorage.com",
    accessKeyId: "b118760e0f426939ff20bd757a7aa6fe",
    secretAccessKey: "fc2b5126cf9661b1473ceb22f1015bfb3d891577d726bdcbb0c47617506b3adc",
    bucketName: "image",
    publicUrl: "https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev"
};

export const assetsR2Client = new S3Client({
    region: "auto",
    endpoint: ASSETS_R2_CONFIG.endpoint,
    credentials: {
        accessKeyId: ASSETS_R2_CONFIG.accessKeyId,
        secretAccessKey: ASSETS_R2_CONFIG.secretAccessKey,
    },
    // Important for R2
    forcePathStyle: true,
});

export const ASSETS_BUCKET = ASSETS_R2_CONFIG.bucketName;
export const ASSETS_PUBLIC_URL = ASSETS_R2_CONFIG.publicUrl;

/**
 * Reusable helper to upload a file in chunks (Multipart Upload) to Cloudflare R2.
 * This is crucial for files > 100MB (like software, Windows ISOs, zip files, etc.) 
 * to prevent high RAM usage in browser and bypass Cloudflare edge body limits.
 */
export const multipartUpload = async (client, { Bucket, Key, Body, ContentType, onProgress }) => {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunk size
    const fileSize = Body.size;
    const totalParts = Math.ceil(fileSize / CHUNK_SIZE);
    let uploadId = null;

    try {
        console.log(`[R2 Multipart] Initiating upload for key: ${Key} (Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB, Parts: ${totalParts})`);
        const initResponse = await client.send(new CreateMultipartUploadCommand({
            Bucket,
            Key,
            ContentType,
        }));
        uploadId = initResponse.UploadId;

        const parts = [];
        let uploadedBytes = 0;

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const start = (partNumber - 1) * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, fileSize);
            
            // Slice the file/blob. Slice is fast & memory efficient (lazy reading)
            const chunk = Body.slice(start, end);
            const chunkBuffer = new Uint8Array(await chunk.arrayBuffer());

            let attempts = 0;
            const maxAttempts = 3;
            let success = false;
            let uploadPartResponse;

            while (attempts < maxAttempts && !success) {
                try {
                    attempts++;
                    uploadPartResponse = await client.send(new UploadPartCommand({
                        Bucket,
                        Key,
                        UploadId: uploadId,
                        PartNumber: partNumber,
                        Body: chunkBuffer,
                    }));
                    success = true;
                } catch (err) {
                    console.warn(`[R2 Multipart] Part #${partNumber} failed (attempt ${attempts}/${maxAttempts}):`, err.message);
                    if (attempts >= maxAttempts) throw err;
                    // Wait with exponential backoff: 2s, 4s, 8s...
                    await new Promise((res) => setTimeout(res, Math.pow(2, attempts) * 1000));
                }
            }

            parts.push({
                ETag: uploadPartResponse.ETag,
                PartNumber: partNumber,
            });

            uploadedBytes += (end - start);
            if (onProgress) {
                onProgress(Math.round((uploadedBytes / fileSize) * 100));
            }
        }

        console.log(`[R2 Multipart] Completing upload for key: ${Key}`);
        await client.send(new CompleteMultipartUploadCommand({
            Bucket,
            Key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts,
            },
        }));

        console.log(`[R2 Multipart] Successfully uploaded: ${Key}`);
    } catch (error) {
        console.error(`[R2 Multipart] Fatal upload failure for key: ${Key}:`, error);
        if (uploadId) {
            try {
                console.log(`[R2 Multipart] Aborting upload with ID: ${uploadId}`);
                await client.send(new AbortMultipartUploadCommand({
                    Bucket,
                    Key,
                    UploadId: uploadId,
                }));
            } catch (abortError) {
                console.error("[R2 Multipart] Failed to abort multipart upload:", abortError.message);
            }
        }
        throw error;
    }
};

/**
 * Upload Asset to a specific bucket with progress and binary support.
 * Automatically chooses between standard PUT and chunked Multipart upload based on file size.
 */
export const uploadAssetToR2 = async (file, folder = "PNG", customBucket = null, onProgress = null) => {
    try {
        const bucket = customBucket || ASSETS_BUCKET;
        const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

        // Threshold for multipart: 10 MB. Files over this threshold use chunked multipart upload.
        const MULTIPART_THRESHOLD = 10 * 1024 * 1024;

        if (file.size >= MULTIPART_THRESHOLD) {
            await multipartUpload(assetsR2Client, {
                Bucket: bucket,
                Key: fileName,
                Body: file,
                ContentType: file.type || 'application/octet-stream',
                onProgress,
            });
        } else {
            console.log(`[R2 Put] Uploading small file: ${fileName} (${(file.size / 1024).toFixed(2)} KB)`);
            const arrayBuffer = await file.arrayBuffer();

            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: fileName,
                Body: new Uint8Array(arrayBuffer),
                ContentType: file.type || 'application/octet-stream',
            });

            await assetsR2Client.send(command);
            if (onProgress) onProgress(100);
            console.log("[R2 Put] Upload successful:", fileName);
        }
        
        return fileName;
    } catch (error) {
        console.error("Critical R2 Upload Error:", error);
        // Throw a more readable error
        if (error.name === 'SignatureDoesNotMatch') {
            throw new Error("Invalid R2 Credentials (Secret Key or Access Key is wrong).");
        } else if (error.name === 'NoSuchBucket') {
            throw new Error(`The bucket "${customBucket || ASSETS_BUCKET}" does not exist in your Cloudflare R2.`);
        }
        throw error;
    }
};

/**
 * Convert Image to WebP using Canvas API
 */
export const convertToWebP = async (file, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Max size check to prevent canvas crash (optional but safe)
                const MAX_WIDTH = 4096;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('WebP Conversion Failed'));
                }, 'image/webp', quality);
            };
            img.onerror = () => reject(new Error('Image Load Error'));
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('File Read Error'));
        reader.readAsDataURL(file);
    });
};
