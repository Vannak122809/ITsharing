import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../userService';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const SUPER_ADMIN_EMAIL = 'seunvannak33047@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', gap: '20px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary)', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Verifying Credentials...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 1. Check if authenticated
  if (!user || user.isAnonymous) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check Role Permission
  if (requiredRole) {
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
    const hasAdminRole = userProfile?.role === 'admin' || userProfile?.role === 'superadmin';

    // Allow Super Admin everywhere
    if (isSuperAdmin) return children;

    // Reject if role doesn't match
    if (requiredRole === 'admin' && !hasAdminRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
