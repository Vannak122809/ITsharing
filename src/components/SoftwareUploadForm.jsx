import React, { useState, useRef, useEffect } from 'react';
import { 
    Upload, X, Monitor, Apple, CheckCircle2, 
    RefreshCw, Save, HardDrive, Cpu, Layers,
    Plus, Info, AlertCircle, ShieldCheck, Database, Globe
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

        // Auto-fill metadata fields if empty
        if (!title) setTitle(formatFileNameToTitle(file.name));
        
        // Calculate file size string
        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb >= 1024) {
            setSize(`${(sizeInMb / 1024).toFixed(2)} GB`);
        } else {
            setSize(`${sizeInMb.toFixed(2)} MB`);
        }

        setIsUploadingFile(true);
        setUploadProgress(0);

        try {
            console.log(`[Software Upload] Starting chunked upload for: ${file.name} (${file.size} bytes)`);
            const fileKey = await uploadFileToR2(file, 'software', (percent) => {
                setUploadProgress(percent);
            });
            
            const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileKey}`;
            setDownloadUrl(publicUrl);
            console.log(`[Software Upload] Upload successful. Public URL: ${publicUrl}`);
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
            console.log(`[Icon Upload] Uploading icon file: ${file.name}`);
            const fileKey = await uploadFileToR2(file, 'software_icons');
            const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${fileKey}`;
            setIconUrl(publicUrl);
            console.log(`[Icon Upload] Icon uploaded to: ${publicUrl}`);
        } catch (error) {
            console.error('[Icon Upload] Failed:', error);
            toast.error(`Icon upload failed: ${error.message}`);
        } finally {
            setIsUploadingIcon(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
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
            url: downloadUrl.trim(), // fallback field
            iconUrl: iconUrl.trim() || null,
            icon: iconUrl.trim() || null, // fallback field
            description: description.trim(),
            desc: description.trim(), // fallback field
            requirements: requirementsArray.length ? requirementsArray : ['Compatible Operating System', 'Standard Hardware Specifications'],
            features: featuresArray.length ? featuresArray : ['Direct Download', 'Verified Integrity'],
            folder,
            subfolder: subfolder.trim() || null,
            updatedAt: serverTimestamp()
        };

        try {
            if (isEditMode) {
                console.log(`[Software DB] Updating existing software document: ${editData.id}`);
                const docRef = doc(db, 'software', editData.id);
                await updateDoc(docRef, softwareDataObj);
            } else {
                console.log('[Software DB] Creating new software document');
                const docRef = collection(db, 'software');
                await addDoc(docRef, {
                    ...softwareDataObj,
                    createdAt: serverTimestamp()
                });
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
        <div className={`software-upload-container ${os}-theme`}>
            {/* Subtle glow effect */}
            <div className="glow-orb-soft" />

            <div className="software-upload-card glass-morphism-soft">
                <header className="software-upload-header">
                    <div className="header-info">
                        <div className="icon-wrapper">
                            <HardDrive size={26} />
                        </div>
                        <div className="title-text">
                            <h2>{isEditMode ? 'Modify Software Identity' : 'Publish New Software Package'}</h2>
                            <p>Store binaries securely in Cloudflare R2 and index in Firestore</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onComplete} title="Close Form">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSave} className="software-upload-body">
                    <div className="form-main-grid">
                        {/* Column 1: Metadata inputs */}
                        <div className="inputs-column">
                            <div className="input-row" style={{ alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ minWidth: '80px', width: '80px' }}>
                                    <label>Icon</label>
                                    <div 
                                        className="icon-upload-preview-box" 
                                        onClick={() => !isUploadingIcon && iconInputRef.current.click()}
                                        style={{
                                            width: '80px',
                                            height: '48px',
                                            borderRadius: '12px',
                                            border: '2px dashed var(--surface-border)',
                                            background: 'var(--surface-badge)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}
                                    >
                                        <input 
                                            type="file" 
                                            ref={iconInputRef} 
                                            accept="image/*" 
                                            onChange={handleIconSelect} 
                                            hidden 
                                        />
                                        {isUploadingIcon ? (
                                            <RefreshCw className="spin-icon" size={16} />
                                        ) : iconUrl ? (
                                            <img src={iconUrl} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Plus size={16} />
                                        )}
                                    </div>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Software Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Adobe Photoshop 2025" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>OS Platform</label>
                                    <div className="os-switcher">
                                        <button 
                                            type="button" 
                                            className={`os-btn win ${os === 'windows' ? 'active' : ''}`}
                                            onClick={() => setOs('windows')}
                                        >
                                            <Monitor size={16} /> Windows
                                        </button>
                                        <button 
                                            type="button" 
                                            className={`os-btn mac ${os === 'mac' ? 'active' : ''}`}
                                            onClick={() => setOs('mac')}
                                        >
                                            <Apple size={16} /> macOS
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="form-group flex-1">
                                    <label>Target Repository Folder</label>
                                    <select value={folder} onChange={(e) => setFolder(e.target.value)}>
                                        {folderPresets.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div className="form-group flex-1">
                                    <label>Subfolder (Optional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Graphic Card, Attendance" 
                                        value={subfolder} 
                                        onChange={(e) => setSubfolder(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="input-row">
                                <div className="form-group flex-1">
                                    <label>Version Tag</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. v26.1.0, 24H2" 
                                        value={version} 
                                        onChange={(e) => setVersion(e.target.value)} 
                                    />
                                </div>
                                <div className="form-group flex-1">
                                    <label>Software Developer</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Adobe, Microsoft" 
                                        value={developer} 
                                        onChange={(e) => setDeveloper(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea 
                                    placeholder="Provide detailed description of the software features, installation instructions, reset options, etc." 
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label>Hardware/OS Requirements (Comma-separated list)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Windows 11 64-bit, 8GB RAM, 4GB disk space" 
                                    value={requirements} 
                                    onChange={(e) => setRequirements(e.target.value)} 
                                />
                            </div>

                            <div className="form-group">
                                <label>Key Features / Highlights (Comma-separated list)</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. AI-powered editing, GPU acceleration, Multi-language support" 
                                    value={features} 
                                    onChange={(e) => setFeatures(e.target.value)} 
                                />
                            </div>
                        </div>

                        {/* Column 2: Upload Zone & Actions */}
                        <div className="sidebar-column">
                            <div className="form-group">
                                <label>Software Package File (Cloudflare R2 Direct)</label>
                                <div 
                                    className={`file-upload-zone ${isUploadingFile ? 'uploading' : ''} ${downloadUrl ? 'has-file' : ''}`}
                                    onClick={() => !isUploadingFile && fileInputRef.current.click()}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileSelect} 
                                        hidden 
                                    />
                                    {isUploadingFile ? (
                                        <div className="uploading-state">
                                            <RefreshCw className="spin-icon" size={32} />
                                            <strong>Uploading Part Chunks...</strong>
                                            <div className="progress-bar-wrapper">
                                                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                                            </div>
                                            <span>{uploadProgress}% completed</span>
                                        </div>
                                    ) : downloadUrl ? (
                                        <div className="uploaded-state">
                                            <CheckCircle2 size={32} className="success-icon" />
                                            <strong>Package Linked Successfully</strong>
                                            <p className="file-info">{size || 'Unknown size'}</p>
                                            <span className="file-url-hint">{downloadUrl.substring(0, 45)}...</span>
                                        </div>
                                    ) : (
                                        <div className="idle-state">
                                            <Upload size={32} />
                                            <strong>Drag or Browse Binary</strong>
                                            <p>Supports files over 300MB via chunked multipart upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Download Link / External URL</label>
                                <input 
                                    type="url" 
                                    placeholder="Paste URL if not uploading (e.g. Google Drive, official site)" 
                                    value={downloadUrl} 
                                    onChange={(e) => setDownloadUrl(e.target.value)} 
                                />
                            </div>

                            <div className="form-group">
                                <label>Package Size</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 5.2 GB, 120 MB" 
                                    value={size} 
                                    onChange={(e) => setSize(e.target.value)} 
                                />
                            </div>

                            <div className="actions-rack">
                                <button type="button" className="btn-cancel-soft" onClick={onComplete}>
                                    Discard
                                </button>
                                <button type="submit" className="btn-save-soft" disabled={isUploadingFile || isSaving}>
                                    {isSaving ? <RefreshCw className="spin-icon" size={18} /> : <Save size={18} />}
                                    {isEditMode ? 'Update Software' : 'Publish Software'}
                                </button>
                            </div>

                            <p className="security-note">
                                <ShieldCheck size={12} /> Encrypted R2 Storage Edge Channel
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SoftwareUploadForm;
