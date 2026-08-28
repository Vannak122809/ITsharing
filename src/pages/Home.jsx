import React, { useState } from 'react';
import { 
  ArrowRight, PlayCircle, BookOpen, Star, Zap, Shield, Rocket, Download, 
  MessageSquare, Heart, Sparkles, Layers, Terminal, Gift, CheckCircle2, 
  FileText, ArrowUpRight, Award, Users, ChevronRight, Cpu, HardDrive, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { motion } from 'framer-motion';

const Home = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('courses');

  const stats = [
    { label: 'Active Engineers', value: '3,800+', icon: <Users size={18} />, color: '#3b82f6' },
    { label: 'Cloud Resources', value: '620+', icon: <Rocket size={18} />, color: '#10b981' },
    { label: 'Fast Downloads', value: '45.8k+', icon: <Download size={18} />, color: '#f59e0b' },
    { label: 'Community Answers', value: '1,450+', icon: <MessageSquare size={18} />, color: '#ec4899' },
  ];

  const quickPreviews = {
    courses: {
      tag: '🔥 Featured Learning Track',
      title: 'Fullstack HTML, CSS & Responsive Web Architecture',
      desc: '48 complete modules from HTML fundamentals to CSS Grid, Flexbox, media queries, and modern component design.',
      link: '/courses',
      btnText: 'Start Learning Now',
      color: '#e34f26',
      badge: '48 Lessons • Beginner to Pro',
      stats: '100% Free Video Course'
    },
    documents: {
      tag: '📚 Enterprise Engineering Guides',
      title: 'CCNA Routing, Switching & Network Engineering Compendium',
      desc: 'Standardized Cisco, Mikrotik, and Ubiquiti topology guides, NOS configuration, IPv4/IPv6 VLSM subnetting sheets.',
      link: '/documents',
      btnText: 'Browse Document Library',
      color: '#3b82f6',
      badge: 'PDF Slides & Cheatsheets',
      stats: 'Instant CDN Downloads'
    },
    software: {
      tag: '⚡ Verified IT Software Toolkit',
      title: 'Dev Environments, System Diagnostics & Repack Utilities',
      desc: 'Clean, verified software binaries, network scanners, ISO creators, virtualization tools, and printer drivers.',
      link: '/software',
      btnText: 'Explore Software Hub',
      color: '#8b5cf6',
      badge: 'Windows • macOS • Linux',
      stats: 'High-Speed R2 Mirrors'
    },
    assets: {
      tag: '🎨 Graphic & Frame Assets',
      title: 'Khmer & Lunar Festival Stock Templates (PSD / AI / PNG)',
      desc: 'Print-ready high-resolution greeting frames, vector illustrations, luxury badges, and typography packs.',
      link: '/assets',
      btnText: 'Browse Graphic Assets',
      color: '#d4af37',
      badge: 'PSD • AI • WebP Ready',
      stats: 'Royalty-Free Assets'
    }
  };

  const currentPreview = quickPreviews[activeTab];

  return (
    <div className="container" style={{ paddingBottom: '120px', paddingTop: '20px' }}>
      
      {/* ─── ULTRA-MODERN HERO SECTION ─── */}
      <section className="hero" style={{ 
        minHeight: '82vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '80px 0 60px',
        position: 'relative',
        textAlign: 'center'
      }}>
        {/* Animated Background Mesh & Glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '650px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(212, 175, 55, 0.12) 40%, transparent 70%)',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Floating Top Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '30px',
            background: 'var(--surface-badge)',
            border: '1px solid var(--surface-border)',
            color: 'var(--secondary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '28px',
            zIndex: 1
          }}
        >
          <Sparkles size={15} color="var(--secondary)" />
          <span>The Next-Gen Knowledge Hub for IT & Devs in Cambodia</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-animated-cyber"
          style={{ 
            fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
            fontWeight: 900,
            maxWidth: '1000px',
            lineHeight: 1.15,
            marginBottom: '24px',
            zIndex: 1
          }}
        >
          {t('home_hero_title') || 'Empowering Engineers With Modern IT Knowledge'}
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ 
            maxWidth: '720px', 
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
            color: 'var(--text-muted)', 
            lineHeight: '1.7',
            marginBottom: '40px',
            zIndex: 1
          }}
        >
          {t('home_hero_desc') || 'Access curated video courses, enterprise network documents, certified driver software, and graphic assets — all hosted on blazing-fast Cloudflare R2.'}
        </motion.p>
        
        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ 
            display: 'flex', 
            gap: '16px', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            zIndex: 1,
            marginBottom: '60px'
          }}
        >
          <Link 
            to="/courses" 
            className="btn btn-primary" 
            style={{ 
              padding: '16px 36px', 
              borderRadius: '16px', 
              fontSize: '1.05rem', 
              fontWeight: 700,
              boxShadow: '0 12px 30px rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {t('explore_courses') || 'Explore Courses'} <PlayCircle size={20} />
          </Link>
          <Link 
            to="/documents" 
            className="btn btn-outline" 
            style={{ 
              padding: '16px 32px', 
              borderRadius: '16px', 
              fontSize: '1.05rem', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {t('documents') || 'Document Library'} <FileText size={20} />
          </Link>
          <Link 
            to="/software" 
            className="btn btn-outline" 
            style={{ 
              padding: '16px 32px', 
              borderRadius: '16px', 
              fontSize: '1.05rem', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {t('software') || 'Software Hub'} <Download size={20} />
          </Link>
        </motion.div>

        {/* Live Interactive Stats Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
            gap: '16px', 
            width: '100%', 
            maxWidth: '960px', 
            background: 'var(--surface)',
            padding: '24px 32px',
            borderRadius: '28px',
            border: '1px solid var(--surface-border)',
            boxShadow: 'var(--shadow-glass)',
            backdropFilter: 'blur(16px)',
            zIndex: 1
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: s.color, fontWeight: 800, fontSize: '1.35rem' }}>
                <span style={{ padding: '6px', background: `${s.color}15`, borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                  {s.icon}
                </span>
                {s.value}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── INTERACTIVE RESOURCE LAUNCHER ─── */}
      <section style={{ marginTop: '90px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Instant Access
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', fontWeight: 800, marginTop: '8px', marginBottom: '14px' }}>
            What do you want to explore today?
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem' }}>
            Switch between categories below to preview our highest-rated engineering content.
          </p>
        </div>

        {/* Category Tabs */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          flexWrap: 'wrap', 
          marginBottom: '32px' 
        }}>
          {[
            { id: 'courses', label: t('courses') || 'Courses', icon: <PlayCircle size={17} /> },
            { id: 'documents', label: t('documents') || 'Documents', icon: <BookOpen size={17} /> },
            { id: 'software', label: t('software') || 'Software & Tools', icon: <Cpu size={17} /> },
            { id: 'assets', label: t('assets') || 'Design Assets', icon: <Sparkles size={17} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                border: activeTab === tab.id ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
                background: activeTab === tab.id ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--surface)',
                color: activeTab === tab.id ? '#fff' : 'var(--text-main)',
                boxShadow: activeTab === tab.id ? '0 10px 25px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Dynamic Highlight Card */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card glass-panel"
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '36px 44px',
            borderRadius: '28px',
            border: '1px solid var(--surface-border)',
            background: 'linear-gradient(135deg, var(--surface), rgba(59, 130, 246, 0.03))',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ 
              display: 'inline-block',
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              background: `${currentPreview.color}18`, 
              color: currentPreview.color,
              marginBottom: '16px' 
            }}>
              {currentPreview.tag}
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '14px', lineHeight: 1.3 }}>
              {currentPreview.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '28px' }}>
              {currentPreview.desc}
            </p>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link 
                to={currentPreview.link}
                className="btn btn-primary"
                style={{ padding: '14px 28px', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 700 }}
              >
                {currentPreview.btnText} <ArrowRight size={18} />
              </Link>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                ✓ {currentPreview.stats}
              </span>
            </div>
          </div>

          <div style={{
            background: 'var(--surface-badge)',
            borderRadius: '20px',
            padding: '28px',
            border: '1px solid var(--surface-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: currentPreview.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Zap size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Instant Free Access</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified Content Mirror</span>
              </div>
            </div>
            <div style={{ height: '1px', background: 'var(--surface-border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> No paywalls or forced subscriptions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Download directly via high-speed Cloudflare R2
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" /> Supported in Khmer and English
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── BENTO FEATURED PLATFORM GRID ─── */}
      <section style={{ marginTop: '130px' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Core Ecosystem
          </span>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 800, marginBottom: '14px' }}>
            {t('featured_resources') || 'Explore Our Core Pillars'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px', margin: '0 auto' }}>
            Everything you need to advance your career as an IT administrator, developer, or network engineer.
          </p>
        </div>

        <div className="bento-grid">
          
          {/* Bento Large - Course Masterclass */}
          <div className="card glass-panel bento-large">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                width: '56px', height: '56px', borderRadius: '16px', 
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: '#fff', marginBottom: '24px', 
                boxShadow: '0 12px 24px rgba(59, 130, 246, 0.35)' 
              }}>
                <PlayCircle size={28} />
              </div>
              <span className="badge-primary">{t('courses') || 'Video Courses'}</span>
              <h3 style={{ fontSize: '2.1rem', marginTop: '16px', lineHeight: 1.25 }}>
                Modern Web & Coding Masterclasses
              </h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', margin: '16px 0 32px', lineHeight: 1.7 }}>
                Learn HTML, CSS, JavaScript, Server Architecture, and Network Engineering through structured step-by-step video curriculum.
              </p>
              <Link to="/courses" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '14px 28px', borderRadius: '14px' }}>
                {t('explore_courses') || 'Start Course'} <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Bento Medium 1 - Documents Explorer */}
          <div className="card glass-panel bento-medium">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '18px' }}>
              <BookOpen size={24} />
            </div>
            <span className="badge-tertiary">{t('documents') || 'Technical Docs'}</span>
            <h3 style={{ fontSize: '1.45rem', marginTop: '12px', lineHeight: 1.3 }}>
              Cisco, Mikrotik & Cloud Manuals
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1, margin: '8px 0 20px', lineHeight: 1.6 }}>
              Download complete CCNA chapters, networking topologies, firewall deployment guides, and SQL references.
            </p>
            <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: 800 }}>
              {t('download_pdf') || 'Browse Explorer'} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Bento Medium 2 - Software Base */}
          <div className="card glass-panel bento-medium">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '18px' }}>
              <HardDrive size={24} />
            </div>
            <span className="badge-secondary">{t('software') || 'Software Hub'}</span>
            <h3 style={{ fontSize: '1.45rem', marginTop: '12px', lineHeight: 1.3 }}>
              Driver Repositories & Tools
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1, margin: '8px 0 20px', lineHeight: 1.6 }}>
              Instant driver downloads for Canon, HP, Epson printers, Mikrotik WinBox, screen recorders, and Windows ISO utilities.
            </p>
            <Link to="/software" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800 }}>
              {t('software') || 'Get Software'} <ArrowRight size={16} />
            </Link>
          </div>

          {/* Bento Medium 3 - Khmer Frame Editor */}
          <div className="card glass-panel bento-medium">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(212, 175, 55, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', marginBottom: '18px' }}>
              <Sparkles size={24} />
            </div>
            <span style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--secondary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
              Studio Tool
            </span>
            <h3 style={{ fontSize: '1.45rem', marginTop: '12px', lineHeight: 1.3 }}>
              Khmer Holiday Frame Studio
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1, margin: '8px 0 20px', lineHeight: 1.6 }}>
              Create personalized Khmer New Year & Water Festival greeting photo frames with interactive drag & drop canvas.
            </p>
            <Link to="/greeting-frames" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontWeight: 800 }}>
              Launch Studio <ArrowRight size={16} />
            </Link>
          </div>

          {/* Bento Medium 4 - Giveaways */}
          <div className="card glass-panel bento-medium">
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(236, 72, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899', marginBottom: '18px' }}>
              <Gift size={24} />
            </div>
            <span style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
              Member Perks
            </span>
            <h3 style={{ fontSize: '1.45rem', marginTop: '12px', lineHeight: 1.3 }}>
              Daily Giveaway Keys & Tools
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flexGrow: 1, margin: '8px 0 20px', lineHeight: 1.6 }}>
              Grab verified activation keys, trial resets, developer software licenses, and community giveaways.
            </p>
            <Link to="/giveaway" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: 800 }}>
              Claim Keys <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ─── */}
      <section style={{ marginTop: '120px' }}>
        <div className="glass-panel" style={{
          padding: '60px 40px',
          borderRadius: '32px',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.85), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: '600px', height: '300px',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }} />

          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, marginBottom: '18px', color: '#fff' }}>
            Ready to Accelerate Your IT Mastery?
          </h2>
          <p style={{ maxWidth: '640px', margin: '0 auto 36px', fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
            Join thousands of IT engineers and developers in Cambodia. Free forever, open for sharing, and backed by a thriving community.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/courses" className="btn btn-primary" style={{ padding: '16px 36px', borderRadius: '16px', fontSize: '1.05rem', fontWeight: 800, background: '#fff', color: '#1e3a8a' }}>
              Get Started Now <ChevronRight size={18} />
            </Link>
            <Link to="/community" className="btn btn-outline" style={{ padding: '16px 32px', borderRadius: '16px', fontSize: '1.05rem', fontWeight: 700, borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              Join Community Forum <Users size={18} />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .badge-primary { background: rgba(37, 99, 235, 0.12); color: var(--primary); padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-secondary { background: rgba(16, 185, 129, 0.12); color: #10b981; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge-tertiary { background: rgba(59, 130, 246, 0.12); color: #3b82f6; padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .bento-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: minmax(240px, auto);
          gap: 24px;
        }

        .bento-large {
          grid-column: span 2;
          grid-row: span 2;
          padding: 48px !important;
          background: linear-gradient(135deg, var(--surface), rgba(59, 130, 246, 0.04)) !important;
          display: flex;
          flex-direction: column;
          justifyContent: center;
        }

        .bento-medium {
          padding: 32px !important;
          display: flex;
          flex-direction: column;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bento-medium:hover, .bento-large:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        @media (max-width: 1024px) {
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .bento-large { grid-column: span 2; padding: 36px !important; }
        }

        @media (max-width: 768px) {
          .bento-grid { grid-template-columns: 1fr; }
          .bento-large { grid-column: span 1; grid-row: auto; padding: 28px !important; }
          .bento-medium { padding: 24px !important; }
        }
      `}</style>
    </div>
  );
};

export default Home;
