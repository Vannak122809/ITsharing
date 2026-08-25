import React, { useMemo, useState, useEffect } from 'react';
import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
import { X, Copy, CheckCircle2, Download, QrCode, ShieldCheck, Share2, CornerUpRight } from 'lucide-react';

/**
 * BakongPayModal
 * - Generates KHQR string locally using bakong-khqr
 * - Fetches official branded image (with red header) from Bakong Relay API
 * - Falls back to qrserver.com if API fails
 */
const BakongPayModal = ({
  isOpen,
  onClose,
  amount = 1.0,
  currency = 'USD',
  accountID = 'vannak_seun@bkrt',
  merchantName = 'VANNAK SEUN'
}) => {
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Step 1 — Locally generate the raw KHQR string
  const qrString = useMemo(() => {
    try {
      const info = new IndividualInfo(
        accountID,
        currency === 'USD' ? khqrData.currency.usd : khqrData.currency.khr,
        merchantName,
        'Phnom Penh',
        { amount }
      );
      const res = new BakongKHQR().generateIndividual(info);
      if (res.status.code === 0) return res.data.qr;
      return '';
    } catch (e) {
      console.error('KHQR gen error:', e);
      return '';
    }
  }, [amount, currency, accountID, merchantName]);

  // Step 2 — Fetch official branded image from Bakong Relay API
  useEffect(() => {
    if (!isOpen || !qrString) return;

    setLoading(true);
    setError(false);
    setImgSrc('');

    fetch('https://api.bakongrelay.com/v1/generate_khqr_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr: qrString })
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.status === 1 && data.data?.base64) {
          setImgSrc(data.data.base64);
        } else {
          throw new Error('No base64 in response');
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Relay API failed, using fallback:', err.message);
        setImgSrc(
          `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=400x400&format=svg`
        );
        setLoading(false);
      });
  }, [isOpen, qrString]);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `KHQR_${merchantName.replace(/\s+/g, '_')}.png`;
    link.click();
  };

  if (!isOpen) return null;

  const formatAmount = () =>
    currency === 'USD'
      ? `$${Number(amount).toFixed(2)}`
      : `${new Intl.NumberFormat('km-KH').format(amount)} ៛`;

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
