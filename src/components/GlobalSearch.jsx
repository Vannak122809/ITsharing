import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Terminal, FileText, DownloadCloud } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  // Press Cmd+K or Ctrl+K to open search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simple mock search simulation
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const lcQuery = query.toLowerCase();
    
    // We mock search some terms that route appropriately
    const fakeMatches = [];
    if ('windows 11 iso'.includes(lcQuery) || lcQuery.includes('win')) {
      fakeMatches.push({ title: 'Windows 11 ISO', type: 'software', url: '/software/win11', icon: <DownloadCloud size={16} /> });
    }
    if ('microsoft office 2021'.includes(lcQuery) || lcQuery.includes('office')) {
      fakeMatches.push({ title: 'Microsoft Office 2021', type: 'software', url: '/software/office-win', icon: <DownloadCloud size={16} /> });
      fakeMatches.push({ title: 'Office LTSC Pro Plus 2024', type: 'software', url: '/software', icon: <DownloadCloud size={16} /> });
    }
    if ('network setup ccna'.includes(lcQuery) || lcQuery.includes('network') || lcQuery.includes('ccna')) {
      fakeMatches.push({ title: 'Network Setup CCNA', type: 'document', url: '/documents', icon: <FileText size={16} /> });
      fakeMatches.push({ title: 'CCNA1: Explorer Network', type: 'document', url: '/documents', icon: <FileText size={16} /> });
    }
    if ('python data structures'.includes(lcQuery) || lcQuery.includes('python')) {
      fakeMatches.push({ title: 'Python', type: 'software', url: '/software', icon: <Terminal size={16} /> });
      fakeMatches.push({ title: 'Python Data Structures', type: 'document', url: '/documents', icon: <FileText size={16} /> });
    }

    // Default fallback matches if typing anything else
    if (fakeMatches.length === 0 && query.length > 2) {
      fakeMatches.push({ title: `Search Documents for "${query}"`, type: 'document', url: '/documents', icon: <SearchIcon size={16} /> });
      fakeMatches.push({ title: `Search Software for "${query}"`, type: 'software', url: '/software', icon: <SearchIcon size={16} /> });
    }

    setResults(fakeMatches);
  }, [query]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn btn-outline" 
        style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--surface-border)', opacity: 0.8 }}
      >
        <SearchIcon size={16} />
        <span style={{ fontSize: '0.85rem' }}>Search...</span>
        <span style={{ fontSize: '0.7rem', background: 'var(--card-dark)', padding: '2px 6px', borderRadius: '4px' }}>⌘K</span>
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '10vh', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'var(--surface)', width: '90%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--primary)', display: 'flex', flexDirection: 'column', maxHeight: '70vh', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--surface-border)' }}>
              <SearchIcon size={20} color="var(--primary)" />
              <input 
                autoFocus
                type="text" 
                placeholder="What are you looking for?" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', outline: 'none', padding: '0 16px' }}
              />
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {results.length > 0 ? (
                results.map((res, i) => (
                  <Link 
                    key={i} 
                    to={res.url} 
                    onClick={() => setIsOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-main)', textDecoration: 'none', borderRadius: '8px', transition: 'background 0.2s', marginBottom: '4px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(69, 243, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ color: res.type === 'software' ? 'var(--primary)' : '#00fa9a' }}>
                      {res.icon}
                    </div>
                    <span style={{ flex: 1 }}>{res.title}</span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--surface-badge)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>
                      {res.type}
                    </span>
                  </Link>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  {query ? 'No matching resources found.' : 'Type to start searching...'}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
