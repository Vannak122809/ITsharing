import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, Video, FileText, BookOpen, Layers, User, LogOut, DownloadCloud, Sun, Moon, Users, HelpCircle, Menu, X } from 'lucide-react';

import { auth } from './firebase';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { syncUserToFirestore } from './userService';

import Home from './pages/Home';
import Courses from './pages/Courses';
import Documents from './pages/Documents';
import Experiences from './pages/Experiences';
import Login from './pages/Login';
import Software from './pages/Software';
import SoftwareViewer from './pages/SoftwareViewer';
import Community from './pages/Community';
import RequestResource from './pages/RequestResource';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import GlobalSearch from './components/GlobalSearch';
import ProtectedRoute from './components/ProtectedRoute';
import CoffeeDonate from './components/CoffeeDonate';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Firestore profile data
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showMore, setShowMore] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Check if user is logged in
  const isLoggedIn = !!user;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await syncUserToFirestore(currentUser);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Apply guest-mode if user is not logged in and not on the login page
    if (!isLoggedIn && location.pathname !== '/login') {
      document.body.classList.add('guest-mode');
    } else {
      document.body.classList.remove('guest-mode');
    }
  }, [isLoggedIn, location.pathname]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  const mainNavItems = isLoggedIn ? [
    { name: 'Software', path: '/software', icon: <DownloadCloud size={18} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={18} /> },
    { name: 'Courses', path: '/courses', icon: <Video size={18} /> },
    { name: 'Forum', path: '/community', icon: <Users size={18} /> },
  ] : [
    { name: 'Software', path: '/software', icon: <DownloadCloud size={18} /> },
    { name: 'Documents', path: '/documents', icon: <FileText size={18} /> },
    { name: 'Courses', path: '/courses', icon: <Video size={18} /> },
  ];

  const moreNavItems = isLoggedIn ? [
    { name: 'Experiences', path: '/experiences', icon: <BookOpen size={18} /> },
    { name: 'Request', path: '/request', icon: <HelpCircle size={18} /> },
  ] : [
    { name: 'Experiences', path: '/experiences', icon: <BookOpen size={18} /> },
  ];

  const allNavItems = [...mainNavItems, ...moreNavItems];

  const isActive = (path) =>
    path !== '/' && location.pathname.startsWith(path) ? 'active' : location.pathname === path ? 'active' : '';

  return (
    <>
      {/* ─── NAVBAR ─── */}
      <nav className="navbar">
        <div className="container nav-container">
          <Link to="/" className="logo">
            <Layers color="var(--primary)" size={28} />
            IT<span className="text-gradient">Share</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-links">
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path)}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}

            <div
              className="nav-link"
              style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0' }}
              onMouseEnter={() => setShowMore(true)}
              onMouseLeave={() => setShowMore(false)}
            >
              <Layers size={16} /> More ▾

              {showMore && (
                <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: '0', minWidth: '180px', display: 'flex', flexDirection: 'column', padding: '8px', zIndex: 1000, marginTop: '-8px' }}>
                  {moreNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: 'var(--text-main)', textDecoration: 'none', borderRadius: '8px', transition: 'var(--transition)' }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-badge)'; e.currentTarget.style.color = 'var(--primary)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-main)'; }}
                    >
                      {item.icon} {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop actions */}
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <GlobalSearch />
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
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="avatar"
                      style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                  ) : (
                    <User size={16} color="var(--primary)" />
                  )}
                  <span className="nav-user-email" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={userProfile?.nickname || user.email}>
                    {userProfile?.nickname || user.email}
                  </span>
                </Link>
                <button onClick={handleSignOut} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Sign Out">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                Sign In
              </Link>
            )}

            {/* Hamburger button (mobile only) */}
            <button
              className={`nav-hamburger ${drawerOpen ? 'open' : ''}`}
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label="Toggle mobile menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── VERIFICATION OVERLAY ─── */}
      {user && !user.emailVerified && location.pathname !== '/login' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'var(--bg-main)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(232, 143, 21, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <HelpCircle size={40} color="#e88f15" />
            </div>
            <h1 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Verify Your Email</h1>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>
              Your account is almost ready! We've sent a verification link to <strong>{user.email}</strong>. 
              Please verify your email to unlock all features.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={async () => {
                  try {
                    await sendEmailVerification(user);
                    alert("Verification link resent! Check your inbox.");
                  } catch (e) { alert("Error resending email. Please try again later."); }
                }}
                className="btn btn-primary" style={{ width: '100%' }}
              >
                Resend Verification Email
              </button>
              <button onClick={handleSignOut} className="btn btn-outline" style={{ width: '100%' }}>
                <LogOut size={16} /> Sign Out & Try Again
              </button>
            </div>
            <p style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already verified? <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Refresh page</button>
            </p>
          </div>
        </div>
      )}

      {/* ─── MOBILE DRAWER ─── */}
      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`}>
        {/* Click overlay to close */}
        <div className="nav-drawer-overlay" onClick={() => setDrawerOpen(false)} />
        <div className="nav-drawer-panel">
          <Link to="/" className="drawer-logo">
            <Layers color="var(--primary)" size={22} />
            IT<span className="text-gradient">Share</span>
          </Link>

          {allNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`drawer-nav-link ${isActive(item.path)}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}

          <div className="drawer-divider" />

          <div className="drawer-actions">
            <button
              onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); }}
              className="btn btn-outline"
              style={{ justifyContent: 'center', gap: '8px' }}
            >
              {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
            </button>

            {user ? (
              <>
                <div className="drawer-nav-link" style={{ background: 'var(--surface-badge)', borderRadius: '12px' }}>
                  <User size={16} color="var(--primary)" />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {userProfile?.nickname || user.email}
                  </span>
                </div>
                <button onClick={handleSignOut} className="btn btn-outline" style={{ justifyContent: 'center', gap: '8px' }}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/software" element={<Software />} />
          <Route path="/software/:id" element={<SoftwareViewer />} />
          <Route path="/community" element={<Community />} />
          <Route path="/request" element={<RequestResource />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile user={user} />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      <footer style={{ marginTop: '100px', padding: '40px 0', borderTop: '1px solid var(--surface-border)', textAlign: 'center', background: 'var(--nav-bg)' }}>
        <p style={{ color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} ITShare. Built for the tech community.</p>
      </footer>

      {/* Coffee Donate Floating Icon */}
      <CoffeeDonate />
    </>
  );
}

export default App;


