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
import './AssetUploadForm.css';

const AssetUploadForm = ({ onComplete, editData = null }) => {
    const isEditMode = !!editData;
    const [softwareType, setSoftwareType] = useState(editData?.category || 'Photoshop'); 
    const [mainFiles, setMainFiles] = useState([]);
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

    const [availableCategories, setAvailableCategories] = useState([
        { id: 'General', label: 'All Library', icon: <Layout size={14} /> },
        { id: 'Chinese New Year', label: '🧧 Chinese Special', icon: <Sparkles size={14} /> },
        { id: 'Khmer New Year', label: '🇰🇭 Khmer Special', icon: <Zap size={14} /> },
        { id: 'Frame', label: '🖼️ Frames', icon: <ImageIcon size={14} /> },
        { id: 'Luxury', label: '💎 Luxury Assets', icon: <Star size={14} /> },
        { id: 'Template', label: '📐 Templates', icon: <Palette size={14} /> },
        { id: 'Illustration', label: '🎨 Illustrations', icon: <Layers size={14} /> },
        { id: 'Image', label: '📸 Real Images', icon: <ImageIcon size={14} /> }
    ]);
    const [isCreatingCol, setIsCreatingCol] = useState(false);
    const [newColTitle, setNewColTitle] = useState('');

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
        // Remove numbers
        name = name.replace(/[0-9]/g, '');
        // Replace dashes and underscores with spaces
        name = name.replace(/[_-]/g, ' ');
        // Insert space before capital letters (for CamelCase)
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        // Clean up extra spaces
        name = name.replace(/\s+/g, ' ').trim();
        // Capitalize each word properly
        return name.split(' ')
                   .filter(word => word.length > 0)
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                   .join(' ');
    };

    const handleMainFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setMainFiles(files);
            // Auto-title if currently empty
            if (files.length === 1 && !title) {
                setTitle(formatFileNameToTitle(files[0].name));
            } else if (files.length > 1) {
                setTitle(`Batch Upload: ${files.length} Resources`);
            }
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
        if (!isEditMode && mainFiles.length === 0) {
            alert('Please select files to proceed.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(5);

        try {
            if (isEditMode) {
                // Edit handles only the first selected file or none
                let currentFile = mainFiles[0];
                let displayUrl = editData?.url || '';
                let galleryUrls = editData?.gallery || (editData?.url ? [editData.url] : []);
                let sourceUrl = editData?.sourceUrl || '';
                
                // 1. Upload Source File (only if new file selected)
                if (currentFile) {
                    const sourceKey = await uploadAssetToR2(currentFile, currentFormat.folder, selectedBucket);
                    sourceUrl = `${customPublicUrl}/${sourceKey}`;
                }
                setUploadProgress(55);

                // 2. Upload/Convert Cover Images (only if new files selected)
                if (coverFiles.length > 0 || (currentFile && !isEditMode && coverFiles.length === 0)) {
                    let displayUrls = [];
                    const filesToUpload = coverFiles.length > 0 ? coverFiles : [currentFile];
                    
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

                await updateDoc(doc(db, 'assets', editData.id), assetData);
            } else {
                // Batch Upload Mode for New Records
                const totalFiles = mainFiles.length;
                let processed = 0;

                for (let idx = 0; idx < totalFiles; idx++) {
                    const currentFile = mainFiles[idx];
                    const currentTitle = totalFiles === 1 ? title : formatFileNameToTitle(currentFile.name);
                    
                    let displayUrl = '';
                    let galleryUrls = [];
                    let sourceUrl = '';

                    const sourceKey = await uploadAssetToR2(currentFile, currentFormat.folder, selectedBucket);
                    sourceUrl = `${customPublicUrl}/${sourceKey}`;
                    
                    setUploadProgress(Math.round(((processed + 0.3) / totalFiles) * 100));

                    // Use coverFiles only if 1 main file is uploaded. Otherwise use the currentFile itself implicitly!
                    const filesToUseForCover = (totalFiles === 1 && coverFiles.length > 0) ? coverFiles : [currentFile];
                    let displayUrls = [];

                    for (let c = 0; c < filesToUseForCover.length; c++) {
                        const fileToCover = filesToUseForCover[c];
                        if (autoWebP && fileToCover.type.startsWith('image/')) {
                            const webpBlob = await convertToWebP(fileToCover, 0.85);
                            const safeTitle = currentTitle.replace(/[^a-zA-Z0-9]/g, '');
                            const webpFile = new File([webpBlob], `${safeTitle}-${c}.webp`, { type: 'image/webp' });
                            const displayKey = await uploadAssetToR2(webpFile, 'display', selectedBucket);
                            displayUrls.push(`${customPublicUrl}/${displayKey}`);
                        } else {
                            const displayKey = await uploadAssetToR2(fileToCover, 'display', selectedBucket);
                            displayUrls.push(`${customPublicUrl}/${displayKey}`);
                        }
                    }
                    displayUrl = displayUrls[0];
                    galleryUrls = displayUrls;

                    setUploadProgress(Math.round(((processed + 0.6) / totalFiles) * 100));

                    let technicalType = selectedCategories[0] || 'Template';
                    if (softwareType === 'PNG' && !selectedCategories.includes('Frame')) technicalType = 'Image';
                    
                    const expandedTags = [
                        ...tags.split(',').map(tag => tag.trim()).filter(Boolean),
                        ...selectedCategories
                    ];
                    const uniqueTags = [...new Set(expandedTags)];

                    const assetData = {
                        title: currentTitle,
                        type: technicalType,
                        category: softwareType,
                        collection: selectedCategories,
                        url: displayUrl,
                        gallery: galleryUrls,
                        sourceUrl: sourceUrl,
                        tags: uniqueTags,
                        format: currentFile.name.split('.').pop().toUpperCase(),
                        downloads: 0,
                        likes: 0,
                        featured: false,
                        dimensions: 'High-Res',
                        size: `${(currentFile.size / (1024 * 1024)).toFixed(2)} MB`,
                        bucket: selectedBucket,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };

                    await addDoc(collection(db, 'assets'), assetData);
                    processed++;
                    setUploadProgress(Math.round((processed / totalFiles) * 100));
                }
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
                        
                        {isCreatingCol ? (
                            <div className="new-col-input-group">
                                <input 
                                    type="text" 
                                    placeholder="Collection Name..." 
                                    value={newColTitle}
                                    onChange={(e) => setNewColTitle(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const name = newColTitle.trim();
                                            if (name) {
                                                const newCol = { id: name, label: name, icon: <Plus size={14} /> };
                                                setAvailableCategories(prev => [...prev, newCol]);
                                                setSelectedCategories(prev => [...prev, name]);
                                                setNewColTitle('');
                                                setIsCreatingCol(false);
                                            }
                                        } else if (e.key === 'Escape') {
                                            setIsCreatingCol(false);
                                        }
                                    }}
                                />
                                <button className="confirm-new-col" onClick={() => {
                                    const name = newColTitle.trim();
                                    if (name) {
                                        const newCol = { id: name, label: name, icon: <Plus size={14} /> };
                                        setAvailableCategories(prev => [...prev, newCol]);
                                        setSelectedCategories(prev => [...prev, name]);
                                        setNewColTitle('');
                                        setIsCreatingCol(false);
                                    }
                                }}>Add</button>
                            </div>
                        ) : (
                            <button className="col-pill add-new-trigger" onClick={() => setIsCreatingCol(true)}>
                                <Plus size={14} /> New Collection
                            </button>
                        )}
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
                            <div className={`master-dropzone ${mainFiles.length > 0 ? 'ready' : ''}`} onClick={() => mainFileInputRef.current.click()}>
                                <input type="file" ref={mainFileInputRef} onChange={handleMainFileSelect} multiple hidden />
                                <div className="drop-status-icon">
                                    {mainFiles.length > 0 ? <FileCode className="pulse-blue" size={28} /> : <Upload size={28} />}
                                </div>
                                <div className="drop-labels">
                                    <strong>{mainFiles.length > 1 ? `${mainFiles.length} Selected Files` : (mainFiles[0] ? mainFiles[0].name : 'Upload Master File(s)')}</strong>
                                    <p>{mainFiles.length > 0 ? (mainFiles.length > 1 ? 'Batch processing active' : `${(mainFiles[0].size/1024/1024).toFixed(2)} MB`) : '.PSD, .AI, .EPS source file(s)'}</p>
                                </div>
                                {mainFiles.length > 0 && <CheckCircle2 className="checked-indicator" size={18} />}
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
                            <button className="master-publish-btn" disabled={isUploading || (!isEditMode && mainFiles.length === 0)} onClick={handleUpload}>
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

        </div>
    );
};

export default AssetUploadForm;
