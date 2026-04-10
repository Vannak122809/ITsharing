
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './converted_webp';
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const urls = [
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/star%203.png',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/star1.png',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/stars.png',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/untitled.png',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/%E1%9E%80%E1%9F%92%E1%9E%9A%E1%9E%98%E1%9E%B6.jpg',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/%E1%9E%8F%E1%9F%92%E1%9E%9A%E1%9E%BB%E1%9E%8A%E1%9E%B7.png',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/%E1%9E%8F%E1%9F%92%E1%9E%9A%E1%9E%BB%E1%9E%8A%E1%9E%B7%E1%9F%A2.png',
    'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev/PNG/png/%E1%9E%8F%E1%9F%92%E1%9E%9A%E1%9E%BB%E1%9E%8A%E1%9E%B7%E1%9F%A3.png'
];

async function convertList() {
    console.log('🚀 ចាប់ផ្ដើម Convert បញ្ជីរូបភាពពិសេស...');
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Download failed for ${url}`);
            
            const buffer = await response.arrayBuffer();
            const originalName = decodeURIComponent(url.split('/').pop());
            const fileName = originalName.replace(/\.[^.]+$/, '') + '.webp';
            const outputPath = path.join(OUTPUT_DIR, fileName);

            await sharp(Buffer.from(buffer))
                .webp({ quality: 80 })
                .toFile(outputPath);

            console.log(`✅ រួចរាល់: ${fileName}`);
        } catch (e) {
            console.error(`❌ បរាជ័យ: ${url}`, e.message);
        }
    }
}

convertList();
