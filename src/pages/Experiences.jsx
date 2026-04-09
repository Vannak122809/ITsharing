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
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-gradient">{t('experiences')}</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Read career stories, technical breakdowns, and interview failures shared by fellow developers.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
        
        <article className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Network & Application Administration: Building Resilient Systems</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Vannak Tech</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Apr 09, 2026</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.8' }}>
            Managing enterprise-level network infrastructure and application environments demands a deep understanding of both hardware and software. My experience as a Network and Application Admin involves designing high-availability architectures, implementing robust security protocols, and optimizing application performance across distributed systems. From VLAN segmentation to automated server monitoring and deployment, I strive to create seamless, secure, and efficient IT ecosystems that empower users and scale with business needs.
          </p>
          <a href="#" onClick={handleReadStory} style={{ display: 'inline-block', marginTop: '24px', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>
            {t('read_story')} &rarr;
          </a>
        </article>

        <article className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>How I optimized our SQL queries by 90%</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Alexander T.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Oct 14, 2024</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.8' }}>
            When our user base crossed the 1M mark, our Postgres database was screaming. We were looking at 5-second load times on the main dashboard. The culprit? An ORM query that was silently causing an N+1 problem on a very nested relationship. By implementing lateral joins and replacing the ORM...
          </p>
          <a href="#" onClick={handleReadStory} style={{ display: 'inline-block', marginTop: '24px', fontWeight: 'bold', color: 'var(--primary)', textDecoration: 'none' }}>
            {t('read_story')} &rarr;
          </a>
        </article>

        <article className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>Failing the FAANG Interview: What I Learned</h2>
          <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Sarah Jenkins</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Sep 02, 2024</span>
          </div>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.8' }}>
            I spent 3 months grinding LeetCode, going through "Grokking the System Design Interview", and mocking. Despite all this, I bombed the behavioral rounds. I treated it like a technical test instead of a conversation. Let me share my study notes and what I'm doing differently next time...
          </p>
          <a href="#" onClick={handleReadStory} style={{ display: 'inline-block', marginTop: '24px', fontWeight: 'bold', color: '#ff2a7a', textDecoration: 'none' }}>
            {t('read_story')} &rarr;
          </a>
        </article>

      </div>
    </div>
  );
};

export default Experiences;
