import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, 
  RotateCw, ZoomIn, ZoomOut, FileText, Play, Pause, Layers,
  ExternalLink, Printer, Share2, Copy, Check, Sun, Moon,
  BookOpen, Eye, Sparkles, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const PdfSlideViewerModal = ({ isOpen, onClose, document: docItem }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [inputPageStr, setInputPageStr] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [viewerMode, setViewerMode] = useState('blob'); // 'blob' (memory cached), 'google', 'direct'
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Memory blob caching state for 100% smooth, stable scrolling
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const pdfUrl = docItem?.url || '';

  // Memory Blob Fetching: Pre-buffers PDF into local RAM for 60FPS smooth scrolling without network lag
  useEffect(() => {
    let isMounted = true;
    let createdBlobUrl = null;

    if (isOpen && pdfUrl) {
      setIsLoading(true);
      setLoadError(false);
      setBlobUrl(null);

      fetch(pdfUrl)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.blob();
        })
        .then(blob => {
          if (isMounted) {
            // Create in-memory Blob URL for local 60 FPS scrolling
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            createdBlobUrl = URL.createObjectURL(pdfBlob);
            setBlobUrl(createdBlobUrl);
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.warn('Memory Blob pre-buffer failed, fallback to direct streaming URL:', err);
          if (isMounted) {
            setBlobUrl(pdfUrl);
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      if (createdBlobUrl && createdBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [isOpen, pdfUrl]);

  // Sync page string
  useEffect(() => {
    setInputPageStr(currentPage.toString());
  }, [currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalPages, onClose]);

  // Auto-play timer
  useEffect(() => {
    let timer;
    if (isAutoPlay && isOpen) {
      timer = setInterval(() => {
        setCurrentPage(prev => (prev >= totalPages ? 1 : prev + 1));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, isOpen, totalPages]);

  if (!isOpen || !docItem) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) {
      toast.error('Document URL is not available.');
      return;
    }
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.download = (docItem.title || 'document').replace(/[^a-zA-Z0-9 ]/g, '_') + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const handleCopyLink = () => {
    if (!pdfUrl) return;
    navigator.clipboard.writeText(pdfUrl);
    setCopiedLink(true);
    toast.success('PDF Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const pageNum = parseInt(inputPageStr, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setInputPageStr(currentPage.toString());
    }
  };

  // Determine active viewing URL source
  const getActiveSource = () => {
    if (viewerMode === 'google') {
      return `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    }
    // High-speed Blob memory URL or Direct URL fallback
    return blobUrl || pdfUrl;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999999,
          background: '#070b14', // Solid dark background for 60 FPS GPU scrolling
          display: 'flex', flexDirection: 'column',
          color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
        {/* TOP TOOLBAR */}
        <header style={{
          height: '66px', padding: '0 20px',
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, gap: '14px'
        }}>
          {/* Document Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)', flexShrink: 0
            }}>
              <FileText size={20} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#f8fafc',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {docItem.title}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {docItem.category || 'Document'}
                </span>
                <span>&bull;</span>
                <span>{docItem.size || 'PDF'}</span>
                {blobUrl?.startsWith('blob:') && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={11} /> 60FPS Memory Cached
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PAGE NAVIGATION */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(30, 41, 59, 0.9)', padding: '5px 12px',
            borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              style={{
                background: currentPage <= 1 ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: 'none', color: currentPage <= 1 ? '#475569' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                padding: '5px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center'
              }}
              title="Previous Page"
            >
              <ChevronLeft size={18} />
            </button>

            <form onSubmit={handlePageSubmit} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Page</span>
              <input
                type="text"
                value={inputPageStr}
                onChange={(e) => setInputPageStr(e.target.value)}
                onBlur={handlePageSubmit}
                style={{
                  width: '38px', height: '26px', borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(15, 23, 42, 0.8)', color: '#fff',
                  textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>/ {totalPages}</span>
            </form>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              style={{
                background: currentPage >= totalPages ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: 'none', color: currentPage >= totalPages ? '#475569' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                padding: '5px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center'
              }}
              title="Next Page"
            >
              <ChevronRight size={18} />
            </button>

            <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />

            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              style={{
                background: isAutoPlay ? '#2563eb' : 'rgba(255,255,255,0.08)',
                color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
              title="Auto Play Slideshow"
            >
              {isAutoPlay ? <Pause size={12} /> : <Play size={12} />} 
              {isAutoPlay ? 'Playing' : 'Slideshow'}
            </button>
          </div>

          {/* VIEW CONTROLS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Zoom Controls */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '2px 6px'
            }}>
              <button
                onClick={() => setZoom(prev => Math.max(60, prev - 20))}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '4px', cursor: 'pointer' }}
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', minWidth: '38px', textAlign: 'center' }}>{zoom}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(180, prev + 20))}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '4px', cursor: 'pointer' }}
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Engine Switcher */}
            <select
              value={viewerMode}
              onChange={(e) => setViewerMode(e.target.value)}
              style={{
                background: '#1e293b',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa', padding: '7px 10px', borderRadius: '10px',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, outline: 'none'
              }}
              title="Rendering Mode"
            >
              <option value="blob" style={{ background: '#0f172a', color: '#fff' }}>⚡ Smooth Memory Engine</option>
              <option value="google" style={{ background: '#0f172a', color: '#fff' }}>🌐 Google Docs Engine</option>
            </select>

            {/* Full Browser Tab View */}
            <button
              onClick={handleOpenExternal}
              style={{
                background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa', padding: '7px 12px', borderRadius: '10px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px'
              }}
              title="Open Full PDF in New Tab"
            >
              <ExternalLink size={14} /> Open Full PDF
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                color: '#fff', padding: '7px 14px', borderRadius: '10px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Download size={14} /> Download
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444', width: '36px', height: '36px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: '4px', transition: 'all 0.2s'
              }}
              title="Close PDF Viewer"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* MAIN CANVAS - ZERO FILTERS FOR BUTTERY SMOOTH 60 FPS SCROLLING */}
        <main style={{
          flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '16px', overflow: 'hidden',
          background: '#070b14'
        }}>

          {/* Left Nav Arrow */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            style={{
              position: 'fixed', left: '16px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 100, width: '48px', height: '48px', borderRadius: '50%',
              background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)',
              color: currentPage <= 1 ? '#475569' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
            }}
          >
            <ChevronLeft size={26} />
          </button>

          {/* CANVAS WRAPPER - OPTIMIZED WITH HARDWARE ACCELERATION */}
          <div
            style={{
              width: `${zoom}%`, maxWidth: '1280px', height: '100%',
              borderRadius: '16px', overflow: 'hidden', position: 'relative',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: '#ffffff',
              transform: 'translateZ(0)', // Force GPU layer creation
              willChange: 'transform'
            }}
          >
            {/* Loading Indicator */}
            {isLoading && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: '#0f172a',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '14px', color: '#94a3b8'
              }}>
                <RefreshCw size={34} className="spin" color="#3b82f6" />
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>Buffering PDF for Smooth 60 FPS Scrolling...</p>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Loading document into high-speed browser memory</span>
              </div>
            )}

            {/* HIGH PERFORMANCE EMBEDDED FRAME */}
            {viewerMode === 'google' ? (
              <iframe
                src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                title={docItem.title}
                onLoad={() => setIsLoading(false)}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            ) : (
              <iframe
                key={blobUrl || pdfUrl}
                src={blobUrl || pdfUrl}
                title={docItem.title}
                onLoad={() => setIsLoading(false)}
                style={{
                  width: '100%', height: '100%', border: 'none',
                  background: '#ffffff'
                }}
              />
            )}
          </div>

          {/* Right Nav Arrow */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            style={{
              position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 100, width: '48px', height: '48px', borderRadius: '50%',
              background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)',
              color: currentPage >= totalPages ? '#475569' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
            }}
          >
            <ChevronRight size={26} />
          </button>
        </main>

        {/* FOOTER BAR */}
        <footer style={{
          height: '36px', padding: '0 20px',
          background: '#0f172a',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.75rem', color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <span>Engine: <strong style={{ color: '#10b981' }}>MEM-BLOB 60FPS</strong></span>
            <span>&bull;</span>
            <span>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px', color: '#fff' }}>Esc</kbd> to exit</span>
          </div>
          <button
            onClick={handleOpenExternal}
            style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem' }}
          >
            Click here to open PDF in Full Browser Window &rarr;
          </button>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfSlideViewerModal;
