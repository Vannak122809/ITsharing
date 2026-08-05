/**
 * AttackMap.jsx — Live world map showing attacker geolocations
 *
 * - Red pulsing markers  = Brute force (3+ failed logins)
 * - Orange markers       = Single failed login
 * - Purple markers       = Rate limit / other events
 * - Click marker         = popup with full attacker details
 */

import React, { useEffect, useRef } from 'react';

const EVENT_COLORS = {
  brute_force_detected: '#ef4444',   // Red
  failed_login:         '#f59e0b',   // Orange
  rate_limit_hit:       '#8b5cf6',   // Purple
  unauthorized_access:  '#ef4444',   // Red
  blocked_download:     '#3b82f6',   // Blue
  default:              '#64748b',   // Gray
};

function getMarkerColor(eventType) {
  return EVENT_COLORS[eventType] || EVENT_COLORS.default;
}

function timeAgo(isoStr) {
  if (!isoStr) return '—';
  const diff = Date.now() - new Date(isoStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const AttackMap = ({ logs }) => {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);
  const markersRef  = useRef([]);

  // Filter only logs with valid coordinates
  const mappableLogs = logs.filter(
    l => l.lat && l.lon && l.lat !== 0 && l.lon !== 0
  );

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      // Fix default icon paths broken by webpack/vite
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Init map only once
      if (!instanceRef.current && mapRef.current) {
        instanceRef.current = L.map(mapRef.current, {
          center:    [20, 0],
          zoom:      2,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Dark tile layer — CartoDB Dark Matter (free, no key)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        }).addTo(instanceRef.current);
      }

      const map = instanceRef.current;
      if (!map) return;

      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add a marker for each log entry with coords
      mappableLogs.forEach(log => {
        const color     = getMarkerColor(log.eventType);
        const isBrute   = log.eventType === 'brute_force_detected';
        const isHighRisk = (log.threatScore || 0) >= 50;

        // Custom SVG circle marker
        const size = isBrute ? 22 : isHighRisk ? 18 : 14;
        const pulseHtml = isBrute ? `
          <div style="
            width: ${size + 20}px; height: ${size + 20}px;
            border-radius: 50%; background: ${color}30;
            position: absolute; top: ${-(size/2 + 10) + size/2}px; left: ${-(size/2 + 10) + size/2}px;
            animation: pulse-ring 1.5s ease-out infinite;
          "></div>
          <div style="
            width: ${size + 10}px; height: ${size + 10}px;
            border-radius: 50%; background: ${color}50;
            position: absolute; top: ${-(size/2 + 5) + size/2}px; left: ${-(size/2 + 5) + size/2}px;
            animation: pulse-ring 1.5s ease-out infinite 0.4s;
          "></div>
        ` : '';

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative; width:${size}px; height:${size}px;">
              ${pulseHtml}
              <div style="
                width: ${size}px; height: ${size}px; border-radius: 50%;
                background: ${color}; border: 2px solid rgba(255,255,255,0.8);
                box-shadow: 0 0 ${isBrute ? 12 : 6}px ${color}80;
                position: relative; z-index: 10;
              "></div>
            </div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const flagUrl = log.countryCode
          ? `<img src="https://flagcdn.com/16x12/${log.countryCode.toLowerCase()}.png" style="border-radius:2px;vertical-align:middle;margin-right:4px;">`
          : '';

        const popupContent = `
          <div style="font-family:Inter,sans-serif;min-width:240px;padding:4px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <div style="
                background:${color}20;border:1px solid ${color}50;
                color:${color};padding:4px 10px;border-radius:8px;
                font-size:11px;font-weight:800;text-transform:uppercase;
              ">${log.eventType?.replace(/_/g,' ') || 'UNKNOWN'}</div>
              <div style="font-size:11px;color:#94a3b8;">${timeAgo(log.timestamp)}</div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <tr><td style="color:#94a3b8;padding:3px 0;white-space:nowrap;padding-right:12px">IP</td>
                  <td style="font-family:monospace;font-weight:700;color:#f8fafc">${log.ip || '—'}</td></tr>
              <tr><td style="color:#94a3b8;padding:3px 0;padding-right:12px">Location</td>
                  <td style="font-weight:600;color:#f8fafc">${flagUrl}${log.city || ''}${log.city && log.country ? ', ' : ''}${log.country || '—'}</td></tr>
              <tr><td style="color:#94a3b8;padding:3px 0;padding-right:12px">Coords</td>
                  <td style="font-family:monospace;color:#94a3b8;font-size:11px">${log.lat?.toFixed(4)}, ${log.lon?.toFixed(4)}</td></tr>
              <tr><td style="color:#94a3b8;padding:3px 0;padding-right:12px">ISP</td>
                  <td style="color:#f8fafc">${log.isp || '—'}</td></tr>
              ${log.metaEmail ? `
              <tr><td style="color:#94a3b8;padding:3px 0;padding-right:12px">Target</td>
                  <td style="font-family:monospace;color:${log.accountExists ? '#ef4444' : '#f59e0b'};font-weight:700">
                    ${log.metaEmail}${log.accountExists ? ' ⚠' : ''}
                  </td></tr>` : ''}
              <tr><td style="color:#94a3b8;padding:3px 0;padding-right:12px">Threat</td>
                  <td style="color:${color};font-weight:800">${log.threatScore || 0}/100</td></tr>
              ${log.isProxy ? '<tr><td colspan="2" style="color:#ef4444;font-weight:700;padding:3px 0">⚠ VPN / Proxy detected</td></tr>' : ''}
              ${log.isHosting ? '<tr><td colspan="2" style="color:#ef4444;font-weight:700;padding:3px 0">⚠ Datacenter IP — likely bot</td></tr>' : ''}
            </table>
            <a href="https://www.openstreetmap.org/?mlat=${log.lat}&mlon=${log.lon}&zoom=12"
               target="_blank" rel="noopener noreferrer"
               style="display:inline-block;margin-top:8px;background:${color};color:#fff;
                      padding:6px 14px;border-radius:8px;text-decoration:none;
                      font-size:11px;font-weight:700;">
              📍 Open Full Map
            </a>
          </div>`;

        const marker = L.marker([log.lat, log.lon], { icon })
          .addTo(map)
          .bindPopup(popupContent, { maxWidth: 300, className: 'attack-popup' });

        markersRef.current.push(marker);
      });
    });

    return () => {
      // Don't destroy the map instance — just clean markers
    };
  }, [logs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  if (mappableLogs.length === 0) {
    return (
      <div style={{
        height: '500px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface)', borderRadius: '20px',
        border: '1px solid var(--surface-border)',
        color: 'var(--text-muted)', gap: '16px',
      }}>
        <div style={{ fontSize: '3rem' }}>🗺️</div>
        <p style={{ fontWeight: 600 }}>No attack coordinates yet.</p>
        <p style={{ fontSize: '0.85rem' }}>Locations will appear here as attacks are logged.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
      {/* Legend */}
      <div style={{
        position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
        background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)',
        borderRadius: '14px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em', marginBottom: '2px' }}>Legend</div>
        {[
          { color: '#ef4444', label: 'Brute Force (pulse)', pulse: true },
          { color: '#f59e0b', label: 'Failed Login' },
          { color: '#8b5cf6', label: 'Rate Limit' },
          { color: '#3b82f6', label: 'Blocked Download' },
        ].map(({ color, label, pulse }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: color, boxShadow: `0 0 6px ${color}80`,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
          {mappableLogs.length} attack locations
        </div>
      </div>

      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2);   opacity: 0; }
        }
        .attack-popup .leaflet-popup-content-wrapper {
          background: #0f172a !important;
          color: #f8fafc !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 14px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        }
        .attack-popup .leaflet-popup-tip {
          background: #0f172a !important;
        }
        .attack-popup .leaflet-popup-close-button {
          color: #94a3b8 !important;
        }
      `}</style>

      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />

      <div ref={mapRef} style={{ height: '520px', width: '100%' }} />
    </div>
  );
};

export default AttackMap;
