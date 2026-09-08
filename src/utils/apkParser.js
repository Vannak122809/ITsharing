/**
 * apkParser.js — Client-side APK static analysis engine
 * Parses APK files (ZIP format) in the browser, extracts AndroidManifest.xml,
 * analyzes permissions, detects ad SDKs, and computes threat scores.
 * 
 * No backend required — all analysis runs in the browser using JSZip-free approach
 * (manual ZIP parsing with DataView).
 */

import { calculateThreatScore, analyzePermissions, detectDangerousCombos, AD_SDK_SIGNATURES } from './malwareDb';

// ─── ZIP PARSING (APK = ZIP archive) ───

/**
 * Read an APK/ZIP file and extract entries
 * @param {File} file - APK file from input/drag-drop
 * @returns {Promise<Map<string, Uint8Array>>} filename → data
 */
async function readZipEntries(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const entries = new Map();

  // Find End of Central Directory record (scan from end)
  let eocdOffset = -1;
  for (let i = buffer.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) throw new Error('Invalid APK: not a valid ZIP file');

  // Read central directory offset and size
  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const cdSize = view.getUint32(eocdOffset + 12, true);
  const entryCount = view.getUint16(eocdOffset + 10, true);

  // Parse central directory
  let offset = cdOffset;
  for (let i = 0; i < entryCount && offset < cdOffset + cdSize; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const compMethod = view.getUint16(offset + 10, true);
    const compSize = view.getUint32(offset + 20, true);
    const uncompSize = view.getUint32(offset + 24, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    const nameBytes = new Uint8Array(buffer, offset + 46, nameLen);
    const fileName = new TextDecoder().decode(nameBytes);

    // Read from local file header to get actual data
    if (compMethod === 0 && uncompSize > 0) {
      // Only handle stored (uncompressed) files for manifest/cert analysis
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const data = new Uint8Array(buffer, dataStart, uncompSize);
      entries.set(fileName, data);
    } else if (compMethod === 8) {
      // Deflate — try to decompress using DecompressionStream if available
      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compData = new Uint8Array(buffer, dataStart, compSize);

      try {
        if (typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks = [];
          let totalLen = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLen += value.length;
          }
          const result = new Uint8Array(totalLen);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          entries.set(fileName, result);
        }
      } catch {
        // Can't decompress this entry, skip it
        // Store compressed size info for reference
        entries.set(fileName + '.__compressed__', compData);
      }
    }

    offset += 46 + nameLen + extraLen + commentLen;
  }

  return entries;
}


// ─── ANDROID BINARY XML PARSER ───
// AndroidManifest.xml in APKs uses Android's binary XML format (AXML)

const CHUNK_STRINGPOOL = 0x001C0001;
const CHUNK_RESOURCEMAP = 0x00080180;
const CHUNK_START_NS = 0x00100100;
const CHUNK_END_NS = 0x00100101;
const CHUNK_START_TAG = 0x00100102;
const CHUNK_END_TAG = 0x00100103;
const CHUNK_TEXT = 0x00100104;

// Attribute value types
const TYPE_NULL = 0;
const TYPE_REFERENCE = 1;
const TYPE_STRING = 3;
const TYPE_INT_DEC = 16;
const TYPE_INT_HEX = 17;
const TYPE_INT_BOOLEAN = 18;

function parseAxmlStringPool(data, offset) {
  const view = new DataView(data.buffer, data.byteOffset + offset);
  const stringCount = view.getUint32(8, true);
  const flags = view.getUint32(16, true);
  const stringsStart = view.getUint32(20, true);
  const isUTF8 = (flags & (1 << 8)) !== 0;

  const offsets = [];
  for (let i = 0; i < stringCount; i++) {
    offsets.push(view.getUint32(28 + i * 4, true));
  }

  const strings = [];
  const poolStart = offset + 28 + stringCount * 4;

  // Align to 4 bytes for style offsets (skip them)
  const stringDataStart = offset + stringsStart;

  for (let i = 0; i < stringCount; i++) {
    const strOffset = stringDataStart + offsets[i];
    try {
      if (isUTF8) {
        // UTF-8: first byte(s) = char count, then byte count, then data
        let pos = strOffset - data.byteOffset;
        // Skip char count (1-2 bytes)
        let charCount = data[pos];
        pos++;
        if (charCount > 0x7F) pos++;
        // Read byte count
        let byteCount = data[pos];
        pos++;
        if (byteCount > 0x7F) {
          byteCount = ((byteCount & 0x7F) << 8) | data[pos];
          pos++;
        }
        const strBytes = data.slice(pos, pos + byteCount);
        strings.push(new TextDecoder('utf-8').decode(strBytes));
      } else {
        // UTF-16LE
        const dv = new DataView(data.buffer, strOffset);
        let charCount = dv.getUint16(0, true);
        if (charCount > 0x7FFF) {
          charCount = ((charCount & 0x7FFF) << 16) | dv.getUint16(2, true);
        }
        const actualCharCount = Math.min(charCount, 2048); // safety cap
        const strBytes = new Uint16Array(data.buffer, strOffset + 2, actualCharCount);
        strings.push(String.fromCharCode(...strBytes));
      }
    } catch {
      strings.push(`<string_${i}>`);
    }
  }

  return strings;
}

