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
            background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(25px) saturate(200%);
            display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px;
          }
          .bk-minimal-content {
            width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 24px;
            animation: bkFadeScale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          @keyframes bkFadeScale { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

          .bk-qr-frame {
            width: 100%; min-height: 200px; background: #fff; border-radius: 32px; position: relative;
            display: flex; align-items: center; justify-content: center; overflow: hidden;
            box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 20px rgba(99, 102, 241, 0.2); 
            cursor: pointer; transition: transform 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67);
          }
          .bk-qr-frame:hover { transform: translateY(-5px); }
          .bk-qr-box { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
          .bk-qr-main { width: 100%; height: auto; object-fit: contain; }
          
          .bk-qr-overlay-info {
            position: absolute; bottom: 16px; left: 16px; right: 16px;
            display: flex; justify-content: space-between; align-items: center;
          }
          .bk-qr-amt { 
            background: #e52e2a; color: #fff; padding: 6px 16px; border-radius: 14px; 
            font-weight: 900; font-size: 1rem; box-shadow: 0 8px 20px rgba(229, 46, 42, 0.4); 
          }
          .bk-hover-download { 
            width: 44px; height: 44px; border-radius: 14px; border: none; 
            background: #0f172a; color: #fff; display: flex; align-items: center; 
            justify-content: center; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.3); 
            transition: all 0.2s; 
          }
          .bk-hover-download:hover { transform: translateY(-3px) scale(1.1); background: #1e293b; }

          .bk-close-minimal { 
            position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.1); 
            border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 40px; height: 40px; 
            border-radius: 50%; cursor: pointer; display: flex; align-items: center; 
            justify-content: center; transition: all 0.3s; 
          }
          .bk-close-minimal:hover { transform: rotate(90deg); background: #e52e2a; border-color: #e52e2a; }

          .bk-minimal-loader { display: flex; flex-direction: column; align-items: center; gap: 16px; color: #94a3b8; }
          .bk-spinner-ring { width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #6366f1; border-radius: 50%; animation: bkSpin 0.8s linear infinite; }
          @keyframes bkSpin { to { transform: rotate(360deg); } }

          .bk-minimal-hint { 
            color: rgba(255,255,255,0.4); font-size: 0.9rem; font-weight: 600; 
            letter-spacing: 0.5px; text-transform: uppercase; 
          }
        `}</style>
      </div>
    </div>
  );
};

export default BakongPayModal;

