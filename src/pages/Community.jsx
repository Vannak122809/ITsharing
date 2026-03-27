import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, User, Send, Ghost } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc,
  orderBy, query, serverTimestamp, updateDoc, increment,
} from 'firebase/firestore';
import { getUserNickname } from '../userService';

const Community = () => {
  const [user, setUser]           = useState(null);
  const [nickname, setNickname]   = useState('');
  const [posts, setPosts]         = useState([]);
  const navigate = useNavigate();
  const [newTitle, setNewTitle]   = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting]     = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // ── Auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && !u.isAnonymous) {
        const nick = await getUserNickname(u.uid);
        setNickname(nick === 'Unknown' ? '' : nick);
      } else if (u && u.isAnonymous) {
        // Redirect anonymous guest away from community
        navigate('/login');
      } else if (!u) {
        // Redirect unauthenticated guest away from community
        navigate('/login');
      } else {
        setNickname('');
      }
    });
    return () => unsub();
  }, []);


  // ── Load posts from Firestore ──────────────────────────────────────
  useEffect(() => {
    const SAMPLE = [
      { id: '1', title: "How to fix 'VCRUNTIME140.dll missing' error?", author: 'TechStudent99', content: 'Whenever I try to open a newly installed Adobe software, I get this error. Any ideas?', likes: 12, replies: 4, date: '2 hours ago' },
      { id: '2', title: 'Best laptop for learning React and Node.js?', author: 'CodeNewbie', content: 'My budget is around $800. Should I get a used M1 Mac or a new Windows laptop?', likes: 8, replies: 15, date: '5 hours ago' },
    ];

    // 3-second safety timeout — show sample data if Firestore is slow/not configured
    const timer = setTimeout(() => {
      setLoadingPosts(prev => { if (prev) { setPosts(SAMPLE); return false; } return prev; });
    }, 3000);

    const load = async () => {
      try {
        const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(loaded.length > 0 ? loaded : SAMPLE);
      } catch {
        setPosts(SAMPLE);
      } finally {
        clearTimeout(timer);
        setLoadingPosts(false);
      }
    };
    load();
    return () => clearTimeout(timer);
  }, []);


  // ── Determine display name ─────────────────────────────────────────
  const authorName = () => {
    if (!user) return 'Anonymous';
    if (user.isAnonymous) return 'Guest';
    return nickname || user.email?.split('@')[0] || 'User';
  };

  // ── Post a new question ────────────────────────────────────────────
  const handlePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!user) { alert('Please sign in to post a question.'); return; }
    if (!nickname && !user.isAnonymous) {
      alert('Please set a nickname in your Profile first, then come back to post!');
      return;
    }

    setPosting(true);
    const postData = {
      title: newTitle.trim(),
      content: newContent.trim(),
      author: authorName(),
      authorUid: user.uid,
      likes: 0,
      replies: 0,
      createdAt: serverTimestamp(),
    };

    try {
      const ref = await addDoc(collection(db, 'communityPosts'), postData);
      setPosts(prev => [{ id: ref.id, ...postData, date: 'Just now' }, ...prev]);
      setNewTitle('');
      setNewContent('');
    } catch {
      // Offline / permission issue — add locally
      setPosts(prev => [{ id: Date.now().toString(), ...postData, date: 'Just now' }, ...prev]);
      setNewTitle('');
      setNewContent('');
    } finally {
      setPosting(false);
    }
  };

  // ── Like a post ────────────────────────────────────────────────────
  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p));
    try {
      await updateDoc(doc(db, 'communityPosts', postId), { likes: increment(1) });
    } catch { /* offline */ }
  };

  const needsNickname = user && !user.isAnonymous && !nickname;

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient">Community Q&amp;A Forum</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ask questions, get help, and discuss IT topics with the community.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'start' }}>

        {/* ── Posts list ── */}
        <div>
          {loadingPosts ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading posts…</p>
          ) : posts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
              <MessageSquare size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to ask a question!</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} className="glass-panel" style={{ padding: '24px', marginBottom: '16px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.4 }}>{post.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {post.date || 'Recently'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.93rem', lineHeight: 1.6 }}>{post.content}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
                {/* Author badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                    {(post.author || '?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500 }}>{post.author}</span>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleLike(post.id)} className="btn btn-outline" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <ThumbsUp size={13} /> {post.likes || 0}
                  </button>
                  <button className="btn btn-outline" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <MessageSquare size={13} /> {post.replies || 0} Replies
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sidebar: Post form & info ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Nickname warning */}
          {needsNickname && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', padding: '16px', fontSize: '0.88rem', color: '#f59e0b' }}>
              ⚠️ You need a <strong>nickname</strong> to post. Go to{' '}
              <a href="/profile" style={{ color: '#f59e0b', fontWeight: 700 }}>Profile → Set Nickname</a>{' '}first.
            </div>
          )}

          {/* Who am I posting as */}
          {user && (
            <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-muted)', border: '1px solid var(--surface-border)' }}>
              {user.isAnonymous ? <Ghost size={16} /> : <User size={16} color="var(--primary)" />}
              Posting as <strong style={{ color: 'var(--primary)', marginLeft: '4px' }}>{authorName()}</strong>
            </div>
          )}

          {/* Form */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} /> Ask a Question
            </h3>
            <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Question title…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="input-field"
                required
                disabled={needsNickname}
              />
              <textarea
                placeholder="Describe your issue or question in detail…"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="input-field"
                style={{ minHeight: '120px', resize: 'vertical' }}
                required
                disabled={needsNickname}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }}
                disabled={posting || needsNickname || !user}>
                {posting ? 'Posting…' : <><Send size={15} /> Post Question</>}
              </button>
              {!user && (
                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <a href="/login" style={{ color: 'var(--primary)' }}>Sign in</a> to post a question
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
