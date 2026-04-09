import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, X, Filter, Image as ImageIcon, Layout, Sparkles, Heart, Share2, MoreHorizontal, Folder, Image, Layers, Zap, Star, ShieldCheck, Maximize, FileText, CheckCircle2, Box, Menu } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

// Featured Static Assets (Full Collection) - Defined outside component to prevent re-declarations
const featuredAssets = [
    {
        id: 'kny-7',
        title: 'សួស្ដីឆ្នាំថ្មី - Premium KKS 008',
        type: 'Frame',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/photo_2026-04-08_13-51-08.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/KKS_008.psd',
        tags: ['khmer new year', 'kny', 'psd', 'frame'],
        downloads: 1560, likes: 620, featured: true, dimensions: 'High-Res PSD', size: '54.2 MB', dpi: '300 DPI'
    },
    {
        id: 'kny-8',
        title: 'សួស្ដីឆ្នាំថ្មី - Premium KKS 019',
        type: 'Frame',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/KKS_019.png',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/KKS_019.psd',
        tags: ['khmer new year', 'kny', 'psd', 'frame'],
        downloads: 2100, likes: 840, featured: true, dimensions: 'Master PSD', size: '48.5 MB', dpi: 'Editable'
    },
    {
        id: 'kny-9',
        title: 'សួស្ដីឆ្នាំថ្មី - Premium KKS 016',
        type: 'Frame',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/photo_2026-04-08_13-50-40.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/KKS_016.psd',
        tags: ['khmer new year', 'kny', 'psd', 'frame'],
        downloads: 1890, likes: 710, featured: true, dimensions: '4000x3000 px', size: '51.3 MB', dpi: '300 DPI'
    },
    {
        id: 'kny-1',
        title: 'សួស្ដីឆ្នាំថ្មី - Official KNY Poster 2026',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/d5c7c377-e3a2-4d0f-bf0b-af8e112825e6.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/d5c7c377-e3a2-4d0f-bf0b-af8e112825e6.eps',
        tags: ['khmer new year', 'kny', 'សួស្ដីឆ្នាំថ្មី', '2026', 'poster'],
        downloads: 4200, likes: 1800, featured: true, dimensions: 'Vector Scalable', size: '24.5 MB', dpi: '300 DPI'
    },
    {
        id: 'kny-2',
        title: 'សួស្ដីឆ្នាំថ្មី - Festive Celebration Banner',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/363d572d-1337-46a6-8579-2f01e21eb4b7.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/363d572d-1337-46a6-8579-2f01e21eb4b7.eps',
        tags: ['khmer new year', 'kny', 'banner', 'festive'],
        downloads: 3100, likes: 1450, featured: true, dimensions: 'Print Ready', size: '18.2 MB', dpi: 'High Res'
    },
    {
        id: 'kny-3',
        title: 'សួស្ដីឆ្នាំថ្មី - Traditional Art Elements',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/8107f372-6c18-4aaf-b04a-98d44c82d0ed.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/8107f372-6c18-4aaf-b04a-98d44c82d0ed.eps',
        tags: ['khmer new year', 'kny', 'traditional', 'art'],
        downloads: 2800, likes: 920, featured: true, dimensions: 'Vector AI/EPS', size: '12.8 MB', dpi: 'Clean'
    },
    {
        id: 'kny-4',
        title: 'សួស្ដីឆ្នាំថ្មី - Khmer Decor Collection',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/192ef4fb-5f1d-4ef2-a7b4-a00f9518b365.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/192ef4fb-5f1d-4ef2-a7b4-a00f9518b365.eps',
        tags: ['khmer new year', 'kny', 'decor', 'bundle'],
        downloads: 5120, likes: 2100, featured: true, dimensions: 'Original Vector', size: '32.1 MB', dpi: '300 DPI'
    },
    {
        id: 'kny-5',
        title: 'សួស្ដីឆ្នាំថ្មី - Typography 2026 Collection',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/Text%202026.webp',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/drive-download-20260408T092432Z-3-001.zip',
        tags: ['khmer new year', 'kny', 'typography', '2026', 'text'],
        downloads: 6400, likes: 3200, featured: true, dimensions: 'Multi-Format ZIP', size: '45.0 MB', dpi: 'Editable'
    },
    {
        id: 'kny-6',
        title: 'សួស្ដីឆ្នាំថ្មី - KKS Premium Design',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/photo_2026-04-08_13-51-24.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/KKS_061.psd',
        tags: ['khmer new year', 'kny', 'kks', 'design', 'psd'],
        downloads: 1200, likes: 540, featured: true, dimensions: '4000 x 3000 px', size: '61.0 MB', dpi: 'Lossless PSD'
    },
    {
        id: 'feat-a',
        title: 'សួស្ដីឆ្នាំថ្មី - KNY Modern Poster',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/4382dac1-b79a-48ea-947e-e664310f4c0c.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/4382dac1-b79a-48ea-947e-e664310f4c0c.eps',
        tags: ['khmer new year', 'kny', 'សួស្ដីឆ្នាំថ្មី'],
        downloads: 2450, likes: 1200, featured: true, dimensions: '3508 x 2480 px', size: '12.4 MB', dpi: '300 DPI'
    },
    {
        id: 'feat-b',
        title: 'សួស្ដីឆ្នាំថ្មី - Celebration Art',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/eae75759-b594-4a81-b5c5-ae0d7770586f.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/eae75759-b594-4a81-b5c5-ae0d7770586f.eps',
        tags: ['khmer new year', 'kny'],
        downloads: 1890, likes: 950, featured: true, dimensions: 'Vector Scalable', size: '8.2 MB', dpi: 'Print Ready'
    },
    {
        id: 'feat-c',
        title: 'សួស្ដីឆ្នាំថ្មី - Traditional Pattern HQ',
        type: 'Khmer New Year',
        format: 'Photoshop (PSD)',
        url: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/b145780a-817a-41d7-b4b2-d8d8e7d8daeb.jpg',
        sourceUrl: 'https://pub-337d5bdcb73d4c85a90006cf59c8c399.r2.dev/b145780a-817a-41d7-b4b2-d8d8e7d8daeb.eps',
        tags: ['khmer new year', 'kny', 'pattern'],
        downloads: 3200, likes: 1540, featured: true, dimensions: '4000 x 3000 px', size: '15.1 MB', dpi: 'HQ Quality'
    }
];

