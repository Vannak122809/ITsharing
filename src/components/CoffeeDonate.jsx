import React, { useState, useEffect, useRef } from 'react';
import { Coffee, X, Heart, QrCode } from 'lucide-react';

const RELAY_BASE = 'https://api.bakongrelay.com/v1';
const EXPIRY_TIME = 10 * 60; // 10 minutes in seconds

const CoffeeDonate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(1.0);
  const [currency, setCurrency] = useState('USD');
  const [qrImage, setQrImage] = useState('');   // base64 image from API
  const [qrString, setQrString] = useState(''); // raw QR string (fallback)
  const [loading, setLoading] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_TIME);
  
  const timerRef = useRef(null);

  // ── Countdown Timer Logic ──
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(EXPIRY_TIME);
    if (timerRef.current) clearInterval(timerRef.current);

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

  // ── Two-step API flow: generate_qr → generate_khqr_image ──
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setQrImage('');
    setQrString('');

    // STEP 1: Generate QR string from Bakong Relay API
    fetch(`${RELAY_BASE}/generate_qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_name: 'Vannak Tech',
        bank_account: 'vannak_seun@bkrt',
        merchant_city: 'Phnom Penh',
        amount: amount,
        currency: currency,
        store_label: 'ITsharing',
        static: false
      })
    })
    .then(r => r.json())
    .then(res => {
      if (res.responseCode === 0 && res.data?.qr) {
        const qr = res.data.qr;
        setQrString(qr);

        // STEP 2: Convert QR string to official branded image
        return fetch(`${RELAY_BASE}/generate_khqr_image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr })
        });
      }
      throw new Error('generate_qr failed: ' + res.responseMessage);
    })
    .then(r => r.json())
    .then(res => {
      if (res.responseCode === 0 && res.data?.image) {
        setQrImage(res.data.image); // data:image/png;base64,...
      } else {
        throw new Error('generate_khqr_image failed: ' + res.responseMessage);
      }
      setLoading(false);
    })
    .catch(err => {
      console.warn('Bakong Relay API error, using fallback:', err.message);
      if (qrString) {
        setQrImage(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=300x300&margin=10`);
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

  return (
    <>
      {/* ─── FLOATING COFFEE ICON ─── */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          left: '20px',
          bottom: '50%',
          transform: 'translateY(50%)',
          zIndex: 1000,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <div className="coffee-container">
          <div className="steam">
            <span style={{ '--i': 1 }}></span>
            <span style={{ '--i': 3 }}></span>
            <span style={{ '--i': 16 }}></span>
            <span style={{ '--i': 5 }}></span>
            <span style={{ '--i': 13 }}></span>
          </div>
          <div className="coffee-cup-btn">
            <Coffee size={24} color="#fff" />
          </div>
        </div>
        <span className="glass-panel" style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '10px' }}>
          Support
        </span>
      </div>

      {/* ─── DONATE MODAL ─── */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="donate-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsOpen(false)}><X size={18} /></button>

            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div className="heart-circle-bg">
                <Heart size={28} color="#fff" fill="#fff" />
              </div>
              <h3 className="modal-title">Buy us a Coffee</h3>
            </div>

            {/* Currency Selection */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
              <button 
                onClick={() => { setCurrency('USD'); setAmount(1.0); }} 
                className={`tab-btn ${currency === 'USD' ? 'active' : ''}`}
              >USD</button>
              <button 
                onClick={() => { setCurrency('KHR'); setAmount(4000); }} 
                className={`tab-btn ${currency === 'KHR' ? 'active' : ''}`}
              >KHR</button>
            </div>

            {/* Amount Selection */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {(currency === 'USD' ? [1, 2, 3, 4, 5] : [4000, 8000, 12000, 16000, 20000]).map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`amount-chip ${amount === amt ? 'active' : ''}`}
                >
                  {currency === 'KHR' ? amt / 1000 + "k" : "$" + amt}
                </button>
              ))}
            </div>

            {/* Bakong Branding Container */}
            <div className="bakong-outer-box">
              <div className="bakong-label">
                <QrCode size={16} color="#E52E2A" />
                <span>Bakong</span>
              </div>

              {/* KHQR Card View */}
              <div 
                className="khqr-card-container"
                onClick={() => qrImage && setSelectedQr({ img: qrImage, title: 'Bakong KHQR' })}
              >
                {loading ? (
                  <div className="loader-box">
                    <div className="spinner" />
                    <p>Generating Code...</p>
                  </div>
                ) : (
                  <div className="khqr-main">
                    <div className="khqr-header">
                       <span style={{ fontWeight: '900', letterSpacing: '1.5px', fontSize: '0.9rem' }}>KHQR</span>
                    </div>
                    <div className="khqr-merchant-info">
                       <p style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>Vannak Tech</p>
                       <p style={{ fontSize: '1rem', fontWeight: '900', margin: '4px 0 0', color: '#000' }}>
                          {currency === 'KHR' ? new Intl.NumberFormat('km-KH').format(amount) : Number(amount).toFixed(2).replace('.', ',')} 
                          <span style={{ fontSize: '0.65rem', marginLeft: '4px', color: '#64748b' }}>{currency}</span>
                       </p>
                    </div>
                    <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0 20px' }}></div>
                    <div className="khqr-body">
                      {qrImage ? (
                        <>
                          <img src={qrImage} alt="KHQR" className="khqr-img" />
                          <div className="qr-hint">Tap to zoom</div>
                        </>
                      ) : (
                        <QrCode size={60} color="#ddd" />
                      )}
                    </div>
                    {timeLeft === 0 && (
                      <div className="expiry-overlay">
                         <p>Code Expired</p>
                         <button onClick={() => setIsOpen(false)} className="btn-retry">Refresh</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Expiry Timer */}
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: timeLeft < 60 ? '#f87171' : '#94a3b8', fontWeight: '500' }}>
                Expires in: <span style={{ fontFamily: 'monospace' }}>{formatTime(timeLeft)}</span>
              </div>
            </div>
            
            <p className="footer-price">{formatAmount(amount)}</p>
          </div>
        </div>
      )}

      {/* ─── LIGHTBOX VIEW ─── */}
      {selectedQr && (
        <div className="modal-overlay" onClick={() => setSelectedQr(null)} style={{ zIndex: 3000, padding: '20px' }}>
          <div className="lightbox-panel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedQr(null)}><X size={20} /></button>
            <h3 style={{ color: '#fff', marginBottom: '20px', fontWeight: '700' }}>{selectedQr.title}</h3>
            <div className="lightbox-img-box">
              <img src={selectedQr.img} alt="Full Size" />
            </div>
            <p style={{ marginTop: '20px', color: '#cbd5e1', fontSize: '0.9rem' }}>Scan to donate {formatAmount(amount)}</p>
          </div>
        </div>
      )}

      <style>{`
        .donate-modal {
          width: 95%;
          max-width: 380px;
          background: #0b0f19;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 32px;
          padding: 32px;
          position: relative;
          color: #fff;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
        }
        .modal-title { font-size: 1.4rem; font-weight: 700; color: #6366f1; margin: 0; }
        .heart-circle-bg {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #ec4899);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }
        .tab-btn {
          flex: 1; padding: 10px; border-radius: 20px; border: 1px solid transparent;
          background: #1e293b; color: #94a3b8; font-weight: 700;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.85rem;
        }
        .tab-btn.active { background: #3b82f6; color: #fff; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .tab-btn:hover:not(.active) { background: #2d3748; color: #cbd5e1; }
        
        .amount-chip {
          width: 58px; height: 42px; border-radius: 14px; border: 1px solid #1e293b;
          background: #0f172a; color: #f8fafc; font-weight: 600;
          cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem;
        }
        .amount-chip.active { background: #3b82f6; border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); transform: translateY(-2px); }
        .amount-chip:hover:not(.active) { border-color: #3b82f6; transform: translateY(-1px); }

        .bakong-outer-box {
          background: #0f172a; border: 1px solid #1e293b; border-radius: 24px;
          padding: 24px 20px; margin-bottom: 16px;
        }
        .bakong-label {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-bottom: 16px; font-weight: 700; font-size: 0.95rem; color: #cbd5e1;
        }
        .khqr-card-container {
          background: #fff; border-radius: 20px; overflow: hidden;
          cursor: zoom-in; position: relative; transition: transform 0.2s;
        }
        .khqr-card-container:hover { transform: scale(1.02); }
        .khqr-main { display: flex; flex-direction: column; }
        .khqr-header { background: #E52E2A; color: #fff; padding: 10px; text-align: center; position: relative; }
        .khqr-header::after { 
          content: ''; position: absolute; bottom: -10px; right: 0; 
          width: 0; height: 0; border-style: solid; border-width: 0 20px 10px 0; border-color: transparent #E52E2A transparent transparent; 
        }
        .khqr-merchant-info { padding: 16px 20px; text-align: left; background: #fff; }
        .khqr-body { padding: 10px 20px 20px; display: flex; justify-content: center; align-items: center; min-height: 180px; }
        .khqr-img { width: 100%; height: auto; display: block; border: 1px solid #f1f5f9; border-radius: 8px; }
        .qr-hint { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); font-size: 0.55rem; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; }

        .footer-price { font-size: 1.1rem; font-weight: 800; color: #3b82f6; margin-top: 8px; }
        .modal-close { position: absolute; top: 20px; right: 20px; background: #1e293b; border: none; color: #94a3b8; border-radius: 50%; padding: 6px; cursor: pointer; }
        .loader-box { padding: 40px; display: flex; flexDirection: column; align-items: center; gap: 12px; color: #666; }
        .spinner { width: 32px; height: 32px; border: 3px solid #eee; border-top-color: #E52E2A; border-radius: 50%; animation: cdSpin 0.7s linear infinite; }
        @keyframes cdSpin { to { transform: rotate(360deg); } }

        .expiry-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-retry { padding: 6px 16px; border-radius: 12px; border: none; background: #3b82f6; color: #fff; font-weight: 600; cursor: pointer; }

        .lightbox-panel {
          max-width: 450px; width: 100%; background: #0f172a; padding: 32px; border-radius: 32px;
          text-align: center; position: relative; border: 1px solid rgba(255,255,255,0.1);
        }
        .lightbox-img-box { background: #fff; padding: 12px; border-radius: 20px; }
        .lightbox-img-box img { width: 100%; border-radius: 12px; }
        
        /* Floating Coffee Styles */
        .coffee-container { position: relative; width: 46px; height: 46px; }
        .coffee-cup-btn { width: 46px; height: 46px; background: #6f4e37; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 15px rgba(111,78,55,0.4); z-index: 2; position: relative; }
        .steam { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); display: flex; z-index: 1; }
        .steam span { width: 2px; height: 20px; background: #fff; margin: 0 2px; border-radius: 50%; filter: blur(3px); animation: steam 3s infinite; opacity: 0; animation-delay: calc(var(--i) * -0.5s); }
        @keyframes steam { 0% { transform: translateY(0) scaleX(1); opacity: 0; } 15% { opacity: 0.6; } 50% { transform: translateY(-15px) scaleX(3); opacity: 0.3; } 95% { opacity: 0; } 100% { transform: translateY(-30px) scaleX(5); } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
      `}</style>
    </>
  );
};

export default CoffeeDonate;
