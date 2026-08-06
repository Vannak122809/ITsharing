import React, { useState, useRef } from 'react';
import { 
    Upload, X, Monitor, Apple, CheckCircle2, 
    RefreshCw, Save, HardDrive, Layers, Cloud, Sparkles,
    Plus, Info, AlertCircle, ShieldCheck, Database, Globe, Type, Image as ImageIcon, FileCode
} from 'lucide-react';
import { uploadFileToR2 } from '../r2Utils';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import './SoftwareUploadForm.css';
import toast from 'react-hot-toast';

const SoftwareUploadForm = ({ onComplete, editData = null }) => {
    const isEditMode = !!editData;
    const [title, setTitle] = useState(editData?.title || '');
    const [os, setOs] = useState(editData?.os || 'windows');
    const [version, setVersion] = useState(editData?.version || 'Latest');
    const [size, setSize] = useState(editData?.size || '');
    const [developer, setDeveloper] = useState(editData?.developer || '');
    const [downloadUrl, setDownloadUrl] = useState(editData?.downloadUrl || editData?.url || '');
    const [description, setDescription] = useState(editData?.description || editData?.desc || '');
    const [requirements, setRequirements] = useState(
        Array.isArray(editData?.requirements) ? editData.requirements.join(', ') : ''
    );
    const [features, setFeatures] = useState(
        Array.isArray(editData?.features) ? editData.features.join(', ') : ''
    );
    const [folder, setFolder] = useState(editData?.folder || 'Software');
    const [subfolder, setSubfolder] = useState(editData?.subfolder || '');
    const [iconUrl, setIconUrl] = useState(editData?.iconUrl || editData?.icon || '');
    
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploadingIcon, setIsUploadingIcon] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedBucket, setSelectedBucket] = useState('software');

    const fileInputRef = useRef(null);
    const iconInputRef = useRef(null);

    const folderPresets = [
        'Windows',
        'Windows Server',
        'Office',
        'Visual Studio',
        'Software',
        'Tools',
        'Download',
        'Media',
        'Driver'
    ];

    const formatFileNameToTitle = (fileName) => {
        if (!fileName) return '';
        let name = fileName.split('.')[0];
        name = name.replace(/[_-]/g, ' ');
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        name = name.replace(/\s+/g, ' ').trim();
        return name.split(' ')
                   .filter(word => word.length > 0)
                   .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                   .join(' ');
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!title) setTitle(formatFileNameToTitle(file.name));
        
        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb >= 1024) {
            setSize(`${(sizeInMb / 1024).toFixed(2)} GB`);
        } else {
            setSize(`${sizeInMb.toFixed(2)} MB`);
        }

        setIsUploadingFile(true);
        setUploadProgress(0);

        try {
            const fileKey = await uploadFileToR2(file, 'software', (percent) => {
                setUploadProgress(percent);
            });
            
            const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileKey}`;
            setDownloadUrl(publicUrl);
            toast.success('Binary file uploaded successfully to Cloudflare R2!');
        } catch (error) {
            console.error('[Software Upload] R2 upload failed:', error);
            toast.error(`File upload failed: ${error.message || 'Check R2 CORS/credentials.'}`);
        } finally {
            setIsUploadingFile(false);
        }
    };

    const handleIconSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingIcon(true);
        try {
            const fileKey = await uploadFileToR2(file, 'software_icons');
            const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileKey}`;
            setIconUrl(publicUrl);
            toast.success('Icon uploaded successfully!');
        } catch (error) {
            console.error('[Icon Upload] Failed:', error);
            toast.error(`Icon upload failed: ${error.message}`);
        } finally {
            setIsUploadingIcon(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!title.trim()) {
            toast.error('Please specify a software title.');
            return;
        }
        if (!downloadUrl.trim()) {
            toast.error('Please upload a file or specify a download URL.');
            return;
        }

        setIsSaving(true);

        const requirementsArray = requirements.split(',')
            .map(r => r.trim())
            .filter(Boolean);
            
        const featuresArray = features.split(',')
            .map(f => f.trim())
            .filter(Boolean);

        const softwareDataObj = {
            title: title.trim(),
            os,
            version: version.trim() || 'Latest',
            size: size.trim() || 'Unknown',
            developer: developer.trim() || 'Unknown Developer',
            downloadUrl: downloadUrl.trim(),
            url: downloadUrl.trim(),
            iconUrl: iconUrl.trim() || null,
            icon: iconUrl.trim() || null,
            description: description.trim(),
            desc: description.trim(),
            requirements: requirementsArray.length ? requirementsArray : ['Compatible Operating System', 'Standard Hardware Specifications'],
            features: featuresArray.length ? featuresArray : ['Direct Download', 'Verified Integrity'],
            folder,
            subfolder: subfolder.trim() || null,
            updatedAt: serverTimestamp()
        };

        try {
            if (isEditMode) {
                const docRef = doc(db, 'software', editData.id);
                await updateDoc(docRef, softwareDataObj);
                toast.success('Software record updated successfully!');
            } else {
                const docRef = collection(db, 'software');
                await addDoc(docRef, {
                    ...softwareDataObj,
                    createdAt: serverTimestamp()
                });
                toast.success('Software package published successfully!');
            }

            if (onComplete) onComplete();
        } catch (error) {
            console.error('[Software DB] Failed to save software record:', error);
            toast.error(`Database save failed: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`artistic-upload-container ${os === 'mac' ? 'mac-theme' : 'windows-theme'}`}>
            {/* Artistic Background Glow */}
            <div className="glow-orb" style={{ backgroundColor: os === 'mac' ? '#a855f7' : '#2563eb' }} />

            <div className="upload-master-content glass-morphism">
                {/* Header */}
                <header className="upload-master-header">
                    <div className="header-brand-info">
                        <div 
                            className="artistic-cat-icon" 
                            style={{ 
                                backgroundColor: os === 'mac' ? '#a855f7' : '#2563eb',
                                boxShadow: `0 10px 30px ${os === 'mac' ? 'rgba(168,85,247,0.4)' : 'rgba(37,99,235,0.4)'}`
                            }}
                        >
                            <HardDrive size={28} />
                        </div>
                        <div className="text-meta">
                            <h2>{isEditMode ? 'Modify Software Identity' : 'Publish Software Package'}</h2>
                            <p>Store binaries securely in Cloudflare R2 & index in Firestore &bull; {os.toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="upload-header-controls">
                        <button 
                            type="button"
                            className={`cloud-setup-btn ${showAdvanced ? 'active' : ''}`} 
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <Cloud size={16} /> Cloud Config
                        </button>
                        <div className="os-switcher-pill">
                            <button 
                                type="button" 
                                className={`pill-os ${os === 'windows' ? 'active' : ''}`}
                                onClick={() => setOs('windows')}
                            >
                                <Monitor size={15} /> Windows
                            </button>
                            <button 
                                type="button" 
                                className={`pill-os ${os === 'mac' ? 'active' : ''}`}
                                onClick={() => setOs('mac')}
                            >
                                <Apple size={15} /> macOS
                            </button>
                        </div>
                    </div>
                </header>

                <button 
                    type="button"
                    className="btn-close-dashboard" 
                    onClick={() => onComplete && onComplete()} 
                    title="Close Form"
                >
                    <X size={20} />
                </button>

                {/* Target Category Bar */}
                <div className="collection-master-bar glass-panel">
                    <div className="bar-label">
                        <Sparkles size={16} /> Target Folder
                    </div>
                    <div className="collection-pills-scroll">
                        {folderPresets.map(f => (
                            <button 
                                type="button"
                                key={f}
                                className={`col-pill ${folder === f ? 'active' : ''}`}
                                onClick={() => setFolder(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Settings Drawer */}
                {showAdvanced && (
                    <div className="advanced-settings-drawer">
                        <div className="drawer-grid">
                            <div className="drawer-field">
                                <label><HardDrive size={13} /> Storage Bucket</label>
                                <select value={selectedBucket} onChange={(e) => setSelectedBucket(e.target.value)}>
                                    <option value="software">Cloudflare R2: SOFTWARE</option>
                                    <option value="tools">Cloudflare R2: TOOLS</option>
                                </select>
                            </div>
                            <div className="drawer-field">
                                <label><Globe size={13} /> R2 Public URL Endpoint</label>
                                <input type="text" value={import.meta.env.VITE_R2_PUBLIC_URL || 'https://r2.dev'} readOnly />
                            </div>
                            <div className="drawer-field">
                                <label><Globe size={13} /> Storage Edge Access</label>
                                <select value="public" readOnly disabled>
                                    <option value="public">Global CDN Public Edge</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Body Grid */}
                <div className="upload-body-grid">
                    {/* Left Column: Form Inputs Stack */}
                    <div className="input-vertical-stack">
                        {/* Title Input */}
                        <div className="master-input-group">
                            <label><Type size={14} /> Software Title</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Adobe Photoshop 2025, Windows 11 Pro 24H2..." 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                required 
                            />
                        </div>

                        {/* Dropzone Duo */}
                        <div className="dropzone-duo">
                            {/* Binary File Upload Zone */}
                            <div 
                                className={`master-dropzone ${isUploadingFile ? 'uploading' : ''} ${downloadUrl ? 'ready' : ''}`}
                                onClick={() => !isUploadingFile && fileInputRef.current.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileSelect} 
                                    hidden 
                                />
                                <div className="drop-status-icon">
                                    {isUploadingFile ? (
                                        <RefreshCw className="spin-icon" size={28} />
                                    ) : downloadUrl ? (
                                        <CheckCircle2 size={28} color="#10b981" />
                                    ) : (
                                        <Upload size={28} />
                                    )}
                                </div>
                                <div className="drop-labels">
                                    <strong>
                                        {isUploadingFile 
                                            ? `Uploading (${uploadProgress}%)` 
                                            : downloadUrl 
                                            ? 'Binary Package Linked' 
                                            : 'Upload Binary Package'}
                                    </strong>
                                    <p>
                                        {isUploadingFile 
                                            ? 'Uploading to Cloudflare R2...' 
                                            : size 
                                            ? `Size: ${size}` 
                                            : 'Supports ISO, EXE, DMG, ZIP over 300MB'}
                                    </p>
                                </div>
                                {downloadUrl && <CheckCircle2 className="checked-indicator" size={18} />}
                            </div>

                            {/* Icon Image Upload Zone */}
                            <div 
                                className={`master-dropzone preview-drop ${iconUrl ? 'ready' : ''}`}
                                onClick={() => !isUploadingIcon && iconInputRef.current.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={iconInputRef} 
                                    accept="image/*" 
                                    onChange={handleIconSelect} 
                                    hidden 
                                />
                                <div className="drop-status-icon">
                                    {isUploadingIcon ? <RefreshCw className="spin-icon" size={28} /> : <ImageIcon size={28} />}
                                </div>
                                <div className="drop-labels">
                                    <strong>{iconUrl ? 'Icon Asset Uploaded' : 'Add Software Icon'}</strong>
                                    <p>{iconUrl ? 'Click to replace icon' : 'PNG, WEBP, SVG app logo'}</p>
                                </div>
                                {iconUrl && (
                                    <div className="float-preview">
                                        <img src={iconUrl} alt="Icon preview" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Extra Details Grid */}
                        <div className="input-two-col-grid">
                            <div className="master-input-group">
                                <label><Layers size={14} /> Version Tag</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. v26.1.0, 24H2" 
                                    value={version} 
                                    onChange={(e) => setVersion(e.target.value)} 
                                />
                            </div>
                            <div className="master-input-group">
                                <label><Database size={14} /> Developer / Vendor</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Adobe, Microsoft" 
                                    value={developer} 
                                    onChange={(e) => setDeveloper(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="input-two-col-grid">
                            <div className="master-input-group">
                                <label><Globe size={14} /> Download URL / Mirror Link</label>
                                <input 
                                    type="url" 
                                    placeholder="Direct link or R2 public URL" 
                                    value={downloadUrl} 
                                    onChange={(e) => setDownloadUrl(e.target.value)} 
                                />
                            </div>
                            <div className="master-input-group">
                                <label><Layers size={14} /> Subfolder / Category Tag</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Graphics, Utility, Office" 
                                    value={subfolder} 
                                    onChange={(e) => setSubfolder(e.target.value)} 
                                />
                            </div>
                        </div>

                        <div className="master-input-group">
                            <label><Info size={14} /> Description</label>
                            <textarea 
                                placeholder="Provide detailed software features, specs, installation guide..." 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                rows={3}
                            />
                        </div>

                        <div className="master-input-group">
                            <label><AlertCircle size={14} /> System Requirements (Comma-separated)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Windows 11 64-bit, 8GB RAM, 4GB disk space" 
                                value={requirements} 
                                onChange={(e) => setRequirements(e.target.value)} 
                            />
                        </div>

                        <div className="master-input-group">
                            <label><Sparkles size={14} /> Key Highlights / Features (Comma-separated)</label>
                            <input 
                                type="text" 
                                placeholder="e.g. AI tools, GPU Acceleration, Multi-language" 
                                value={features} 
                                onChange={(e) => setFeatures(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Right Column: Live Card Preview & Actions Sidebar */}
                    <div className="final-actions-sidebar">
                        <div className="live-asset-card glass-panel">
                            <div className="card-top-preview" style={{ background: os === 'mac' ? 'rgba(168,85,247,0.1)' : 'rgba(37,99,235,0.1)' }}>
                                {iconUrl ? (
                                    <img src={iconUrl} alt="Software Preview" style={{ objectFit: 'contain', padding: '24px' }} />
                                ) : (
                                    <HardDrive size={54} color={os === 'mac' ? '#a855f7' : '#2563eb'} />
                                )}
                            </div>
                            <div className="card-bottom-info">
                                <div className="badge-row">
                                    <span className="cat-tag" style={{ color: os === 'mac' ? '#a855f7' : '#2563eb' }}>
                                        {os === 'mac' ? 'macOS' : 'Windows'}
                                    </span>
                                    <span className="coll-tag">{folder}</span>
                                </div>
                                <h4>{title || 'Software Title'}</h4>
                                <div className="meta-footer">
                                    <span>{size || 'Unknown size'} &bull; {version || 'Latest'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="utility-switch-rack">
                            <div className="switch-item">
                                <div className="s-info">
                                    <strong>Cloudflare R2 Direct</strong>
                                    <span>High-speed global CDN</span>
                                </div>
                                <div className="status-dot-art active" />
                            </div>
                            <div className="switch-item">
                                <div className="s-info">
                                    <strong>Firestore Sync</strong>
                                    <span>Real-time persistence</span>
                                </div>
                                <div className="status-dot-art active" />
                            </div>
                        </div>

                        <div className="action-button-group">
                            <button 
                                type="button" 
                                className="btn-discard" 
                                onClick={() => onComplete && onComplete()}
                            >
                                Discard & Close
                            </button>
                            <button 
                                type="button" 
                                className="master-publish-btn" 
                                disabled={isUploadingFile || isUploadingIcon || isSaving} 
                                onClick={handleSave}
                                style={{
                                    background: os === 'mac' ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                                }}
                            >
                                {isSaving ? (
                                    <><RefreshCw className="spinning" size={20} /> Saving...</>
                                ) : (
                                    <>{isEditMode ? <CheckCircle2 size={20} /> : <Save size={20} />} {isEditMode ? 'Save & Synchronize' : 'Finalize & Publish'}</>
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

export default SoftwareUploadForm;
