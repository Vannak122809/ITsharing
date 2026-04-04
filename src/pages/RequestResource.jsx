import { Send, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

const RequestResource = () => {
  const { t } = useLanguage();
  const [type, setType] = useState('software');
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || u.isAnonymous) {
        navigate('/login');
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // In a real app, this would send to Firebase or an API API
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setDetails('');
    }, 3000);
  };

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '600px', borderRadius: '16px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '16px' }} className="text-gradient">{t('request_resource_title')}</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          {t('request_resource_desc')}
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#00fa9a' }}>
            <CheckCircle size={64} style={{ margin: '0 auto 16px auto' }} />
            <h3>{t('request_submitted')}</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{t('request_submitted_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>{t('resource_type')}</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', outline: 'none' }}
              >
                <option value="software">{t('resource_software')}</option>
                <option value="document">{t('resource_document')}</option>
                <option value="course">{t('resource_course')}</option>
                <option value="other">{t('resource_other')}</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>{t('resource_name')} <span style={{ color: '#ff2a7a' }}>*</span></label>
              <input 
                type="text" 
                required
                placeholder="e.g. Adobe Premiere Pro 2024" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)' }}>{t('additional_details')}</label>
              <textarea 
                placeholder="Specific version, language, or OS requirements..." 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                style={{ width: '100%', padding: '12px', minHeight: '100px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', resize: 'vertical', outline: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Send size={18} /> {t('submit_request')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestResource;
