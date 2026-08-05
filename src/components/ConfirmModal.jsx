import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false,
}) => {
  const isDanger = type === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            onClick={!isLoading ? onClose : undefined}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              zIndex: 99999,
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280, mass: 0.8 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100000,
              width: '90%',
              maxWidth: '440px',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                backdropFilter: 'var(--blur)',
                WebkitBackdropFilter: 'var(--blur)',
                border: '1px solid var(--surface-border)',
                borderRadius: '28px',
                padding: '32px',
                position: 'relative',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(239, 68, 68, 0.15)',
              }}
            >
              {/* Close Button */}
              <button
                disabled={isLoading}
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'var(--surface-badge)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  color: 'var(--text-muted)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <X size={16} />
              </button>

              {/* Icon Badge */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: isDanger
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.15))'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.15))',
                  border: isDanger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  margin: '0 auto 24px auto',
                  boxShadow: isDanger ? '0 0 25px rgba(239, 68, 68, 0.25)' : '0 0 25px rgba(59, 130, 246, 0.25)',
                }}
              >
                {isDanger ? (
                  <Trash2 size={36} color="#ef4444" />
                ) : (
                  <AlertTriangle size={36} color="#3b82f6" />
                )}
              </div>

              {/* Title & Message */}
              <h3
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  marginBottom: '10px',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  marginBottom: '32px',
                }}
              >
                {message}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  disabled={isLoading}
                  onClick={onClose}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    background: 'var(--surface-badge)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-main)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--surface-border)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'var(--surface-badge)')}
                >
                  {cancelText}
                </button>

                <button
                  disabled={isLoading}
                  onClick={onConfirm}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    border: 'none',
                    background: isDanger
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#ffffff',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: isDanger
                      ? '0 8px 20px rgba(239, 68, 68, 0.35)'
                      : '0 8px 20px rgba(59, 130, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="spin" /> Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
