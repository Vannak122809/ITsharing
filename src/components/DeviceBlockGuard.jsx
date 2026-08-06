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
import { ShieldAlert, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
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
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999999,
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
        color: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            maxWidth: '520px', width: '100%',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '28px', padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7), 0 0 50px rgba(239, 68, 68, 0.2)'
          }}
        >
          {/* Glowing Red Shield Icon */}
          <div style={{
            width: '84px', height: '84px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.1))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'grid', placeItems: 'center',
            margin: '0 auto 24px auto',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.35)'
          }}>
            <ShieldAlert size={42} color="#ef4444" />
          </div>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', marginBottom: '12px', letterSpacing: '-0.02em' }}>
            Access Denied
          </h2>

          <div style={{
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444', borderRadius: '12px', padding: '8px 16px',
            fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.06em', display: 'inline-block', marginBottom: '20px'
          }}>
            🚫 Device Access Banned
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
            This device has been flagged and blocked from accessing ITShare due to multiple security policy violations or automated attack activity.
          </p>

          {/* Block Details Box */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '28px',
            textAlign: 'left', fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Device ID:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ef4444' }}>{deviceId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Reason:</span>
              <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{blockData?.note || 'Security Policy Violation'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Status:</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>PERMANENT BLOCK</span>
            </div>
          </div>

          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
            If you believe this is a mistake, please contact support with your Device ID.
          </p>
        </motion.div>
      </div>
    );
  }

  return children;
};

export default DeviceBlockGuard;
