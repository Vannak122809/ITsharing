import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, 
  RotateCw, ZoomIn, ZoomOut, FileText, Play, Pause, Layers,
  ExternalLink, Printer, Share2, Copy, Check, Sun, Moon,
  BookOpen, Eye, Sparkles, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const PdfSlideViewerModal = ({ isOpen, onClose, document: docItem }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(15);
  const [inputPageStr, setInputPageStr] = useState('1');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [viewerMode, setViewerMode] = useState('direct'); // 'direct', 'google', 'mozilla'
  const [readingTheme, setReadingTheme] = useState('dark'); // 'dark', 'light', 'sepia'
  const [copiedLink, setCopiedLink] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const pdfUrl = docItem?.url || '';

  // Sync page input string when currentPage changes
  useEffect(() => {
    setInputPageStr(currentPage.toString());
  }, [currentPage]);

  // Reset state when docItem changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setZoom(100);
      setIsAutoPlay(false);
      setIsIframeLoading(true);
    }
  }, [isOpen, docItem]);

  // Slideshow auto-play effect
  useEffect(() => {
    let timer;
    if (isAutoPlay && isOpen) {
      timer = setInterval(() => {
        setCurrentPage(prev => (prev >= totalPages ? 1 : prev + 1));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, isOpen, totalPages]);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalPages, onClose]);

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
    link.download = (docItem.title || 'document').replace(/[^a-zA-Z0-9 ]/g, '') + '.pdf';
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

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
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

  // Determine actual iframe src based on selected viewer engine
  const getEmbedUrl = () => {
    if (!pdfUrl) return '';
    if (viewerMode === 'google') {
      return `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    }
    if (viewerMode === 'mozilla') {
      return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}#page=${currentPage}`;
    }
    // Direct embed with page parameter
    return `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  };

  // Theme background colors for canvas
  const canvasBgColors = {
    dark: '#090d16',
    light: '#f1f5f9',
    sepia: '#fbf0d9'
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
          background: 'rgba(5, 8, 15, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex', flexDirection: 'column',
          color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif"
        }}
      >
        {/* TOP HEADER TOOLBAR */}
        <header style={{
          height: '72px', padding: '0 24px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, gap: '16px', flexWrap: 'nowrap'
        }}>
          {/* Document Title & Category Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.35)', flexShrink: 0
            }}>
              <FileText size={22} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {docItem.title}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  {docItem.category || 'Document'}
                </span>
                {docItem.subfolder && (
                  <>
                    <span>&bull;</span>
                    <span style={{ color: '#cbd5e1' }}>{docItem.subfolder}</span>
                  </>
                )}
                <span>&bull;</span>
                <span>{docItem.size || 'PDF'}</span>
              </div>
            </div>
          </div>

          {/* PAGE NAVIGATION & SLIDESHOW CONTROL */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(30, 41, 59, 0.75)', padding: '6px 14px',
            borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              style={{
                background: currentPage <= 1 ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: 'none', color: currentPage <= 1 ? '#475569' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                padding: '6px 10px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', transition: 'all 0.2s'
              }}
              title="Previous Page (Left Arrow)"
            >
              <ChevronLeft size={18} />
            </button>

            <form onSubmit={handlePageSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Page</span>
              <input
                type="text"
                value={inputPageStr}
                onChange={(e) => setInputPageStr(e.target.value)}
                onBlur={handlePageSubmit}
                style={{
                  width: '42px', height: '28px', borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(15, 23, 42, 0.8)', color: '#fff',
                  textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', outline: 'none'
                }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>/ {totalPages}</span>
            </form>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              style={{
                background: currentPage >= totalPages ? 'transparent' : 'rgba(255,255,255,0.1)',
                border: 'none', color: currentPage >= totalPages ? '#475569' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                padding: '6px 10px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', transition: 'all 0.2s'
              }}
              title="Next Page (Right Arrow)"
            >
              <ChevronRight size={18} />
            </button>

            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

            {/* Auto Play Presentation Mode */}
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              style={{
                background: isAutoPlay ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(255,255,255,0.08)',
                color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '10px',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}
              title="Auto Play Slideshow Presentation"
            >
              {isAutoPlay ? <Pause size={14} /> : <Play size={14} />} 
              {isAutoPlay ? 'Playing' : 'Slideshow'}
            </button>
          </div>

          {/* VIEW CONTROLS & UTILITIES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Zoom Controls */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '2px 8px'
            }}>
              <button
                onClick={() => setZoom(prev => Math.max(50, prev - 25))}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer' }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', minWidth: '40px', textAlign: 'center' }}>{zoom}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(200, prev + 25))}
                style={{ background: 'transparent', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer' }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Engine Switcher Dropdown */}
            <select
              value={viewerMode}
              onChange={(e) => { setViewerMode(e.target.value); setIsIframeLoading(true); }}
              style={{
                background: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#60a5fa', padding: '8px 12px', borderRadius: '12px',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, outline: 'none'
              }}
              title="Switch Rendering Engine"
            >
              <option value="direct" style={{ background: '#0f172a', color: '#fff' }}>⚡ Direct Engine</option>
              <option value="google" style={{ background: '#0f172a', color: '#fff' }}>🌐 Google Docs Engine</option>
              <option value="mozilla" style={{ background: '#0f172a', color: '#fff' }}>📄 PDF.js Web Engine</option>
            </select>

            {/* Theme Canvas Switcher */}
            <button
              onClick={() => setReadingTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'sepia' : 'dark')}
              style={{
                background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer'
              }}
              title={`Reading Theme: ${readingTheme.toUpperCase()}`}
            >
              {readingTheme === 'dark' ? <Moon size={16} /> : readingTheme === 'light' ? <Sun size={16} /> : <BookOpen size={16} color="#d97706" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Open in New Tab */}
            <button
              onClick={handleOpenExternal}
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
              title="Open PDF in New Browser Tab"
            >
              <ExternalLink size={16} />
            </button>

            {/* Share / Copy Link */}
            <button
              onClick={handleCopyLink}
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
              title="Copy PDF Link"
            >
              {copiedLink ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                color: '#fff', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Download size={16} /> Download
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', width: '38px', height: '38px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: '4px', transition: 'all 0.2s'
              }}
              title="Close Viewer"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* MAIN CANVAS DISPLAY AREA */}
        <main style={{
          flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px', overflow: 'auto',
          background: canvasBgColors[readingTheme], transition: 'background 0.3s'
        }}>

          {/* Left Arrow Navigation Overlay */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            style={{
              position: 'fixed', left: '24px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 100, width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.18)',
              color: currentPage <= 1 ? '#475569' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(12px)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              transition: 'all 0.2s'
            }}
            title="Previous Page"
          >
            <ChevronLeft size={30} />
          </button>

          {/* PDF Viewer Frame Container */}
          <motion.div
            key={docItem.id + '_' + currentPage + '_' + zoom + '_' + viewerMode + '_' + readingTheme}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              width: `${zoom}%`, maxWidth: '1280px', height: '100%',
              borderRadius: '24px', overflow: 'hidden', position: 'relative',
              boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: readingTheme === 'light' ? '#ffffff' : readingTheme === 'sepia' ? '#fffbf2' : '#0f172a'
            }}
          >
            {/* Loading Overlay */}
            {isIframeLoading && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(15, 23, 42, 0.9)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '16px', color: '#94a3b8'
              }}>
                <RefreshCw size={36} className="spin" color="#3b82f6" />
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading PDF Document...</p>
              </div>
            )}

            <iframe
              src={getEmbedUrl()}
              title={docItem.title}
              onLoad={() => setIsIframeLoading(false)}
              style={{
                width: '100%', height: '100%', border: 'none',
                background: 'transparent'
              }}
            />
          </motion.div>

          {/* Right Arrow Navigation Overlay */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            style={{
              position: 'fixed', right: '24px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 100, width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.18)',
              color: currentPage >= totalPages ? '#475569' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(12px)', boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              transition: 'all 0.2s'
            }}
            title="Next Page"
          >
            <ChevronRight size={30} />
          </button>
        </main>

        {/* BOTTOM QUICK FOOTER BAR */}
        <footer style={{
          height: '42px', padding: '0 24px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: '0.78rem', color: '#94a3b8'
        }}>
          <div>
            Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>&rarr;</kbd> or <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>Space</kbd> for next page, <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>Esc</kbd> to close.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Engine: <strong style={{ color: '#60a5fa' }}>{viewerMode.toUpperCase()}</strong></span>
            <span>Theme: <strong style={{ color: '#f59e0b' }}>{readingTheme.toUpperCase()}</strong></span>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfSlideViewerModal;
