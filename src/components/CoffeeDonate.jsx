import React, { useState, useMemo, useEffect } from 'react';
import { Coffee, X, Heart, CreditCard, ExternalLink, QrCode, Globe } from 'lucide-react';
import { KHQR, TAG, CURRENCY } from "ts-khqr";

const CoffeeDonate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(1.0);
  const [currency, setCurrency] = useState('USD');
  const [isSuccess, setIsSuccess] = useState(false);

  // Generate KHQR data dynamic based on selected amount and currency
  const qrResult = useMemo(() => {
    try {
      const response = KHQR.generate({
        tag: TAG.INDIVIDUAL,
        accountID: "vannak_seun@bkt",
        merchantName: "VANNAK SEUN",
        merchantCity: "Phnom Penh",
        amount: amount, 
        currency: currency === 'USD' ? CURRENCY.USD : CURRENCY.KHR,
        merchantID: "VANNAK SEUN",
        expirationTimestamp: Date.now() + (60 * 60 * 1000)
      });
      
      // Handle the various response formats
      const data = response?.data || response;
      return {
        qr: data?.qr || "",
        md5: data?.md5 || ""
      };
    } catch (e) {
      console.error("KHQR error:", e);
      return { qr: "", md5: "" };
    }
  }, [amount, currency]);

  const qrData = qrResult.qr;
  const md5Hash = qrResult.md5;

  // Transaction checking simulation (Like the PHP setInterval check)
  useEffect(() => {
    let interval;
    if (isOpen && md5Hash && !isSuccess) {
      // Note: In real app, you'd need a functional Bakong API Token
      // This is a simulation of the payment detection
      console.log("Monitoring transaction MD5:", md5Hash);
    }
    return () => clearInterval(interval);
  }, [isOpen, md5Hash, isSuccess]);

  const formatAmount = (val) => {
    if (currency === 'KHR') return new Intl.NumberFormat('km-KH').format(val) + " ៛";
    return "$" + val.toFixed(2);
  };

  return (
    <>
      {/* ─── FLOATING COFFEE ICON ─── */}
      <div 
        onClick={() => { setIsOpen(true); setIsSuccess(false); }}
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
          <div className="donate-modal glass-panel" onClick={e => e.stopPropagation()} style={{ overflow: 'hidden' }}>
            <button className="modal-close" onClick={() => setIsOpen(false)}><X size={20} /></button>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Heart size={28} color="#fff" fill="#fff" />
              </div>
              <h3 className="text-gradient">Buy us a Coffee</h3>
            </div>

            {/* Currency & Amount Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => { setCurrency('USD'); setAmount(1.0); }} className={`chip ${currency === 'USD' ? 'active' : ''}`}>USD</button>
                <button onClick={() => { setCurrency('KHR'); setAmount(4000); }} className={`chip ${currency === 'KHR' ? 'active' : ''}`}>KHR</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {(currency === 'USD' ? [1, 2, 5, 10] : [4000, 10000, 20000, 40000]).map((amt) => (
                  <button 
                    key={amt}
                    onClick={() => setAmount(amt)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid ' + (amount === amt ? 'var(--primary)' : 'var(--surface-border)'),
                      background: amount === amt ? 'var(--primary)' : 'transparent',
                      color: amount === amt ? '#fff' : 'var(--text-main)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {currency === 'KHR' ? amt/1000 + "k" : "$" + amt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '16px' }}>
              {/* Bakong KHQR Column */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '20px', padding: '16px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
                  <img src="https://play-lh.googleusercontent.com/O6LreDyl_q7-uN7_zS5zF_S-d880m-xP6w68B7G-uY_gI6_99-U9V4Y3M7q6Yy1-lQ" alt="B" style={{ width: '24px', borderRadius: '4px' }} />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Bakong KHQR</span>
                </div>
                
                <div style={{ background: '#fff', padding: '8px', borderRadius: '10px', marginBottom: '10px' }}>
                  {qrData ? (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=180x180&color=000&bgcolor=fff`} 
                         alt="KHQR" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                    <div style={{ padding: '40px 0' }}><QrCode size={40} color="#ccc" /></div>
                  )}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>{formatAmount(amount)}</p>
              </div>

              {/* Other Options Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="https://link.payway.com.kh/ABAPAYsE429183W" target="_blank" rel="noreferrer" className="pay-card">
                  <img src="https://seeklogo.com/images/A/aba-bank-logo-8A194FC44F-seeklogo.com.png" alt="ABA" style={{ width: '32px', borderRadius: '4px' }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>ABA PAY</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Direct Link</div>
                  </div>
                </a>

                <div className="pay-card" style={{ cursor: 'default' }}>
                  <Globe size={24} color="var(--primary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Global Support</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bank Transfer</div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', border: '1px dashed var(--surface-border)' }}>
                  Your support helps us keep ITsharing alive and free!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STYLES ─── */}
      <style>{`
        .chip {
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid var(--surface-border);
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.8rem;
        }
        .chip.active {
          background: var(--primary);
          color: #fff;
          border-color: var(--primary);
        }
        .pay-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid var(--surface-border);
          background: var(--surface);
          text-decoration: none;
          color: inherit;
          transition: var(--transition);
        }
        .pay-card:hover {
          border-color: var(--primary);
          transform: translateX(4px);
          background: var(--surface-badge);
        }
        /* Previous Coffee Styles */
        .coffee-container { position: relative; width: 46px; height: 46px; }
        .coffee-cup-btn { width: 46px; height: 46px; background: #6f4e37; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 15px rgba(111,78,55,0.4); z-index: 2; position: relative; }
        .steam { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); display: flex; z-index: 1; }
        .steam span { width: 2px; height: 20px; background: #fff; margin: 0 2px; border-radius: 50%; filter: blur(3px); animation: steam 3s infinite; opacity: 0; animation-delay: calc(var(--i) * -0.5s); }
        @keyframes steam { 0% { transform: translateY(0) scaleX(1); opacity: 0; } 15% { opacity: 0.6; } 50% { transform: translateY(-15px) scaleX(3); opacity: 0.3; } 95% { opacity: 0; } 100% { transform: translateY(-30px) scaleX(5); } }
        .modal-overlay { position: fixed; inset: 0; background: rgba(11,15,25,0.85); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 2000; }
        .donate-modal { width: 95%; max-width: 480px; padding: 32px; position: relative; border-radius: 24px !important; }
        .modal-close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; background: var(--surface-badge); color: var(--text-muted); cursor: pointer; }
      `}</style>
    </>
  );
};

export default CoffeeDonate;
