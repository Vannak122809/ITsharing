import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download as DownloadIcon, Eye, Folder, ChevronRight, ArrowLeft, Cloud,
  Terminal, Database, ShieldCheck, ArrowUpDown, LayoutGrid, 
  List, Search, File, Loader2, Monitor, Apple, Cpu, Settings, Briefcase, Globe, Code, PlayCircle, Printer, Ghost, Sparkles, Layers
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { checkDownloadLimit, formatRetryTime } from '../utils/rateLimiter';
import { logRateLimit } from '../utils/securityLogger';

// Custom Animated Folder Icon matching Document style
const ModernFolderIcon = ({ size = 64, color = "#3b82f6" }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <div style={{ 
      width: size * 0.8, height: size * 0.6, background: `linear-gradient(135deg, ${color}, ${color}dd)`, 
      borderRadius: '12px', position: 'relative', boxShadow: `0 10px 25px ${color}40`,
      border: `1px solid ${color}80`
    }}>
      <div style={{ 
        position: 'absolute', top: '-10px', left: '0', width: '45%', height: '12px', 
        background: `linear-gradient(135deg, ${color}, ${color}cc)`, 
        borderTopLeftRadius: '10px', borderTopRightRadius: '14px',
        boxShadow: `inset 0 2px 5px rgba(255,255,255,0.2)`
      }} />
      <div style={{ 
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', 
        background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)', 
        borderRadius: '12px', backdropFilter: 'blur(4px)' 
      }} />
    </div>
  </motion.div>
);

export const ModernIsoIcon = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8C8 5.79086 9.79086 4 12 4H28L40 16V40C40 42.2091 38.2091 44 36 44H12C9.79086 44 8 42.2091 8 40V8Z" fill="#1E293B" stroke="#334155" strokeWidth="2"/>
    <path d="M28 4V16H40" fill="#334155" stroke="#334155" strokeWidth="2" strokeLinejoin="round"/>
    <circle cx="24" cy="24" r="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="2"/>
    <circle cx="24" cy="24" r="2.5" fill="#38BDF8"/>
    <path d="M24 16C28.4183 16 32 19.5817 32 24" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <text x="24" y="39" fill="#E2E8F0" fontSize="9" fontWeight="800" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="0.5">ISO</text>
  </svg>
);

