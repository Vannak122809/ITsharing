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
    <div className="giveaway-page">
      <div className="container">
        
        {/* HERO SECTION */}
        <header className="giveaway-hero">
          <div className="badge-glow">{t('new')} Program Keys</div>
          <h1 className="hero-title">{t('giveaway')} <span className="text-gradient">Premium Licenses</span></h1>
          <p className="hero-subtitle">Claim your genuine software keys shared by our global tech community. Updated every Sunday.</p>
          
          <div className="search-pill-container">
            <div className="search-pill">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search for software titles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* CATEGORY FILTERS */}
        <div className="category-scroller">
          {categories.map(cat => (
            <button 
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="keys-grid">
          {filteredKeys.length > 0 ? (
            filteredKeys.map((item) => (
              <div key={item.id} className={`key-card-lux ${item.claimed >= item.total ? 'depleted' : ''}`}>
                <div className="card-inner">
                  <div className="top-row">
                    <div className="item-icon">{item.icon}</div>
                    <div className="item-stock">
                       <span className="stock-count">{item.total - item.claimed} {t('left_count')}</span>
                       <div className="mini-progress">
                          <div className="fill" style={{ width: `${(item.claimed / item.total) * 100}%` }} />
                       </div>
                    </div>
                  </div>
                  
                  <div className="content-box">
                    <div className="item-cat">{item.category}</div>
                    <h3 className="item-title">{item.title}</h3>
                    <p className="item-desc">{item.description}</p>
                  </div>

                  <div className="action-row">
                    {item.availableKeys.length > 0 ? (
                      <div className="key-reveal-box">
                        <div className="blur-key">
                          <Key size={14} className="k-icon" />
                          <code>{item.availableKeys[0].substring(0, 10)}...</code>
                        </div>
                        <button 
                          className={`copy-lux ${copiedKey === item.id ? 'copied' : ''}`}
                          onClick={() => handleCopy(item.availableKeys[0], item.id)}
                        >
                          {copiedKey === item.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          <span>{copiedKey === item.id ? t('copied') : t('copy')}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="fully-taken">
                         <Award size={18} /> {t('fully_claimed')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-keys">
               <HelpCircle size={48} />
               <p>No giveaway programs found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* RECENT DONORS / STATS */}
        <section className="premium-donors">
           <div className="stats-strip">
              <div className="stat-item">
                 <Zap size={20} color="var(--primary)" />
                 <div><div className="num">5,200+</div><div className="lab">Keys Shared</div></div>
              </div>
              <div className="stat-item">
                 <Heart size={20} color="#ff2a7a" />
                 <div><div className="num">1,200</div><div className="lab">Donors</div></div>
              </div>
              <div className="stat-item">
                 <Clock size={20} color="#00fa9a" />
                 <div><div className="num">24h</div><div className="lab">Avg Update</div></div>
              </div>
           </div>
           
           <div className="contributor-panel">
              <div className="panel-header">
                 <Star className="star-pulse" size={20} />
                 <h3>Hall of Contributors</h3>
              </div>
              <div className="donor-cards">
                 {[
                   { name: "Vannak Tech", keys: 120, initial: "V" },
                   { name: "Admin PC", keys: 85, initial: "A" },
                   { name: "Sokha IT", keys: 62, initial: "S" },
                   { name: "Nita Dev", keys: 45, initial: "N" }
                 ].map(d => (
                   <div key={d.name} className="donor-mini-card">
                      <div className="avatar-orb">{d.initial}</div>
                      <div className="info">
                         <span className="n">{d.name}</span>
                         <span className="k">{d.keys} Keys donated</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </div>

      <style>{`
        .giveaway-page { padding: 80px 0 120px; background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.05) 0%, transparent 40%); }
        
        .giveaway-hero { text-align: center; margin-bottom: 60px; position: relative; }
        .badge-glow { 
          display: inline-block; padding: 6px 16px; border-radius: 40px; 
          background: rgba(99, 102, 241, 0.1); color: var(--primary);
          font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;
          margin-bottom: 24px; border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }
        .hero-title { font-size: 4rem; font-weight: 900; letter-spacing: -2px; margin-bottom: 20px; color: var(--text-main); }
        .hero-subtitle { font-size: 1.25rem; color: var(--text-muted); max-width: 600px; margin: 0 auto 40px; line-height: 1.6; }

        .search-pill-container { display: flex; justify-content: center; }
        .search-pill { 
          display: flex; align-items: center; gap: 12px; background: var(--nav-bg);
          border: 1px solid var(--surface-border); padding: 12px 24px; border-radius: 40px;
          max-width: 500px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: all 0.3s;
        }
        .search-pill:focus-within { border-color: var(--primary); transform: scale(1.02); box-shadow: 0 15px 40px rgba(99, 102, 241, 0.15); }
        .search-pill input { background: none; border: none; color: var(--text-main); font-size: 1rem; width: 100%; outline: none; }
        .search-icon { color: var(--text-muted); }

        .category-scroller { display: flex; justify-content: center; gap: 12px; margin-bottom: 60px; flex-wrap: wrap; }
        .cat-btn { 
          background: var(--nav-bg); border: 1px solid var(--surface-border); color: var(--text-muted);
          padding: 8px 20px; border-radius: 30px; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; transition: all 0.2s;
        }
        .cat-btn:hover { border-color: var(--primary); color: var(--text-main); }
        .cat-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }

        .keys-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 28px; margin-bottom: 100px; }
        
        .key-card-lux { 
          background: var(--nav-bg); border: 1px solid var(--surface-border); border-radius: 32px;
          position: relative; transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1); overflow: hidden;
        }
        .key-card-lux:hover { transform: translateY(-12px); border-color: var(--primary); box-shadow: 0 30px 60px rgba(0,0,0,0.2); }
        .card-inner { padding: 32px; display: flex; flex-direction: column; height: 100%; }

        .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .item-icon { 
          width: 60px; height: 60px; border-radius: 20px; background: var(--surface-badge); 
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .item-stock { text-align: right; }
        .stock-count { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .mini-progress { width: 60px; height: 4px; background: var(--surface-border); border-radius: 2px; margin-top: 6px; overflow: hidden; }
        .mini-progress .fill { height: 100%; background: var(--primary); border-radius: 2px; }

        .item-cat { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 1px; margin-bottom: 8px; }
        .item-title { font-size: 1.4rem; font-weight: 900; color: var(--text-main); margin-bottom: 12px; }
        .item-desc { font-size: 0.95rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 30px; flex-grow: 1; }

        .action-row { margin-top: auto; }
        .key-reveal-box { 
          display: flex; align-items: center; gap: 4px; background: var(--surface-badge);
          padding: 6px; border-radius: 20px; border: 1px solid var(--surface-border);
        }
        .blur-key { 
          display: flex; align-items: center; gap: 8px; padding-left: 12px;
          color: var(--text-main); font-weight: 700; font-family: monospace;
        }
        .k-icon { color: var(--text-muted); }
        .copy-lux { 
          margin-left: auto; background: var(--primary); color: #fff; border: none;
          padding: 10px 20px; border-radius: 16px; font-weight: 800; font-size: 0.85rem;
          display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.3s;
        }
        .copy-lux:hover { filter: brightness(1.1); transform: translateX(2px); }
        .copy-lux.copied { background: #10b981; }

        .fully-taken { 
          width: 100%; background: var(--surface-badge); color: var(--text-muted);
          padding: 12px; border-radius: 20px; text-align: center; font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          opacity: 0.7;
        }

        .no-keys { grid-column: 1 / -1; text-align: center; padding: 100px 0; color: var(--text-muted); }

        .premium-donors { display: flex; flex-direction: column; gap: 40px; }
        .stats-strip { 
          display: flex; justify-content: space-around; background: var(--nav-bg);
          border: 1px solid var(--surface-border); border-radius: 32px; padding: 32px;
          flex-wrap: wrap; gap: 24px;
        }
        .stat-item { display: flex; align-items: center; gap: 16px; }
        .stat-item .num { font-size: 1.4rem; font-weight: 900; color: var(--text-main); }
        .stat-item .lab { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }

        .contributor-panel { background: var(--nav-bg); border: 1px solid var(--surface-border); border-radius: 32px; padding: 40px; }
        .panel-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .panel-header h3 { font-size: 1.25rem; font-weight: 900; margin: 0; }
        .star-pulse { color: #eab308; animation: starPulse 2s infinite; }
        @keyframes starPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.7; } }

        .donor-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
        .donor-mini-card { 
          display: flex; align-items: center; gap: 16px; background: var(--surface-badge);
          padding: 16px 20px; border-radius: 20px; border: 1px solid var(--surface-border);
          transition: 0.2s;
        }
        .donor-mini-card:hover { transform: scale(1.03); border-color: var(--primary); }
        .avatar-orb { 
          width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary));
          color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900;
        }
        .donor-mini-card .info { display: flex; flex-direction: column; }
        .info .n { font-weight: 800; color: var(--text-main); }
        .info .k { font-size: 0.75rem; color: var(--text-muted); }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .hero-subtitle { font-size: 1.1rem; }
          .contributor-panel { padding: 24px; }
        }
      `}</style>
    </div>
  );
};

export default GiveawayKeys;
