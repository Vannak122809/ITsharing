import React, { useState, useEffect, useRef } from 'react';
import { Coffee, X, Heart, QrCode, Download, Clock, Info, CheckCircle2, Sparkles, ShieldCheck, Copy, Check, Receipt, CheckCheck, RefreshCw } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

import {
  generateBakongKHQR,
  createBrandedKhqrCard,
  formatKhqrAmount,
  checkBakongPayment,
  playPaymentSuccessSound,
  DEFAULT_BAKONG_ACCOUNT,
  DEFAULT_MERCHANT_NAME
} from '../utils/bakongService';

const EXPIRY_TIME = 10 * 60; // 10 minutes

const CoffeeDonate = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(1.0);
  const [currency, setCurrency] = useState('USD');
  const [qrImage, setQrImage] = useState('');
  const [brandedCardImage, setBrandedCardImage] = useState('');
  const [qrString, setQrString] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_TIME);
  const [isHovered, setIsHovered] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [md5Hash, setMd5Hash] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);
  
  const timerRef = useRef(null);

  const amounts = {
    USD: [1, 2, 5, 10, 20],
    KHR: [4000, 8000, 20000, 40000, 80000]
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('test_success=1')) {
      setPaymentSuccess({
        amount: 0.10,
        currency: 'USD',
        fromAccountId: 'abaakhppxxx@abaa',
        hash: 'a999e467cf58f6ab65c92849d10e8bf3a8c17109283749817293847182938472'
      });
      setIsOpen(true);
    }

    if (import.meta.env.DEV) {
      window.__triggerTestPaymentSuccess = (customData = {}) => {
        setPaymentSuccess({
          amount: customData.amount ?? 0.10,
          currency: customData.currency || 'USD',
          fromAccountId: customData.fromAccountId || 'abaakhppxxx@abaa',
          hash: customData.hash || 'a999e467cf58f6ab65c92849d10e8bf3a8c17109283749817293847182938472',
          ...customData
        });
        setIsOpen(true);
      };
    }
  }, []);

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

  // Generate authentic Bakong KHQR locally in memory (zero external network reliance)
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setQrImage('');
    setBrandedCardImage('');
    
    let isMounted = true;

    async function loadKHQR() {
      try {
        const { qrString: generatedQr, qrDataUrl, md5 } = await generateBakongKHQR({
          accountID: DEFAULT_BAKONG_ACCOUNT,
          merchantName: DEFAULT_MERCHANT_NAME,
          amount: Number(amount),
          currency,
          storeLabel: 'ITsharing'
        });

        if (!isMounted) return;
        setQrString(generatedQr);
        setQrImage(qrDataUrl);
        setMd5Hash(md5 || '');

        // Generate the authentic official Bakong KHQR stand card on canvas
        const cardUrl = await createBrandedKhqrCard({
          qrDataUrl,
          merchantName: DEFAULT_MERCHANT_NAME,
          amount: Number(amount),
          currency,
          accountID: DEFAULT_BAKONG_ACCOUNT
        });

        if (isMounted) {
          setBrandedCardImage(cardUrl);
        }
      } catch (err) {
        console.error('[CoffeeDonate] Local KHQR generation error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadKHQR();

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, currency]);

  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isCheckingManual, setIsCheckingManual] = useState(false);

  // Manual payment verification trigger
  const handleVerifyNow = async () => {
    if (!md5Hash || isCheckingManual) return;
    setIsCheckingManual(true);
    try {
      const res = await checkBakongPayment(md5Hash);
      if (res && res.isPaid && res.data) {
        playPaymentSuccessSound();
        setPaymentSuccess(res.data);
      } else if (res?.raw?.errorCode === 17) {
        setIsRateLimited(true);
      }
    } catch (err) {
      console.warn('[CoffeeDonate] Manual verify error:', err);
    } finally {
      setIsCheckingManual(false);
    }
  };

  // Real-time Bakong payment listener (every 5 seconds)
  useEffect(() => {
    if (!isOpen || !md5Hash || paymentSuccess || isRateLimited) return;

    let isSubscribed = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await checkBakongPayment(md5Hash);
        if (!isSubscribed) return;
        if (res && res.isPaid && res.data) {
          clearInterval(pollInterval);
          playPaymentSuccessSound();
          setPaymentSuccess(res.data);
        } else if (res?.raw?.errorCode === 17) {
          setIsRateLimited(true);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.warn('[CoffeeDonate] Polling check failed:', err);
      }
    }, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, md5Hash, paymentSuccess, isRateLimited]);

  const formatAmount = (val) => {
    return formatKhqrAmount(val, currency);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2200);
  };

  const handleDownload = (e) => {
    e?.stopPropagation();
    const downloadImg = brandedCardImage || qrImage;
    if (!downloadImg) return;
    const link = document.createElement('a');
    link.href = downloadImg;
    link.download = `Bakong_KHQR_${currency}_${amount}.png`;
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
          <div className={`donate-modal-lux ${paymentSuccess ? 'modal-success-mode' : ''}`} onClick={e => e.stopPropagation()}>
            <div className={`modal-header-lux ${paymentSuccess ? 'is-success-header' : ''}`}>
              <div className="header-title-box">
                <div className={`heart-icon-box ${paymentSuccess ? 'success-heart-icon' : ''}`}>
                  {paymentSuccess ? <Sparkles size={20} color="#10b981" /> : <Coffee size={20} />}
                </div>
                <div className="title-text-lux">
                  <h2>{paymentSuccess ? 'Payment Confirmed' : t('buy_us_coffee')}</h2>
                  {paymentSuccess ? (
                    <div className="expiry-mini settled-pill">
                      <span className="live-pulse-dot mini-dot" />
                      <span>NBC Bakong Network • Instant Settlement</span>
                    </div>
                  ) : (
                    <div className="expiry-mini">
                      <Clock size={12} />
                      <span>{t('expires_in')} {formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn-close-lux" onClick={() => { setPaymentSuccess(null); setIsOpen(false); }}><X size={18} /></button>
            </div>

            <div className="modal-body-lux">
              {paymentSuccess ? (
                <div className="payment-success-card-lux">
                  {/* Floating celebration particles */}
                  <div className="success-particles-bg">
                    <span className="sp-dot sp-1"></span>
                    <span className="sp-dot sp-2"></span>
                    <span className="sp-dot sp-3"></span>
                    <span className="sp-dot sp-4"></span>
                    <span className="sp-dot sp-5"></span>
                  </div>

                  {/* Multi-layered Hero Glowing Badge */}
                  <div className="success-badge-stage">
                    <div className="success-wave-ring" />
                    <div className="success-frost-ring" />
                    <div className="success-core-badge">
                      <Check size={38} strokeWidth={3.2} color="#ffffff" />
                    </div>
                  </div>

                  {/* Status Headline */}
                  <div className="success-tag-pill">
                    <ShieldCheck size={14} color="#10b981" />
                    <span>PAYMENT RECEIVED • បានទទួលប្រាក់</span>
                  </div>

                  {/* Hero Amount Display */}
                  <div className="success-amount-lux">
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

                  {/* Heartfelt Thank You Note */}
                  <div className="appreciation-box">
                    <Coffee size={18} className="coffee-bounce-icon" />
                    <p>
                      Thank you so much for supporting <strong>ITsharing</strong>! Your coffee fuels our free developer tools & open resources.
                    </p>
                  </div>

                  {/* Primary Action Button */}
                  <button 
                    className="btn-done-lux" 
                    onClick={() => { setPaymentSuccess(null); setIsOpen(false); }}
                  >
                    <Check size={18} strokeWidth={2.8} />
                    <span>Done • រួចរាល់</span>
                  </button>
                </div>
              ) : (
                <>
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
                      onClick={() => (brandedCardImage || qrImage) && setSelectedQr({ img: brandedCardImage || qrImage, title: 'Bakong KHQR' })}
                    >
                      {loading ? (
                        <div className="qr-loader">
                          <div className="loader-ring" />
                        </div>
                      ) : (
                        <div className="qr-wrapper-minimal">
                          <div className="qr-img-frame-minimal">
                            {brandedCardImage || qrImage ? (
                              <img src={brandedCardImage || qrImage} alt="KHQR" className="qr-main-img" />
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
                        </div>
                      )}
                    </div>
                  </div>

                  <div 
                    className="payment-listener-status" 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '7px 14px', 
                      background: isRateLimited ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)', 
                      border: `1px solid ${isRateLimited ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.22)'}`, 
                      borderRadius: '16px', 
                      marginTop: '10px', 
                      fontSize: '0.78rem', 
                      color: isRateLimited ? '#f87171' : '#10b981', 
                      fontWeight: '600' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="live-pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRateLimited ? '#ef4444' : '#10b981', display: 'inline-block', boxShadow: isRateLimited ? '0 0 10px #ef4444' : '0 0 10px #10b981' }} />
                      <span>{isRateLimited ? 'NBC Daily Limit (100) Reached' : 'Real-time Payment Listener'}</span>
                    </div>
                    <button
                      onClick={handleVerifyNow}
                      disabled={isCheckingManual}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '3px 8px',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RefreshCw size={12} className={isCheckingManual ? 'spin-anim' : ''} />
                      <span>{isCheckingManual ? 'Checking...' : 'Check'}</span>
                    </button>
                  </div>

                  <div className="coffee-actions-bar" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button 
                      className="btn-action-lux" 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', height: '42px', borderRadius: '14px', color: '#fff', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
                      onClick={handleDownload}
                      title="Download Official KHQR Slip"
                    >
                      <Download size={16} />
                      <span>Download Slip</span>
                    </button>
                    <a 
                      href="https://link.payway.com.kh/ABAPAYKi431899N" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-action-lux donate-finish" 
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '0.95rem', height: '42px', margin: 0 }}
                      onClick={() => { setIsOpen(false); setShowThankYou(true); setTimeout(() => setShowThankYou(false), 3500); }}
                    >
                       ABA Payway
                    </a>
                  </div>
                </>
              )}
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
          position: fixed; bottom: 24px; right: 24px; z-index: 900;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          cursor: pointer; transition: all 0.4s cubic-bezier(0.17, 0.67, 0.83, 0.67);
        }
        @media (max-width: 768px) {
          .donate-trigger-lux { bottom: 16px; right: 16px; transform: scale(0.85); }
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

        .modal-header-lux { padding: 16px 20px 12px; display: flex; justify-content: space-between; align-items: center; }
        .header-title-box { display: flex; align-items: center; gap: 12px; }
        .heart-icon-box { width: 36px; height: 36px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; color: #6366f1; }
        .title-text-lux h2 { font-size: 1.25rem; color: #fff; font-weight: 900; margin: 0; }
        .expiry-mini { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 0.75rem; font-weight: 600; margin-top: 2px; }
        .btn-close-lux { background: transparent; border: none; color: #64748b; cursor: pointer; }

        .modal-body-lux { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 12px; }
        .donation-controls-row { display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.04); }
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
        .custom-amt-input { flex: 1; height: 40px; background: transparent; border: none; color: #fff; font-size: 1.1rem; font-weight: 800; outline: none; width: 100%; }
        .custom-amt-input::placeholder { color: #64748b; font-weight: 500; font-size: 0.95rem; }
        
        @media (min-width: 400px) { .amount-grid-compact { grid-template-columns: repeat(6, 1fr); } }

        .bakong-payment-card.qr-only { width: 100%; max-width: 270px; margin: 0 auto; position: relative; }
        .qr-display-box-minimal { width: 100%; background: #fff; border-radius: 20px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
        .qr-wrapper-minimal { width: 100%; position: relative; }
        .qr-main-img { width: 100%; height: auto; display: block; }
        
        .qr-download-btn-new { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); width: 40px; height: 40px; border-radius: 12px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .qr-download-btn-new:hover { background: rgba(255,255,255,0.15); transform: translateY(-2px); }
        
        .qr-loader { height: 160px; display: flex; align-items: center; justify-content: center; }
        .loader-ring { width: 32px; height: 32px; border: 3px solid #f1f5f9; border-top-color: #e52e2a; border-radius: 50%; animation: spinRotate 0.8s linear infinite; }
        @keyframes spinRotate { to { transform: rotate(360deg); } }

        .btn-action-lux.donate-finish { background: #6366f1; color: #fff; height: 44px; border-radius: 14px; border: none; font-weight: 800; cursor: pointer; margin-top: 4px; transition: 0.3s; }
        .btn-action-lux.donate-finish:hover { background: #4f46e5; transform: translateY(-2px); }

        .expired-mask { position: absolute; inset: 0; background: rgba(255,255,255,0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 10; font-weight: 900; color: #000; }
        .refresh-btn { background: #e52e2a; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; }

        /* ─── Luxury Payment Success State ─── */
        .modal-success-mode {
          border-color: rgba(16, 185, 129, 0.38) !important;
          box-shadow: 0 40px 90px -20px rgba(0, 0, 0, 0.75), 0 0 50px rgba(16, 185, 129, 0.16) !important;
        }
        .is-success-header {
          border-bottom: 1px solid rgba(16, 185, 129, 0.15);
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%);
        }
        .success-heart-icon {
          background: rgba(16, 185, 129, 0.15) !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
        }
        .settled-pill {
          color: #10b981 !important;
          font-weight: 700 !important;
          display: flex; align-items: center; gap: 6px;
        }
        .mini-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981; box-shadow: 0 0 8px #10b981;
          display: inline-block; animation: livePulse 1.8s infinite;
        }

        .payment-success-card-lux {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 8px 6px 6px; position: relative; overflow: hidden;
          animation: successEntrance 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes successEntrance {
          0% { opacity: 0; transform: scale(0.92) translateY(18px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Confetti / Particle accents */
        .success-particles-bg {
          position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
        }
        .sp-dot {
          position: absolute; border-radius: 50%; opacity: 0.65;
          animation: particleFloat 3.5s infinite ease-in-out alternate;
        }
        .sp-1 { width: 8px; height: 8px; background: #10b981; top: 15px; left: 18%; animation-delay: 0.2s; }
        .sp-2 { width: 6px; height: 6px; background: #60a5fa; top: 35px; right: 20%; animation-delay: 0.8s; }
        .sp-3 { width: 7px; height: 7px; background: #f59e0b; top: 85px; left: 10%; animation-delay: 0.5s; }
        .sp-4 { width: 5px; height: 5px; background: #a855f7; top: 95px; right: 12%; animation-delay: 1.1s; }
        .sp-5 { width: 6px; height: 6px; background: #34d399; top: 135px; left: 24%; animation-delay: 0.9s; }
        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); opacity: 0.4; }
          100% { transform: translateY(-14px) scale(1.3); opacity: 0.85; }
        }

        /* Hero Badge Stage */
        .success-badge-stage {
          position: relative; width: 100px; height: 100px;
          display: flex; align-items: center; justify-content: center;
          margin: 6px 0 10px; z-index: 1;
        }
        .success-wave-ring {
          position: absolute; inset: 0; border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(16, 185, 129, 0) 70%);
          animation: successWave 2.4s infinite ease-out;
        }
        @keyframes successWave {
          0% { transform: scale(0.85); opacity: 0.8; }
          50% { transform: scale(1.22); opacity: 0.25; }
          100% { transform: scale(0.85); opacity: 0.8; }
        }
        .success-frost-ring {
          position: absolute; width: 82px; height: 82px; border-radius: 50%;
          border: 2px solid rgba(16, 185, 129, 0.45);
          background: rgba(16, 185, 129, 0.1);
          backdrop-filter: blur(8px);
        }
        .success-core-badge {
          position: relative; width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 28px -4px rgba(16, 185, 129, 0.65), 0 0 0 3px rgba(255, 255, 255, 0.2);
          animation: corePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes corePop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        .success-tag-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 20px;
          background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);
          color: #10b981; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em;
          text-transform: uppercase; margin-bottom: 6px; z-index: 1;
        }

        /* Hero Amount Display */
        .success-amount-lux {
          margin: 0 0 14px; z-index: 1;
        }
        .amount-num {
          font-size: 2.75rem; font-weight: 900; letter-spacing: -0.03em;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #86efac 0%, #34d399 40%, #10b981 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 6px 18px rgba(16, 185, 129, 0.35));
          display: inline-block; line-height: 1.1;
        }

        /* Luxury Digital Receipt Card */
        .receipt-card-lux {
          width: 100%; border-radius: 20px; position: relative;
          background: linear-gradient(180deg, rgba(24, 33, 49, 0.88) 0%, rgba(15, 23, 42, 0.96) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: 2px solid #10b981;
          box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.6);
          padding: 14px 16px; margin-bottom: 12px; z-index: 1;
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

        /* Appreciation Note */
        .appreciation-box {
          width: 100%; border-radius: 14px;
          background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.22);
          padding: 10px 14px; display: flex; align-items: center; gap: 10px;
          text-align: left; margin-bottom: 14px; z-index: 1;
        }
        .coffee-bounce-icon {
          color: #f59e0b; flex-shrink: 0; animation: coffeeBounce 2s infinite ease-in-out;
        }
        @keyframes coffeeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px) rotate(-6deg); }
        }
        .appreciation-box p {
          margin: 0; color: #fbbf24; font-size: 0.78rem; line-height: 1.45; font-weight: 500;
        }
        .appreciation-box strong {
          color: #fff; font-weight: 800;
        }

        /* Done Button */
        .btn-done-lux {
          width: 100%; height: 46px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #10b981 0%, #059669 45%, #2563eb 100%);
          color: #ffffff; font-weight: 800; font-size: 0.96rem;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; z-index: 1;
          box-shadow: 0 12px 28px -6px rgba(16, 185, 129, 0.45);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-done-lux:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px -6px rgba(16, 185, 129, 0.65);
          filter: brightness(1.08);
        }
        .btn-done-lux:active {
          transform: translateY(0);
        }

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
