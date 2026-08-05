import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, FileText, Share2, Globe, Filter, Eye, Folder, 
  ChevronRight, ChevronDown, ArrowLeft, Cloud, Network, 
  Terminal, Database, ShieldCheck, ArrowUpDown, LayoutGrid, 
  List, Search, File, Loader2, MoreHorizontal 
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { checkDownloadLimit, formatRetryTime } from '../utils/rateLimiter';
import { logRateLimit } from '../utils/securityLogger';

// Custom Animated Folder Icon
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

const documentStructure = {
  Network: {
    icon: <Network size={20} />,
    color: "#3b82f6",
    subfolders: ['Cisco', 'Juniper', 'Mikrotik', 'Fortinet', 'Ubiquiti', 'TP-Link', 'D-Link', 'Netgear', 'Zyxel', 'Huawei']
  },
  Programming: {
    icon: <Terminal size={20} />,
    color: "#10b981",
    subfolders: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Bash', 'PowerShell']
  },
  Database: {
    icon: <Database size={20} />,
    color: "#f59e0b",
    subfolders: ['Mysql', 'Postgresql', 'Mongodb', 'Sqlserver', 'Oracle']
  },
  Security: {
    icon: <ShieldCheck size={20} />,
    color: "#ef4444",
    subfolders: ['Firewall', 'Antivirus', 'IDS', 'IPS', 'VPN']
  },
  Cloud: {
    icon: <Cloud size={20} />,
    color: "#8b5cf6",
    subfolders: ['AWS', 'Azure', 'GCP']
  }
};

