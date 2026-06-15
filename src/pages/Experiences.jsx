import React, { useState, useEffect } from 'react';
import { User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';
import BookmarkButton from '../components/BookmarkButton';

const Experiences = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isGuest = !authLoading && (!user || user.isAnonymous);

  const handleReadStory = (e) => {
    e.preventDefault();
    if (authLoading) return;
    if (isGuest) {
      navigate('/login');
    } else {
      alert(t('coming_soon'));
    }
  };

  const experiences = [
    { id: 'exp4', color: '#f59e0b' },
    { id: 'exp5', color: '#ef4444' },
    { id: 'exp1', color: 'var(--primary)' },
    { id: 'exp2', color: '#10b981' },
    { id: 'exp3', color: '#ff2a7a' }
  ];

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '90vh' }}>
      <header style={{ marginBottom: '80px', textAlign: 'center', position: 'relative' }}>
         <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1, zIndex: -1 }} />
         <h1 className="text-gradient" style={{ fontSize: '4rem', fontWeight: 950, marginBottom: '20px', letterSpacing: '-0.02em' }}>{t('experiences')}</h1>
         <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '1.25rem', lineHeight: 1.6 }}>
           {t('experiences_desc')}
         </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
        
        {experiences.map((exp) => (
          <article key={exp.id} className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: exp.color, letterSpacing: '0.15em', marginBottom: '16px' }}>{t(`${exp.id}_category`)}</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2 }}>{t(`${exp.id}_title`)}</h2>
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color={exp.color} /> {t(`${exp.id}_author`)}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color={exp.color} /> {t(`${exp.id}_date`)}</span>
            </div>
            <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
              {t(`${exp.id}_desc`)}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px', alignItems: 'center' }}>
              <button onClick={handleReadStory} className="btn btn-outline" style={{ padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
                {t('read_story')} &rarr;
              </button>
              <BookmarkButton 
                user={user} 
                resourceId={exp.id} 
                resourceData={{ 
                  type: 'experience', 
                  title: t(`${exp.id}_title`), 
                  path: '/experiences' 
                }} 
              />
            </div>
          </article>
        ))}

      </div>
    </div>
  );
};

export default Experiences;
