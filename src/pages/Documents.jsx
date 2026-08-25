import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, FileText, Share2, Globe, Filter, Eye, Folder, 
  ChevronRight, ChevronDown, ArrowLeft, Cloud, Network, 
  Terminal, Database, ShieldCheck, ArrowUpDown, LayoutGrid, 
  List, Search, File, Loader2, Star, Sparkles, X, Check,
  BookOpen, Layers, HardDrive, Award
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import PdfSlideViewerModal from '../components/PdfSlideViewerModal';
import { checkDownloadLimit, formatRetryTime } from '../utils/rateLimiter';
import { logRateLimit } from '../utils/securityLogger';
import toast from 'react-hot-toast';

// Custom Animated Folder Icon
const ModernFolderIcon = ({ size = 64, color = "#3b82f6" }) => (
  <motion.div 
    whileHover={{ scale: 1.06, rotate: 1 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
  >
    <div style={{ 
      width: size * 0.82, height: size * 0.62, 
      background: `linear-gradient(135deg, ${color}, ${color}dd)`, 
      borderRadius: '14px', position: 'relative', boxShadow: `0 12px 28px ${color}45`,
      border: `1px solid ${color}aa`
    }}>
      <div style={{ 
        position: 'absolute', top: '-10px', left: '0', width: '46%', height: '14px', 
        background: `linear-gradient(135deg, ${color}, ${color}cc)`, 
        borderTopLeftRadius: '10px', borderTopRightRadius: '14px',
        boxShadow: `inset 0 2px 5px rgba(255,255,255,0.25)`
      }} />
      <div style={{ 
        position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', 
        background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)', 
        borderRadius: '14px', backdropFilter: 'blur(4px)' 
      }} />
    </div>
  </motion.div>
);

const documentStructure = {
  Network: {
    icon: <Network size={20} />,
    color: "#3b82f6",
    subfolders: ['Cisco', 'Mikrotik', 'Fortinet', 'Ubiquiti', 'TP-Link', 'D-Link', 'Netgear', 'Zyxel', 'Huawei']
  },
  Programming: {
    icon: <Terminal size={20} />,
    color: "#10b981",
    subfolders: ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Bash', 'PowerShell']
  },
  Database: {
    icon: <Database size={20} />,
    color: "#f59e0b",
    subfolders: ['Mysql', 'Postgresql', 'Mongodb', 'Sqlserver', 'Oracle']
  },
  Security: {
    icon: <ShieldCheck size={20} />,
    color: "#ef4444",
    subfolders: ['Firewall', 'Antivirus', 'IDS', 'IPS', 'VPN']
  },
  Cloud: {
    icon: <Cloud size={20} />,
    color: "#8b5cf6",
    subfolders: ['AWS', 'Azure', 'GCP']
  }
};

// Comprehensive Library of IT Documents
const docData = [
  { 
    id: 1, title: 'CCNA1: Explorer Network & NOS Configuration', category: 'Network', subfolder: 'Cisco', 
    lang: 'English', size: '2.75 MB', date: '2026-01-15', type: 'PDF', rating: 4.9, downloads: 342,
    desc: 'Comprehensive CCNA Chapter 1 & 2 guide covering networking basics, IOS command line, and switch setup.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter1%2C2%20-%20Explorer%20Network%20%26%20Configure%20NOS.pdf' 
  },
  { 
    id: 2, title: 'CCNA1: Network Protocols, Data Link & Ethernet', category: 'Network', subfolder: 'Cisco', 
    lang: 'English', size: '3.10 MB', date: '2026-01-16', type: 'PDF', rating: 4.8, downloads: 289,
    desc: 'CCNA Chapter 3, 4 & 5 covering OSI layers, Ethernet frames, MAC address tables, and switching mechanisms.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter3%2C4%2C5%20-%20Network%20Protocols%2C%20Data%20Link%2C%20Ethernet.pdf' 
  },
  { 
    id: 3, title: 'CCNA1: Network Layer, IPv4 & IPv6 Addressing', category: 'Network', subfolder: 'Cisco', 
    lang: 'English', size: '2.95 MB', date: '2026-01-17', type: 'PDF', rating: 4.9, downloads: 410,
    desc: 'CCNA Chapter 6, 7 & 8 explaining IP packet structures, subnetting, VLSM, IPv4 addressing, and IPv6 stateless auto-config.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter6%2C7%2C8%20-%20Network%20Layer%2C%20IPv4%20IPv6.pdf' 
  },
  { 
    id: 4, title: 'CCNA1: Transport, Application & Network Build', category: 'Network', subfolder: 'Cisco', 
    lang: 'English', size: '2.72 MB', date: '2026-01-18', type: 'PDF', rating: 5.0, downloads: 520,
    desc: 'CCNA Chapter 9, 10 & 11 covering TCP/UDP ports, DNS, HTTP, DHCP, and enterprise network design principles.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' 
  },
  { 
    id: 5, title: 'Mikrotik RouterOS Complete Manual (Khmer)', category: 'Network', subfolder: 'Mikrotik', 
    lang: 'Khmer', size: '4.85 MB', date: '2026-03-25', type: 'PDF', rating: 4.95, downloads: 680,
    desc: 'Step-by-step RouterOS setup guide in Khmer language: WinBox setup, NAT, Queue Tree, Hotspot, and VLAN configuration.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  },
  { 
    id: 6, title: 'K8s Cluster Setup Guide on AWS Cloud', category: 'Cloud', subfolder: 'AWS', 
    lang: 'English', size: '1.80 MB', date: '2025-10-14', type: 'PDF', rating: 4.7, downloads: 215,
    desc: 'Production Kubernetes deployment guide on AWS EKS with kubectl, ingress controllers, and auto-scaling.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' 
  },
  { 
    id: 7, title: 'Basic Cybersecurity & Firewall Principles (Khmer)', category: 'Security', subfolder: 'Firewall', 
    lang: 'Khmer', size: '2.10 MB', date: '2025-12-05', type: 'PDF', rating: 4.85, downloads: 390,
    desc: 'Essential cybersecurity concepts for beginners written in Khmer: firewall rules, password security, and threat prevention.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  },
  { 
    id: 8, title: 'Python Automation & Network Scripting Guide', category: 'Programming', subfolder: 'Python', 
    lang: 'English', size: '3.40 MB', date: '2026-02-10', type: 'PDF', rating: 4.9, downloads: 440,
    desc: 'Automating Netmiko, Paramiko, Scapy, and REST APIs with Python for network administration.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter1%2C2%20-%20Explorer%20Network%20%26%20Configure%20NOS.pdf' 
  },
  { 
    id: 9, title: 'Modern JavaScript ES6+ & TypeScript Cheat Sheet', category: 'Programming', subfolder: 'TypeScript', 
    lang: 'English', size: '1.25 MB', date: '2026-02-14', type: 'PDF', rating: 4.95, downloads: 580,
    desc: 'Quick reference guide for Async/Await, Promises, Generics, Interfaces, and ESNext features.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter3%2C4%2C5%20-%20Network%20Protocols%2C%20Data%20Link%2C%20Ethernet.pdf' 
  },
  { 
    id: 10, title: 'FortiGate Firewall CLI & Web UI Setup (Khmer)', category: 'Security', subfolder: 'Firewall', 
    lang: 'Khmer', size: '3.60 MB', date: '2026-02-20', type: 'PDF', rating: 4.88, downloads: 310,
    desc: 'Fortinet FortiGate deployment handbook in Khmer: IPsec VPN, SD-WAN, and Security Policies.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  },
  { 
    id: 11, title: 'MySQL Administration & Query Tuning Handbook', category: 'Database', subfolder: 'Mysql', 
    lang: 'English', size: '2.40 MB', date: '2026-02-22', type: 'PDF', rating: 4.75, downloads: 275,
    desc: 'Optimizing InnoDB engine, indexing strategies, backup/restore using mysqldump, and master-slave replication.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter6%2C7%2C8%20-%20Network%20Layer%2C%20IPv4%20IPv6.pdf' 
  },
  { 
    id: 12, title: 'PostgreSQL Security & Backup Reference (Khmer)', category: 'Database', subfolder: 'Postgresql', 
    lang: 'Khmer', size: '2.15 MB', date: '2026-02-25', type: 'PDF', rating: 4.8, downloads: 220,
    desc: 'PostgreSQL configuration, pg_dump, roles, row-level security policies, and performance tuning in Khmer.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  },
  { 
    id: 13, title: 'Ubiquiti UniFi Controller & AP Deployment Guide', category: 'Network', subfolder: 'Ubiquiti', 
    lang: 'English', size: '1.95 MB', date: '2026-03-01', type: 'PDF', rating: 4.7, downloads: 195,
    desc: 'Configuring UniFi Dream Machine, Access Points, VLAN tagging, and Guest Hotspot portal.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' 
  },
  { 
    id: 14, title: 'OpenVPN & WireGuard Server Installation (Khmer)', category: 'Security', subfolder: 'VPN', 
    lang: 'Khmer', size: '1.65 MB', date: '2026-03-05', type: 'PDF', rating: 4.92, downloads: 410,
    desc: 'Setting up secure encrypted site-to-site and client VPN tunnels using WireGuard and OpenVPN on Ubuntu.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  },
  { 
    id: 15, title: 'AWS Solutions Architect Associate Exam Notes', category: 'Cloud', subfolder: 'AWS', 
    lang: 'English', size: '4.20 MB', date: '2026-03-10', type: 'PDF', rating: 4.98, downloads: 720,
    desc: 'Comprehensive summary for SAA-C03 certification: VPC, EC2, S3, RDS, DynamoDB, Lambda, and IAM.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter1%2C2%20-%20Explorer%20Network%20%26%20Configure%20NOS.pdf' 
  },
  { 
    id: 16, title: 'Go Language Concurrency & Microservices Guide', category: 'Programming', subfolder: 'Go', 
    lang: 'English', size: '2.80 MB', date: '2026-03-12', type: 'PDF', rating: 4.85, downloads: 305,
    desc: 'Mastering Goroutines, Channels, Mutex, gRPC, and building high-throughput web APIs in Go.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter3%2C4%2C5%20-%20Network%20Protocols%2C%20Data%20Link%2C%20Ethernet.pdf' 
  },
  { 
    id: 17, title: 'Linux Bash Shell Scripting Masterclass (Khmer)', category: 'Programming', subfolder: 'Bash', 
    lang: 'Khmer', size: '2.30 MB', date: '2026-03-15', type: 'PDF', rating: 4.9, downloads: 510,
    desc: 'Automating system maintenance, cron jobs, log analysis, and system administration with Bash in Khmer.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  },
  { 
    id: 18, title: 'Azure Cloud Fundamentals & CLI Command Guide', category: 'Cloud', subfolder: 'Azure', 
    lang: 'English', size: '2.10 MB', date: '2026-03-18', type: 'PDF', rating: 4.65, downloads: 180,
    desc: 'AZ-900 certification notes: Azure Resource Manager, Virtual Machines, VNet, Blob Storage, and Entra ID.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter6%2C7%2C8%20-%20Network%20Layer%2C%20IPv4%20IPv6.pdf' 
  },
  { 
    id: 19, title: 'MongoDB NoSQL Aggregation & Indexing Guide', category: 'Database', subfolder: 'Mongodb', 
    lang: 'English', size: '1.75 MB', date: '2026-03-20', type: 'PDF', rating: 4.8, downloads: 230,
    desc: 'Mastering MongoDB pipeline aggregation stages, compound indexes, replica sets, and sharding.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/documents/CCNA1-Chapter9%2C10%2C11%20-%20Transport%2C%20Application%2C%20Build%20Network.pdf' 
  },
  { 
    id: 20, title: 'Huawei HCIA Network Routing & Switching (Khmer)', category: 'Network', subfolder: 'Huawei', 
    lang: 'Khmer', size: '3.90 MB', date: '2026-03-22', type: 'PDF', rating: 4.88, downloads: 360,
    desc: 'Huawei VRP CLI command reference, OSPF configuration, and VAP wireless setup in Khmer.', 
    url: 'https://pub-564a73e336f14a32b457c2d7fa1b0446.r2.dev/Mikrotik%20and%20Unify/mikrotik-khmer_compress.pdf' 
  }
];

const Documents = () => {
  const { t } = useLanguage();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({ Network: true, Programming: true });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLang, setActiveLang] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); 
  const [downloadingId, setDownloadingId] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedPdfDoc, setSelectedPdfDoc] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isGuest = !authLoading && (!user || user.isAnonymous);

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0;
    const value = parseFloat(sizeStr.split(' ')[0]) || 0;
    if (sizeStr.includes('MB')) return value * 1024;
    if (sizeStr.includes('GB')) return value * 1024 * 1024;
    return value;
  };

  const handleDownloadFile = async (e, url, title, type, docId) => {
    e.preventDefault();
    e.stopPropagation();
    if (authLoading) return;
    if (isGuest) { setAuthModalOpen(true); return; }
    if (!url) {
      toast.error('File URL unavailable');
      return;
    }

    // Rate limiting check — 20 downloads per 60s
    const uid = user?.uid || 'anon';
    const { allowed, retryAfterMs } = checkDownloadLimit(uid);
    if (!allowed) {
      toast.error(`Slow down! Try again in ${formatRetryTime(retryAfterMs)}`);
      logRateLimit('/documents');
      return;
    }

    setDownloadingId(docId);
    try {
      const response = await fetch(url + '?t=' + Date.now());
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      let ext = '.pdf';
      if (type && type.toLowerCase() === 'docx') ext = '.docx';
      else if (type && type.toLowerCase() === 'pptx') ext = '.pptx';
      link.download = `${title.replace(/[^a-zA-Z0-9 ]/g, '_')}${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Download started successfully!');
    } catch (error) {
      console.error('Download failed, opening directly:', error);
      window.open(url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewFile = (docItem) => {
    if (authLoading) return;
    if (isGuest) { setAuthModalOpen(true); return; }

    const uid = user?.uid || 'anon';
    const { allowed, retryAfterMs } = checkDownloadLimit(uid);
    if (!allowed) {
      toast.error(`Slow down! Try again in ${formatRetryTime(retryAfterMs)}`);
      return;
    }

    if (docItem) {
      setSelectedPdfDoc(docItem);
      setPdfViewerOpen(true);
    }
  };

  const processedData = useMemo(() => {
    let result = docData;
    if (!searchQuery) {
      if (currentFolder) result = result.filter(doc => doc.category === currentFolder);
      if (currentSubfolder) result = result.filter(doc => doc.subfolder === currentSubfolder);
    } else {
      const query = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.title.toLowerCase().includes(query) || doc.desc.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) || (doc.subfolder && doc.subfolder.toLowerCase().includes(query))
      );
    }
    if (activeLang !== 'All') result = result.filter(doc => doc.lang === activeLang);
    
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'size') return parseSize(b.size) - parseSize(a.size);
      if (sortBy === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
      return 0;
    });
    return result;
  }, [currentFolder, currentSubfolder, searchQuery, activeLang, sortBy]);

  // Statistics summaries
  const totalKhmerDocs = useMemo(() => docData.filter(d => d.lang === 'Khmer').length, []);
  const totalEnglishDocs = useMemo(() => docData.filter(d => d.lang === 'English').length, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 26 } }
  };

  return (
    <div style={{ 
      minHeight: '100vh', paddingTop: '95px', paddingBottom: '60px'
    }}>
      <style>{`
        .glass-panel-new {
          background: var(--surface);
          backdrop-filter: var(--blur);
          -webkit-backdrop-filter: var(--blur);
          border: 1px solid var(--surface-border);
          box-shadow: var(--shadow-glass);
        }
        .file-card {
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .file-card::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: inherit;
          padding: 1.5px;
          background: linear-gradient(135deg, var(--surface-border), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .file-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
          background: var(--surface-badge);
        }
        .file-card:hover::before {
          background: linear-gradient(135deg, var(--primary, #3b82f6), rgba(139, 92, 246, 0.4));
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.25);
        }
        .search-input:focus {
          border-color: var(--primary, #3b82f6) !important;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25) !important;
        }
        .sidebar-item {
          transition: all 0.2s ease;
        }
        .sidebar-item:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateX(4px);
        }
        .sidebar-item.active {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), transparent);
          border-left: 3px solid var(--primary, #3b82f6);
        }
        .view-btn {
          transition: all 0.2s ease;
        }
        .view-btn:hover:not(.active) {
          background: rgba(255,255,255,0.08) !important;
        }
        .btn-glow {
          position: relative;
        }
        .btn-glow::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: 0 0 20px var(--primary, #3b82f6);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .btn-glow:hover::after {
          opacity: 0.5;
        }
        .subfolder-item {
          transition: all 0.2s ease;
        }
        .subfolder-item:hover {
          color: #fff !important;
          background: rgba(255,255,255,0.08);
        }
        .pulse-view-btn {
          position: relative;
        }
        .pulse-view-btn::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          z-index: -1;
          opacity: 0.7;
          filter: blur(8px);
          transition: opacity 0.3s;
        }
        .pulse-view-btn:hover::before {
          opacity: 1;
          filter: blur(12px);
        }
        .documents-page-container {
          display: grid;
          grid-template-columns: 290px 1fr;
          gap: 32px;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 24px;
          width: 100%;
          box-sizing: border-box;
        }
        .documents-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: calc(100vh - 120px);
          position: sticky;
          top: 100px;
        }
        .documents-header-bar {
          padding: 20px 32px;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .documents-search-box {
          position: relative;
          width: 290px;
        }
        @media (max-width: 992px) {
          .documents-page-container {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 0 16px;
          }
          .documents-sidebar-col {
            height: auto !important;
            position: static !important;
            width: 100% !important;
          }
          .documents-header-bar {
            padding: 16px 18px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .documents-search-box {
            width: 100% !important;
          }
        }
      `}</style>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} message="You need to be logged in to view or download documents." />
      <PdfSlideViewerModal isOpen={pdfViewerOpen} onClose={() => setPdfViewerOpen(false)} document={selectedPdfDoc} />
      
      <div className="container documents-page-container">
        
        {/* ENHANCED SIDEBAR EXPLORER */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="documents-sidebar-col"
        >
          <div className="glass-panel-new custom-scrollbar" style={{ padding: '24px', borderRadius: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '10px', borderRadius: '14px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)' }}>
                <Folder size={20} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {t('documents_explorer') || 'DOCUMENT EXPLORER'}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{docData.length} Total Tech Guides</span>
              </div>
            </div>

            <button 
              onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setSearchQuery(''); }}
              className="btn-glow"
              style={{
                width: '100%', padding: '14px 18px', borderRadius: '16px', border: 'none',
                background: (!currentFolder && !searchQuery) ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--surface-badge)',
                color: (!currentFolder && !searchQuery) ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.3s',
                fontWeight: 700, marginBottom: '24px', boxShadow: (!currentFolder && !searchQuery) ? '0 10px 24px rgba(59, 130, 246, 0.25)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutGrid size={18} /> {t('all_documents') || 'All Documents'}
              </div>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem' }}>{docData.length}</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(documentStructure).map(([folderName, folderData]) => {
                const isExpanded = expandedFolders[folderName];
                const isActive = currentFolder === folderName;
                const folderCount = docData.filter(d => d.category === folderName).length;
                
                return (
                  <div key={folderName}>
                    <div 
                      className={`sidebar-item ${isActive && !currentSubfolder ? 'active' : ''}`}
                      onClick={() => { toggleFolder(folderName); setCurrentFolder(folderName); setCurrentSubfolder(null); }}
                      style={{
                        padding: '12px 14px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        color: isActive ? '#fff' : 'var(--text-main)', fontWeight: isActive ? 700 : 500
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronRight size={16} color={isExpanded ? '#fff' : '#64748b'} />
                        </motion.div>
                        <span style={{ color: folderData.color, display: 'flex', alignItems: 'center', filter: isActive ? `drop-shadow(0 0 8px ${folderData.color}90)` : 'none' }}>
                          {folderData.icon}
                        </span>
                        <span style={{ fontSize: '0.92rem' }}>{folderName}</span>
                      </div>
                      <span style={{ 
                        fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 700,
                        background: isActive ? `${folderData.color}30` : 'rgba(255,255,255,0.06)',
                        color: isActive ? folderData.color : 'var(--text-muted)'
                      }}>
                        {folderCount}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: 'hidden', marginLeft: '32px', borderLeft: '1px solid var(--surface-border)', paddingLeft: '8px', marginTop: '4px' }}
                        >
                          {folderData.subfolders.map(sub => {
                            const subCount = docData.filter(d => d.category === folderName && d.subfolder === sub).length;
                            return (
                              <div
                                key={sub}
                                className="subfolder-item"
                                onClick={(e) => { e.stopPropagation(); setCurrentFolder(folderName); setCurrentSubfolder(sub); }}
                                style={{
                                  padding: '8px 12px', cursor: 'pointer', borderRadius: '10px', fontSize: '0.84rem',
                                  color: currentSubfolder === sub ? '#fff' : 'var(--text-muted)',
                                  fontWeight: currentSubfolder === sub ? 700 : 500,
                                  background: currentSubfolder === sub ? 'var(--surface-badge)' : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  margin: '2px 0'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: currentSubfolder === sub ? folderData.color : 'rgba(255,255,255,0.2)' }} />
                                  {sub}
                                </div>
                                {subCount > 0 && (
                                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{subCount}</span>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.aside>

        {/* ENHANCED MAIN CONTENT AREA */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* HERO STATS & SUMMARY BAR */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-panel-new"
            style={{ 
              padding: '24px 32px', borderRadius: '28px', 
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(139, 92, 246, 0.08))',
              border: '1px solid var(--surface-border)',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '16px', color: '#3b82f6' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{docData.length}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Total PDF Documents</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '16px', color: '#10b981' }}>
                <Globe size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{totalKhmerDocs} / {totalEnglishDocs}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Khmer / English Guides</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '12px', borderRadius: '16px', color: '#f59e0b' }}>
                <Layers size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>5 Main</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Categories Covered</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '12px', borderRadius: '16px', color: '#a855f7' }}>
                <Award size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>100% Free</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Instant PDF Viewer</p>
              </div>
            </div>
          </motion.div>

          {/* SEARCH & CONTROLS HEADER BAR */}
          {/* HEADER TOOLBAR */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="glass-panel-new documents-header-bar" 
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
              {currentFolder ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{ background: `${documentStructure[currentFolder]?.color}20`, padding: '12px', borderRadius: '16px', color: documentStructure[currentFolder]?.color, flexShrink: 0 }}>
                    {documentStructure[currentFolder]?.icon}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentFolder}</h1>
                    {currentSubfolder && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <ChevronRight size={14} /> {currentSubfolder}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: '16px', color: '#3b82f6', flexShrink: 0 }}>
                    <LayoutGrid size={24} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Document Library</h1>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Explore & View Technical PDF Guides</p>
                  </div>
                </div>
              )}
            </div>

            {/* SEARCH BOX & VIEW TOGGLE */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '420px', justifyContent: 'flex-end' }}>
              <div className="documents-search-box" style={{ flexGrow: 1, minWidth: '180px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="search-input"
                  type="text" 
                  placeholder={t('search_files') || 'Search document title or topic...'} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 14px 12px 46px', borderRadius: '16px', 
                    border: '1px solid var(--surface-border)', background: 'var(--card-dark)', 
                    color: 'var(--text-main)', outline: 'none', transition: 'all 0.3s', fontSize: '0.92rem', boxSizing: 'border-box'
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', background: 'var(--card-dark)', padding: '4px', borderRadius: '14px', border: '1px solid var(--surface-border)', flexShrink: 0 }}>
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ border: 'none', background: viewMode === 'grid' ? 'rgba(59,130,246,0.2)' : 'transparent', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', color: viewMode === 'grid' ? '#3b82f6' : 'var(--text-muted)' }}>
                  <LayoutGrid size={18} />
                </button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ border: 'none', background: viewMode === 'list' ? 'rgba(59,130,246,0.2)' : 'transparent', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', color: viewMode === 'list' ? '#3b82f6' : 'var(--text-muted)' }}>
                  <List size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* FILTERS TOOLBAR */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: '12px' }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Language Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-dark)', padding: '8px 14px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
                <Globe size={16} color="var(--text-muted)" />
                <select 
                  value={activeLang} 
                  onChange={(e) => setActiveLang(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="All" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>{t('all_languages') || 'All Languages'}</option>
                  <option value="Khmer" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>🇰🇭 Khmer Guides</option>
                  <option value="English" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>🇬🇧 English Guides</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--card-dark)', padding: '8px 14px', borderRadius: '14px', border: '1px solid var(--surface-border)' }}>
                <ArrowUpDown size={16} color="var(--text-muted)" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value="name" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Name (A-Z)</option>
                  <option value="date" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Date (Newest)</option>
                  <option value="size" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Size (Largest)</option>
                  <option value="downloads" style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>Popular (Downloads)</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{processedData.length}</span> documents
            </div>
          </motion.div>

          {/* QUICK ACCESS CATEGORY CARDS */}
          <AnimatePresence>
            {!searchQuery && !currentFolder && (
              <motion.section
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ duration: 0.35 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {t('quick_access') || 'Quick Access Categories'}
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: '16px' }}>
                  {Object.entries(documentStructure).map(([folderName, folderData], idx) => {
                    const count = docData.filter(d => d.category === folderName).length;
                    return (
                      <motion.div 
                        key={folderName} 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + idx * 0.04 }}
                        onClick={() => { setCurrentFolder(folderName); toggleFolder(folderName); }}
                        className="glass-panel-new file-card" 
                        style={{ padding: '22px 16px', borderRadius: '20px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <div style={{ marginBottom: '14px' }}>
                          <ModernFolderIcon size={56} color={folderData.color} />
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-main)' }}>{folderName}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>{count} PDF Guides</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* FILES & DOCUMENTS GRID / LIST SECTION */}
          <section style={{ flex: 1 }}>
            {processedData.length === 0 ? (
              <div className="glass-panel-new" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--surface-badge)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Search size={32} color="var(--text-muted)" />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '8px', fontWeight: 700 }}>No matching documents found</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Try adjusting your search terms or language filter to explore available technical documents.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setCurrentFolder(null); setCurrentSubfolder(null); setActiveLang('All'); }}
                  style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                key={viewMode + (currentFolder || '') + searchQuery + activeLang + sortBy}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' : '1fr', 
                  gap: '20px' 
                }}
              >
                {processedData.map((doc) => {
                  const catColor = documentStructure[doc.category]?.color || '#3b82f6';
                  
                  return (
                    <motion.div 
                      key={doc.id} 
                      variants={itemVariants}
                      className="glass-panel-new file-card" 
                      onClick={() => handleViewFile(doc)}
                      style={{ 
                        padding: viewMode === 'grid' ? '24px' : '18px 24px', 
                        borderRadius: '24px', 
                        display: 'flex', 
                        flexDirection: viewMode === 'grid' ? 'column' : 'row', 
                        alignItems: viewMode === 'grid' ? 'stretch' : 'center',
                        gap: '18px', cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: viewMode === 'list' ? 1 : 'none' }}>
                        <div style={{ 
                          width: '52px', height: '52px', borderRadius: '16px', 
                          background: `linear-gradient(135deg, ${catColor}25, ${catColor}10)`, 
                          border: `1px solid ${catColor}40`,
                          color: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, boxShadow: `0 6px 16px ${catColor}20`
                        }}>
                          <FileText size={26} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ 
                            fontSize: '1.05rem', fontWeight: 800, marginBottom: '6px', 
                            color: 'var(--text-main)', lineHeight: 1.35,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                          }}>
                            {doc.title}
                          </h4>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ background: 'var(--surface-badge)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                              {doc.size}
                            </span>
                            <span style={{ 
                              background: doc.lang === 'Khmer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                              color: doc.lang === 'Khmer' ? '#10b981' : '#3b82f6', 
                              padding: '3px 8px', borderRadius: '6px', 
                              border: `1px solid ${doc.lang === 'Khmer' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}` 
                            }}>
                              {doc.lang === 'Khmer' ? '🇰🇭 Khmer' : '🇬🇧 English'}
                            </span>
                            {doc.rating && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: '6px' }}>
                                <Star size={12} fill="#f59e0b" /> {doc.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {viewMode === 'grid' && (
                        <p style={{ 
                          color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5', 
                          flexGrow: 1, margin: '6px 0 12px 0',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                        }}>
                          {doc.desc}
                        </p>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: viewMode === 'grid' ? 'space-between' : 'flex-end', 
                        alignItems: 'center', 
                        marginTop: viewMode === 'grid' ? 'auto' : 0,
                        gap: '10px',
                        width: viewMode === 'list' ? 'auto' : '100%'
                      }}>
                        {viewMode === 'grid' && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {doc.date}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleViewFile(doc); }}
                            className="pulse-view-btn"
                            style={{ 
                              padding: '8px 14px', borderRadius: '12px', border: 'none', 
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                              color: '#fff', cursor: 'pointer', transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              fontSize: '0.84rem', fontWeight: 700,
                              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
                            }}
                            title="Instant PDF Viewer"
                          >
                            <Eye size={16} /> View PDF
                          </button>

                          <button 
                            disabled={downloadingId === doc.id} 
                            onClick={(e) => handleDownloadFile(e, doc.url, doc.title, doc.type, doc.id)}
                            style={{ 
                              padding: '8px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.84rem',
                              background: 'var(--surface-badge)', color: 'var(--text-main)', 
                              border: '1px solid var(--surface-border)',
                              display: 'flex', alignItems: 'center', gap: '6px', 
                              cursor: downloadingId === doc.id ? 'not-allowed' : 'pointer'
                            }}
                            title="Download PDF File"
                          >
                            {downloadingId === doc.id ? (
                              <Loader2 size={16} className="spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </section>

        </main>
      </div>
    </div>
  );
};

export default Documents;