const Assets = () => {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [dbAssets, setDbAssets] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Optimized categories memo
    const categories = useMemo(() => [
        { id: 'All', name: t('all'), icon: <Layout size={18} /> },
        { id: 'Khmer New Year', name: 'Khmer New Year', icon: <Sparkles size={18} /> },
        { id: 'Frame', name: 'Frames', icon: <Box size={18} /> },
        { id: 'Template', name: 'Templates', icon: <Layers size={18} /> },
        { id: 'Illustration', name: 'Illustrations', icon: <ImageIcon size={18} /> },
        { id: 'Image', name: 'Stock Photos', icon: <Image size={18} /> }
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
            const matchesTab = activeTab === 'All' || asset.type === activeTab;
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
                            <div key={asset.id} onClick={() => setSelectedAsset(asset)} className="asset-card">
                                <div className="card-media">
                                    <img src={asset.url} alt={asset.title} loading="lazy" />
                                    {asset.featured && (
                                        <div className="featured-badge"><Zap size={10} fill="#fff" /> FEATURED</div>
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
                                    <span>Premium Verified Template</span>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedAsset(null)}><X size={24} /></button>
                        </div>

                        <div className="modal-content">
                            <div className="preview-section">
                                <img src={selectedAsset.url} alt={selectedAsset.title} />
                            </div>

                            <div className="details-section">
                                <div className="download-cta glass-panel">
                                    <h4 className="cta-label">Download Resource</h4>
                                    <a href={selectedAsset.sourceUrl || selectedAsset.url} download={selectedAsset.title} target="_blank" className="btn btn-primary download-btn">
                                        <Download size={22} /> {selectedAsset.format || 'Photoshop (PSD)'}
                                    </a>
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
                                        <div><label>Format</label><p>PSD / EPS</p></div>
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
                .modal-header { padding: 16px 48px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--surface-border); background: var(--surface); }
                .header-brand { display: flex; align-items: center; gap: 20px; }
                .brand-icon { width: 40px; height: 40px; border-radius: 12px; background: var(--primary); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; }
                .modal-content { flex-grow: 1; display: flex; overflow: hidden; }
                .preview-section { flex-grow: 1; display: flex; align-items: center; justify-content: center; padding: 60px; background: var(--bg-color); }
                .preview-section img { max-width: 100%; max-height: 100%; object-fit: contain; box-shadow: var(--shadow-glass); border-radius: 24px; border: 1px solid var(--surface-border); }
                .details-section { width: 460px; background: var(--surface); border-left: 1px solid var(--surface-border); padding: 48px; overflow-y: auto; display: flex; flex-direction: column; gap: 32px; }
                .download-cta { padding: 32px; border-radius: 28px; background: var(--bg-color); border: 1px solid var(--surface-border); }
                .cta-label { color: var(--text-main); font-size: 0.95rem; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; }
                .download-btn { width: 100%; padding: 18px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 1.1rem; font-weight: 800; }
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
