import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, Apple, ChevronRight, Folder, File, ArrowLeft, Eye } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const ModernIsoIcon = ({ size = 42 }) => (
  <img src="/iso.png" alt="ISO" style={{ width: size, height: size, objectFit: 'contain' }} />
);

const ModernScriptIcon = () => (
  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4C6.89543 4 6 4.89543 6 6V36C6 37.1046 6.89543 38 8 38H34C35.1046 38 36 37.1046 36 36V14L26 4H8Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5"/>
    <path d="M26 4V12C26 13.1046 26.8954 14 28 14H36" fill="#334155" stroke="#475569" strokeWidth="1.5"/>
    <path d="M14 20L18 24L14 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 28H28" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ModernFolderIcon = ({ size = 48, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 14C6 11.7909 7.79086 10 10 10H19.1716C20.2325 10 21.25 10.4214 22 11.1716L24.8284 14H38C40.2091 14 42 15.7909 42 18V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V14Z" fill="#F59E0B"/>
    <path d="M6 19C6 17.8954 6.89543 17 8 17H40C41.1046 17 42 17.8954 42 19V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V19Z" fill="#FCD34D"/>
    <path d="M6 21H42V36C42 38.2091 40.2091 40 38 40H10C7.79086 40 6 38.2091 6 36V21Z" fill="#FEF08A"/>
    <path d="M6 19C6 17.8954 6.89543 17 8 17H40C41.1046 17 42 17.8954 42 19V21H6V19Z" fill="#FDE047"/>
  </svg>
);

export const softwareData = [
  // === WINDOWS ===
  { id: 'win11', title: 'Windows 11 ISO', desc: 'Official Windows 11 installation media (24H2).', os: 'windows', folder: 'Windows', size: '5.2 GB', version: '24H2', url: 'https://files.kichhoat24h.com/download/Windows/Win11_24H2_English_x64.iso' },
  { id: 'win10', title: 'Windows 10 ISO', desc: 'Official Windows 10 installation media.', os: 'windows', folder: 'Windows', size: '4.8 GB', version: '22H2', url: 'https://software.download.prss.microsoft.com/dbazure/Win10_22H2_English_x64.iso' },
  
  // === WINDOWS SERVER ===
  { id: 'ws1', title: '17763.3650.221105-1748.rs5_release_svc_refresh_SERVER_EVAL_x64FRE_en-us.iso', timestamp: '10:24:51 24/02/2025', os: 'windows', folder: 'Windows Server', size: '5,519,618 KB' },
  { id: 'ws2', title: 'en-us_windows_server_2025_x64_dvd_b7ec10f3.iso', timestamp: '23:04:02 24/11/2024', os: 'windows', folder: 'Windows Server', size: '5,872,846 KB' },
  { id: 'ws3', title: 'en_windows_server_2019_x64_dvd_drivers.iso', timestamp: '10:19:55 06/01/2025', os: 'windows', folder: 'Windows Server', size: '5,441,792 KB' },
  { id: 'ws4', title: 'SERVER_2019_EVAL_x64FRE_virtio.iso', timestamp: '10:28:03 24/02/2025', os: 'windows', folder: 'Windows Server', size: '6,231,654 KB' },
  { id: 'ws5', title: 'SERVER_2019_EVAL_x64FRE_vroc.iso', timestamp: '09:47:03 03/09/2025', os: 'windows', folder: 'Windows Server', size: '5,522,938 KB' },
  { id: 'ws6', title: 'SERVER_EVAL_x64FRE_en-us.iso', timestamp: '07:15:25 28/12/2024', os: 'windows', folder: 'Windows Server', size: '4,925,874 KB' },
  { id: 'ws7', title: 'SERVER_EVAL_x64FRE_en-us_virtio.iso', timestamp: '09:00:40 06/01/2025', os: 'windows', folder: 'Windows Server', size: '5,638,072 KB' },
  { id: 'ws8', title: 'SERVER_EVAL_x64FRE_vroc.iso', timestamp: '14:13:29 24/09/2025', os: 'windows', folder: 'Windows Server', size: '4,929,356 KB' },
  { id: 'ws9', title: 'win-install-ovh.sh', timestamp: '20:10:28 03/02/2025', os: 'windows', folder: 'Windows Server', size: '1 KB' },

  // === OFFICE ===
  { id: 'office-win', title: 'Microsoft Office 2021', desc: 'Word, Excel, PowerPoint, and more for Windows.', os: 'windows', folder: 'Office', size: '4.5 GB', version: 'Pro Plus' },
  { id: 'libreoffice-win', title: 'LibreOffice', desc: 'Powerful and free open-source office suite.', os: 'windows', folder: 'Office', size: '340 MB', version: 'v7.6' },
  { id: 'office-mac', title: 'Microsoft Office 2021 (Mac)', desc: 'Word, Excel, PowerPoint, and more for Mac.', os: 'mac', folder: 'Office', size: '2.8 GB', version: 'Home & Business' },
  { id: 'libreoffice-mac', title: 'LibreOffice (Mac)', desc: 'Powerful open-source office suite for macOS.', os: 'mac', folder: 'Office', size: '310 MB', version: 'v7.6' },

  // === OFFICE SUBFOLDERS ===
  { id: 'off2007', title: 'Office Professional Plus 2007 (US x86)', os: 'windows', folder: 'Office', subfolder: '2007', url: 'https://files.kichhoat24h.com/download/Office/2007/en_office_professional_plus_2007_united_states_x86_cd_481425.iso' },

  { id: 'off2016-rt-pro', title: 'Office Professional Plus 2016', os: 'windows', folder: 'Office', subfolder: '2016', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2016/Retail/en_office_professional_plus_2016_x86_x64_dvd_6962141.iso' },
  { id: 'off2016-rt-proj', title: 'Project Professional 2016', os: 'windows', folder: 'Office', subfolder: '2016', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2016/Retail/en_project_professional_2016_x86_x64_dvd_6962236.iso' },
  { id: 'off2016-rt-vis', title: 'Visio Professional 2016', os: 'windows', folder: 'Office', subfolder: '2016', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2016/Retail/en_visio_professional_2016_x86_x64_dvd_6962139.iso' },
  { id: 'off2016-vl', title: 'Office Professional Plus 2016 (64Bit English)', os: 'windows', folder: 'Office', subfolder: '2016', version: 'VL', url: 'https://files.kichhoat24h.com/download/Office/2016/VL/SW_DVD5_Office_Professional_Plus_2016_64Bit_English_MLF_X20-42432.ISO' },

  { id: 'off2019-rt-pro', title: 'Office Professional Plus 2019', os: 'windows', folder: 'Office', subfolder: '2019', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2019/Retail/en_office_professional_plus_2019_x86_x64_dvd_7ea28c99.iso' },
  { id: 'off2019-rt-proj', title: 'Project Professional 2019', os: 'windows', folder: 'Office', subfolder: '2019', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2019/Retail/en_project_professional_2019_x86_x64_dvd_5821b437.iso' },
  { id: 'off2019-vl-64', title: 'Office ProPlus 2019 VL (x64)', os: 'windows', folder: 'Office', subfolder: '2019', version: 'VL', url: 'https://files.kichhoat24h.com/download/Office/2019/VL/Office_2019_ProPlus_VL_x64.iso' },
  { id: 'off2019-vl-86', title: 'Office ProPlus 2019 VL (x86)', os: 'windows', folder: 'Office', subfolder: '2019', version: 'VL', url: 'https://files.kichhoat24h.com/download/Office/2019/VL/Office_2019_ProPlus_VL_x86.iso' },
  { id: 'off2019-vl-std', title: 'Office Standard 2019 VL (x64)', os: 'windows', folder: 'Office', subfolder: '2019', version: 'VL', url: 'https://files.kichhoat24h.com/download/Office/2019/VL/Office_2019_Standard_VL_x64.iso' },

  { id: 'off2021-rt', title: 'ProPlus 2021', os: 'windows', folder: 'Office', subfolder: '2021', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2021/Retail/ProPlus2021Retail.img' },

  { id: 'off2024-rt-hb', title: 'Home & Business 2024', os: 'windows', folder: 'Office', subfolder: '2024', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2024/Retail/HomeBusiness2024Retail.img' },
  { id: 'off2024-rt-proj', title: 'Project Pro 2024', os: 'windows', folder: 'Office', subfolder: '2024', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2024/Retail/ProjectPro2024Retail.img' },
  { id: 'off2024-rt-pro', title: 'ProPlus 2024', os: 'windows', folder: 'Office', subfolder: '2024', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2024/Retail/ProPlus2024Retail.img' },
  { id: 'off2024-rt-visp', title: 'Visio Pro 2024', os: 'windows', folder: 'Office', subfolder: '2024', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2024/Retail/VisioPro2024Retail.img' },
  { id: 'off2024-rt-viss', title: 'Visio Std 2024', os: 'windows', folder: 'Office', subfolder: '2024', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/2024/Retail/VisioStd2024Retail.img' },
  { id: 'off2024-vl', title: 'Office LTSC Pro Plus 2024 (x64)', os: 'windows', folder: 'Office', subfolder: '2024', version: 'VL', url: 'https://files.kichhoat24h.com/download/Office/2024/Microsoft%20Office%20LTSC%20Pro%20Plus%202024_x64.iso' },

  { id: 'off365', title: 'O365 ProPlus', os: 'windows', folder: 'Office', subfolder: '365', version: 'Retail', url: 'https://files.kichhoat24h.com/download/Office/365/O365ProPlusRetail.img' },

  // === VISUAL STUDIO ===
  { id: 'vscode-win', title: 'Visual Studio Code', desc: 'A lightweight but powerful source code editor.', os: 'windows', folder: 'Visual Studio', size: '88 MB', version: 'v1.82' },
  { id: 'vscode-mac', title: 'Visual Studio Code (Mac)', desc: 'A lightweight but powerful source code editor.', os: 'mac', folder: 'Visual Studio', size: '115 MB', version: 'v1.82' },
  { id: 'vs-community', title: 'Visual Studio Community 2022', desc: 'Comprehensive IDE for .NET and C++ developers.', os: 'windows', folder: 'Visual Studio', size: '1.2 GB', version: '2022' },

  // === SOFTWARE (General) ===
  { id: 'macos-sonoma', title: 'macOS Sonoma', desc: 'The latest major release of macOS.', os: 'mac', folder: 'Mac OS', size: '12 GB', version: '14.0' },
  { id: 'macos-ventura', title: 'macOS Ventura', desc: 'The previous major release of macOS.', os: 'mac', folder: 'Mac OS', size: '12 GB', version: '13.5' },
  { id: 'docker-desktop-win', title: 'Docker Desktop', desc: 'The fastest way to containerize applications on Windows.', os: 'windows', folder: 'Software', size: '620 MB', version: 'v4.22' },
  { id: 'docker-desktop-mac', title: 'Docker Desktop (Mac)', desc: 'Optimized for M-series chips.', os: 'mac', folder: 'Software', size: '590 MB', version: 'v4.22' },
  { id: 'postman', title: 'Postman IDE', desc: 'An API platform for building and using APIs.', os: 'windows', folder: 'Software', size: '150 MB', version: 'v10.15' },
  { id: 'vlc-mac', title: 'VLC Media Player', desc: 'Free and open source multimedia player.', os: 'mac', folder: 'Software', size: '55 MB', version: 'v3.0.18' },
  { id: 'chrome-win', title: 'Google Chrome', desc: 'Fast, secure, and free web browser built for the modern web.', os: 'windows', folder: 'Software', size: '90 MB', version: 'Latest' },
  { id: 'chrome-mac', title: 'Google Chrome (Mac)', desc: 'Fast, secure, and free web browser built for the modern web.', os: 'mac', folder: 'Software', size: '180 MB', version: 'Latest' },
  { id: 'firefox-win', title: 'Mozilla Firefox', desc: 'Open-source web browser, prioritizing privacy and speed.', os: 'windows', folder: 'Software', size: '55 MB', version: 'Latest' },
  { id: 'firefox-mac', title: 'Mozilla Firefox (Mac)', desc: 'Open-source web browser, prioritizing privacy and speed.', os: 'mac', folder: 'Software', size: '130 MB', version: 'Latest' },
  { id: 'zoom-win', title: 'Zoom Workplace', desc: 'Video conferencing, cloud phone, webinars, and chat.', os: 'windows', folder: 'Software', size: '60 MB', version: 'Latest' },
  { id: 'zoom-mac', title: 'Zoom Workplace (Mac)', desc: 'Video conferencing, cloud phone, webinars, and chat.', os: 'mac', folder: 'Software', size: '150 MB', version: 'Latest' },
  { id: 'slack-win', title: 'Slack', desc: 'Team communication and collaboration platform.', os: 'windows', folder: 'Software', size: '140 MB', version: 'Latest' },
  { id: 'slack-mac', title: 'Slack (Mac)', desc: 'Team communication and collaboration platform.', os: 'mac', folder: 'Software', size: '180 MB', version: 'Latest' },
  { id: 'discord-win', title: 'Discord', desc: 'Voice, video and text chat app for communities.', os: 'windows', folder: 'Software', size: '85 MB', version: 'Latest' },
  { id: 'discord-mac', title: 'Discord (Mac)', desc: 'Voice, video and text chat app for communities.', os: 'mac', folder: 'Software', size: '110 MB', version: 'Latest' },
  { id: 'teams-win', title: 'Microsoft Teams', desc: 'Workspace for real-time collaboration and communication.', os: 'windows', folder: 'Software', size: '130 MB', version: 'Latest' },
  { id: 'teams-mac', title: 'Microsoft Teams (Mac)', desc: 'Workspace for real-time collaboration and communication.', os: 'mac', folder: 'Software', size: '250 MB', version: 'Latest' },

  // === TOOLS ===
  { id: 'git-win', title: 'Git for Windows', desc: 'Brings the Git terminal and GUI to Windows.', os: 'windows', folder: 'Tools', size: '50 MB', version: 'v2.42' },
  { id: 'epson-win', title: 'Epson L3110 Driver', desc: 'Printer and scanner drivers for Epson L3110.', os: 'windows', folder: 'Tools', size: '30 MB', version: 'v2.60' },
  { id: 'hp-universal-win', title: 'HP Universal Print Driver', desc: 'A single driver for a range of HP print devices.', os: 'windows', folder: 'Tools', size: '20 MB', version: 'v7.1' },
  { id: 'rufus', title: 'Rufus', desc: 'Create bootable USB drives the easy way.', os: 'windows', folder: 'Tools', size: '1.4 MB', version: 'v4.2' },
  { id: '7zip', title: '7-Zip', desc: 'A file archiver with a high compression ratio.', os: 'windows', folder: 'Tools', size: '1.5 MB', version: 'v23.01' },
  { id: 'iterm2', title: 'iTerm2', desc: 'A terminal emulator for macOS.', os: 'mac', folder: 'Tools', size: '22 MB', version: 'v3.4.19' },
  { id: 'homebrew', title: 'Homebrew', desc: 'The Missing Package Manager for macOS.', os: 'mac', folder: 'Tools', size: '10 KB', version: 'Latest' },
  { id: 'canon-mac', title: 'Canon PIXMA G3010 Driver', desc: 'Official driver suite for Mac users.', os: 'mac', folder: 'Tools', size: '45 MB', version: 'v1.3.0' },
  { id: 'unarchiver', title: 'The Unarchiver', desc: 'Small and easy program to unarchive files.', os: 'mac', folder: 'Tools', size: '15 MB', version: 'v4.3.6' },
  { id: 'nodejs-win', title: 'Node.js', desc: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine.', os: 'windows', folder: 'Tools', size: '30 MB', version: 'v20.17' },
  { id: 'nodejs-mac', title: 'Node.js (Mac)', desc: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine.', os: 'mac', folder: 'Tools', size: '45 MB', version: 'v20.17' },
  { id: 'python-win', title: 'Python', desc: 'Powerful and fast programming language.', os: 'windows', folder: 'Tools', size: '25 MB', version: 'v3.12' },
  { id: 'python-mac', title: 'Python (Mac)', desc: 'Powerful and fast programming language.', os: 'mac', folder: 'Tools', size: '40 MB', version: 'v3.12' },
  { id: 'anydesk-win', title: 'AnyDesk', desc: 'Fast and secure remote desktop application.', os: 'windows', folder: 'Tools', size: '4 MB', version: 'Latest' },
  { id: 'anydesk-mac', title: 'AnyDesk (Mac)', desc: 'Fast and secure remote desktop application.', os: 'mac', folder: 'Tools', size: '15 MB', version: 'Latest' },
  { id: 'teamviewer-win', title: 'TeamViewer', desc: 'Remote control, desktop sharing, and file transfer.', os: 'windows', folder: 'Tools', size: '45 MB', version: 'Latest' },
  { id: 'teamviewer-mac', title: 'TeamViewer (Mac)', desc: 'Remote control, desktop sharing, and file transfer.', os: 'mac', folder: 'Tools', size: '80 MB', version: 'Latest' },
  { id: 'winrar', title: 'WinRAR', desc: 'Powerful archive manager and data compression tool.', os: 'windows', folder: 'Tools', size: '3 MB', version: 'v6.24' },
  { id: 'notepadpp', title: 'Notepad++', desc: 'Free source code editor and Notepad replacement.', os: 'windows', folder: 'Tools', size: '4 MB', version: 'v8.5.8' },
  { id: 'keka', title: 'Keka', desc: 'The macOS file archiver.', os: 'mac', folder: 'Tools', size: '25 MB', version: 'v1.3.4' },
  { id: 'raycast', title: 'Raycast', desc: 'Blazingly fast, totally extendable launcher for macOS.', os: 'mac', folder: 'Tools', size: '35 MB', version: 'Latest' },
  { id: 'filezilla-win', title: 'FileZilla Client', desc: 'Fast and reliable cross-platform FTP, FTPS and SFTP client.', os: 'windows', folder: 'Tools', size: '12 MB', version: 'Latest' },
  { id: 'filezilla-mac', title: 'FileZilla Client (Mac)', desc: 'Fast and reliable cross-platform FTP, FTPS and SFTP client.', os: 'mac', folder: 'Tools', size: '15 MB', version: 'Latest' },
];

const windowsFolders = [
  'Windows',
  'Windows Server',
  'Office',
  'Visual Studio',
  'Software',
  'Tools'
];

const macFolders = [
  'Mac OS',
  'Office',
  'Visual Studio',
  'Software',
  'Tools'
];

const officeSubfolders = [
  '2007',
  '2010',
  '2013',
  '2016',
  '2019',
  '2021',
  '2024',
  '365'
];

const Software = () => {
  const [activeOS, setActiveOS] = useState('windows');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [currentTypeFolder, setCurrentTypeFolder] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const isGuest = !user || user.isAnonymous;

  // Folder Icon color - Bright Orange
  const folderColor = '#e88f15';
  const folderBg = '#fdf4e7'; // light orange for the background of the icon

  const currentFoldersList = activeOS === 'windows' ? windowsFolders : macFolders;
  const filteredSoftware = softwareData.filter(item => {
    if (item.os !== activeOS) return false;
    if (item.folder !== currentFolder) return false;
    if (currentSubfolder && item.subfolder !== currentSubfolder) return false;
    if (currentTypeFolder && item.version !== currentTypeFolder) return false;
    if (!currentSubfolder && item.folder === 'Office' && item.subfolder) return false;
    return true;
  });

  const availableTypes = currentFolder === 'Office' && currentSubfolder
    ? Array.from(new Set(
        softwareData
          .filter(item => item.os === activeOS && item.folder === 'Office' && item.subfolder === currentSubfolder && item.version && ['Retail', 'VL'].includes(item.version))
          .map(item => item.version)
      ))
    : [];

  return (
    <div className="container" style={{ paddingTop: '80px', minHeight: '80vh', paddingBottom: '80px' }}>
      
      {!currentFolder ? (
        <>
          <header style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h1 className="text-animated-cyber">Software Repository</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem', marginTop: '16px' }}>
              Browse through our structured repository to find the necessary installers, applications, and tools.
            </p>

            {/* OS Filter Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--card-dark)', padding: '6px', borderRadius: '30px', display: 'flex', gap: '8px', border: '1px solid var(--surface-border)' }}>
                <button 
                  onClick={() => { setActiveOS('windows'); setCurrentFolder(null); setCurrentSubfolder(null); setCurrentTypeFolder(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '24px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit',
                    background: activeOS === 'windows' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                    color: activeOS === 'windows' ? '#fff' : 'var(--text-muted)',
                    transition: 'var(--transition)'
                  }}
                >
                  <Monitor size={18} /> Windows
                </button>
                <button 
                  onClick={() => { setActiveOS('mac'); setCurrentFolder(null); setCurrentSubfolder(null); setCurrentTypeFolder(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '24px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit',
                    background: activeOS === 'mac' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'transparent',
                    color: activeOS === 'mac' ? '#fff' : 'var(--text-muted)',
                    transition: 'var(--transition)'
                  }}
                >
                  <Apple size={18} /> Mac OS
                </button>
              </div>
            </div>
          </header>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', background: 'var(--surface)' }}>
              
              {currentFoldersList.map((folderName, idx) => (
                <div 
                  key={folderName} 
                  onClick={() => setCurrentFolder(folderName)}
                  className="folder-item"
                  style={{
                    borderBottom: idx !== currentFoldersList.length - 1 ? '1px solid var(--surface-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <ModernFolderIcon size={44} className="folder-icon" />
                    <span className="folder-name-text" style={{ fontWeight: 600, fontSize: '1.2rem' }}>
                      {folderName}
                    </span>
                  </div>

                  <div className="folder-badge">
                    <Folder fill={folderColor} color={folderColor} size={14} />
                    Folder
                  </div>
                </div>
              ))}

            </div>
          </div>
        </>
      ) : currentFolder === 'Office' && !currentSubfolder ? (
        <>
          <div style={{ marginBottom: '40px', maxWidth: '1000px', margin: '0 auto 40px auto' }}>
            <button 
              onClick={() => setCurrentFolder(null)}
              className="btn btn-outline"
              style={{ padding: '8px 16px', marginBottom: '24px' }}
            >
              <ArrowLeft size={16} /> Back to Folders
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ModernFolderIcon size={36} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-animated-cyber" style={{ margin: 0, lineHeight: 1 }}>{currentFolder}</h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {activeOS === 'windows' ? 'Windows OS' : 'macOS'} Apps
                </span>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', background: 'var(--surface)' }}>
              
              {officeSubfolders.map((folderName, idx) => (
                <div 
                  key={folderName}
                  className="file-item" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: idx !== officeSubfolders.length - 1 ? '1px solid var(--surface-border)' : 'none',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="file-icon folder" style={{ width: '32px', height: '32px' }}>
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAF4SURBVFhH7ZZNSsNQFEYjVYSCNeAyugahIv6kE12AYEmtrc5EnLsTcReKduJAB9I2Tkxa3YDiMJkk6Of36FUbEExt+5pBLpxRyDsn4TWvRjbZpGZwaeRwYeQTMCe3jG+4aI4BN8RPwBs54T0zcvvowwXzJCBIyAc5JeMZLjRsANCxgG4dcHeH53GnhfvlWdEz4Go+TwKCP2kuAM4W0DsEPPt/uJUQrZVF0TPgYdvE01GI52MkQj25tzcCdoj26kBAe82EVw3RrXFxDSgXnaJnQGfd5AUG8Mm0QBedolcBmwzYZ0CDF3VAF52iZ4CjAuohegfcXBpQLjpFr96AxYAGA7izdaBcdIo+FQHlKQSU0xTgqADdmzAWoPaA5p8hnaL/CqhF/Y+EDuiKB2wwoMqAXz6bE4EuOkUvAZ7NAB4UOlCuWIA6C9xK9H1cThrlGjwLottSwW9agX9tvWuBruiuVBB9f17Pi+bLWXFJB3T9/BfIJpvpjmF8AnAtKFYMFUb0AAAAAElFTkSuQmCC" alt="Icon" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div className="file-info" style={{ display: 'flex', flexDirection: 'column' }}>
                      <button onClick={() => setCurrentSubfolder(folderName)} className="file-name" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.2rem', textDecoration: 'none', padding: 0 }}>
                        Office {folderName}
                      </button>
                      <span className="file-meta"></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="file-size folder-badge" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px' }}>
                      <Folder size={14} /> Folder
                    </span>
                    
                    <button onClick={() => setCurrentSubfolder(folderName)} className="file-arrow" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', opacity: 0.8, display: 'flex', alignItems: 'center', textDecoration: 'none', padding: 0 }}>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </>
      ) : currentFolder === 'Office' && currentSubfolder && !currentTypeFolder && availableTypes.length > 0 ? (
        <>
          <div style={{ marginBottom: '40px', maxWidth: '1000px', margin: '0 auto 40px auto' }}>
            <button 
              onClick={() => setCurrentSubfolder(null)}
              className="btn btn-outline"
              style={{ padding: '8px 16px', marginBottom: '24px' }}
            >
              <ArrowLeft size={16} /> Back to {currentFolder}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ModernFolderIcon size={36} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-animated-cyber" style={{ margin: 0, lineHeight: 1 }}>Office {currentSubfolder}</h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {activeOS === 'windows' ? 'Windows OS' : 'macOS'} Apps in {currentFolder}
                </span>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', background: 'var(--surface)' }}>
              
              {availableTypes.map((folderName, idx) => (
                <div 
                  key={folderName}
                  className="file-item" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    borderBottom: idx !== availableTypes.length - 1 ? '1px solid var(--surface-border)' : 'none',
                    transition: 'var(--transition)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="file-icon folder" style={{ width: '32px', height: '32px' }}>
                      <ModernFolderIcon size={32} />
                    </div>
                    <div className="file-info" style={{ display: 'flex', flexDirection: 'column' }}>
                      <button onClick={() => setCurrentTypeFolder(folderName)} className="file-name" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.2rem', textDecoration: 'none', padding: 0 }}>
                        {folderName}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span className="file-size folder-badge" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px' }}>
                      <Folder size={14} /> Folder
                    </span>
                    
                    <button onClick={() => setCurrentTypeFolder(folderName)} className="file-arrow" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', opacity: 0.8, display: 'flex', alignItems: 'center', textDecoration: 'none', padding: 0 }}>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '40px', maxWidth: '1000px', margin: '0 auto 40px auto' }}>
            <button 
              onClick={() => {
                if (currentTypeFolder) {
                  setCurrentTypeFolder(null);
                } else if (currentSubfolder) {
                  setCurrentSubfolder(null);
                } else {
                  setCurrentFolder(null);
                }
              }}
              className="btn btn-outline"
              style={{ padding: '8px 16px', marginBottom: '24px' }}
            >
              <ArrowLeft size={16} /> {currentTypeFolder ? `Back to ${currentSubfolder}` : (currentSubfolder ? `Back to ${currentFolder}` : 'Back to Folders')}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ModernFolderIcon size={36} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-animated-cyber" style={{ margin: 0, lineHeight: 1 }}>
                  {currentTypeFolder ? `${currentTypeFolder} (${currentSubfolder})` : (currentSubfolder ? `Office ${currentSubfolder}` : currentFolder)}
                </h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {activeOS === 'windows' ? 'Windows OS' : 'macOS'} Apps {currentSubfolder && `in ${currentFolder}`}
                </span>
              </div>
            </div>
          </div>

          {currentFolder === 'Windows Server' || (currentFolder === 'Office' && currentSubfolder) ? (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', background: 'var(--surface)' }}>
                {filteredSoftware.map((software, idx) => (
                  <div 
                    key={software.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 24px',
                      borderBottom: idx !== filteredSoftware.length - 1 ? '1px solid var(--surface-border)' : 'none',
                      transition: 'var(--transition)',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {(software.title.toLowerCase().includes('iso') || (software.url && software.url.toLowerCase().includes('.iso'))) ? <ModernIsoIcon /> : <ModernScriptIcon />}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <a 
                          href={software.url || `https://files.kichhoat24h.com/download/${encodeURIComponent(software.folder)}/${encodeURIComponent(software.title)}`}
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => { if (isGuest) { e.preventDefault(); navigate('/login'); } }}
                          style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', wordBreak: 'break-all', textDecoration: 'none' }}
                          onMouseOver={(e) => e.target.style.color = 'var(--primary)'}
                          onMouseOut={(e) => e.target.style.color = 'var(--text-main)'}
                        >
                          {software.title}
                        </a>
                        {software.timestamp && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {software.timestamp}
                          </span>
                        )}
                        {software.version && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Version: {software.version}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      {software.size && (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, minWidth: '80px', textAlign: 'right' }}>
                          {software.size}
                        </span>
                      )}
                      <a 
                        href={software.url || `https://files.kichhoat24h.com/download/${encodeURIComponent(software.folder)}/${encodeURIComponent(software.title)}`}
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => { if (isGuest) { e.preventDefault(); navigate('/login'); } }}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--primary)', opacity: 0.8, textDecoration: 'none' }}
                      >
                        <ChevronRight size={20} />
                      </a>
                    </div>
                  </div>
                ))}
                {filteredSoftware.length === 0 && (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <File size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                    <p>No files found in {currentFolder}.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
              {filteredSoftware.map(software => (
                <div key={software.id} className="card glass-panel flex flex-col" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(69, 243, 255, 0.1)', padding: '16px', borderRadius: '16px', color: 'var(--primary)' }}>
                      {(software.title.toLowerCase().includes('iso') || (software.url && software.url.toLowerCase().includes('.iso'))) ? (
                        <ModernIsoIcon size={32} />
                      ) : (software.os === 'windows' ? <Monitor size={32} /> : <Apple size={32} />)}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.8rem', background: 'var(--surface-badge)', padding: '4px 12px', borderRadius: '12px', color: 'var(--text-muted)' }}>
                        {software.version}
                      </span>
                      <span style={{ fontSize: '0.75rem', border: '1px solid #ff2a7a', padding: '2px 10px', borderRadius: '12px', color: '#ff2a7a' }}>
                        {software.os === 'windows' ? 'Windows OS' : 'macOS'}
                      </span>
                    </div>
                  </div>
                  
                  <a 
                    href={software.downloadUrl || software.url || `https://files.kichhoat24h.com/download/${encodeURIComponent(software.folder)}/${encodeURIComponent(software.title)}`}
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => { if (isGuest) { e.preventDefault(); navigate('/login'); } }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <h3 
                      style={{ fontSize: '1.4rem', marginBottom: '8px', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseOver={(e) => e.target.style.color = 'var(--primary)'}
                      onMouseOut={(e) => e.target.style.color = 'inherit'}
                    >
                      {software.title}
                    </h3>
                  </a>
                  <p style={{ color: 'var(--text-muted)', flexGrow: 1, fontSize: '0.95rem' }}>{software.desc}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Size: {software.size}</span>
                    <Link to={`/software/${software.id}`} onClick={(e) => { if (isGuest) { e.preventDefault(); navigate('/login'); } }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--primary)' }}>
                      <Eye size={16} /> View
                    </Link>
                  </div>
                </div>
              ))}

              {filteredSoftware.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                  <File size={48} style={{ margin: '0 auto', marginBottom: '16px', opacity: 0.5 }} />
                  <p>No files found in this folder for {activeOS === 'windows' ? 'Windows' : 'Mac OS'}.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Software;

