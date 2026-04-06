import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Monitor, Apple, CheckCircle, ShieldAlert, Zap, Box } from 'lucide-react';
import { softwareData } from './Software';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const mockSoftwareDB = {
  // === WINDOWS SOFTWARE ===
  'win11': {
    title: 'Windows 11 ISO (24H2)',
    os: 'windows', version: '24H2', size: '5.2 GB', developer: 'Microsoft',
    downloadUrl: 'https://files.kichhoat24h.com/download/Windows/Win11_24H2_English_x64.iso',
    description: 'Official Windows 11 installation media. Update to the latest 24H2 version for improved UI, gaming features, and security.',
    requirements: ['64-bit Compatible CPU (1 GHz+)', '4GB RAM', 'TPM 2.0 & Secure Boot'],
    features: ['Modern UI', 'DirectX 12 Ultimate', 'Snap Layouts']
  },
  'win10': {
    title: 'Windows 10 ISO',
    os: 'windows', version: '22H2', size: '4.8 GB', developer: 'Microsoft',
    description: 'Official Windows 10 installation media. The most stable and widely used OS.',
    requirements: ['1 GHz Processor', '2GB RAM (64-bit)', '20GB Storage'],
    features: ['Highly Stable', 'Universal App Support', 'Cortana Integration']
  },
  'office-win': {
    title: 'Microsoft Office 2021',
    os: 'windows', version: 'Pro Plus', size: '4.5 GB', developer: 'Microsoft',
    description: 'The industry-standard office suite including Word, Excel, PowerPoint, Access, and Outlook. One-time purchase edition.',
    requirements: ['Windows 10/11', '4GB RAM', '4GB Available Disk Space'],
    features: ['Dark Mode Support', 'XLOOKUP in Excel', 'Dynamic Arrays']
  },
  'libreoffice-win': {
    title: 'LibreOffice',
    os: 'windows', version: 'v7.6', size: '340 MB', developer: 'The Document Foundation',
    description: 'A powerful, free, and open-source office suite that is fully compatible with MS Office files.',
    requirements: ['Windows 7 SP1+', '256MB RAM', '1.5GB Disk Space'],
    features: ['Writer (Word Processing)', 'Calc (Spreadsheets)', 'Impress (Presentations)']
  },
  'vscode-win': {
    title: 'Visual Studio Code',
    os: 'windows', version: 'v1.82', size: '88 MB', developer: 'Microsoft',
    description: 'A lightweight but powerful source code editor which runs on your desktop.',
    requirements: ['Windows 10/11 64-bit', '1.6 GHz Processor', '1 GB RAM'],
    features: ['IntelliSense', 'Built-in Git', 'Vast Extension Ecosystem']
  },
  'docker-desktop-win': {
    title: 'Docker Desktop',
    os: 'windows', version: 'v4.22', size: '620 MB', developer: 'Docker Inc.',
    description: 'The fastest way to containerize applications on your machine.',
    requirements: ['Windows 10 Pro/Ent or WSL2', '4GB RAM', 'Hardware Virtualization enabled'],
    features: ['WSL2 Backend', 'Built-in Kubernetes', 'Extensions Support']
  },
  'postman': {
    title: 'Postman IDE',
    os: 'windows', version: 'v10.15', size: '150 MB', developer: 'Postman, Inc.',
    description: 'An API platform for building and using APIs completely for free.',
    requirements: ['Windows 10/11 64-bit', '4GB RAM', 'Dual Core CPU'],
    features: ['API Mocking', 'Automated Testing', 'Workspace Collaboration']
  },
  'git-win': {
    title: 'Git for Windows',
    os: 'windows', version: 'v2.42', size: '50 MB', developer: 'Git Project',
    description: 'Brings the Git terminal (Git Bash) and GUI to Windows.',
    requirements: ['Windows 7+', '1GB RAM'],
    features: ['Git Bash', 'Git GUI', 'Shell Integration']
  },
  'epson-win': {
    title: 'Epson L3110 Driver',
    os: 'windows', version: 'v2.60', size: '30 MB', developer: 'Epson',
    description: 'Official printer and scanner drivers for the Epson EcoTank L3110 series.',
    requirements: ['Windows 7+', 'USB Connection'],
    features: ['Print Management', 'High Quality Scanning Utility']
  },
  'hp-universal-win': {
    title: 'HP Universal Print Driver',
    os: 'windows', version: 'v7.1', size: '20 MB', developer: 'HP',
    description: 'A single, intelligent driver that gives users access to a range of HP print devices without downloading separate drivers.',
    requirements: ['Windows 10/11'],
    features: ['Network Auto-Discovery', 'Dynamic Print Settings']
  },
  'rufus': {
    title: 'Rufus',
    os: 'windows', version: 'v4.2', size: '1.4 MB', developer: 'Pete Batard',
    description: 'A utility that helps format and create bootable USB flash drives, such as USB keys/pendrives, memory sticks, etc.',
    requirements: ['Windows 8+ (32 or 64 bit)'],
    features: ['Bypass Windows 11 TPM checks', 'Extremely Fast', 'Open Source']
  },
  '7zip': {
    title: '7-Zip',
    os: 'windows', version: 'v23.01', size: '1.5 MB', developer: 'Igor Pavlov',
    description: 'A file archiver with a high compression ratio. Supports .7z, .zip, .rar, .tar, and more.',
    requirements: ['Windows NT/2000/XP to Windows 11'],
    features: ['AES-256 Encryption', 'High Compression Ratio', 'Context Menu Integration']
  },

  // === MAC SOFTWARE ===
  'macos-sonoma': {
    title: 'macOS Sonoma',
    os: 'mac', version: '14.0', size: '12 GB', developer: 'Apple',
    description: 'The latest major release of macOS featuring desktop widgets, new screensavers, and huge Safari updates.',
    requirements: ['Mac 2018 or later', '20GB Free Space'],
    features: ['Interactive Widgets', 'Game Mode', 'Presenter Overlay']
  },
  'macos-ventura': {
    title: 'macOS Ventura',
    os: 'mac', version: '13.5', size: '12 GB', developer: 'Apple',
    description: 'A stable macOS release bringing Stage Manager and Continuity Camera.',
    requirements: ['Mac 2017 or later', '15GB Free Space'],
    features: ['Stage Manager', 'Continuity Camera', 'Passkeys']
  },
  'office-mac': {
    title: 'Microsoft Office 2021',
    os: 'mac', version: 'Home & Business', size: '2.8 GB', developer: 'Microsoft',
    description: 'Word, Excel, PowerPoint, and Outlook optimized for Apple Silicon and Intel Macs.',
    requirements: ['macOS Monterey (12.0)+', '4GB RAM'],
    features: ['Apple Silicon Native', 'Real-time Co-authoring']
  },
  'libreoffice-mac': {
    title: 'LibreOffice',
    os: 'mac', version: 'v7.6', size: '310 MB', developer: 'The Document Foundation',
    description: 'Powerful open-source office suite for macOS.',
    requirements: ['macOS 10.14+'],
    features: ['Native ARM64 Support', 'Free to use']
  },
  'vscode-mac': {
    title: 'Visual Studio Code',
    os: 'mac', version: 'v1.82', size: '115 MB', developer: 'Microsoft',
    description: 'A lightweight but powerful source code editor. Universal Binary.',
    requirements: ['macOS 10.11+', '1.6 GHz Processor', '1 GB RAM'],
    features: ['IntelliSense', 'Built-in Git', 'Vast Extension Ecosystem']
  },
  'iterm2': {
    title: 'iTerm2',
    os: 'mac', version: 'v3.4.19', size: '22 MB', developer: 'George Nachman',
    description: 'A terminal emulator for macOS that replaces Terminal and does amazing things.',
    requirements: ['macOS 10.14+', 'Intel or Apple Silicon'],
    features: ['Split Panes', 'Hotkey Window', 'Autocomplete Feature']
  },
  'docker-desktop-mac': {
    title: 'Docker Desktop (Apple Silicon)',
    os: 'mac', version: 'v4.22', size: '590 MB', developer: 'Docker Inc.',
    description: 'The fastest way to containerize applications on your machine, optimized specifically for M-series (Apple Silicon) chips.',
    requirements: ['macOS Big Sur 11+', 'Apple Silicon (M1/M2/M3)'],
    features: ['Rosetta 2 Emulation', 'Built-in Kubernetes', 'Extensions Support']
  },
  'homebrew': {
    title: 'Homebrew',
    os: 'mac', version: 'Latest', size: '10 KB', developer: 'Homebrew Community',
    description: 'The Missing Package Manager for macOS. Install packages directly from your terminal.',
    requirements: ['macOS Catalina+', 'Command Line Tools for Xcode'],
    features: ['Terminal Based', 'Huge Package Repo', 'Easy Upgrades']
  },
  'canon-mac': {
    title: 'Canon PIXMA G3010 Driver',
    os: 'mac', version: 'v1.3.0', size: '45 MB', developer: 'Canon',
    description: 'Official driver suite for Mac users. Enables printing and wireless scanning.',
    requirements: ['macOS 10.13+'],
    features: ['AirPrint Support', 'Wireless Setup Assistant']
  },
  'unarchiver': {
    title: 'The Unarchiver',
    os: 'mac', version: 'v4.3.6', size: '15 MB', developer: 'MacPaw',
    description: 'A small and easy to use program that can unarchive many different kinds of archive files, replacing the native Archive Utility.',
    requirements: ['macOS 10.7+'],
    features: ['Extracts RAR/7z/ZIP', 'Extracts ISOs', 'Free']
  },
  'vlc-mac': {
    title: 'VLC Media Player',
    os: 'mac', version: 'v3.0.18', size: '55 MB', developer: 'VideoLAN',
    description: 'Free and open source cross-platform multimedia player that plays most multimedia files as well as DVDs, Audio CDs, VCDs, and various streaming protocols.',
    requirements: ['macOS 10.7+'],
    features: ['Plays Everything', 'Hardware Decoding', 'No Spyware']
  }
};

