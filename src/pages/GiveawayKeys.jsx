import React, { useState, useMemo } from 'react';
import { Gift, ShieldCheck, Monitor, Key, Copy, CheckCircle2, Star, Sparkles, Zap, Award, Search, Filter, Rocket, Music, Lock, Heart, Clock, HelpCircle } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { SoftwareIcon } from './Software';

const GiveawayKeys = () => {
  const { t } = useLanguage();
  const [copiedKey, setCopiedKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const keys = [
    {
      id: 1,
      real_id: 'office-2021',
      title: "Microsoft Office 2021",
      category: "Productivity",
      icon: <SoftwareIcon id="office-2021" size={24} />,
      description: "Full professional suite for students and developers. Lifetime activation.",
      total: 100,
      claimed: 87,
      availableKeys: ["BNJ87-TGH76-YUJ98-IUJ87-NBG65", "MKJ76-HBG54-YUJ98-IUJ87-NBG65"]
    },
    {
      id: 2,
      real_id: 'windows-11',
      title: "Windows 11 Pro",
      category: "OS",
      icon: <SoftwareIcon id="windows-11" size={24} />,
      description: "Genuine OEM license for performance and modern security features.",
      total: 50,
      claimed: 48,
      availableKeys: ["W269N-WFGWX-YVC9B-4J6C9-T83GX"]
    },
    {
      id: 3,
      real_id: 'bitdefender',
      title: "Bitdefender Antivirus",
      category: "Security",
      icon: <SoftwareIcon id="bitdefender" size={24} />,
      description: "1-Year subscription for multi-device protection against malware.",
      total: 25,
      claimed: 15,
      availableKeys: ["AV-BF-9876-5432-1098"]
    },
    {
      id: 4,
      real_id: 'idm',
      title: "Internet Download Manager",
      category: "Tools",
      icon: <SoftwareIcon id="idm" size={24} />,
      description: "Full license for IDM. Accelerate your downloads up to 5 times.",
      total: 40,
      claimed: 32,
      availableKeys: ["IDM-KEY-7788-9900-1122"]
    },
    {
      id: 5,
      real_id: 'spotify',
      title: "Spotify Premium (6 Months)",
      category: "Entertainment",
      icon: <SoftwareIcon id="spotify" size={24} />,
      description: "Ad-free music listening, offline mode, and high-quality audio.",
      total: 20,
      claimed: 20,
      availableKeys: []
    },
    {
      id: 6,
      real_id: 'nordvpn',
      title: "NordVPN (1 Year)",
      category: "Security",
      icon: <SoftwareIcon id="nordvpn" size={24} />,
      description: "Privacy and security online with the world's leading VPN service.",
      total: 15,
      claimed: 11,
      availableKeys: ["NORD-VPN-PRIVACY-X9"]
    },
    {
      id: 7,
      real_id: 'kaspersky',
      title: "Kaspersky Total Security",
      category: "Security",
      icon: <SoftwareIcon id="kaspersky" size={24} />,
      description: "Ultimate security suite for your digital life and transactions.",
      total: 30,
      claimed: 24,
      availableKeys: ["KTS-9988-7766-5544"]
    },
    {
      id: 8,
      real_id: 'malwarebytes',
      title: "Malwarebytes Premium",
      category: "Security",
      icon: <SoftwareIcon id="malwarebytes" size={24} />,
      description: "Real-time protection against malicious websites and ransomware.",
      total: 20,
      claimed: 18,
      availableKeys: ["MB-PREM-4455-6677"]
    },
    {
      id: 9,
      real_id: 'adobe-cc',
      title: "Adobe Creative Cloud",
      category: "Design",
      icon: <SoftwareIcon id="adobe-cc" size={24} />,
      description: "Access to Photoshop, Illustrator, and Premiere Pro for 3 months.",
      total: 12,
      claimed: 12,
      availableKeys: []
    },
    {
        id: 10,
        real_id: 'youtube',
        title: "Youtube Premium (3 Months)",
        category: "Entertainment",
        icon: <SoftwareIcon id="youtube" size={24} />,
        description: "Ad-free Youtube videos, background play and Youtube Music.",
        total: 50,
        claimed: 45,
        availableKeys: ["YT-PREM-CODE-9988-11"]
    }
  ];

  const handleCopy = (keyText, id) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const categories = ['All', ...new Set(keys.map(k => k.category))];

  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      const matchesSearch = k.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           k.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || k.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', minHeight: '100vh' }}>
      
      {/* HERO SECTION */}
      <header style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'var(--primary)', filter: 'blur(200px)', opacity: 0.1, zIndex: -1 }} />
        
        <div className="badge-glow" style={{ marginBottom: '24px' }}>{t('new')} Program Keys</div>
        <h1 className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.03em' }}>
          {t('giveaway')} Licenses
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto 50px', lineHeight: 1.6 }}>
          Claim your genuine software keys shared by our global tech community. Updated every Sunday with premium resources.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 28px', borderRadius: '24px', maxWidth: '550px', width: '100%' }}>
            <Search size={22} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search for software titles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.1rem', width: '100%', outline: 'none', fontWeight: 500 }}
            />
          </div>
        </div>

        {/* CATEGORY FILTERS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button 
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '10px 24px',
                borderRadius: '16px',
                border: '1px solid var(--surface-border)',
                background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                color: activeCategory === cat ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeCategory === cat ? '0 10px 20px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* GRID */}
      <div className="card-grid" style={{ marginBottom: '100px' }}>
        {filteredKeys.length > 0 ? (
          filteredKeys.map((item) => (
            <div key={item.id} className="glass-panel luxury-card" style={{ padding: '32px', borderRadius: '32px', opacity: item.claimed >= item.total ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div className="icon-box" style={{ width: '64px', height: '64px', borderRadius: '18px' }}>{item.icon}</div>
                <div style={{ textAlign: 'right' }}>
                   <span className="version-tag" style={{ background: item.claimed >= item.total ? 'var(--surface-badge)' : 'rgba(5, 150, 105, 0.1)', color: item.claimed >= item.total ? 'var(--text-muted)' : '#10b981' }}>
                    {item.claimed >= item.total ? 'Depleted' : `${item.total - item.claimed} ${t('kb_left') || 'Left'}`}
                   </span>
                   <div className="mini-progress" style={{ width: '70px', height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
                      <div className="fill" style={{ height: '100%', background: item.claimed >= item.total ? 'var(--text-muted)' : 'var(--primary)', width: `${(item.claimed / item.total) * 100}%` }} />
                   </div>
                </div>
              </div>
              
              <div style={{ flexGrow: 1, marginBottom: '32px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.15em', marginBottom: '8px' }}>{item.category}</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>{item.description}</p>
              </div>

              <div style={{ marginTop: 'auto' }}>
                {item.availableKeys.length > 0 ? (
                  <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px', color: 'var(--text-main)', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                      <Lock size={14} style={{ opacity: 0.5 }} />
                      <code>{item.availableKeys[0].substring(0, 12)}...</code>
                    </div>
                    <button 
                      className={`btn ${copiedKey === item.id ? 'btn-success' : 'btn-primary'}`}
                      onClick={() => handleCopy(item.availableKeys[0], item.id)}
                      style={{
                        marginLeft: 'auto',
                        padding: '10px 20px',
                        borderRadius: '14px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: copiedKey === item.id ? '#10b981' : 'var(--primary)',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: '0.3s'
                      }}
                    >
                      {copiedKey === item.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copiedKey === item.id ? t('copied') : t('copy')}
                    </button>
                  </div>
                ) : (
                  <div className="glass-panel" style={{ padding: '14px', borderRadius: '18px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                     <Award size={18} /> {t('fully_claimed')}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state glass-panel" style={{ borderRadius: '32px' }}>
             <Search size={64} style={{ opacity: 0.1 }} />
             <p>No giveaway programs found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* RECENT DONORS / STATS */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
         <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-around', padding: '40px', borderRadius: '40px', flexWrap: 'wrap', gap: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div className="icon-box" style={{ width: '56px', height: '56px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}><Zap size={24} /></div>
               <div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>5,200+</div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Keys Shared</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div className="icon-box" style={{ width: '56px', height: '56px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><Heart size={24} /></div>
               <div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>1,200</div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Donors</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div className="icon-box" style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><Clock size={24} /></div>
               <div><div style={{ fontSize: '1.5rem', fontWeight: 900 }}>24h</div><div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Update Cycle</div></div>
            </div>
         </div>
         
         <div className="glass-panel" style={{ padding: '60px', borderRadius: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
               <div style={{ background: 'rgba(251, 191, 36, 0.1)', padding: '12px', borderRadius: '16px' }}>
                 <Star style={{ color: '#fbbf24' }} size={24} />
               </div>
               <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Hall of Contributors</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
               {[
                 { name: "Vannak Tech", keys: 120, initial: "V", color: 'var(--primary)' },
                 { name: "Admin PC", keys: 85, initial: "A", color: '#8b5cf6' },
                 { name: "Sokha IT", keys: 62, initial: "S", color: '#10b981' },
                 { name: "Nita Dev", keys: 45, initial: "N", color: '#ec4899' }
               ].map(d => (
                 <div key={d.name} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ 
                      width: '54px', height: '54px', borderRadius: '18px', background: d.color,
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '1.2rem', fontWeight: 900, boxShadow: `0 8px 20px ${d.color}30`
                    }}>{d.initial}</div>
                    <div>
                       <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>{d.name}</div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>{d.keys} Keys donated</div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};


export default GiveawayKeys;
