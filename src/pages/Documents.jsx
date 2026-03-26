import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Download, FileText, Share2, Globe, Filter, Eye, Folder, ChevronRight, ChevronDown, ArrowLeft, Cloud, Network, Terminal, Database, ShieldCheck, ArrowUpDown, LayoutGrid, List, Search, File, Loader2 } from 'lucide-react';

const ModernFolderIcon = ({ size = 48, color = "#14b8a6" }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 14C6 11.7909 7.79086 10 10 10H19.1716C20.2325 10 21.25 10.4214 22 11.1716L24.8284 14H38C40.2091 14 42 15.7909 42 18V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V14Z" fill={color} opacity="0.8"/>
    <path d="M6 19C6 17.8954 6.89543 17 8 17H40C41.1046 17 42 17.8954 42 19V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V19Z" fill={color}/>
  </svg>
);

const documentStructure = {
  Network: {
    icon: <Network size={20} color="#00fa9a" />,
    color: "#00fa9a",
    subfolders: ['Cisco', 'Juniper', 'Mikrotik', 'Fortinet', 'Ubiquiti', 'TP-Link', 'D-Link', 'Netgear', 'Zyxel', 'Huawei']
  },
  Programming: {
    icon: <Terminal size={20} color="var(--primary)" />,
    color: "var(--primary)",
    subfolders: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Bash', 'PowerShell']
  },
  Database: {
    icon: <Database size={20} color="#ff9900" />,
    color: "#ff9900",
    subfolders: ['Mysql', 'Postgresql', 'Mongodb', 'Sqlserver', 'Oracle']
  },
  Security: {
    icon: <ShieldCheck size={20} color="#ff2a7a" />,
    color: "#ff2a7a",
    subfolders: ['Firewall', 'Antivirus', 'IDS', 'IPS', 'VPN']
  },
  Cloud: {
    icon: <Cloud size={20} color="#45f3ff" />,
    color: "#45f3ff",
    subfolders: ['AWS', 'Azure', 'GCP']
  }
};