const SoftwareViewer = () => {
  const { id } = useParams();
  const [software, setSoftware] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const isGuest = !user || user.isAnonymous;

  useEffect(() => {
    // In reality, this would fetch from Firebase or R2 mapping
    if (mockSoftwareDB[id]) {
      setSoftware(mockSoftwareDB[id]);
    } else {
      // Dynamic fallback for newly added items
      const fallback = softwareData.find(s => s.id === id);
      if (fallback) {
        setSoftware({
          title: fallback.title,
          os: fallback.os,
          version: fallback.version || 'Latest',
          size: fallback.size || 'Unknown',
          developer: fallback.folder === 'Mac OS' ? 'Apple' : (['Windows', 'Office', 'Windows Server'].includes(fallback.folder) ? 'Microsoft' : 'Unknown Developer'),
          downloadUrl: fallback.url || `https://files.kichhoat24h.com/download/${encodeURIComponent(fallback.folder)}/${encodeURIComponent(fallback.title)}`,
          description: fallback.desc || `Official download for ${fallback.title}. This package is available securely from the IT Sharing repository.`,
          requirements: ['Standard Specifications', 'Compatible Operating System', `${fallback.size ? fallback.size + ' Free Disk Space' : 'Sufficient Disk Space'}`],
          features: ['Direct Download', 'Verified Integrity', 'Easy Installation']
        });
      }
    }
  }, [id]);

  if (!software) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center', minHeight: '80vh' }}>
        <h2 className="text-gradient">Software Not Found</h2>
        <Link to="/software" className="btn btn-outline" style={{ marginTop: '24px' }}><ArrowLeft size={16} /> Back to Software Base</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <Link to="/software" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '32px' }}>
        <ArrowLeft size={16} /> Back to Software
      </Link>

      <div className="glass-panel viewer-info-box" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>

        {/* Header Section */}
        <div className="viewer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--surface-badge)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
              {software.os === 'windows' ? <Monitor size={14} color="#00fa9a" /> : <Apple size={14} color="#ff2a7a" />}
              {software.os === 'windows' ? 'Windows OS' : 'macOS Application'} • {software.version}
            </div>

            <h1 style={{ fontSize: '3rem', marginBottom: '8px' }} className="text-gradient">{software.title}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>By: {software.developer}</p>
          </div>

          <div className="viewer-cta-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
            <a href={software.downloadUrl || "https://files.kichhoat24h.com/download"} target="_blank" rel="noreferrer" onClick={(e) => { if (isGuest) { e.preventDefault(); navigate('/login'); } }} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', boxShadow: '0 8px 30px rgba(69, 243, 255, 0.4)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Download size={20} /> Download Now
            </a>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              File Size: <strong>{software.size}</strong>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="viewer-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '16px' }}>

          {/* Overview */}
          <div style={{ background: 'var(--card-dark)', padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>
              <Box size={24} /> Overview
            </h3>
            <p style={{ lineHeight: '1.8', color: 'var(--text-main)', fontSize: '1.05rem' }}>
              {software.description}
            </p>
          </div>

          {/* Key Features */}
          <div style={{ background: 'var(--card-dark)', padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '16px', color: '#00fa9a' }}>
              <Zap size={24} /> Key Features
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {software.features.map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                  <CheckCircle size={18} color="#00fa9a" /> {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* System Requirements */}
          <div style={{ background: 'var(--card-dark)', padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '16px', color: '#ff2a7a' }}>
              <ShieldAlert size={24} /> Requirements
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {software.requirements.map((req, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                  <div style={{ width: '6px', height: '6px', background: '#ff2a7a', borderRadius: '50%' }} />
                  {req}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Ratings & Reviews System */}
        <div className="card-dark" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)', marginTop: '24px' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--primary)' }}>Community Feedback</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white' }}>4.8</div>
            <div>
              <div style={{ color: '#ff9900', fontSize: '1.2rem', marginBottom: '4px' }}>★★★★★</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Based on 124 user ratings</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-main)' }}>TechStudent99</strong>
                <span style={{ color: '#ff9900' }}>★★★★★</span>
              </div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Works perfectly. Installed without any issues.</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--surface)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--text-main)' }}>Alex Devel</strong>
                <span style={{ color: '#ff9900' }}>★★★★☆</span>
              </div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Great software, but the download speed was slightly slow today.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SoftwareViewer;
