import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { toggleBookmark, checkIsBookmarked } from '../userService';
import { useNavigate } from 'react-router-dom';

const BookmarkButton = ({ user, resourceId, resourceData, style = {} }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.uid && resourceId) {
      checkIsBookmarked(user.uid, resourceId).then((res) => {
        setIsBookmarked(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user, resourceId]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Optimistic UI update
    const previousState = isBookmarked;
    setIsBookmarked(!previousState);
    
    try {
      await toggleBookmark(user.uid, resourceId, resourceData);
    } catch (err) {
      // Revert on failure
      setIsBookmarked(previousState);
    }
  };

  if (loading) return null;

  return (
    <button 
      onClick={handleToggle}
      className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
      style={{
        background: isBookmarked ? 'var(--surface-badge)' : 'transparent',
        border: '1px solid var(--surface-border)',
        borderRadius: '8px',
        padding: '8px',
        color: isBookmarked ? 'var(--primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: '0.2s',
        ...style
      }}
      title={isBookmarked ? "Remove Bookmark" : "Save Bookmark"}
    >
      <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
    </button>
  );
};

export default BookmarkButton;