const Documents = () => {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); 
  const [downloadingId, setDownloadingId] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

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
    if (!user) {
      navigate('/login');
      return;
    }
    if (!url) return;
    setDownloadingId(docId);
    try {
      // Adding a timestamp to prevent the browser/Cloudflare from serving a cached non-CORS response
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
    { id: 1, title: 'K8s Setup Guide', category: 'Cloud', subfolder: 'AWS', lang: 'English', size: '420 KB', date: '2025-10-14', type: 'PDF', desc: 'YAML files and cluster setup docs.', color: '#45f3ff' },
    { id: 2, title: 'Design Patterns Java', category: 'Programming', subfolder: 'Java', lang: 'English', size: '1.2 MB', date: '2024-05-20', type: 'PDF', desc: 'Gang of four simplified in modern Java.', color: 'var(--primary)' },
    { id: 3, title: 'Network Setup CCNA', category: 'Network', subfolder: 'Cisco', lang: 'Khmer', size: '2.5 MB', date: '2025-11-01', type: 'DOCX', desc: 'Cisco networking concepts explained in Khmer.', color: '#00fa9a' },
    { id: 4, title: 'SQL Performance Tuning', category: 'Database', subfolder: 'Postgresql', lang: 'English', size: '800 KB', date: '2025-08-11', type: 'PDF', desc: 'Optimizing complex Postgres queries and indexing.', color: '#ff9900' },
    { id: 5, title: 'Basic Security Principles', category: 'Security', subfolder: 'Firewall', lang: 'Khmer', size: '1.5 MB', date: '2025-12-05', type: 'PDF', desc: 'Introduction to cybersecurity for beginners in Khmer.', color: '#ff2a7a' },
    { id: 6, title: 'Python Data Structures', category: 'Programming', subfolder: 'Python', lang: 'Khmer', size: '3.1 MB', date: '2025-09-22', type: 'PPTX', desc: 'Deep dive into Python arrays, dictionaries, and sets.', color: 'var(--primary)' },
    { id: 7, title: 'Example PDF Document', category: 'Programming', subfolder: 'HTML', lang: 'English', size: '12 KB', date: '2025-01-10', type: 'PDF', desc: 'A sample PDF document uploaded directly to Cloudflare R2.', color: 'var(--primary)', url: 'https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/example-1773817512924.pdf' },
    { id: 8, title: 'CCNA1: Explorer Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.75 MB', date: '2026-01-15', type: 'PDF', desc: 'Chapters 1,2 - Explorer Network & Configure NOS', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter1%2C2%20-%20Explorer%20Network%20%26%20Configure%20NOS.pdf' },
    { id: 9, title: 'CCNA1: Network Protocol', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.73 MB', date: '2026-01-16', type: 'PDF', desc: 'Chapters 3,4,5 - Network Protocol, Access, Ethernet', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter3%2C4%2C5%20-%20Network%20Protocol%2C%20Access%2C%20Ethernet.pdf' },
    { id: 10, title: 'CCNA1: Network Layer & IP', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.74 MB', date: '2026-01-17', type: 'PDF', desc: 'Chapters 6,7,8 - Network Layer, IP Address, Subnet', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter6%2C7%2C8%20-%20Network%20Layer%2C%20IP%20Address%2C%20Subnet.pdf' },
    { id: 11, title: 'CCNA1: Build Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.72 MB', date: '2026-01-18', type: 'PDF', desc: 'Chapters 9,10,11 - Transport, Application, Build Network', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' },
    { id: 12, title: 'MikroTik & UniFi Essentials', category: 'Network', subfolder: 'Mikrotik', lang: 'English', size: '2.8 MB', date: '2026-03-25', type: 'PDF', desc: 'MikroTik & UniFi Networking Essentials', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/Mikrotik%20%26%20UniFi%20Networking%20Essentials.pdf' },
    { id: 13, title: 'MikroTik & UniFi Essentials', category: 'Network', subfolder: 'Ubiquiti', lang: 'English', size: '2.8 MB', date: '2026-03-25', type: 'PDF', desc: 'MikroTik & UniFi Networking Essentials', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/Mikrotik%20%26%20UniFi%20Networking%20Essentials.pdf' },
    { id: 14, title: 'Mikrotik Manual (Khmer)', category: 'Network', subfolder: 'Mikrotik', lang: 'Khmer', size: 'Unknown', date: '2026-03-25', type: 'PDF', desc: 'Mikrotik networking manual and configuration guide in Khmer.', color: '#00fa9a', url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' }
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
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      
      {/* SIDEBAR EXPLORER */}
      <div className="glass-panel" style={{ width: '280px', flex: '1 1 280px', maxWidth: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', height: 'fit-content', maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: '100px', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Folder size={20} color="var(--primary)" /> Explorer
        </h2>
        
        <div 
          onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }}
          style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: (!currentFolder && !searchQuery) ? 'var(--surface-badge)' : 'transparent', color: (!currentFolder && !searchQuery) ? 'var(--primary)' : 'var(--text-main)', transition: 'var(--transition)' }}
        >
          <LayoutGrid size={18} /> <span style={{ fontWeight: 500 }}>All Documents</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Object.entries(documentStructure).map(([folderName, folderData]) => {
            const isExpanded = expandedFolders[folderName];
            const isActiveFolder = currentFolder === folderName && !currentSubfolder;

            return (
              <div key={folderName} style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  onClick={() => { toggleFolder(folderName); setCurrentFolder(folderName); setCurrentSubfolder(null); setSearchQuery(''); }}
                  style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', background: isActiveFolder ? 'var(--surface-badge)' : 'transparent', color: isActiveFolder ? folderData.color : 'var(--text-main)', transition: 'var(--transition)' }}
                  onMouseOver={(e) => { if (!isActiveFolder) e.currentTarget.style.background = 'var(--surface-border)'; }}
                  onMouseOut={(e) => { if (!isActiveFolder) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  {folderData.icon} 
                  <span style={{ fontWeight: 500 }}>{folderName}</span>
                </div>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '32px', marginTop: '4px', gap: '2px' }}>
                    {folderData.subfolders.map(sub => {
                      const isActiveSub = currentFolder === folderName && currentSubfolder === sub;
                      return (
                        <div 
                          key={sub}
                          onClick={() => { setCurrentFolder(folderName); setCurrentSubfolder(sub); setSearchQuery(''); }}
                          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', background: isActiveSub ? 'var(--surface-badge)' : 'transparent', color: isActiveSub ? 'var(--primary)' : 'var(--text-muted)', transition: 'var(--transition)' }}
                          onMouseOver={(e) => { if (!isActiveSub) e.currentTarget.style.background = 'var(--surface-border)'; }}
                          onMouseOut={(e) => { if (!isActiveSub) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Folder size={14} /> {sub}
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
      <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        
        {/* TOP TOOLBAR */}
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            
            {/* Breadcrumbs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600 }}>
              <span onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }} style={{ cursor: 'pointer', color: 'var(--text-muted)', transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>Root</span>
              {currentFolder && (
                <>
                  <ChevronRight size={16} color="var(--text-muted)" />
                  <span onClick={() => setCurrentSubfolder(null)} style={{ cursor: 'pointer', color: documentStructure[currentFolder].color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {documentStructure[currentFolder].icon} {currentFolder}
                  </span>
                </>
              )}
              {currentSubfolder && (
                <>
                  <ChevronRight size={16} color="var(--text-muted)" />
                  <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Folder size={16} /> {currentSubfolder}
                  </span>
                </>
              )}
            </div>

            {/* View Mode & Global Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
               <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search files..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 16px 8px 36px', background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '20px', color: 'var(--text-main)', outline: 'none', fontSize: '0.9rem', width: '220px', transition: 'var(--transition)' }}
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
                <option value="All" style={{ background: 'var(--card-dark)' }}>All Languages</option>
                <option value="Khmer" style={{ background: 'var(--card-dark)' }}>Khmer</option>
                <option value="English" style={{ background: 'var(--card-dark)' }}>English</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={16} color="var(--text-muted)" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--surface-border)', borderRadius: '6px', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                <option value="name" style={{ background: 'var(--card-dark)' }}>Name (A-Z)</option>
                <option value="date" style={{ background: 'var(--card-dark)' }}>Date (Newest)</option>
                <option value="size" style={{ background: 'var(--card-dark)' }}>Size (Largest)</option>
                <option value="type" style={{ background: 'var(--card-dark)' }}>Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* FOLDERS / FILES DISPLAY */}
        <div style={{ flex: 1 }}>
          
          {/* Subfolders Grid if Category is selected without Subfolder */}
          {!searchQuery && currentFolder && !currentSubfolder && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Folders in {currentFolder}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {documentStructure[currentFolder].subfolders.map((subName) => {
                  const itemCount = docData.filter(d => d.category === currentFolder && d.subfolder === subName).length;
                  return (
                    <div 
                      key={subName}
                      onClick={() => setCurrentSubfolder(subName)}
                      className="glass-panel"
                      style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'var(--transition)' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glass)'; e.currentTarget.style.borderColor = documentStructure[currentFolder].color; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                    >
                      <Folder color={documentStructure[currentFolder].color} size={32} fill={`${documentStructure[currentFolder].color}22`} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>{subName}</h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{itemCount} files</span>
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
               <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Quick Access</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                  {Object.entries(documentStructure).map(([folderName, folderData]) => (
                    <div 
                      key={folderName}
                      onClick={() => { setCurrentFolder(folderName); toggleFolder(folderName); }}
                      className="glass-panel"
                      style={{ padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', transition: 'var(--transition)' }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${folderData.color}22`; e.currentTarget.style.borderColor = folderData.color; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-glass)'; e.currentTarget.style.borderColor = 'var(--surface-border)'; }}
                    >
                      <ModernFolderIcon size={64} color={folderData.color} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{folderName}</h4>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{folderData.subfolders.length} Subdirectories</span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Regular Files Section */}
          {((currentFolder && currentSubfolder) || searchQuery || (!searchQuery && !currentFolder)) && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-main)' }}>Files {searchQuery && `matching "${searchQuery}"`}</h3>
              
              {processedData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '16px', border: '1px dashed var(--surface-border)' }}>
                  <File size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
                  <p>No files found.</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {processedData.map((doc) => (
                    <div key={doc.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'var(--transition)', cursor: 'default' }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = doc.color || 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--surface-border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ background: `${doc.color || 'var(--primary)'}15`, padding: '12px', borderRadius: '12px', color: doc.color || 'var(--primary)' }}>
                          <FileText size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }} title={doc.title}>{doc.title}</h4>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            <span>{doc.size}</span>
                            <span>• {doc.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{doc.desc}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '12px', marginTop: 'auto' }}>
                        <span style={{ fontSize: '0.75rem', background: 'var(--surface-badge)', padding: '4px 8px', borderRadius: '6px', color: doc.lang === 'Khmer' ? '#00fa9a' : '#45f3ff', fontWeight: 500 }}>{doc.lang}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {doc.url ? (
                            <>
                              <a href={doc.url} target="_blank" rel="noreferrer" onClick={(e) => { if (!user) { e.preventDefault(); navigate('/login'); } }} style={{ padding: '8px 12px', background: 'var(--card-dark)', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, transition: 'var(--transition)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--card-dark)'; }}><Eye size={16} /> View</a>
                              <button disabled={downloadingId === doc.id} onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)} style={{ padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, border: 'none', cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer', transition: 'var(--transition)', opacity: downloadingId === doc.id ? 0.7 : 1 }} onMouseOver={(e) => { if(downloadingId !== doc.id) e.currentTarget.style.filter = 'brightness(1.1)' }} onMouseOut={(e) => { if(downloadingId !== doc.id) e.currentTarget.style.filter = 'brightness(1)' }}>{downloadingId === doc.id ? <><Loader2 size={16} className="spin" /> Downloading...</> : <><Download size={16} /> Download</>}</button>
                            </>
                          ) : (
                            <>
                              <button onClick={(e) => { if (!user) navigate('/login'); }} style={{ padding: '8px 12px', background: 'var(--card-dark)', borderRadius: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--card-dark)'; }}><Eye size={16} /> View</button>
                              <button onClick={(e) => { if (!user) navigate('/login'); }} style={{ padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}><Download size={16} /> Download</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <th style={{ padding: '16px', fontWeight: 500 }}>Name</th>
                        <th style={{ padding: '16px', fontWeight: 500 }}>Location</th>
                        <th style={{ padding: '16px', fontWeight: 500 }}>Language</th>
                        <th style={{ padding: '16px', fontWeight: 500 }}>Size</th>
                        <th style={{ padding: '16px', fontWeight: 500 }}>Date</th>
                        <th style={{ padding: '16px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedData.map((doc, idx) => (
                        <tr key={doc.id} style={{ borderBottom: idx === processedData.length - 1 ? 'none' : '1px solid var(--surface-border)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-badge)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={18} color={doc.color || 'var(--primary)'} />
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{doc.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.type}</div>
                            </div>
                          </td>
                          <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{doc.category}/{doc.subfolder}</td>
                          <td style={{ padding: '16px' }}><span style={{ fontSize: '0.75rem', background: 'var(--surface-badge)', padding: '4px 8px', borderRadius: '6px', color: doc.lang === 'Khmer' ? '#00fa9a' : '#45f3ff', fontWeight: 500 }}>{doc.lang}</span></td>
                          <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{doc.size}</td>
                          <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{doc.date}</td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              {doc.url ? (
                                <>
                                  <a href={doc.url} target="_blank" rel="noreferrer" onClick={(e) => { if (!user) { e.preventDefault(); navigate('/login'); } }} style={{ padding: '8px 12px', background: 'var(--card-dark)', borderRadius: '8px', color: 'var(--text-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, transition: 'var(--transition)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--card-dark)'; }}><Eye size={16} /> View</a>
                                  <button disabled={downloadingId === doc.id} onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)} style={{ padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, border: 'none', cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer', transition: 'var(--transition)', opacity: downloadingId === doc.id ? 0.7 : 1 }} onMouseOver={(e) => { if(downloadingId !== doc.id) e.currentTarget.style.filter = 'brightness(1.1)' }} onMouseOut={(e) => { if(downloadingId !== doc.id) e.currentTarget.style.filter = 'brightness(1)' }}>{downloadingId === doc.id ? <><Loader2 size={16} className="spin" /> Downloading...</> : <><Download size={16} /> Download</>}</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={(e) => { if (!user) navigate('/login'); }} style={{ padding: '8px 12px', background: 'var(--card-dark)', borderRadius: '8px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface)'; }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.background = 'var(--card-dark)'; }}><Eye size={16} /> View</button>
                                  <button onClick={(e) => { if (!user) navigate('/login'); }} style={{ padding: '8px 12px', background: 'var(--primary)', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}><Download size={16} /> Download</button>
                                </>
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
