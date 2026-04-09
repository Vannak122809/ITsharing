import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, X, Filter, Image as ImageIcon, Layout, Sparkles, Heart, Share2, MoreHorizontal, Folder, Image, Layers, Zap, Star, ShieldCheck, Maximize, FileText, CheckCircle2 } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

const Assets = () => {
    const { t } = useLanguage();
    const [user, setUser] = useState(null);
    const [dbAssets, setDbAssets] = useState([]);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAsset, setSelectedAsset] = useState(null);

    // Featured Static Assets (Full KNY Collection)
    const featuredAssets = [
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

    const categories = [
        { id: 'All', name: t('all'), icon: <Layout size={18} /> },
        { id: 'Khmer New Year', name: 'Khmer New Year', icon: <Sparkles size={18} /> },
        { id: 'Template', name: 'Templates', icon: <Layers size={18} /> },
        { id: 'Illustration', name: 'Illustrations', icon: <ImageIcon size={18} /> },
        { id: 'Image', name: 'Stock Photos', icon: <Image size={18} /> }
    ];

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });

        const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'));
        const unsubDocs = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDbAssets(data);
        });

        return () => {
            unsubAuth();
            unsubDocs();
        };
    }, []);

    const allAssets = useMemo(() => {
        return [...featuredAssets, ...dbAssets];
    }, [dbAssets]);

    const filteredAssets = useMemo(() => {
        return allAssets.filter(asset => {
            const matchesTab = activeTab === 'All' || asset.type === activeTab;
            const matchesSearch = asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesTab && matchesSearch;
        });
    }, [allAssets, activeTab, searchQuery]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', paddingTop: '80px' }}>
            
            {/* HERO SECTION */}
            <section style={{ 
                height: '340px', 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                overflow: 'hidden',
                marginBottom: '40px'
            }}>
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1964")',
                    backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.5)'
                }} />
                
                <div style={{ position: 'relative', zIndex: 1, padding: '0 24px', maxWidth: '800px', width: '100%' }}>
                    <h1 style={{ color: '#fff', fontSize: '3.5rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.04em' }}>
                        {t('premium_stock_assets')}
                    </h1>
                    
                    <div className="glass-panel" style={{ 
                        background: '#fff', 
                        borderRadius: '24px', 
                        padding: '8px 8px 8px 24px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        width: '100%'
                    }}>
                        <Search color="var(--text-muted)" size={24} />
                        <input 
                            type="text" 
                            placeholder={t('search_assets_placeholder')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1.1rem', color: '#111', fontWeight: 500, background: 'transparent' }}
                        />
                        <button className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '16px' }}>{t('search')}</button>
                    </div>
                </div>
            </section>

            <div className="container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px', maxWidth: '1440px' }}>
                
                {/* SIDEBAR CATEGORIES */}
                <aside>
                    <div className="glass-panel" style={{ padding: '24px', borderRadius: '32px', position: 'sticky', top: '100px', border: '1px solid var(--surface-border)' }}>
                        <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Folder size={16} /> COLLECTIONS
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveTab(cat.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '14px', border: 'none', cursor: 'pointer', transition: '0.3s', fontSize: '0.95rem', fontWeight: activeTab === cat.id ? 800 : 500,
                                        background: activeTab === cat.id ? 'var(--primary)' : 'transparent',
                                        color: activeTab === cat.id ? '#fff' : 'var(--text-main)',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span style={{ opacity: activeTab === cat.id ? 1 : 0.6 }}>{cat.icon}</span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <main>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '4px' }}>{activeTab === 'All' ? 'Latest Discoveries' : activeTab}</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Found {filteredAssets.length} premium resources</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '10px 16px' }}><Filter size={18} /> Filters</button>
                            <button className="btn btn-outline" style={{ padding: '10px', borderRadius: '12px' }}><Layout size={18} /></button>
                        </div>
                    </div>

                    {/* ASSET GRID */}
                    <div style={{ 
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px'
                    }}>
                        {filteredAssets.map(asset => (
                            <div 
                                key={asset.id} onClick={() => setSelectedAsset(asset)} className="asset-card"
                                style={{ 
                                    borderRadius: '24px', overflow: 'hidden', cursor: 'zoom-in', position: 'relative', background: 'var(--card-dark)', border: '1px solid var(--surface-border)', height: '320px', display: 'flex', flexDirection: 'column', transition: '0.4s'
                                }}
                            >
                                <div style={{ height: '75%', overflow: 'hidden', position: 'relative' }}>
                                    <img src={asset.url} alt={asset.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="asset-img" />
                                    {asset.featured && (
                                        <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontSize: '0.6rem', fontWeight: 900, padding: '4px 10px', borderRadius: '40px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2 }}>
                                            <Zap size={10} fill="#fff" /> FEATURED
                                        </div>
                                    )}
                                    <div className="asset-action-ov" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.4s', backdropFilter: 'blur(4px)' }}>
                                        <div style={{ background: '#fff', color: '#000', padding: '10px 20px', borderRadius: '40px', fontWeight: 800 }}>VIEW DETAILS</div>
                                    </div>
                                </div>
                                <div style={{ padding: '20px', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)' }}>
                                    <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{asset.title}</h4>
                                    <span style={{ background: 'var(--surface-badge)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase' }}>{asset.type.split(' ')[0]}</span>
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

            {/* VIEWER MODAL - Theme Responsive */}
            {selectedAsset && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--nav-bg)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(30px)' }}>
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        
                        {/* Header */}
                        <div style={{ padding: '16px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>IT</div>
                                <div>
                                    <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>{selectedAsset.title}</h3>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Premium Verified Template</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAsset(null)} style={{ background: 'var(--surface-badge)', border: 'none', borderRadius: '14px', padding: '10px', color: 'var(--text-main)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                            {/* Preview Area */}
                            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', background: 'var(--bg-color)', position: 'relative' }}>
                                <img src={selectedAsset.url} alt={selectedAsset.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: 'var(--shadow-glass)', borderRadius: '24px', border: '1px solid var(--surface-border)' }} />
                            </div>

                            {/* Details Panel - Theme Responsive */}
                            <div style={{ width: '460px', background: 'var(--surface)', borderLeft: '1px solid var(--surface-border)', padding: '48px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                
                                <div className="glass-panel" style={{ padding: '32px', borderRadius: '28px', background: 'var(--bg-color)', border: '1px solid var(--surface-border)' }}>
                                    <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Download Resource</h4>
                                    <a href={selectedAsset.sourceUrl || selectedAsset.url} download={selectedAsset.title} target="_blank" className="btn btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 800 }}>
                                        <Download size={22} /> {selectedAsset.format || 'Photoshop (PSD)'}
                                    </a>
                                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7, justifyContent: 'center' }}>
                                        <CheckCircle2 size={14} color="var(--tertiary)" />
                                        <span style={{ fontSize: '0.8rem' }}>High Quality PSD / Vector included</span>
                                    </div>
                                </div>

                                <section>
                                    <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-border)' }}>Technical Information</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dimensions</span><span style={{ fontWeight: 700 }}>{selectedAsset.dimensions || 'High-Res'}</span></div>
                                        <div><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Size</span><span style={{ fontWeight: 700 }}>{selectedAsset.size || 'Varies'}</span></div>
                                        <div><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Format</span><span style={{ fontWeight: 700 }}>{selectedAsset.format || 'PSD / EPS'}</span></div>
                                        <div><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quality</span><span style={{ fontWeight: 700 }}>{selectedAsset.dpi || 'Print Ready'}</span></div>
                                    </div>
                                </section>

                                <section>
                                    <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>Keywords</h5>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {selectedAsset.tags?.map(tag => (
                                            <span key={tag} style={{ background: 'var(--surface-badge)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '40px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--surface-border)' }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .asset-card:hover { transform: translateY(-8px); border-color: var(--primary); }
                .asset-card:hover .asset-img { transform: scale(1.05); }
                .asset-card:hover .asset-action-ov { opacity: 1; }
                .asset-img { transition: 0.6s; }
            `}</style>
        </div>
    );
};

export default Assets;
