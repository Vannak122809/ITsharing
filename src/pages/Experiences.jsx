import React, { useState, useEffect } from 'react';
import { User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

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
        
        {/* Experience 4: Picking Recyclables */}
        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b', letterSpacing: '0.15em', marginBottom: '16px' }}>{t('exp4_category')}</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>{t('exp4_title')}</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="#f59e0b" /> {t('exp4_author')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="#f59e0b" /> {t('exp4_date')}</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            {t('exp4_desc')}
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

        {/* Experience 5: Construction Work */}
        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ef4444', letterSpacing: '0.15em', marginBottom: '16px' }}>{t('exp5_category')}</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>{t('exp5_title')}</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="#ef4444" /> {t('exp5_author')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="#ef4444" /> {t('exp5_date')}</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            {t('exp5_desc')}
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

        {/* Experience 1: Network & Application Admin */}
        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '16px' }}>{t('exp1_category')}</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>{t('exp1_title')}</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="var(--primary)" /> {t('exp1_author')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="var(--primary)" /> {t('exp1_date')}</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            {t('exp1_desc')}
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

        {/* Experience 2: SQL Optimization */}
        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.15em', marginBottom: '16px' }}>{t('exp2_category')}</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>{t('exp2_title')}</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="#10b981" /> {t('exp2_author')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="#10b981" /> {t('exp2_date')}</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            {t('exp2_desc')}
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

        {/* Experience 3: FAANG Interview */}
        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ff2a7a', letterSpacing: '0.15em', marginBottom: '16px' }}>{t('exp3_category')}</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>{t('exp3_title')}</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="#ff2a7a" /> {t('exp3_author')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="#ff2a7a" /> {t('exp3_date')}</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            {t('exp3_desc')}
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

      </div>
    </div>
  );
};


export default Experiences;
