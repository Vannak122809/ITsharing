import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, 
  RotateCw, ZoomIn, ZoomOut, FileText, Play, Pause, Layers
} from 'lucide-react';

const PdfSlideViewerModal = ({ isOpen, onClose, document: docItem }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(15); // Default estimated slide deck length
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [viewerMode, setViewerMode] = useState('embed'); // 'embed' or 'gview'

  const pdfUrl = docItem?.url || '';

  // Auto-play presentation slides effect
  useEffect(() => {
    let timer;
    if (isAutoPlay && isOpen) {
      timer = setInterval(() => {
        setCurrentPage(prev => (prev >= totalPages ? 1 : prev + 1));
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlay, isOpen, totalPages]);

  // Keyboard Navigation (Left / Right Arrow, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentPage(prev => Math.min(totalPages, prev + 1));
      } else if (e.key === 'ArrowLeft') {
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
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = (docItem.title || 'document').replace(/[^a-zA-Z0-9 ]/g, '') + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build embedded PDF slide URL
  const embedUrl = viewerMode === 'gview'
    ? `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`
    : `${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999999,
          background: 'rgba(9, 13, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column',
          color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif'
        }}
      >
        {/* Top Slide Header Bar */}
        <header style={{
          height: '70px', padding: '0 24px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}>
              <FileText size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                {docItem.title}
              </h3>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '8px', marginTop: '2px' }}>
                <span>{docItem.category || 'Document'}</span>
                <span>&bull;</span>
                <span>{docItem.size || 'PDF Document'}</span>
              </div>
            </div>
          </div>

          {/* Slide Navigation Controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(30, 41, 59, 0.7)', padding: '6px 16px',
            borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              style={{
                background: 'transparent', border: 'none', color: currentPage <= 1 ? '#475569' : '#fff',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', padding: '6px', borderRadius: '8px',
                display: 'flex', alignItems: 'center'
              }}
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft size={20} />
            </button>

            <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: '90px', textAlign: 'center' }}>
              Slide {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              style={{
                background: 'transparent', border: 'none', color: currentPage >= totalPages ? '#475569' : '#fff',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', padding: '6px', borderRadius: '8px',
                display: 'flex', alignItems: 'center'
              }}
              title="Next Slide (Right Arrow)"
            >
              <ChevronRight size={20} />
            </button>

            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

            {/* Auto Play Slide Presentation */}
            <button
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              style={{
                background: isAutoPlay ? '#3b82f6' : 'transparent',
                color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
              title="Auto Play Slideshow"
            >
              {isAutoPlay ? <Pause size={14} /> : <Play size={14} />} {isAutoPlay ? 'Playing' : 'Slideshow'}
            </button>
          </div>

          {/* Action Utilities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setZoom(prev => Math.max(50, prev - 25))}
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(200, prev + 25))}
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>

            <button
              onClick={() => setViewerMode(prev => prev === 'embed' ? 'gview' : 'embed')}
              style={{
                background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px'
              }}
              title="Toggle Viewer Engine"
            >
              <Layers size={15} /> {viewerMode === 'embed' ? 'Direct Engine' : 'Google Engine'}
            </button>

            <button
              onClick={toggleFullscreen}
              style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
              title="Full Screen Slide Presentation"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', border: 'none',
                color: '#fff', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Download size={16} /> Download
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444', width: '38px', height: '38px', borderRadius: '50%',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: '8px', transition: 'all 0.2s'
              }}
              title="Close Presentation"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Main Slide Canvas Display Area */}
        <main style={{
          flex: 1, position: 'relative', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '20px', overflow: 'hidden'
        }}>
          {/* Side Slide Nav Overlay - Left */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            style={{
              position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 100, width: '54px', height: '54px', borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)',
              color: currentPage <= 1 ? '#475569' : '#fff', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronLeft size={28} />
          </button>

          {/* PDF Slide Container */}
          <motion.div
            key={currentPage + '_' + zoom + '_' + viewerMode}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              width: `${zoom}%`, maxWidth: '1200px', height: '100%',
              borderRadius: '24px', overflow: 'hidden',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: '#0f172a'
            }}
          >
            <iframe
              src={embedUrl}
              title={docItem.title}
              style={{
                width: '100%', height: '100%', border: 'none',
                background: '#ffffff'
              }}
            />
          </motion.div>

          {/* Side Slide Nav Overlay - Right */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            style={{
              position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)',
              zIndex: 100, width: '54px', height: '54px', borderRadius: '50%',
              background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.15)',
              color: currentPage >= totalPages ? '#475569' : '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <ChevronRight size={28} />
          </button>
        </main>
      </div>
    </AnimatePresence>
  );
};

export default PdfSlideViewerModal;
