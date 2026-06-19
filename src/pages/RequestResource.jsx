import { Send, CheckCircle, Package, FileText, GraduationCap, HelpCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

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
    
    // In a real app, this would send to Firebase or an API
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setDetails('');
    }, 3000);
  };

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="form-panel form-panel-wide">
        
        <div className="form-header">
          <h1 className="text-gradient">{t('request_resource_title')}</h1>
          <p>{t('request_resource_desc')}</p>
        </div>

        {submitted ? (
          <div className="form-success-state">
            <div className="success-icon">
              <CheckCircle size={36} color="#00c97d" />
            </div>
            <h3>{t('request_submitted')}</h3>
            <p>{t('request_submitted_desc')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label className="form-label">{t('resource_type')}</label>
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
                    padding: '8px 16px', borderRadius: '12px',
                    border: `1.5px solid ${type === key ? 'var(--primary)' : 'var(--surface-border)'}`,
                    background: type === key ? 'var(--surface-badge)' : 'transparent',
                    color: type === key ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {icon} {t(`resource_${key}`)}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">{t('resource_name')} <span className="required">*</span></label>
              <input 
                type="text" 
                required
                placeholder="e.g. Adobe Premiere Pro 2024" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('additional_details')}</label>
              <textarea 
                placeholder="Specific version, language, or OS requirements..." 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="form-textarea"
              />
            </div>

            <button type="submit" className="form-submit">
              <Send size={18} /> {t('submit_request')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RequestResource;
