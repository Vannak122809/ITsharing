import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection, query, orderBy, limit, onSnapshot, doc, setDoc, deleteDoc, where, getDocs
} from 'firebase/firestore';
import {
  Shield, AlertTriangle, Globe, MapPin, Monitor, Clock,
  User, Wifi, TrendingUp, Eye, Filter, RefreshCw, Download,
  XCircle, ChevronDown, ChevronUp, Activity, Lock, Zap,
  Unlock, Ban, Trash2, CheckCircle, Search, Plus, ShieldCheck, ShieldAlert, UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AttackMap from '../components/AttackMap';
import ConfirmModal from '../components/ConfirmModal';

const THREAT_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.12)',   border: '#ef4444', text: '#ef4444',   label: 'HIGH'   },
  medium: { bg: 'rgba(245,158,11,0.12)',  border: '#f59e0b', text: '#f59e0b',   label: 'MEDIUM' },
  low:    { bg: 'rgba(34,197,94,0.12)',   border: '#22c55e', text: '#22c55e',   label: 'LOW'    },
};

const EVENT_META = {
  failed_login:         { icon: Lock,          label: 'Failed Login',          color: '#f59e0b' },
  brute_force_detected: { icon: AlertTriangle, label: 'Brute Force',           color: '#ef4444' },
  rate_limit_hit:       { icon: Zap,           label: 'Rate Limit',            color: '#8b5cf6' },
  unauthorized_access:  { icon: XCircle,       label: 'Unauthorized',          color: '#ef4444' },
  suspicious_request:   { icon: Eye,           label: 'Suspicious',            color: '#f59e0b' },
  blocked_download:     { icon: Download,      label: 'Blocked Download',      color: '#3b82f6' },
  admin_access_denied:  { icon: Shield,        label: 'Admin Denied',          color: '#ef4444' },
};

