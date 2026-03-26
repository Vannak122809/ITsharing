import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  LogIn, UserPlus, AlertCircle, Eye, EyeOff,
  Mail, Lock, ArrowLeft, CheckCircle, Ghost,
} from 'lucide-react';

const googleProvider = new GoogleAuthProvider();

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ── Styles shared ──────────────────────────────────────────────────
const iconInputStyle = {
  width: '100%',
  paddingLeft: '42px',
  paddingRight: '44px',
};

const iconInputNoEyeStyle = {
  width: '100%',
  paddingLeft: '42px',
  paddingRight: '16px',
};

const iconWrapStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const leftIconStyle = {
  position: 'absolute',
  left: '14px',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
  zIndex: 1,
};

const eyeBtnStyle = {
  position: 'absolute',
  right: '14px',
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  display: 'flex',
  padding: 0,
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '0.85rem',
  fontWeight: 500,
  color: 'var(--text-muted)',
};

const Login = () => {
  const navigate = useNavigate();

  // view: 'login' | 'signup' | 'forgot'
  const [view, setView]                   = useState('login');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [rememberMe, setRememberMe]       = useState(false);
  const [showPwd, setShowPwd]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [loading, setLoading]             = useState(false);

  // Pre-fill remembered email
  useEffect(() => {
    const saved = localStorage.getItem('itshare_remembered_email');
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  const switchView = (v) => {
    setError(''); setSuccess('');
    setPassword(''); setConfirm('');
    setView(v);
  };

  const friendlyError = (code) => ({
    'auth/invalid-email':       'Invalid email format.',
    'auth/user-not-found':      'No account found with this email.',
    'auth/wrong-password':      'Incorrect password.',
    'auth/invalid-credential':  'Incorrect email or password.',
    'auth/email-already-in-use':'This email is already registered.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/popup-closed-by-user':'Google sign-in was cancelled.',
    'auth/too-many-requests':   'Too many attempts. Please try again later.',
  }[code] || 'Something went wrong. Please try again.');

  // ── Handlers ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) localStorage.setItem('itshare_remembered_email', email);
      else localStorage.removeItem('itshare_remembered_email');
      navigate('/');
    } catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Reset link sent! Check your email inbox.');
    } catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); navigate('/'); }
    catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setError(''); setLoading(true);
    try { await signInAnonymously(auth); navigate('/'); }
    catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  // ── Password strength ──────────────────────────────────────────────
  const strengthColor = password.length >= 8 ? '#00c97d' : password.length >= 6 ? '#f59e0b' : '#ff2a7a';
  const strengthText  = password.length >= 8 ? '✓ Strong password'
    : password.length >= 6 ? '⚠ Acceptable — try making it longer'
    : '✗ Too short (min 6 characters)';

  // ── Shared UI pieces ──────────────────────────────────────────────
  const Divider = () => (
    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
      <div style={{ flex:1, height:'1px', background:'var(--surface-border)' }} />
      <span style={{ color:'var(--text-muted)', fontSize:'0.8rem', fontWeight:500 }}>OR</span>
      <div style={{ flex:1, height:'1px', background:'var(--surface-border)' }} />
    </div>
  );

  const GoogleBtn = ({ label }) => (
    <button type="button" onClick={handleGoogle} disabled={loading}
      className="btn btn-outline"
      style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
      <GoogleIcon /> {label}
    </button>
  );

  const SwitchRow = ({ text, action, label }) => (
    <p style={{ textAlign:'center', fontSize:'0.88rem', color:'var(--text-muted)', marginTop:'4px' }}>
      {text}{' '}
      <button type="button" onClick={() => switchView(action)}
        style={{ background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'inherit' }}>
        {label}
      </button>
    </p>
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 16px 40px' }}>
      <div className="glass-panel" style={{ width:'100%', maxWidth:'420px', padding:'40px 36px', borderRadius:'24px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          {view !== 'login' && (
            <button onClick={() => switchView('login')}
              style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'0.85rem', marginBottom:'16px' }}>
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          )}
          <h1 className="text-gradient" style={{ fontSize:'2rem', marginBottom:'6px' }}>
            {view === 'login'  && 'Welcome Back'}
            {view === 'signup' && 'Create Account'}
            {view === 'forgot' && 'Reset Password'}
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>
            {view === 'login'  && 'Sign in to access resources'}
            {view === 'signup' && 'Join the IT community today'}
            {view === 'forgot' && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ background:'rgba(255,42,122,0.1)', border:'1px solid rgba(255,42,122,0.4)', padding:'12px 16px', borderRadius:'12px', color:'#ff2a7a', display:'flex', alignItems:'center', gap:'10px', fontSize:'0.88rem', marginBottom:'20px' }}>
            <AlertCircle size={16} style={{ flexShrink:0 }} /> {error}
          </div>
        )}
        {success && (
          <div style={{ background:'rgba(0,250,154,0.1)', border:'1px solid rgba(0,250,154,0.4)', padding:'12px 16px', borderRadius:'12px', color:'#00c97d', display:'flex', alignItems:'center', gap:'10px', fontSize:'0.88rem', marginBottom:'20px' }}>
            <CheckCircle size={16} style={{ flexShrink:0 }} /> {success}
          </div>
        )}

        {/* ════ LOGIN ════ */}
        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            <div>
              <label htmlFor="l-email" style={labelStyle}>Email Address</label>
              <div style={iconWrapStyle}>
                <Mail size={16} style={leftIconStyle} />
                <input
                  id="l-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={iconInputNoEyeStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="l-password" style={labelStyle}>Password</label>
              <div style={iconWrapStyle}>
                <Lock size={16} style={leftIconStyle} />
                <input
                  id="l-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={iconInputStyle}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'0.88rem', color:'var(--text-muted)' }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor:'var(--primary)', width:'15px', height:'15px', cursor:'pointer' }} />
                Remember me
              </label>
              <button type="button" onClick={() => switchView('forgot')}
                style={{ background:'none', border:'none', color:'var(--primary)', cursor:'pointer', fontSize:'0.88rem', fontWeight:500, fontFamily:'inherit' }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
            </button>

            <Divider />
            <GoogleBtn label="Continue with Google" />

            {/* Guest */}
            <button type="button" onClick={handleGuest} disabled={loading}
              style={{ width:'100%', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'10px', borderRadius:'12px', transition:'var(--transition)', fontFamily:'inherit' }}
              onMouseOver={e => { e.currentTarget.style.background='var(--surface-badge)'; e.currentTarget.style.color='var(--primary)'; }}
              onMouseOut={e  => { e.currentTarget.style.background='none';               e.currentTarget.style.color='var(--text-muted)'; }}>
              <Ghost size={16} /> Continue as Guest
            </button>

            <SwitchRow text="Don't have an account?" action="signup" label="Sign Up" />
          </form>
        )}

        {/* ════ SIGN UP ════ */}
        {view === 'signup' && (
          <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            <div>
              <label htmlFor="s-email" style={labelStyle}>Email Address</label>
              <div style={iconWrapStyle}>
                <Mail size={16} style={leftIconStyle} />
                <input
                  id="s-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={iconInputNoEyeStyle}
                />
              </div>
            </div>

            <div>
              <label htmlFor="s-password" style={labelStyle}>Password</label>
              <div style={iconWrapStyle}>
                <Lock size={16} style={leftIconStyle} />
                <input
                  id="s-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={iconInputStyle}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <p style={{ marginTop:'6px', fontSize:'0.8rem', color: strengthColor }}>{strengthText}</p>
              )}
            </div>

            <div>
              <label htmlFor="s-confirm" style={labelStyle}>Confirm Password</label>
              <div style={iconWrapStyle}>
                <Lock size={16} style={leftIconStyle} />
                <input
                  id="s-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  style={iconInputStyle}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowConfirm(p => !p)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={loading}>
              {loading ? 'Creating account…' : <><UserPlus size={16} /> Create Account</>}
            </button>

            <Divider />
            <GoogleBtn label="Sign up with Google" />
            <SwitchRow text="Already have an account?" action="login" label="Sign In" />
          </form>
        )}

        {/* ════ FORGOT PASSWORD ════ */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            <div>
              <label htmlFor="f-email" style={labelStyle}>Email Address</label>
              <div style={iconWrapStyle}>
                <Mail size={16} style={leftIconStyle} />
                <input
                  id="f-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={iconInputNoEyeStyle}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width:'100%' }} disabled={loading || !!success}>
              {loading ? 'Sending…' : <><Mail size={16} /> Send Reset Link</>}
            </button>

            <SwitchRow text="Remembered your password?" action="login" label="Sign In" />
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
