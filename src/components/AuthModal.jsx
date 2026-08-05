import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, X, LogIn, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthModal = ({ isOpen, onClose, message = 'You need to be logged in to perform this action.' }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 99999,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 20, stiffness: 250, mass: 0.8 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100000,
              width: '90%',
              maxWidth: '420px',
            }}
          >
            <div className="glass-panel" style={{ padding: '32px', borderRadius: '24px', position: 'relative', textAlign: 'center', border: '1px solid var(--surface-border)' }}>
              <button 
                onClick={onClose}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--surface-badge)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>

              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 8px 32px rgba(239,68,68,0.1)' }}>
                <ShieldAlert size={36} color="#ef4444" />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>
                Authentication Required
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '28px' }}>
                {message} Please sign in or create a free account to continue.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', borderRadius: '16px', fontSize: '1rem', fontWeight: 700, display: 'flex', justifyContent: 'center', gap: '8px' }}
                >
                  <LogIn size={20} /> Sign In
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
