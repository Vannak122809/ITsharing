import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';
import { Download, FileText, Share2, Globe, Filter, Eye, Folder, ChevronRight, ChevronDown, ArrowLeft, Cloud, Network, Terminal, Database, ShieldCheck, ArrowUpDown, LayoutGrid, List, Search, File, Loader2, MoreHorizontal } from 'lucide-react';

// Custom Folder Icon matching the user's image
const ModernFolderIcon = ({ size = 64, color = "#3b82f6" }) => (
  <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ 
      width: size * 0.8, height: size * 0.6, background: color, borderRadius: '12px', 
      position: 'relative', boxShadow: `0 8px 20px ${color}30` 
    }}>
      <div style={{ 
        position: 'absolute', top: '-8px', left: '0', width: '40%', height: '10px', 
        background: color, borderTopLeftRadius: '8px', borderTopRightRadius: '8px' 
      }} />
      <div style={{ 
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', 
        background: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(2px)' 
      }} />
    </div>
  </div>
);

const documentStructure = {
  Network: {
    icon: <Network size={18} />,
    color: "#3b82f6",
    subfolders: ['Cisco', 'Juniper', 'Mikrotik', 'Fortinet', 'Ubiquiti']
  },
  Programming: {
    icon: <Terminal size={18} />,
    color: "#10b981",
    subfolders: ['Python', 'JavaScript', 'Java', 'C++', 'C#']
  },
  Database: {
    icon: <Database size={18} />,
    color: "#f59e0b",
    subfolders: ['Mysql', 'Postgresql', 'Mongodb', 'Oracle']
  },
  Security: {
    icon: <ShieldCheck size={18} />,
    color: "#ef4444",
    subfolders: ['Firewall', 'Antivirus', 'VPN']
  },
  Cloud: {
    icon: <Cloud size={18} />,
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
    if (isGuest) { navigate('/login'); return; }
    if (!url) return;
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

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingTop: '100px' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', maxWidth: '1440px' }}>
        
        {/* SIDEBAR EXPLORER */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', position: 'sticky', top: '100px' }}>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Folder size={16} /> {t('documents_explorer').toUpperCase()}
            </h2>

            <button 
              onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }}
              style={{
                width: '100%', padding: '12px 20px', borderRadius: '14px', border: 'none',
                background: (!currentFolder && !searchQuery) ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                color: (!currentFolder && !searchQuery) ? '#fff' : 'var(--text-main)',
                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: '0.3s',
                fontWeight: 700, marginBottom: '16px'
              }}
            >
              <LayoutGrid size={18} /> {t('all_documents')}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(documentStructure).map(([folderName, folderData]) => {
                const isExpanded = expandedFolders[folderName];
                const isActive = currentFolder === folderName;
                return (
                  <div key={folderName}>
                    <div 
                      onClick={() => { toggleFolder(folderName); setCurrentFolder(folderName); setCurrentSubfolder(null); }}
                      style={{
                        padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                        color: isActive ? 'var(--text-main)' : 'var(--text-muted)', transition: '0.3s', fontWeight: isActive ? 700 : 500
                      }}
                      onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-badge)'; }}
                      onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                      <span style={{ color: folderData.color }}>{folderData.icon}</span>
                      <span>{folderName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* HEADER BAR */}
          <div className="glass-panel" style={{ padding: '24px 32px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.2rem', fontWeight: 800 }}>
              <LayoutGrid size={24} color="var(--primary)" /> {currentFolder || t('root')}
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder={t('search_files')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', background: 'var(--surface-badge)', padding: '4px', borderRadius: '12px' }}>
                <button onClick={() => setViewMode('grid')} style={{ border: 'none', background: viewMode === 'grid' ? '#fff' : 'transparent', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)' }}><LayoutGrid size={18} /></button>
                <button onClick={() => setViewMode('list')} style={{ border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)' }}><List size={18} /></button>
              </div>
            </div>
          </div>

          {/* FILTERS TOOLBAR */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Globe size={18} color="var(--text-muted)" />
            <select 
              value={activeLang} 
              onChange={(e) => setActiveLang(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="All">{t('all_languages')}</option>
              <option value="Khmer">{t('khmer')}</option>
              <option value="English">{t('english')}</option>
            </select>
            <ArrowUpDown size={18} color="var(--text-muted)" style={{ marginLeft: '12px' }} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
            >
              <option value="name">Name (A-Z)</option>
              <option value="date">Date (Newest)</option>
              <option value="size">Size (Largest)</option>
            </select>
          </div>

          {/* QUICK ACCESS SECTION */}
          {!searchQuery && !currentFolder && (
            <section>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>{t('quick_access')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {Object.entries(documentStructure).map(([folderName, folderData]) => (
                  <div 
                    key={folderName} 
                    onClick={() => { setCurrentFolder(folderName); toggleFolder(folderName); }}
                    className="glass-panel" 
                    style={{ padding: '32px 24px', borderRadius: '32px', textAlign: 'center', cursor: 'pointer', transition: '0.3s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-8px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${folderData.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                      <ModernFolderIcon size={48} color={folderData.color} />
                    </div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>{folderName}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{folderData.subfolders.length} subdirectories</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FILES SECTION */}
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{t('files')}</h3>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>{processedData.length} items</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {processedData.map((doc) => (
                <div key={doc.id} className="glass-panel" style={{ padding: '32px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${documentStructure[doc.category]?.color || 'var(--primary)'}15`, color: documentStructure[doc.category]?.color || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={32} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>{doc.title}</h4>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        <span style={{ background: 'var(--surface-badge)', padding: '4px 10px', borderRadius: '8px' }}>{doc.size}</span>
                        <span style={{ background: 'var(--surface-badge)', padding: '4px 10px', borderRadius: '8px' }}>{doc.type}</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', flexGrow: 1 }}>{doc.desc}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ background: doc.lang === 'Khmer' ? '#10b98115' : '#3b82f615', color: doc.lang === 'Khmer' ? '#10b981' : '#3b82f6', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800 }}>
                      {doc.lang}
                    </span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-outline" style={{ padding: '10px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                        <Eye size={20} />
                      </button>
                      <button 
                        disabled={downloadingId === doc.id} 
                        onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)}
                        className="btn btn-primary" 
                        style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem' }}
                      >
                        {downloadingId === doc.id ? <Loader2 size={18} className="spin" /> : <><Download size={18} /> {t('download')}</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export default Documents;
