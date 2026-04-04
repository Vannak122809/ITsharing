import React, { useMemo, useState, useEffect } from 'react';
import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';
import { X, Copy, CheckCircle2, Download, QrCode } from 'lucide-react';

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
        console.log('Bakong Relay API response:', data);
        if (data.status === 1 && data.data?.base64) {
          // The API returns the base64 with "data:image/png;base64," prefix already included
          setImgSrc(data.data.base64);
        } else {
          throw new Error('No base64 in response');
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Relay API failed, using fallback:', err.message);
        // Fallback: use qrserver.com to render the QR
        setImgSrc(
          `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=400x400&format=svg`
        );
        setError(false);
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
    <div className="bk-overlay" onClick={onClose}>
      <div className="bk-modal" onClick={e => e.stopPropagation()}>

        {/* Close Button */}
        <button className="bk-close" onClick={onClose}>
          <X size={22} />
        </button>

        {/* QR Image Card */}
        <div className="bk-card">
          {loading && (
            <div className="bk-loader">
              <div className="bk-spinner" />
              <p>Generating KHQR...</p>
            </div>
          )}

          {!loading && imgSrc && (
            <img src={imgSrc} alt="Bakong KHQR" className="bk-img" />
          )}

          {!loading && !imgSrc && (
            <div className="bk-error">
              <QrCode size={40} color="#ccc" />
              <p>Failed to generate QR</p>
            </div>
          )}
        </div>

        {/* Amount label */}
        {!loading && imgSrc && (
          <div className="bk-amount">
            <span className="bk-amount-label">Amount</span>
            <span className="bk-amount-val">{formatAmount()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="bk-actions">
          <button className="bk-btn primary" onClick={handleDownload} disabled={!imgSrc}>
            <Download size={18} /> Save Image
          </button>
          <button className="bk-btn secondary" onClick={handleCopy}>
            {copied ? <CheckCircle2 size={18} color="#4ade80" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy ID'}
          </button>
        </div>

        {/* Bakong ID label */}
        <p className="bk-id-label" onClick={handleCopy}>{accountID}</p>

        <style>{`
          .bk-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(11, 15, 25, 0.88);
            backdrop-filter: blur(14px);
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
          }
          .bk-modal {
            width: 100%; max-width: 380px;
            display: flex; flex-direction: column; gap: 16px;
            position: relative;
            animation: bkEntry 0.4s cubic-bezier(0.16,1,0.3,1);
          }
          @keyframes bkEntry { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

          .bk-close {
            position: absolute; top: -48px; right: 0;
            width: 40px; height: 40px; border-radius: 50%;
            background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
            color: white; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
          }

          .bk-card {
            background: white; border-radius: 24px; overflow: hidden;
            box-shadow: 0 30px 70px rgba(0,0,0,0.5);
            min-height: 400px; display: flex; align-items: center; justify-content: center;
          }
          .bk-img { width: 100%; height: auto; display: block; }

          .bk-loader { text-align: center; color: #888; gap: 14px; display: flex; flex-direction: column; align-items: center; }
          .bk-spinner {
            width: 44px; height: 44px;
            border: 4px solid #eee; border-top: 4px solid #E52E2A;
            border-radius: 50%; animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }

          .bk-error { text-align: center; color: #aaa; display: flex; flex-direction: column; align-items: center; gap: 12px; }

          .bk-amount {
            background: white; border-radius: 16px; padding: 16px 20px;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          }
          .bk-amount-label { font-size: 0.8rem; color: #999; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .bk-amount-val { font-size: 1.6rem; font-weight: 900; color: #E52E2A; }

          .bk-actions { display: flex; gap: 12px; }
          .bk-btn {
            flex: 1; height: 50px; border-radius: 14px; border: none;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
          }
          .bk-btn.primary { background: white; color: #E52E2A; box-shadow: 0 6px 20px rgba(0,0,0,0.2); }
          .bk-btn.secondary { background: rgba(255,255,255,0.12); color: white; border: 1px solid rgba(255,255,255,0.2); }
          .bk-btn:hover { transform: translateY(-2px); }
          .bk-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

          .bk-id-label {
            text-align: center; color: rgba(255,255,255,0.5);
            font-size: 0.8rem; cursor: pointer; transition: color 0.2s;
          }
          .bk-id-label:hover { color: rgba(255,255,255,0.9); }
        `}</style>
      </div>
    </div>
  );
};

export default BakongPayModal;
