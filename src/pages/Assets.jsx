import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, X, Filter, Image as ImageIcon, Layout, Sparkles, Heart, Share2, MoreHorizontal, Folder, Image, Layers, Zap, Star, ShieldCheck, Maximize, FileText, CheckCircle2, Box, Menu } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

import { featuredAssets } from '../data/assetsData';
import './Assets.css';

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
    const [dynamicCategories, setDynamicCategories] = useState([]);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
        const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
        const unsubDocs = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDbAssets(data);
        });

        // Setup listener for dynamic collections
        const docRef = doc(db, 'settings', 'assetsConfig');
        const unsubSettings = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const customCols = docSnap.data().collections || [];
                setDynamicCategories(customCols.map(name => ({ id: name, name: name, icon: <Folder size={18} /> })));
            }
        });

        return () => { unsubAuth(); unsubDocs(); unsubSettings(); };
    }, []);

    const activeCategories = useMemo(() => [...categories, ...dynamicCategories], [categories, dynamicCategories]);

    const allAssets = useMemo(() => [...featuredAssets, ...dbAssets], [dbAssets]);

    const filteredAssets = useMemo(() => {
        const queryStr = searchQuery.toLowerCase().trim();
        return allAssets.filter(asset => {
            // Updated filtering logic to support dual categorization (Type or Tag matches)
            const isCollectionMatch = Array.isArray(asset.collection) 
                ? asset.collection.includes(activeTab) 
                : asset.collection === activeTab;

            const matchesTab = activeTab === 'All' || 
                             asset.type === activeTab || 
                             isCollectionMatch ||
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
                            {activeCategories.map(cat => (
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
                                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0 }}>
                                    <img 
                                        src={selectedAsset.gallery?.length > 0 ? selectedAsset.gallery[activeModalImageIndex] : selectedAsset.url} 
                                        alt={selectedAsset.title} 
                                        className="constrained-img"
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

        </div>
    );
};

export default Assets;
