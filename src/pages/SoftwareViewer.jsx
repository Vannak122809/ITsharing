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
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Navigation Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', fontSize: '0.95rem' }}>
          <Link to="/software" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Software Base
          </Link>
          <span style={{ color: 'var(--surface-border)' }}>/</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 800 }}>{software.title}</span>
        </nav>

        <div className="glass-panel" style={{ padding: '60px', borderRadius: '40px', border: '1px solid var(--surface-border)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Header Content */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '40px', marginBottom: '60px' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '14px', background: 'var(--surface-badge)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
                  {software.os === 'windows' ? <Monitor size={16} /> : <Apple size={16} />}
                  {software.os === 'windows' ? 'Windows Optimized' : 'macOS Application'} • {software.version}
                </div>
                <h1 className="text-gradient" style={{ fontSize: '4rem', lineHeight: 1.1, marginBottom: '16px' }}>{software.title}</h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 500 }}>Published by {software.developer}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '240px' }}>
                <a href={software.downloadUrl} target="_blank" rel="noreferrer" onClick={(e) => { if (isGuest) { e.preventDefault(); navigate('/login'); } }} className="btn btn-primary" style={{ padding: '20px 40px', fontSize: '1.2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 15px 40px rgba(37, 99, 235, 0.3)' }}>
                  <Download size={22} /> Download Now
                </a>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Box size={14} /> {software.size}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert size={14} /> Verified</span>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '60px' }}>
              
              {/* Requirements */}
              <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', marginBottom: '24px', fontSize: '1.4rem' }}>
                  <Zap size={22} /> {t('requirements') || 'Requirements'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {software.requirements.map((req, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <CheckCircle size={16} color="var(--primary)" /> {req}
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#00fa9a', marginBottom: '24px', fontSize: '1.4rem' }}>
                  <Rocket size={22} /> {t('features') || 'Key Features'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {software.features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: 'var(--text-muted)' }}>
                      <CheckCircle size={16} color="#00fa9a" /> {feature}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Content Area */}
            <div style={{ marginBottom: '60px' }}>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>General Information</h2>
              <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                {software.description}
              </p>
            </div>

            {/* Feedback Sidebar Concept */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '60px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.8rem' }}>Community Insight</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>4.8</span>
                  <div style={{ display: 'flex', color: '#fbbf24' }}>
                    <Star size={20} fill="#fbbf24" />
                    <Star size={20} fill="#fbbf24" />
                    <Star size={20} fill="#fbbf24" />
                    <Star size={20} fill="#fbbf24" />
                    <Star size={20} fill="none" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700 }}>TechStudent99</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>2 days ago</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Installs perfectly on Win 11 24H2. The speed is amazing!</p>
                </div>
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700 }}>Alex Devel</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>1 week ago</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Clean file, no issues with Defender. High reliability repository.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SoftwareViewer;
