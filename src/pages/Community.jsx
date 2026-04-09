import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Heart, User, Send, Ghost, Trash2, MoreVertical, CornerDownRight, RefreshCcw, Search, Filter, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, deleteDoc,
  orderBy, query, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { getUserNickname } from '../userService';
import { useLanguage } from '../LanguageContext';

const Community = () => {
  const { t } = useLanguage();
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
  const [searchTerm, setSearchTerm]       = useState('');

  // ── Auth listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const nick = await getUserNickname(u.uid);
        setNickname(nick === 'Unknown' ? '' : nick);
      } else {
        setNickname('');
        navigate('/login');
      }
    });
    return () => unsub();
  }, []);

  // ── Load posts from Firestore ──────────────────────────────────────
  useEffect(() => {
    const SAMPLE = [
      { id: '1', title: "How to fix 'VCRUNTIME140.dll missing' error?", author: 'TechStudent99', content: 'Whenever I try to open a newly installed Adobe software, I get this error. Any ideas?', likes: 12, hearts: 5, replies: 4, date: '2 hours ago', authorUid: 'sample1' },
      { id: '2', title: 'Best laptop for learning React and Node.js?', author: 'CodeNewbie', content: 'My budget is around $800. Should I get a used M1 Mac or a new Windows laptop?', likes: 8, hearts: 12, replies: 15, date: '5 hours ago', authorUid: 'sample2' },
    ];

    const load = async () => {
      try {
        const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(loaded.length > 0 ? loaded : SAMPLE);
      } catch {
        setPosts(SAMPLE);
      } finally {
        setLoadingPosts(false);
      }
    };
    load();
  }, []);

  const authorName = () => {
    if (!user) return 'User';
    return nickname || user.email?.split('@')[0] || 'User';
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!user) { alert('Please sign in to post a question.'); return; }
    if (!nickname) {
      alert('Please set a nickname in your Profile first!');
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
      hearts: 0,
      heartedBy: [],
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
      setPosts(prev => [{ id: Date.now().toString(), ...postData, date: 'Just now' }, ...prev]);
      setNewTitle('');
      setNewContent('');
    } finally {
      setPosting(false);
    }
  };

  const handleReaction = async (postId, type) => {
    if (!user) { alert(`Please sign in to ${type}.`); return; }
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    const post = posts[postIndex];
    const field = type === 'like' ? 'likes' : 'hearts';
    const listField = type === 'like' ? 'likedBy' : 'heartedBy';
    const list = post[listField] || [];
    const hasReacted = list.includes(user.uid);
    const newVal = hasReacted ? Math.max(0, (post[field] || 0) - 1) : (post[field] || 0) + 1;
    const newList = hasReacted ? list.filter(id => id !== user.uid) : [...list, user.uid];

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, [field]: newVal, [listField]: newList } : p));
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        [field]: hasReacted ? increment(-1) : increment(1),
        [listField]: hasReacted ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch { }
  };

  const handleRepost = async (postId) => {
    if (!window.confirm("Repost this so it stays visible to the community?")) return;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, createdAt: { toMillis: () => Date.now() }, date: 'Just now' } : p));
    try {
      await updateDoc(doc(db, 'communityPosts', postId), { createdAt: serverTimestamp() });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
    } catch (err) { console.error(err); }
  };

  const submitReply = async (postId) => {
    if (!replyContent.trim()) return;
    if (!user || (!nickname && user.email)) {
      alert("Please set a nickname first.");
      return;
    }
    const post = posts.find(p => p.id === postId);
    if ((post?.repliesList || []).some(r => r.authorUid === user.uid)) {
      alert("You already replied.");
      return;
    }

    const newReply = {
      id: Date.now().toString(),
      author: authorName(),
      authorUid: user.uid,
      content: replyContent.trim(),
      date: 'Just now'
    };
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, replies: (p.replies || 0) + 1, repliesList: [...(p.repliesList || []), newReply] };
      }
      return p;
    }));
    setReplyContent('');
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        replies: increment(1),
        repliesList: arrayUnion(newReply)
      });
    } catch { }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{t('community_forum_title')}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          {t('community_forum_desc')}
        </p>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="glass-panel" style={{ padding: '12px 24px', borderRadius: '20px', marginBottom: '40px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search discussions, topics, or issues..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '14px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', outline: 'none', transition: '0.3s' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '0.9rem' }}>
            <Filter size={16} /> Latest
          </button>
          <button className="btn btn-outline" style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '0.9rem' }}>
            <TrendingUp size={16} /> Trending
          </button>
        </div>
      </div>

      <div className="community-layout">

        {/* ── Posts Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loadingPosts ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spin" style={{ width: '40px', height: '40px', border: '4px solid var(--surface-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }}></div>
              <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Fetching community discussions...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
              <Ghost size={64} color="var(--text-muted)" style={{ margin: '0 auto 20px', opacity: 0.3 }} />
              <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No discussions found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try searching for something else or start a new topic!</p>
            </div>
          ) : filteredPosts.map(post => {
            const postTime = post.createdAt?.toMillis ? post.createdAt.toMillis() : Date.now();
            const isExpired = (Date.now() - postTime) > 24 * 60 * 60 * 1000;
            const isAuthor = user && user.uid === post.authorUid;

            if (isExpired && !isAuthor) return null;

            return (
              <div key={post.id} className="glass-panel lux-post-card" style={{ 
                padding: '32px', 
                borderRadius: '24px', 
                position: 'relative',
                transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: isExpired ? 0.75 : 1,
                borderLeft: isAuthor ? '4px solid var(--primary)' : '1px solid var(--surface-border)'
              }}>
                
                {isExpired && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Post archived after 24 hours.</span>
                    <button onClick={() => handleRepost(post.id)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#ef4444' }}>
                      <RefreshCcw size={14} /> Repost Now
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '15px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 8px 16px rgba(37, 99, 235, 0.2)' }}>
                      {(post.author || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}>{post.author}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.date || 'Recently published'}</span>
                    </div>
                  </div>
                  {isAuthor && (
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setOptionsOpenId(optionsOpenId === post.id ? null : post.id)} className="icon-btn-hover" style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', borderRadius: '10px' }}>
                        <MoreVertical size={20} color="var(--text-muted)" />
                      </button>
                      {optionsOpenId === post.id && (
                        <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '100%', padding: '6px', minWidth: '150px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                          <button onClick={() => handleDelete(post.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, borderRadius: '8px' }}>
                            <Trash2 size={16} /> Delete Discussion
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '16px', lineHeight: 1.4 }}>{post.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '24px' }}>{post.content}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleReaction(post.id, 'like')} 
                    className={`reaction-pill ${ (user && (post.likedBy || []).includes(user.uid)) ? 'active-like' : '' }`}
                  >
                    <ThumbsUp size={16} /> {post.likes || 0}
                  </button>
                  <button 
                    onClick={() => handleReaction(post.id, 'heart')} 
                    className={`reaction-pill ${ (user && (post.heartedBy || []).includes(user.uid)) ? 'active-heart' : '' }`}
                  >
                    <Heart size={16} /> {post.hearts || 0}
                  </button>
                  <button 
                    onClick={() => setOpenRepliesId(openRepliesId === post.id ? null : post.id)} 
                    className="reaction-pill"
                    style={{ background: openRepliesId === post.id ? 'var(--surface-badge)' : '' }}
                  >
                    <MessageSquare size={16} /> {post.replies || 0} Replies
                  </button>
                </div>

                {/* ── Replies ── */}
                {openRepliesId === post.id && (
                  <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {(post.repliesList || []).map((reply) => (
                        <div key={reply.id} style={{ display: 'flex', gap: '16px' }}>
                          <CornerDownRight size={18} style={{ marginTop: '6px', color: 'var(--surface-border)' }} />
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '18px', border: '1px solid var(--surface-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{reply.author}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reply.date}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{reply.content}</p>
                          </div>
                        </div>
                      ))}

                      {/* Reply Form */}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--surface-badge)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <textarea 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Share your thoughts or answer the question..."
                            style={{ width: '100%', padding: '14px 18px', borderRadius: '16px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', fontSize: '0.92rem', outline: 'none', minHeight: '80px', resize: 'none' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button onClick={() => submitReply(post.id)} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '0.85rem' }} disabled={!replyContent.trim()}>
                              Send Reply <Send size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Sidebar Column ── */}
        <div style={{ position: 'sticky', top: '100px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, var(--surface), rgba(99, 102, 241, 0.05))' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
              <Sparkles size={20} color="var(--primary)" /> Start Discussion
            </h3>
            <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                placeholder="Brief title..." 
                value={newTitle} 
                onChange={(e) => setNewTitle(e.target.value)} 
                className="input-field"
                style={{ borderRadius: '14px' }}
              />
              <textarea 
                placeholder="What's on your mind? Describe your issue in detail..." 
                value={newContent} 
                onChange={(e) => setNewContent(e.target.value)} 
                className="input-field"
                style={{ minHeight: '140px', borderRadius: '14px', resize: 'none' }}
              />
              <button className="btn btn-primary" style={{ width: '100%', height: '50px', borderRadius: '14px' }} disabled={posting || !user}>
                {posting ? 'Publishing...' : 'Post to Community'}
              </button>
            </form>
            {!user && (
              <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Please <a href="/login" style={{ fontWeight: 800 }}>Sign In</a> to join the conversation.
              </p>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community Stats</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem' }}>Discussions</span>
                <span style={{ fontWeight: 700 }}>{posts.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem' }}>Questions Solved</span>
                <span style={{ fontWeight: 700 }}>24</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem' }}>Active Members</span>
                <span style={{ fontWeight: 700 }}>142</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        .lux-post-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); border-color: var(--primary); }
        .reaction-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 12px;
          border: 1px solid var(--surface-border);
          background: transparent; color: var(--text-muted);
          font-weight: 700; font-size: 0.85rem;
          cursor: pointer; transition: 0.3s;
        }
        .reaction-pill:hover { background: var(--surface-badge); color: var(--primary); border-color: var(--primary); }
        .active-like { background: rgba(37, 99, 235, 0.1) !important; color: var(--primary) !important; border-color: var(--primary) !important; }
        .active-heart { background: rgba(168, 85, 247, 0.1) !important; color: var(--secondary) !important; border-color: var(--secondary) !important; }
        .icon-btn-hover:hover { background: var(--surface-badge) !important; }
      `}</style>
    </div>
  );
};

export default Community;

