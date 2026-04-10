
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { featuredAssets } from '../src/data/assetsData.js';

const OUTPUT_DIR = './converted_webp';
const INPUT_DIR = './input_images';

// បង្កើត Folder បើមិនទាន់មាន
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });

/**
 * មុខងារសម្រាប់ទាញរូបភាពពី URL និង Convert ជា WebP
 */
async function convertFromAssets() {
    console.log('🚀 ចាប់ផ្ដើមទាញរូបភាពពី Featured Assets...');
    
    for (const asset of featuredAssets) {
        try {
            // បញ្ជី extension ដែលត្រូវសាកល្បង
            const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
            let buffer = null;
            let finalUrl = '';

            // បើមាន sourceUrl ហើយវាជារូបភាព ប្រើវាភ្លាម
            if (asset.sourceUrl && asset.sourceUrl.match(/\.(png|jpg|jpeg|webp)$/i)) {
                const res = await fetch(asset.sourceUrl);
                if (res.ok) buffer = await res.arrayBuffer();
            }

            // បើនៅតែមិនទាន់បាន buffer សាកល្បងរកតាម extension នីមួយៗ
            if (!buffer) {
                for (const ext of extensions) {
                    const tryUrl = asset.url.replace('.webp', ext);
                    const res = await fetch(tryUrl);
                    if (res.ok) {
                        const contentType = res.headers.get('content-type');
                        if (contentType && contentType.startsWith('image/') && !contentType.includes('zip')) {
                            buffer = await res.arrayBuffer();
                            finalUrl = tryUrl;
                            break;
                        }
                    }
                }
            }

            if (!buffer) {
                console.warn(`⚠️ រំលង asset ${asset.id}: មិនអាចរកប្រភពរូបភាពបាន (អាចជា zip ឬ link ងាប់)`);
                continue;
            }

            const fileName = asset.id + '.webp';
            const outputPath = path.join(OUTPUT_DIR, fileName);

            await sharp(Buffer.from(buffer))
                .webp({ quality: 80 })
                .toFile(outputPath);

            console.log(`✅ កែប្រែជោគជ័យ: ${fileName}`);
        } catch (error) {
            console.error(`❌ បរាជ័យសម្រាប់ asset ${asset.id}:`, error.message);
        }
    }
}

/**
 * មុខងារសម្រាប់ Convert រូបភាពពី Folder ក្នុងម៉ាស៊ីន
 */
async function convertFromLocal() {
    console.log('📂 ចាប់ផ្ដើម Convert រូបភាពពី folder input_images...');
    
    const files = fs.readdirSync(INPUT_DIR);
    for (const file of files) {
        if (file.match(/\.(png|jpg|jpeg|tiff)$/i)) {
            const outputPath = path.join(OUTPUT_DIR, file.replace(/\.[^.]+$/, '.webp'));
            await sharp(path.join(INPUT_DIR, file))
                .webp({ quality: 80 })
                .toFile(outputPath);
            console.log(`✅ Local Convert: ${file} -> webp`);
        }
    }
}

// ជ្រើសរើស Run មុខងារណាមួយ
const mode = process.argv[2] || 'local';

if (mode === 'assets') {
    // ចំណាំ៖ ត្រូវការដំឡើង node-fetch: npm install node-fetch
    convertFromAssets();
} else {
    convertFromLocal();
}

console.log('\n✨ បងអាចរកមើលរូបភាពដែល Convert រួចនៅក្នុង folder: ' + path.resolve(OUTPUT_DIR));
