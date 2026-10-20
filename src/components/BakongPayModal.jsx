import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, Download, QrCode, ShieldCheck, Share2, CornerUpRight, Sparkles, Check, Receipt, CheckCheck } from 'lucide-react';
import {
  generateBakongKHQR,
  createBrandedKhqrCard,
  formatKhqrAmount,
  checkBakongPayment,
  playPaymentSuccessSound,
  DEFAULT_BAKONG_ACCOUNT,
  DEFAULT_MERCHANT_NAME
} from '../utils/bakongService';

/**
 * BakongPayModal
 * - Generates standard Bakong KHQR locally using official NBC EMVCo spec
 * - Automatically renders official branded card with canvas (red header, merchant name, amount)
 * - Listens in real-time to NBC Bakong Open API for payment confirmation
 * - Alerts user with celebratory screen & chime when money is received
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
  const [copiedHash, setCopiedHash] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [loading, setLoading] = useState(false);
  const [md5Hash, setMd5Hash] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setImgSrc('');
    setPaymentSuccess(null);
    let isMounted = true;

    async function generateCard() {
      try {
        const { qrDataUrl, md5 } = await generateBakongKHQR({
          accountID,
          merchantName,
          amount: Number(amount),
          currency,
          storeLabel: 'ITsharing'
        });

        if (!isMounted) return;
        setMd5Hash(md5 || '');

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

  // Real-time Bakong payment listener (every 3 seconds)
  useEffect(() => {
    if (!isOpen || !md5Hash || paymentSuccess) return;

    let isSubscribed = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await checkBakongPayment(md5Hash);
        if (!isSubscribed) return;
        if (res && res.isPaid && res.data) {
          clearInterval(pollInterval);
          playPaymentSuccessSound();
          setPaymentSuccess(res.data);
        }
      } catch (err) {
        console.warn('[BakongPayModal] Polling error:', err);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, md5Hash, paymentSuccess]);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2200);
  };

  const handleDownload = () => {
    if (!imgSrc) return;
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `KHQR_${merchantName.replace(/\s+/g, '_')}_${currency}_${amount}.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="bk-minimal-overlay" onClick={onClose}>
      <div className="bk-minimal-content" onClick={e => e.stopPropagation()}>
        
        {paymentSuccess ? (
          <div className="bk-success-box">
             {/* Floating Confetti Accents */}
             <div className="bk-particles-bg">
               <span className="bp-dot bp-1" />
               <span className="bp-dot bp-2" />
               <span className="bp-dot bp-3" />
               <span className="bp-dot bp-4" />
             </div>

             {/* Multi-ring Hero Glowing Badge */}
             <div className="bk-badge-stage">
                <div className="bk-wave-ring" />
                <div className="bk-frost-ring" />
                <div className="bk-core-badge">
                   <Check size={38} strokeWidth={3.2} color="#ffffff" />
                </div>
             </div>

             <div className="bk-status-pill">
                <ShieldCheck size={14} color="#10b981" />
                <span>PAYMENT CONFIRMED • បានទទួលប្រាក់</span>
             </div>

             <div className="bk-success-amount">
                <span className="amount-num">
                   {formatKhqrAmount(paymentSuccess.amount || amount, paymentSuccess.currency || currency)}
                </span>
             </div>

             {/* Luxury Digital Receipt Card */}
             <div className="receipt-card-lux">
                <div className="receipt-top-bar">
                   <div className="receipt-title-box">
                      <Receipt size={14} color="#94a3b8" />
                      <span>TRANSACTION RECEIPT</span>
                   </div>
                   <span className="receipt-badge-settled">
                      <span className="pulse-mini-green" />
                      SETTLED
                   </span>
                </div>

                <div className="receipt-perforation">
                   <span className="perf-circle left" />
                   <span className="perf-line" />
                   <span className="perf-circle right" />
                </div>

                <div className="receipt-items-list">
                   <div className="receipt-row">
                      <span className="r-label">From Account</span>
                      <div className="r-val-group">
                         {String(paymentSuccess.fromAccountId || '').toLowerCase().includes('aba') && (
                            <span className="bank-pill-mini aba">ABA</span>
                         )}
                         {String(paymentSuccess.fromAccountId || '').toLowerCase().includes('aclb') && (
                            <span className="bank-pill-mini acleda">ACLEDA</span>
                         )}
                         <span className="r-val font-mono">{paymentSuccess.fromAccountId || 'Customer Account'}</span>
                      </div>
                   </div>

                   {paymentSuccess.hash && (
                      <div className="receipt-row">
                         <span className="r-label">Tx Hash</span>
                         <button 
                            className="hash-copy-btn"
                            onClick={() => handleCopyHash(paymentSuccess.hash)}
                            title="Click to copy full transaction hash"
                         >
                            <span className="hash-code">
                               {paymentSuccess.hash.slice(0, 10)}...{paymentSuccess.hash.slice(-8)}
                            </span>
                            {copiedHash ? (
                               <span className="copy-status-chip copied">
                                  <CheckCheck size={12} /> Copied
                               </span>
                            ) : (
                               <span className="copy-status-chip">
                                  <Copy size={12} />
                               </span>
                            )}
                         </button>
                      </div>
                   )}

                   <div className="receipt-row">
                      <span className="r-label">Network</span>
                      <span className="r-val network-val">NBC Bakong • KHQR</span>
                   </div>

                   <div className="receipt-row">
                      <span className="r-label">Status</span>
                      <span className="r-val status-confirmed">
                         <CheckCircle2 size={14} color="#10b981" />
                         <span>100% Settled</span>
                      </span>
                   </div>

                   <div className="receipt-row">
                      <span className="r-label">Time</span>
                      <span className="r-val time-val">
                         {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                   </div>
                </div>
             </div>

             <button className="bk-success-btn" onClick={onClose}>
                <Check size={18} strokeWidth={2.8} />
                <span>Done • រួចរាល់</span>
             </button>

             <button className="bk-close-minimal" onClick={onClose}><X size={20} /></button>
          </div>
        ) : (
          <>
            {/* QR Core Display */}
            <div className={`bk-qr-frame ${loading ? 'loading' : ''}`} onClick={() => !loading && imgSrc && handleDownload()}>
               {loading ? (
                  <div className="bk-minimal-loader">
                     <div className="bk-spinner-ring" />
                     <span>Generating Official KHQR...</span>
                  </div>
               ) : (
                  <div className="bk-qr-box">
                     <img src={imgSrc} alt="KHQR" className="bk-qr-main" />
                  </div>
               )}
               
               <button className="bk-close-minimal" onClick={onClose}><X size={20} /></button>
            </div>

            {/* Action Buttons */}
            <div className="bk-actions-row">
               <button className="bk-action-btn" onClick={handleDownload}>
                  <Download size={16} />
                  <span>Download Slip</span>
               </button>
               <button className="bk-action-btn" onClick={handleCopy}>
                  {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copied ? 'Copied' : accountID}</span>
               </button>
            </div>

            <div className="bk-listener-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.22)', borderRadius: '20px', fontSize: '0.78rem', color: '#10b981', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }} />
              <span>Real-time Payment Listener Active</span>
            </div>

            <p className="bk-minimal-hint">Scan with Bakong or any Cambodian Banking App</p>
          </>
        )}

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
          
          .bk-actions-row {
            display: flex; gap: 12px; width: 100%; justify-content: center;
          }
          .bk-action-btn {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 18px; border-radius: 12px;
            background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255, 255, 255, 0.12);
            color: #f1f5f9; font-size: 0.9rem; font-weight: 600;
            cursor: pointer; transition: all 0.2s ease;
            backdrop-filter: blur(8px);
          }
          .bk-action-btn:hover {
            background: rgba(51, 65, 85, 0.9); border-color: rgba(212, 175, 55, 0.5);
            transform: translateY(-2px); color: #fff;
          }

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

          /* ─── Luxury Success State ─── */
          .bk-success-box {
            width: 100%; max-width: 390px; background: #0f172a;
            border: 1px solid rgba(16, 185, 129, 0.38);
            border-radius: 28px; padding: 24px 20px 20px; position: relative;
            display: flex; flex-direction: column; align-items: center; text-align: center;
            box-shadow: 0 40px 90px -20px rgba(0,0,0,0.75), 0 0 50px rgba(16, 185, 129, 0.16);
            animation: bkFadeScale 0.45s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
          }

          .bk-particles-bg {
            position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
          }
          .bp-dot {
            position: absolute; border-radius: 50%; opacity: 0.65;
            animation: particleFloat 3.5s infinite ease-in-out alternate;
          }
          .bp-1 { width: 8px; height: 8px; background: #10b981; top: 15px; left: 16%; animation-delay: 0.2s; }
          .bp-2 { width: 6px; height: 6px; background: #60a5fa; top: 35px; right: 18%; animation-delay: 0.8s; }
          .bp-3 { width: 7px; height: 7px; background: #f59e0b; top: 90px; left: 8%; animation-delay: 0.5s; }
          .bp-4 { width: 6px; height: 6px; background: #a855f7; top: 120px; right: 10%; animation-delay: 1.1s; }

          .bk-badge-stage {
            position: relative; width: 96px; height: 96px;
            display: flex; align-items: center; justify-content: center;
            margin: 4px 0 10px; z-index: 1;
          }
          .bk-wave-ring {
            position: absolute; inset: 0; border-radius: 50%;
            background: radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(16, 185, 129, 0) 70%);
            animation: successWave 2.4s infinite ease-out;
          }
          .bk-frost-ring {
            position: absolute; width: 78px; height: 78px; border-radius: 50%;
            border: 2px solid rgba(16, 185, 129, 0.45);
            background: rgba(16, 185, 129, 0.1);
            backdrop-filter: blur(8px);
          }
          .bk-core-badge {
            position: relative; width: 62px; height: 62px; border-radius: 50%;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 10px 28px -4px rgba(16, 185, 129, 0.65), 0 0 0 3px rgba(255, 255, 255, 0.2);
            animation: corePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .bk-status-pill {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 4px 14px; border-radius: 20px;
            background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);
            color: #10b981; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em;
            text-transform: uppercase; margin-bottom: 6px; z-index: 1;
          }

          .bk-success-amount { margin: 0 0 14px; z-index: 1; }
          .bk-success-amount .amount-num {
            font-size: 2.75rem; font-weight: 900; letter-spacing: -0.03em;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #86efac 0%, #34d399 40%, #10b981 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 6px 18px rgba(16, 185, 129, 0.35));
            display: inline-block; line-height: 1.1;
          }

          /* Digital Receipt Card */
          .receipt-card-lux {
            width: 100%; border-radius: 20px; position: relative;
            background: linear-gradient(180deg, rgba(24, 33, 49, 0.88) 0%, rgba(15, 23, 42, 0.96) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top: 2px solid #10b981;
            box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6);
            padding: 14px 16px; margin-bottom: 16px; z-index: 1;
            text-align: left;
          }
          .receipt-top-bar {
            display: flex; justify-content: space-between; align-items: center;
            padding-bottom: 10px;
          }
          .receipt-title-box {
            display: flex; align-items: center; gap: 7px;
            color: #94a3b8; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em;
          }
          .receipt-badge-settled {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 0.68rem; font-weight: 800; color: #10b981;
            background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.28);
            padding: 2px 8px; border-radius: 12px; letter-spacing: 0.06em;
          }
          .pulse-mini-green {
            width: 6px; height: 6px; border-radius: 50%; background: #10b981;
            box-shadow: 0 0 6px #10b981; animation: livePulse 1.5s infinite;
          }

          .receipt-perforation {
            position: relative; display: flex; align-items: center; justify-content: center;
            margin: 0 -16px 12px; height: 16px; overflow: hidden;
          }
          .perf-circle {
            position: absolute; width: 14px; height: 14px; border-radius: 50%;
            background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .perf-circle.left { left: -7px; }
          .perf-circle.right { right: -7px; }
          .perf-line {
            width: 100%; height: 0; border-top: 1px dashed rgba(255, 255, 255, 0.15);
          }

          .receipt-items-list {
            display: flex; flex-direction: column; gap: 9px;
          }
          .receipt-row {
            display: flex; justify-content: space-between; align-items: center; font-size: 0.84rem;
          }
          .r-label {
            color: #94a3b8; font-weight: 600; font-size: 0.8rem;
          }
          .r-val-group {
            display: flex; align-items: center; gap: 6px;
          }
          .r-val {
            color: #f1f5f9; font-weight: 700;
          }
          .r-val.font-mono {
            font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          }
          .bank-pill-mini {
            padding: 2px 7px; border-radius: 6px; font-size: 0.68rem; font-weight: 800;
            letter-spacing: 0.04em; text-transform: uppercase;
          }
          .bank-pill-mini.aba {
            background: #004b87; color: #ffffff; box-shadow: 0 2px 6px rgba(0, 75, 135, 0.4);
          }
          .bank-pill-mini.acleda {
            background: #15305b; color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);
          }

          .hash-copy-btn {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.28);
            padding: 3px 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
            color: #818cf8; font-family: monospace; font-size: 0.78rem;
          }
          .hash-copy-btn:hover {
            background: rgba(99, 102, 241, 0.22); border-color: #818cf8; color: #fff;
            transform: translateY(-1px);
          }
          .copy-status-chip {
            display: flex; align-items: center; gap: 3px; font-size: 0.72rem; font-weight: 700;
          }
          .copy-status-chip.copied {
            color: #10b981;
          }

          .r-val.network-val {
            color: #cbd5e1; font-size: 0.8rem; font-weight: 600;
          }
          .r-val.status-confirmed {
            display: flex; align-items: center; gap: 5px; color: #10b981; font-weight: 800; font-size: 0.82rem;
          }
          .r-val.time-val {
            color: #64748b; font-size: 0.78rem; font-weight: 600;
          }

          .bk-success-btn {
            width: 100%; height: 46px; border-radius: 14px; border: none;
            background: linear-gradient(135deg, #10b981 0%, #059669 45%, #2563eb 100%);
            color: #ffffff; font-weight: 800; font-size: 0.96rem;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            cursor: pointer; z-index: 1;
            box-shadow: 0 12px 28px -6px rgba(16, 185, 129, 0.45);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .bk-success-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 36px -6px rgba(16, 185, 129, 0.65);
            filter: brightness(1.08);
          }
        `}</style>
      </div>
    </div>
  );
};

export default BakongPayModal;
