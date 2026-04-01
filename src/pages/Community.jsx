import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, User, Send, Ghost, Trash2, MoreVertical, CornerDownRight, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, deleteDoc,
  orderBy, query, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove,
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
  const [openRepliesId, setOpenRepliesId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [optionsOpenId, setOptionsOpenId] = useState(null);

  // ── Auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const nick = await getUserNickname(u.uid);
        setNickname(nick === 'Unknown' ? '' : nick);
      } else {
        setNickname('');
        // Redirect unauthenticated guest away from community
        navigate('/login');
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
    if (!user) return 'User';
    return nickname || user.email?.split('@')[0] || 'User';
  };

  // ── Post a new question ────────────────────────────────────────────
  const handlePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!user) { alert('Please sign in to post a question.'); return; }
    if (!nickname) {
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
      likedBy: [],
      replies: 0,
      repliesList: [],
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
    if (!user) { alert("Please sign in to react."); return; }
    
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = posts[postIndex];
    
    // Safely get list of users who liked this
    const likedBy = post.likedBy || [];
    const hasLiked = likedBy.includes(user.uid);
    
    const newLikes = hasLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1;
    const newLikedBy = hasLiked ? likedBy.filter(id => id !== user.uid) : [...likedBy, user.uid];

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes, likedBy: newLikedBy } : p));
    
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        likes: hasLiked ? increment(-1) : increment(1),
        likedBy: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch { /* offline */ }
  };

  // ── Repost an expired post ─────────────────────────────────────────
  const handleRepost = async (postId) => {
    if (!window.confirm("Repost this so it stays visible to the community for another 24 hours?")) return;
    
    // Update locally so UI reacts instantly
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, createdAt: { toMillis: () => Date.now() }, date: 'Just now' } : p));
    
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Repost failed", err);
    }
  };

  // ── Delete a post ──────────────────────────────────────────────────
  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ── Submit a reply ─────────────────────────────────────────────────
  const submitReply = async (postId) => {
    if (!replyContent.trim()) return;
    if (!user || (!nickname && user.email)) {
      alert("Please sign in and set a nickname to reply.");
      return;
    }

    const post = posts.find(p => p.id === postId);
    if ((post?.repliesList || []).some(r => r.authorUid === user.uid)) {
      alert("You have already replied to this post.");
      return;
    }

    const newReply = {
      id: Date.now().toString(),
      author: authorName(),
      authorUid: user.uid,
      content: replyContent.trim(),
      date: new Date().toLocaleDateString()
    };
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          replies: (p.replies || 0) + 1, 
          repliesList: [...(p.repliesList || []), newReply] 
        };
      }
      return p;
    }));
    setReplyContent('');

    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        replies: increment(1),
        repliesList: arrayUnion(newReply)
      });
    } catch { /* offline */ }
  };

  const needsNickname = user && !nickname;

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient">Community Q&amp;A Forum</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ask questions, get help, and discuss IT topics with the community.</p>
      </div>

      <div className="community-layout">

        {/* ── Posts list ── */}
        <div>
          {loadingPosts ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading posts…</p>
          ) : posts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
              <MessageSquare size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to ask a question!</p>
            </div>
          ) : posts.map(post => {
            const postTime = post.createdAt?.toMillis ? post.createdAt.toMillis() : Date.now();
            const isExpired = (Date.now() - postTime) > 24 * 60 * 60 * 1000;
            const isAuthor = user && user.uid === post.authorUid;

            // Hide expired posts for everyone except the author
            if (isExpired && !isAuthor) return null;

            return (
              <div key={post.id} className="glass-panel" style={{ padding: '24px', marginBottom: '16px', borderRadius: '14px', border: '1px solid var(--surface-border)', opacity: isExpired ? 0.7 : 1 }}>
                
                {isExpired && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>⏱️ This post expired after 24 hours and is hidden. Repost it to make it visible!</span>
                    <button onClick={() => handleRepost(post.id)} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', background: '#ef4444', border: 'none' }}>
                      <RefreshCcw size={14} /> Repost Now
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', lineHeight: 1.4 }}>{post.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {post.date || 'Recently'}
                  </span>
                  {user && user.uid === post.authorUid && (
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setOptionsOpenId(optionsOpenId === post.id ? null : post.id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {optionsOpenId === post.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '4px', zIndex: 10, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                          <button onClick={() => handleDelete(post.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#ef4444', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '0.85rem' }} onMouseOver={e=>e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                            <Trash2 size={14} /> Delete Post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                  <button onClick={() => handleLike(post.id)} className="btn btn-outline" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: (user && (post.likedBy || []).includes(user.uid)) ? 'var(--primary)' : 'transparent', color: (user && (post.likedBy || []).includes(user.uid)) ? '#fff' : 'inherit', borderColor: (user && (post.likedBy || []).includes(user.uid)) ? 'var(--primary)' : 'var(--surface-border)' }}>
                    <ThumbsUp size={13} /> {post.likes || 0}
                  </button>
                  <button onClick={() => setOpenRepliesId(openRepliesId === post.id ? null : post.id)} className="btn btn-outline" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', background: openRepliesId === post.id ? 'var(--surface-border)' : 'transparent' }}>
                    <MessageSquare size={13} /> {post.replies || 0} Replies
                  </button>
                </div>
              </div>

              {/* ── Replies Section ── */}
              {openRepliesId === post.id && (
                <div style={{ marginTop: '16px', borderTop: '1px dashed var(--surface-border)', paddingTop: '16px' }}>
                  {(post.repliesList || []).map((reply, i) => (
                    <div key={reply.id || i} style={{ display: 'flex', gap: '12px', marginBottom: '16px', paddingLeft: '8px' }}>
                      <CornerDownRight size={16} color="var(--text-muted)" style={{ marginTop: '4px', flexShrink: 0 }} />
                      <div style={{ flex: 1, background: 'var(--surface)', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{reply.author}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reply.date || ''}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Reply Input */}
                  {user && (post.repliesList || []).some(r => r.authorUid === user.uid) ? (
                    <div style={{ padding: '12px', textAlign: 'center', background: 'var(--card-dark)', borderRadius: '12px', border: '1px dashed var(--surface-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      You have already replied to this post.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingLeft: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                         {user ? (nickname || user.email || '?')[0].toUpperCase() : '?'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          style={{ width: '100%', minHeight: '60px', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--surface-border)'}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button onClick={() => submitReply(post.id)} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }} disabled={!replyContent.trim()}>
                            <Send size={12} /> Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ); })}
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
              <User size={16} color="var(--primary)" />
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
