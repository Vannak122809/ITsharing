import { KHQR, TAG, CURRENCY } from 'ts-khqr';
import QRCode from 'qrcode';

export { KHQR, TAG, CURRENCY };

/**
 * Bakong KHQR Service (Powered by ts-khqr)
 * Generates 100% local, offline-capable, standard EMVCo KHQR strings and QR images.
 * Completely eliminates dependency on third-party relays (api.bakongrelay.com, qrserver.com)
 * ensuring seamless operation on Cloudflare Pages, Workers, Vercel, and custom domains.
 */

export const DEFAULT_BAKONG_ACCOUNT = 'vannak_seun@bkrt';
export const DEFAULT_MERCHANT_NAME = 'VANNAK SEUN';

/**
 * Format currency amount for display
 */
export function formatKhqrAmount(amount, currency = 'USD') {
  const num = Number(amount) || 0;
  if (currency === 'KHR') {
    return `${new Intl.NumberFormat('km-KH').format(num)} ៛`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Verify any raw KHQR string
 */
export function verifyKHQR(qrString) {
  return KHQR.verify(qrString);
}

/**
 * Parse any raw KHQR string into structured JSON
 */
export function parseKHQR(qrString) {
  return KHQR.parse(qrString);
}

/**
 * Generates the raw Bakong KHQR string and high-res QR code image data URL
 */
export async function generateBakongKHQR({
  accountID = DEFAULT_BAKONG_ACCOUNT,
  merchantName = DEFAULT_MERCHANT_NAME,
  amount = 1.0,
  currency = 'USD',
  storeLabel = 'ITsharing'
} = {}) {
  try {
    const isUsd = String(currency).toUpperCase() === 'USD';
    const khqrCurrency = isUsd ? CURRENCY.USD : CURRENCY.KHR;
    const numAmount = Number(amount) || 0;

    const payload = {
      tag: TAG.INDIVIDUAL,
      accountID,
      merchantName,
      merchantCity: 'Phnom Penh',
      currency: khqrCurrency,
      additionalData: {
        storeLabel
      }
    };

    if (numAmount > 0) {
      payload.amount = numAmount;
      // NBC Bakong specification requires expiration timestamp for dynamic KHQR (10 min expiry)
      payload.expirationTimestamp = Date.now() + 10 * 60 * 1000;
    }

    const result = KHQR.generate(payload);

    if (!result || result.status?.code !== 0 || !result.data?.qr) {
      throw new Error(result?.status?.message || 'Failed to generate Bakong KHQR');
    }

    const cleanQrText = String(result.data.qr).trim();

    // Generate crisp QR code data URL locally in browser/node
    const qrDataUrl = await QRCode.toDataURL(cleanQrText, {
      width: 500,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return {
      success: true,
      qrString: cleanQrText,
      qrDataUrl,
      md5: result.data.md5 || ''
    };
  } catch (err) {
    console.error('[BakongService] Generation error:', err);
    throw err;
  }
}

export const KHQR_LOGO_PATH =
  'm 0,0.03316065 h 130.12116 l 0.014,318.13267935 C 233.74068,213.55008 443.94173,2.5596428 444.48677,1.0664481 444.9679,-0.25167388 599.68926,-0.32516983 599.68926,0.99272374 486.57317,115.28505 371.72975,227.87418 257.21308,340.76853 c 20.97523,21.33678 282.3634,288.92492 357.65314,368.20425 0.65411,0.68876 -1.66382,0.99992 -77.17034,0.99992 H 459.73294 L 336.53629,585.72505 C 192.18995,440.14727 131.5997,379.75815 130.74116,379.75815 c -0.97346,110.06303 -0.62,220.14479 -0.62,330.21455 H 0 Z M 1208.4296,400.10055 H 842.95884 V 709.9727 H 716.79789 L 716.22858,0.03316065 H 842.95884 V 297.25838 H 1208.4296 V 0.10393571 L 1335.1563,0 v 709.9727 h -126.7267 z m 1514.243,188.60833 c -66.7198,-66.68699 -121.2089,-121.26394 -121.0692,-121.29991 0.1397,-0.036 35.4501,0.18884 78.4672,0.49963 l 78.2133,0.56505 86.4183,85.46964 c 137.7689,136.25637 155.0701,156.03188 154.7403,156.02941 -0.4084,-0.003 -103.6312,-0.51832 -155.4465,0 z M 1560.4467,709.97304 c -16.1379,-0.55379 -32.9532,-10.24556 -46.6705,-19.51539 -6.9569,-4.70134 -19.2747,-16.38202 -26.5809,-25.20617 -5.9447,-7.17977 -15.0496,-25.92873 -18.2971,-37.67776 l -3.055,-11.05251 -0.3309,-256.54041 c -0.359,-278.392633 -0.5867,-266.806561 5.6132,-285.669744 6.3968,-19.462404 20.5256,-39.027764 37.2996,-51.652247 11.1554,-8.39579 20.5183,-13.2107146 35.4908,-18.2513305 l 11.3149,-3.8092509 261.205,-0.29674884 261.205,-0.29674882 11.3309,2.86097216 c 14.8478,3.7488926 26.437,8.6527199 36.7824,15.5638289 20.3137,13.570359 35.5357,32.794807 42.7843,54.033877 6.4483,18.89392 6.1728,5.744005 6.1777,294.858942 v 266.14221 l -55.4189,-55.344 -55.4191,-55.344 -0.3093,-175.76404 c -0.291,-167.92384 -0.3987,-176.04133 -2.4096,-181.97982 -8.8441,-26.11777 -26.8665,-43.73799 -52.2413,-51.0754 l -9.0122,-2.60596 h -181.6039 -181.6039 l -7.3546,2.62867 c -12.3916,4.42895 -21.5422,10.21361 -30.5502,19.31286 -9.677,9.77482 -15.9266,19.7384 -19.5545,31.17478 l -2.5095,7.91094 v 181.38648 c 0,143.66042 0.3021,182.67929 1.4523,187.60223 0.7989,3.41864 3.6817,10.79277 6.4062,16.38694 8.578,17.61255 21.6642,29.51025 40.3928,36.72405 7.7117,2.97044 11.4807,3.67874 23.4647,4.40965 7.8524,0.47892 86.6496,0.72975 175.1047,0.55739 88.4552,-0.17235 162.086,0.0394 163.6242,0.47031 1.5395,0.43146 27.3682,25.03821 57.466,54.74757 l 54.6697,55.30949 h -264.6848 c -145.5766,0 -272.4039,0.0612 -274.1782,3.4e-4 z m 825.7135,-1.19632 c -26.9307,-3.11842 -54.2309,-19.77939 -71.1259,-41.95624 -11.6294,-15.26477 -17.997,-29.27579 -21.0351,-46.28374 -1.9276,-10.79088 -2.2975,-251.84349 -0.4287,-279.39581 3.9643,-58.45084 14.914,-100.14281 38.5348,-146.72478 23.4952,-46.33445 54.5203,-84.65461 93.8058,-115.863057 56.046,-44.522955 118.0676,-69.6753622 189.5243,-76.8600649 50.7725,-5.1049871 107.4757,2.901448 158.9994,22.4505889 18.2153,6.911221 49.0282,22.704492 65.0829,33.358531 28.5306,18.933106 61.4883,48.706502 81.5007,73.626512 34.6076,43.09443 60.4913,97.70145 71.1609,150.12886 4.2544,20.90466 9.2611,68.41547 7.4337,70.54076 -0.4059,0.47222 -25.4026,0.7265 -55.5478,0.56508 l -54.8096,-0.29351 -0.8411,-12.43146 c -1.7656,-26.10028 -7.7173,-54.37893 -14.9847,-71.19845 -0.8057,-1.86472 -3.1133,-7.20461 -5.1278,-11.86641 -18.9374,-43.82127 -52.4615,-82.6438 -93.4721,-108.24536 -72.0624,-44.98604 -158.5339,-49.629366 -235.2042,-12.62994 -60.7818,29.33194 -108.1942,85.64793 -126.5514,150.31634 -9.6873,34.12675 -8.9807,16.73362 -9.4418,231.33736 l -0.4139,192.62077 c -6.3032,-0.0934 -17.0584,-1.19598 -17.0584,-1.19598 z M 1715.9021,485.02273 c -9.8918,-3.24648 -19.6413,-11.95632 -24.217,-21.63467 l -2.9387,-6.21574 V 354.8952 252.61809 l 2.8287,-5.5517 c 4.2081,-8.259 11.6883,-15.94802 19.0063,-19.53718 l 6.4522,-3.16448 h 101.2682 101.2682 l 6.7317,2.70833 c 8.4892,3.41539 16.2362,10.59855 20.5044,19.01219 l 3.3141,6.53284 0.5658,116.21582 c 0.3111,63.9187 0.3536,116.42756 0.094,116.68633 -0.7905,0.78894 -232.4534,0.29825 -234.8781,-0.49751 z';

export const BAKONG_STAR_PATH_1 =
  'M5.12,40.79c.56.55,1.12,1.07,1.66,1.63,1.92,2,3.82,4,5.74,5.95a1,1,0,0,1,.23.73v3.18q0,3.57,0,7.13c0,.32.09.42.4.42q5.06,0,10.11,0a.73.73,0,0,1,.46.25c1,1,2,2.06,3,3.09L31,67.72l1-1q3.18-3.32,6.37-6.64a1,1,0,0,1,.65-.24H49c.3,0,.36-.11.36-.4,0-3.45,0-6.89,0-10.34a1,1,0,0,1,.31-.8c1.56-1.6,3.1-3.21,4.66-4.81a.68.68,0,0,1,.44-.23c1.55,0,3.11,0,4.67,0l.2,0c-.06.08-.09.16-.14.21l-6.18,6.43a.93.93,0,0,0-.28.71c0,4.14,0,8.29,0,12.43,0,.59,0,.59-.58.59h-12a.77.77,0,0,0-.52.22c-2,2-3.92,4.08-5.88,6.12-.93,1-1.87,1.94-2.8,2.92-.18.19-.29.15-.46,0l-3-3.1-5.75-6a.59.59,0,0,0-.4-.16H9.6c-.53,0-.54,0-.54-.56q0-6.24,0-12.5a.87.87,0,0,0-.25-.65C7,48.06,5.18,46.16,3.36,44.27L.13,40.88,0,40.72c.13-.15.24-.3.37-.44l5.68-5.91c.93-1,1.86-1.92,2.76-2.9a1,1,0,0,0,.24-.6q0-6.3,0-12.58c0-.49,0-.49.5-.49q6,0,12,0a.87.87,0,0,0,.67-.29l8.26-8.6c.18-.19.34-.39.54-.63L32.69,10c2.42,2.52,4.84,5,7.27,7.56a.85.85,0,0,0,.55.23l12.07,0c.49,0,.49,0,.49.53q0,6.24,0,12.5a.9.9,0,0,0,.26.68c2,2.08,4,4.17,6,6.26.13.13.24.28.36.42l0,.1H58.54c-1.18,0-2.36,0-3.54,0a.92.92,0,0,1-.61-.26c-1.59-1.63-3.17-3.28-4.74-4.93a1,1,0,0,1-.25-.59q0-5.22,0-10.42c0-.36-.09-.46-.42-.45H39a.84.84,0,0,1-.54-.24Q34.88,17.7,31.35,14c-.2-.21-.33-.25-.56,0-1.42,1.51-2.87,3-4.31,4.5-.92,1-1.84,1.93-2.78,2.88a.9.9,0,0,1-.58.23c-3.29,0-6.58,0-9.86,0h-.48c0,.2,0,.37,0,.54,0,3.36,0,6.72,0,10.09a1.27,1.27,0,0,1-.38,1c-2.35,2.42-4.68,4.87-7,7.3Z';

export const BAKONG_STAR_PATH_2 =
  'M43.88,43.3c-.29.91-.58,1.78-.85,2.66a3.39,3.39,0,0,0-.17.95q0,2.85,0,5.7c0,.35-.13.4-.41.4-1.83,0-3.65,0-5.48,0a4.42,4.42,0,0,0-1.56.47,12.25,12.25,0,0,1-7.45.39c-.69-.18-1.34-.48-2-.71a2.29,2.29,0,0,0-.68-.14c-1.84,0-3.69,0-5.54,0-.36,0-.45-.11-.45-.48,0-1.92,0-3.85,0-5.77a1.82,1.82,0,0,0-.14-.7,13.8,13.8,0,0,1-.66-8.65c.17-.66.43-1.29.63-1.94a3.27,3.27,0,0,0,.17-.87c0-1.9,0-3.8,0-5.7,0-.47,0-.47.47-.47h5.54a1.75,1.75,0,0,0,.71-.16A12.19,12.19,0,0,1,35.5,28a5.59,5.59,0,0,0,2.17.42c1.59,0,3.18,0,4.77,0,.32,0,.42.1.42.44,0,1.9,0,3.8,0,5.7a3.47,3.47,0,0,0,.18,1c.23.82.49,1.62.74,2.43.08.26,0,.35-.26.35-1.06,0-2.13,0-3.19,0A.45.45,0,0,1,40,38c-.26-.63-.51-1.26-.73-1.89a2.51,2.51,0,0,1-.11-.72c0-.92,0-1.85,0-2.77,0-.29-.08-.39-.36-.38-.91,0-1.82,0-2.73,0a2.7,2.7,0,0,1-1-.3,9,9,0,0,0-8.37.17,1.41,1.41,0,0,1-.64.13c-.93,0-1.85,0-2.77,0-.28,0-.37.08-.36.37,0,.94,0,1.88,0,2.82a2.3,2.3,0,0,1-.19.9,9.9,9.9,0,0,0,0,8.66A2.69,2.69,0,0,1,23,46c0,.92,0,1.83,0,2.75,0,.29.07.4.37.39.95,0,1.9,0,2.84,0a1.26,1.26,0,0,1,.57.14,9,9,0,0,0,8.47.1,2.51,2.51,0,0,1,1-.23c.89,0,1.78,0,2.66,0,.27,0,.35-.09.34-.36,0-1,0-2,0-2.92a2.54,2.54,0,0,1,.2-.8c.18-.52.38-1,.6-1.55.06-.13.21-.29.32-.3,1.11,0,2.22,0,3.33,0C43.67,43.23,43.72,43.26,43.88,43.3Z';

/**
 * Draws the official-style Bakong KHQR Payment Stand/Slip Card onto an HTML5 Canvas
 * and returns the composite image as a high-resolution PNG data URL.
 * Matches 100% with the official NBC Bakong Merchant KHQR slip specification:
 * - Rounded card container
 * - Crimson red header banner with 45-degree angle diagonal chamfer cut on the right
 * - Authentic white vector KHQR wordmark in header
 * - Left-aligned Merchant Name
 * - Left-aligned bold Amount with uppercase Currency
 * - Horizontal dashed divider line
 * - Centered high-density QR code
 * - Authentic circular red Bakong blossom star emblem centered in the QR code
 */
export function createBrandedKhqrCard({
  qrDataUrl,
  merchantName = DEFAULT_MERCHANT_NAME,
  amount = 1.0,
  currency = 'USD'
}) {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(qrDataUrl);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(qrDataUrl);

      // Card dimensions (Ultra crisp 2x resolution: 600 x 900)
      const width = 600;
      const height = 900;
      const radius = 28;
      const headerHeight = 120;
      const slant = 80;

      canvas.width = width;
      canvas.height = height;

      // 1. Draw Card Background with Rounded Corners
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(width - radius, 0);
      ctx.quadraticCurveTo(width, 0, width, radius);
      ctx.lineTo(width, height - radius);
      ctx.quadraticCurveTo(width, height, width - radius, height);
      ctx.lineTo(radius, height);
      ctx.quadraticCurveTo(0, height, 0, height - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();
      ctx.clip();

      // Card Body Background (White)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Official Bakong Red Header Banner with 45° Diagonal Chamfer Cut on Right
      ctx.fillStyle = '#CC0000';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, headerHeight + slant);
      ctx.lineTo(width - slant, headerHeight);
      ctx.lineTo(0, headerHeight);
      ctx.closePath();
      ctx.fill();

      // 3. Official White KHQR Logo centered in header
      if (typeof Path2D !== 'undefined') {
        ctx.save();
        ctx.translate(185, 36);
        ctx.scale(0.076, 0.076);
        ctx.fillStyle = '#ffffff';
        ctx.fill(new Path2D(KHQR_LOGO_PATH));
        ctx.restore();
      }

      // 4. Merchant Name (Left-aligned)
      ctx.fillStyle = '#111827';
      ctx.font = '600 32px "Kantumruy Pro", "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(merchantName, 55, 205);

      // 5. Amount & Currency (Left-aligned)
      const isUsd = String(currency).toUpperCase() === 'USD';
      let numStr = '';
      if (isUsd) {
        numStr = Number(amount).toFixed(2);
      } else {
        numStr = Number(amount) === 0 ? '0.00' : new Intl.NumberFormat('en-US').format(Number(amount));
      }

      ctx.fillStyle = '#000000';
      ctx.font = '800 48px "Inter", -apple-system, sans-serif';
      ctx.fillText(numStr, 55, 265);

      const amtWidth = ctx.measureText(numStr).width;
      ctx.fillStyle = '#374151';
      ctx.font = '500 24px "Inter", -apple-system, sans-serif';
      ctx.fillText(String(currency).toUpperCase(), 55 + amtWidth + 14, 265);

      // 6. Dashed Separator Line
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 305);
      ctx.lineTo(width, 305);
      ctx.stroke();
      ctx.restore();

      // 7. Draw QR Code in Center
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        const qrSize = 510;
        const qrX = (width - qrSize) / 2;
        const qrY = 335;

        // Draw the QR image
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // 8. Official Center Bakong Emblem inside QR code
        const centerX = width / 2;
        const centerY = qrY + qrSize / 2;

        // White Circular Mask to clear QR blocks cleanly
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
        ctx.fill();

        // Red Circular Emblem Badge
        ctx.fillStyle = '#CC0000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 34, 0, Math.PI * 2);
        ctx.fill();

        // Draw Official White Bakong Star Blossom
        if (typeof Path2D !== 'undefined') {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.scale(0.78, 0.78);
          ctx.translate(-30, -32.5);
          ctx.fillStyle = '#ffffff';
          ctx.fill(new Path2D(BAKONG_STAR_PATH_1));
          ctx.fill(new Path2D(BAKONG_STAR_PATH_2));
          ctx.restore();
        }

        ctx.restore();

        try {
          const cardDataUrl = canvas.toDataURL('image/png');
          resolve(cardDataUrl);
        } catch {
          resolve(qrDataUrl);
        }
      };

      qrImg.onerror = () => {
        ctx.restore();
        resolve(qrDataUrl);
      };

      qrImg.src = qrDataUrl;
    } catch (err) {
      console.warn('[BakongService] Canvas error:', err);
      resolve(qrDataUrl);
    }
  });
}