const Documents = () => {
  const { t } = useLanguage();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); 
  const [downloadingId, setDownloadingId] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

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

  const handleDownloadFile = async (e, url, title, type, docId) => {
    e.preventDefault();
    if (authLoading) return;
    if (isGuest) { setAuthModalOpen(true); return; }
    if (!url) return;

    // Rate limiting — max 20 downloads per 60s
    const uid = user?.uid || 'anon';
    const { allowed, retryAfterMs } = checkDownloadLimit(uid);
    if (!allowed) {
      const { toast } = await import('react-hot-toast');
      toast.error(`Slow down! Try again in ${formatRetryTime(retryAfterMs)}`);
      logRateLimit('/documents');
      return;
    }
    setDownloadingId(docId);
    try {
      const response = await fetch(url + '?t=' + Date.now());
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      let ext = '.pdf';
      if (type && type.toLowerCase() === 'docx') ext = '.docx';
      else if (type && type.toLowerCase() === 'pptx') ext = '.pptx';
      link.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '')}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed', error);
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewFile = (url) => {
    if (authLoading) return;
    if (isGuest) { setAuthModalOpen(true); return; }

    // Rate limiting — shares download budget
    const uid = user?.uid || 'anon';
    const { allowed, retryAfterMs } = checkDownloadLimit(uid);
    if (!allowed) {
      import('react-hot-toast').then(({ toast }) =>
        toast.error(`Slow down! Try again in ${formatRetryTime(retryAfterMs)}`)
      );
      return;
    }

    if (url) window.open(url, '_blank');
  };

  const docData = [
    { id: 1, title: 'K8s Setup Guide', category: 'Cloud', subfolder: 'AWS', lang: 'English', size: '420 KB', date: '2025-10-14', type: 'PDF', desc: 'Chapters 9,10,11 - Transport, Application, Build Network', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' },
    { id: 5, title: 'Basic Security Principles', category: 'Security', subfolder: 'Firewall', lang: 'Khmer', size: '1.5 MB', date: '2025-12-05', type: 'PDF', desc: 'Introduction to cybersecurity for beginners in Khmer.' },
    { id: 8, title: 'CCNA1: Explorer Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.75 MB', date: '2026-01-15', type: 'PDF', desc: 'Chapters 1,2 - Explorer Network & Configure NOS', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter1%2C2%20-%20Explorer%20Network%20%26%20Configure%20NOS.pdf' },
    { id: 11, title: 'CCNA1: Build Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.72 MB', date: '2026-01-18', type: 'PDF', desc: 'Chapters 9,10,11 - Transport, Application, Build Network', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' },
    { id: 14, title: 'Mikrotik Manual (Khmer)', category: 'Network', subfolder: 'Mikrotik', lang: 'Khmer', size: 'Unknown', date: '2026-03-25', type: 'PDF', desc: 'Mikrotik networking manual and configuration guide in Khmer.', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' }
  ];

  const processedData = useMemo(() => {
    let result = docData;
    if (!searchQuery) {
      if (currentFolder) result = result.filter(doc => doc.category === currentFolder);
      if (currentSubfolder) result = result.filter(doc => doc.subfolder === currentSubfolder);
    } else {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(query) || doc.desc.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) || doc.subfolder.toLowerCase().includes(query)
      );
    }
    if (activeLang !== 'All') result = result.filter(doc => doc.lang === activeLang);
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'size') return parseSize(b.size) - parseSize(a.size);
      return 0;
    });
    return result;
  }, [currentFolder, currentSubfolder, searchQuery, activeLang, sortBy]);

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
    <div style={{ 
      minHeight: '100vh', paddingTop: '90px', paddingBottom: '60px'
    }}>
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
      `}</style>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="You need to be logged in to download or view documents." />
      
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', maxWidth: '1440px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* ENHANCED SIDEBAR EXPLORER */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)', position: 'sticky', top: '100px' }}
        >
          <div className="glass-panel-new custom-scrollbar" style={{ padding: '24px', borderRadius: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>
                <Folder size={20} color="var(--text-main)" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('documents_explorer') || 'EXPLORER'}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{docData.length} total files</span>
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
                fontWeight: 700, marginBottom: '24px', boxShadow: (!currentFolder && !searchQuery) ? '0 10px 20px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              <LayoutGrid size={18} /> {t('all_documents') || 'All Documents'}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(documentStructure).map(([folderName, folderData]) => {
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
        <main style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* HEADER BAR WITH ANIMATIONS */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-panel-new" 
            style={{ padding: '20px 32px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {currentFolder ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: `${documentStructure[currentFolder].color}20`, padding: '12px', borderRadius: '16px', color: documentStructure[currentFolder].color }}>
                    {documentStructure[currentFolder].icon}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{currentFolder}</h1>
                    {currentSubfolder && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <ChevronRight size={14} /> {currentSubfolder}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '16px', color: '#3b82f6' }}>
                    <LayoutGrid size={24} />
                  </div>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Overview</h1>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="search-input"
                  type="text" 
                  placeholder={t('search_files') || 'Search files...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', 
                    border: '1px solid var(--surface-border)', background: 'var(--card-dark)', 
                    color: 'var(--text-main)', outline: 'none', transition: 'all 0.3s', fontSize: '0.95rem'
                  }}
                />
              </div>
              <div style={{ display: 'flex', background: 'var(--card-dark)', padding: '6px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ border: 'none', background: viewMode === 'grid' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: viewMode === 'grid' ? '#fff' : '#64748b' }}><LayoutGrid size={18} /></button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ border: 'none', background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: viewMode === 'list' ? '#fff' : '#64748b' }}><List size={18} /></button>
              </div>
            </div>
          </motion.div>

          {/* FILTERS TOOLBAR */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px' }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-dark)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <Globe size={16} color="var(--text-muted)" />
                <select 
                  value={activeLang} 
                  onChange={(e) => setActiveLang(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="All" style={{ background: 'var(--card-dark)' }}>{t('all_languages') || 'All Languages'}</option>
                  <option value="Khmer" style={{ background: 'var(--card-dark)' }}>{t('khmer') || 'Khmer'}</option>
                  <option value="English" style={{ background: 'var(--card-dark)' }}>{t('english') || 'English'}</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-dark)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <ArrowUpDown size={16} color="var(--text-muted)" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="name" style={{ background: 'var(--card-dark)' }}>Name (A-Z)</option>
                  <option value="date" style={{ background: 'var(--card-dark)' }}>Date (Newest)</option>
                  <option value="size" style={{ background: 'var(--card-dark)' }}>Size (Largest)</option>
                </select>
              </div>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {processedData.length} items
            </div>
          </motion.div>

          {/* QUICK ACCESS SECTION */}
          <AnimatePresence>
            {!searchQuery && !currentFolder && (
              <motion.section
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.4 }}
              >
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>{t('quick_access') || 'Quick Access'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                  {Object.entries(documentStructure).map(([folderName, folderData], idx) => (
                    <motion.div 
                      key={folderName} 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + idx * 0.05 }}
                      onClick={() => { setCurrentFolder(folderName); toggleFolder(folderName); }}
                      className="glass-panel-new file-card" 
                      style={{ padding: '28px 24px', borderRadius: '24px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <div style={{ marginBottom: '20px' }}>
                        <ModernFolderIcon size={72} color={folderData.color} />
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>{folderName}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>{folderData.subfolders.length} Subcategories</p>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* FILES SECTION */}
          <section style={{ flex: 1 }}>
            {processedData.length === 0 ? (
              <div className="glass-panel-new" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-badge)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Search size={32} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>No documents found</h3>
                <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                key={viewMode + currentFolder + searchQuery + activeLang + sortBy}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(340px, 1fr))' : '1fr', 
                  gap: '20px' 
                }}
              >
                {processedData.map((doc) => {
                  const catColor = documentStructure[doc.category]?.color || '#3b82f6';
                  
                  return (
                    <motion.div 
                      key={doc.id} 
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
                          <FileText size={28} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)', lineHeight: 1.3 }}>{doc.title}</h4>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                            <span style={{ background: 'var(--surface-badge)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>{doc.size}</span>
                            <span style={{ background: 'var(--surface-badge)', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>{doc.type}</span>
                            <span style={{ background: doc.lang === 'Khmer' ? '#10b98120' : '#3b82f620', color: doc.lang === 'Khmer' ? '#10b981' : '#3b82f6', padding: '4px 10px', borderRadius: '8px', border: `1px solid ${doc.lang === 'Khmer' ? '#10b98140' : '#3b82f640'}` }}>
                              {doc.lang}
                            </span>
                          </div>
                        </div>
                      </div>

                      {viewMode === 'grid' && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {doc.desc}
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
                        {viewMode === 'grid' && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {doc.date}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => handleViewFile(doc.url)}
                            style={{ 
                              padding: '10px', borderRadius: '12px', border: '1px solid var(--surface-border)', 
                              background: 'var(--surface-badge)', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-border)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'var(--surface-badge)'}
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            disabled={downloadingId === doc.id} 
                            onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)}
                            className="btn-glow"
                            style={{ 
                              padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'var(--text-main)', border: 'none',
                              display: 'flex', alignItems: 'center', gap: '8px', cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {downloadingId === doc.id ? <Loader2 size={18} className="spin" /> : <><Download size={18} /> {t('download') || 'Download'}</>}
                          </button>
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

export default Documents;
