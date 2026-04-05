import React, { useState } from 'react';
import { Gift, ShieldCheck, Monitor, Key, Copy, CheckCircle2, Star, Sparkles, Zap, Award } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const GiveawayKeys = () => {
  const { t } = useLanguage();
  const [copiedKey, setCopiedKey] = useState(null);

  const keys = [
    {
      id: 1,
      title: "Microsoft Office 2021",
      category: "Productivity",
      icon: <Sparkles size={24} color="#00a1f1" />,
      description: "Full professional suite for students and developers.",
      total: 50,
      claimed: 42,
      availableKeys: ["BNJ87-TGH76-YUJ98-IUJ87-NBG65", "MKJ76-HBG54-YUJ98-IUJ87-NBG65"]
    },
    {
      id: 2,
      title: "Windows 11 Pro",
      category: "Operating System",
      icon: <Monitor size={24} color="#0078d4" />,
      description: "Genuine OEM license for performance and security.",
      total: 30,
      claimed: 28,
      availableKeys: ["W269N-WFGWX-YVC9B-4J6C9-T83GX"]
    },
    {
      id: 3,
      title: "Bitdefender Antivirus",
      category: "Security",
      icon: <ShieldCheck size={24} color="#e52e2a" />,
      description: "1-Year subscription for multi-device protection.",
      total: 20,
      claimed: 15,
      availableKeys: ["AV-BF-9876-5432-1098"]
    },
    {
      id: 4,
      title: "Kaspersky Total Security",
      category: "Security",
      icon: <Zap size={24} color="#006d5b" />,
      description: "Ultimate security suite for your digital life.",
      total: 15,
      claimed: 12,
      availableKeys: ["KTS-9988-7766-5544"]
    },
    {
      id: 5,
      title: "Adobe Creative Cloud",
      category: "Creative",
      icon: <Star size={24} color="#ff0000" />,
      description: "Access to Photoshop, Illustrator, and more.",
      total: 10,
      claimed: 10,
      availableKeys: []
    }
  ];

  const handleCopy = (keyText, id) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="giveaway-page">
      <div className="container">
        <header className="giveaway-header">
          <div className="glow-icon">
             <Gift size={48} className="gift-anim" />
          </div>
          <h1>{t('giveaway')} <span className="text-gradient">License Keys</span></h1>
          <p>Claim premium software keys shared by our community members and partners.</p>
        </header>

        <div className="keys-grid">
          {keys.map((item) => (
            <div key={item.id} className={`key-card ${item.claimed >= item.total ? 'out-of-stock' : ''}`}>
              <div className="card-badge">{item.category}</div>
              <div className="card-top">
                <div className="icon-wrapper">{item.icon}</div>
                <div className="title-box">
                  <h3>{item.title}</h3>
                  <div className="stock-info">
                    <div className="progress-bar">
                       <div className="progress-fill" style={{ width: `${(item.claimed / item.total) * 100}%` }} />
                    </div>
                    <span>{item.total - item.claimed} {t('left_count')}</span>
                  </div>
                </div>
              </div>

              <p className="card-desc">{item.description}</p>

              <div className="key-action-box">
                {item.availableKeys.length > 0 ? (
                  <div className="key-display">
                    <Key size={14} />
                    <code>{item.availableKeys[0].substring(0, 8)}...</code>
                    <button 
                      className={`copy-btn ${copiedKey === item.id ? 'copied' : ''}`}
                      onClick={() => handleCopy(item.availableKeys[0], item.id)}
                    >
                      {copiedKey === item.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      <span>{copiedKey === item.id ? t('copied') : t('copy')}</span>
                    </button>
                  </div>
                ) : (
                  <button className="claim-btn disabled">
                    <Award size={18} />
                    {t('fully_claimed')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <section className="donors-section">
           <div className="donors-header">
              <Award className="gold-icon" size={24} />
              <h2>Top Contributors</h2>
           </div>
           <div className="donor-avatars">
              <div className="donor-item">
                 <div className="avatar-mini">V</div>
                 <span>Vannak Tech</span>
              </div>
              <div className="donor-item">
                 <div className="avatar-mini">A</div>
                 <span>Admin PC</span>
              </div>
              <div className="donor-item">
                 <div className="avatar-mini">S</div>
                 <span>Sokha IT</span>
              </div>
           </div>
        </section>
      </div>

      <style>{`
        .giveaway-page { padding: 40px 0 100px; min-height: 80vh; }
        .giveaway-header { text-align: center; margin-bottom: 60px; max-width: 700px; margin-left: auto; margin-right: auto; }
        .glow-icon { 
          width: 90px; height: 90px; border-radius: 30px; 
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
          display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
          color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
        }
        .gift-anim { animation: giftFloat 3s infinite ease-in-out; }
        @keyframes giftFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(5deg); } }
        
        .giveaway-header h1 { font-size: 3rem; font-weight: 900; margin-bottom: 16px; letter-spacing: -1px; }
        .giveaway-header p { color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; }

        .keys-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; margin-bottom: 80px; }
        .key-card { 
          background: var(--bg-card); border: 1px solid var(--surface-border); border-radius: 24px; padding: 28px;
          position: relative; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); overflow: hidden;
        }
        .key-card:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .card-badge { position: absolute; top: 20px; right: 24px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--primary); background: var(--surface-badge); padding: 4px 10px; border-radius: 8px; }
        
        .card-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
        .icon-wrapper { width: 56px; height: 56px; border-radius: 16px; background: var(--surface-bg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .title-box h3 { font-size: 1.2rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
        .stock-info { display: flex; align-items: center; gap: 12px; }
        .progress-bar { width: 80px; height: 6px; background: var(--surface-border); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--primary); border-radius: 3px; }
        .stock-info span { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

        .card-desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px; }

        .key-action-box { margin-top: auto; }
        .key-display { 
          display: flex; align-items: center; gap: 10px; background: var(--surface-bg); 
          padding: 6px 6px 6px 14px; border-radius: 16px; border: 1px dashed var(--surface-border);
        }
        .key-display code { font-family: 'Courier New', Courier, monospace; font-weight: 700; color: var(--text-main); font-size: 0.95rem; }
        .copy-btn { 
          margin-left: auto; background: var(--primary); color: #fff; border: none; 
          padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.8rem;
          display: flex; align-items: center; gap: 6px; cursor: pointer; transition: 0.2s;
        }
        .copy-btn:hover { background: var(--secondary); transform: scale(1.05); }
        .copy-btn.copied { background: #10b981; }

        .out-of-stock { opacity: 0.8; }
        .out-of-stock:hover { transform: none; box-shadow: none; }
        .claim-btn.disabled { 
          width: 100%; height: 44px; border: none; background: var(--surface-border); 
          color: var(--text-muted); font-weight: 800; border-radius: 16px;
          display: flex; align-items: center; justify-content: center; gap: 8px; cursor: not-allowed;
        }

        .donors-section { background: var(--nav-bg); border: 1px solid var(--surface-border); border-radius: 28px; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
        .donors-header { display: flex; align-items: center; gap: 12px; }
        .gold-icon { color: #eab308; }
        .donors-header h2 { font-size: 1.1rem; color: var(--text-main); font-weight: 800; margin: 0; }
        .donor-avatars { display: flex; gap: 20px; }
        .donor-item { display: flex; align-items: center; gap: 8px; }
        .avatar-mini { width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.8rem; }
        .donor-item span { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }

        @media (max-width: 640px) {
          .giveaway-header h1 { font-size: 2.2rem; }
          .donors-section { flex-direction: column; text-align: center; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default GiveawayKeys;
