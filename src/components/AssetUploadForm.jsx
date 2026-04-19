import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, X, Image as ImageIcon, FileText, CheckCircle2, 
    RefreshCw, Layers, Zap, Save, FileCode, Palette,
    Plus, Info, AlertCircle, Database, Globe, ShieldCheck,
    Cloud, Sparkles, HardDrive, Layout, Type, Star
} from 'lucide-react';
import { convertToWebP, uploadAssetToR2, ASSETS_PUBLIC_URL } from '../r2Assets';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

const AssetUploadForm = ({ onComplete, editData = null }) => {
    const isEditMode = !!editData;
    const [softwareType, setSoftwareType] = useState(editData?.category || 'Photoshop'); 
    const [mainFile, setMainFile] = useState(null);
    const [coverFiles, setCoverFiles] = useState([]);
    const [title, setTitle] = useState(editData?.title || '');
    const [tags, setTags] = useState(editData?.tags?.join(', ') || '');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [autoWebP, setAutoWebP] = useState(true);

    const [selectedBucket, setSelectedBucket] = useState(editData?.bucket || 'image');
    const [selectedCategories, setSelectedCategories] = useState(
        Array.isArray(editData?.collection) ? editData.collection : 
        (editData?.collection ? [editData.collection] : ['Chinese New Year'])
    );
    const [customPublicUrl, setCustomPublicUrl] = useState(ASSETS_PUBLIC_URL);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (selectedCategories.includes('Chinese New Year')) {
            const cnyTags = 'Chinese New Year, CNY, 🧧, Red, Gold';
            if (!tags.includes('CNY')) setTags(prev => prev ? `${prev}, ${cnyTags}` : cnyTags);
        }
    }, [selectedCategories]);

    const mainFileInputRef = useRef(null);
    const coverFileInputRef = useRef(null);

    const bucketPresets = [
        { id: 'image', name: 'Cloud Storage: IMAGES', url: 'https://pub-d1a291624a2449dfa5dc29dc91b022ce.r2.dev' },
        { id: 'template', name: 'Cloud Storage: TEMPLATES', url: ASSETS_PUBLIC_URL },
        { id: 'documents', name: 'Cloud Storage: DOCUMENTS', url: ASSETS_PUBLIC_URL }
    ];

    const availableCategories = [
        { id: 'General', label: 'All Library', icon: <Layout size={14} /> },
        { id: 'Chinese New Year', label: '🧧 Chinese Special', icon: <Sparkles size={14} /> },
        { id: 'Khmer New Year', label: '🇰🇭 Khmer Special', icon: <Zap size={14} /> },
        { id: 'Frame', label: '🖼️ Frames', icon: <ImageIcon size={14} /> },
        { id: 'Luxury', label: '💎 Luxury Assets', icon: <Star size={14} /> },
        { id: 'Template', label: '📐 Templates', icon: <Palette size={14} /> },
        { id: 'Illustration', label: '🎨 Illustrations', icon: <Layers size={14} /> },
        { id: 'Image', label: '📸 Real Images', icon: <ImageIcon size={14} /> }
    ];

    useEffect(() => {
        const preset = bucketPresets.find(b => b.id === selectedBucket);
        if (preset) setCustomPublicUrl(preset.url);
    }, [selectedBucket]);

    const softwareFormats = [
        { id: 'Photoshop', name: 'Adobe Photoshop', desc: 'PSD, EPS, TIFF', icon: <Layers size={22} />, color: '#001833', accent: '#00a8ff', folder: 'Photoshop' },
        { id: 'PNG', name: 'Portable Graphics', desc: 'PNG, JPG, WEBP', icon: <ImageIcon size={22} />, color: '#032310', accent: '#00ff88', folder: 'PNG' },
        { id: 'AI', name: 'Adobe Illustrator', desc: 'AI, EPS, SVG', icon: <Palette size={22} />, color: '#2a0000', accent: '#ff8800', folder: 'AI' }
    ];

    const currentFormat = softwareFormats.find(c => c.id === softwareType);

    const formatFileNameToTitle = (fileName) => {
        if (!fileName) return '';
        let name = fileName.split('.')[0];
        // Replace dashes and underscores with spaces
        name = name.replace(/[_-]/g, ' ');
        // Insert space before capital letters (for CamelCase)
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        // Capitalize each word properly
        return name.split(' ')
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                   .join(' ')
                   .trim();
    };

    const handleMainFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMainFile(file);
            // Auto-title if currently empty
            if (!title) {
                setTitle(formatFileNameToTitle(file.name));
            }
            if (file.type.startsWith('image/') && !coverFile) setCoverFile(file);
        }
    };

    const handleCoverFileSelect = (e) => {
        const files = Array.from(e.target.files).slice(0, 4); // Max 4 images
        if (files.length > 0) {
            setCoverFiles(files);
            // Auto-title if currently empty
            if (!title) {
                setTitle(formatFileNameToTitle(files[0].name));
            }
        }
    };

    const handleUpload = async () => {
        if (!isEditMode && !mainFile) {
            alert('Please select a main file to proceed.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(15);

        try {
            let displayUrl = editData?.url || '';
            let galleryUrls = editData?.gallery || (editData?.url ? [editData.url] : []);
            let sourceUrl = editData?.sourceUrl || '';
            
            // 1. Upload Source File (only if new file selected)
            if (mainFile) {
                const sourceKey = await uploadAssetToR2(mainFile, currentFormat.folder, selectedBucket);
                sourceUrl = `${customPublicUrl}/${sourceKey}`;
            }
            setUploadProgress(55);

            // 2. Upload/Convert Cover Images (only if new files selected)
            if (coverFiles.length > 0 || (mainFile && !isEditMode && coverFiles.length === 0)) {
                let displayUrls = [];
                const filesToUpload = coverFiles.length > 0 ? coverFiles : [mainFile];
                
                for (let i = 0; i < filesToUpload.length; i++) {
                    const fileToCover = filesToUpload[i];
                    if (autoWebP && fileToCover.type.startsWith('image/')) {
                        const webpBlob = await convertToWebP(fileToCover, 0.85);
                        const webpFile = new File([webpBlob], `${title.replace(/[^a-zA-Z0-9]/g, '')}-${i}.webp`, { type: 'image/webp' });
                        const displayKey = await uploadAssetToR2(webpFile, 'display', selectedBucket);
                        displayUrls.push(`${customPublicUrl}/${displayKey}`);
                    } else {
                        const displayKey = await uploadAssetToR2(fileToCover, 'display', selectedBucket);
                        displayUrls.push(`${customPublicUrl}/${displayKey}`);
                    }
                }
                displayUrl = displayUrls[0];
                galleryUrls = displayUrls;
            }
            setUploadProgress(85);

            // Determine technical 'type' (Primary type for filtering)
            let technicalType = selectedCategories[0] || 'Template';
            if (softwareType === 'PNG' && !selectedCategories.includes('Frame')) technicalType = 'Image';
            
            // Add categories as extra tags for search robustness
            const expandedTags = [
                ...tags.split(',').map(tag => tag.trim()).filter(Boolean),
                ...selectedCategories
            ];
            const uniqueTags = [...new Set(expandedTags)];

            // 3. Save to Firestore
            const assetData = {
                title,
                type: technicalType, // Primary Display Type
                category: softwareType,
                collection: selectedCategories, // Stored as array
                url: displayUrl,
                gallery: galleryUrls,
                sourceUrl: sourceUrl,
                tags: uniqueTags,
                updatedAt: serverTimestamp()
            };

            if (isEditMode) {
                await updateDoc(doc(db, 'assets', editData.id), assetData);
            } else {
                await addDoc(collection(db, 'assets'), {
                    ...assetData,
                    format: mainFile.name.split('.').pop().toUpperCase(),
                    downloads: 0,
                    likes: 0,
                    featured: false,
                    dimensions: 'High-Res',
                    size: `${(mainFile.size / (1024 * 1024)).toFixed(2)} MB`,
                    bucket: selectedBucket,
                    createdAt: serverTimestamp()
                });
            }

            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                if (onComplete) onComplete();
            }, 1200);

        } catch (error) {
            console.error('Master Process Error:', error);
            alert(`System Alert: ${error.message}`);
            setIsUploading(false);
        }
    };

    return (
        <div className={`artistic-upload-container ${selectedCategories.includes('Chinese New Year') ? 'cny-theme' : ''}`}>
            {/* Artistic Background Elements */}
            <div className="glow-orb" style={{ backgroundColor: currentFormat.accent }} />
            
            <div className="upload-master-content glass-morphism">
                <header className="upload-master-header">
                    <div className="header-brand-info">
                        <div className="artistic-cat-icon" style={{ backgroundColor: currentFormat.color, boxShadow: `0 10px 30px ${currentFormat.accent}44` }}>
                            {currentFormat.icon}
                        </div>
                        <div className="text-meta">
                            <h2>{isEditMode ? 'Modify Content Identity' : `Publish ${currentFormat.name} Resources`}</h2>
                            <p> {isEditMode ? `Updating ID: ${editData.id.substring(0,8)}...` : `Premium ${selectedCategories.includes('Chinese New Year') ? '🏮 CNY Special 🧧' : 'Assets'}`} &bull; {selectedCategories.join(', ')}</p>
                        </div>
                    </div>
                    
                    <div className="upload-header-controls">
                        <button className={`cloud-setup-btn ${showAdvanced ? 'active' : ''}`} onClick={() => setShowAdvanced(!showAdvanced)}>
                            <Cloud size={16} /> Cloud Config
                        </button>
                        <div className="category-pill-selector">
                            {softwareFormats.map(cat => (
                                <button 
                                    key={cat.id}
                                    className={`pill-tab ${softwareType === cat.id ? 'active' : ''}`}
                                    onClick={() => setSoftwareType(cat.id)}
                                    title={cat.name}
                                    style={softwareType === cat.id ? { backgroundColor: cat.color, color: 'white' } : {}}
                                >
                                    {cat.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <button className="btn-close-dashboard" onClick={() => onComplete && onComplete()} title="Close Dashboard">
                    <X size={20} />
                </button>

                <div className="collection-master-bar glass-panel">
                    <div className="bar-label"><Sparkles size={16} /> Target Area (Category)</div>
                    <div className="collection-pills-scroll">
                        {availableCategories.map(col => (
                            <button 
                                key={col.id}
                                className={`col-pill ${selectedCategories.includes(col.id) ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedCategories(prev => {
                                        if (prev.includes(col.id)) {
                                            if (prev.length === 1) return prev; // Keep at least one
                                            return prev.filter(id => id !== col.id);
                                        }
                                        return [...prev, col.id];
                                    });
                                }}
                            >
                                {col.icon} {col.label}
                            </button>
                        ))}
                    </div>
                </div>

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
                                <label><Globe size={13} /> Cloud Storage Visibility</label>
                                <select value="public" readOnly disabled>
                                    <option value="public">Global Public Edge</option>
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

                            <div className={`master-dropzone preview-drop ${coverFiles.length > 0 ? 'ready' : ''}`} onClick={() => coverFileInputRef.current.click()}>
                                <input type="file" ref={coverFileInputRef} accept="image/*" multiple onChange={handleCoverFileSelect} hidden />
                                <div className="drop-status-icon">
                                    {coverFiles.length > 0 ? <Layout className="pulse-emerald" size={28} /> : <Plus size={28} />}
                                </div>
                                <div className="drop-labels">
                                    <strong>{coverFiles.length > 0 ? `${coverFiles.length}/4 Thumbnails Ready` : 'Add Cover Images'}</strong>
                                    <p>Select up to 4 images for rotating gallery</p>
                                </div>
                                {coverFiles.length > 0 && (
                                    <div className="float-preview">
                                        <img src={URL.createObjectURL(coverFiles[0])} alt="" />
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
                            <div className="card-top-preview" style={{ position: 'relative' }}>
                                {coverFiles.length > 0 ? (
                                    <>
                                        <img src={URL.createObjectURL(coverFiles[0])} alt="" />
                                        {coverFiles.length > 1 && (
                                            <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                +{coverFiles.length - 1} Images
                                            </div>
                                        )}
                                    </>
                                ) : <ImageIcon size={40} color="#eee" />}
                            </div>
                            <div className="card-bottom-info">
                                <div className="badge-row">
                                    <span className="cat-tag" style={{ color: currentFormat.accent }}>{softwareType}</span>
                                    <span className="coll-tag">{selectedCategories.join(' + ')}</span>
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

                        <div className="action-button-group">
                            <button className="btn-discard" onClick={() => onComplete && onComplete()}>
                                Discard & Close
                            </button>
                            <button className="master-publish-btn" disabled={isUploading || (!isEditMode && !mainFile)} onClick={handleUpload}>
                                {isUploading ? (
                                    <><RefreshCw className="spinning" size={22} /> Sycing {uploadProgress}%</>
                                ) : (
                                    <>{isEditMode ? <CheckCircle2 size={22} /> : <Save size={22} />} {isEditMode ? 'Save & Synchronize' : 'Finalize & Publish'}</>
                                )}
                            </button>
                        </div>
                        
                        <p className="master-security-disclaimer">
                            <ShieldCheck size={12} /> System Administrator Controlled Session
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .artistic-upload-container { position: relative; padding: 10px; min-height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: background 0.5s ease; }
                .artistic-upload-container.cny-theme { background: linear-gradient(135deg, var(--bg-color) 0%, var(--surface) 100%); }
                
                .glow-orb { position: absolute; width: 400px; height: 400px; border-radius: 50%; filter: blur(120px); opacity: 0.15; top: -100px; right: -100px; z-index: 0; transition: 0.8s ease; }
                .cny-theme .glow-orb { background-color: #ff4d4d !important; opacity: 0.25; }
                
                .upload-master-content { position: relative; z-index: 10; width: 100%; max-width: 1000px; border-radius: 40px; padding: 40px; border: 1px solid var(--surface-border); box-shadow: 0 50px 100px -20px rgba(0,0,0,0.1); transition: 0.5s; background: var(--surface); }
                .cny-theme .upload-master-content { border-color: rgba(255, 77, 77, 0.3); box-shadow: 0 50px 100px -20px rgba(255, 77, 77, 0.15); }
                .glass-morphism { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
                
                .upload-master-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-right: 60px; }
                .header-brand-info { display: flex; align-items: center; gap: 24px; }
                .artistic-cat-icon { width: 64px; height: 64px; border-radius: 20px; display: flex; align-items: center; justify-content: center; color: white; transition: 0.5s; }
                .cny-theme .artistic-cat-icon { box-shadow: 0 10px 30px rgba(255, 77, 77, 0.3) !important; }

                .text-meta h2 { font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-bottom: 4px; letter-spacing: -0.02em; }
                .cny-theme .text-meta h2 { color: #d63031; }
                .text-meta p { color: var(--text-muted); font-size: 0.95rem; font-weight: 600; }

                .upload-header-controls { display: flex; align-items: center; gap: 16px; }
                .cloud-setup-btn { background: var(--surface-badge); border: none; padding: 12px 20px; border-radius: 16px; font-weight: 800; font-size: 0.8rem; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
                .cloud-setup-btn.active { background: var(--text-main); color: var(--bg-color); }
                .cny-theme .cloud-setup-btn.active { background: #d63031; color: white; }
                
                .category-pill-selector { display: flex; background: var(--surface-badge); padding: 6px; border-radius: 18px; gap: 4px; }
                .pill-tab { width: 44px; height: 44px; border-radius: 14px; border: none; background: transparent; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: 0.4s; }
                .pill-tab.active { box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                
                .btn-close-dashboard { position: absolute; top: 20px; right: 20px; background: var(--surface); border: 1.5px solid var(--surface-border); width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: 0.3s; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .btn-close-dashboard:hover { background: #ff4d4d; color: white; border-color: #ff4d4d; transform: rotate(90deg); box-shadow: 0 10px 25px rgba(255, 77, 77, 0.4); }

                .collection-master-bar { display: flex; align-items: stretch; gap: 24px; padding: 14px 20px; border-radius: 20px; background: var(--surface-badge) !important; margin-bottom: 32px; border: 1px solid var(--surface-border); overflow: visible; min-height: 60px; flex-wrap: wrap; }
                .bar-label { font-size: 0.65rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; white-space: nowrap; border-right: 1.5px solid var(--surface-border); padding-right: 20px; }
                .collection-pills-scroll { display: flex; gap: 8px; flex-wrap: wrap; flex: 1; min-width: 0; }
                .collection-pills-scroll::-webkit-scrollbar { display: none; }
                .col-pill { white-space: nowrap; padding: 10px 18px; border-radius: 14px; border: 1.5px solid var(--surface-border); background: var(--surface); color: var(--text-muted); font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; }
                .col-pill:hover { border-color: var(--text-main); color: var(--text-main); }
                .col-pill.active { background: var(--text-main); color: var(--bg-color); border-color: var(--text-main); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
                .cny-theme .col-pill.active { background: #d63031; border-color: #d63031; box-shadow: 0 8px 16px rgba(214, 48, 49, 0.2); }

                .advanced-settings-drawer { background: var(--surface-badge); border-radius: 24px; padding: 24px; margin-bottom: 40px; border: 1px dashed var(--surface-border); animation: slideDown 0.4s ease; }
                .cny-theme .advanced-settings-drawer { background: rgba(214, 48, 49, 0.05); border-color: rgba(214, 48, 49, 0.2); }
                .drawer-grid { display: grid; grid-template-columns: 1fr 1.5fr 1fr; gap: 24px; }
                .drawer-field { display: flex; flex-direction: column; gap: 8px; }
                .drawer-field label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
                .drawer-field select, .drawer-field input { background: var(--card-dark); border: 1.5px solid var(--surface-border); color: var(--text-main); padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; outline: none; transition: 0.3s; }
                .drawer-field select:focus, .drawer-field input:focus { border-color: var(--primary); }
                .cny-theme .cny-select { border-color: #ff4d4d; color: #d63031; background: #fff5f5; }

                .upload-body-grid { display: grid; grid-template-columns: 1fr 340px; gap: 48px; }
                .input-vertical-stack { display: flex; flex-direction: column; gap: 32px; }
                .master-input-group { display: flex; flex-direction: column; gap: 10px; }
                .master-input-group label { font-size: 0.85rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px; }
                .master-input-group input { border: 2.5px solid var(--surface-border); color: var(--text-main); padding: 16px; border-radius: 18px; font-size: 1.05rem; font-weight: 600; outline: none; transition: 0.3s; background: var(--card-dark); }
                .master-input-group input:focus { border-color: var(--primary); }
                .cny-theme .master-input-group input:focus { border-color: #d63031; }

                .dropzone-duo { display: grid; gap: 16px; }
                .master-dropzone { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 24px; border: 2.5px dashed var(--surface-border); cursor: pointer; transition: 0.4s; background: var(--surface-badge); position: relative; }
                .master-dropzone:hover { border-color: var(--primary); background: var(--surface); transform: scale(1.02); }
                .cny-theme .master-dropzone:hover { border-color: #d63031; }
                .master-dropzone.ready { border-color: #10b981; background: rgba(16, 185, 129, 0.1); border-style: solid; }
                .drop-status-icon { width: 56px; height: 56px; background: var(--surface); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--text-main); }
                .ready .drop-status-icon { background: var(--surface); color: #10b981; }
                .drop-labels strong { display: block; font-size: 1rem; color: var(--text-main); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
                .drop-labels p { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
                .checked-indicator { position: absolute; right: 20px; color: #10b981; }

                .preview-drop { }
                .float-preview { width: 56px; height: 56px; border-radius: 12px; overflow: hidden; margin-left: auto; box-shadow: 0 10px 20px rgba(0,0,0,0.1); border: 2px solid var(--surface-border); }
                .float-preview img { width: 100%; height: 100%; object-fit: cover; }

                .final-actions-sidebar { display: flex; flex-direction: column; gap: 32px; }
                .live-asset-card { padding: 0; overflow: hidden; border-radius: 32px; background: var(--card-dark); border: 1px solid var(--surface-border); box-shadow: 0 30px 60px -15px rgba(0,0,0,0.08); transition: 0.4s; }
                .cny-theme .live-asset-card { border-color: #ffd7d7; }
                .card-top-preview { height: 180px; background: var(--surface-badge); display: flex; align-items: center; justify-content: center; overflow: hidden; }
                .card-top-preview img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
                .card-bottom-info { padding: 24px; }
                .badge-row { display: flex; gap: 8px; margin-bottom: 12px; }
                .cat-tag, .coll-tag { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
                .coll-tag { color: var(--text-muted); }
                .cny-theme .coll-tag { color: #d63031; }
                .card-bottom-info h4 { font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
                .meta-footer { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }

                .utility-switch-rack { background: var(--surface-badge); border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
                .switch-item { display: flex; justify-content: space-between; align-items: center; }
                .s-info strong { display: block; font-size: 0.85rem; color: var(--text-main); margin-bottom: 2px; }
                .s-info span { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
                .art-toggle { width: 44px; height: 24px; border-radius: 12px; background: var(--surface-border); border: none; cursor: pointer; position: relative; transition: 0.3s; }
                .art-toggle.on { background: var(--primary); }
                .cny-theme .art-toggle.on { background: #d63031; }
                .knob { width: 18px; height: 18px; background: var(--bg-color); border-radius: 50%; position: absolute; left: 3px; top: 3px; transition: 0.3s; }
                .art-toggle.on .knob { left: 23px; }
                .status-dot-art { width: 10px; height: 10px; border-radius: 50%; background: var(--surface-border); }
                .status-dot-art.active { background: #10b981; box-shadow: 0 0 15px #10b981; }

                .action-button-group { display: flex; flex-direction: column; gap: 12px; }
                .btn-discard { background: var(--surface-badge); color: var(--text-muted); border: none; padding: 18px; border-radius: 20px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: 0.3s; }
                .btn-discard:hover { background: var(--surface-border); color: var(--text-main); }

                .master-publish-btn { background: var(--primary); color: white; border: none; padding: 20px; border-radius: 24px; font-weight: 900; font-size: 1.05rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px; transition: 0.4s; box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 100%; }
                .cny-theme .master-publish-btn { background: #d63031; box-shadow: 0 20px 40px rgba(214, 48, 49, 0.3); }
                .master-publish-btn:hover { transform: translateY(-3px); box-shadow: 0 30px 60px var(--surface-badge); filter: brightness(1.1); }
                .cny-theme .master-publish-btn:hover { background: #b33939; box-shadow: 0 30px 60px rgba(214, 48, 49, 0.4); }
                .master-publish-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
                .master-security-disclaimer { font-size: 0.65rem; color: var(--text-muted); text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; }

                @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                .spinning { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .pulse-blue { animation: pulseB 2s infinite; }
                @keyframes pulseB { 0% { color: #111; } 50% { color: #5c67ff; } 100% { color: #111; } }
                .pulse-emerald { animation: pulseE 2s infinite; }
                @keyframes pulseE { 0% { color: #111; } 50% { color: #10b981; } 100% { color: #111; } }
                
                /* CNY Specific Animations */
                .cny-theme .text-meta { animation: cny-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
                @keyframes cny-entrance {
                   0% { transform: scale(0.9); opacity: 0; }
                   100% { transform: scale(1); opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default AssetUploadForm;
