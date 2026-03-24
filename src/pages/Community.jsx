import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, User } from 'lucide-react';

const initialPosts = [
  {
    id: 1,
    title: "How to fix 'VCRUNTIME140.dll missing' error?",
    author: "TechStudent99",
    content: "Whenever I try to open a newly installed Adobe software, I get this error. Any ideas?",
    likes: 12,
    replies: 4,
    date: "2 hours ago"
  },
  {
    id: 2,
    title: "Best laptop for learning React and Node.js?",
    author: "CodeNewbie",
    content: "My budget is around $800. Should I get a used M1 Mac or a new Windows laptop?",
    likes: 8,
    replies: 15,
    date: "5 hours ago"
  }
];

const Community = () => {
  const [posts, setPosts] = useState(initialPosts);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handlePost = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    
    const post = {
      id: Date.now(),
      title: newTitle,
      author: "CurrentUser",
      content: newContent,
      likes: 0,
      replies: 0,
      date: "Just now"
    };
    
    setPosts([post, ...posts]);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="text-gradient">Community Q&A Forum</h1>
        <p style={{ color: 'var(--text-muted)' }}>Ask questions, get help, and discuss IT topics with the community.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
        {/* Posts List */}
        <div>
          {posts.map(post => (
            <div key={post.id} className="glass-panel" style={{ padding: '24px', marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{post.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.date}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.95rem' }}>{post.content}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <User size={16} /> {post.author}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <ThumbsUp size={14} /> {post.likes}
                  </button>
                  <button className="btn btn-outline" style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <MessageSquare size={14} /> {post.replies} Replies
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Post Form */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--primary)' }}>Ask a Question</h3>
          <form onSubmit={handlePost}>
            <input 
              type="text" 
              placeholder="Question Title..." 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)' }}
            />
            <textarea 
              placeholder="Describe your issue or question in detail..." 
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{ width: '100%', padding: '12px', minHeight: '120px', marginBottom: '16px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--card-dark)', color: 'var(--text-main)', resize: 'vertical' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Post Question</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Community;
