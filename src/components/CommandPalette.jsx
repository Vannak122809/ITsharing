import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Video, DownloadCloud, BookOpen, X, Command } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Global keyboard listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => setIsOpen(false);

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };

  // Mock static data for global search. 
  // In a real scenario, this could hit an API or Firestore index.
  const allRoutes = [
    { name: t('software'), path: '/software', icon: <DownloadCloud size={18} /> },
    { name: t('documents'), path: '/documents', icon: <FileText size={18} /> },
    { name: t('courses'), path: '/courses', icon: <Video size={18} /> },
    { name: t('experiences'), path: '/experiences', icon: <BookOpen size={18} /> }
  ];

  const filteredRoutes = allRoutes.filter(route => 
    route.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="cmd-overlay" onClick={handleClose}>
      <div className="cmd-palette glass-panel" onClick={e => e.stopPropagation()}>
        <div className="cmd-header">
          <Search size={20} color="var(--text-muted)" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search resources, courses, software..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="cmd-input"
          />
          <button className="cmd-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="cmd-body">
          {query.length > 0 && filteredRoutes.length === 0 ? (
            <div className="cmd-empty">No results found for "{query}"</div>
          ) : (
            <div className="cmd-results">
              <div className="cmd-section-title">Quick Links</div>
              {filteredRoutes.map((route, idx) => (
                <button 
                  key={idx} 
                  className="cmd-item"
                  onClick={() => handleNavigate(route.path)}
                >
                  {route.icon}
                  <span>{route.name}</span>
                  <Command size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="cmd-footer">
          <span className="cmd-kbd"><Command size={12}/> K</span> to search
          <span className="cmd-kbd" style={{ marginLeft: '12px' }}>ESC</span> to close
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
