import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
import QRCode from 'qrcode';

/**
 * Bakong KHQR Service
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
    const khqrCurrency = isUsd ? khqrData.currency.usd : khqrData.currency.khr;
    const numAmount = Number(amount) || 0;

    const info = new IndividualInfo(
      accountID,
      khqrCurrency,
      merchantName,
      'Phnom Penh',
      {
        amount: numAmount > 0 ? numAmount : undefined,
        storeLabel
      }
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(info);

    let qrString = '';
    let md5 = '';

    if (result && result.data && result.data.qr) {
      qrString = result.data.qr;
      md5 = result.data.md5 || '';
    } else if (result && result.status && result.status.code === 0 && result.data?.qr) {
      qrString = result.data.qr;
      md5 = result.data.md5 || '';
    } else {
      throw new Error(result?.status?.message || 'Failed to generate Bakong KHQR');
    }

    // Generate crisp QR code data URL locally in browser/node
    const qrDataUrl = await QRCode.toDataURL(qrString, {
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
      qrString,
      qrDataUrl,
      md5
    };
  } catch (err) {
    console.error('[BakongService] Generation error:', err);
    throw err;
  }
}

/**
 * Draws the official-style Bakong KHQR Payment Stand/Card onto an HTML5 Canvas
 * and returns the composite image as a high-resolution PNG data URL.
 * Works completely in-browser with zero external requests.
 */
export function createBrandedKhqrCard({
  qrDataUrl,
  merchantName = DEFAULT_MERCHANT_NAME,
  amount = 1.0,
  currency = 'USD',
  accountID = DEFAULT_BAKONG_ACCOUNT
}) {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(qrDataUrl);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(qrDataUrl);

      // Card dimensions
      const width = 520;
      const height = 720;
      const radius = 32;

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

      // Card Body Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Official Bakong Red Header Banner
      const headerHeight = 100;
      ctx.fillStyle = '#E1251B'; // Authentic Bakong Crimson Red
      ctx.fillRect(0, 0, width, headerHeight);

      // KHQR Logo in Header
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '2px';
      ctx.fillText('KHQR', width / 2, headerHeight / 2 - 2);

      // Sub-label in Header
      ctx.font = '600 11px "Inter", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.letterSpacing = '1px';
      ctx.fillText('NATIONAL BANK OF CAMBODIA', width / 2, headerHeight / 2 + 24);

      // 3. Merchant Name
      ctx.fillStyle = '#1e293b';
      ctx.font = '800 22px "Inter", -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(merchantName.toUpperCase(), width / 2, 145);

      // 4. Amount Box
      const formattedAmt = formatKhqrAmount(amount, currency);
      ctx.fillStyle = '#E1251B';
      ctx.font = '900 32px "Inter", -apple-system, sans-serif';
      ctx.fillText(formattedAmt, width / 2, 190);

      // Account ID Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px "Inter", -apple-system, sans-serif';
      ctx.fillText(accountID, width / 2, 218);

      // 5. Draw QR Code in Center
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        const qrSize = 380;
        const qrX = (width - qrSize) / 2;
        const qrY = 240;

        // Subtle frame around QR
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);

        // Draw the QR
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // 6. Footer Information
        ctx.fillStyle = '#64748b';
        ctx.font = '700 14px "Inter", -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan with any Bakong supported mobile banking app', width / 2, 658);

        // Bottom Decorative Accent
        ctx.fillStyle = '#E1251B';
        ctx.fillRect(0, height - 6, width, 6);

        ctx.restore();

        try {
          const fullCardDataUrl = canvas.toDataURL('image/png');
          resolve(fullCardDataUrl);
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
      console.warn('[BakongService] Canvas render error, using fallback:', err);
      resolve(qrDataUrl);
    }
  });
}
