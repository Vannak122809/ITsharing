import React from 'react';
import { ArrowRight, PlayCircle, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="container" style={{ marginTop: '40px' }}>
      <section className="hero float-anim">
        <h1>{t('home_hero_title')}</h1>
        <p>{t('home_hero_desc')}</p>
        <div className="hero-btns">
          <Link to="/courses" className="btn btn-primary">
            {t('explore_courses')} <PlayCircle size={20} />
          </Link>
          <Link to="/experiences" className="btn btn-outline">
            {t('read_experiences')} <BookOpen size={20} />
          </Link>
        </div>
      </section>

      <section style={{ marginTop: '80px', marginBottom: '80px' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '40px', textAlign: 'center' }}>{t('featured_resources')}</h2>
        <div className="card-grid">
          <div className="card glass-panel flex flex-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--primary)', marginBottom: '16px' }}>
              <Star size={24} />
              <span style={{ fontSize: '0.8rem', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px' }}>{t('course')}</span>
            </div>
            <h3 className="card-title">React Performance Optimization</h3>
            <p className="card-desc">Learn how to make your large-scale React apps lightning fast with useMemo, React.memo, and virtualization.</p>
            <Link to="/courses" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontWeight: 'bold' }}>
              {t('watch_video')} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="card glass-panel flex flex-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#ff2a7a', marginBottom: '16px' }}>
              <BookOpen size={24} />
              <span style={{ fontSize: '0.8rem', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px' }}>{t('experience')}</span>
            </div>
            <h3 className="card-title">Network & Application Admin</h3>
            <p className="card-desc">Designing resilient infrastructures and optimizing enterprise applications for high-performance environments.</p>
            <Link to="/experiences" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontWeight: 'bold', color: '#ff2a7a' }}>
              {t('read_story')} <ArrowRight size={16} />
            </Link>
          </div>

          <div className="card glass-panel flex flex-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#00fa9a', marginBottom: '16px' }}>
              <ArrowRight size={24} />
              <span style={{ fontSize: '0.8rem', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px' }}>{t('document')}</span>
            </div>
            <h3 className="card-title">System Design Cheatsheet</h3>
            <p className="card-desc">A comprehensive guide to scaling systems, databases, caching, and microservices for interviews.</p>
            <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontWeight: 'bold', color: '#00fa9a' }}>
              {t('download_pdf')} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