/**
 * Parse Android binary XML (AXML) format from AndroidManifest.xml
 * Returns a simplified object representation of the manifest
 */
function parseAxml(data) {
  if (data.length < 8) return null;

  const view = new DataView(data.buffer, data.byteOffset);

  // Check magic number
  const magic = view.getUint32(0, true);
  if (magic !== 0x00080003 && magic !== 0x00080001) {
    return null; // Not AXML format
  }

  const fileSize = view.getUint32(4, true);
  let strings = [];
  let offset = 8;

  const manifest = {
    package: '',
    versionCode: '',
    versionName: '',
    minSdkVersion: '',
    targetSdkVersion: '',
    permissions: [],
    activities: [],
    services: [],
    receivers: [],
    providers: [],
    features: [],
    intentFilters: [],
  };

  let currentElement = null;
  let elementStack = [];

  while (offset < data.length - 4) {
    const chunkType = view.getUint32(offset, true);
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkSize < 8 || offset + chunkSize > data.length + 8) break;

    switch (chunkType) {
      case CHUNK_STRINGPOOL: {
        strings = parseAxmlStringPool(data, offset);
        break;
      }

      case CHUNK_START_TAG: {
        const attrCount = view.getUint16(offset + 28, true);
        const nameIdx = view.getUint32(offset + 20, true);
        const tagName = strings[nameIdx] || '';

        const attrs = {};
        for (let i = 0; i < attrCount; i++) {
          const attrOffset = offset + 36 + i * 20;
          if (attrOffset + 20 > data.length) break;

          const attrNameIdx = view.getUint32(attrOffset + 4, true);
          const attrValueStringIdx = view.getInt32(attrOffset + 8, true);
          const attrType = view.getUint16(attrOffset + 14, true); // top byte of typedValue
          const attrData = view.getUint32(attrOffset + 16, true);

          const attrName = strings[attrNameIdx] || `attr_${attrNameIdx}`;
          let attrValue;

          switch (attrType >> 8 || attrType) {
            case TYPE_STRING:
              attrValue = attrValueStringIdx >= 0 ? (strings[attrValueStringIdx] || '') : '';
              break;
            case TYPE_INT_DEC:
              attrValue = attrData;
              break;
            case TYPE_INT_HEX:
              attrValue = `0x${attrData.toString(16)}`;
              break;
            case TYPE_INT_BOOLEAN:
              attrValue = attrData !== 0;
              break;
            case TYPE_REFERENCE:
              attrValue = `@0x${attrData.toString(16)}`;
              break;
            default:
              attrValue = attrValueStringIdx >= 0 ? (strings[attrValueStringIdx] || String(attrData)) : String(attrData);
          }

          attrs[attrName] = attrValue;
        }

        // Process based on tag
        if (tagName === 'manifest') {
          manifest.package = attrs.package || attrs['package'] || '';
          manifest.versionCode = attrs.versionCode || attrs['versionCode'] || '';
          manifest.versionName = attrs.versionName || attrs['versionName'] || '';
        }
        else if (tagName === 'uses-sdk') {
          manifest.minSdkVersion = attrs.minSdkVersion || attrs['minSdkVersion'] || '';
          manifest.targetSdkVersion = attrs.targetSdkVersion || attrs['targetSdkVersion'] || '';
        }
        else if (tagName === 'uses-permission') {
          const permName = attrs.name || attrs['name'] || '';
          if (permName) manifest.permissions.push(permName);
        }
        else if (tagName === 'uses-feature') {
          const featName = attrs.name || attrs['name'] || '';
          if (featName) manifest.features.push(featName);
        }
        else if (tagName === 'activity') {
          const actName = attrs.name || attrs['name'] || '';
          const exported = attrs.exported === true || attrs.exported === 'true';
          manifest.activities.push({ name: actName, exported });
        }
        else if (tagName === 'service') {
          const svcName = attrs.name || attrs['name'] || '';
          const exported = attrs.exported === true || attrs.exported === 'true';
          const permission = attrs.permission || attrs['permission'] || '';
          manifest.services.push({ name: svcName, exported, permission });
        }
        else if (tagName === 'receiver') {
          const rcvName = attrs.name || attrs['name'] || '';
          const exported = attrs.exported === true || attrs.exported === 'true';
          manifest.receivers.push({ name: rcvName, exported });
        }
        else if (tagName === 'provider') {
          const prvName = attrs.name || attrs['name'] || '';
          const exported = attrs.exported === true || attrs.exported === 'true';
          manifest.providers.push({ name: prvName, exported });
        }

        elementStack.push(tagName);
        currentElement = tagName;
        break;
      }

      case CHUNK_END_TAG: {
        elementStack.pop();
        currentElement = elementStack[elementStack.length - 1] || null;
        break;
      }
    }

    offset += chunkSize || 4; // ensure progress
  }

  return manifest;
}


