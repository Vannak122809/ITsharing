import React, { useState, useEffect, useRef } from 'react';
import { Coffee, X, Heart, QrCode, Download, Clock, Info } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const RELAY_BASE = 'https://api.bakongrelay.com/v1';
const EXPIRY_TIME = 10 * 60; // 10 minutes

const CoffeeDonate = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(1.0);
  const [currency, setCurrency] = useState('USD');
  const [qrImage, setQrImage] = useState('');
  const [qrString, setQrString] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_TIME);
  const [isHovered, setIsHovered] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const timerRef = useRef(null);

  const amounts = {
    USD: [1, 2, 5, 10, 20],
    KHR: [4000, 8000, 20000, 40000, 80000]
  };

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(EXPIRY_TIME);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [isOpen, amount, currency]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setQrImage('');
    
    fetch(`${RELAY_BASE}/generate_qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_name: 'Vannak Tech',
        bank_account: 'vannak_seun@bkrt',
        merchant_city: 'Phnom Penh',
        amount: Number(amount),
        currency: currency,
        store_label: 'ITsharing',
        static: false
      })
    })
    .then(r => r.json())
    .then(res => {
      if (res.responseCode === 0 && res.data?.qr) {
        setQrString(res.data.qr);
        return fetch(`${RELAY_BASE}/generate_khqr_image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr: res.data.qr })
        });
      }
      throw new Error('QR generation failed');
    })
    .then(r => r.json())
    .then(res => {
      if (res.responseCode === 0 && res.data?.image) {
        setQrImage(res.data.image);
      } else {
        throw new Error('Image generation failed');
      }
      setLoading(false);
    })
    .catch(err => {
      console.warn('Fallback due to:', err.message);
      if (qrString) {
        setQrImage(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=300x300`);
      }
      setLoading(false);
    });
  }, [isOpen, amount, currency]);

  const formatAmount = (val) => {
    if (currency === 'KHR') return new Intl.NumberFormat('km-KH').format(val) + ' ៛';
    return '$' + Number(val).toFixed(2);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = (e) => {
    e?.stopPropagation();
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = `KHQR_Donate.png`;
    link.click();
  };

  return (
    <>
      <div className="donate-trigger-lux" onClick={() => setIsOpen(true)}>
        <div className="trigger-base">
           <div className="steam-wrapper">
              <span className="steam-line"></span>
              <span className="steam-line"></span>
              <span className="steam-line"></span>
           </div>
           <Coffee size={28} color="#fff" />
        </div>
        <div className="support-chip">{t('support_us')}</div>
      </div>

      {isOpen && (
        <div className="donate-overlay-lux" onClick={() => setIsOpen(false)}>
          <div className="donate-modal-lux" onClick={e => e.stopPropagation()}>
            <div className="modal-header-lux">
              <div className="header-title-box">
                <div className="heart-icon-box">
                  <Coffee size={20} />
                </div>
                <div className="title-text-lux">
                  <h2>{t('buy_us_coffee')}</h2>
                  <div className="expiry-mini">
                    <Clock size={12} />
                    <span>{t('expires_in')} {formatTime(timeLeft)}</span>
                  </div>
                </div>
              </div>
              <button className="btn-close-lux" onClick={() => setIsOpen(false)}><X size={18} /></button>
            </div>

            <div className="modal-body-lux">
              <div className="donation-controls-row">
                 <div className="currency-selector-mini">
                    <button className={`curr-btn ${currency === 'USD' ? 'active' : ''}`} onClick={() => {setCurrency('USD'); setAmount(1); setIsCustom(false);}}>USD</button>
                    <button className={`curr-btn ${currency === 'KHR' ? 'active' : ''}`} onClick={() => {setCurrency('KHR'); setAmount(4000); setIsCustom(false);}}>KHR</button>
                 </div>
                 <div className="amount-grid-compact">
                    {amounts[currency].map(amt => (
                      <button key={amt} className={`amt-chip-mini ${amount === amt && !isCustom ? 'active' : ''}`} onClick={() => {setAmount(amt); setIsCustom(false);}}>
                        {currency === 'USD' ? '$' + amt : (amt >= 1000 ? `${amt/1000}k` : amt)}
                      </button>
                    ))}
                    <button className={`amt-chip-mini ${isCustom ? 'active' : ''}`} onClick={() => setIsCustom(true)}>{t('other')}</button>
                 </div>
              </div>

              {isCustom && (
                <div className="custom-amount-input-box">
                   <div className="custom-input-wrapper">
                      <span className="curr-indicator">{currency === 'USD' ? '$' : '៛'}</span>
                      <input 
                        type="number" 
                        step={currency === 'USD' ? '0.01' : '100'}
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={currency === 'USD' ? '0.00' : '0'}
                        className="custom-amt-input"
                        autoFocus
                      />
                   </div>
                </div>
              )}

              <div className="bakong-payment-card qr-only">
                <div 
                  className={`qr-display-box-minimal ${loading ? 'is-loading' : ''}`}
                  onClick={() => qrImage && setSelectedQr({ img: qrImage, title: 'Bakong KHQR' })}
                >
                  {loading ? (
                    <div className="qr-loader">
                      <div className="loader-ring" />
                    </div>
                  ) : (
                    <div className="qr-wrapper-minimal">
                      <div className="qr-img-frame-minimal">
                        {qrImage ? (
                          <img src={qrImage} alt="KHQR" className="qr-main-img" />
                        ) : (
                          <div className="qr-placeholder"><QrCode size={80} color="rgba(255,255,255,0.05)" /></div>
                        )}
                        {timeLeft === 0 && (
                          <div className="expired-mask">
                             <span>{t('expired')}</span>
                             <button onClick={() => setAmount(amount)} className="refresh-btn">{t('retry')}</button>
                          </div>
                        )}
                      </div>
                      {qrImage && (
                        <div className="qr-actions-minimal">
                           <span className="qr-amount-overlay">{formatAmount(amount)}</span>
                           <button className="qr-download-btn-minimal" onClick={handleDownload}>
                              <Download size={14} />
                           </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button className="btn-action-lux donate-finish" onClick={() => { setIsOpen(false); setShowThankYou(true); setTimeout(() => setShowThankYou(false), 3500); }}>
                 {t('i_have_paid')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showThankYou && (
        <div className="donate-overlay-lux ty-layer">
           <div className="ty-card-lux">
              <div className="ty-icon-box">
                 <Heart size={40} fill="#ec4899" className="ty-heart-anim" />
              </div>
              <h3>{t('thank_you')}</h3>
              <p>{t('thank_you_desc')}</p>
              <div className="ty-confetti-mini">
                 {[...Array(6)].map((_, i) => <span key={i} className={`p-${i}`} />)}
              </div>
           </div>
        </div>
      )}

      {selectedQr && (
         <div className="donate-overlay-lux" onClick={() => setSelectedQr(null)} style={{ zIndex: 5000 }}>
            <div className="lightbox-lux" onClick={e => e.stopPropagation()}>
               <div className="lightbox-header">
                  <span>{selectedQr.title}</span>
                  <button onClick={() => setSelectedQr(null)} className="close-lightbox"><X size={20} /></button>
               </div>
               <div className="lightbox-img-box">
                  <img src={selectedQr.img} alt="KHQR Full" />
               </div>
               <div className="lightbox-footer-mini" style={{ textAlign: 'center', marginTop: '16px' }}>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '12px' }}>{t('scan_bakong')}</p>
                  <button className="btn-action-lux download-full" onClick={handleDownload} style={{ background: '#e52e2a', color: '#fff', width: '100%' }}>
                     <Download size={18} /> {t('download_code')}
                  </button>
               </div>
            </div>
         </div>
      )}

      <style>{`
        .donate-trigger-lux {
          position: fixed; bottom: 30px; right: 30px; z-index: 900;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          cursor: pointer; transition: all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }
        .donate-trigger-lux:hover { transform: translateY(-8px); }
        .trigger-base {
          width: 64px; height: 64px; border-radius: 20px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 15px 30px rgba(99, 102, 241, 0.4);
          position: relative;
        }
        .trigger-base::after { content: ""; position: absolute; inset: -4px; border-radius: 24px; background: inherit; z-index: -1; opacity: 0.3; filter: blur(10px); }
        .steam-wrapper { position: absolute; top: -14px; display: flex; gap: 4px; }
        .steam-line { width: 3px; height: 12px; background: rgba(255,255,255,0.7); border-radius: 3px; animation: steamRising 1.8s infinite ease-in-out; }
        .steam-line:nth-child(2) { animation-delay: 0.4s; height: 16px; }
        .steam-line:nth-child(3) { animation-delay: 0.8s; }
        @keyframes steamRising { 0% { transform: translateY(0); opacity: 0; } 50% { transform: translateY(-10px); opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; } }
        .support-chip { background: #0f172a; padding: 4px 12px; border-radius: 12px; color: #fff; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.1); }

        .donate-overlay-lux { position: fixed; inset: 0; z-index: 1000; background: rgba(2, 6, 23, 0.9); backdrop-filter: blur(16px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .donate-modal-lux {
          width: 100%; max-width: 380px; background: #0f172a; border-radius: 32px;
          border: 1px solid rgba(255,255,255,0.08); overflow: hidden;
          box-shadow: 0 50px 100px rgba(0,0,0,0.6);
          animation: modalPopUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalPopUp { from { transform: scale(0.9) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

        .modal-header-lux { padding: 20px 24px 16px; display: flex; justify-content: space-between; align-items: center; }
        .header-title-box { display: flex; align-items: center; gap: 12px; }
        .heart-icon-box { width: 40px; height: 40px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; color: #6366f1; }
        .title-text-lux h2 { font-size: 1.25rem; color: #fff; font-weight: 900; margin: 0; }
        .expiry-mini { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 0.75rem; font-weight: 600; margin-top: 2px; }
        .btn-close-lux { background: transparent; border: none; color: #64748b; cursor: pointer; }

        .modal-body-lux { padding: 0 24px 24px; display: flex; flex-direction: column; gap: 16px; }
        .donation-controls-row { display: flex; flex-direction: column; gap: 12px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.04); }
        .currency-selector-mini { display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 12px; }
        .curr-btn { flex: 1; padding: 8px; border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.8rem; cursor: pointer; border-radius: 8px; transition: 0.3s; }
        .curr-btn.active { background: #fff; color: #000; }
        .amount-grid-compact { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .amt-chip-mini { padding: 10px 4px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); background: transparent; color: #94a3b8; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
        .amt-chip-mini.active { background: #6366f1; color: #fff; border-color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

        .custom-amount-input-box { margin-bottom: 4px; }
        .custom-input-wrapper { position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 0 16px; transition: 0.3s; }
        .custom-input-wrapper:focus-within { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        .curr-indicator { font-size: 0.8rem; font-weight: 900; color: #6366f1; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 12px; margin-right: 12px; }
        .custom-amt-input { flex: 1; height: 50px; background: transparent; border: none; color: #fff; font-size: 1.1rem; font-weight: 800; outline: none; width: 100%; }
        .custom-amt-input::placeholder { color: #64748b; font-weight: 500; font-size: 0.95rem; }
        
        @media (min-width: 400px) { .amount-grid-compact { grid-template-columns: repeat(6, 1fr); } }

        .bakong-payment-card.qr-only { width: 100%; max-width: 280px; margin: 0 auto; position: relative; }
        .qr-display-box-minimal { width: 100%; background: #fff; border-radius: 24px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .qr-wrapper-minimal { width: 100%; position: relative; }
        .qr-main-img { width: 100%; height: auto; display: block; }
        .qr-amount-overlay { position: absolute; bottom: 12px; left: 12px; background: #e52e2a; color: #fff; padding: 4px 12px; border-radius: 10px; font-weight: 900; font-size: 0.8rem; }
        .qr-download-btn-minimal { position: absolute; bottom: 12px; right: 12px; width: 32px; height: 32px; border-radius: 8px; border: none; background: #0f172a; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .qr-loader { height: 200px; display: flex; align-items: center; justify-content: center; }
        .loader-ring { width: 32px; height: 32px; border: 3px solid #f1f5f9; border-top-color: #e52e2a; border-radius: 50%; animation: spinRotate 0.8s linear infinite; }
        @keyframes spinRotate { to { transform: rotate(360deg); } }

        .btn-action-lux.donate-finish { background: #6366f1; color: #fff; height: 50px; border-radius: 16px; border: none; font-weight: 800; cursor: pointer; margin-top: 8px; transition: 0.3s; }
        .btn-action-lux.donate-finish:hover { background: #4f46e5; transform: translateY(-2px); }

        .expired-mask { position: absolute; inset: 0; background: rgba(255,255,255,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 10; font-weight: 900; color: #000; }
        .refresh-btn { background: #e52e2a; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; }

        /* ─── Thank You Popup ─── */
        .ty-layer { z-index: 6000; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(20px); }
        .ty-card-lux { 
          background: #0f172a; border-radius: 36px; padding: 40px; text-align: center;
          width: 90%; max-width: 380px; position: relative; border: 1px solid rgba(255,255,255,0.06);
          animation: tyEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes tyEntrance { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
        .ty-icon-box { 
          width: 80px; height: 80px; border-radius: 50%; background: rgba(236, 72, 153, 0.1);
          display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
        }
        .ty-heart-anim { animation: tyHeartBeat 1s infinite alternate; }
        @keyframes tyHeartBeat { from { transform: scale(1); } to { transform: scale(1.25); filter: drop-shadow(0 0 15px #ec4899); } }
        .ty-card-lux h3 { font-size: 2rem; color: #fff; font-weight: 900; margin-bottom: 12px; }
        .ty-card-lux p { color: #94a3b8; font-size: 1rem; line-height: 1.6; }
        
        .ty-confetti-mini span { position: absolute; width: 10px; height: 10px; border-radius: 2px; }
        .ty-confetti-mini span.p-0 { top: -20px; left: 10%; background: #6366f1; animation: tyFall 2s infinite linear; }
        .ty-confetti-mini span.p-1 { top: -40px; left: 30%; background: #ec4899; animation: tyFall 1.5s infinite linear; }
        .ty-confetti-mini span.p-2 { top: -10px; left: 50%; background: #a855f7; animation: tyFall 2.2s infinite linear; }
        .ty-confetti-mini span.p-3 { top: -30px; left: 70%; background: #22c55e; animation: tyFall 1.8s infinite linear; }
        .ty-confetti-mini span.p-4 { top: -50px; left: 90%; background: #eab308; animation: tyFall 2s infinite linear; }
        @keyframes tyFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(400px) rotate(360deg); opacity: 0; } }

        .lightbox-lux { width: 100%; max-width: 400px; background: #fff; border-radius: 32px; padding: 24px; position: relative; animation: zoomInPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomInPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .lightbox-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; font-weight: 900; color: #0f172a; }
        .close-lightbox { background: transparent; border: none; color: #64748b; cursor: pointer; }
        .lightbox-img-box { background: #f8fafc; padding: 12px; border-radius: 20px; border: 1px solid #f1f5f9; }
        .lightbox-img-box img { width: 100%; border-radius: 12px; }
      `}</style>
    </>
  );
};

export default CoffeeDonate;
