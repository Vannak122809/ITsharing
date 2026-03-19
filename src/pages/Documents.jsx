import React, { useState } from 'react';
import { Download, FileText, Share2, Globe, Filter, Eye, Cloud, Network, Terminal, Database, ShieldCheck } from 'lucide-react';

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLang, setActiveLang] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryIcon = (category, color) => {
    switch(category) {
      case 'Cloud': return <Cloud size={32} color={color} />;
      case 'Network': return <Network size={32} color={color} />;
      case 'Program': return <Terminal size={32} color={color} />;
      case 'Database': return <Database size={32} color={color} />;
      case 'Security': return <ShieldCheck size={32} color={color} />;
      default: return <FileText size={32} color={color} />;
    }
  };

  const categories = ['All', 'Network', 'Program', 'Database', 'Security', 'Cloud'];
  const languages = ['All', 'English', 'Khmer'];

  const docData = [
    {
      id: 1,
      title: 'K8s Setup Guide',
      category: 'Cloud',
      lang: 'English',
      size: '420 KB',
      desc: 'YAML files and cluster setup docs.',
      color: 'var(--primary)',
    },
    {
      id: 2,
      title: 'Design Patterns Java',
      category: 'Program',
      lang: 'English',
      size: '1.2 MB',
      desc: 'Gang of four simplified in modern Java.',
      color: '#ff2a7a',
    },
    {
      id: 3,
      title: 'Network Setup CCNA',
      category: 'Network',
      lang: 'Khmer',
      size: '2.5 MB',
      desc: 'Cisco networking concepts explained in Khmer.',
      color: '#00fa9a',
    },
    {
      id: 4,
      title: 'SQL Performance Tuning',
      category: 'Database',
      lang: 'English',
      size: '800 KB',
      desc: 'Optimizing complex Postgres queries and indexing.',
      color: '#ff9900',
    },
    {
      id: 5,
      title: 'Basic Security Principles',
      category: 'Security',
      lang: 'Khmer',
      size: '1.5 MB',
      desc: 'Introduction to cybersecurity for beginners in Khmer.',
      color: '#ff2a7a',
    },
    {
      id: 6,
      title: 'Python Data Structures',
      category: 'Program',
      lang: 'Khmer',
      size: '3.1 MB',
      desc: 'Deep dive into Python arrays, dictionaries, and sets.',
      color: 'var(--primary)',
    },
    {
      id: 7,
      title: 'Example PDF Document',
      category: 'Program',
      lang: 'English',
      size: '12 KB',
      desc: 'A sample PDF document uploaded directly to Cloudflare R2.',
      color: '#ff2a7a',
      url: 'https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/example-1773817512924.pdf'
    },
    {
      id: 8,
      title: 'CCNA1: Explorer Network',
      category: 'Network',
      lang: 'English',
      size: '2.75 MB',
      desc: 'Chapters 1,2 - Explorer Network & Configure NOS',
      color: '#00fa9a',
      url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter1,2 - Explorer Network & Configure NOS.pdf')}`
    },
    {
      id: 9,
      title: 'CCNA1: Network Protocol',
      category: 'Network',
      lang: 'English',
      size: '2.73 MB',
      desc: 'Chapters 3,4,5 - Network Protocol, Access, Ethernet',
      color: '#00fa9a',
      url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter3,4,5 - Network Protocol, Access, Ethernet.pdf')}`
    },
    {
      id: 10,
      title: 'CCNA1: Network Layer & IP',
      category: 'Network',
      lang: 'English',
      size: '2.74 MB',
      desc: 'Chapters 6,7,8 - Network Layer, IP Address, Subnet',
      color: '#00fa9a',
      url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter6,7,8 - Network Layer, IP Address, Subnet.pdf')}`
    },
    {
      id: 11,
      title: 'CCNA1: Build Network',
      category: 'Network',
      lang: 'English',
      size: '2.72 MB',
      desc: 'Chapters 9,10,11 - Transport, Application, Build Network',
      color: '#00fa9a',
      url: `https://pub-6cc8bfdf378b409aaa8b139265103fc2.r2.dev/documents/${encodeURIComponent('CCNA1-Chapter9,10,11 - Transport, Application, Build Network.pdf')}`
    }
  ];

  const filteredDocs = docData.filter(doc => 
    (activeCategory === 'All' || doc.category === activeCategory) &&
    (activeLang === 'All' || doc.lang === activeLang) &&
    (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-animated-cyber">Tech Resource Library</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Downloadable cheat sheets, architectural diagrams, PDF notes, and configuration templates in both English and Khmer.
        </p>
        <div style={{ marginTop: '32px', maxWidth: '500px', margin: '32px auto 0' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search for documents (e.g. 'Network', 'Java')..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '8px' }}>Category:</span>
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`btn ${activeCategory === category ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                {category}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '8px' }}>Language:</span>
            {languages.map(lang => (
              <button 
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`btn ${activeLang === lang ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                {lang}
              </button>
            ))}
          </div>
          
        </div>
      </header>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'var(--surface-badge)', padding: '16px', borderRadius: '12px', transition: 'all 0.3s ease', transform: 'scale(1)' }} 
                     onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 0 20px ${doc.color}33`; }} 
                     onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {getCategoryIcon(doc.category, doc.color)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {doc.title}
                    {doc.id >= 8 && <span style={{ fontSize: '0.65rem', background: 'linear-gradient(45deg, #ff2a7a, #ff9900)', color: 'white', padding: '2px 6px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>NEW</span>}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{doc.size}</span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--card-dark)', padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: doc.lang === 'Khmer' ? '#00fa9a' : '#45f3ff' }}>
                      <Globe size={12} /> {doc.lang}
                    </span>
                  </div>
                </div>
              </div>
              
              <span style={{ fontSize: '0.75rem', border: `1px solid ${doc.color}`, padding: '4px 10px', borderRadius: '12px', color: doc.color, opacity: 0.8 }}>
                {doc.category}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px', flexGrow: 1 }}>{doc.desc}</p>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              {doc.url ? (
                <>
                  <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}><Eye size={16} /> View</a>
                  <a href={doc.url} download target="_blank" rel="noreferrer" className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none' }}><Download size={16} /> Download</a>
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

        {filteredDocs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 40px', color: 'var(--text-muted)' }}>
            <Filter size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
            <h3>No documents found</h3>
            <p>Try adjusting your category, language, or search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Documents;
