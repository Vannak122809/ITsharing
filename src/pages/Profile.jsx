import React, { useState, useEffect, useRef } from 'react';
import { getUserProfile, saveProfileField } from '../userService';
import {
  Camera, Pencil, Check, X, MapPin, Link as LinkIcon,
  Calendar, BookOpen, DownloadCloud, Heart, MessageSquare,
  Loader, Grid, List, Settings, ImageOff
} from 'lucide-react';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from '../r2';

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────
const PUBLIC_CDN = import.meta.env.VITE_R2_PUBLIC_URL; // e.g. https://pub-xxx.r2.dev
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_MB = 2;
const MAX_COVER_MB  = 4;

// ────────────────────────────────────────────────────────────────────────────
// UPLOAD FUNCTION (Upload → R2 → return public URL)
// ────────────────────────────────────────────────────────────────────────────
/**
 * Upload image to R2 and return its public URL.
 * @param {File}   file  - image selected by user
 * @param {string} path  - R2 key, e.g. "images/avatars/uid123.jpg"
 * @returns {Promise<string>} full public CDN URL
 */
const uploadImageAndGetUrl = async (file, path) => {
  // Step 1: read file as binary
  const buffer = await file.arrayBuffer();

  // Step 2: upload to R2 bucket
  await r2Client.send(new PutObjectCommand({
    Bucket:      BUCKET_NAME,
    Key:         path,
    Body:        new Uint8Array(buffer),
    ContentType: file.type,
  }));

  // Step 3: build public URL (cache-busted so browser always fetches fresh)
  return `${PUBLIC_CDN}/${path}?v=${Date.now()}`;
};

// ────────────────────────────────────────────────────────────────────────────
// INLINE-EDITABLE FIELD COMPONENT
// ────────────────────────────────────────────────────────────────────────────
const EditableField = ({ value, onSave, placeholder, multiline = false }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  const commit = () => { if (val.trim() !== value) onSave(val.trim()); setEditing(false); };
  const cancel = () => { setVal(value); setEditing(false); };

  if (!editing)
    return (
      <span
        onClick={() => setEditing(true)}
        title="Click to edit"
        style={{
          cursor: 'pointer',
          borderBottom: '1px dashed var(--primary)',
          paddingBottom: '1px',
          color: value ? 'inherit' : 'var(--text-muted)',
          fontStyle: value ? 'normal' : 'italic',
        }}
      >
        {value || placeholder}
      </span>
    );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
      {multiline ? (
        <textarea
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          maxLength={160}
          onKeyDown={e => e.key === 'Escape' && cancel()}
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'var(--card-dark)', color: 'var(--text-main)', fontFamily: 'inherit', fontSize: 'inherit', resize: 'vertical', outline: 'none' }}
        />
      ) : (
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          autoFocus
          maxLength={80}
          className="input-field"
          style={{ flex: 1, minWidth: '180px', padding: '8px 14px' }}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
        />
      )}
      <button onClick={commit} className="btn btn-primary" style={{ padding: '8px 14px' }}><Check size={14} /></button>
      <button onClick={cancel} className="btn btn-outline" style={{ padding: '8px 12px' }}><X size={14} /></button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE
