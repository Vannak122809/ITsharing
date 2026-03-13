import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Monitor, Apple, CheckCircle, ShieldAlert, Zap, Box } from 'lucide-react';

const mockSoftwareDB = {
  'postman': {
    title: 'Postman IDE',
    os: 'windows',
    version: 'v10.15',
    size: '150 MB',
    developer: 'Postman, Inc.',
    description: 'An API platform for building and using APIs completely for free. It simplifies each step of the API lifecycle and streamlines collaboration so you can create better APIs.',
    requirements: ['Windows 10/11 64-bit', '4GB RAM Minimum', 'Dual Core CPU'],
    features: ['API Mocking', 'Automated Testing', 'Workspace Collaboration']
  },
  'iterm2': {
    title: 'iTerm2',
    os: 'mac',
    version: 'v3.4.19',
    size: '22 MB',
    developer: 'George Nachman',
    description: 'A terminal emulator for macOS that brings the terminal into the modern age with features you never knew you always wanted, such as split panes, hotkey windows, and powerful search.',
    requirements: ['macOS 10.14+', 'Intel or Apple Silicon'],
    features: ['Split Panes', 'Hotkey Window', 'Autocomplete Feature']
  },
  'vscode-win': {
    title: 'Visual Studio Code',
    os: 'windows',
    version: 'v1.82',
    size: '88 MB',
    developer: 'Microsoft Corporation',
    description: 'A lightweight but powerful source code editor which runs on your desktop. It comes with built-in support for JavaScript, TypeScript, and Node.js.',
    requirements: ['Windows 10/11 64-bit', '1.6 GHz Processor', '1 GB RAM'],
    features: ['IntelliSense', 'Built-in Git', 'Vast Extension Ecosystem']
  },
  'vscode-mac': {
    title: 'Visual Studio Code',
    os: 'mac',
    version: 'v1.82',
    size: '115 MB',
    developer: 'Microsoft Corporation',
    description: 'A lightweight but powerful source code editor which runs on your desktop. This is the Universal binary for both Apple Silicon and Intel Macs.',
    requirements: ['macOS 10.11+', '1.6 GHz Processor', '1 GB RAM'],
    features: ['IntelliSense', 'Built-in Git', 'Vast Extension Ecosystem']
  },
  'docker-desktop-win': {
    title: 'Docker Desktop',
    os: 'windows',
    version: 'v4.22',
    size: '620 MB',
    developer: 'Docker Inc.',
    description: 'The fastest way to containerize applications on your machine. Includes Docker Engine, CLI, Docker Compose, and Kubernetes integration.',
    requirements: ['Windows 10 Pro/Ent or WSL2', '4GB RAM', 'Hardware Virtualization enabled'],
    features: ['WSL2 Backend', 'Built-in Kubernetes', 'Extensions Support']
  },
  'docker-desktop-mac': {
    title: 'Docker Desktop (Apple Silicon)',
    os: 'mac',
    version: 'v4.22',
    size: '590 MB',
    developer: 'Docker Inc.',
    description: 'The fastest way to containerize applications on your machine, optimized specifically for M-series (Apple Silicon) chips.',
    requirements: ['macOS Big Sur 11+', 'Apple Silicon (M1/M2/M3)'],
    features: ['Rosetta 2 Emulation', 'Built-in Kubernetes', 'Extensions Support']
  }
};

const SoftwareViewer = () => {
  const { id } = useParams();
  const [software, setSoftware] = useState(null);

  useEffect(() => {
    // In reality, this would fetch from Firebase or R2 mapping
    if (mockSoftwareDB[id]) {
      setSoftware(mockSoftwareDB[id]);
    }
  }, [id]);

  if (!software) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center', minHeight: '80vh' }}>
        <h2 className="text-gradient">Software Not Found</h2>
        <Link to="/software" className="btn btn-outline" style={{ marginTop: '24px' }}><ArrowLeft size={16} /> Back to Software Base</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh' }}>
      <Link to="/software" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '32px' }}>
        <ArrowLeft size={16} /> Back to Software
      </Link>

      <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', marginBottom: '16px', color: 'var(--text-muted)' }}>
              {software.os === 'windows' ? <Monitor size={14} color="#00fa9a" /> : <Apple size={14} color="#ff2a7a" />}
              {software.os === 'windows' ? 'Windows OS' : 'macOS Application'} • {software.version}
            </div>
            
            <h1 style={{ fontSize: '3rem', marginBottom: '8px' }} className="text-gradient">{software.title}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>By: {software.developer}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '200px' }}>
            <button className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', boxShadow: '0 8px 30px rgba(69, 243, 255, 0.4)' }}>
              <Download size={20} /> Download Now
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              File Size: <strong>{software.size}</strong>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '16px' }}>
          
          {/* Overview */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary)' }}>
              <Box size={24} /> Overview
            </h3>
            <p style={{ lineHeight: '1.8', color: '#e0e0e0', fontSize: '1.05rem' }}>
              {software.description}
            </p>
          </div>

          {/* Key Features */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '16px', color: '#00fa9a' }}>
              <Zap size={24} /> Key Features
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {software.features.map((feature, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e0e0e0', fontSize: '1.05rem' }}>
                  <CheckCircle size={18} color="#00fa9a" /> {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* System Requirements */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '32px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '16px', color: '#ff2a7a' }}>
              <ShieldAlert size={24} /> Requirements
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {software.requirements.map((req, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e0e0e0', fontSize: '1.05rem' }}>
                  <div style={{ width: '6px', height: '6px', background: '#ff2a7a', borderRadius: '50%' }} />
                  {req}
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SoftwareViewer;
