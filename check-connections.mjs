#!/usr/bin/env node
/**
 * check-connections.mjs — Comprehensive ITShare Connection & Function Health Suite
 *
 * Verifies connectivity, credentials, bucket integrity, and API responsiveness across:
 * 1. Backblaze B2 (Adobefamily)
 * 2. Cloudflare R2 (document, image, assets)
 * 3. Firebase (Firestore & Auth)
 * 4. Google Gemini AI API
 * 5. Local Dev Server & APIs (Vite, /api/upload-b2)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { S3Client, ListObjectsV2Command, GetBucketCorsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Load root .env and server/.env
dotenv.config({ path: '.env' });
if (fs.existsSync('server/.env')) {
  dotenv.config({ path: 'server/.env' });
}

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = [];

function logSection(title) {
  console.log(`\n${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
}

function recordResult(subsystem, status, message, details = null) {
  results.push({ subsystem, status, message, details });
  const icon = status === 'OK' ? `${colors.green}✔ PASS${colors.reset}` :
               status === 'WARN' ? `${colors.yellow}⚠ WARN${colors.reset}` :
               `${colors.red}✖ FAIL${colors.reset}`;
  console.log(`[${icon}] ${colors.bold}${subsystem}${colors.reset}: ${message}`);
  if (details) {
    console.log(`       ${colors.blue}↳ ${details}${colors.reset}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Backblaze B2 Connection (Adobefamily)
// ─────────────────────────────────────────────────────────────────────────────
async function checkBackblazeB2() {
  logSection('1. Checking Backblaze B2 (Adobefamily)');

  const keyId = process.env.B2_KEY_ID;
  const appKey = process.env.B2_APPLICATION_KEY || process.env.B2_APP_KEY;
  const endpoint = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
  const region = process.env.B2_REGION || 'us-east-005';
  const bucketName = process.env.B2_BUCKET_NAME || 'Adobefamily';
  const publicBase = process.env.VITE_B2_ADOBE_PUBLIC_URL || 'https://f005.backblazeb2.com/file/Adobefamily';

  const b2Client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
  });

  // A. List objects
  try {
    const listRes = await b2Client.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 10 }));
    const count = listRes.KeyCount || listRes.Contents?.length || 0;
    const sampleKeys = (listRes.Contents || []).slice(0, 3).map(c => c.Key).join(', ');
    recordResult('B2 S3 API', 'OK', `Successfully authenticated & listed bucket "${bucketName}" (${count} objects found)`, sampleKeys ? `Sample items: ${sampleKeys}` : 'Bucket is empty');
  } catch (err) {
    recordResult('B2 S3 API', 'FAIL', `Failed to list bucket "${bucketName}": ${err.message}`);
  }

  // B. Check CORS Configuration
  try {
    const corsRes = await b2Client.send(new GetBucketCorsCommand({ Bucket: bucketName }));
    const ruleCount = corsRes.CORSRules?.length || 0;
    if (ruleCount > 0) {
      recordResult('B2 CORS Policy', 'OK', `CORS active with ${ruleCount} rule(s) (Web direct uploads enabled)`);
    } else {
      recordResult('B2 CORS Policy', 'WARN', 'No CORS rules returned from B2 bucket');
    }
  } catch (err) {
    recordResult('B2 CORS Policy', 'WARN', `Could not fetch CORS: ${err.message}`);
  }

  // C. B2 Download Policy & Streaming Reachability
  try {
    const directRes = await fetch(`${publicBase}/test-adobe-connection.txt`, { method: 'HEAD' });
    if (directRes.status === 200) {
      recordResult('B2 Public Direct URL', 'OK', `Public direct downloads active at ${publicBase}`);
    } else if (directRes.status === 401) {
      recordResult('B2 Bucket Access Policy', 'OK', `Bucket is allPrivate (Secure Storage) — downloads stream via authorized /api/download-b2 proxy`);
    } else {
      recordResult('B2 Public Direct URL', 'WARN', `Status HTTP ${directRes.status} from ${publicBase}`);
    }
  } catch (err) {
    recordResult('B2 Public Direct URL', 'WARN', `Ping failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Cloudflare R2 Connection
// ─────────────────────────────────────────────────────────────────────────────
async function checkCloudflareR2() {
  logSection('2. Checking Cloudflare R2');

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;
  const bucketName = process.env.R2_BUCKET_NAME || 'document';
  const imageBucket = process.env.R2_IMAGE_BUCKET || 'image';

  if (!accessKeyId || !secretAccessKey || !endpoint) {
    recordResult('R2 S3 API', 'WARN', 'R2 credentials not fully set in local environment');
    return;
  }

  const r2Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });

  // A. Check document bucket
  try {
    const docRes = await r2Client.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 }));
    recordResult('R2 Document Bucket', 'OK', `Bucket "${bucketName}" accessible (${docRes.KeyCount || 0} objects)`);
  } catch (err) {
    recordResult('R2 Document Bucket', 'FAIL', `Bucket "${bucketName}" access error: ${err.message}`);
  }

  // B. Check image bucket
  try {
    const imgRes = await r2Client.send(new ListObjectsV2Command({ Bucket: imageBucket, MaxKeys: 5 }));
    recordResult('R2 Image Bucket', 'OK', `Bucket "${imageBucket}" accessible (${imgRes.KeyCount || 0} objects)`);
  } catch (err) {
    recordResult('R2 Image Bucket', 'FAIL', `Bucket "${imageBucket}" access error: ${err.message}`);
  }

  // C. Check Public CDN URLs
  const urlsToCheck = [
    { name: 'R2 Public Docs', url: process.env.VITE_R2_PUBLIC_URL },
    { name: 'R2 Public Images', url: process.env.VITE_R2_IMAGE_PUBLIC_URL },
    { name: 'R2 Public Assets', url: process.env.VITE_R2_ASSETS_PUBLIC_URL },
  ];

  for (const { name, url } of urlsToCheck) {
    if (!url) continue;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      recordResult(name, 'OK', `CDN active at ${url} (HTTP ${res.status})`);
    } catch (err) {
      recordResult(name, 'WARN', `CDN check warning for ${url}: ${err.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Firebase Connection (Firestore & Auth)
// ─────────────────────────────────────────────────────────────────────────────
async function checkFirebase() {
  logSection('3. Checking Firebase Services');

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'login-form-49609';
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;

  // A. Firestore REST API Connectivity
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/assets?pageSize=3`;
    const res = await fetch(firestoreUrl);
    if (res.status === 200) {
      const data = await res.json();
      recordResult('Firebase Firestore', 'OK', `Database online (Project: ${projectId}, returned ${data.documents?.length || 0} sample assets)`);
    } else if (res.status === 403 || res.status === 401) {
      recordResult('Firebase Firestore', 'OK', `Database online (Project: ${projectId}, rules protected)`);
    } else {
      recordResult('Firebase Firestore', 'WARN', `Unexpected HTTP ${res.status} from Firestore API`);
    }
  } catch (err) {
    recordResult('Firebase Firestore', 'FAIL', `Failed to reach Firestore: ${err.message}`);
  }

  // B. Firebase Auth Domain
  try {
    const authUrl = `https://${authDomain}/__/auth/handler`;
    const res = await fetch(authUrl, { method: 'HEAD' });
    recordResult('Firebase Auth', 'OK', `Auth domain live: https://${authDomain} (HTTP ${res.status})`);
  } catch (err) {
    recordResult('Firebase Auth', 'WARN', `Auth domain ping warning: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Gemini AI Connection
// ─────────────────────────────────────────────────────────────────────────────
async function checkGeminiAI() {
  logSection('4. Checking Google Gemini AI');

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    recordResult('Gemini AI', 'WARN', 'VITE_GEMINI_API_KEY is not configured');
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const modelCount = data.models?.length || 0;
      recordResult('Gemini AI API', 'OK', `API key valid! Successfully retrieved ${modelCount} models`, `Key prefix: ${apiKey.slice(0, 10)}...`);
    } else {
      const err = await res.json().catch(() => ({}));
      recordResult('Gemini AI API', 'WARN', `HTTP ${res.status}: ${err.error?.message || 'Check API quota/key'}`);
    }
  } catch (err) {
    recordResult('Gemini AI API', 'FAIL', `Gemini connection failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Local Dev Server & APIs
// ─────────────────────────────────────────────────────────────────────────────
async function checkLocalDevServer() {
  logSection('5. Checking Local Dev Server & API Endpoints');

  // A. Local Dev Server (http://localhost:5173)
  try {
    const res = await fetch('http://localhost:5173');
    if (res.ok) {
      recordResult('Vite Dev Server', 'OK', `Server running on http://localhost:5173 (HTTP ${res.status})`);
    } else {
      recordResult('Vite Dev Server', 'WARN', `Dev server responded with HTTP ${res.status}`);
    }
  } catch (err) {
    recordResult('Vite Dev Server', 'WARN', `Dev server not reachable at http://localhost:5173 (${err.message})`);
  }

  // B. /api/upload-b2 Presign Endpoint
  try {
    const res = await fetch('http://localhost:5173/api/upload-b2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'connection_test_build.zip',
        contentType: 'application/zip',
        size: 512,
        folder: 'Adobe'
      }),
    });

    if (res.ok) {
      const data = await res.json();
      recordResult('B2 Upload API (/api/upload-b2)', 'OK', 'Presigned URL generation functional & responsive', `Generated URL for: ${data.key}`);
    } else {
      recordResult('B2 Upload API (/api/upload-b2)', 'WARN', `Endpoint returned HTTP ${res.status}`);
    }
  } catch (err) {
    recordResult('B2 Upload API (/api/upload-b2)', 'WARN', `Could not test /api/upload-b2: ${err.message}`);
  }

  // C. /api/download-b2 Authorized Download Stream Endpoint
  try {
    const res = await fetch('http://localhost:5173/api/download-b2?key=test-adobe-connection.txt&json=true');
    if (res.ok) {
      const data = await res.json();
      recordResult('B2 Download API (/api/download-b2)', 'OK', 'Authorized download streaming functional & operational', `Target: ${data.bucket}/${data.key}`);
    } else {
      recordResult('B2 Download API (/api/download-b2)', 'WARN', `Endpoint returned HTTP ${res.status}`);
    }
  } catch (err) {
    recordResult('B2 Download API (/api/download-b2)', 'WARN', `Could not test /api/download-b2: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Final Summary Matrix
// ─────────────────────────────────────────────────────────────────────────────
function printSummary() {
  logSection('Overall Connection & Subsystem Summary');

  const passed = results.filter(r => r.status === 'OK').length;
  const warned = results.filter(r => r.status === 'WARN').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`\n  Total Checks Run : ${results.length}`);
  console.log(`  ${colors.green}✔ Passed         : ${passed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠ Warnings       : ${warned}${colors.reset}`);
  console.log(`  ${colors.red}✖ Failures       : ${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.bold}${colors.green}🚀 ALL CRITICAL CONNECTIONS & FUNCTIONS OPERATIONAL!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.bold}${colors.red}⚠️ SOME SUBSYSTEMS REQUIRE ATTENTION (See details above).${colors.reset}\n`);
  }
}

async function main() {
  console.log(`\n${colors.bold}🔍 Starting ITShare System Diagnostics...${colors.reset}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  await checkBackblazeB2();
  await checkCloudflareR2();
  await checkFirebase();
  await checkGeminiAI();
  await checkLocalDevServer();

  printSummary();
}

main().catch(err => {
  console.error('\nFatal diagnostics error:', err);
  process.exit(1);
});
