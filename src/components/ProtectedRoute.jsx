import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>Loading authentication...</div>
      </div>
    );
  }

  if (!user || user.isAnonymous) {
    // Redirect to login page if user is not authenticated or is an anonymous guest
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
