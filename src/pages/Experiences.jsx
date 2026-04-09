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
           Real-world career stories, technical breakthroughs, and critical lessons shared by our global tech community.
         </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
        
        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '16px' }}>Technical Leadership</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>Network & Application Administration: Building Resilient Systems</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="var(--primary)" /> Vannak Tech</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="var(--primary)" /> Apr 09, 2026</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            Managing enterprise-level network infrastructure and application environments demands a deep understanding of both hardware and software. My experience as a Network and Application Admin involves designing high-availability architectures, implementing robust security protocols, and optimizing application performance across distributed systems. From VLAN segmentation to automated server monitoring and deployment, I strive to create seamless, secure, and efficient IT ecosystems that empower users and scale with business needs.
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.15em', marginBottom: '16px' }}>Optimization Case Study</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>How I optimized our SQL queries by 90%</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="#10b981" /> Alexander T.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="#10b981" /> Oct 14, 2024</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            When our user base crossed the 1M mark, our Postgres database was screaming. We were looking at 5-second load times on the main dashboard. The culprit? An ORM query that was silently causing an N+1 problem on a very nested relationship. By implementing lateral joins and replacing the ORM...
          </p>
          <button onClick={handleReadStory} className="btn btn-outline" style={{ marginTop: '32px', padding: '12px 32px', borderRadius: '16px', fontWeight: 800 }}>
            {t('read_story')} &rarr;
          </button>
        </article>

        <article className="glass-panel luxury-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#ff2a7a', letterSpacing: '0.15em', marginBottom: '16px' }}>Career Insights</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.2, color: '#fff' }}>Failing the FAANG Interview: What I Learned</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '20px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><User size={18} color="#ff2a7a" /> Sarah Jenkins</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}><Calendar size={18} color="#ff2a7a" /> Sep 02, 2024</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.9', fontSize: '1.1rem', opacity: 0.9 }}>
            I spent 3 months grinding LeetCode, going through "Grokking the System Design Interview", and mocking. Despite all this, I bombed the behavioral rounds. I treated it like a technical test instead of a conversation. Let me share my study notes and what I'm doing differently next time...
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
