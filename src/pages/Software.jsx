import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Apple, DownloadCloud, ChevronRight, Filter, Terminal, FileSpreadsheet, Printer, Disc, Wrench, Code } from 'lucide-react';

const softwareData = [
  // === WINDOWS SOFTWARE ===
  {
    id: 'win11', title: 'Windows 11 ISO', desc: 'Official Windows 11 installation media (23H2).',
    os: 'windows', category: 'OS', size: '5.2 GB', version: '23H2'
  },
  {
    id: 'win10', title: 'Windows 10 ISO', desc: 'Official Windows 10 installation media.',
    os: 'windows', category: 'OS', size: '4.8 GB', version: '22H2'
  },
  {
    id: 'office-win', title: 'Microsoft Office 2021', desc: 'Word, Excel, PowerPoint, and more for Windows.',
    os: 'windows', category: 'Office', size: '4.5 GB', version: 'Pro Plus'
  },
  {
    id: 'libreoffice-win', title: 'LibreOffice', desc: 'Powerful and free open-source office suite.',
    os: 'windows', category: 'Office', size: '340 MB', version: 'v7.6'
  },
  {
    id: 'vscode-win', title: 'Visual Studio Code', desc: 'A lightweight but powerful source code editor.',
    os: 'windows', category: 'Development', size: '88 MB', version: 'v1.82'
  },
  {
    id: 'docker-desktop-win', title: 'Docker Desktop', desc: 'The fastest way to containerize applications on Windows.',
    os: 'windows', category: 'Development', size: '620 MB', version: 'v4.22'
  },
  {
    id: 'postman', title: 'Postman IDE', desc: 'An API platform for building and using APIs.',
    os: 'windows', category: 'Development', size: '150 MB', version: 'v10.15'
  },
  {
    id: 'git-win', title: 'Git for Windows', desc: 'Brings the Git terminal and GUI to Windows.',
    os: 'windows', category: 'Development', size: '50 MB', version: 'v2.42'
  },
  {
    id: 'epson-win', title: 'Epson L3110 Driver', desc: 'Printer and scanner drivers for Epson L3110.',
    os: 'windows', category: 'Printer Scanner', size: '30 MB', version: 'v2.60'
  },
  {
    id: 'hp-universal-win', title: 'HP Universal Print Driver', desc: 'A single driver that gives users access to a range of HP print devices.',
    os: 'windows', category: 'Printer Scanner', size: '20 MB', version: 'v7.1'
  },
  {
    id: 'rufus', title: 'Rufus', desc: 'Create bootable USB drives the easy way.',
    os: 'windows', category: 'Utility', size: '1.4 MB', version: 'v4.2'
  },
  {
    id: '7zip', title: '7-Zip', desc: 'A file archiver with a high compression ratio.',
    os: 'windows', category: 'Utility', size: '1.5 MB', version: 'v23.01'
  },

  // === MAC SOFTWARE ===
  {
    id: 'macos-sonoma', title: 'macOS Sonoma', desc: 'The latest major release of macOS.',
    os: 'mac', category: 'OS', size: '12 GB', version: '14.0'
  },
  {
    id: 'macos-ventura', title: 'macOS Ventura', desc: 'The previous major release of macOS.',
    os: 'mac', category: 'OS', size: '12 GB', version: '13.5'
  },
  {
    id: 'office-mac', title: 'Microsoft Office 2021', desc: 'Word, Excel, PowerPoint, and more for Mac.',
    os: 'mac', category: 'Office', size: '2.8 GB', version: 'Home & Business'
  },
  {
    id: 'libreoffice-mac', title: 'LibreOffice', desc: 'Powerful open-source office suite for macOS.',
    os: 'mac', category: 'Office', size: '310 MB', version: 'v7.6'
  },
  {
    id: 'vscode-mac', title: 'Visual Studio Code', desc: 'A lightweight but powerful source code editor. Universal Binary.',
    os: 'mac', category: 'Development', size: '115 MB', version: 'v1.82'
  },
  {
    id: 'iterm2', title: 'iTerm2', desc: 'A terminal emulator for macOS that does amazing things.',
    os: 'mac', category: 'Development', size: '22 MB', version: 'v3.4.19'
  },
  {
    id: 'docker-desktop-mac', title: 'Docker Desktop (Silicon)', desc: 'The fastest way to containerize applications, optimized for M-series chips.',
    os: 'mac', category: 'Development', size: '590 MB', version: 'v4.22'
  },
  {
    id: 'homebrew', title: 'Homebrew', desc: 'The Missing Package Manager for macOS (Install Script).',
    os: 'mac', category: 'Development', size: '10 KB', version: 'Latest'
  },
  {
    id: 'canon-mac', title: 'Canon PIXMA G3010 Driver', desc: 'Official driver suite for Mac users.',
    os: 'mac', category: 'Printer Scanner', size: '45 MB', version: 'v1.3.0'
  },
  {
    id: 'unarchiver', title: 'The Unarchiver', desc: 'A small and easy to use program that can unarchive many different kinds of archive files.',
    os: 'mac', category: 'Utility', size: '15 MB', version: 'v4.3.6'
  },
  {
    id: 'vlc-mac', title: 'VLC Media Player', desc: 'Free and open source cross-platform multimedia player.',
    os: 'mac', category: 'Utility', size: '55 MB', version: 'v3.0.18'
  }
];

const getCategoryIcon = (category) => {
  switch(category) {
    case 'OS': return <Disc size={32} />;
    case 'Office': return <FileSpreadsheet size={32} />;
    case 'Printer Scanner': return <Printer size={32} />;
    case 'Development': return <Code size={32} />;
    case 'Utility': return <Wrench size={32} />;
    default: return <DownloadCloud size={32} />;
  }
};

const Software = () => {
  const [activeOS, setActiveOS] = useState('windows');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'OS', 'Office', 'Development', 'Printer Scanner', 'Utility'];

  const filteredSoftware = softwareData.filter(item => 
    item.os === activeOS && 
    (activeCategory === 'All' || item.category === activeCategory)
  );

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-gradient">Developer Software Base</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Discover and download essential toolkits, IDEs, OS ISOs, and drivers organized by operating system.
        </p>

        {/* OS Filter Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <div style={{ background: 'var(--card-dark)', padding: '6px', borderRadius: '30px', display: 'flex', gap: '8px', border: '1px solid var(--surface-border)' }}>
            <button 
              onClick={() => { setActiveOS('windows'); setActiveCategory('All'); }}
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
              onClick={() => { setActiveOS('mac'); setActiveCategory('All'); }}
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

        {/* Category Filters */}
        <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`btn ${activeCategory === category ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              {category === 'All' ? 'All Software' : category}
            </button>
          ))}
        </div>
      </header>

      <div className="card-grid">
        {filteredSoftware.map(software => (
          <div key={software.id} className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(69, 243, 255, 0.1)', padding: '16px', borderRadius: '16px', color: 'var(--primary)' }}>
                {getCategoryIcon(software.category)}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  {software.version}
                </span>
                <span style={{ fontSize: '0.75rem', border: '1px solid #ff2a7a', padding: '2px 10px', borderRadius: '12px', color: '#ff2a7a' }}>
                  {software.category}
                </span>
              </div>
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
            <Filter size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
            <p>No software found in the "{activeCategory}" category for {activeOS === 'windows' ? 'Windows' : 'Mac OS'}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Software;