// ────────────────────────────────────────────────────────────────────────────
const Profile = ({ user }) => {
  const avatarInput = useRef(null);

  // Profile state
  const [loading, setLoading]     = useState(true);
  const [nickname, setNickname]   = useState('');
  const [bio, setBio]             = useState('');
  const [location, setLocation]   = useState('');
  const [website, setWebsite]     = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // URL loaded from Firestore / just uploaded

  // Upload state
  const [avatarStatus, setAvatarStatus] = useState('idle'); // 'idle' | 'uploading' | 'done' | 'error'
  const [uploadError, setUploadError]   = useState('');

  const [activeTab, setActiveTab] = useState('posts');

  // ── STEP 3: DISPLAY — load saved URL from Firestore on mount ─────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserProfile(user.uid)
      .then(profile => {
        if (profile) {
          setNickname(profile.nickname  || '');
          setBio(profile.bio            || '');
          setLocation(profile.location  || '');
          setWebsite(profile.website    || '');

          // ← display the saved avatar URL
          setAvatarUrl(profile.avatarUrl || '');
        }
      })
      .catch(err => console.error('[Profile] load failed:', err))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Save a single Firestore field ─────────────────────────────────────────
  const save = (field, value) => {
    if (!user) return;
    saveProfileField(user.uid, field, value).catch(console.error);
  };

  // ── STEP 1 & 2: UPLOAD then DISPLAY ──────────────────────────────────────
  const handleImagePick = async (file, type) => {
    if (!file || !user) return;
    setUploadError('');

    // Validate
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Only JPG, PNG, WebP or GIF images are allowed.');
      return;
    }
    const maxMB = type === 'avatar' ? MAX_AVATAR_MB : MAX_COVER_MB;
    if (file.size > maxMB * 1024 * 1024) {
      setUploadError(`Image must be smaller than ${maxMB} MB.`);
      return;
    }

    // ── STEP 1: UPLOAD to R2 ─────────────────────────────────────────────
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = type === 'avatar'
      ? `images/avatars/${user.uid}.${ext}`   // R2 path for avatar
      : `images/covers/${user.uid}.${ext}`;   // R2 path for cover

    if (type === 'avatar') setAvatarStatus('uploading');
    else                   setCoverStatus('uploading');

    try {
      // Show local preview instantly while uploading
      const localPreview = URL.createObjectURL(file);
      if (type === 'avatar') setAvatarUrl(localPreview);
      else                   setCoverUrl(localPreview);

      // Upload to R2 → get public URL
      const publicUrl = await uploadImageAndGetUrl(file, path);

      // ── STEP 2: SAVE URL to Firestore ──────────────────────────────────
      const field = type === 'avatar' ? 'avatarUrl' : 'coverUrl';
      await saveProfileField(user.uid, field, publicUrl);

      // ── STEP 3: DISPLAY — update state with the real CDN URL ───────────
      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
        setAvatarStatus('done');
      } else {
        setCoverUrl(publicUrl);
        setCoverStatus('done');
      }

      // Revoke the local blob URL to free memory
      URL.revokeObjectURL(localPreview);
      setTimeout(() => {
        if (type === 'avatar') setAvatarStatus('idle');
        else                   setCoverStatus('idle');
      }, 2000);

    } catch (err) {
      console.error('[Profile] upload error:', err);
      setUploadError(`Upload failed: ${err.message || 'Check R2 CORS settings.'}`);
      if (type === 'avatar') { setAvatarUrl(''); setAvatarStatus('error'); }
      else                   { setCoverUrl('');  setCoverStatus('error'); }
    } finally {
      // Reset file input so the same file can be re-selected
      if (avatarInput.current) avatarInput.current.value = '';
      if (coverInput.current)  coverInput.current.value  = '';
    }
  };

  // ── Avatar letter fallback ─────────────────────────────────────────────
  const displayName  = nickname || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() ?? '?';
  const joinedDate   = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently joined';

  const TABS = [
    { id: 'posts',    label: 'Posts',    icon: <Grid size={16} /> },
    { id: 'activity', label: 'Activity', icon: <List size={16} /> },
    { id: 'saved',    label: 'Saved',    icon: <Heart size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Loader size={32} className="spin" color="var(--primary)" />
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '900px', paddingBottom: '60px', marginTop: '40px' }}>

        {/* Avatar + Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-52px', marginBottom: '20px', flexWrap: 'wrap' }}>

          {/* ── Avatar ── */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={() => avatarInput.current?.click()}
              style={{
                width: 120, height: 120, borderRadius: '50%',
                border: '4px solid var(--nav-bg)',
                overflow: 'hidden',
                background: avatarUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '2.8rem', fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s',
                flexShrink: 0,
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform  = 'scale(1)'}
              title="Click to change photo"
            >
              {avatarStatus === 'uploading' ? (
                <Loader size={28} className="spin" />
              ) : avatarUrl ? (
                /* Display: show the uploaded image */
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    // If CDN URL fails to load, hide image and show letter
                    e.currentTarget.style.display = 'none';
                    setAvatarUrl('');
                  }}
                />
              ) : (
                avatarLetter
              )}
            </div>

            {/* Camera badge */}
            <button
              onClick={() => avatarInput.current?.click()}
              disabled={avatarStatus === 'uploading'}
              title="Upload photo"
              style={{
                position: 'absolute', bottom: 4, right: 4,
                width: 32, height: 32, borderRadius: '50%',
                background: avatarStatus === 'done' ? '#00c97d' : 'var(--primary)',
                color: '#fff',
                border: '3px solid var(--nav-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {avatarStatus === 'done' ? <Check size={13} /> : <Camera size={13} />}
            </button>

            {/* Hidden file input for avatar */}
            <input
              ref={avatarInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImagePick(f, 'avatar'); }}
            />
          </div>

          {/* Name + upload hint */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 8 }}>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px' }}>
              <EditableField
                value={nickname}
                placeholder="Set your nickname"
                onSave={v => { setNickname(v); save('nickname', v); }}
              />
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
            {avatarStatus === 'uploading' && (
              <p style={{ color: 'var(--primary)', fontSize: '0.82rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader size={12} className="spin" /> Uploading photo to R2…
              </p>
            )}
            {avatarStatus === 'done' && (
              <p style={{ color: '#00c97d', fontSize: '0.82rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={12} /> Photo saved & displayed!
              </p>
            )}
            {uploadError && (
              <p style={{ color: '#ff2a7a', fontSize: '0.82rem', marginTop: 6 }}>⚠ {uploadError}</p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
              Click avatar to upload · JPG/PNG/WebP/GIF · Avatar max 2 MB
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap' }}>
          {[{ label: 'Posts', value: '12' }, { label: 'Downloads', value: '45' }, { label: 'Saved', value: '28' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bio + Meta */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: '0.97rem', color: 'var(--text-main)', marginBottom: 12, lineHeight: 1.6 }}>
            <EditableField value={bio} placeholder="Write a short bio…" multiline
              onSave={v => { setBio(v); save('bio', v); }} />
          </p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.88rem', color: 'var(--text-muted)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color="var(--primary)" />
              <EditableField value={location} placeholder="Add location"
                onSave={v => { setLocation(v); save('location', v); }} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LinkIcon size={14} color="var(--primary)" />
              <EditableField value={website} placeholder="Add website"
                onSave={v => { setWebsite(v); save('website', v); }} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color="var(--primary)" />
              Joined {joinedDate}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 24, fontStyle: 'italic' }}>
          💡 Click name, bio, location or website to edit directly.
        </p>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--surface-border)', display: 'flex', gap: 4, marginBottom: 32 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 20px', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', marginBottom: '-1px',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'posts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: 'How to set up Mikrotik Router?', likes: 8, replies: 3, date: '2 days ago' },
              { title: 'CCNA Study Notes — Week 1', likes: 14, replies: 7, date: '5 days ago' },
            ].map((p, i) => (
              <div key={i} className="glass-panel" style={{ padding: 20, borderRadius: 14, border: '1px solid var(--surface-border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>{p.title}</h3>
                <div style={{ display: 'flex', gap: 16, fontSize: '0.82rem', color: 'var(--text-muted)', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{p.date}</span>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {p.likes}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} /> {p.replies}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { action: '⬇ Downloaded', item: 'Mikrotik & UniFi Networking.pdf', time: '1 hour ago' },
              { action: '❤ Saved',      item: 'CCNA Course — Module 3',           time: '3 hours ago' },
              { action: '💬 Replied to', item: "'Best laptop for React?'",         time: '1 day ago' },
            ].map((a, i) => (
              <div key={i} className="glass-panel" style={{ padding: '16px 20px', borderRadius: 12, display: 'flex', gap: 16, alignItems: 'center', border: '1px solid var(--surface-border)' }}>
                <p style={{ margin: 0, flex: 1, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{a.action}</span> {a.item}
                </p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{a.time}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: 'CCNA Course', type: 'Course', icon: <BookOpen size={18} color="var(--primary)" /> },
              { title: 'Windows 11 ISO', type: 'Software', icon: <DownloadCloud size={18} color="#00fa9a" /> },
              { title: 'Python Basics PDF', type: 'Document', icon: <Heart size={18} color="#ff2a7a" /> },
            ].map((s, i) => (
              <div key={i} className="glass-panel" style={{ padding: 20, borderRadius: 14, border: '1px solid var(--surface-border)', display: 'flex', gap: 14, alignItems: 'center' }}>
                {s.icon}
                <div>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: '0.92rem', color: 'var(--text-main)' }}>{s.title}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel" style={{ padding: 28, borderRadius: 16, border: '1px solid var(--surface-border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20, color: 'var(--text-main)' }}>Account Settings</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
              Email: <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
              UID: <code style={{ fontSize: '0.8rem', background: 'var(--surface-badge)', padding: '2px 8px', borderRadius: 6 }}>{user?.uid}</code>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 16, fontStyle: 'italic' }}>
              💡 To change your password, use <strong>Forgot Password</strong> on the Sign In page.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
