import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
 * Upload Asset to a specific bucket with progress and binary support
 */
export const uploadAssetToR2 = async (file, folder = "PNG", customBucket = null) => {
    try {
        const bucket = customBucket || ASSETS_BUCKET;
        const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

        // Convert File to ArrayBuffer for better browser compatibility
        const arrayBuffer = await file.arrayBuffer();

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: fileName,
            Body: new Uint8Array(arrayBuffer),
            ContentType: file.type || 'application/octet-stream',
        });

        console.log(`Starting upload to bucket: ${bucket}, folder: ${folder}`);
        await assetsR2Client.send(command);
        console.log("Upload successful:", fileName);
        
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
