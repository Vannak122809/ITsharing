/**
 * DeviceBlockGuard.jsx — Global device & IP security guard
 *
 * Checks Firestore `blocked_entities` collection in real-time.
 * If the current user's deviceId or IP is marked as blocked,
 * displays a full-screen Security Lockout interface.
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { getDeviceId } from '../utils/deviceFingerprint';
import { ShieldAlert, Lock, AlertTriangle, RefreshCw, Smartphone, Globe, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DeviceBlockGuard = ({ children }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockData, setBlockData] = useState(null);
  const [userIP, setUserIP]       = useState('');
  const deviceId                  = getDeviceId();

  // Fetch client IP address for IP block enforcement
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

  useEffect(() => {
    // Listen to blocked_entities collection
    const q = query(collection(db, 'blocked_entities'));
    const unsub = onSnapshot(q, (snap) => {
      const blockedList = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const safeId = (str) => (str || '').replace(/[^a-zA-Z0-9._-]/g, '_');

      // Check if current deviceId OR client IP is blocked
      const matched = blockedList.find(b => {
        // Device ID match
        if (b.deviceId && b.deviceId === deviceId) return true;
        if (b.type === 'device' && b.id === `device_${safeId(deviceId)}`) return true;

        // IP Address match
        if (userIP) {
          if (b.type === 'ip' && b.ip && b.ip.trim() === userIP.trim()) return true;
          if (b.id === `ip_${safeId(userIP)}`) return true;
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
    }, () => {
      // Ignore listener error
    });

    return () => unsub();
  }, [deviceId, userIP]);

  if (isBlocked) {
    const isIPBlock = blockData?.type === 'ip';

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
            maxWidth: '460px', width: '100%',
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '24px', padding: '32px 20px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 50px rgba(239, 68, 68, 0.25)',
            boxSizing: 'border-box',
          }}
        >
          {/* Glowing Red Shield Icon */}
          <div style={{
            width: '76px', height: '76px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.08))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)'
          }}>
            <ShieldAlert size={38} color="#ef4444" style={{ display: 'block' }} />
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f8fafc', marginBottom: '10px', letterSpacing: '-0.02em' }}>
            Access Denied
          </h2>

          {/* Warning Badge */}
          <div style={{
            background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', borderRadius: '12px', padding: '8px 16px',
            fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginBottom: '20px'
          }}>
            {isIPBlock ? <Globe size={14} /> : <Smartphone size={14} />}
            {isIPBlock ? 'IP ACCESS BANNED' : 'DEVICE ACCESS BANNED'}
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px', padding: '0 6px' }}>
            This {isIPBlock ? 'IP address' : 'device'} has been flagged and blocked from accessing ITShare due to multiple security policy violations or automated attack activity.
          </p>

          {/* Responsive Block Details Card (Bootstrap-Style) */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px 18px', marginBottom: '24px',
            textAlign: 'left', fontSize: '0.85rem',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {/* Device ID Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Device ID:</span>
              <span style={{
                fontFamily: 'monospace', fontWeight: 700, color: '#ef4444',
                background: 'rgba(239,68,68,0.12)', padding: '3px 8px', borderRadius: '6px',
                fontSize: '0.82rem', border: '1px solid rgba(239,68,68,0.2)'
              }}>
                {deviceId}
              </span>
            </div>

            {/* IP Address Row (if available) */}
            {userIP && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>IP Address:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#cbd5e1', fontSize: '0.82rem' }}>
                  {userIP}
                </span>
              </div>
            )}

            {/* Reason Row (Stacked layout for clean mobile reading) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Reason:</span>
              <span style={{
                fontWeight: 700, color: '#f8fafc', background: 'rgba(255,255,255,0.05)',
                padding: '8px 12px', borderRadius: '8px', wordBreak: 'break-word', fontSize: '0.85rem'
              }}>
                {blockData?.note || 'Security Policy Violation'}
              </span>
            </div>

            {/* Status Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Status:</span>
              <span style={{ color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                PERMANENT BLOCK
              </span>
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            If you believe this is a mistake, please contact support with your Device ID.
          </p>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default DeviceBlockGuard;
