import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Download, QrCode, ShieldCheck, Share2, CornerUpRight } from 'lucide-react';
import { generateBakongKHQR, createBrandedKhqrCard, formatKhqrAmount, DEFAULT_BAKONG_ACCOUNT, DEFAULT_MERCHANT_NAME } from '../utils/bakongService';

/**
 * BakongPayModal
 * - Generates standard Bakong KHQR locally using official NBC EMVCo spec
 * - Automatically renders official branded card with canvas (red header, merchant name, amount)
 * - 100% offline-resilient: zero reliance on external relays, eliminating Cloudflare CORS / API failures
 */
const BakongPayModal = ({
  isOpen,
  onClose,
  amount = 1.0,
  currency = 'USD',
  accountID = DEFAULT_BAKONG_ACCOUNT,
  merchantName = DEFAULT_MERCHANT_NAME
}) => {
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setImgSrc('');
    let isMounted = true;

    async function generateCard() {
      try {
        const { qrDataUrl } = await generateBakongKHQR({
          accountID,
          merchantName,
          amount: Number(amount),
          currency,
          storeLabel: 'ITsharing'
        });

        if (!isMounted) return;

        // Render official Bakong KHQR card with canvas
        const cardUrl = await createBrandedKhqrCard({
          qrDataUrl,
          merchantName,
          amount: Number(amount),
          currency,
          accountID
        });

        if (isMounted) {
          setImgSrc(cardUrl || qrDataUrl);
        }
      } catch (err) {
        console.error('[BakongPayModal] Generation error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    generateCard();

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, currency, accountID, merchantName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!imgSrc) return;
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `KHQR_${merchantName.replace(/\s+/g, '_')}_${currency}_${amount}.png`;
    link.click();
  };

  if (!isOpen) return null;

  const formatAmount = () => formatKhqrAmount(amount, currency);

  return (
    <div className="bk-minimal-overlay" onClick={onClose}>
      <div className="bk-minimal-content" onClick={e => e.stopPropagation()}>
        
        {/* QR Core Display */}
        <div className={`bk-qr-frame ${loading ? 'loading' : ''}`} onClick={() => !loading && imgSrc && handleDownload()}>
           {loading ? (
              <div className="bk-minimal-loader">
                 <div className="bk-spinner-ring" />
                 <span>Generating...</span>
              </div>
           ) : (
              <div className="bk-qr-box">
                 <img src={imgSrc} alt="KHQR" className="bk-qr-main" />
                 <div className="bk-qr-overlay-info">
                    <span className="bk-qr-amt">{formatAmount()}</span>
                    <button className="bk-hover-download" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
                       <Download size={18} />
                    </button>
                 </div>
              </div>
           )}
           
           <button className="bk-close-minimal" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="bk-minimal-hint">Scan to Pay or Tap to Download</p>
        <style>{`
          .bk-minimal-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(13, 17, 23, 0.88); backdrop-filter: blur(20px) saturate(180%);
            display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px;
          }
          .bk-minimal-content {
            width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 20px;
            animation: bkFadeScale 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes bkFadeScale { from { transform: scale(0.94) translateY(15px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

          .bk-qr-frame {
            width: 100%; min-height: 200px; background: #ffffff; border-radius: 24px; position: relative;
            display: flex; align-items: center; justify-content: center; overflow: hidden;
            border: 2px solid rgba(212, 175, 55, 0.4);
            box-shadow: 0 25px 60px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(212, 175, 55, 0.3); 
            cursor: pointer; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .bk-qr-frame:hover { transform: translateY(-4px); box-shadow: 0 30px 70px -10px rgba(0,0,0,0.7), 0 0 0 2px var(--secondary); }
          .bk-qr-box { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
          .bk-qr-main { width: 100%; height: auto; object-fit: contain; }
          
          .bk-qr-overlay-info {
            position: absolute; bottom: 16px; left: 16px; right: 16px;
            display: flex; justify-content: space-between; align-items: center;
          }
          .bk-qr-amt { 
            background: linear-gradient(135deg, #1e3a8a, #0f172a); color: #d4af37; padding: 7px 18px; border-radius: 12px; 
            font-weight: 800; font-size: 1.05rem; border: 1px solid rgba(212, 175, 55, 0.5); box-shadow: 0 8px 20px rgba(0,0,0,0.4); 
            font-family: 'Playfair Display', serif;
          }
          .bk-hover-download { 
            width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.3); 
            background: #0f172a; color: #d4af37; display: flex; align-items: center; 
            justify-content: center; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.3); 
            transition: all 0.2s; 
          }
          .bk-hover-download:hover { transform: translateY(-2px) scale(1.08); background: #1e293b; color: #fff; }

          .bk-close-minimal { 
            position: absolute; top: 16px; right: 16px; background: rgba(0,0,0,0.4); 
            border: 1px solid rgba(255,255,255,0.2); color: #fff; width: 36px; height: 36px; 
            border-radius: 50%; cursor: pointer; display: flex; align-items: center; 
            justify-content: center; transition: all 0.3s; 
          }
          .bk-close-minimal:hover { transform: rotate(90deg); background: #e52e2a; border-color: #e52e2a; }

          .bk-minimal-loader { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #94a3b8; }
          .bk-spinner-ring { width: 44px; height: 44px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #d4af37; border-radius: 50%; animation: bkSpin 0.8s linear infinite; }
          @keyframes bkSpin { to { transform: rotate(360deg); } }

          .bk-minimal-hint { 
            font-size: 0.88rem; color: #94a3b8; letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BakongPayModal;