export const ModernScriptIcon = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4C6.89543 4 6 4.89543 6 6V36C6 37.1046 6.89543 38 8 38H34C35.1046 38 36 37.1046 36 36V14L26 4H8Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5"/>
    <path d="M26 4V12C26 13.1046 26.8954 14 28 14H36" fill="#334155" stroke="#475569" strokeWidth="1.5"/>
    <path d="M14 20L18 24L14 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 28H28" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SoftwareIcon = ({ id, os, size = 32, iconUrl = null }) => {
  if (iconUrl) {
    return <img src={iconUrl} className="software-real-icon" alt={id} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  const iconMap = {
    'chrome-win': 'google.com',
    'chrome-mac': 'google.com',
    'vscode-win': 'visualstudio.com',
    'vscode-mac': 'visualstudio.com',
    'git-win': 'git-scm.com',
    'docker-desktop-win': 'docker.com',
    'docker-desktop-mac': 'docker.com',
    'firefox-win': 'mozilla.org',
    'firefox-mac': 'mozilla.org',
    'zoom-win': 'zoom.us',
    'zoom-mac': 'zoom.us',
    'slack-win': 'slack.com',
    'slack-mac': 'slack.com',
    'discord-win': 'discord.com',
    'discord-mac': 'discord.com',
    'teams-win': 'microsoft.com',
    'teams-mac': 'microsoft.com',
    'postman': 'postman.com',
    'nodejs-win': 'nodejs.org',
    'nodejs-mac': 'nodejs.org',
    'python-win': 'python.org',
    'python-mac': 'python.org',
    'anydesk-win': 'anydesk.com',
    'anydesk-mac': 'anydesk.com',
    'teamviewer-win': 'teamviewer.com',
    'teamviewer-mac': 'teamviewer.com',
    'winrar': 'win-rar.com',
    '7zip': '7-zip.org',
    'rufus': 'rufus.ie',
    'filezilla-win': 'filezilla-project.org',
    'filezilla-mac': 'filezilla-project.org',
    'office-win': 'microsoft.com',
    'office-mac': 'microsoft.com',
    'idm': 'internetdownloadmanager.com',
  };

  const domain = iconMap[id];
  if (domain) {
    return (
      <img 
        src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
        className="software-real-icon"
        alt={id} 
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  return os === 'windows' ? <Monitor size={size} /> : <Apple size={size} />;
};

export const softwareData = [
  // === WINDOWS ===
  { id: 'win11', title: 'Windows 11 ISO', desc: 'Official Windows 11 installation media (24H2).', os: 'windows', folder: 'Windows', size: '5.2 GB', version: '24H2', url: 'https://files.kichhoat24h.com/download/Windows/Win11_24H2_English_x64.iso' },
  { id: 'win10', title: 'Windows 10 ISO', desc: 'Official Windows 10 installation media.', os: 'windows', folder: 'Windows', size: '4.8 GB', version: '22H2', url: 'https://software.download.prss.microsoft.com/dbazure/Win10_22H2_English_x64.iso' },
  
  // === WINDOWS SERVER ===
  { id: 'ws1', title: 'Windows Server 2022 EVAL ISO', timestamp: '10:24:51 24/02/2025', os: 'windows', folder: 'Windows Server', size: '5.5 GB', version: '2022' },
  { id: 'ws2', title: 'Windows Server 2025 Evaluation ISO', timestamp: '23:04:02 24/11/2024', os: 'windows', folder: 'Windows Server', size: '5.8 GB', version: '2025' },
  { id: 'ws3', title: 'Windows Server 2019 x64 DVD ISO', timestamp: '10:19:55 06/01/2025', os: 'windows', folder: 'Windows Server', size: '5.4 GB', version: '2019' },

  // === OFFICE ===
  { id: 'off2024-rt-pro', title: 'Microsoft Office ProPlus 2024', os: 'windows', folder: 'Office', subfolder: '2024', version: '2024', size: '4.5 GB', url: 'https://files.kichhoat24h.com/download/Office/2024/Retail/ProPlus2024Retail.img' },
  { id: 'off2021-rt', title: 'Microsoft Office ProPlus 2021', os: 'windows', folder: 'Office', subfolder: '2021', version: '2021', size: '4.2 GB', url: 'https://files.kichhoat24h.com/download/Office/2021/Retail/ProPlus2021Retail.img' },
  { id: 'off2019-rt-pro', title: 'Microsoft Office Professional Plus 2019', os: 'windows', folder: 'Office', subfolder: '2019', version: '2019', size: '3.8 GB', url: 'https://files.kichhoat24h.com/download/Office/2019/Retail/en_office_professional_plus_2019_x86_x64_dvd_7ea28c99.iso' },
  { id: 'off2016-rt-pro', title: 'Microsoft Office Professional Plus 2016', os: 'windows', folder: 'Office', subfolder: '2016', version: '2016', size: '3.2 GB', url: 'https://files.kichhoat24h.com/download/Office/2016/Retail/en_office_professional_plus_2016_x86_x64_dvd_6962141.iso' },
  { id: 'off365', title: 'Microsoft 365 Enterprise ProPlus', os: 'windows', folder: 'Office', subfolder: '365', version: '365', size: '4.1 GB', url: 'https://files.kichhoat24h.com/download/Office/365/O365ProPlusRetail.img' },

  // === VISUAL STUDIO ===
  { id: 'vscode-win', title: 'Visual Studio Code (Windows)', desc: 'Lightweight code editor for web & cloud.', os: 'windows', folder: 'Visual Studio', subfolder: 'VS Code', size: '88 MB', version: 'v1.82' },
  { id: 'vscode-mac', title: 'Visual Studio Code (macOS)', desc: 'Lightweight code editor for Mac.', os: 'mac', folder: 'Visual Studio', subfolder: 'VS Code', size: '115 MB', version: 'v1.82' },
  { id: 'vs-community', title: 'Visual Studio Community 2022', desc: 'Comprehensive IDE for .NET and C++ developers.', os: 'windows', folder: 'Visual Studio', subfolder: 'VS Community', size: '1.2 GB', version: '2022' },

  // === SOFTWARE (General) ===
  { id: 'macos-sonoma', title: 'macOS Sonoma Installation Media', desc: 'Major release of macOS with desktop widgets.', os: 'mac', folder: 'Software', size: '12 GB', version: '14.0' },
  { id: 'docker-desktop-win', title: 'Docker Desktop for Windows', desc: 'Container development environment.', os: 'windows', folder: 'Software', size: '620 MB', version: 'v4.22', url: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' },
  { id: 'zktime-5', title: 'ZKTime 5.0 Attendance Manager', desc: 'Attendance management software for ZKteco devices.', os: 'windows', folder: 'Software', subfolder: 'Attendance', size: '55 MB', version: 'v5.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/ZKTime5.0.zip' },
  { id: 'postman', title: 'Postman API Platform', desc: 'API testing & workflow platform.', os: 'windows', folder: 'Software', size: '150 MB', version: 'v10.15', url: 'https://dl.pstmn.io/download/latest/win64' },
  { id: 'chrome-win', title: 'Google Chrome Browser', desc: 'Fast, secure web browser by Google.', os: 'windows', folder: 'Software', size: '90 MB', version: 'Latest', url: 'https://dl.google.com/chrome/install/standalone/win64/ChromeSetup.exe' },

  // === TOOLS ===
  { id: 'git-win', title: 'Git for Windows x64', desc: 'Brings Git command line and GUI to Windows.', os: 'windows', folder: 'Tools', size: '50 MB', version: 'v2.53.0', url: 'https://github.com/git-for-windows/git/releases/download/v2.53.0.windows.2/Git-2.53.0.2-64-bit.exe' },
  { id: 'rufus', title: 'Rufus Bootable USB Creator', desc: 'Create bootable USB drives formatted easily.', os: 'windows', folder: 'Tools', size: '1.4 MB', version: 'v4.13', url: 'https://github.com/pbatard/rufus/releases/download/v4.13/rufus-4.13.exe' },
  { id: 'winrar', title: 'WinRAR Archiver x64', desc: 'Powerful RAR & ZIP compression manager.', os: 'windows', folder: 'Tools', size: '3 MB', version: 'v6.21', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/WinRAR.6.21.rar' },
  { id: 'notepadpp', title: 'Notepad++ Source Editor', desc: 'Free source code editor for Windows.', os: 'windows', folder: 'Tools', size: '4 MB', version: 'v8.9.3', url: 'https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.9.3/npp.8.9.3.Installer.x64.exe' },

  // === DRIVERS ===
  { id: 'epson-l3110-win', title: 'Epson L3110 Printer Driver', desc: 'Official print & scan drivers for Epson L3110.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', size: '30 MB', version: 'v2.60' },
  { id: 'nvidia-win', title: 'NVIDIA GeForce Game Ready Driver', desc: 'Official graphic card driver for NVIDIA GPUs.', os: 'windows', folder: 'Driver', subfolder: 'Graphic Card', size: '600 MB', version: 'v537.13' },
  { id: 'realtek-win', title: 'Realtek High Definition Audio Driver', desc: 'High-definition audio codecs for Windows sound cards.', os: 'windows', folder: 'Driver', subfolder: 'Audio', size: '250 MB', version: 'v2.82' },

  // === DOWNLOAD & MEDIA ===
  { id: 'idm', title: 'Internet Download Manager (IDM)', desc: 'High-speed download accelerator for Windows.', os: 'windows', folder: 'Download', size: '12 MB', version: 'v6.42', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/Internet.Download.Manager.6.42.63.0.zip' },
  { id: 'vlc-win', title: 'VLC Media Player', desc: 'Multi-format video & audio player.', os: 'windows', folder: 'Media', subfolder: 'Video Player', size: '42 MB', version: 'v3.0.23', url: 'https://get.videolan.org/vlc/3.0.23/win64/vlc-3.0.23-win64.exe' },
  { id: 'obs-win', title: 'OBS Studio Live Streamer', desc: 'Free open source screen recording & live streaming.', os: 'windows', folder: 'Media', subfolder: 'Video Editor', size: '120 MB', version: 'v32.1', url: 'https://cdn-fastly.obsproject.com/downloads/OBS-Studio-32.1.0-Windows-x64-Installer.exe' },
];

const softwareStructure = {
  Windows: {
    icon: <Monitor size={20} />,
    color: '#2563eb',
    subfolders: ['Windows 11', 'Windows 10', 'Windows 8.1', 'Windows 7']
  },
  'Windows Server': {
    icon: <Cpu size={20} />,
    color: '#06b6d4',
    subfolders: ['Server 2025', 'Server 2022', 'Server 2019', 'Server 2016']
  },
  Office: {
    icon: <Briefcase size={20} />,
    color: '#f59e0b',
    subfolders: ['2024', '2021', '2019', '2016', '2013', '2010', '2007', '365']
  },
  'Visual Studio': {
    icon: <Code size={20} />,
    color: '#a855f7',
    subfolders: ['VS Code', 'VS Community', 'VS Professional']
  },
  Software: {
    icon: <Layers size={20} />,
    color: '#10b981',
    subfolders: ['Attendance', 'Browser', 'Database', 'Communication', 'Graphics']
  },
  Tools: {
    icon: <Settings size={20} />,
    color: '#ec4899',
    subfolders: ['Activation', 'Compressor', 'Remote', 'Development']
  },
  Download: {
    icon: <DownloadIcon size={20} />,
    color: '#6366f1',
    subfolders: ['Accelerator', 'Torrent', 'Video Downloader']
  },
  Media: {
    icon: <PlayCircle size={20} />,
    color: '#8b5cf6',
    subfolders: ['Video Player', 'Audio Player', 'Screen Recorder', 'Video Editor']
  },
  Driver: {
    icon: <Printer size={20} />,
    color: '#14b8a6',
    subfolders: ['Printer Driver', 'Graphic Card', 'Audio', 'Network', 'Scanner Driver']
  }
};

const Software = () => {
  const { t } = useLanguage();
  const [activeOS, setActiveOS] = useState('windows');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({ Windows: true, Office: true });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [downloadingId, setDownloadingId] = useState(null);
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dbSoftware, setDbSoftware] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'software'), orderBy('createdAt', 'desc'));
    const unsubSoftware = onSnapshot(q, (snapshot) => {
      setDbSoftware(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});
    return () => unsubSoftware();
  }, []);

  const combinedSoftware = useMemo(() => [...dbSoftware, ...softwareData], [dbSoftware]);
  const isGuest = !authLoading && (!user || user.isAnonymous);

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0;
    const value = parseFloat(sizeStr.split(' ')[0]) || 0;
    if (sizeStr.includes('MB')) return value * 1024;
    if (sizeStr.includes('GB')) return value * 1024 * 1024;
    return value;
  };

  const processedData = useMemo(() => {
    let result = combinedSoftware.filter(item => item.os === activeOS);

    if (!searchQuery) {
      if (currentFolder) result = result.filter(doc => doc.folder === currentFolder);
      if (currentSubfolder) result = result.filter(doc => doc.subfolder === currentSubfolder);
    } else {
      const queryStr = searchQuery.toLowerCase();
      result = result.filter(doc => 
        (doc.title && doc.title.toLowerCase().includes(queryStr)) ||
        (doc.desc && doc.desc.toLowerCase().includes(queryStr)) ||
        (doc.description && doc.description.toLowerCase().includes(queryStr)) ||
        (doc.folder && doc.folder.toLowerCase().includes(queryStr)) ||
        (doc.subfolder && doc.subfolder.toLowerCase().includes(queryStr))
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'size') return parseSize(b.size) - parseSize(a.size);
      return 0;
    });

    return result;
  }, [combinedSoftware, activeOS, currentFolder, currentSubfolder, searchQuery, sortBy]);

  const handleDownloadFile = async (e, url, title, id) => {
    e.preventDefault();
    if (authLoading) return;
    if (isGuest) { setAuthModalOpen(true); return; }
    if (!url) return;

    const uid = user?.uid || 'anon';
    const { allowed, retryAfterMs } = checkDownloadLimit(uid);
    if (!allowed) {
      const { toast } = await import('react-hot-toast');
      toast.error(`Slow down! Try again in ${formatRetryTime(retryAfterMs)}`);
      logRateLimit('/software');
      return;
    }

    setDownloadingId(id);
    try {
      const response = await fetch(url + '?t=' + Date.now());
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const cleanTitle = (title || 'software').replace(/[^a-zA-Z0-9 ]/g, '');
      const ext = url.endsWith('.iso') ? '.iso' : url.endsWith('.img') ? '.img' : url.endsWith('.zip') ? '.zip' : '.exe';
      link.download = `${cleanTitle}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: '90px', paddingBottom: '60px' }}>
      <style>{`
        .glass-panel-new {
          background: var(--surface);
          backdrop-filter: var(--blur);
          -webkit-backdrop-filter: var(--blur);
          border: 1px solid var(--surface-border);
          box-shadow: var(--shadow-glass);
        }
        .file-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .file-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(135deg, var(--surface-border), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .file-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          background: var(--surface-badge);
        }
        .file-card:hover::before {
          background: linear-gradient(135deg, var(--primary, #3b82f6), rgba(255,255,255,0));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        .search-input:focus {
          border-color: var(--primary, #3b82f6) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2) !important;
        }
        .sidebar-item {
          transition: all 0.2s ease;
        }
        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }
        .sidebar-item.active {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.15), transparent);
          border-left: 3px solid var(--primary, #3b82f6);
        }
        .view-btn {
          transition: all 0.2s ease;
        }
        .view-btn:hover:not(.active) {
          background: rgba(255,255,255,0.05) !important;
        }
        .btn-glow {
          position: relative;
        }
        .btn-glow::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 0 15px var(--primary, #3b82f6);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .btn-glow:hover::after {
          opacity: 0.4;
        }
        .subfolder-item {
          transition: all 0.2s ease;
        }
        .subfolder-item:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.05);
        }
        .software-page-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          width: 100%;
          box-sizing: border-box;
        }
        .software-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: calc(100vh - 120px);
          position: sticky;
          top: 100px;
        }
        .software-header-bar {
          padding: 20px 32px;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .software-search-box {
          position: relative;
          width: 280px;
        }
        @media (max-width: 992px) {
          .software-page-container {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 0 16px;
          }
          .software-sidebar-col {
            height: auto !important;
            position: static !important;
            width: 100% !important;
          }
          .software-header-bar {
            padding: 16px 18px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .software-search-box {
            width: 100% !important;
          }
        }
      `}</style>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="You need to be logged in to download software packages." />

      <div className="container software-page-container">
        
        {/* ENHANCED SIDEBAR EXPLORER */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="software-sidebar-col"
        >
          <div className="glass-panel-new custom-scrollbar" style={{ padding: '24px', borderRadius: '24px', flex: 1, overflowY: 'auto' }}>
            
            {/* OS Switcher Header */}
            <div style={{ display: 'flex', background: 'var(--surface-badge)', padding: '4px', borderRadius: '16px', border: '1px solid var(--surface-border)', marginBottom: '20px' }}>
              <button 
                onClick={() => { setActiveOS('windows'); setCurrentFolder(null); setCurrentSubfolder(null); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: '0.85rem',
                  background: activeOS === 'windows' ? '#2563eb' : 'transparent',
                  color: activeOS === 'windows' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s'
                }}
              >
                <Monitor size={16} /> Windows
              </button>
              <button 
                onClick={() => { setActiveOS('mac'); setCurrentFolder(null); setCurrentSubfolder(null); }}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: '0.85rem',
                  background: activeOS === 'mac' ? '#a855f7' : 'transparent',
                  color: activeOS === 'mac' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s'
                }}
              >
                <Apple size={16} /> macOS
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'linear-gradient(135deg, #2563eb, #a855f7)', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)' }}>
                <Folder size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('software_repository_title') || 'SOFTWARE'}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{processedData.length} available packages</span>
              </div>
            </div>

            <button 
              onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }}
              className="btn-glow"
              style={{
                width: '100%', padding: '14px 20px', borderRadius: '16px', border: 'none',
                background: (!currentFolder && !searchQuery) ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--surface-badge)',
                color: (!currentFolder && !searchQuery) ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'all 0.3s',
                fontWeight: 700, marginBottom: '20px', boxShadow: (!currentFolder && !searchQuery) ? '0 10px 20px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              <LayoutGrid size={18} /> All Software Packages
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.entries(softwareStructure).map(([folderName, folderData]) => {
                const isExpanded = expandedFolders[folderName];
                const isActive = currentFolder === folderName;
                
                return (
                  <div key={folderName}>
                    <div 
                      className={`sidebar-item ${isActive && !currentSubfolder ? 'active' : ''}`}
                      onClick={() => { toggleFolder(folderName); setCurrentFolder(folderName); setCurrentSubfolder(null); }}
                      style={{
                        padding: '12px 16px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                        color: isActive ? '#fff' : '#94a3b8', fontWeight: isActive ? 700 : 500
                      }}
                    >
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight size={16} color={isExpanded ? '#fff' : '#64748b'} />
                      </motion.div>
                      <span style={{ color: isActive ? folderData.color : '#64748b', display: 'flex', alignItems: 'center', filter: isActive ? `drop-shadow(0 0 8px ${folderData.color}80)` : 'none' }}>
                        {folderData.icon}
                      </span>
                      <span style={{ fontSize: '0.95rem' }}>{folderName}</span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: 'hidden', marginLeft: '34px', borderLeft: '1px solid var(--surface-border)', paddingLeft: '8px', marginTop: '4px' }}
                        >
                          {folderData.subfolders.map(sub => (
                            <div
                              key={sub}
                              className="subfolder-item"
                              onClick={(e) => { e.stopPropagation(); setCurrentFolder(folderName); setCurrentSubfolder(sub); }}
                              style={{
                                padding: '8px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '0.85rem',
                                color: currentSubfolder === sub ? '#fff' : '#64748b',
                                fontWeight: currentSubfolder === sub ? 700 : 500,
                                background: currentSubfolder === sub ? 'var(--surface-badge)' : 'transparent',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                margin: '2px 0'
                              }}
                            >
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: currentSubfolder === sub ? folderData.color : 'transparent' }} />
                              {sub}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* ENHANCED MAIN CONTENT AREA */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '32px', minWidth: 0 }}>
          
          {/* HEADER TOOLBAR */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel-new software-header-bar" 
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
              {currentFolder ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ background: `${softwareStructure[currentFolder]?.color || '#3b82f6'}20`, padding: '12px', borderRadius: '16px', color: softwareStructure[currentFolder]?.color || '#3b82f6', flexShrink: 0 }}>
                    {softwareStructure[currentFolder]?.icon || <Folder size={20} />}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentFolder}</h1>
                    {currentSubfolder && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <ChevronRight size={14} /> {currentSubfolder}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '12px', borderRadius: '16px', color: '#2563eb', flexShrink: 0 }}>
                    <LayoutGrid size={24} />
                  </div>
                  <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{activeOS === 'windows' ? 'Windows Repository' : 'macOS Repository'}</h1>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '420px', justifyContent: 'flex-end' }}>
              <div className="software-search-box" style={{ flexGrow: 1, minWidth: '180px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="search-input"
                  type="text" 
                  placeholder={t('search_software') || 'Search software...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', 
                    border: '1px solid var(--surface-border)', background: 'var(--card-dark)', 
                    color: 'var(--text-main)', outline: 'none', transition: 'all 0.3s', fontSize: '0.95rem', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ display: 'flex', background: 'var(--card-dark)', padding: '4px', borderRadius: '16px', border: '1px solid var(--surface-border)', flexShrink: 0 }}>
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ border: 'none', background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: viewMode === 'grid' ? '#fff' : '#64748b' }}><LayoutGrid size={18} /></button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ border: 'none', background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: viewMode === 'list' ? '#fff' : '#64748b' }}><List size={18} /></button>
              </div>
            </div>
          </motion.div>

          {/* FILTERS TOOLBAR */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: '10px' }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-dark)', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <ArrowUpDown size={16} color="var(--text-muted)" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="name" style={{ background: 'var(--card-dark)' }}>Name (A-Z)</option>
                  <option value="size" style={{ background: 'var(--card-dark)' }}>Size (Largest)</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {processedData.length} packages
            </div>
          </motion.div>

          {/* QUICK ACCESS FOLDERS SECTION */}
          <AnimatePresence>
            {!searchQuery && !currentFolder && (
              <motion.section
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.4 }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>{t('quick_access') || 'Quick Access Categories'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '16px' }}>
                  {Object.entries(softwareStructure).map(([folderName, folderData], idx) => (
                    <motion.div 
                      key={folderName} 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.05 }}
                      onClick={() => { setCurrentFolder(folderName); toggleFolder(folderName); }}
                      className="glass-panel-new file-card" 
                      style={{ padding: '24px 18px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <div style={{ marginBottom: '16px' }}>
                        <ModernFolderIcon size={64} color={folderData.color} />
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>{folderName}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>{folderData.subfolders.length} Subcategories</p>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* SOFTWARE PACKAGES DISPLAY */}
          <section style={{ flex: 1 }}>
            {processedData.length === 0 ? (
              <div className="glass-panel-new" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-badge)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Ghost size={32} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>No software packages found</h3>
                <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or selecting a different category folder.</p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                key={viewMode + currentFolder + searchQuery + activeOS + sortBy}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' : '1fr', 
                  gap: '20px' 
                }}
              >
                {processedData.map((software) => {
                  const catColor = softwareStructure[software.folder]?.color || (activeOS === 'windows' ? '#2563eb' : '#a855f7');
                  
                  return (
                    <motion.div 
                      key={software.id} 
                      variants={itemVariants}
                      className="glass-panel-new file-card" 
                      style={{ 
                        padding: viewMode === 'grid' ? '28px' : '20px 28px', 
                        borderRadius: '24px', 
                        display: 'flex', 
                        flexDirection: viewMode === 'grid' ? 'column' : 'row', 
                        alignItems: viewMode === 'grid' ? 'stretch' : 'center',
                        gap: '20px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flex: viewMode === 'list' ? 1 : 'none' }}>
                        <div style={{ 
                          width: '56px', height: '56px', borderRadius: '16px', 
                          background: `linear-gradient(135deg, ${catColor}20, ${catColor}10)`, 
                          border: `1px solid ${catColor}30`,
                          color: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {(software.title.toLowerCase().includes('iso') || (software.url && software.url.toLowerCase().includes('.iso'))) ? (
                            <ModernIsoIcon size={38} />
                          ) : (
                            <SoftwareIcon id={software.id} os={software.os} size={36} iconUrl={software.iconUrl || software.icon} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Link to={`/software/${software.id}`} style={{ textDecoration: 'none' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)', lineHeight: 1.3 }}>{software.title}</h4>
                          </Link>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--surface-badge)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>{software.size || 'Unknown size'}</span>
                            <span style={{ background: 'var(--surface-badge)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>{software.version || 'Latest'}</span>
                            <span style={{ background: `${catColor}20`, color: catColor, padding: '4px 10px', borderRadius: '8px', border: `1px solid ${catColor}40` }}>
                              {software.folder}
                            </span>
                          </div>
                        </div>
                      </div>

                      {viewMode === 'grid' && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {software.desc || software.description || 'Verified software binary index.'}
                        </p>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: viewMode === 'grid' ? 'space-between' : 'flex-end', 
                        alignItems: 'center', 
                        marginTop: viewMode === 'grid' ? 'auto' : 0,
                        gap: '12px',
                        width: viewMode === 'list' ? 'auto' : '100%'
                      }}>
                        <div style={{ display: 'flex', gap: '10px', width: viewMode === 'grid' ? '100%' : 'auto', justifyContent: 'space-between' }}>
                          <Link 
                            to={`/software/${software.id}`}
                            style={{ 
                              padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', 
                              background: 'var(--surface-badge)', color: 'var(--text-main)', textDecoration: 'none',
                              fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            <Eye size={16} /> Details
                          </Link>
                          {software.url && (
                            <button 
                              disabled={downloadingId === software.id} 
                              onClick={(e) => handleDownloadFile(e, software.url, software.title, software.id)}
                              className="btn-glow"
                              style={{ 
                                padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
                                background: activeOS === 'mac' ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
                                color: '#fff', border: 'none',
                                display: 'flex', alignItems: 'center', gap: '8px', cursor: downloadingId === software.id ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {downloadingId === software.id ? <Loader2 size={18} className="spin" /> : <><DownloadIcon size={18} /> Download</>}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
};

export default Software;
