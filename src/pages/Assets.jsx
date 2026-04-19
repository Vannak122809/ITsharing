import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, X, Filter, Image as ImageIcon, Layout, Sparkles, Heart, Share2, MoreHorizontal, Folder, Image, Layers, Zap, Star, ShieldCheck, Maximize, FileText, CheckCircle2, Box, Menu } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

import { featuredAssets } from '../data/assetsData';

const AssetCard = ({ asset, onClick }) => {
    const [imgIndex, setImgIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const gallery = asset.gallery && asset.gallery.length > 0 ? asset.gallery : [asset.url];

    useEffect(() => {
        let interval;
        if (isHovered && gallery.length > 1) {
            interval = setInterval(() => {
                setImgIndex(prev => (prev + 1) % gallery.length);
            }, 1000);
        } else {
            setImgIndex(0);
        }
        return () => clearInterval(interval);
    }, [isHovered, gallery.length]);

    return (
        <div 
            onClick={() => onClick(asset)} 
            className="asset-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="card-media">
                <img src={gallery[imgIndex]} alt={asset.title} loading="lazy" />
                {asset.featured && (
                    <div className="featured-badge"><Zap size={10} fill="#fff" /> FEATURED</div>
                )}
                {gallery.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 3, display: 'flex', gap: '6px' }}>
                        {gallery.map((_, i) => (
                            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.4)', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
                        ))}
                    </div>
                )}
                <div className="card-overlay">
                    <div className="quick-view-btn">VIEW DETAILS</div>
                </div>
            </div>
            <div className="card-info">
                <h4>{asset.title}</h4>
                <span className="type-badge">{asset.type.split(' ')[0]}</span>
            </div>
        </div>
    );
};

