import React, { useState, useMemo } from 'react';
import { Download, FileText, Share2, Globe, Filter, Eye, Folder, ChevronRight, ArrowLeft, Cloud, Network, Terminal, Database, ShieldCheck, ArrowUpDown } from 'lucide-react';

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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState('All');
  const [sortBy, setSortBy] = useState('name'); // name, date, size, type

  // Convert sizes like '1.2 MB' or '400 KB' to KB for sorting
  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0;
    const value = parseFloat(sizeStr.split(' ')[0]) || 0;
    if (sizeStr.includes('MB')) return value * 1024;
    if (sizeStr.includes('GB')) return value * 1024 * 1024;
    return value; // KB
  };

  const docData = [
    { id: 1, title: 'K8s Setup Guide', category: 'Cloud', subfolder: 'AWS', lang: 'English', size: '420 KB', date: '2025-10-14', type: 'PDF', desc: 'YAML files and cluster setup docs.', color: '#45f3ff' },
    { id: 2, title: 'Design Patterns Java', category: 'Programming', subfolder: 'Java', lang: 'English', size: '1.2 MB', date: '2024-05-20', type: 'PDF', desc: 'Gang of four simplified in modern Java.', color: 'var(--primary)' },
    { id: 3, title: 'Network Setup CCNA', category: 'Network', subfolder: 'Cisco', lang: 'Khmer', size: '2.5 MB', date: '2025-11-01', type: 'DOCX', desc: 'Cisco networking concepts explained in Khmer.', color: '#00fa9a' },
    { id: 4, title: 'SQL Performance Tuning', category: 'Database', subfolder: 'Postgresql', lang: 'English', size: '800 KB', date: '2025-08-11', type: 'PDF', desc: 'Optimizing complex Postgres queries and indexing.', color: '#ff9900' },
    { id: 5, title: 'Basic Security Principles', category: 'Security', subfolder: 'Firewall', lang: 'Khmer', size: '1.5 MB', date: '2025-12-05', type: 'PDF', desc: 'Introduction to cybersecurity for beginners in Khmer.', color: '#ff2a7a' },
    { id: 6, title: 'Python Data Structures', category: 'Programming', subfolder: 'Python', lang: 'Khmer', size: '3.1 MB', date: '2025-09-22', type: 'PPTX', desc: 'Deep dive into Python arrays, dictionaries, and sets.', color: 'var(--primary)' },
    { id: 7, title: 'Example PDF Document', category: 'Programming', subfolder: 'HTML', lang: 'English', size: '12 KB', date: '2025-01-10', type: 'PDF', desc: 'A sample PDF document uploaded directly to Cloudflare R2.', color: 'var(--primary)', url: 'https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/example-1773817512924.pdf' },
    { id: 8, title: 'CCNA1: Explorer Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.75 MB', date: '2026-01-15', type: 'PDF', desc: 'Chapters 1,2 - Explorer Network & Configure NOS', color: '#00fa9a', url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter1,2 - Explorer Network & Configure NOS.pdf')}` },
    { id: 9, title: 'CCNA1: Network Protocol', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.73 MB', date: '2026-01-16', type: 'PDF', desc: 'Chapters 3,4,5 - Network Protocol, Access, Ethernet', color: '#00fa9a', url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter3,4,5 - Network Protocol, Access, Ethernet.pdf')}` },
    { id: 10, title: 'CCNA1: Network Layer & IP', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.74 MB', date: '2026-01-17', type: 'PDF', desc: 'Chapters 6,7,8 - Network Layer, IP Address, Subnet', color: '#00fa9a', url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter6,7,8 - Network Layer, IP Address, Subnet.pdf')}` },
    { id: 11, title: 'CCNA1: Build Network', category: 'Network', subfolder: 'Cisco', lang: 'English', size: '2.72 MB', date: '2026-01-18', type: 'PDF', desc: 'Chapters 9,10,11 - Transport, Application, Build Network', color: '#00fa9a', url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter9,10,11 - Transport, Application, Build Network.pdf')}` }
  ];

  const processedData = useMemo(() => {
    let result = docData;

    // Filter by Folder/Subfolder (only if not globally searching)
    if (!searchQuery) {
      if (currentFolder) {
        result = result.filter(doc => doc.category === currentFolder);
      }
      if (currentSubfolder) {
        result = result.filter(doc => doc.subfolder === currentSubfolder);
      }
    } else {
      // Global search overrides folder view
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doc.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.subfolder.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by Language
    if (activeLang !== 'All') {
      result = result.filter(doc => doc.lang === activeLang);
    }

    // Sort Data
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date); // newest first
      if (sortBy === 'size') return parseSize(b.size) - parseSize(a.size); // largest first
      if (sortBy === 'type') return a.type.localeCompare(b.type);
      return 0;
    });

    return result;
  }, [currentFolder, currentSubfolder, searchQuery, activeLang, sortBy]);

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', paddingBottom: '80px' }}>
      
      {/* HEADER & GLOBAL TOOLS */}
      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Documents Hub</h1>
          <p style={{ color: 'var(--text-muted)' }}>Browse tutorials, configurations, and books structured by tech domains.</p>
        </div>

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <input 
            type="text" 
            placeholder="Search documents anywhere..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1 1 300px', padding: '12px 16px', background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '12px', color: 'var(--text-main)', outline: 'none' }}
          />

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--text-muted)" />
              <select 
                value={activeLang} 
                onChange={(e) => setActiveLang(e.target.value)}
                style={{ padding: '10px 16px', background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="All">All Languages 🌐</option>
                <option value="Khmer">Khmer 🇰🇭</option>
                <option value="English">English 🇺🇸</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={18} color="var(--text-muted)" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '10px 16px', background: 'var(--card-dark)', border: '1px solid var(--surface-border)', borderRadius: '8px', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}
              >
                <option value="name">Sort by Name (A-Z)</option>
                <option value="date">Sort by Date (Newest)</option>
                <option value="size">Sort by Size (Largest)</option>
                <option value="type">Sort by Type (Ext)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BREADCRUMBS */}
      {!searchQuery && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', fontSize: '1.1rem', fontWeight: 500 }}>
          <span 
            onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); }}
            style={{ color: currentFolder ? 'var(--text-muted)' : 'var(--primary)', cursor: 'pointer', transition: 'var(--transition)' }}
          >
            Root
          </span>
          
          {currentFolder && (
            <>
              <ChevronRight size={18} color="var(--text-muted)" />
              <span 
                onClick={() => setCurrentSubfolder(null)}
                style={{ color: currentSubfolder ? 'var(--text-muted)' : documentStructure[currentFolder].color, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {documentStructure[currentFolder].icon} {currentFolder}
              </span>
            </>
          )}

          {currentSubfolder && (
            <>
              <ChevronRight size={18} color="var(--text-muted)" />
              <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Folder size={18} /> {currentSubfolder}
              </span>
            </>
          )}

          {(currentFolder || currentSubfolder) && (
            <button 
              onClick={() => { if (currentSubfolder) setCurrentSubfolder(null); else setCurrentFolder(null); }}
              className="btn btn-outline" 
              style={{ padding: '4px 12px', fontSize: '0.8rem', marginLeft: 'auto', border: 'none' }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
        </div>
      )}

      {/* FOLDERS VIEW (Only show if not searching globally and no subfolder selected) */}
      {!searchQuery && !currentSubfolder && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          
          {/* Level 1: Main Categories */}
          {!currentFolder && Object.entries(documentStructure).map(([folderName, folderData]) => (
            <div 
              key={folderName} 
              onClick={() => setCurrentFolder(folderName)}
              className="glass-panel"
              style={{ padding: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'var(--transition)', borderLeft: `4px solid ${folderData.color}` }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${folderData.color}33`; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-glass)'; }}
            >
              <ModernFolderIcon size={48} color={folderData.color} />
              <div style={{flex: 1}}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{folderName}</h3>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{folderData.subfolders.length} subfolders</span>
              </div>
              <ChevronRight color="var(--text-muted)" />
            </div>
          ))}

          {/* Level 2: Subfolders */}
          {currentFolder && documentStructure[currentFolder].subfolders.map((subName) => {
            const itemCount = docData.filter(d => d.category === currentFolder && d.subfolder === subName).length;
            return (
              <div 
                key={subName} 
                onClick={() => setCurrentSubfolder(subName)}
                className="glass-panel"
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: 'var(--transition)' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-badge)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
              >
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                  <Folder color={documentStructure[currentFolder].color} size={28} />
                </div>
                <div style={{flex: 1}}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>{subName}</h4>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{itemCount} files</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILES GRID VIEW */}
      {((currentFolder && currentSubfolder) || searchQuery || (!searchQuery && !currentFolder && processedData.length === 0)) && (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {processedData.map((doc) => (
            <div key={doc.id} className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'var(--surface-badge)', padding: '14px', borderRadius: '12px', color: doc.color || 'var(--primary)' }}>
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', lineHeight: 1.2, wordBreak: 'break-word' }}>
                      {doc.title}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{doc.size}</span>
                      <span style={{ fontSize: '0.7rem', background: 'var(--card-dark)', padding: '2px 8px', borderRadius: '10px', color: doc.lang === 'Khmer' ? '#00fa9a' : '#45f3ff' }}>
                        {doc.lang}
                      </span>
                      {doc.type && (
                        <span style={{ fontSize: '0.7rem', border: '1px solid var(--surface-border)', padding: '1px 6px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                          {doc.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', flexGrow: 1, borderTop: '1px dashed var(--surface-border)', paddingTop: '16px' }}>{doc.desc}</p>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Folder size={12} /> {doc.category} / {doc.subfolder}</span>
                <span style={{ marginLeft: 'auto' }}>{doc.date}</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                {doc.url ? (
                  <>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}><Eye size={16} /> View</a>
                    <a href={doc.url} download target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}><Download size={16} /></a>
                  </>
                ) : (
                  <>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Share2 size={16} /> Share</button>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Download size={16} /> Download</button>
                  </>
                )}
              </div>
            </div>
          ))}

          {processedData.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 40px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
              <Filter size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
              <h3>No documents found</h3>
              <p>No files match your current filters or folder selection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Documents;
