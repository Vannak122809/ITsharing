import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, X, Image as ImageIcon, FileText, CheckCircle2, 
    RefreshCw, Layers, Zap, Save, FileCode, Palette,
    Plus, Info, AlertCircle, Database, Globe, ShieldCheck,
    Cloud, Sparkles, HardDrive, Layout, Type
} from 'lucide-react';
import { convertToWebP, uploadAssetToR2, ASSETS_PUBLIC_URL } from '../r2Assets';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AssetUploadForm = ({ onComplete }) => {
    const [category, setCategory] = useState('Photoshop'); 
    const [mainFile, setMainFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [title, setTitle] = useState('');
    const [tags, setTags] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [autoWebP, setAutoWebP] = useState(true);

    const [selectedBucket, setSelectedBucket] = useState('image');
    const [selectedCollection, setSelectedCollection] = useState('General');
    const [customPublicUrl, setCustomPublicUrl] = useState(ASSETS_PUBLIC_URL);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const mainFileInputRef = useRef(null);
    const coverFileInputRef = useRef(null);

    const bucketPresets = [
        { id: 'image', name: 'Cloud Storage: IMAGES', url: 'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev' },
        { id: 'template', name: 'Cloud Storage: TEMPLATES', url: ASSETS_PUBLIC_URL },
        { id: 'documents', name: 'Cloud Storage: DOCUMENTS', url: ASSETS_PUBLIC_URL }
    ];

    const collections = [
        { id: 'General', label: 'General Library' },
        { id: 'Chinese New Year', label: '🧧 Chinese New Year' },
        { id: 'Khmer New Year', label: '🇰🇭 Khmer New Year' },
        { id: 'Luxury', label: '💎 Luxury Assets' }
    ];

    useEffect(() => {
        const preset = bucketPresets.find(b => b.id === selectedBucket);
        if (preset) setCustomPublicUrl(preset.url);
    }, [selectedBucket]);

    const categories = [
        { id: 'Photoshop', name: 'Adobe Photoshop', desc: 'PSD, EPS, TIFF', icon: <Layers size={22} />, color: '#001833', accent: '#00a8ff', folder: 'Photoshop' },
        { id: 'PNG', name: 'Portable Graphics', desc: 'PNG, JPG, WEBP', icon: <ImageIcon size={22} />, color: '#032310', accent: '#00ff88', folder: 'PNG' },
        { id: 'AI', name: 'Adobe Illustrator', desc: 'AI, EPS, SVG', icon: <Palette size={22} />, color: '#2a0000', accent: '#ff8800', folder: 'AI' }
    ];

    const currentCat = categories.find(c => c.id === category);

    const handleMainFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainFile(file);
            if (!title) setTitle(file.name.split('.')[0]);
            if (file.type.startsWith('image/') && !coverFile) setCoverFile(file);
        }
    };

    const handleUpload = async () => {
        if (!mainFile) {
            alert('Please select a main file to proceed.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(15);

        try {
            let displayUrl = '';
            let sourceUrl = '';
            
            // 1. Upload Source File
            const sourceKey = await uploadAssetToR2(mainFile, currentCat.folder, selectedBucket);
            sourceUrl = `${customPublicUrl}/${sourceKey}`;
            setUploadProgress(55);

            // 2. Upload/Convert Cover Image
            const fileToCover = coverFile || mainFile;
            if (autoWebP && fileToCover.type.startsWith('image/')) {
                const webpBlob = await convertToWebP(fileToCover, 0.85);
                const webpFile = new File([webpBlob], `${title}.webp`, { type: 'image/webp' });
                const displayKey = await uploadAssetToR2(webpFile, 'display', selectedBucket);
                displayUrl = `${customPublicUrl}/${displayKey}`;
            } else {
                const displayKey = await uploadAssetToR2(fileToCover, 'display', selectedBucket);
                displayUrl = `${customPublicUrl}/${displayKey}`;
            }
            setUploadProgress(85);

            // 3. Save to Firestore
            await addDoc(collection(db, 'assets'), {
                title,
                type: category === 'PNG' ? 'Image' : 'Template',
                category: category,
                collection: selectedCollection,
                format: mainFile.name.split('.').pop().toUpperCase(),
                url: displayUrl,
                sourceUrl: sourceUrl,
                tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
                downloads: 0,
                likes: 0,
                featured: false,
                dimensions: 'High-Res',
                size: `${(mainFile.size / (1024 * 1024)).toFixed(2)} MB`,
                bucket: selectedBucket,
                createdAt: serverTimestamp()
            });

            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                if (onComplete) onComplete();
            }, 1200);

        } catch (error) {
            console.error('Master Upload Error:', error);
            alert(`System Alert: ${error.message}`);
            setIsUploading(false);
        }
    };

    return (
        <div className="artistic-upload-container">
            {/* Artistic Background Elements */}
            <div className="glow-orb" style={{ backgroundColor: currentCat.accent }} />
            
            <div className="upload-master-content glass-morphism">
                <header className="upload-master-header">
                    <div className="header-brand-info">
                        <div className="artistic-cat-icon" style={{ backgroundColor: currentCat.color, boxShadow: `0 10px 30px ${currentCat.accent}44` }}>
                            {currentCat.icon}
                        </div>
                        <div className="text-meta">
                            <h2>Publish {currentCat.name} Resources</h2>
                            <p>Premium Assets &bull; {selectedCollection} 🧧</p>
                        </div>
                    </div>
                    
                    <div className="upload-header-controls">
                        <button className={`cloud-setup-btn ${showAdvanced ? 'active' : ''}`} onClick={() => setShowAdvanced(!showAdvanced)}>
                            <Cloud size={16} /> Cloud Config
                        </button>
                        <div className="category-pill-selector">
                            {categories.map(cat => (
                                <button 
                                    key={cat.id}
                                    className={`pill-tab ${category === cat.id ? 'active' : ''}`}
                                    onClick={() => setCategory(cat.id)}
                                    style={category === cat.id ? { backgroundColor: cat.color, color: 'white' } : {}}
                                >
                                    {cat.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {showAdvanced && (
                    <div className="advanced-settings-drawer">
                        <div className="drawer-grid">
                            <div className="drawer-field">
                                <label><HardDrive size={13} /> Target Cloud Bucket</label>
                                <select value={selectedBucket} onChange={(e) => setSelectedBucket(e.target.value)}>
                                    {bucketPresets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="drawer-field">
                                <label><Globe size={13} /> CDN Edge Endpoint</label>
                                <input type="text" value={customPublicUrl} onChange={(e) => setCustomPublicUrl(e.target.value)} />
                            </div>
                            <div className="drawer-field">
                                <label><Sparkles size={13} /> Collection Mapping</label>
                                <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}>
                                    {collections.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="upload-body-grid">
                    <div className="input-vertical-stack">
                        <div className="master-input-group">
                            <label><Type size={14} /> Resource Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Luxury Business Card Template..." 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="dropzone-duo">
                            <div className={`master-dropzone ${mainFile ? 'ready' : ''}`} onClick={() => mainFileInputRef.current.click()}>
                                <input type="file" ref={mainFileInputRef} onChange={handleMainFileSelect} hidden />
                                <div className="drop-status-icon">
                                    {mainFile ? <FileCode className="pulse-blue" size={28} /> : <Upload size={28} />}
                                </div>
                                <div className="drop-labels">
                                    <strong>{mainFile ? mainFile.name : 'Upload Master File'}</strong>
                                    <p>{mainFile ? `${(mainFile.size/1024/1024).toFixed(2)} MB` : '.PSD, .AI, .EPS source file'}</p>
                                </div>
                                {mainFile && <CheckCircle2 className="checked-indicator" size={18} />}
                            </div>

                            <div className={`master-dropzone preview-drop ${coverFile ? 'ready' : ''}`} onClick={() => coverFileInputRef.current.click()}>
                                <input type="file" ref={coverFileInputRef} accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} hidden />
                                <div className="drop-status-icon">
                                    {coverFile ? <Layout className="pulse-emerald" size={28} /> : <Plus size={28} />}
                                </div>
                                <div className="drop-labels">
                                    <strong>{coverFile ? 'Thumbnail Ready' : 'Add Cover Image'}</strong>
                                    <p>Used for web display and gallery</p>
                                </div>
                                {coverFile && (
                                    <div className="float-preview">
                                        <img src={URL.createObjectURL(coverFile)} alt="" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="master-input-group">
                            <label><Sparkles size={14} /> Keywords (Separated by comma)</label>
                            <input 
                                type="text" 
                                placeholder="khmer, vintage, gold, luxury..."
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="final-actions-sidebar">
                        <div className="live-asset-card glass-panel">
                            <div className="card-top-preview">
                                {coverFile ? <img src={URL.createObjectURL(coverFile)} alt="" /> : <ImageIcon size={40} color="#eee" />}
                            </div>
                            <div className="card-bottom-info">
                                <div className="badge-row">
                                    <span className="cat-tag" style={{ color: currentCat.accent }}>{category}</span>
                                    <span className="coll-tag">{selectedCollection}</span>
                                </div>
                                <h4>{title || 'Asset Identity'}</h4>
                                <div className="meta-footer">
                                    <span>{selectedBucket} storage</span>
                                </div>
                            </div>
                        </div>

                        <div className="utility-switch-rack">
                            <div className="switch-item">
                                <div className="s-info">
                                    <strong>Auto WebP</strong>
                                    <span>Optimize for speed</span>
                                </div>
                                <button className={`art-toggle ${autoWebP ? 'on' : ''}`} onClick={() => setAutoWebP(!autoWebP)}>
                                    <div className="knob" />
                                </button>
                            </div>
                            <div className="switch-item">
                                <div className="s-info">
                                    <strong>Priority Sync</strong>
                                    <span>Real-time persistence</span>
                                </div>
                                <div className="status-dot-art active" />
                            </div>
                        </div>

                        <button className="master-publish-btn" disabled={isUploading || !mainFile} onClick={handleUpload}>
                            {isUploading ? (
                                <><RefreshCw className="spinning" size={22} /> Sycing {uploadProgress}%</>
                            ) : (
                                <><Save size={22} /> Finalize & Publish</>
                            )}
                        </button>
                        
                        <p className="master-security-disclaimer">
                            <ShieldCheck size={12} /> System Administrator Controlled Session
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .artistic-upload-container { position: relative; padding: 10px; min-height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                
                .glow-orb { position: absolute; width: 400px; height: 400px; border-radius: 50%; filter: blur(120px); opacity: 0.15; top: -100px; right: -100px; z-index: 0; transition: 0.8s ease; }
                
                .upload-master-content { position: relative; z-index: 10; width: 100%; max-width: 1000px; border-radius: 40px; padding: 48px; border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 50px 100px -20px rgba(0,0,0,0.1); }
                .glass-morphism { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
                
                .upload-master-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .header-brand-info { display: flex; align-items: center; gap: 24px; }
                .artistic-cat-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; transition: 0.5s; }
                .text-meta h2 { font-size: 1.8rem; font-weight: 900; color: #111; margin-bottom: 4px; letter-spacing: -0.02em; }
                .text-meta p { color: #666; font-size: 0.95rem; font-weight: 600; }

                .upload-header-controls { display: flex; align-items: center; gap: 16px; }
                .cloud-setup-btn { background: #f0f2f5; border: none; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 0.8rem; color: #555; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
                .cloud-setup-btn.active { background: #111; color: white; }
                
                .category-pill-selector { display: flex; background: #f0f2f5; padding: 6px; border-radius: 18px; gap: 4px; }
                .pill-tab { width: 44px; height: 44px; border-radius: 14px; border: none; background: transparent; cursor: pointer; color: #999; display: flex; align-items: center; justify-content: center; transition: 0.4s; }
                .pill-tab.active { box-shadow: 0 10px 20px rgba(0,0,0,0.1); }

                .advanced-settings-drawer { background: rgba(0,0,0,0.03); border-radius: 24px; padding: 24px; margin-bottom: 40px; border: 1px dashed #ddd; animation: slideDown 0.4s ease; }
                .drawer-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 24px; }
                .drawer-field { display: flex; flex-direction: column; gap: 8px; }
                .drawer-field label { font-size: 0.75rem; font-weight: 800; color: #888; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
                .drawer-field select, .drawer-field input { background: white; border: 1.5px solid #eee; padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; outline: none; transition: 0.3s; }
                .drawer-field select:focus, .drawer-field input:focus { border-color: #5c67ff; }

                .upload-body-grid { display: grid; grid-template-columns: 1fr 340px; gap: 48px; }
                .input-vertical-stack { display: flex; flex-direction: column; gap: 32px; }
                .master-input-group { display: flex; flex-direction: column; gap: 10px; }
                .master-input-group label { font-size: 0.85rem; font-weight: 800; color: #444; display: flex; align-items: center; gap: 8px; }
                .master-input-group input { border: 2.5px solid #f0f2f5; padding: 16px; border-radius: 18px; font-size: 1.05rem; font-weight: 600; outline: none; transition: 0.3s; background: white; }
                .master-input-group input:focus { border-color: #111; }

                .dropzone-duo { display: grid; gap: 16px; }
                .master-dropzone { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 24px; border: 2.5px dashed #e2e8f0; cursor: pointer; transition: 0.4s; background: rgba(255,255,255,0.5); position: relative; }
                .master-dropzone:hover { border-color: #111; background: #fff; transform: scale(1.02); }
                .master-dropzone.ready { border-color: #10b981; background: #f0fdf4; border-style: solid; }
                .drop-status-icon { width: 56px; height: 56px; background: #f0f2f5; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #111; }
                .ready .drop-status-icon { background: white; color: #10b981; }
                .drop-labels strong { display: block; font-size: 1rem; color: #111; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
                .drop-labels p { font-size: 0.8rem; color: #888; font-weight: 600; }
                .checked-indicator { position: absolute; right: 20px; color: #10b981; }

                .preview-drop { }
                .float-preview { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; margin-left: auto; box-shadow: 0 10px 20px rgba(0,0,0,0.1); border: 2px solid white; }
                .float-preview img { width: 100%; height: 100%; object-fit: cover; }

                .final-actions-sidebar { display: flex; flex-direction: column; gap: 32px; }
                .live-asset-card { padding: 0; overflow: hidden; border-radius: 32px; background: white; border: 1px solid #eee; box-shadow: 0 30px 60px -15px rgba(0,0,0,0.08); }
                .card-top-preview { height: 180px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .card-top-preview img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .card-bottom-info { padding: 24px; }
                .badge-row { display: flex; gap: 8px; margin-bottom: 12px; }
                .cat-tag, .coll-tag { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
                .coll-tag { color: #999; }
                .card-bottom-info h4 { font-size: 1.1rem; font-weight: 800; color: #111; margin-bottom: 8px; }
                .meta-footer { font-size: 0.75rem; color: #999; font-weight: 700; }

                .utility-switch-rack { background: #f8f9fa; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
                .switch-item { display: flex; justify-content: space-between; align-items: center; }
                .s-info strong { display: block; font-size: 0.85rem; color: #111; margin-bottom: 2px; }
                .s-info span { font-size: 0.7rem; color: #888; font-weight: 600; }
                .art-toggle { width: 44px; height: 24px; border-radius: 12px; background: #e2e8f0; border: none; cursor: pointer; position: relative; transition: 0.3s; }
                .art-toggle.on { background: #111; }
                .knob { width: 18px; height: 18px; background: white; border-radius: 50%; position: absolute; left: 3px; top: 3px; transition: 0.3s; }
                .art-toggle.on .knob { left: 23px; }
                .status-dot-art { width: 10px; height: 10px; border-radius: 50%; background: #ddd; }
                .status-dot-art.active { background: #10b981; box-shadow: 0 0 15px #10b981; }

                .master-publish-btn { background: #111; color: white; border: none; padding: 20px; border-radius: 24px; font-weight: 900; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.4s; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
                .master-publish-btn:hover { transform: translateY(-3px); box-shadow: 0 30px 60px rgba(0,0,0,0.2); background: #000; }
                .master-publish-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
                .master-security-disclaimer { font-size: 0.65rem; color: #bbb; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; }

                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                .spinning { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .pulse-blue { animation: pulseB 2s infinite; }
                @keyframes pulseB { 0% { color: #111; } 50% { color: #5c67ff; } 100% { color: #111; } }
                .pulse-emerald { animation: pulseE 2s infinite; }
                @keyframes pulseE { 0% { color: #111; } 50% { color: #10b981; } 100% { color: #111; } }
            `}} />
        </div>
    );
};

export default AssetUploadForm;