const Assets = () => {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [dbAssets, setDbAssets] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [activeModalImageIndex, setActiveModalImageIndex] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async (asset) => {
        if (!asset) return;
        setIsDownloading(true);
        try {
            const url = asset.sourceUrl || asset.url;
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            const ext = url.split('.').pop().split('?')[0] || 'png';
            link.download = `${asset.title}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('ការទាញយកមានបញ្ហា! សូមពិនិត្យមើលការកំណត់ CORS នៅក្នុង Cloudflare R2 ឬប្រើ Right Click -> Save Image As ជំនួសវិញ។');
            // Fallback
            window.open(asset.sourceUrl || asset.url, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Optimized categories memo
    const categories = useMemo(() => [
        { id: 'All', name: t('all'), icon: <Layout size={18} /> },
        { id: 'Chinese New Year', name: 'Chinese New Year', icon: <Star size={18} /> },
        { id: 'Khmer New Year', name: 'Khmer New Year', icon: <Sparkles size={18} /> },
        { id: 'Luxury', name: 'Luxury Assets', icon: <Zap size={18} /> },
        { id: 'Frame', name: 'Frames', icon: <Box size={18} /> },
        { id: 'Template', name: 'Templates', icon: <Layers size={18} /> },
        { id: 'Illustration', name: 'Illustrations', icon: <ImageIcon size={18} /> },
        { id: 'Image', name: 'Image', icon: <Image size={18} /> }
    ], [t]);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
        const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
        const unsubDocs = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDbAssets(data);
        });
        return () => { unsubAuth(); unsubDocs(); };
    }, []);

    const allAssets = useMemo(() => [...featuredAssets, ...dbAssets], [dbAssets]);

    const filteredAssets = useMemo(() => {
        const queryStr = searchQuery.toLowerCase().trim();
        return allAssets.filter(asset => {
            // Updated filtering logic to support dual categorization (Type or Tag matches)
            const matchesTab = activeTab === 'All' || 
                             asset.type === activeTab || 
                             asset.collection === activeTab ||
                             (activeTab === 'Khmer New Year' && asset.tags?.some(tag => tag.toLowerCase() === 'khmer new year')) ||
                             (activeTab === 'Chinese New Year' && asset.tags?.some(tag => tag.toLowerCase() === 'chinese new year'));
            
            if (!matchesTab) return false;
            return !queryStr || asset.title?.toLowerCase().includes(queryStr) || 
                   asset.tags?.some(tag => tag.toLowerCase().includes(queryStr));
        });
    }, [allAssets, activeTab, searchQuery]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '80px' }}>
            
            {/* HERO SECTION */}
            <section className="assets-hero">
                <div className="hero-bg" style={{ 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1964")'
                }} />
                <div className="hero-content">
                    <h1>{t('premium_stock_assets')}</h1>
                    <div className="search-bar-container glass-panel">
                        <div className="search-input-wrapper">
                            <Search className="search-icon-mobile" color="var(--text-muted)" size={20} />
                            <input 
                                type="text" placeholder={t('search_assets_placeholder')} 
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary search-submit-btn">
                            <span className="desktop-search-text">{t('search')}</span>
                            <Search className="mobile-search-icon" size={18} />
                        </button>
                    </div>
                </div>
            </section>

            <div className="container assets-explorer-grid">
                
                {/* SIDEBAR - Responsive Stacking */}
                <aside className={`explorer-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                    <div className="sidebar-inner glass-panel">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 className="sidebar-title"><Folder size={16} /> COLLECTIONS</h2>
                            <button className="mobile-only-close" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="category-list">
                            {categories.map(cat => (
                                <button
                                    key={cat.id} onClick={() => { setActiveTab(cat.id); setMobileMenuOpen(false); }}
                                    className={`category-btn ${activeTab === cat.id ? 'active' : ''}`}
                                >
                                    <span>{cat.icon}</span> {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT Area */}
                <main className="explorer-main">
                    <div className="explorer-header">
                        <div>
                            <h2 className="main-title">{activeTab === 'All' ? 'Latest Discoveries' : activeTab}</h2>
                            <p className="subtitle">Found {filteredAssets.length} premium resources</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button className="mobile-menu-trigger btn btn-outline" onClick={() => setMobileMenuOpen(true)}>
                                <Menu size={20} />
                            </button>
                            <button className="btn btn-outline tablet-plus-only"><Filter size={18} /> Filters</button>
                        </div>
                    </div>

                    <div className="asset-grid">
                        {filteredAssets.map(asset => (
                            <AssetCard key={asset.id} asset={asset} onClick={(a) => {
                                setSelectedAsset(a);
                                setActiveModalImageIndex(0);
                            }} />
                        ))}
                    </div>

                    {filteredAssets.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '100px 0' }}>
                            <Sparkles size={48} color="var(--primary)" style={{ marginBottom: '24px' }} />
                            <h3 style={{ color: 'var(--text-main)', fontWeight: 900 }}>{t('no_matches_found')}</h3>
                        </div>
                    )}
                </main>
            </div>

            {/* VIEWER MODAL - Responsive Stacking */}
            {selectedAsset && (
                <div className="asset-viewer-modal">
                    <div className="modal-container">
                        <div className="modal-header">
                            <div className="header-brand">
                                <div className="brand-icon">IT</div>
                                <div>
                                    <h3>{selectedAsset.title}</h3>
                                    <span>{selectedAsset.type === 'Khmer New Year' ? 'Official Holiday Asset' : 'Premium Stock Resource'}</span>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedAsset(null)}><X size={24} /></button>
                        </div>

                        <div className="modal-content">
                            <div className="preview-section" style={{ flexDirection: 'column', gap: '20px' }}>
                                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                    <img 
                                        src={selectedAsset.gallery?.length > 0 ? selectedAsset.gallery[activeModalImageIndex] : selectedAsset.url} 
                                        alt={selectedAsset.title} 
                                    />
                                </div>
                                {selectedAsset.gallery && selectedAsset.gallery.length > 1 && (
                                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '10px', maxWidth: '100%', justifyContent: 'center' }}>
                                        {selectedAsset.gallery.map((imgUrl, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => setActiveModalImageIndex(i)}
                                                style={{ 
                                                    width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: i === activeModalImageIndex ? '2px solid var(--primary)' : '2px solid transparent', opacity: i === activeModalImageIndex ? 1 : 0.6, transition: '0.3s'
                                                }}
                                            >
                                                <img src={imgUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="details-section">
                                <div className="download-cta glass-panel">
                                    <h4 className="cta-label">Download Resource</h4>
                                    <button 
                                        onClick={() => handleDownload(selectedAsset)}
                                        disabled={isDownloading}
                                        className="btn btn-primary download-btn"
                                    >
                                        <Download size={22} /> 
                                        {isDownloading ? 'Downloading...' : (selectedAsset.format || 'Download Resource')}
                                    </button>
                                    <div className="cta-meta">
                                        <CheckCircle2 size={14} color="var(--tertiary)" />
                                        <span>High Quality PSD / Vector included</span>
                                    </div>
                                </div>

                                <section className="technical-info">
                                    <h5>Technical Information</h5>
                                    <div className="tech-grid">
                                        <div><label>Dimensions</label><p>{selectedAsset.dimensions || 'High-Res'}</p></div>
                                        <div><label>File Size</label><p>{selectedAsset.size || 'Varies'}</p></div>
                                        <div><label>Format</label><p>{selectedAsset.format?.replace(' Image', '').replace('Photoshop ', '') || 'Asset'}</p></div>
                                        <div><label>Quality</label><p>{selectedAsset.dpi || 'Print Ready'}</p></div>
                                    </div>
                                </section>

                                <section className="tags-info">
                                    <h5>Keywords</h5>
                                    <div className="tag-list">
                                        {selectedAsset.tags?.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .assets-hero { height: 340px; position: relative; display: flex; flex-direction: column; alignItems: center; justifyContent: center; textAlign: center; overflow: hidden; margin-bottom: 40px; }
                .hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; filter: brightness(0.5); transform: translateZ(0); }
                .hero-content { position: relative; z-index: 1; padding: 0 24px; max-width: 800px; width: 100%; margin: 0 auto; }
                .hero-content h1 { color: #fff; font-size: 3.5rem; font-weight: 900; margin-bottom: 24px; letter-spacing: -0.04em; }
                
                .search-bar-container { background: #fff !important; border-radius: 24px; padding: 6px; display: flex; align-items: center; gap: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); width: 100%; }
                .search-input-wrapper { display: flex; align-items: center; gap: 12px; flex-grow: 1; padding-left: 16px; min-width: 0; }
                .search-input-wrapper input { border: none; outline: none; flex-grow: 1; font-size: 1.1rem; color: #111; font-weight: 500; background: transparent; width: 100%; }
                .search-submit-btn { padding: 12px 28px; border-radius: 18px; display: flex; align-items: center; justify-content: center; min-width: fit-content; }
                .mobile-search-icon { display: none; }
                
                .assets-explorer-grid { display: grid; grid-template-columns: 280px 1fr; gap: 32px; max-width: 1440px; }
                .sidebar-inner { padding: 24px; border-radius: 32px; position: sticky; top: 100px; border: 1px solid var(--surface-border); }
                .sidebar-title { font-size: 0.8rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; display: flex; align-items: center; gap: 10px; }
                .category-list { display: flex; flex-direction: column; gap: 6px; }
                .category-btn { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; border: none; cursor: pointer; transition: 0.2s; font-size: 0.95rem; font-weight: 500; background: transparent; color: var(--text-main); text-align: left; }
                .category-btn.active { background: var(--primary) !important; color: #fff !important; font-weight: 800; }
                .mobile-only-close { display: none; }
                
                .explorer-header { display: flex; align-items: center; justifyContent: space-between; margin-bottom: 32px; }
                .main-title { font-size: 2rem; font-weight: 900; margin-bottom: 4px; }
                .subtitle { color: var(--text-muted); }
                .mobile-menu-trigger { display: none; }
                
                .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 28px; }
                .asset-card { border-radius: 24px; overflow: hidden; cursor: zoom-in; position: relative; background: var(--card-dark); border: 1px solid var(--surface-border); height: 320px; display: flex; flex-direction: column; transition: 0.3s; will-change: transform; }
                .card-media { height: 75%; overflow: hidden; position: relative; }
                .card-media img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s; }
                .featured-badge { position: absolute; top: 16px; right: 16px; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; font-size: 0.6rem; font-weight: 900; padding: 4px 10px; border-radius: 40px; z-index: 2; display: flex; align-items: center; gap: 4px; }
                .card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; display: flex; align-items: center; justify-content: center; transition: 0.3s; backdrop-filter: blur(4px); }
                .quick-view-btn { background: #fff; color: #000; padding: 10px 20px; border-radius: 40px; font-weight: 800; }
                .card-info { padding: 20px; flex-grow: 1; display: flex; align-items: center; justify-content: space-between; }
                .type-badge { background: var(--surface-badge); color: var(--primary); padding: 4px 10px; border-radius: 8px; font-size: 0.6rem; font-weight: 900; }
                
                .asset-card:hover { transform: translateY(-8px); border-color: var(--primary); }
                .asset-card:hover .card-media img { transform: scale(1.05); }
                .asset-card:hover .card-overlay { opacity: 1; }

                .asset-viewer-modal { position: fixed; inset: 0; background: var(--nav-bg); z-index: 20000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(30px); }
                .modal-container { width: 100%; height: 100%; display: flex; flex-direction: column; }
                .modal-header { padding: 18px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-border); background: var(--surface); position: relative; }
                .close-btn { position: absolute; top: 20px; right: 40px; width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.05); color: var(--text-main); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.05); z-index: 100; }
                .close-btn:hover { background: #ff4d4d; color: white; transform: rotate(90deg) scale(1.1); border-color: #ff4d4d; box-shadow: 0 10px 25px rgba(255, 77, 77, 0.4); }
                .header-brand { display: flex; align-items: center; gap: 20px; }
                .brand-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; }
                .modal-content { flex-grow: 1; display: flex; overflow: hidden; }
                .preview-section { flex-grow: 1; display: flex; align-items: center; justify-content: center; padding: 60px; background: var(--bg-color); }
                .preview-section img { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: var(--shadow-glass); border-radius: 24px; border: 1px solid var(--surface-border); }
                .details-section { width: 460px; background: var(--surface); border-left: 1px solid var(--surface-border); padding: 48px; overflow-y: auto; display: flex; flex-direction: column; gap: 32px; }
                .download-cta { padding: 32px; border-radius: 28px; background: var(--bg-color); border: 1px solid var(--surface-border); }
                .cta-label { color: var(--text-main); font-size: 0.95rem; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; }
                .download-btn { width: 100%; padding: 18px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 1.1rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .cta-meta { margin-top: 16px; display: flex; align-items: center; gap: 8px; opacity: 0.7; justify-content: center; font-size: 0.8rem; }
                .tech-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .tech-grid label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
                .tech-grid p { font-weight: 700; }
                .tag-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .tag { background: var(--surface-badge); color: var(--primary); padding: 6px 14px; border-radius: 40px; font-size: 0.8rem; font-weight: 700; border: 1px solid var(--surface-border); }

                /* MEDIA QUERIES */
                @media (max-width: 1024px) {
                    .assets-explorer-grid { grid-template-columns: 1fr; }
                    .explorer-sidebar { display: none; position: fixed; top: 0; left: 0; width: 300px; height: 100vh; z-index: 10000; background: var(--bg-color); }
                    .explorer-sidebar.open { display: block; animation: slideIn 0.3s ease; }
                    .mobile-menu-trigger { display: block; }
                    .tablet-plus-only { display: none; }
                    .mobile-only-close { display: block; }
                    .hero-content h1 { font-size: 2.5rem; }
                    .modal-content { flex-direction: column; overflow-y: auto; }
                    .details-section { width: 100%; border-left: none; border-top: 1px solid var(--surface-border); padding: 32px; overflow-y: visible; }
                    .preview-section { padding: 32px; }
                }

                @media (max-width: 600px) {
                    .search-bar-container { border-radius: 16px; padding: 4px; }
                    .search-input-wrapper { padding-left: 12px; gap: 8px; }
                    .search-input-wrapper input { font-size: 0.95rem; }
                    .search-submit-btn { padding: 10px 16px; border-radius: 12px; }
                    .desktop-search-text { display: none; }
                    .mobile-search-icon { display: block; }
                    .search-icon-mobile { width: 18px; height: 18px; }
                    .hero-content { padding: 0 16px; }
                    .hero-content h1 { font-size: 2rem; margin-bottom: 16px; }
                    .assets-hero { height: 280px; }
                }

                @media (max-width: 480px) {
                    .main-title { font-size: 1.5rem; }
                    .asset-grid { grid-template-columns: 1fr; }
                    .modal-header { padding: 12px 20px; }
                    .header-brand h3 { font-size: 1rem; }
                    .details-section { padding: 20px; }
                }

                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default Assets;