function getThreatLevel(score) {
  if (score >= 50) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

function timeAgo(isoStr) {
  if (!isoStr) return '—';
  const diff = Date.now() - new Date(isoStr).getTime();
  const s = Math.floor(diff / 1000);
  if (isNaN(s)) return '—';
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function getLogDeviceId(log) {
  if (!log) return 'DEV-UNKNOWN';
  if (log.deviceId) return log.deviceId;
  const raw = `${log.ip || '127.0.0.1'}~~~${log.userAgent || 'agent'}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `DEV-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--surface-border)',
      borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
        <div style={{ background: `${color}20`, padding: '8px', borderRadius: '12px' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  );
}

function LogRow({ log, expanded, onToggle }) {
  const level   = getThreatLevel(log.threatScore || 0);
  const colors  = THREAT_COLORS[level];
  const evMeta  = EVENT_META[log.eventType] || { icon: Shield, label: log.eventType, color: '#64748b' };
  const EvIcon  = evMeta.icon;
  const flagUrl = log.countryCode ? `https://flagcdn.com/24x18/${log.countryCode.toLowerCase()}.png` : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: colors.bg, border: `1px solid ${colors.border}30`,
        borderRadius: '16px', overflow: 'hidden', marginBottom: '8px',
      }}
    >
      {/* Summary Row */}
      <div
        onClick={onToggle}
        style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr auto',
          gap: '16px', padding: '16px 20px', alignItems: 'center', cursor: 'pointer',
        }}
      >
        {/* Event type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: `${evMeta.color}20`, padding: '8px', borderRadius: '10px' }}>
            <EvIcon size={16} color={evMeta.color} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{evMeta.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(log.timestamp)}</div>
          </div>
        </div>

        {/* IP & Device ID */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Monitor size={14} color="var(--text-muted)" />
            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
              {log.ip || 'Unknown'}
            </span>
            {(log.isProxy || log.isHosting) && (
              <span style={{ background: '#ef444420', color: '#ef4444', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>
                {log.isProxy ? 'VPN' : 'BOT'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#a855f7', fontFamily: 'monospace', fontWeight: 700, marginTop: '2px' }}>
            📱 {getLogDeviceId(log)}
          </div>
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {flagUrl && <img src={flagUrl} alt={log.country} style={{ borderRadius: '3px' }} />}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{log.city || '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.country || '—'}</div>
          </div>
        </div>

        {/* Target User (email attempted) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <User size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden' }}>
            {log.metaEmail ? (
              <>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: log.accountExists ? '#ef4444' : '#f59e0b',
                  fontFamily: 'monospace', whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px'
                }}>
                  {log.metaEmail}
                </div>
                <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                  {log.accountExists
                    ? <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠ Real account</span>
                    : <span style={{ color: '#94a3b8' }}>Unknown email</span>
                  }
                </div>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
            )}
          </div>
        </div>

        {/* Threat Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '6px 14px', borderRadius: '20px',
            background: colors.bg, border: `1px solid ${colors.border}`,
            color: colors.text, fontSize: '0.8rem', fontWeight: 800,
          }}>
            {colors.label} · {log.threatScore || 0}
          </div>
        </div>

        {/* Expand toggle */}
        <div style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 20px 20px', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px',
              borderTop: `1px solid ${colors.border}20`,
              marginTop: '0', paddingTop: '16px',
            }}>
              {[
                { label: 'Full IP',     value: log.ip },
                { label: 'Device ID',   value: getLogDeviceId(log) },
                { label: 'ISP',        value: log.isp },
                { label: 'Region',     value: `${log.region}, ${log.country}` },
                { label: 'Timezone',   value: log.timezone },
                { label: 'Coords',     value: log.lat && log.lon ? `${log.lat}, ${log.lon}` : '—' },
                { label: 'VPN/Proxy',  value: log.isProxy ? '⚠ Yes' : 'No' },
                { label: 'Datacenter', value: log.isHosting ? '⚠ Yes (Bot)' : 'No' },
                { label: 'Target Email', value: log.metaEmail || '—' },
                { label: 'Page',       value: log.metaPage || '—' },
                { label: 'Timestamp',  value: new Date(log.timestamp).toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--card-dark)', borderRadius: '12px', padding: '12px',
                  border: '1px solid var(--surface-border)'
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600, wordBreak: 'break-all' }}>{value || '—'}</div>
                </div>
              ))}

              {/* User Agent — full width */}
              <div style={{
                gridColumn: '1 / -1', background: 'var(--card-dark)', borderRadius: '12px', padding: '12px',
                border: '1px solid var(--surface-border)'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Browser / User-Agent</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{log.userAgent || '—'}</div>
              </div>

              {/* Map link */}
              {log.lat && log.lon && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${log.lat}&mlon=${log.lon}&zoom=10`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      color: '#fff', padding: '10px 20px', borderRadius: '12px',
                      fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none',
                    }}
                  >
                    <MapPin size={14} /> View Location on Map
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const SecurityDashboard = ({ user }) => {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]          = useState(true);
  const [expandedId, setExpandedId]    = useState(null);
  const [filterEvent, setFilterEvent]  = useState('all');
  const [filterLevel, setFilterLevel]  = useState('all');
  const [activeView, setActiveView]    = useState('logs');
  const [blockedEntities, setBlocked]  = useState([]);
  const [actionLoading, setActLoad]    = useState({}); // { [key]: true }
  const [modalConfig, setModalConfig]  = useState({ isOpen: false, title: '', message: '', confirmText: 'Confirm', onConfirm: null, type: 'danger' });
  const [searchQuery, setSearchQuery]  = useState('');
  const [manualInput, setManualInput]  = useState('');

  // Telegram bot configuration state
  const [tgToken, setTgToken]     = useState(localStorage.getItem('itshare_telegram_token') || '');
  const [tgChatId, setTgChatId]   = useState(localStorage.getItem('itshare_telegram_chat_id') || '');
  const [testingTg, setTestingTg] = useState(false);
  const [manualType, setManualType]    = useState('ip');

  // ── Helper: manage user action with API + Firestore Fallback ────────────
  const safeDocId = (str) => (str || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);

  const manageUserFallback = async (action, payload) => {
    const { ip, email, note } = payload;
    if (action === 'block_ip') {
      const docId = `ip_${safeDocId(ip)}`;
      await setDoc(doc(db, 'blocked_entities', docId), {
        type: 'ip',
        ip,
        blocked: true,
        blockedAt: new Date().toISOString(),
        note: note || 'Blocked by admin',
      });
      return `IP ${ip} blocked`;
    } else if (action === 'unblock_ip') {
      const docId = `ip_${safeDocId(ip)}`;
      await deleteDoc(doc(db, 'blocked_entities', docId));
      return `IP ${ip} unblocked`;
    } else if (action === 'block_email') {
      const docId = `email_${safeDocId(email)}`;
      await setDoc(doc(db, 'blocked_entities', docId), {
        type: 'email',
        email,
        disabled: true,
        blockedAt: new Date().toISOString(),
        note: 'Blocked by admin — brute force detected',
      });
      return `Account ${email} blocked`;
    } else if (action === 'unblock_email') {
      const docId = `email_${safeDocId(email)}`;
      await deleteDoc(doc(db, 'blocked_entities', docId));
      return `Account ${email} unblocked`;
    } else if (action === 'block_device') {
      const { deviceId } = payload;
      const docId = `device_${safeDocId(deviceId)}`;
      await setDoc(doc(db, 'blocked_entities', docId), {
        type: 'device',
        deviceId,
        blocked: true,
        blockedAt: new Date().toISOString(),
        note: note || 'Blocked by admin',
      });
      return `Device ${deviceId} blocked`;
    } else if (action === 'unblock_device') {
      const { deviceId } = payload;
      const docId = `device_${safeDocId(deviceId)}`;
      await deleteDoc(doc(db, 'blocked_entities', docId));
      return `Device ${deviceId} unblocked`;
    } else if (action === 'clear_logs') {
      if (ip) {
        const q = query(collection(db, 'security_logs'), where('ip', '==', ip));
        const snap = await getDocs(q);
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
        return `Cleared ${snap.docs.length} logs for IP ${ip}`;
      }
    } else if (action === 'clear_all_logs') {
      const snap = await getDocs(collection(db, 'security_logs'));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return `Purged all ${snap.docs.length} security logs`;
    } else if (action === 'unblock_all') {
      const snap = await getDocs(collection(db, 'blocked_entities'));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      return `Unblocked all ${snap.docs.length} entities`;
    }
    return 'Action completed';
  };

  const manageUser = async (action, payload, key) => {
    setActLoad(p => ({ ...p, [key]: true }));
    const { toast } = await import('react-hot-toast');
    try {
      // 1. Try server API first
      try {
        const res = await fetch(`/api/manage-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            toast.success(data.message || 'Done');
            return;
          }
        }
      } catch (e) {
        // API server unavailable (e.g. running vite dev directly) — proceed to fallback
      }

      // 2. Client-side fallback via Firestore SDK directly
      const msg = await manageUserFallback(action, payload);
      toast.success(msg);
    } catch (err) {
      console.error('manageUser error:', err);
      toast.error('Operation failed');
    } finally {
      setActLoad(p => ({ ...p, [key]: false }));
    }
  };

  // Listen for security logs
  useEffect(() => {
    const q = query(
      collection(db, 'security_logs'),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Listen for blocked entities (live)
  useEffect(() => {
    const q = query(collection(db, 'blocked_entities'), limit(200));
    const unsub = onSnapshot(q, snap => {
      setBlocked(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Stats
  const total       = logs.length;
  const highThreats = logs.filter(l => (l.threatScore || 0) >= 50).length;
  const vpnCount    = logs.filter(l => l.isProxy).length;
  const bruteForces = logs.filter(l => l.eventType === 'brute_force_detected').length;
  const uniqueIPs   = new Set(logs.map(l => l.ip)).size;

  // Brute force grouped by IP — show distinct attacker IPs with 3+ fails
  const bruteByIP = Object.values(
    logs
      .filter(l => ['failed_login','brute_force_detected'].includes(l.eventType) && l.ip)
      .reduce((acc, l) => {
        const key = l.ip;
        if (!acc[key]) acc[key] = { ...l, count: 0, emails: new Set() };
        acc[key].count++;
        if (l.metaEmail) acc[key].emails.add(l.metaEmail);
        // Keep highest threat score
        if ((l.threatScore || 0) > (acc[key].threatScore || 0)) {
          Object.assign(acc[key], l);
        }
        acc[key].count = acc[key].count; // keep count
        return acc;
      }, {})
  ).filter(g => g.count >= 3).sort((a, b) => b.count - a.count);

  // Filter
  const filtered = logs.filter(l => {
    const levelMatch = filterLevel === 'all' || getThreatLevel(l.threatScore || 0) === filterLevel;
    const eventMatch = filterEvent === 'all' || l.eventType === filterEvent;
    const q = searchQuery.toLowerCase().trim();
    const searchMatch = !q || (
      (l.ip && l.ip.toLowerCase().includes(q)) ||
      (l.country && l.country.toLowerCase().includes(q)) ||
      (l.city && l.city.toLowerCase().includes(q)) ||
      (l.isp && l.isp.toLowerCase().includes(q)) ||
      (l.metaEmail && l.metaEmail.toLowerCase().includes(q))
    );
    return levelMatch && eventMatch && searchMatch;
  });

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Timestamp', 'Event', 'IP', 'Country', 'City', 'ISP', 'VPN', 'ThreatScore', 'Email', 'UserAgent'];
    const rows = logs.map(l => [
      l.timestamp, l.eventType, l.ip, l.country, l.city, l.isp,
      l.isProxy ? 'Yes' : 'No', l.threatScore, l.metaEmail, `"${(l.userAgent || '').replace(/"/g, "'")}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `security_logs_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div style={{ paddingTop: '90px', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '1400px', paddingBottom: '60px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', padding: '10px', borderRadius: '16px', display: 'flex' }}>
                  <Shield size={24} color="#fff" />
                </span>
                Security Dashboard
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
                Real-time attack monitor · Last {total} events
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={exportCSV}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: '#fff', border: 'none', padding: '12px 20px',
                  borderRadius: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
                }}
              >
                <Download size={16} /> Export CSV
              </button>

              <button
                onClick={() =>
                  setModalConfig({
                    isOpen: true,
                    title: 'Purge All Security Logs',
                    message: 'Are you sure you want to delete ALL security logs from database? This action cannot be undone.',
                    confirmText: 'Purge All Logs',
                    type: 'danger',
                    onConfirm: async () => {
                      await manageUser('clear_all_logs', {}, 'clear_all');
                      setModalConfig(prev => ({ ...prev, isOpen: false }));
                    },
                  })
                }
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444', padding: '12px 20px',
                  borderRadius: '14px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
                }}
              >
                <Trash2 size={16} /> Purge All Logs
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security Health Status Banner */}
        <div style={{
          background: bruteForces >= 5 || highThreats >= 10
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))'
            : bruteForces > 0 || highThreats >= 3
            ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.05))'
            : 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.05))',
          border: `1px solid ${
            bruteForces >= 5 || highThreats >= 10
              ? 'rgba(239,68,68,0.3)'
              : bruteForces > 0 || highThreats >= 3
              ? 'rgba(245,158,11,0.3)'
              : 'rgba(34,197,94,0.3)'
          }`,
          borderRadius: '20px', padding: '20px 24px', marginBottom: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '16px',
              background: bruteForces >= 5 || highThreats >= 10 ? '#ef4444' : bruteForces > 0 || highThreats >= 3 ? '#f59e0b' : '#22c55e',
              display: 'grid', placeItems: 'center', color: '#fff', boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
            }}>
              {bruteForces >= 5 || highThreats >= 10 ? <ShieldAlert size={26} /> : bruteForces > 0 || highThreats >= 3 ? <AlertTriangle size={26} /> : <ShieldCheck size={26} />}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                System Security Posture
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                {bruteForces >= 5 || highThreats >= 10 ? (
                  <span style={{ color: '#ef4444' }}>CRITICAL THREAT LEVEL</span>
                ) : bruteForces > 0 || highThreats >= 3 ? (
                  <span style={{ color: '#f59e0b' }}>ELEVATED ATTACK ACTIVITY</span>
                ) : (
                  <span style={{ color: '#22c55e' }}>SYSTEM SECURE & PROTECTED</span>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {bruteForces > 0
                  ? `${bruteForces} active brute-force attacker(s) detected. Recommendation: block malicious IPs.`
                  : 'No active brute-force threats detected. Firewall & rate limiters active.'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
              background: 'var(--surface-badge)', border: '1px solid var(--surface-border)', color: 'var(--text-main)'
            }}>
              🔒 Firewall Active
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard icon={Activity}      label="Total Events"    value={total}       color="#3b82f6" sub="All time" />
          <StatCard icon={AlertTriangle} label="High Threats"    value={highThreats} color="#ef4444" sub="Score ≥ 50" />
          <StatCard icon={Wifi}          label="VPN / Proxy IPs" value={vpnCount}    color="#f59e0b" sub="Suspicious origin" />
          <StatCard icon={Globe}         label="Unique IPs"      value={uniqueIPs}   color="#10b981" sub="Distinct attackers" />
          <StatCard icon={Lock}          label="Brute Forces"    value={bruteForces} color="#ef4444" sub="3+ failed logins" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--surface)', padding: '6px', borderRadius: '16px', border: '1px solid var(--surface-border)', width: 'fit-content', flexWrap: 'wrap' }}>
          {[
            { id: 'logs',     label: '📋 Event Logs' },
            { id: 'map',      label: '🗺️ Attack Map' },
            { id: 'brute',    label: `⚠️ Brute Force (${bruteByIP.length})` },
            { id: 'blocked',  label: `🚫 Blocked (${blockedEntities.length})` },
            { id: 'telegram', label: '✈️ Telegram Bot' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)}
              style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s',
                background: activeView === tab.id ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                color: activeView === tab.id ? '#fff' : 'var(--text-muted)',
              }}
            >{tab.label}</button>
          ))}
        </div>
        {/* ── MAP TAB ─────────────────────────────────────────────────── */}
        {activeView === 'map' && (
          <AttackMap logs={logs} />
        )}

        {/* ── BRUTE FORCE TAB ─────────────────────────────────────────── */}
        {activeView === 'brute' && (
          <div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
              IPs with <strong>3 or more failed login attempts</strong> — these are active credential-stuffing or brute force attackers.
            </p>
            {bruteByIP.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
                <Shield size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>No brute force attackers detected yet.</p>
              </div>
            ) : bruteByIP.map((g, i) => {
              const flagUrl = g.countryCode ? `https://flagcdn.com/20x15/${g.countryCode.toLowerCase()}.png` : null;
              return (
                <div key={g.ip} style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '16px', padding: '20px 24px', marginBottom: '12px',
                  display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr auto',
                  gap: '20px', alignItems: 'center',
                }}>
                  {/* Rank */}
                  <div style={{ fontWeight: 900, fontSize: '1.4rem', color: i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : 'var(--text-muted)', width: '32px', textAlign: 'center' }}>
                    #{i + 1}
                  </div>
                  {/* IP + Device ID + ISP */}
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#ef4444' }}>{g.ip}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a855f7', fontFamily: 'monospace', fontWeight: 800, marginTop: '2px' }}>
                      📱 {getLogDeviceId(g)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{g.isp || '—'}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {g.isProxy && <span style={{ background: '#ef444420', color: '#ef4444', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', border: '1px solid #ef444440' }}>VPN</span>}
                      {g.isHosting && <span style={{ background: '#ef444420', color: '#ef4444', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', border: '1px solid #ef444440' }}>BOT</span>}
                    </div>
                  </div>
                  {/* Location + Coords */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {flagUrl && <img src={flagUrl} alt={g.country} style={{ borderRadius: '2px' }} />}
                      {g.city || '—'}, {g.country || '—'}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {g.lat?.toFixed(5)}, {g.lon?.toFixed(5)}
                    </div>
                    {g.lat && g.lon && (
                      <a href={`https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lon}&zoom=12`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px', display: 'inline-block' }}>
                        📍 View on Map
                      </a>
                    )}
                  </div>
                  {/* Emails tried */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Emails Tried</div>
                    {[...g.emails].slice(0, 3).map(em => (
                      <div key={em} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: g.accountExists ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                        {em} {g.accountExists ? '⚠' : ''}
                      </div>
                    ))}
                    {g.emails.size > 3 && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{g.emails.size - 3} more</div>}
                  </div>
                  {/* Attempts count + Actions */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', lineHeight: 1 }}>{g.count}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '10px' }}>ATTEMPTS</div>
                    <div style={{ marginBottom: '8px', fontSize: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                      Score: {g.threatScore}
                    </div>
                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      {/* Block / Unblock IP */}
                      {blockedEntities.some(b => b.ip === g.ip) ? (
                        <button
                          disabled={actionLoading[`unblock_${g.ip}`]}
                          onClick={() => manageUser('unblock_ip', { ip: g.ip }, `unblock_${g.ip}`)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            padding: '7px 12px', borderRadius: '10px', border: '1px solid #22c55e',
                            background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                            fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                          }}>
                          <Unlock size={13} /> {actionLoading[`unblock_${g.ip}`] ? '...' : 'Unblock IP'}
                        </button>
                      ) : (
                        <button
                          disabled={actionLoading[`block_${g.ip}`]}
                          onClick={() => manageUser('block_ip', { ip: g.ip, note: `Brute force — ${g.count} attempts` }, `block_${g.ip}`)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            padding: '7px 12px', borderRadius: '10px', border: '1px solid #ef4444',
                            background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                            fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                          }}>
                          <Ban size={13} /> {actionLoading[`block_${g.ip}`] ? '...' : 'Block IP'}
                        </button>
                      )}
                      {/* Block / Unblock email */}
                      {[...g.emails][0] && (
                        blockedEntities.some(b => b.email === [...g.emails][0]) ? (
                          <button
                            disabled={actionLoading[`unblock_email_${g.ip}`]}
                            onClick={() => manageUser('unblock_email', { email: [...g.emails][0] }, `unblock_email_${g.ip}`)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              padding: '7px 12px', borderRadius: '10px', border: '1px solid #22c55e',
                              background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}>
                            <Unlock size={13} /> {actionLoading[`unblock_email_${g.ip}`] ? '...' : 'Unlock Account'}
                          </button>
                        ) : (
                          <button
                            disabled={actionLoading[`block_email_${g.ip}`]}
                            onClick={() => manageUser('block_email', { email: [...g.emails][0] }, `block_email_${g.ip}`)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              padding: '7px 12px', borderRadius: '10px', border: '1px solid #f59e0b',
                              background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}>
                            <Ban size={13} /> {actionLoading[`block_email_${g.ip}`] ? '...' : 'Block Account'}
                          </button>
                        )
                      )}
                      {/* Block / Unblock device */}
                      {(() => {
                        const devId = getLogDeviceId(g);
                        return blockedEntities.some(b => b.deviceId === devId) ? (
                          <button
                            disabled={actionLoading[`unblock_dev_${g.ip}`]}
                            onClick={() => manageUser('unblock_device', { deviceId: devId }, `unblock_dev_${g.ip}`)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              padding: '7px 12px', borderRadius: '10px', border: '1px solid #22c55e',
                              background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}>
                            <Unlock size={13} /> {actionLoading[`unblock_dev_${g.ip}`] ? '...' : 'Unlock Device'}
                          </button>
                        ) : (
                          <button
                            disabled={actionLoading[`block_dev_${g.ip}`]}
                            onClick={() => manageUser('block_device', { deviceId: devId, note: `Brute force attacker device (${g.ip})` }, `block_dev_${g.ip}`)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                              padding: '7px 12px', borderRadius: '10px', border: '1px solid #a855f7',
                              background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                            }}>
                            <Ban size={13} /> {actionLoading[`block_dev_${g.ip}`] ? '...' : 'Block Device'}
                          </button>
                        );
                      })()}
                      {/* Clear logs */}
                      <button
                        disabled={actionLoading[`clear_${g.ip}`]}
                        onClick={() =>
                          setModalConfig({
                            isOpen: true,
                            title: 'Clear Security Logs',
                            message: `Are you sure you want to clear all security logs for IP ${g.ip}? This action cannot be undone.`,
                            confirmText: 'Yes, Clear Logs',
                            type: 'danger',
                            onConfirm: async () => {
                              await manageUser('clear_logs', { ip: g.ip }, `clear_${g.ip}`);
                              setModalConfig(prev => ({ ...prev, isOpen: false }));
                            },
                          })
                        }
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '7px 12px', borderRadius: '10px', border: '1px solid var(--surface-border)',
                          background: 'var(--surface-badge)', color: 'var(--text-muted)',
                          fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                        }}>
                        <Trash2 size={13} /> {actionLoading[`clear_${g.ip}`] ? '...' : 'Clear Logs'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── BLOCKED TAB ─────────────────────────────────────────────── */}
        {activeView === 'blocked' && (
          <div>
            {/* Manual Block Form + Controls */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
              borderRadius: '20px', padding: '24px', marginBottom: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--primary)" /> Add Entity to Blocklist
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!manualInput.trim()) return;
                  const action = manualType === 'ip' ? 'block_ip' : manualType === 'email' ? 'block_email' : 'block_device';
                  const payload = manualType === 'ip'
                    ? { ip: manualInput.trim(), note: 'Manually blocked by admin' }
                    : manualType === 'email'
                    ? { email: manualInput.trim(), note: 'Manually blocked by admin' }
                    : { deviceId: manualInput.trim(), note: 'Manually blocked by admin' };
                  manageUser(action, payload, `manual_${manualInput.trim()}`);
                  setManualInput('');
                }}
                style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}
              >
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  style={{
                    padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)',
                    background: 'var(--card-dark)', color: 'var(--text-main)', fontWeight: 700, outline: 'none'
                  }}
                >
                  <option value="ip">🌐 Block IP Address</option>
                  <option value="email">👤 Block Account Email</option>
                  <option value="device">📱 Block Device ID</option>
                </select>

                <input
                  type="text"
                  placeholder={
                    manualType === 'ip'
                      ? 'Enter IP e.g. 175.100.52.174'
                      : manualType === 'email'
                      ? 'Enter email e.g. user@gmail.com'
                      : 'Enter Device ID e.g. DEV-8A9B2C3D'
                  }
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  style={{
                    flex: 1, minWidth: '240px', padding: '12px 16px', borderRadius: '12px',
                    border: '1px solid var(--surface-border)', background: 'var(--card-dark)',
                    color: 'var(--text-main)', fontWeight: 600, outline: 'none'
                  }}
                />

                <button
                  type="submit"
                  style={{
                    padding: '12px 24px', borderRadius: '12px', border: 'none',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <Ban size={16} /> Add to Blocklist
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Currently blocked IPs, devices, and accounts ({blockedEntities.length}). These entities are denied access.
              </p>
              {blockedEntities.length > 0 && (
                <button
                  onClick={() =>
                    setModalConfig({
                      isOpen: true,
                      title: 'Unblock All Entities',
                      message: 'Are you sure you want to unblock ALL blocked IPs, devices, and accounts?',
                      confirmText: 'Unblock All',
                      type: 'warning',
                      onConfirm: async () => {
                        await manageUser('unblock_all', {}, 'unblock_all');
                        setModalConfig(prev => ({ ...prev, isOpen: false }));
                      },
                    })
                  }
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px',
                    border: '1px solid #22c55e', background: 'rgba(34,197,94,0.1)',
                    color: '#22c55e', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                  }}
                >
                  <Unlock size={14} /> Unblock All
                </button>
              )}
            </div>
            {blockedEntities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
                <CheckCircle size={48} style={{ opacity: 0.3, marginBottom: '16px', color: '#22c55e' }} />
                <p>No blocked entities. Your app is clean.</p>
              </div>
            ) : blockedEntities.map(b => (
              <div key={b.id} style={{
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                borderRadius: '14px', padding: '16px 20px', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
              }}>
                {/* Type badge */}
                <span style={{
                  padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                  background: b.type === 'ip' ? 'rgba(239,68,68,0.15)' : b.type === 'device' ? 'rgba(168,85,247,0.15)' : 'rgba(245,158,11,0.15)',
                  color: b.type === 'ip' ? '#ef4444' : b.type === 'device' ? '#a855f7' : '#f59e0b',
                  border: `1px solid ${b.type === 'ip' ? '#ef444440' : b.type === 'device' ? '#a855f740' : '#f59e0b40'}`,
                  textTransform: 'uppercase',
                }}>
                  {b.type === 'ip' ? '🌐 IP' : b.type === 'device' ? '📱 Device' : '👤 Account'}
                </span>
                {/* Identity */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {b.ip || b.email || b.deviceId || '—'}
                  </div>
                  {b.note && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.note}</div>}
                </div>
                {/* Blocked at */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {b.blockedAt ? new Date(b.blockedAt).toLocaleString() : '—'}
                </div>
                {/* Unlock button */}
                <button
                  disabled={actionLoading[`unblock_b_${b.id}`]}
                  onClick={() => {
                    const action = b.type === 'ip' ? 'unblock_ip' : b.type === 'device' ? 'unblock_device' : 'unblock_email';
                    const payload = b.type === 'ip' ? { ip: b.ip } : b.type === 'device' ? { deviceId: b.deviceId } : { email: b.email };
                    manageUser(action, payload, `unblock_b_${b.id}`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 18px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff', border: 'none', fontWeight: 700,
                    fontSize: '0.85rem', cursor: 'pointer',
                    opacity: actionLoading[`unblock_b_${b.id}`] ? 0.6 : 1,
                  }}>
                  <Unlock size={15} />
                  {actionLoading[`unblock_b_${b.id}`] ? 'Unlocking...' : 'Unlock'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── TELEGRAM TAB ────────────────────────────────────────────── */}
        {activeView === 'telegram' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
              borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(59,130,246,0.15)', padding: '10px', borderRadius: '14px' }}>
                  <Send size={24} color="#3b82f6" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Telegram Security Bot Integration
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    Receive real-time attack notifications, unblock appeals, and run ban/unblock commands directly from Telegram.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Telegram Bot Token:
                  </label>
                  <input
                    type="password"
                    value={tgToken}
                    onChange={(e) => setTgToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNOpqr..."
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      background: 'var(--card-dark)', border: '1px solid var(--surface-border)',
                      color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Admin Telegram Chat ID:
                  </label>
                  <input
                    type="text"
                    value={tgChatId}
                    onChange={(e) => setTgChatId(e.target.value)}
                    placeholder="987654321"
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      background: 'var(--card-dark)', border: '1px solid var(--surface-border)',
                      color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  disabled={testingTg}
                  onClick={async () => {
                    if (!tgToken.trim() || !tgChatId.trim()) {
                      const { toast } = await import('react-hot-toast');
                      toast.error('Please enter both Telegram Bot Token and Chat ID!');
                      return;
                    }
                    setTestingTg(true);
                    const { toast } = await import('react-hot-toast');
                    const { saveTelegramConfig } = await import('../utils/telegramNotify');
                    saveTelegramConfig(tgToken, tgChatId);

                    try {
                      const res = await fetch('/api/telegram-test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: tgToken.trim(), chatId: tgChatId.trim() }),
                      });
                      const data = await res.json();
                      if (res.ok && data.ok) {
                        toast.success('✅ Telegram Settings Saved!');
                      } else {
                        toast.error(`❌ Telegram Error: ${data.error || 'Failed to save settings'}`);
                      }
                    } catch (err) {
                      toast.error(`❌ Connection Error: ${err.message}`);
                    } finally {
                      setTestingTg(false);
                    }
                  }}
                  style={{
                    padding: '12px 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem'
                  }}
                >
                  Save Settings
                </button>

                <button
                  disabled={testingTg}
                  onClick={async () => {
                    if (!tgToken.trim() || !tgChatId.trim()) {
                      const { toast } = await import('react-hot-toast');
                      toast.error('Please enter both Telegram Bot Token and Chat ID!');
                      return;
                    }
                    setTestingTg(true);
                    const { toast } = await import('react-hot-toast');
                    const { saveTelegramConfig } = await import('../utils/telegramNotify');
                    saveTelegramConfig(tgToken, tgChatId);

                    try {
                      const res = await fetch('/api/telegram-test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          token: tgToken.trim(),
                          chatId: tgChatId.trim(),
                          text: '🚀 <b>ITShare Security Bot Connected!</b>\nYour Telegram Bot is working! Live security alerts, unblock appeals, and ban commands are now connected.'
                        }),
                      });
                      const data = await res.json();
                      if (res.ok && data.ok) {
                        toast.success('🚀 Test Alert Sent to Telegram App!');
                      } else {
                        toast.error(`❌ Telegram API Error: ${data.error || 'Check Bot Token & Chat ID'}`);
                      }
                    } catch (err) {
                      toast.error(`❌ Network Error: ${err.message}`);
                    } finally {
                      setTestingTg(false);
                    }
                  }}
                  style={{
                    padding: '12px 20px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontWeight: 800,
                    cursor: 'pointer', fontSize: '0.88rem'
                  }}
                >
                  {testingTg ? 'Connecting & Sending...' : '🚀 Send Test Alert to Telegram'}
                </button>
              </div>
            </div>

            {/* Telegram Bot Commands Reference Guide */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--surface-border)',
              borderRadius: '20px', padding: '28px'
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 0, marginBottom: '16px' }}>
                🤖 Telegram Admin Bot Commands
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {[
                  { cmd: '/status', desc: 'View real-time security stats, attack counts & active bans' },
                  { cmd: '/ban_ip <IP>', desc: 'Ban an IP address directly from Telegram (e.g. /ban_ip 175.100.52.181)' },
                  { cmd: '/ban_device <DevID>', desc: 'Ban a Device ID directly from Telegram (e.g. /ban_device DEV-8F92A1B4)' },
                  { cmd: '/ban_account <Email>', desc: 'Ban a User Account directly from Telegram (e.g. /ban_account user@gmail.com)' },
                  { cmd: '/unblock <Target>', desc: 'Unblock any IP, Device ID, or Email (e.g. /unblock 175.100.52.181)' },
                  { cmd: '/help', desc: 'Display all available Telegram Bot commands' },
                ].map(({ cmd, desc }) => (
                  <div key={cmd} style={{
                    background: 'var(--card-dark)', border: '1px solid var(--surface-border)',
                    borderRadius: '14px', padding: '14px'
                  }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem', marginBottom: '4px' }}>
                      {cmd}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LOGS TAB ────────────────────────────────────────────────── */}
        {activeView === 'logs' && (<>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Live Search Input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface)',
            padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', flex: 1, minWidth: '260px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by IP, Email, Country, City, ISP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
            {searchQuery && (
              <X size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select value={filterEvent} onChange={e => setFilterEvent(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Events</option>
              {Object.entries(EVENT_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <AlertTriangle size={14} color="var(--text-muted)" />
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Levels</option>
              <option value="high">High Threat</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 'auto' }}>
            Showing {filtered.length} of {total} events
          </span>
        </div>

        {/* Column Headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr 1fr auto',
          gap: '16px', padding: '10px 20px', marginBottom: '8px',
          color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span>Event</span><span>IP Address</span><span>Location</span><span>Target User</span><span>Threat Level</span><span />
        </div>

        {/* Log Rows */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw size={32} className="spin" />
            <p style={{ marginTop: '16px' }}>Loading security events...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <Shield size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No security events match your filters.</p>
          </div>
        ) : (
          filtered.map(log => (
            <LogRow
              key={log.id}
              log={log}
              expanded={expandedId === log.id}
              onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
            />
          ))
        )}
        </>)}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        type={modalConfig.type}
      />
    </div>
  );
};

export default SecurityDashboard;