export const DEFAULT_BAKONG_TOKEN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BAKONG_TOKEN) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiZmI3ZTE0MWI2OGQzNDdkYyJ9LCJpYXQiOjE3OTI0NzQ4MzksImV4cCI6MTgwMDI1MDgzOX0.-Zy6jl7JA1WBzMWZKckjVliOUAwduasLeaVrJlZkBgs';

/**
 * Checks the real-time payment status of a Bakong KHQR using its MD5 hash.
 * Queries NBC Bakong Open API.
 * @param {string} md5 - The MD5 hash of the generated KHQR
 * @returns {Promise<{ isPaid: boolean, data?: object, raw?: object }>}
 */
export async function checkBakongPayment(md5, customToken = null) {
  if (!md5) return { isPaid: false };
  const token = customToken || DEFAULT_BAKONG_TOKEN;

  // 1. Try local/same-origin proxy first
  try {
    const proxyRes = await fetch('/api/check-bakong-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ md5 })
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.responseCode === 0 && data.data) {
        return { isPaid: true, data: data.data, raw: data };
      }
      if (data && typeof data.responseCode === 'number') {
        return { isPaid: false, raw: data };
      }
    }
  } catch {
    // Fallback to production Vercel proxy
  }

  // 1b. Fallback to production Vercel proxy (handles Cloudflare Pages, custom domains, previews)
  try {
    const vercelRes = await fetch('https://itsharing.vercel.app/api/check-bakong-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ md5 })
    });
    if (vercelRes.ok) {
      const data = await vercelRes.json();
      if (data && data.responseCode === 0 && data.data) {
        return { isPaid: true, data: data.data, raw: data };
      }
      if (data && typeof data.responseCode === 'number') {
        return { isPaid: false, raw: data };
      }
    }
  } catch {
    // Fallback to direct NBC API
  }

  // 2. Direct NBC Bakong Open API request
  try {
    const directRes = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ md5 })
    });

    const data = await directRes.json();
    if (data && data.responseCode === 0 && data.data) {
      return { isPaid: true, data: data.data, raw: data };
    }
    return { isPaid: false, raw: data };
  } catch (err) {
    console.warn('[BakongService] Check payment error:', err);
    return { isPaid: false, error: err.message };
  }
}

/**
 * Synthesizes a celebratory payment received chime (Ding-Ding-Dong!)
 * using the HTML5 Web Audio API. 100% offline, zero external audio asset downloads.
 */
export function playPaymentSuccessSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.15 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.15 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.25 }, // G5
      { freq: 1046.5, time: 0.40, dur: 0.60 }  // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur);
    });
  } catch (err) {
    console.warn('[BakongService] Audio chime error:', err);
  }
}