// ─── DEX FILE ANALYSIS ───

/**
 * Parse DEX file header for basic metadata and string extraction
 * DEX files contain the actual code — we scan for ad SDK class names
 */
function parseDexStrings(data) {
  if (data.length < 112) return [];

  const view = new DataView(data.buffer, data.byteOffset);

  // Verify DEX magic: "dex\n"
  const magic = String.fromCharCode(data[0], data[1], data[2]);
  if (magic !== 'dex') return [];

  const stringIdsSize = view.getUint32(56, true);
  const stringIdsOff = view.getUint32(60, true);

  // Extract a limited number of strings (first 5000 for performance)
  const maxStrings = Math.min(stringIdsSize, 5000);
  const strings = [];

  for (let i = 0; i < maxStrings; i++) {
    try {
      const strDataOff = view.getUint32(stringIdsOff + i * 4, true);
      if (strDataOff >= data.length) continue;

      // Read ULEB128 string length
      let pos = strDataOff;
      let len = 0;
      let shift = 0;
      while (pos < data.length) {
        const byte = data[pos++];
        len |= (byte & 0x7F) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }

      if (len > 0 && len < 512 && pos + len <= data.length) {
        const strBytes = data.slice(pos, pos + len);
        const str = new TextDecoder('utf-8', { fatal: false }).decode(strBytes);
        // Only keep strings that look like Java class/package names
        if (str.includes('.') && /^[a-zA-Z]/.test(str)) {
          strings.push(str);
        }
      }
    } catch {
      continue;
    }
  }

  return strings;
}


// ─── HASH COMPUTATION ───

/**
 * Compute SHA-256 hash of file data
 */
