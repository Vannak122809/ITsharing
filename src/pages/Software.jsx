import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Apple, DownloadCloud, ChevronRight } from 'lucide-react';

// Using mock data. In the future, this can be fetched from Firebase Firestore.
const softwareData = [
  {
    id: 'postman',
    title: 'Postman IDE',
    desc: 'An API platform for building and using APIs completely for free.',
    os: 'windows',
    size: '150 MB',
    version: 'v10.15'
  },
  {
    id: 'docker-desktop-win',
    title: 'Docker Desktop',
    desc: 'The fastest way to containerize applications on your machine.',
    os: 'windows',
    size: '620 MB',
    version: 'v4.22'
  },
  {
    id: 'vscode-win',
    title: 'Visual Studio Code',
    desc: 'A lightweight but powerful source code editor running on your desktop.',
    os: 'windows',
    size: '88 MB',
    version: 'v1.82'
  },
  {
    id: 'iterm2',
    title: 'iTerm2',
    desc: 'A terminal emulator for macOS that does amazing things.',
    os: 'mac',
    size: '22 MB',
    version: 'v3.4.19'
  },
  {
    id: 'docker-desktop-mac',
    title: 'Docker Desktop (Apple Silicon)',
    desc: 'The fastest way to containerize applications, optimized for M-series chips.',
    os: 'mac',
    size: '590 MB',
    version: 'v4.22'
  },
  {
    id: 'vscode-mac',
    title: 'Visual Studio Code',
    desc: 'A lightweight but powerful source code editor. Universal Binary.',
    os: 'mac',
    size: '115 MB',
    version: 'v1.82'
  }
];

const Software = () => {
  const [activeOS, setActiveOS] = useState('windows');

  const filteredSoftware = softwareData.filter(item => item.os === activeOS);

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-gradient">Developer Software Base</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Discover and download essential toolkits, IDEs, and utilities organized by operating system.
        </p>

        {/* OS Filter Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '30px', display: 'flex', gap: '8px', border: '1px solid var(--surface-border)' }}>
            <button 
              onClick={() => setActiveOS('windows')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '24px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit',
                background: activeOS === 'windows' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                color: activeOS === 'windows' ? '#fff' : 'var(--text-muted)',
                transition: 'var(--transition)'
              }}
            >
              <Monitor size={18} /> Windows
            </button>
            <button 
              onClick={() => setActiveOS('mac')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '24px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit',
                background: activeOS === 'mac' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                color: activeOS === 'mac' ? '#fff' : 'var(--text-muted)',
                transition: 'var(--transition)'
              }}
            >
              <Apple size={18} /> Mac OS
            </button>
          </div>
        </div>
      </header>

      <div className="card-grid">
        {filteredSoftware.map(software => (
          <div key={software.id} className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(69, 243, 255, 0.1)', padding: '16px', borderRadius: '16px', color: 'var(--primary)' }}>
                <DownloadCloud size={32} />
              </div>
              <span style={{ fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-muted)' }}>
                {software.version}
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{software.title}</h3>
            <p style={{ color: 'var(--text-muted)', flexGrow: 1, fontSize: '0.95rem' }}>{software.desc}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Size: {software.size}</span>
              <Link to={`/software/${software.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--primary)' }}>
                View Info <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        ))}

        {filteredSoftware.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <p>No software listed for this operating system yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Software;
