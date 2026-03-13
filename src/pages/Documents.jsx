import React from 'react';
import { Download, FileText, Share2 } from 'lucide-react';

const Documents = () => {
  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <header style={{ marginBottom: '60px', textAlign: 'center' }}>
        <h1 className="text-gradient">Tech Resource Library</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', marginTop: '16px' }}>
          Downloadable cheat sheets, architectural diagrams, PDF notes, and configuration templates.
        </p>
        <div style={{ marginTop: '32px', maxWidth: '500px', margin: '32px auto 0' }}>
          <input type="text" className="input-field" placeholder="Search for documents (e.g. 'AWS architecture pdf')..." />
        </div>
      </header>

      <div className="card-grid">
        <div className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(69, 243, 255, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <FileText size={32} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>K8s Setup Guide</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>YAML files and cluster setup docs. (420 KB)</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <button className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Share2 size={16} /> Share</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Download size={16} /> Download</button>
          </div>
        </div>

        <div className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(255, 42, 122, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <FileText size={32} color="#ff2a7a" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Design Patterns Java</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gang of four simplified in modern Java. (1.2 MB)</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <button className="btn btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Share2 size={16} /> Share</button>
            <button className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}><Download size={16} /> Download</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents;
