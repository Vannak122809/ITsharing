import React, { useState } from 'react';
import { Download, FileText, Share2, Globe, Filter } from 'lucide-react';

const Documents = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeLang, setActiveLang] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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
        <h1 className="text-gradient">Tech Resource Library</h1>
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
                <div style={{ background: 'var(--surface-badge)', padding: '16px', borderRadius: '12px' }}>
                  <FileText size={32} color={doc.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{doc.title}</h3>
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
              <button className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Share2 size={16} /> Share</button>
              <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Download size={16} /> Download</button>
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
