import React from 'react';
import { ArrowRight, PlayCircle, BookOpen, Star, Zap, Shield, Rocket, Download, MessageSquare, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  const stats = [
    { label: 'Active Members', value: '2.4k+', icon: <Heart size={16} />, color: '#ec4899' },
    { label: 'Cloud Resources', value: '450+', icon: <Rocket size={16} />, color: '#3b82f6' },
    { label: 'Weekly Downloads', value: '1.2k+', icon: <Download size={16} />, color: '#10b981' },
    { label: 'Helpful Replies', value: '800+', icon: <MessageSquare size={16} />, color: '#f59e0b' },
  ];

  return (
    <div className="container" style={{ paddingBottom: '100px' }}>
      
      {/* ─── MODERN HERO SECTION ─── */}
      <section className="hero float-anim" style={{ 
        minHeight: '85vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '120px 0 80px',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.15, zIndex: -1 }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: '250px', height: '250px', background: 'var(--secondary)', filter: 'blur(150px)', opacity: 0.1, zIndex: -1 }} />


        <h1 style={{ filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))' }}>
          {t('home_hero_title')}
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto', lineHeight: '1.8' }}>
          {t('home_hero_desc')}
        </p>
        
        <div className="hero-btns" style={{ marginTop: '40px' }}>
          <Link to="/courses" className="btn btn-primary" style={{ padding: '16px 36px', borderRadius: '16px', fontSize: '1.1rem' }}>
            {t('explore_courses')} <PlayCircle size={22} />
          </Link>
          <Link to="/experiences" className="btn btn-outline" style={{ padding: '16px 32px', borderRadius: '16px', fontSize: '1.1rem' }}>
            {t('read_experiences')} <BookOpen size={22} />
          </Link>
        </div>

        {/* Floating Stats Pushes the "Social Proof" */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
          gap: '20px', 
          width: '100%', 
          maxWidth: '900px', 
          margin: '100px auto 0',
          background: 'var(--surface)',
          padding: '24px',
          borderRadius: '32px',
          border: '1px solid var(--surface-border)',
          backdropFilter: 'blur(12px)'
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: s.color, fontWeight: 800, fontSize: '1.1rem' }}>
                {s.icon} {s.value}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BENTO FEATURED GRID ─── */}
      <section style={{ marginTop: '140px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '3.2rem', fontWeight: 800, marginBottom: '16px' }}>{t('featured_resources')}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Hand-picked tools, courses and documents for modern IT professionals.</p>
        </div>

        <div className="bento-grid">
          
          {/* Main Large Card */}
          <div className="card glass-panel bento-large">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: '24px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)' }}>
                <Star size={28} />
              </div>
              <span className="badge-primary">{t('course')}</span>
              <h3 style={{ fontSize: '2rem', marginTop: '16px' }}>React Optimization Masterclass</h3>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', margin: '16px 0 32px' }}>
                Deep dive into advanced virtualization, concurrent rendering, and progressive hydration to build blazing fast web apps.
              </p>
              <Link to="/courses" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {t('watch_video')} <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Medium Card 1 */}
          <div className="card glass-panel bento-medium">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', marginBottom: '20px' }}>
              <Shield size={22} />
            </div>
            <span className="badge-secondary">{t('experience')}</span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '12px' }}>Network & App Admin</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1 }}>Designing resilient infrastructures and optimizing enterprise applications for modern high-performance environments.</p>
            <Link to="/experiences" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: 800 }}>
              {t('read_story')} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Medium Card 2 */}
          <div className="card glass-panel bento-medium">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '20px' }}>
              <Rocket size={22} />
            </div>
            <span className="badge-tertiary">{t('document')}</span>
            <h3 style={{ fontSize: '1.4rem', marginTop: '12px' }}>System Design Guide</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1 }}>A comprehensive guide to scaling systems, databases, caching, and microservices for high-traffic environments.</p>
            <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800 }}>
              {t('download_pdf')} <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      <style>{`
        .badge-primary { background: rgba(37, 99, 235, 0.1); color: var(--primary); padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-secondary { background: rgba(236, 72, 153, 0.1); color: #ec4899; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-tertiary { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: auto auto;
          gap: 24px;
        }

        .bento-large {
          grid-row: span 2;
          padding: 48px !important;
          background: linear-gradient(135deg, var(--surface), rgba(99, 102, 241, 0.03)) !important;
          justify-content: center;
        }

        @media (max-width: 900px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-large { padding: 32px !important; grid-row: auto; }
        }
      `}</style>
    </div>
  );
};

export default Home;

