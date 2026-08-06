/**
 * DeviceBlockGuard.jsx — Global device, IP, and Account security guard
 *
 * Checks Firestore `blocked_entities` collection in real-time.
 * If the current user's deviceId, IP, or logged-in account email is blocked:
 * Displays a dedicated, high-impact Banned Screen with Appeal Form & Sign-out.
 */

import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getDeviceId } from '../utils/deviceFingerprint';
import { sendTelegramAlert, getMasterControlKeyboard } from '../utils/telegramNotify';
import { ShieldAlert, UserX, Globe, Smartphone, Send, LogOut, CheckCircle, Mail, User, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const DeviceBlockGuard = ({ children }) => {
  const [isBlocked, setIsBlocked]     = useState(false);
  const [blockData, setBlockData]     = useState(null);
  const [userIP, setUserIP]           = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Appeal Form State
  const [appealText, setAppealText]   = useState('');
  const [appealSent, setAppealSent]   = useState(false);
  const [sendingAppeal, setSendingAppeal] = useState(false);

  const deviceId = getDeviceId();

  // Listen to auth state
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubAuth();
  }, []);

  // Fetch client IP address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIP(data.ip || ''))
      .catch(() => {
        fetch('https://ip-api.com/json/')
          .then(res => res.json())
          .then(data => setUserIP(data.query || ''))
          .catch(() => {});
      });
  }, []);

  // Real-time Firestore Blocked Entities listener
  useEffect(() => {
    const q = query(collection(db, 'blocked_entities'));
    const unsub = onSnapshot(q, (snap) => {
      const blockedList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const safeId = (str) => (str || '').toLowerCase().replace(/[^a-zA-Z0-9._-]/g, '_');

      const matched = blockedList.find(b => {
        // Device ID match
        if (b.deviceId && b.deviceId === deviceId) return true;
        if (b.type === 'device' && b.id === `device_${safeId(deviceId)}`) return true;

        // IP Address match
        if (userIP) {
          if (b.type === 'ip' && b.ip && b.ip.trim() === userIP.trim()) return true;
          if (b.id === `ip_${safeId(userIP)}`) return true;
        }

        // Account Email match
        if (currentUser?.email) {
          const userEmail = currentUser.email.toLowerCase().trim();
          if (b.email && b.email.toLowerCase().trim() === userEmail) return true;
          if (b.id === `email_${safeId(userEmail)}`) return true;
        }

        return false;
      });

      if (matched) {
        setIsBlocked(true);
        setBlockData(matched);
      } else {
        setIsBlocked(false);
        setBlockData(null);
      }
    }, () => {});

    return () => unsub();
  }, [deviceId, userIP, currentUser]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsBlocked(false);
      window.location.href = '/login';
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const handleSendAppeal = async (e) => {
    e.preventDefault();
    if (!appealText.trim()) return;
    setSendingAppeal(true);

    const targetEmail = blockData?.email || currentUser?.email || 'theghostkhmer@gmail.com';
    const textReason  = appealText.trim();

    try {
      // 1. Try serverless endpoint (handles Telegram alert + Firestore write)
      const res = await fetch('/api/submit-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          deviceId,
          ip: userIP || '127.0.0.1',
          blockType: blockData?.type || 'account',
          appealText: textReason
        })
      });

      if (!res.ok) throw new Error('API unavailable');
      setAppealSent(true);
    } catch (err) {
      // 2. Fallback: Write directly to Firestore and attempt Telegram alert
      try {
        await addDoc(collection(db, 'ban_appeals'), {
          email: targetEmail,
          deviceId,
          ip: userIP || 'unknown',
          blockType: blockData?.type || 'account',
          note: blockData?.note || 'Banned account',
          appealText: textReason,
          status: 'pending',
          timestamp: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
        setAppealSent(true);

        const alertMsg = `
✉️ <b>NEW UNBLOCK APPEAL SUBMITTED</b>
─────────────────────────────
• 👤 <b>User Account:</b> <code>${targetEmail}</code>
• 📱 <b>Device ID:</b> <code>${deviceId || 'Unknown'}</code>
• 🌐 <b>IP Address:</b> <code>${userIP || 'Unknown'}</code>
• 🚫 <b>Block Type:</b> <code>${(blockData?.type || 'account').toUpperCase()}</code>

<b>Submitted Reason:</b>
<i>"${textReason}"</i>
─────────────────────────────
<i>Click an option below to approve or review appeals in real-time.</i>
        `.trim();

        const inlineButtons = [
          [{ text: `✅ Approve Unblock: ${targetEmail}`, callback_data: `unblock:${targetEmail}` }],
          [{ text: '✉️ View All Appeals', callback_data: 'appeals' }]
        ];

        sendTelegramAlert(alertMsg, getMasterControlKeyboard(inlineButtons)).catch(() => {});
      } catch (e) {
        console.error('Fallback appeal failed:', e);
      }
    } finally {
      setSendingAppeal(false);
    }
  };

  if (isBlocked) {
    const isIPBlock    = blockData?.type === 'ip';
    const isEmailBlock = blockData?.type === 'email';
    const bannedEmail  = blockData?.email || currentUser?.email || 'theghostkhmer@gmail.com';

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999999,
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
        color: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        overflowY: 'auto',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            maxWidth: '480px', width: '100%',
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '24px', padding: '32px 24px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85), 0 0 50px rgba(239, 68, 68, 0.25)',
            boxSizing: 'border-box', margin: 'auto'
          }}
        >
          {/* Top Icon Badge */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.1))',
            border: '1px solid rgba(239, 68, 68, 0.45)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)'
          }}>
            {isEmailBlock ? (
              <UserX size={42} color="#ef4444" />
            ) : isIPBlock ? (
              <Globe size={42} color="#ef4444" />
            ) : (
              <Smartphone size={42} color="#ef4444" />
            )}
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isEmailBlock ? 'Account Banned' : 'Access Denied'}
          </h2>

          {/* Type Badge */}
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
            color: '#ef4444', borderRadius: '12px', padding: '8px 16px',
            fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: '8px',
            marginBottom: '20px'
          }}>
            {isEmailBlock ? <UserX size={15} /> : isIPBlock ? <Globe size={15} /> : <Smartphone size={15} />}
            {isEmailBlock ? 'ACCOUNT SUSPENDED / BANNED' : isIPBlock ? 'IP ACCESS BANNED' : 'DEVICE ACCESS BANNED'}
          </div>

          {/* Banned User Account Identity Pill */}
          {isEmailBlock && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '14px', padding: '10px 16px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}>
              <Mail size={16} color="#ef4444" />
              <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>
                {bannedEmail}
              </span>
            </div>
          )}

          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
            {isEmailBlock
              ? `This user account (${bannedEmail}) has been disabled and suspended by an administrator.`
              : `This ${isIPBlock ? 'IP address' : 'device'} has been blocked due to security policy violations.`
            }
          </p>

          {/* Details Card */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px 18px', marginBottom: '24px',
            textAlign: 'left', fontSize: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {isEmailBlock && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Banned Email:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>
                  {bannedEmail}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Device ID:</span>
              <span style={{
                fontFamily: 'monospace', fontWeight: 700, color: '#a855f7',
                background: 'rgba(168,85,247,0.12)', padding: '2px 8px', borderRadius: '6px',
                fontSize: '0.82rem', border: '1px solid rgba(168,85,247,0.2)'
              }}>
                {deviceId}
              </span>
            </div>

            {userIP && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>IP Address:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#cbd5e1', fontSize: '0.82rem' }}>
                  {userIP}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Ban Reason:</span>
              <span style={{
                fontWeight: 700, color: '#f8fafc', background: 'rgba(255,255,255,0.05)',
                padding: '8px 12px', borderRadius: '8px', wordBreak: 'break-word', fontSize: '0.85rem'
              }}>
                {blockData?.note || 'Administrative Account Ban'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
              <span style={{ color: '#ef4444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PERMANENT ACCOUNT BAN
              </span>
            </div>
          </div>

          {/* Submit Appeal Section */}
          {!appealSent ? (
            <form onSubmit={handleSendAppeal} style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                ✉️ Submit Appeal to Administrator:
              </label>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                placeholder="Explain why your account should be unblocked..."
                rows={3}
                style={{
                  width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '0.85rem',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px'
                }}
              />
              <button
                type="submit"
                disabled={sendingAppeal || !appealText.trim()}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff',
                  border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: sendingAppeal || !appealText.trim() ? 0.6 : 1
                }}
              >
                <Send size={15} /> {sendingAppeal ? 'Submitting Appeal...' : 'Submit Appeal to Admin'}
              </button>
            </form>
          ) : (
            <div style={{
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '14px', padding: '14px', color: '#22c55e', fontSize: '0.85rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', marginBottom: '20px'
            }}>
              <CheckCircle size={18} /> Appeal submitted! An administrator will review your request.
            </div>
          )}

          {/* Sign Out & Switch Account Button */}
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', padding: '12px 18px', borderRadius: '14px',
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={16} /> Sign In with Another Account
          </button>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default DeviceBlockGuard;
