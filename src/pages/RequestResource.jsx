import { Send, CheckCircle, Package, FileText, GraduationCap, HelpCircle, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../LanguageContext';
import { sendTelegramAlert } from '../utils/telegramNotify';
import toast from 'react-hot-toast';

const typeIcons = {
  software: <Package size={18} />,
  document: <FileText size={18} />,
  course: <GraduationCap size={18} />,
  other: <HelpCircle size={18} />,
};

const RequestResource = () => {
  const { t } = useLanguage();
  const [type, setType] = useState('software');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || u.isAnonymous) {
        navigate('/login');
      } else {
        setCurrentUser(u);
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter the resource name');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Save to Firestore resource_requests collection
      await addDoc(collection(db, 'resource_requests'), {
        type,
        name: name.trim(),
        details: details.trim(),
        userId: currentUser?.uid || 'anonymous',
        userEmail: currentUser?.email || 'unauthenticated',
        userName: currentUser?.displayName || 'User',
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // 2. Dispatch real-time Telegram alert to admins
      const alertMessage = `<b>📥 New Resource Request</b>\n\n` +
        `<b>📌 Type:</b> ${type.toUpperCase()}\n` +
        `<b>🏷️ Name:</b> ${name.trim()}\n` +
        `<b>📝 Details:</b> ${details.trim() || 'No additional details'}\n` +
        `<b>👤 Requested by:</b> ${currentUser?.displayName || currentUser?.email || 'User'}\n` +
        `<b>⏱️ Time:</b> ${new Date().toLocaleString()}`;

      sendTelegramAlert(alertMessage).catch(err => console.warn('Telegram notification failed:', err));

      setSubmitted(true);
      toast.success('Resource request submitted successfully!');
      setTimeout(() => {
        setSubmitted(false);
        setName('');
        setDetails('');
      }, 3500);
    } catch (err) {
      console.error('[RequestResource Error]', err);
      setError('Failed to submit request. Please check your connection and try again.');
      toast.error('Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '90px', paddingBottom: '60px', minHeight: '85vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="form-panel form-panel-wide classic-card" style={{ maxWidth: '640px', width: '100%' }}>
        
        <div className="form-header" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'var(--surface-badge)', color: 'var(--secondary)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            <Sparkles size={14} /> Classic Archive Request
          </div>
          <h1 className="text-gold-gradient" style={{ fontSize: '2.1rem', marginBottom: '6px' }}>{t('request_resource_title')}</h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>{t('request_resource_desc')}</p>
        </div>

        {error && (
          <div className="form-alert form-alert-error" style={{ marginBottom: '20px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {submitted ? (
          <div className="form-success-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
            <div className="success-icon" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(4, 120, 87, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <CheckCircle size={36} color="var(--tertiary)" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'Playfair Display, serif', marginBottom: '8px' }}>{t('request_submitted')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('request_submitted_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="form-label" style={{ letterSpacing: '0.06em' }}>{t('resource_type')}</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="form-select"
              >
                <option value="software">{t('resource_software')}</option>
                <option value="document">{t('resource_document')}</option>
                <option value="course">{t('resource_course')}</option>
                <option value="other">{t('resource_other')}</option>
              </select>
            </div>

            {/* Visual indicator of selected type */}
            <div style={{ 
              display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' 
            }}>
              {Object.entries(typeIcons).map(([key, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px', borderRadius: '12px',
                    border: `1.5px solid ${type === key ? 'var(--secondary)' : 'var(--surface-border-subtle)'}`,
                    background: type === key ? 'var(--surface-badge)' : 'transparent',
                    color: type === key ? 'var(--secondary)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {icon} {t(`resource_${key}`)}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label" style={{ letterSpacing: '0.06em' }}>{t('resource_name')} <span className="required" style={{ color: '#ef4444' }}>*</span></label>
              <input 
                type="text" 
                required
                placeholder="e.g. Adobe Premiere Pro 2024 / Khmer Unicode Font Pack" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ letterSpacing: '0.06em' }}>{t('additional_details')}</label>
              <textarea 
                placeholder="Specific version, operating system requirements, or helpful links..." 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="form-textarea"
                style={{ minHeight: '120px' }}
              />
            </div>

            <button type="submit" className="form-submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px 24px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? <><Loader2 size={18} className="spin" /> Submitting Request...</> : <><Send size={18} /> {t('submit_request')}</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestResource;
