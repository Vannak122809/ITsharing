import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';
import { Download, FileText, Share2, Globe, Filter, Eye, Folder, ChevronRight, ChevronDown, ArrowLeft, Cloud, Network, Terminal, Database, ShieldCheck, ArrowUpDown, LayoutGrid, List, Search, File, Loader2 } from 'lucide-react';

const ModernFolderIcon = ({ size = 48, color = "var(--primary)" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 14C6 11.7909 7.79086 10 10 10H19.1716C20.2325 10 21.25 10.4214 22 11.1716L24.8284 14H38C40.2091 14 42 15.7909 42 18V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V14Z" fill={color} opacity="0.6"/>
    <path d="M6 19C6 17.8954 6.89543 17 8 17H40C41.1046 17 42 17.8954 42 19V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V19Z" fill={color}/>
  </svg>
);

const documentStructure = {
  Network: {
    icon: <Network size={20} color="#3b82f6" />,
    color: "#3b82f6",
    subfolders: ['Cisco', 'Juniper', 'Mikrotik', 'Fortinet', 'Ubiquiti', 'TP-Link', 'D-Link', 'Netgear', 'Zyxel', 'Huawei']
  },
  Programming: {
    icon: <Terminal size={20} color="#10b981" />,
    color: "#10b981",
    subfolders: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Bash', 'PowerShell']
  },
  Database: {
    icon: <Database size={20} color="#f59e0b" />,
    color: "#f59e0b",
    subfolders: ['Mysql', 'Postgresql', 'Mongodb', 'Sqlserver', 'Oracle']
  },
  Security: {
    icon: <ShieldCheck size={20} color="#ef4444" />,
    color: "#ef4444",
    subfolders: ['Firewall', 'Antivirus', 'IDS', 'IPS', 'VPN']
  },
  Cloud: {
    icon: <Cloud size={20} color="#8b5cf6" />,
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
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
    if (isGuest) {
      navigate('/login');
      return;
    }
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
    { id: 1, title: 'K8s Setup Guide', category: 'Cloud', subfolder: 'AWS', lang: 'English', size: '420 KB', date: '2025-10-14', type: 'PDF', desc: 'YAML files and cluster setup docs.', color: 'var(--primary)' },
    { id: 2, title: 'Design Patterns Java', category: 'Programming', subfolder: 'Java', lang: 'English', size: '1.2 MB', date: '2024-05-20', type: 'PDF', desc: 'Gang of four simplified in modern Java.', color: 'var(--primary)' },
    { id: 3, title: 'Network Setup CCNA', category: 'Network', subfolder: 'Cisco', lang: 'Khmer', size: '2.5 MB', date: '2025-11-01', type: 'DOCX', desc: 'Cisco networking concepts explained in Khmer.', color: 'var(--primary)' },
    { id: 4, title: 'SQL Performance Tuning', category: 'Database', subfolder: 'Postgresql', lang: 'English', size: '800 KB', date: '2025-08-11', type: 'PDF', desc: 'Optimizing complex Postgres queries and indexing.', color: 'var(--primary)' },
    { id: 5, title: 'Basic Security Principles', category: 'Security', subfolder: 'Firewall', lang: 'Khmer', size: '1.5 MB', date: '2025-12-05', type: 'PDF', desc: 'Introduction to cybersecurity for beginners in Khmer.', color: 'var(--primary)' },
    { id: 6, title: 'Python Data Structures', category: 'Programming', subfolder: 'Python', lang: 'Khmer', size: '3.1 MB', date: '2025-09-22', type: 'PPTX', desc: 'Deep dive into Python arrays, dictionaries, and sets.', color: 'var(--primary)' },
    { id: 7, title: 'Example PDF Document', category: 'Programming', subfolder: 'HTML', lang: 'English', size: '12 KB', date: '2025-01-10', type: 'PDF', desc: 'A sample PDF document uploaded directly to Cloudflare R2.', color: 'var(--primary)', url: 'https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/example-1773817512924.pdf' },
    { id: 8, title: 'CCNA1: Explorer Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.75 MB', date: '2026-01-15', type: 'PDF', desc: 'Chapters 1,2 - Explorer Network & Configure NOS', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter1%2C2%20-%20Explorer%20Network%20%26%20Configure%20NOS.pdf' },
    { id: 9, title: 'CCNA1: Network Protocol', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.73 MB', date: '2026-01-16', type: 'PDF', desc: 'Chapters 3,4,5 - Network Protocol, Access, Ethernet', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter3%2C4%2C5%20-%20Network%20Protocol%2C%20Access%2C%20Ethernet.pdf' },
    { id: 10, title: 'CCNA1: Network Layer & IP', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.74 MB', date: '2026-01-17', type: 'PDF', desc: 'Chapters 6,7,8 - Network Layer, IP Address, Subnet', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter6%2C7%2C8%20-%20Network%20Layer%2C%20IP%20Address%2C%20Subnet.pdf' },
    { id: 11, title: 'CCNA1: Build Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.72 MB', date: '2026-01-18', type: 'PDF', desc: 'Chapters 9,10,11 - Transport, Application, Build Network', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' },
    { id: 12, title: 'MikroTik & UniFi Essentials', category: 'Network', subfolder: 'Mikrotik', lang: 'English', size: '2.8 MB', date: '2026-03-25', type: 'PDF', desc: 'MikroTik & UniFi Networking Essentials', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/Mikrotik%20%26%20UniFi%20Networking%20Essentials.pdf' },
    { id: 13, title: 'MikroTik & UniFi Essentials', category: 'Network', subfolder: 'Ubiquiti', lang: 'English', size: '2.8 MB', date: '2026-03-25', type: 'PDF', desc: 'MikroTik & UniFi Networking Essentials', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/Mikrotik%20%26%20UniFi%20Networking%20Essentials.pdf' },
    { id: 14, title: 'Mikrotik Manual (Khmer)', category: 'Network', subfolder: 'Mikrotik', lang: 'Khmer', size: 'Unknown', date: '2026-03-25', type: 'PDF', desc: 'Mikrotik networking manual and configuration guide in Khmer.', color: 'var(--primary)', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' }
  ];

  const processedData = useMemo(() => {
    let result = docData;
    if (!searchQuery) {
      if (currentFolder) result = result.filter(doc => doc.category === currentFolder);
      if (currentSubfolder) result = result.filter(doc => doc.subfolder === currentSubfolder);
    } else {
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.subfolder.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeLang !== 'All') result = result.filter(doc => doc.lang === activeLang);
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'size') return parseSize(b.size) - parseSize(a.size);
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });
    return result;
  }, [currentFolder, currentSubfolder, searchQuery, activeLang, sortBy]);

  return (
    <div className="container doc-layout" style={{ maxWidth: '1400px', minHeight: '100vh' }}>
      
      {/* SIDEBAR EXPLORER */}
      <div className="doc-sidebar">
        <h2 style={{ fontSize: '0.85rem', marginBottom: '16px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Folder size={16} color="var(--primary)" /> {t('documents_explorer')}
        </h2>
        
        <div 
          onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }}
          style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: (!currentFolder && !searchQuery) ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent', color: (!currentFolder && !searchQuery) ? '#fff' : 'var(--text-main)', transition: 'var(--transition)', fontWeight: (!currentFolder && !searchQuery) ? 600 : 500, boxShadow: (!currentFolder && !searchQuery) ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none' }}
          onMouseOver={(e) => { if (currentFolder || searchQuery) { e.currentTarget.style.background = 'var(--surface-badge)'; e.currentTarget.style.transform = 'translateX(4px)'; } }}
          onMouseOut={(e) => { if (currentFolder || searchQuery) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; } }}
        >
          <LayoutGrid size={18} /> <span>{t('all_documents')}</span>
        </div>

        <div style={{ height: '1px', background: 'var(--surface-border)', margin: '8px 0', flexShrink: 0 }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Object.entries(documentStructure).map(([folderName, folderData]) => {
            const isExpanded = expandedFolders[folderName];
            const isActiveFolder = currentFolder === folderName && !currentSubfolder;

            return (
              <div key={folderName} style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  onClick={() => { toggleFolder(folderName); setCurrentFolder(folderName); setCurrentSubfolder(null); setSearchQuery(''); }}
                  style={{ padding: '12px 14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: isActiveFolder ? 'rgba(99, 102, 241, 0.08)' : 'transparent', color: isActiveFolder ? 'var(--primary)' : 'var(--text-main)', transition: 'var(--transition)', fontWeight: isActiveFolder ? 600 : 500 }}
                  onMouseOver={(e) => { if (!isActiveFolder) { e.currentTarget.style.background = 'var(--surface-badge)'; e.currentTarget.style.transform = 'translateX(4px)'; } }}
                  onMouseOut={(e) => { if (!isActiveFolder) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; } }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', color: 'var(--text-muted)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: isExpanded ? 'rotate(0deg)' : 'rotate(0deg)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', color: isActiveFolder ? 'var(--primary)' : folderData.color }}>
                     {folderData.icon} 
                  </span>
                  <span>{t(folderName.toLowerCase().replace(' ', '_'))}</span>
                </div>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '34px', marginTop: '4px', gap: '2px', borderLeft: '1.5px solid var(--surface-border)', paddingLeft: '8px' }}>
                    {folderData.subfolders.map(sub => {
                      const isActiveSub = currentFolder === folderName && currentSubfolder === sub;
                      return (
                        <div 
                          key={sub}
                          onClick={() => { setCurrentFolder(folderName); setCurrentSubfolder(sub); setSearchQuery(''); }}
                          style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', background: isActiveSub ? 'rgba(99, 102, 241, 0.08)' : 'transparent', color: isActiveSub ? 'var(--primary)' : 'var(--text-muted)', transition: 'var(--transition)', fontWeight: isActiveSub ? 600 : 400 }}
                          onMouseOver={(e) => { if (!isActiveSub) { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--surface-badge)'; e.currentTarget.style.transform = 'translateX(4px)'; } }}
                          onMouseOut={(e) => { if (!isActiveSub) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; } }}
                        >
                          <Folder size={14} style={{ opacity: 0.7 }} /> {sub}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="doc-main">
        
        {/* Back Button for Mobile/Desktop Flow */}
        {(currentFolder || searchQuery) && (
          <button 
            onClick={() => { 
              if (searchQuery) setSearchQuery('');
              else if (currentSubfolder) setCurrentSubfolder(null);
              else setCurrentFolder(null);
            }}
            className="btn btn-outline"
            style={{ alignSelf: 'flex-start', padding: '8px 16px', marginBottom: '8px', fontSize: '0.85rem', gap: '6px' }}
          >
            <ArrowLeft size={16} /> {searchQuery ? t('back_to_folders') : (currentSubfolder ? `${t('back_to')} ${t('folder')} ${t(currentFolder.toLowerCase().replace(' ', '_'))}` : t('back_to_all'))}
          </button>
        )}
        
        {/* TOP TOOLBAR */}
        <div style={{ background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 600, flexWrap: 'wrap' }}>
              <div 
                onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition)', padding: '6px 10px', borderRadius: '8px' }} 
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface-badge)'; }} 
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <LayoutGrid size={16} /> {t('root')}
              </div>
              {currentFolder && (
                <>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <div 
                    onClick={() => setCurrentSubfolder(null)} 
                    style={{ cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', transition: 'var(--transition)' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface-badge)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ color: documentStructure[currentFolder].color }}>{documentStructure[currentFolder].icon}</span> {t(currentFolder.toLowerCase().replace(' ', '_'))}
                  </div>
                </>
              )}
              {currentSubfolder && (
                <>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '8px', background: 'var(--surface-badge)', fontWeight: 700 }}>
                    <Folder size={16} /> {currentSubfolder}
                  </div>
                </>
              )}
            </div>

            {/* View Mode & Global Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
               <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder={t('search_files')} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input-doc"
                    style={{ padding: '8px 16px 8px 36px', background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '20px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', transition: 'var(--transition)' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                  />
               </div>
               
               <div style={{ display: 'flex', background: 'var(--card-dark)', borderRadius: '8px', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                 <button onClick={() => setViewMode('grid')} style={{ padding: '8px 12px', background: viewMode === 'grid' ? 'var(--surface-badge)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)', transition: 'var(--transition)' }}><LayoutGrid size={18} /></button>
                 <button onClick={() => setViewMode('list')} style={{ padding: '8px 12px', background: viewMode === 'list' ? 'var(--surface-badge)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)', transition: 'var(--transition)' }}><List size={18} /></button>
               </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--surface-border)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} color="var(--text-muted)" />
              <select 
                value={activeLang} 
                onChange={(e) => setActiveLang(e.target.value)}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <option value="All" style={{ background: 'var(--card-dark)' }}>{t('all_languages')}</option>
                <option value="Khmer" style={{ background: 'var(--card-dark)' }}>{t('khmer')}</option>
                <option value="English" style={{ background: 'var(--card-dark)' }}>{t('english')}</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={16} color="var(--text-muted)" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <option value="name" style={{ background: 'var(--card-dark)' }}>{t('name_az')}</option>
                <option value="date" style={{ background: 'var(--card-dark)' }}>{t('date_newest')}</option>
                <option value="size" style={{ background: 'var(--card-dark)' }}>{t('size_largest')}</option>
                <option value="type" style={{ background: 'var(--card-dark)' }}>{t('type')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOLDERS / FILES DISPLAY */}
        <div style={{ flex: 1 }}>
          
          {/* Subfolders Grid if Category is selected without Subfolder */}
          {!searchQuery && currentFolder && !currentSubfolder && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>{t('folders_in')} {t(currentFolder.toLowerCase().replace(' ', '_'))}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {documentStructure[currentFolder].subfolders.map((subName) => {
                  const itemCount = docData.filter(d => d.category === currentFolder && d.subfolder === subName).length;
                  return (
                    <div 
                      key={subName}
                      onClick={() => setCurrentSubfolder(subName)}
                      className=""
                      style={{ background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '12px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition)' }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = documentStructure[currentFolder].color; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'var(--card-dark)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                    >
                      <Folder color={documentStructure[currentFolder].color} size={32} fill={`${documentStructure[currentFolder].color}22`} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{subName}</h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{itemCount} {t('files')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Access Grid if at Root */}
          {!searchQuery && !currentFolder && (
            <div style={{ marginBottom: '32px' }}>
               <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>{t('quick_access')}</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {Object.entries(documentStructure).map(([folderName, folderData]) => (
                    <div 
                      key={folderName}
                      onClick={() => { setCurrentFolder(folderName); if(!expandedFolders[folderName]) toggleFolder(folderName); }}
                      style={{ background: 'var(--card-dark)', border: '1.5px solid var(--surface-border)', borderRadius: '20px', padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center', transition: 'var(--transition)', position: 'relative', overflow: 'hidden' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = folderData.color; e.currentTarget.style.boxShadow = `0 12px 30px ${folderData.color}15`; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `${folderData.color}08`, borderRadius: '50%' }} />
                      <ModernFolderIcon size={72} color={folderData.color} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 700 }}>{t(folderName.toLowerCase().replace(' ', '_'))}</h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>{folderData.subfolders.length} {t('subdirectories')}</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Regular Files Section */}
          {((currentFolder && currentSubfolder) || searchQuery || (!searchQuery && !currentFolder)) && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>{t('files')} {searchQuery && `${t('matching')} "${searchQuery}"`}</h3>
              
              {processedData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--surface-border)' }}>
                  <File size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
                  <p>{t('no_files_found')}</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {processedData.map((doc) => (
                    <div key={doc.id} style={{ background: 'var(--card-dark)', border: '1.5px solid var(--surface-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'var(--transition)', cursor: 'default', position: 'relative' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = documentStructure[doc.category]?.color || '#64748b'; e.currentTarget.style.boxShadow = `0 10px 25px ${documentStructure[doc.category]?.color || '#64748b'}15`; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{ background: `${documentStructure[doc.category]?.color || '#64748b'}15`, padding: '12px', borderRadius: '12px', color: documentStructure[doc.category]?.color || '#64748b' }}>
                          <FileText size={28} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', fontWeight: 700 }} title={doc.title}>{doc.title}</h4>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 500 }}>
                            <span style={{ background: 'var(--surface-badge)', padding: '2px 8px', borderRadius: '4px' }}>{doc.size}</span>
                            <span style={{ opacity: 0.8 }}>• {doc.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>{doc.desc}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '16px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.72rem', background: doc.lang === 'Khmer' ? 'rgba(0, 250, 154, 0.1)' : 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '20px', color: doc.lang === 'Khmer' ? '#059669' : '#3b82f6', fontWeight: 700 }}>{doc.lang}</span>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {doc.url ? (
                            <>
                              <a href={isGuest ? '#' : doc.url} target="_blank" rel="noreferrer" onClick={(e) => { 
                                if (authLoading) return;
                                if (isGuest) { e.preventDefault(); navigate('/login'); } 
                              }} style={{ width: '36px', height: '36px', background: 'var(--surface-badge)', borderRadius: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-badge)'; e.currentTarget.style.color = 'var(--primary)'; }} title={t('view')}><Eye size={16} /></a>
                              
                              <button disabled={downloadingId === doc.id} onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)} style={{ padding: '0 14px', height: '36px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer', transition: 'var(--transition)', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' }} onMouseOver={(e) => { if(downloadingId !== doc.id) e.currentTarget.style.filter = 'brightness(1.1)'; }} onMouseOut={(e) => { if(downloadingId !== doc.id) e.currentTarget.style.filter = 'brightness(1)'; }}>
                                {downloadingId === doc.id ? <Loader2 size={16} className="spin" /> : <><Download size={16} /> {t('download')}</>}
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Details only</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '12px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-badge)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <th style={{ padding: '16px 24px', fontWeight: 600, borderRadius: '12px 0 0 0' }}>{t('name')}</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>{t('location')}</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>{t('language')}</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>{t('size')}</th>
                        <th style={{ padding: '16px', fontWeight: 600 }}>{t('date')}</th>
                        <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right', borderRadius: '0 12px 0 0' }}>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.map((doc, idx) => (
                        <tr key={doc.id} style={{ borderBottom: idx === processedData.length - 1 ? 'none' : '1.5px solid var(--surface-border)', transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.04)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ background: `${documentStructure[doc.category]?.color || '#64748b'}15`, padding: '10px', borderRadius: '10px', color: documentStructure[doc.category]?.color || '#64748b' }}>
                              <FileText size={20} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>{doc.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{doc.type}</div>
                            </div>
                          </td>
                          <td style={{ padding: '20px 16px' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: documentStructure[doc.category]?.color || '#64748b', opacity: 0.8 }}>{documentStructure[doc.category]?.icon}</span>
                              {doc.category} <ChevronRight size={10} /> {doc.subfolder}
                            </div>
                          </td>
                          <td style={{ padding: '20px 16px' }}>
                            <span style={{ fontSize: '0.72rem', background: doc.lang === 'Khmer' ? 'rgba(0, 250, 154, 0.1)' : 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '20px', color: doc.lang === 'Khmer' ? '#059669' : '#3b82f6', fontWeight: 700 }}>
                              {doc.lang}
                            </span>
                          </td>
                          <td style={{ padding: '20px 16px', fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 500 }}>{doc.size}</td>
                          <td style={{ padding: '20px 16px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>{doc.date}</td>
                          <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', opacity: 0.9 }}>
                              {doc.url ? (
                                <>
                                  <a href={isGuest ? '#' : doc.url} target="_blank" rel="noreferrer" onClick={(e) => { 
                                    if (authLoading) return;
                                    if (isGuest) { e.preventDefault(); navigate('/login'); } 
                                  }} style={{ width: '40px', height: '40px', background: 'var(--surface-badge)', borderRadius: '10px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-badge)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }} title={t('view')}><Eye size={18} /></a>
                                  
                                  <button disabled={downloadingId === doc.id} onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)} style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', border: 'none', borderRadius: '10px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer', transition: 'var(--transition)', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }} onMouseOver={(e) => { if(downloadingId !== doc.id) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.3)'; } }} onMouseOut={(e) => { if(downloadingId !== doc.id) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)'; } }} title={t('download')}>
                                    {downloadingId === doc.id ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
                                  </button>
                                </>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Private File</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
