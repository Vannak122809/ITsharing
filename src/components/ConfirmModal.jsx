import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';

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
            animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            onClick={!isLoading ? onClose : undefined}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              zIndex: 99999,
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320, mass: 0.8 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 100000,
              width: '90%',
              maxWidth: '420px',
            }}
          >
            <div
              className="glass-panel"
              style={{
                background: 'var(--surface)',
                backdropFilter: 'var(--blur)',
                WebkitBackdropFilter: 'var(--blur)',
                border: '1px solid var(--surface-border)',
                borderRadius: '24px',
                padding: '32px 28px',
                position: 'relative',
                textAlign: 'center',
                boxShadow: isDanger
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 40px rgba(239, 68, 68, 0.15)'
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 40px rgba(59, 130, 246, 0.15)',
              }}
            >
              {/* Close Button */}
              <button
                disabled={isLoading}
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: 'var(--surface-badge)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  color: 'var(--text-muted)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <X size={15} />
              </button>

              {/* Icon Badge */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: isDanger
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18), rgba(220, 38, 38, 0.08))'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(37, 99, 235, 0.08))',
                  border: isDanger ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  margin: '0 auto 20px auto',
                  boxShadow: isDanger ? '0 10px 30px rgba(239, 68, 68, 0.25)' : '0 10px 30px rgba(59, 130, 246, 0.25)',
                }}
              >
                {isDanger ? (
                  <ShieldAlert size={34} color="#ef4444" />
                ) : (
                  <AlertTriangle size={34} color="#3b82f6" />
                )}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  marginBottom: '12px',
                  color: 'var(--text-main)',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h3>

              {/* Message Body */}
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.92rem',
                  lineHeight: '1.6',
                  marginBottom: '28px',
                  padding: '0 8px',
                }}
              >
                {typeof message === 'string' ? (
                  message.split(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/).map((part, i) =>
                    /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(part) ? (
                      <span
                        key={i}
                        style={{
                          color: '#ef4444',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )
                ) : (
                  message
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  disabled={isLoading}
                  onClick={onClose}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    background: 'var(--surface-badge)',
                    border: '1px solid var(--surface-border)',
                    color: 'var(--text-main)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--surface-border)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--surface-badge)';
                  }}
                >
                  {cancelText}
                </button>

                <button
                  disabled={isLoading}
                  onClick={onConfirm}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    border: 'none',
                    background: isDanger
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#ffffff',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: isDanger
                      ? '0 6px 18px rgba(239, 68, 68, 0.35)'
                      : '0 6px 18px rgba(59, 130, 246, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = isDanger
                      ? '0 8px 22px rgba(239, 68, 68, 0.45)'
                      : '0 8px 22px rgba(59, 130, 246, 0.45)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDanger
                      ? '0 6px 18px rgba(239, 68, 68, 0.35)'
                      : '0 6px 18px rgba(59, 130, 246, 0.35)';
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="spin" /> Processing...
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