async function computeSha256(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute MD5 hash (for VirusTotal compatibility)
 * Simple implementation — not crypto-secure, just for fingerprinting
 */
function computeMd5(data) {
  // Using a simple hash for identification purposes
  // Real MD5 would need a full implementation — we rely on SHA-256 primarily
  let hash = 0;
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  for (let i = 0; i < u8.length; i++) {
    hash = ((hash << 5) - hash + u8[i]) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}


// ─── MAIN APK ANALYSIS ───

/**
 * Analyze an APK file completely
 * @param {File} file - APK file from drag-drop or file input
 * @returns {Promise<Object>} Full analysis results
 */
export async function analyzeApk(file) {
  const startTime = performance.now();

  const result = {
    fileName: file.name,
    fileSize: file.size,
    fileSizeMB: (file.size / (1024 * 1024)).toFixed(2),
    sha256: '',
    manifest: null,
    permissions: {
      all: [],
      dangerous: [],
      combos: [],
    },
    adSdks: [],
    components: {
      activities: [],
      services: [],
      receivers: [],
      providers: [],
    },
    threatScore: { score: 0, level: 'safe', reasons: [] },
    analysisTimeMs: 0,
    errors: [],
  };

  try {
    // Compute file hash
    const fileBuffer = await file.arrayBuffer();
    result.sha256 = await computeSha256(fileBuffer);

    // Extract ZIP entries
    let entries;
    try {
      entries = await readZipEntries(file);
    } catch (e) {
      result.errors.push(`ZIP parsing failed: ${e.message}`);
      return result;
    }

    // Parse AndroidManifest.xml
    const manifestData = entries.get('AndroidManifest.xml');
    if (manifestData) {
      try {
        result.manifest = parseAxml(manifestData);
        if (result.manifest) {
          result.permissions.all = result.manifest.permissions;
          result.permissions.dangerous = analyzePermissions(result.manifest.permissions);
          result.permissions.combos = detectDangerousCombos(result.manifest.permissions);
          result.components.activities = result.manifest.activities;
          result.components.services = result.manifest.services;
          result.components.receivers = result.manifest.receivers;
          result.components.providers = result.manifest.providers;
        }
      } catch (e) {
        result.errors.push(`Manifest parsing failed: ${e.message}`);
      }
    } else {
      result.errors.push('AndroidManifest.xml not found in APK');
    }

    // Scan DEX files for ad SDK signatures
    const dexStrings = [];
    for (const [name, data] of entries) {
      if (name.endsWith('.dex') && !name.includes('.__compressed__')) {
        try {
          const strings = parseDexStrings(data);
          dexStrings.push(...strings);
        } catch (e) {
          result.errors.push(`DEX parsing failed for ${name}: ${e.message}`);
        }
      }
    }

    // Match ad SDK signatures
    for (const sig of AD_SDK_SIGNATURES) {
      const found = dexStrings.some(s => s.startsWith(sig.prefix) || s.includes(sig.prefix));
      if (found) {
        result.adSdks.push(sig);
      }
    }

    // Calculate threat score
    const packageName = result.manifest?.package || '';
    const detectedSdkPrefixes = result.adSdks.map(s => s.prefix);
    result.threatScore = calculateThreatScore(
      packageName,
      result.permissions.all,
      detectedSdkPrefixes
    );

    // Add extra scoring based on analysis
    if (result.components.services.some(s => s.name.toLowerCase().includes('accessibility'))) {
      result.threatScore.score = Math.min(result.threatScore.score + 20, 100);
      result.threatScore.reasons.push('Accessibility service detected — potential UI hijacking');
    }

    // Check for suspicious receivers (boot complete, package install)
    const suspiciousReceivers = result.components.receivers.filter(r =>
      r.name.toLowerCase().includes('boot') ||
      r.name.toLowerCase().includes('install') ||
      r.name.toLowerCase().includes('alarm')
    );
    if (suspiciousReceivers.length > 0) {
      result.threatScore.score = Math.min(result.threatScore.score + 5, 100);
      result.threatScore.reasons.push(`${suspiciousReceivers.length} suspicious broadcast receiver(s)`);
    }

    // Recalculate level after adjustments
    if (result.threatScore.score >= 70) result.threatScore.level = 'critical';
    else if (result.threatScore.score >= 40) result.threatScore.level = 'high';
    else if (result.threatScore.score >= 20) result.threatScore.level = 'medium';
    else if (result.threatScore.score >= 5) result.threatScore.level = 'low';
    else result.threatScore.level = 'safe';

  } catch (e) {
    result.errors.push(`Analysis failed: ${e.message}`);
  }

  result.analysisTimeMs = Math.round(performance.now() - startTime);
  return result;
}

/**
 * Get VirusTotal URL for a given SHA-256 hash
 */
export function getVirusTotalUrl(sha256) {
  return `https://www.virustotal.com/gui/file/${sha256}`;
}

/**
 * Get quick summary text for an analysis result
 */
export function getAnalysisSummary(result) {
  const { threatScore, permissions, adSdks, components } = result;
  const lines = [];

  if (threatScore.level === 'safe') {
    lines.push('✅ No significant threats detected.');
  } else if (threatScore.level === 'low') {
    lines.push('⚠️ Low risk — some minor concerns found.');
  } else if (threatScore.level === 'medium') {
    lines.push('🟠 Medium risk — review the findings carefully.');
  } else if (threatScore.level === 'high') {
    lines.push('🔴 High risk — this APK shows suspicious characteristics.');
  } else if (threatScore.level === 'critical') {
    lines.push('🚨 CRITICAL — this APK is likely malicious!');
  }

  lines.push(`Threat Score: ${threatScore.score}/100`);
  lines.push(`Permissions: ${permissions.all.length} total, ${permissions.dangerous.length} dangerous`);
  lines.push(`Ad SDKs: ${adSdks.length} detected`);
  lines.push(`Components: ${components.activities.length} activities, ${components.services.length} services`);

  return lines.join('\n');
}

export default analyzeApk;
