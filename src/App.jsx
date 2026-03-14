import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Video, FileText, BookOpen, Layers, User, LogOut, DownloadCloud, Sun, Moon } from 'lucide-react';

import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Home from './pages/Home';
import Courses from './pages/Courses';
import Documents from './pages/Documents';
import Experiences from './pages/Experiences';
import Login from './pages/Login';
import Software from './pages/Software';
import SoftwareViewer from './pages/SoftwareViewer';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <Terminal size={18} /> },
    { name: 'Courses', path: '/courses', icon: <Video size={18} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={18} /> },
    { name: 'Experiences', path: '/experiences', icon: <BookOpen size={18} /> },
    { name: 'Software', path: '/software', icon: <DownloadCloud size={18} /> },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="container nav-container">
          <Link to="/" className="logo">
            <Layers color="var(--primary)" size={28} />
            IT<span className="text-gradient">Share</span>
          </Link>
          <div className="nav-links">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-link ${location.pathname.startsWith(item.path) && item.path !== '/' ? 'active' : location.pathname === item.path ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn btn-outline"
              style={{ padding: '6px 12px', border: 'none' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <User size={16} color="var(--primary)" />
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>
                    {user.email}
                  </span>
                </div>
                <button onClick={handleSignOut} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Sign Out">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/software" element={<Software />} />
          <Route path="/software/:id" element={<SoftwareViewer />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      
      <footer style={{ marginTop: '100px', padding: '40px 0', borderTop: '1px solid var(--surface-border)', textAlign: 'center', background: 'var(--nav-bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} ITShare. Built for the tech community.</p>
      </footer>
    </>
  );
}

export default App;
