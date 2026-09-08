import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Shield, Smartphone, Upload, Search, Trash2, AlertTriangle,
  CheckCircle, XCircle, Zap, Eye, EyeOff, RefreshCw, Download,
  Globe, Lock, Activity, Package, Bug, Radio, Settings,
  ExternalLink, Copy, Filter, Cpu, WifiOff, Usb, FileSearch,
  ShieldCheck, ShieldAlert, ChevronRight, MonitorSmartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../LanguageContext';

import { AdbClient } from '../utils/adbClient';
import { analyzeApk, getVirusTotalUrl } from '../utils/apkParser';
import {
  calculateThreatScore, classifyPackage, getBloatwareManufacturer,
  analyzePermissions
} from '../utils/malwareDb';
import {
  getAllBlockedDomains, generateHostsFile, getDomainStats, DNS_PROVIDERS
} from '../utils/adDomains';

import './AndroidSecurity.css';

/* ─── Gauge ─── */
function Gauge({ score, level }) {
  const r = 64, circ = 2 * Math.PI * r, off = circ - (score / 100) * circ;
  const c = { safe: '#22c55e', low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' }[level] || '#22c55e';
  return (
    <div className="sec-gauge">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle className="sec-gauge-bg" cx="80" cy="80" r={r} />
        <circle className="sec-gauge-fill" cx="80" cy="80" r={r} stroke={c} strokeDasharray={circ} strokeDashoffset={off} />
      </svg>
      <div className="sec-gauge-center">
        <div className="sec-gauge-score" style={{ color: c }}>{score}</div>
        <div className="sec-gauge-label" style={{ color: c }}>{level}</div>
      </div>
    </div>
  );
}

/* ─── Terminal ─── */
function Term({ logs }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);
  return (
    <div className="sec-term">
      <div className="sec-term-bar">
        <div className="sec-term-dot" style={{ background: '#ff5f57' }} />
        <div className="sec-term-dot" style={{ background: '#febc2e' }} />
        <div className="sec-term-dot" style={{ background: '#28c840' }} />
        <span className="sec-term-label">adb shell</span>
      </div>
      <div className="sec-term-body" ref={ref}>
        {logs.length === 0 && <div style={{ opacity: 0.3 }}>$ awaiting connection...</div>}
        {logs.map((l, i) => (
          <div key={i} className={l.includes('✅') ? 'ok' : l.includes('❌') ? 'err' : l.includes('⚡') ? 'warn' : l.includes('Connected') ? 'info' : ''}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════ */
/*  MAIN COMPONENT                              */
/* ═════════════════════════════════════════════ */
const AndroidSecurity = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState('scanner');
  const [adb] = useState(() => new AdbClient());
  const [connected, setConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connecting, setConnecting] = useState(false);

  const [packages, setPackages] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanProg, setScanProg] = useState(0);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [removing, setRemoving] = useState(null);

  const [apkResult, setApkResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const [cats, setCats] = useState({ ads: true, trackers: true, telemetry: true, social: false, malware: true });
  const [selDns, setSelDns] = useState(null);
  const [curDns, setCurDns] = useState(null);

  const stats = getDomainStats();
  const webUsb = typeof navigator !== 'undefined' && !!navigator.usb;

  useEffect(() => {
    adb.on('log', m => setLogs(p => [...p.slice(-80), m]));
    adb.on('connected', () => setConnected(true));
    adb.on('disconnected', () => { setConnected(false); setDeviceInfo(null); });
  }, [adb]);

  const doConnect = useCallback(async () => {
    if (connected) { await adb.disconnect(); setConnected(false); setDeviceInfo(null); setPackages([]); return; }
    setConnecting(true);
    try {
      await adb.connect();
      const info = await adb.getDeviceInfo();
      setDeviceInfo(info); setConnected(true);
      try { setCurDns(await adb.getPrivateDns()); } catch {}
    } catch (e) { setLogs(p => [...p, `❌ ${e.message}`]); }
    finally { setConnecting(false); }
  }, [adb, connected]);

  const doScan = useCallback(async () => {
    if (!connected) return;
    setScanning(true); setScanProg(0); setPackages([]);
    try {
      setLogs(p => [...p, 'Scanning packages...']);
      const list = await adb.listPackages();
      const res = list.map((pkg, i) => {
        if (i % 20 === 0) setScanProg(Math.round((i / list.length) * 100));
        return { ...pkg, ...calculateThreatScore(pkg.packageName), classification: classifyPackage(pkg.packageName), manufacturer: getBloatwareManufacturer(pkg.packageName) };
      }).sort((a, b) => b.score - a.score);
      setPackages(res); setScanProg(100);
      const th = res.filter(p => p.score >= 20);
      setLogs(p => [...p, `✅ ${list.length} packages scanned, ${th.length} threats found`]);
    } catch (e) { setLogs(p => [...p, `❌ ${e.message}`]); }
    finally { setScanning(false); }
  }, [adb, connected]);

  const doRemove = useCallback(async (name) => {
    if (!connected) return;
    setRemoving(name);
    try {
      const r = await adb.uninstallPackage(name);
      if (r.success) { setPackages(p => p.filter(x => x.packageName !== name)); setSelected(p => { const n = new Set(p); n.delete(name); return n; }); }
    } catch (e) { setLogs(p => [...p, `❌ ${e.message}`]); }
    finally { setRemoving(null); }
  }, [adb, connected]);

  const doBatchRemove = useCallback(async () => { for (const pkg of selected) await doRemove(pkg); setSelected(new Set()); }, [selected, doRemove]);

  const doApk = useCallback(async (file) => {
    if (!file?.name?.endsWith('.apk')) return;
    setAnalyzing(true); setApkResult(null);
    setLogs(p => [...p, `Analyzing ${file.name} (${(file.size / 1048576).toFixed(2)} MB)...`]);
    try {
      const r = await analyzeApk(file); setApkResult(r);
      setLogs(p => [...p, `✅ ${r.threatScore.level.toUpperCase()} (${r.threatScore.score}/100) in ${r.analysisTimeMs}ms`]);
    } catch (e) { setLogs(p => [...p, `❌ ${e.message}`]); }
    finally { setAnalyzing(false); }
  }, []);

  const onDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); doApk(e.dataTransfer.files[0]); }, [doApk]);

  const doApplyDns = useCallback(async () => {
    if (!connected || !selDns) return;
    try { await adb.setPrivateDns(selDns.hostname); setCurDns({ mode: 'hostname_strict', specifier: selDns.hostname }); }
    catch (e) { setLogs(p => [...p, `❌ ${e.message}`]); }
  }, [adb, connected, selDns]);

  const doDisableDns = useCallback(async () => {
    if (!connected) return;
    try { await adb.disablePrivateDns(); setCurDns({ mode: 'off', specifier: '' }); }
    catch (e) { setLogs(p => [...p, `❌ ${e.message}`]); }
  }, [adb, connected]);

  const filtered = packages.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'threats') return p.score >= 20;
    if (filter === 'malware') return p.classification === 'malware';
    if (filter === 'adware') return p.classification === 'adware';
    if (filter === 'bloatware') return p.classification === 'bloatware';
    if (filter === 'safe') return p.score < 5;
    return true;
  });

  const cnt = {
    total: packages.length,
    threats: packages.filter(p => p.score >= 20).length,
    malware: packages.filter(p => p.classification === 'malware').length,
    adware: packages.filter(p => p.classification === 'adware').length,
    bloatware: packages.filter(p => p.classification === 'bloatware').length,
    safe: packages.filter(p => p.score < 5).length,
  };

  const activeDomains = getAllBlockedDomains(cats);

  return (
    <div className="sec-page">
      {/* ═══ HEADER ═══ */}
      <div className="sec-header">
        <div className="sec-header-left">
          <div className="sec-logo"><Shield size={24} color="#fff" /></div>
          <div className="sec-header-text">
            <h1>Android Security Suite</h1>
            <p>WebUSB-powered threat detection & protection</p>
          </div>
        </div>
        <div className="sec-header-right">
          <div className="sec-status-chip">
            <span className={`dot ${connected ? 'on' : 'off'}`} />
            {connected ? (deviceInfo ? `${deviceInfo.brand} ${deviceInfo.model}` : 'Connected') : 'No Device'}
          </div>
          {!webUsb && (
            <div className="sec-status-chip" style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <AlertTriangle size={12} /> Chrome Required
            </div>
          )}
        </div>
      </div>

      {/* ═══ TAB NAV ═══ */}
      <nav className="sec-nav">
        {[
          { id: 'scanner', icon: <MonitorSmartphone size={15} />, label: 'Device Scanner', badge: cnt.threats || null },
          { id: 'analyzer', icon: <FileSearch size={15} />, label: 'APK Analyzer' },
          { id: 'adblocker', icon: <ShieldCheck size={15} />, label: 'Ad Blocker' },
        ].map(n => (
          <button key={n.id} className={`sec-nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
            {n.icon} {n.label}
            {n.badge > 0 && <span className="sec-nav-badge">{n.badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sec-body">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════ */}
          {/* DEVICE SCANNER                  */}
          {/* ═══════════════════════════════ */}
          {tab === 'scanner' && (
            <motion.div key="scanner" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="sec-split">
                {/* ── SIDEBAR ── */}
                <div>
                  <div className="sec-sidebar-card">
                    <div className="sec-sidebar-card-top">
                      {!connected ? (
                        <>
                          <div className="sec-connect-anim">
                            <div className="ring a1" />
                            <div className="ring a2" />
                            <div className="icon"><Smartphone size={20} color="var(--tertiary)" /></div>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 4, position: 'relative' }}>Connect Device</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', position: 'relative' }}>USB debugging required</div>
                        </>
                      ) : (
                        <>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', position: 'relative' }}>
                            <Smartphone size={22} color="#10b981" />
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', position: 'relative' }}>{deviceInfo?.brand} {deviceInfo?.model}</div>
                          <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600, position: 'relative' }}>● Connected</div>
                        </>
                      )}
                    </div>

                    <div className="sec-sidebar-card-body">
                      <button className={`sec-connect-btn ${connected ? 'disconnect' : ''}`} onClick={doConnect} disabled={connecting || !webUsb}>
                        {connecting ? <RefreshCw size={16} className="spin" /> : connected ? <WifiOff size={16} /> : <Usb size={16} />}
                        {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect via USB'}
                      </button>

                      {connected && deviceInfo && (
                        <div className="sec-device-info">
                          {[
                            { l: 'Android', v: deviceInfo.androidVersion },
                            { l: 'SDK', v: deviceInfo.sdkVersion },
                            { l: 'Battery', v: `${deviceInfo.batteryLevel}` },
                            { l: 'Display', v: deviceInfo.resolution },
                          ].map(d => (
                            <div key={d.l} className="sec-device-info-cell">
                              <div className="lbl">{d.l}</div>
                              <div className="val">{d.v}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!connected && (
                        <ol className="sec-steps">
                          <li><span className="sec-step-num">1</span><span>Open <strong>Settings → About Phone</strong>, tap <strong>Build Number</strong> 7 times</span></li>
                          <li><span className="sec-step-num">2</span><span>Enable <strong>USB Debugging</strong> in Developer Options</span></li>
                          <li><span className="sec-step-num">3</span><span>Connect via <strong>USB cable</strong> and authorize on device</span></li>
                        </ol>
                      )}
                    </div>
                  </div>

                  <Term logs={logs} />
                </div>

                {/* ── MAIN ── */}
                <div className="sec-main">
                  <div className="sec-panel">
                    {/* Scan action */}
                    <div className="sec-scan-row">
                      <button className="sec-scan-btn" onClick={doScan} disabled={!connected || scanning}>
                        {scanning ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                        {scanning ? 'Scanning...' : 'Run Full Scan'}
                      </button>
                      {selected.size > 0 && (
                        <button className="sec-btn danger" onClick={doBatchRemove}>
                          <Trash2 size={14} /> Remove {selected.size} selected
                        </button>
                      )}
                      {packages.length > 0 && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {cnt.total} apps scanned
                        </span>
                      )}
                    </div>

                    {scanning && (
                      <div className="sec-progress">
                        <div className="sec-progress-track"><div className="sec-progress-fill" style={{ width: `${scanProg}%` }} /></div>
                        <div className="sec-progress-label"><span>Scanning packages...</span><span>{scanProg}%</span></div>
                      </div>
                    )}

                    {/* Stats row */}
                    {packages.length > 0 && (
                      <>
                        <div className="sec-stats">
                          {[
                            { l: 'Total', v: cnt.total, c: '#3b82f6', bg: 'rgba(59,130,246,0.1)', ic: <Package size={18} /> },
                            { l: 'Threats', v: cnt.threats, c: '#ef4444', bg: 'rgba(239,68,68,0.1)', ic: <AlertTriangle size={18} /> },
                            { l: 'Bloatware', v: cnt.bloatware, c: '#6b7280', bg: 'rgba(107,114,128,0.1)', ic: <Cpu size={18} /> },
                            { l: 'Clean', v: cnt.safe, c: '#10b981', bg: 'rgba(16,185,129,0.1)', ic: <CheckCircle size={18} /> },
                          ].map(s => (
                            <div key={s.l} className="sec-stat">
                              <div className="sec-stat-icon" style={{ background: s.bg, color: s.c }}>{s.ic}</div>
                              <div className="sec-stat-info">
                                <div className="sec-stat-num" style={{ color: s.v > 0 && s.l === 'Threats' ? '#ef4444' : undefined }}>{s.v}</div>
                                <div className="sec-stat-label">{s.l}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="sec-filters">
                          {[
                            { k: 'all', l: `All (${cnt.total})` },
                            { k: 'threats', l: `Threats (${cnt.threats})` },
                            { k: 'malware', l: `Malware (${cnt.malware})` },
                            { k: 'adware', l: `Adware (${cnt.adware})` },
                            { k: 'bloatware', l: `Bloatware (${cnt.bloatware})` },
                            { k: 'safe', l: `Safe (${cnt.safe})` },
                          ].map(f => (
                            <button key={f.k} className={`sec-filter ${filter === f.k ? 'on' : ''}`} onClick={() => setFilter(f.k)}>{f.l}</button>
                          ))}
                        </div>

                        <div className="sec-table-wrap">
                          <table className="sec-tbl">
                            <thead>
                              <tr>
                                <th style={{ width: 36 }}>
                                  <input type="checkbox" className="sec-chk"
                                    checked={selected.size === filtered.length && filtered.length > 0}
                                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(p => p.packageName)) : new Set())} />
                                </th>
                                <th>Package</th>
                                <th>Status</th>
                                <th>Risk</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map(p => (
                                <tr key={p.packageName}>
                                  <td><input type="checkbox" className="sec-chk" checked={selected.has(p.packageName)} onChange={e => setSelected(prev => { const n = new Set(prev); e.target.checked ? n.add(p.packageName) : n.delete(p.packageName); return n; })} /></td>
                                  <td>
                                    <div className="sec-pkg">{p.packageName}</div>
                                    {p.manufacturer && <div className="sec-pkg-sub">{p.manufacturer} bloatware</div>}
                                  </td>
                                  <td><span className={`sec-badge ${p.classification !== 'unknown' ? p.classification : p.level}`}>{p.classification !== 'unknown' ? p.classification : p.level}</span></td>
                                  <td><span style={{ fontWeight: 800, fontSize: '0.85rem', color: p.score >= 70 ? '#ef4444' : p.score >= 40 ? '#f59e0b' : p.score >= 20 ? '#3b82f6' : '#22c55e' }}>{p.score}</span></td>
                                  <td><button className="sec-sm-btn danger" onClick={() => doRemove(p.packageName)} disabled={removing === p.packageName}>{removing === p.packageName ? <RefreshCw size={11} className="spin" /> : <Trash2 size={11} />} Remove</button></td>
                                </tr>
                              ))}
                              {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No packages match this filter</td></tr>}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {!packages.length && !scanning && (
                      <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
                        <Search size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
                        <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>{connected ? 'Click "Run Full Scan" to analyze installed apps' : 'Connect your device to begin scanning'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════ */}
          {/* APK ANALYZER                    */}
          {/* ═══════════════════════════════ */}
          {tab === 'analyzer' && (
            <motion.div key="analyzer" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {!apkResult && !analyzing && (
                <div className={`sec-drop ${dragOver ? 'over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept=".apk" style={{ display: 'none' }} onChange={e => doApk(e.target.files[0])} />
                  <div className="sec-drop-icon"><Upload size={24} color="var(--primary)" /></div>
                  <h3>Drop APK File Here</h3>
                  <p>Drag and drop an .apk file or click to browse. Analysis is 100% client-side — nothing leaves your browser.</p>
                  <div className="sec-drop-tags"><span>.apk</span><span>Client-side</span><span>100% Private</span></div>
                </div>
              )}

              {analyzing && (
                <div className="sec-panel">
                  <div style={{ textAlign: 'center', padding: 64 }}>
                    <RefreshCw size={36} className="spin" color="var(--primary)" />
                    <p style={{ marginTop: 16, fontWeight: 700 }}>Analyzing APK...</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>Parsing manifest, scanning DEX strings, detecting ad SDKs</p>
                  </div>
                </div>
              )}

              {apkResult && !analyzing && (
                <>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <button className="sec-btn ghost" onClick={() => { setApkResult(null); if (fileRef.current) fileRef.current.value = ''; }}>
                      <RefreshCw size={14} /> New Analysis
                    </button>
                    <a href={getVirusTotalUrl(apkResult.sha256)} target="_blank" rel="noopener noreferrer" className="sec-btn primary">
                      <ExternalLink size={14} /> VirusTotal
                    </a>
                  </div>

                  <div className="sec-analysis-grid">
                    {/* LEFT */}
                    <div>
                      <div className="sec-panel">
                        <div className="sec-panel-body" style={{ textAlign: 'center' }}>
                          <Gauge score={apkResult.threatScore.score} level={apkResult.threatScore.level} />
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{apkResult.fileName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{apkResult.fileSizeMB} MB</div>
                          {apkResult.manifest && <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>{apkResult.manifest.package}</div>}

                          {apkResult.threatScore.reasons.length > 0 && (
                            <div style={{ textAlign: 'left', marginTop: 16 }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Findings</div>
                              {apkResult.threatScore.reasons.map((r, i) => (
                                <div key={i} style={{ fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px solid var(--surface-border-subtle)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                  <ShieldAlert size={12} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="sec-hash">
                            <span style={{ flex: 1 }}>{apkResult.sha256}</span>
                            <button onClick={() => navigator.clipboard.writeText(apkResult.sha256)}><Copy size={12} /></button>
                          </div>
                        </div>
                      </div>

                      {apkResult.adSdks.length > 0 && (
                        <div className="sec-panel">
                          <div className="sec-panel-head">
                            <span className="sec-panel-title"><Radio size={14} /> Ad SDKs ({apkResult.adSdks.length})</span>
                          </div>
                          <div className="sec-panel-body" style={{ paddingTop: 0 }}>
                            {apkResult.adSdks.map((s, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < apkResult.adSdks.length - 1 ? '1px solid var(--surface-border-subtle)' : 'none' }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{s.name}</div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.prefix}</div>
                                </div>
                                <span className={`sec-badge ${s.risk}`}>{s.risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {apkResult.manifest && (
                        <div className="sec-panel">
                          <div className="sec-panel-head"><span className="sec-panel-title"><Activity size={14} /> Manifest</span></div>
                          <div className="sec-panel-body" style={{ paddingTop: 0 }}>
                            {[
                              ['Package', apkResult.manifest.package],
                              ['Version', `${apkResult.manifest.versionName} (${apkResult.manifest.versionCode})`],
                              ['Min SDK', apkResult.manifest.minSdkVersion || '—'],
                              ['Target SDK', apkResult.manifest.targetSdkVersion || '—'],
                            ].map(([k, v]) => (
                              <div key={k} className="sec-meta-row"><span className="k">{k}</span><span className="v">{v}</span></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT */}
                    <div>
                      <div className="sec-panel">
                        <div className="sec-panel-head"><span className="sec-panel-title"><Lock size={14} /> Permissions ({apkResult.permissions.all.length})</span></div>
                        <div className="sec-panel-body" style={{ paddingTop: 0 }}>
                          {apkResult.permissions.combos.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Dangerous Combinations</div>
                              {apkResult.permissions.combos.map((c, i) => (
                                <div key={i} style={{ padding: '10px 14px', marginBottom: 6, borderRadius: 12, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', fontSize: '0.78rem' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 2 }}>{c.threat.replace(/_/g, ' ')}</div>
                                  <div style={{ color: 'var(--text-muted)' }}>{c.description}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {apkResult.permissions.dangerous.map((p, i) => (
                            <div key={i} className="sec-perm">
                              <span className={`sec-badge ${p.risk}`} style={{ flexShrink: 0 }}>{p.risk}</span>
                              <div><div className="sec-perm-name">{p.label}</div><div className="sec-perm-desc">{p.desc}</div></div>
                            </div>
                          ))}
                          {apkResult.permissions.dangerous.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                              <CheckCircle size={24} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
                              No dangerous permissions
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="sec-panel">
                        <div className="sec-panel-head"><span className="sec-panel-title"><Settings size={14} /> Components</span></div>
                        <div className="sec-panel-body" style={{ paddingTop: 0 }}>
                          <div className="sec-comp-mini">
                            {[
                              { l: 'Activities', v: apkResult.components.activities.length },
                              { l: 'Services', v: apkResult.components.services.length },
                              { l: 'Receivers', v: apkResult.components.receivers.length },
                              { l: 'Providers', v: apkResult.components.providers.length },
                            ].map(c => (
                              <div key={c.l} className="sec-comp-cell"><div className="num">{c.v}</div><div className="lbl">{c.l}</div></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Term logs={logs} />
            </motion.div>
          )}

          {/* ═══════════════════════════════ */}
          {/* AD BLOCKER                      */}
          {/* ═══════════════════════════════ */}
          {tab === 'adblocker' && (
            <motion.div key="adblocker" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* DNS Panel */}
              <div className="sec-panel">
                <div className="sec-panel-head">
                  <span className="sec-panel-title"><Globe size={16} /> DNS Ad Blocking</span>
                  {curDns && curDns.mode !== 'off' && curDns.specifier && (
                    <span className="sec-badge safe"><CheckCircle size={10} /> {curDns.specifier}</span>
                  )}
                </div>
                <div className="sec-panel-body">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                    Block ads at the network level using a privacy-focused DNS. Works on Android 9+ without root.
                  </p>
                  <div className="sec-dns-grid">
                    {DNS_PROVIDERS.map(d => (
                      <button key={d.hostname} className={`sec-dns-card ${selDns?.hostname === d.hostname ? 'picked' : ''}`} onClick={() => setSelDns(d)}>
                        <div className="sec-dns-card-name">{d.recommended && <Zap size={12} color="#f59e0b" />}{d.name}</div>
                        <div className="sec-dns-card-host">{d.hostname}</div>
                        <div className="sec-dns-card-desc">{d.description}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                    <button className="sec-btn success" disabled={!connected || !selDns} onClick={doApplyDns}>
                      <Shield size={14} /> {connected ? 'Apply to Device' : 'Connect Device First'}
                    </button>
                    {curDns && curDns.mode !== 'off' && (
                      <button className="sec-btn danger" onClick={doDisableDns} disabled={!connected}><XCircle size={14} /> Disable</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Toggles */}
              <div className="sec-panel">
                <div className="sec-panel-head">
                  <span className="sec-panel-title"><Filter size={14} /> Block Categories</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{activeDomains.length} domains active</span>
                </div>
                {[
                  { k: 'ads', label: 'Advertising', desc: `${stats.ads} domains`, icon: <EyeOff size={14} />, bg: 'rgba(239,68,68,0.08)', ic: '#ef4444' },
                  { k: 'trackers', label: 'Trackers & Analytics', desc: `${stats.trackers} domains`, icon: <Eye size={14} />, bg: 'rgba(168,85,247,0.08)', ic: '#a855f7' },
                  { k: 'telemetry', label: 'OEM Telemetry', desc: `${stats.telemetry} domains`, icon: <Radio size={14} />, bg: 'rgba(59,130,246,0.08)', ic: '#3b82f6' },
                  { k: 'social', label: 'Social Trackers', desc: `${stats.social} domains`, icon: <Globe size={14} />, bg: 'rgba(245,158,11,0.08)', ic: '#f59e0b' },
                  { k: 'malware', label: 'Malware Domains', desc: `${stats.malware} domains`, icon: <Bug size={14} />, bg: 'rgba(220,38,38,0.08)', ic: '#dc2626' },
                ].map(c => (
                  <div key={c.k} className="sec-toggle-row">
                    <div className="sec-toggle-left">
                      <div className="sec-toggle-icon" style={{ background: c.bg, color: c.ic }}>{c.icon}</div>
                      <div><div className="sec-toggle-label">{c.label}</div><div className="sec-toggle-sub">{c.desc}</div></div>
                    </div>
                    <button className={`sec-switch ${cats[c.k] ? 'on' : ''}`} onClick={() => setCats(p => ({ ...p, [c.k]: !p[c.k] }))} />
                  </div>
                ))}
              </div>

              {/* Hosts File Download */}
              <div className="sec-panel">
                <div className="sec-panel-head">
                  <span className="sec-panel-title"><Download size={14} /> Hosts File</span>
                </div>
                <div className="sec-panel-body">
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 14 }}>Download the generated hosts file for rooted devices or apps like AdAway.</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="sec-btn success" onClick={() => {
                      const blob = new Blob([generateHostsFile(cats)], { type: 'text/plain' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hosts'; a.click();
                    }}>
                      <Download size={14} /> Download
                    </button>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {activeDomains.length} domains • {(generateHostsFile(cats).length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
              </div>

              <Term logs={logs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AndroidSecurity;
