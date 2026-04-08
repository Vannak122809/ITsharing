import express from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import s3Client from '../utils/r2.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// @desc    Upload a file to R2
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, admin, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const file = req.file;
  const bucketType = req.body.bucketType || 'document';
  const bucket = bucketType === 'image' ? process.env.R2_IMAGE_BUCKET : process.env.R2_BUCKET_NAME;
  
  if (!bucket) {
    res.status(500);
    throw new Error('R2 Bucket not configured');
  }

  // Generate a unique filename using crypto
  const ext = path.extname(file.originalname);
  const hash = crypto.randomBytes(16).toString('hex');
  const filename = `${hash}${ext}`;
  const folder = req.body.folder || 'misc';
  const key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);

    // Compute the public URL
    const publicDomain = bucketType === 'image' ? process.env.R2_IMAGE_PUBLIC_URL : process.env.R2_PUBLIC_URL;
    const fileUrl = publicDomain ? `${publicDomain}/${key}` : `${process.env.R2_ENDPOINT}/${bucket}/${key}`;

    res.status(201).json({
      message: 'File uploaded successfully',
      url: fileUrl,
      key: key,
    });
  } catch (error) {
    console.error('R2 Upload Error:', error);
    res.status(500);
    throw new Error('Failed to upload file to R2');
  }
});

export default router;
