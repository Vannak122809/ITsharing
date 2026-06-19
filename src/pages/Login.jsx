import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  LogIn, UserPlus, AlertCircle, Eye, EyeOff,
  Mail, Lock, ArrowLeft, CheckCircle, Ghost, User,
} from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const googleProvider = new GoogleAuthProvider();

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // view: 'login' | 'signup' | 'forgot'
  const [view, setView]                   = useState('login');
  const [email, setEmail]                 = useState('');
  const [fullName, setFullName]           = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [agreeTerms, setAgreeTerms]       = useState(false);
  const [rememberMe, setRememberMe]       = useState(false);
  const [showPwd, setShowPwd]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [loading, setLoading]             = useState(false);
  const [attempts, setAttempts]           = useState(0); // Rate limiting
  const [botField, setBotField]           = useState(''); // Honeypot

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
    'auth/user-not-found':      'Incorrect email or password.', // Unified for security
    'auth/wrong-password':      'Incorrect email or password.', // Unified for security
    'auth/invalid-credential':  'Incorrect email or password.',
    'auth/email-already-in-use':'This email is already registered.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/popup-closed-by-user':'Google sign-in was cancelled.',
    'auth/too-many-requests':   'Too many attempts. Please try again later.',
  }[code] || 'Something went wrong. Please try again.');

  // ── Handlers ──────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); 
    
    // 1. Honeypot check
    if (botField) return; 

    // 2. Local Rate Limiting
    if (attempts > 5) {
      setError('Too many login attempts from this session. Please wait or refresh.');
      return;
    }

    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Enforce email verification
      if (!userCredential.user.emailVerified) {
        setError('Your email is not verified. Please check your inbox to verify your account.');
        await auth.signOut();
        return;
      }

      if (rememberMe) localStorage.setItem('itshare_remembered_email', email.trim());
      else localStorage.removeItem('itshare_remembered_email');
      navigate('/');
    } catch (err) { 
      setAttempts(prev => prev + 1);
      setError(friendlyError(err.code)); 
    }
    finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!agreeTerms) { setError('Please agree to the Terms of Service.'); return; }
    if (!fullName.trim()) { setError('Full Name is required.'); return; }

    setError(''); setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with full name
      await updateProfile(userCredential.user, {
        displayName: fullName
      });
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      setSuccess('Account created! Please check your email inbox to verify your account before signing in.');
      setView('login'); // Redirect to login to show the success message
      setFullName('');
      setPassword('');
      setConfirm('');
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
    if (botField) return;
    setError(''); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); navigate('/'); }
    catch (err) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };


  // ── Password strength ──────────────────────────────────────────────
  const pwdLen = password.length;
  const strengthPct = pwdLen >= 12 ? 100 : pwdLen >= 8 ? 75 : pwdLen >= 6 ? 50 : pwdLen > 0 ? 25 : 0;
  const strengthColor = pwdLen >= 8 ? '#00c97d' : pwdLen >= 6 ? '#f59e0b' : '#ff2a7a';
  const strengthText  = pwdLen >= 8 ? '✓ Strong password'
    : pwdLen >= 6 ? '⚠ Acceptable — try making it longer'
    : '✗ Too short (min 6 characters)';

  // ── Shared UI pieces ──────────────────────────────────────────────
  const Divider = () => (
    <div className="form-divider">
      <span>{t('or')}</span>
    </div>
  );

  const GoogleBtn = ({ label }) => (
    <button type="button" onClick={handleGoogle} disabled={loading} className="form-social-btn">
      <GoogleIcon /> {label}
    </button>
  );

  const SwitchRow = ({ text, action, label }) => (
    <p className="form-switch-row">
      {text}{' '}
      <button type="button" onClick={() => switchView(action)}>
        {label}
      </button>
    </p>
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 16px 40px' }}>
      <div className="form-panel" style={{ width: '100%', maxWidth: '440px' }}>

        {/* Header */}
        <div className="form-header">
          {view !== 'login' && (
            <button onClick={() => switchView('login')} className="form-back-btn">
              <ArrowLeft size={14} /> {t('back_to')} {t('signin')}
            </button>
          )}
          <h1 className="text-gradient">
            {view === 'login'  && t('welcome_back')}
            {view === 'signup' && t('create_account')}
            {view === 'forgot' && t('reset_password')}
          </h1>
          <p>
            {view === 'login'  && t('sign_in_desc')}
            {view === 'signup' && t('sign_up_desc')}
            {view === 'forgot' && t('forgot_desc')}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="form-alert form-alert-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="form-alert form-alert-success">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        {/* ════ LOGIN ════ */}
        {view === 'login' && (
          <form onSubmit={handleLogin}>
            
            {/* Honeypot Field (Hidden from humans) */}
            <input 
              type="text" 
              value={botField} 
              onChange={(e) => setBotField(e.target.value)} 
              style={{ display: 'none' }} 
              tabIndex="-1" 
              autoComplete="off" 
            />

            <div className="form-group">
              <label htmlFor="l-email" className="form-label">{t('email_address')}</label>
              <div className="form-input-wrap">
                <Mail size={16} className="form-input-icon" />
                <input
                  id="l-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="l-password" className="form-label">{t('password')}</label>
              <div className="form-input-wrap">
                <Lock size={16} className="form-input-icon" />
                <input
                  id="l-password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input has-eye"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="form-eye-btn" onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="form-options-row">
              <label className="form-checkbox">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                {t('remember_me')}
              </label>
              <button type="button" onClick={() => switchView('forgot')} className="form-link-btn">
                {t('forgot_password_q')}
              </button>
            </div>

            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? t('signing_in') : <><LogIn size={16} /> {t('signin')}</>}
            </button>

            <Divider />
            <GoogleBtn label={t('continue_with_google')} />

            <SwitchRow text={t('no_account')} action="signup" label={t('create_account')} />
          </form>
        )}

        {/* ════ SIGN UP ════ */}
        {view === 'signup' && (
          <form onSubmit={handleSignup}>

            <div className="form-group">
              <label htmlFor="s-name" className="form-label">{t('full_name')}</label>
              <div className="form-input-wrap">
                <User size={16} className="form-input-icon" />
                <input
                  id="s-name"
                  type="text"
                  className="form-input"
                  placeholder="Your Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="s-email" className="form-label">{t('email_address')}</label>
              <div className="form-input-wrap">
                <Mail size={16} className="form-input-icon" />
                <input
                  id="s-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="s-password" className="form-label">{t('password')}</label>
              <div className="form-input-wrap">
                <Lock size={16} className="form-input-icon" />
                <input
                  id="s-password"
                  type={showPwd ? 'text' : 'password'}
                  className="form-input has-eye"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="form-eye-btn" onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="pwd-strength">
                  <div className="pwd-strength-bar">
                    <div className="pwd-strength-fill" style={{ width: `${strengthPct}%`, background: strengthColor }} />
                  </div>
                  <span className="pwd-strength-text" style={{ color: strengthColor }}>{strengthText}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="s-confirm" className="form-label">{t('confirm_password')}</label>
              <div className="form-input-wrap">
                <Lock size={16} className="form-input-icon" />
                <input
                  id="s-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="form-input has-eye"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button type="button" className="form-eye-btn" onClick={() => setShowConfirm(p => !p)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <label className="form-checkbox" style={{ marginBottom: '20px' }}>
              <input 
                type="checkbox" 
                checked={agreeTerms} 
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>{t('agree_terms')}</span>
            </label>

            <button type="submit" className="form-submit" disabled={loading}>
              {loading ? t('creating_account') : <><UserPlus size={16} /> {t('create_account')}</>}
            </button>

            <Divider />
            <GoogleBtn label={t('continue_with_google')} />
            <SwitchRow text={t('have_account')} action="login" label={t('signin')} />
          </form>
        )}

        {/* ════ FORGOT PASSWORD ════ */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot}>

            <div className="form-group">
              <label htmlFor="f-email" className="form-label">{t('email_address')}</label>
              <div className="form-input-wrap">
                <Mail size={16} className="form-input-icon" />
                <input
                  id="f-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="form-submit" disabled={loading || !!success}>
              {loading ? t('sending') : <><Mail size={16} /> {t('send_reset_link')}</>}
            </button>

            <SwitchRow text={t('remembered_password')} action="login" label={t('signin')} />
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
