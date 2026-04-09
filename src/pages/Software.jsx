import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Monitor, Apple, ChevronRight, Folder, File, ArrowLeft, Eye, Download as DownloadIcon, PlayCircle, Cpu, Settings, Search, X, Printer, Briefcase, Globe, Code } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '../LanguageContext';

const ModernIsoIcon = ({ size = 42 }) => (
  <img src="/iso.png" alt="ISO" style={{ width: size, height: size, objectFit: 'contain' }} />
);

const ModernScriptIcon = ({ size = 42 }) => (
  <svg width={size} height={size} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 4C6.89543 4 6 4.89543 6 6V36C6 37.1046 6.89543 38 8 38H34C35.1046 38 36 37.1046 36 36V14L26 4H8Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5"/>
    <path d="M26 4V12C26 13.1046 26.8954 14 28 14H36" fill="#334155" stroke="#475569" strokeWidth="1.5"/>
    <path d="M14 20L18 24L14 28" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 28H28" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ModernFolderIcon = ({ size = 48, className = '', folderName = '' }) => {
  let Icon = Folder;
  let color = "var(--primary)";
  let fillColor = "rgba(99, 102, 241, 0.15)";

  const name = folderName.toLowerCase();

  if (name.includes('download')) {
    Icon = DownloadIcon;
  } else if (name.includes('media') || name.includes('video') || name.includes('audio')) {
    Icon = PlayCircle;
  } else if (name.includes('driver')) {
    Icon = Settings;
    if (name.includes('printer')) {
      Icon = Printer;
    }
  } else if (name.includes('tools')) {
    Icon = Settings;
  } else if (name.includes('windows server') || name.includes('cpu') || name.includes('chipset')) {
    Icon = Cpu;
  } else if (name.includes('office')) {
    Icon = Briefcase;
  } else if (name.includes('network')) {
    Icon = Globe;
  } else if (name.includes('coding') || name.includes('visual studio')) {
    Icon = Code;
  }

  return <Icon size={size} className={className} color={color} fill={fillColor} strokeWidth={1.5} />;
};

export const SoftwareIcon = ({ id, os, size = 32 }) => {
  const iconMap = {
    'chrome-win': 'google.com',
    'chrome-mac': 'google.com',
    'vscode-win': 'visualstudio.com',
    'vscode-mac': 'visualstudio.com',
    'git-win': 'git-scm.com',
    'docker-desktop-win': 'docker.com',
    'docker-desktop-mac': 'docker.com',
    'firefox-win': 'mozilla.org',
    'firefox-mac': 'mozilla.org',
    'zoom-win': 'zoom.us',
    'zoom-mac': 'zoom.us',
    'slack-win': 'slack.com',
    'slack-mac': 'slack.com',
    'discord-win': 'discord.com',
    'discord-mac': 'discord.com',
    'teams-win': 'microsoft.com',
    'teams-mac': 'microsoft.com',
    'vlc-mac': 'videolan.org',
    'postman': 'postman.com',
    'nodejs-win': 'nodejs.org',
    'nodejs-mac': 'nodejs.org',
    'python-win': 'python.org',
    'python-mac': 'python.org',
    'anydesk-win': 'anydesk.com',
    'anydesk-mac': 'anydesk.com',
    'teamviewer-win': 'teamviewer.com',
    'teamviewer-mac': 'teamviewer.com',
    'winrar': 'win-rar.com',
    '7zip': '7-zip.org',
    'rufus': 'rufus.ie',
    'filezilla-win': 'filezilla-project.org',
    'filezilla-mac': 'filezilla-project.org',
    'iterm2': 'iterm2.com',
    'homebrew': 'brew.sh',
    'raycast': 'raycast.com',
    'keka': 'keka.io',
    'notepadpp': 'notepad-plus-plus.org',
    'unarchiver': 'theunarchiver.com',
    'vs-community': 'visualstudio.com',
    'office-win': 'microsoft.com',
    'office-mac': 'microsoft.com',
    'libreoffice-win': 'libreoffice.org',
    'libreoffice-mac': 'libreoffice.org',
    'macos-sonoma': 'apple.com',
    'macos-ventura': 'apple.com',
    'idm': 'internetdownloadmanager.com',
    'idm-reset': 'internetdownloadmanager.com',
    'utorrent': 'utorrent.com',
    'qbittorrent': 'qbittorrent.org',
    'freetube': 'freetubeapp.io',
    'potplayer': 'potplayer.daum.net',
    'kmplayer': 'kmplayer.com',
    'obs-win': 'obsproject.com',
    'obs-mac': 'obsproject.com',
    'handbrake-win': 'handbrake.fr',
    'vlc-win': 'videolan.org',
    'vlc-mac-media': 'videolan.org',
    'streamlabs-win': 'streamlabs.com',
    'klite-win': 'codecguide.com',
    'zktime-5': 'zkteco.com',
    'zktimenet-4': 'zkteco.com',
    'bandicam': 'bandicam.com',
    'zdsoft': 'zdsoft.com',
    'adobe-cc': 'adobe.com',
    'spotify': 'spotify.com',
    'youtube': 'youtube.com',
    'nordvpn': 'nordvpn.com',
    'bitdefender': 'bitdefender.com',
    'kaspersky': 'kaspersky.com',
    'malwarebytes': 'malwarebytes.com',
    'ccleaner': 'ccleaner.com',
    'canon': 'canon.com',
    'epson': 'epson.com',
    'hp': 'hp.com',
    'brother': 'brother.com',
    'ricoh': 'ricoh.com',
    'kyocera': 'kyocera.com',
    'windows-11': 'microsoft.com',
    'windows-10': 'microsoft.com',
    'office-2021': 'microsoft.com',
    'office-2019': 'microsoft.com',
    'vuescan': 'hamrick.com',
  };

  if (id === 'potplayer') {
    return <img src="/PotPlayer.png" className="software-real-icon" alt={id} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  if (id.includes('vlc')) {
    return <img src="/vlc.avif" className="software-real-icon" alt={id} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  if (id.includes('klite')) {
    return <img src="/k-liteplayer.webp" className="software-real-icon" alt={id} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }

  const domain = iconMap[id];
  if (domain) {
    return (
      <img 
        src={`https://www.google.com/s2/favicons?sz=64&domain=${domain}`} 
        className="software-real-icon"
        alt={id} 
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  // Fallback for scripts if not in iconMap
  if (id.toLowerCase().includes('script') || id.toLowerCase().includes('reset')) {
    return <ModernScriptIcon size={size} />;
  }

  return os === 'windows' ? <Monitor size={size} /> : <Apple size={size} />;
};

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
  { id: 'docker-desktop-win', title: 'Docker Desktop', desc: 'The fastest way to containerize applications on Windows.', os: 'windows', folder: 'Software', size: '620 MB', version: 'v4.22', url: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' },
  { id: 'docker-desktop-mac', title: 'Docker Desktop (Mac)', desc: 'Optimized for M-series chips.', os: 'mac', folder: 'Software', size: '590 MB', version: 'v4.22' },
  { id: 'zktime-5', title: 'ZKTime 5.0', desc: 'Attendance management software for ZKteco devices.', os: 'windows', folder: 'Software', subfolder: 'Attendance', size: '55 MB', version: 'v5.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/ZKTime5.0.zip' },
  { id: 'zktimenet-4', title: 'ZKTimenet 4.0 Thailand', desc: 'Thai version of ZKTimenet 4.0 attendance software.', os: 'windows', folder: 'Software', subfolder: 'Attendance', size: '120 MB', version: 'v4.2.0.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/ZKTimenet4.0_Thailand_4.2.0.0.zip' },
  { id: 'postman', title: 'Postman IDE', desc: 'An API platform for building and using APIs.', os: 'windows', folder: 'Software', size: '150 MB', version: 'v10.15', url: 'https://dl.pstmn.io/download/latest/win64' },
  { id: 'vlc-mac', title: 'VLC Media Player', desc: 'Free and open source multimedia player.', os: 'mac', folder: 'Software', size: '55 MB', version: 'v3.0.18' },
  { id: 'chrome-win', title: 'Google Chrome', desc: 'Fast, secure, and free web browser built for the modern web.', os: 'windows', folder: 'Software', size: '90 MB', version: 'Latest', url: 'https://dl.google.com/tag/s/appguid%3D%7B8A69D345-D564-463C-AFF1-A69D9E530F96%7D%26iid%3D%7B135FF71F-176A-1B63-3CE5-129016ABBA58%7D%26lang%3Den%26browser%3D4%26usagestats%3D1%26appname%3DGoogle%2520Chrome%26needsadmin%3Dprefers%26ap%3D-arch_x64-statsdef_1%26installdataindex%3Dempty/update2/installers/ChromeSetup.exe' },
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
  { id: 'git-win', title: 'Git for Windows', desc: 'Brings the Git terminal and GUI to Windows.', os: 'windows', folder: 'Tools', size: '50 MB', version: 'v2.53.0.2', url: 'https://github.com/git-for-windows/git/releases/download/v2.53.0.windows.2/Git-2.53.0.2-64-bit.exe' },
  { id: 'epson-win', title: 'Epson L3110 Driver', desc: 'Printer and scanner drivers for Epson L3110.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Epson', size: '30 MB', version: 'v2.60' },
  { id: 'hp-universal-win', title: 'HP Universal Print Driver', desc: 'A single driver for a range of HP print devices.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'HP', size: '20 MB', version: 'v7.1' },
  { id: 'rufus', title: 'Rufus', desc: 'Create bootable USB drives the easy way.', os: 'windows', folder: 'Tools', size: '1.4 MB', version: 'v4.13', url: 'https://github.com/pbatard/rufus/releases/download/v4.13/rufus-4.13.exe' },
  { id: '7zip', title: '7-Zip', desc: 'A file archiver with a high compression ratio.', os: 'windows', folder: 'Tools', size: '1.5 MB', version: 'v23.01' },
  { id: 'iterm2', title: 'iTerm2', desc: 'A terminal emulator for macOS.', os: 'mac', folder: 'Tools', size: '22 MB', version: 'v3.4.19' },
  { id: 'homebrew', title: 'Homebrew', desc: 'The Missing Package Manager for macOS.', os: 'mac', folder: 'Tools', size: '10 KB', version: 'Latest' },
  { id: 'canon-mac', title: 'Canon PIXMA G3010 Driver', desc: 'Official driver suite for Mac users.', os: 'mac', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Canon', size: '45 MB', version: 'v1.3.0' },
  { id: 'unarchiver', title: 'The Unarchiver', desc: 'Small and easy program to unarchive files.', os: 'mac', folder: 'Tools', size: '15 MB', version: 'v4.3.6' },
  
  // === ADDITIONAL DRIVERS ===
  { id: 'epson-l3210-win', title: 'Epson L3210 Driver', desc: 'Complete drivers and software for Epson L3210.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Epson', size: '25 MB', version: 'v3.01' },
  { id: 'hp-laserjet-win', title: 'HP LaserJet Pro M227fdw Driver', desc: 'Full software solution for HP LaserJet Pro.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'HP', size: '140 MB', version: 'v44.1' },
  { id: 'canon-ir2520-win', title: 'Canon imageRUNNER 2520 Driver', desc: 'UFRII LT Printer Driver for Canon iR2520.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Canon', size: '30 MB', version: 'v30.00' },
  { id: 'brother-hl2320-win', title: 'Brother HL-L2320D Driver', desc: 'Full driver and software package for Brother printer.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Brother', size: '42 MB', version: 'v1.0.2' },
  { id: 'ricoh-mp201-win', title: 'Ricoh Aficio MP 201 Driver', desc: 'PCL6 Driver for Ricoh MP 201.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Ricoh', size: '18 MB', version: 'v1.12' },
  { id: 'kyocera-ta2020-win', title: 'Kyocera TASKalfa 2020 Driver', desc: 'GX Driver for Kyocera TASKalfa 2020.', os: 'windows', folder: 'Driver', subfolder: 'Printer Driver', brand: 'Kyocera', size: '35 MB', version: 'v7.5' },
  
  { id: 'nvidia-win', title: 'NVIDIA GeForce Game Ready Driver', desc: 'Official drivers for NVIDIA GeForce Graphic Cards.', os: 'windows', folder: 'Driver', subfolder: 'Graphic Card', size: '600 MB', version: 'v537.13' },
  { id: 'amd-radeon-win', title: 'AMD Radeon Software Adrenalin', desc: 'Driver software for AMD Radeon graphics.', os: 'windows', folder: 'Driver', subfolder: 'Graphic Card', size: '580 MB', version: 'v23.9.1' },
  { id: 'intel-graphics-win', title: 'Intel Arc & Iris Xe Graphics Driver', desc: 'Official Intel graphics drivers.', os: 'windows', folder: 'Driver', subfolder: 'Graphic Card', size: '550 MB', version: 'v31.0' },

  { id: 'realtek-win', title: 'Realtek High Definition Audio Driver', desc: 'High Definition Audio Codecs for Windows.', os: 'windows', folder: 'Driver', subfolder: 'Audio', size: '250 MB', version: 'v2.82' },
  { id: 'via-hd-audio-win', title: 'VIA HD Audio Driver', desc: 'Audio driver for VIA chips.', os: 'windows', folder: 'Driver', subfolder: 'Audio', size: '140 MB', version: 'v11.11' },

  { id: 'intel-network-win', title: 'Intel Network Adapter Driver', desc: 'Ethernet drivers for Intel network adapters.', os: 'windows', folder: 'Driver', subfolder: 'Network', size: '45 MB', version: 'v28.2' },
  { id: 'realtek-pcie-win', title: 'Realtek PCIe GBE Family Controller Driver', desc: 'Network drivers for Realtek Gigabit Ethernet.', os: 'windows', folder: 'Driver', subfolder: 'Network', size: '10 MB', version: 'v10.63' },
  { id: 'tplink-wifi-win', title: 'TP-Link Wireless Adapter Driver', desc: 'Wi-Fi extension drivers for TP-Link hardware.', os: 'windows', folder: 'Driver', subfolder: 'Network', size: '45 MB', version: 'v1.0' },
  { id: 'nodejs-win', title: 'Node.js', desc: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine.', os: 'windows', folder: 'Tools', size: '30 MB', version: 'v20.17' },
  { id: 'nodejs-mac', title: 'Node.js (Mac)', desc: 'JavaScript runtime built on Chrome\'s V8 JavaScript engine.', os: 'mac', folder: 'Tools', size: '45 MB', version: 'v20.17' },
  { id: 'python-win', title: 'Python', desc: 'Powerful and fast programming language.', os: 'windows', folder: 'Tools', size: '25 MB', version: 'v3.12' },
  { id: 'python-mac', title: 'Python (Mac)', desc: 'Powerful and fast programming language.', os: 'mac', folder: 'Tools', size: '40 MB', version: 'v3.12' },
  { id: 'anydesk-win', title: 'AnyDesk', desc: 'Fast and secure remote desktop application.', os: 'windows', folder: 'Tools', size: '4 MB', version: 'Latest', url: 'https://anydesk.com/en/downloads/thank-you?dv=win_exe' },
  { id: 'anydesk-mac', title: 'AnyDesk (Mac)', desc: 'Fast and secure remote desktop application.', os: 'mac', folder: 'Tools', size: '15 MB', version: 'Latest' },
  { id: 'teamviewer-win', title: 'TeamViewer', desc: 'Remote control, desktop sharing, and file transfer.', os: 'windows', folder: 'Tools', size: '45 MB', version: 'Latest' },
  { id: 'teamviewer-mac', title: 'TeamViewer (Mac)', desc: 'Remote control, desktop sharing, and file transfer.', os: 'mac', folder: 'Tools', size: '80 MB', version: 'Latest' },
  { id: 'winrar', title: 'WinRAR', desc: 'Powerful archive manager and data compression tool.', os: 'windows', folder: 'Tools', size: '3 MB', version: 'v6.21', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/WinRAR.6.21.rar' },
  { id: 'notepadpp', title: 'Notepad++', desc: 'Free source code editor and Notepad replacement.', os: 'windows', folder: 'Tools', size: '4 MB', version: 'v8.9.3', url: 'https://github.com/notepad-plus-plus/notepad-plus-plus/releases/download/v8.9.3/npp.8.9.3.Installer.x64.exe' },
  { id: 'keka', title: 'Keka', desc: 'The macOS file archiver.', os: 'mac', folder: 'Tools', size: '25 MB', version: 'v1.3.4' },
  { id: 'raycast', title: 'Raycast', desc: 'Blazingly fast, totally extendable launcher for macOS.', os: 'mac', folder: 'Tools', size: '35 MB', version: 'Latest' },
  { id: 'filezilla-win', title: 'FileZilla Client', desc: 'Fast and reliable cross-platform FTP, FTPS and SFTP client.', os: 'windows', folder: 'Tools', size: '12 MB', version: 'Latest' },
  { id: 'filezilla-mac', title: 'FileZilla Client (Mac)', desc: 'Fast and reliable cross-platform FTP, FTPS and SFTP client.', os: 'mac', folder: 'Tools', size: '15 MB', version: 'Latest' },
  { id: 'vuescan', title: 'VueScan Pro', desc: 'Powerful scanning software compatible with thousands of scanners.', os: 'windows', folder: 'Driver', subfolder: 'Scanner Driver', size: '18 MB', version: 'v9.8.27', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/VueScan_Pro-9.8.27.rar', isNew: true },


  // === DOWNLOAD ===
  { id: 'idm', title: 'Internet Download Manager', desc: 'Accelerate downloads by up to 5 times, schedule, and resume broken downloads.', os: 'windows', folder: 'Download', size: '12 MB', version: 'v6.42.6.3', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/Internet.Download.Manager.6.42.63.0.zip' },
  { id: 'idm-reset', title: 'IDM Trial Reset & Activation', desc: 'A safe and efficient script to reset the Internet Download Manager trial or activate it permanently.', os: 'windows', folder: 'Download', size: '1 KB', version: 'v1.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/IDM_Activation.cmd', isNew: true },
  { id: 'utorrent', title: 'uTorrent Pro', desc: 'A very popular BitTorrent client for Windows.', os: 'windows', folder: 'Download', size: '5 MB', version: 'v3.6', url: 'https://www.utorrent.com/web/downloads/complete/track/stable/os/win/' },
  { id: 'qbittorrent', title: 'qBittorrent', desc: 'Free and open-source BitTorrent client.', os: 'windows', folder: 'Download', size: '30 MB', version: 'v4.6', url: 'https://www.qbittorrent.org/download' },
  { id: 'freetube', title: 'FreeTube', desc: 'Private YouTube client for Windows and Mac.', os: 'windows', folder: 'Download', size: '80 MB', version: 'v1.10' },

  // === MEDIA ===
  { id: 'vlc-win', title: 'VLC Media Player', desc: 'The best multi-format media player.', os: 'windows', folder: 'Media', subfolder: 'Video Player', size: '42 MB', version: 'v3.0.23', url: 'https://get.videolan.org/vlc/3.0.23/win64/vlc-3.0.23-win64.exe' },
  { id: 'potplayer', title: 'PotPlayer', desc: 'Powerful and feature-rich media player for Windows.', os: 'windows', folder: 'Media', subfolder: 'Video Player', size: '35 MB', version: 'Latest', url: 'https://t1.daumcdn.net/potplayer/PotPlayer/Version/Latest/PotPlayerSetup64.exe' },
  { id: 'kmplayer', title: 'KMPlayer', desc: 'Versatile media player which can cover various types of contained formats.', os: 'windows', folder: 'Media', subfolder: 'Video Player', size: '48 MB', version: 'v4.2.3.33', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/KMPlayer_4.2.3.33.exe' },
  { id: 'klite-win', title: 'K-Lite Codec Pack Full', desc: 'A collection of audio and video codecs for Microsoft Windows that enables the operating system and its software to play various audio and video formats.', os: 'windows', folder: 'Media', subfolder: 'Video Player', size: '60 MB', version: 'v19.6.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/K-Lite_Codec_Pack_1960_Full.exe' },
  { id: 'obs-win', title: 'OBS Studio', desc: 'Free and open source software for video recording and live streaming.', os: 'windows', folder: 'Media', subfolder: 'Video Editor', size: '120 MB', version: 'v32.1.0', url: 'https://cdn-fastly.obsproject.com/downloads/OBS-Studio-32.1.0-Windows-x64-Installer.exe' },
  { id: 'streamlabs-win', title: 'Streamlabs Desktop', desc: 'Live streaming software that simplifies the process of going live on Twitch, YouTube, or Facebook.', os: 'windows', folder: 'Media', subfolder: 'Video Editor', size: '250 MB', version: 'Latest', url: 'https://streamlabs.com/streamlabs-desktop/download?sdb=0' },
  { id: 'bandicam', title: 'Bandicam', desc: 'Lightweight screen recording software for Windows.', os: 'windows', folder: 'Media', subfolder: 'Video Editor', size: '30 MB', version: 'v6.1.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/Bandicam.6.1.0.2044.x64.Repack.rar' },
  { id: 'zdsoft', title: 'ZD Soft Screen Recorder', desc: 'High-performance screen recording software.', os: 'windows', folder: 'Media', subfolder: 'Video Editor', size: '15 MB', version: 'v11.6.0', url: 'https://pub-5961bc36cb774286a50691aa994b2653.r2.dev/ZD.Soft.Screen.Recorder.11.6.0.rar' },
  { id: 'handbrake-win', title: 'Handbrake', desc: 'Open-source video transcoder.', os: 'windows', folder: 'Media', subfolder: 'Video Editor', size: '25 MB', version: 'v1.7' },
  { id: 'vlc-mac-media', title: 'VLC Media Player (Mac)', desc: 'Optimized for macOS.', os: 'mac', folder: 'Media', subfolder: 'Video Player', size: '55 MB', version: 'v3.0.18' },
  { id: 'obs-mac', title: 'OBS Studio (Mac)', desc: 'Pro video recording for Mac.', os: 'mac', folder: 'Media', subfolder: 'Video Editor', size: '130 MB', version: 'v30.0' },
];

const windowsFolders = [
  'Windows',
  'Windows Server',
  'Office',
  'Visual Studio',
  'Software',
  'Tools',
  'Download',
  'Media',
  'Driver'
];

const macFolders = [
  'Mac OS',
  'Office',
  'Visual Studio',
  'Software',
  'Tools',
  'Download',
  'Media',
  'Driver'
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
  const { t } = useLanguage();
  const [activeOS, setActiveOS] = useState('windows');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentSubfolder, setCurrentSubfolder] = useState(null);
  const [currentTypeFolder, setCurrentTypeFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isGuest = !authLoading && (!user || user.isAnonymous);

  // Folder Icon color - Bright Orange
  const folderColor = '#e88f15';
  const folderBg = '#fdf4e7'; // light orange for the background of the icon

  const currentFoldersList = activeOS === 'windows' ? windowsFolders : macFolders;
  
  const filteredSoftware = softwareData.filter(item => {
    // If searching, ignore folders and show all matches by OS
    if (searchTerm.trim()) {
      if (item.os !== activeOS) return false;
      const term = searchTerm.toLowerCase();
      return (item.title && item.title.toLowerCase().includes(term)) || 
             (item.desc && item.desc.toLowerCase().includes(term));
    }

    if (item.os !== activeOS) return false;
    if (item.folder !== currentFolder) return false;
    if (currentSubfolder && item.subfolder !== currentSubfolder) return false;
    if (currentTypeFolder) {
      if (currentFolder === 'Office' && item.version !== currentTypeFolder) return false;
      if (currentFolder === 'Driver' && item.brand !== currentTypeFolder) return false;
    }
    if (!currentSubfolder && item.folder === 'Office' && item.subfolder) return false;
    return true;
  });

  const availableSubfolders = currentFolder
    ? Array.from(new Set(
        softwareData
          .filter(item => item.os === activeOS && item.folder === currentFolder && item.subfolder)
          .map(item => item.subfolder)
      ))
    : [];

  const availableTypes = currentFolder === 'Office' && currentSubfolder
    ? Array.from(new Set(
        softwareData
          .filter(item => item.os === activeOS && item.folder === 'Office' && item.subfolder === currentSubfolder && item.version && ['Retail', 'VL'].includes(item.version))
          .map(item => item.version)
      ))
    : currentFolder === 'Driver' && currentSubfolder === 'Printer Driver'
    ? Array.from(new Set(
        softwareData
          .filter(item => item.os === activeOS && item.folder === 'Driver' && item.subfolder === 'Printer Driver' && item.brand)
          .map(item => item.brand)
      ))
    : [];

  return (
    <div className="container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '100px' }}>
      
      {!currentFolder ? (
        <>
          <header style={{ marginBottom: '60px', textAlign: 'center' }}>
            <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{t('software_repository_title')}</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '1.15rem', lineHeight: 1.6 }}>
              {t('software_repository_desc')}
            </p>

            {/* OS Filter & Search Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '60px' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', width: '100%', alignItems: 'center' }}>
                
                {/* OS Switcher */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '6px', 
                  borderRadius: '18px', 
                  display: 'flex', 
                  gap: '4px', 
                  border: '1px solid var(--surface-border)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                  <button 
                    onClick={() => { setActiveOS('windows'); setCurrentFolder(null); setCurrentSubfolder(null); setCurrentTypeFolder(null); setSearchTerm(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit',
                      background: activeOS === 'windows' ? 'var(--primary)' : 'transparent',
                      color: activeOS === 'windows' ? '#fff' : 'var(--text-muted)',
                      transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: activeOS === 'windows' ? '0 8px 20px rgba(37, 99, 235, 0.25)' : 'none'
                    }}
                  >
                    <Monitor size={20} /> {t('windows')}
                  </button>
                  <button 
                    onClick={() => { setActiveOS('mac'); setCurrentFolder(null); setCurrentSubfolder(null); setCurrentTypeFolder(null); setSearchTerm(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 28px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 800, fontFamily: 'inherit',
                      background: activeOS === 'mac' ? 'var(--secondary)' : 'transparent',
                      color: activeOS === 'mac' ? '#fff' : 'var(--text-muted)',
                      transition: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: activeOS === 'mac' ? '0 8px 20px rgba(168, 85, 247, 0.25)' : 'none'
                    }}
                  >
                    <Apple size={20} /> {t('macos')}
                  </button>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
                  <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    placeholder={t('search_software')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px 20px 16px 56px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--surface-border)',
                      color: 'var(--text-main)',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: '0.3s',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'var(--surface-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                  />
                </div>
              </div>
            </div>
          </header>

          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {searchTerm.trim() ? (
              <div className="card-grid">
                {filteredSoftware.map(software => (
                  <div key={software.id} className="card glass-panel luxury-card" style={{ padding: '32px', borderRadius: '28px' }}>
                    {software.isNew && <div className="new-badge">{t('new')}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div className="icon-box">
                        {(software.title.toLowerCase().includes('iso') || (software.url && software.url.toLowerCase().includes('.iso'))) ? (
                          <ModernIsoIcon size={44} />
                        ) : (
                          <SoftwareIcon id={software.id} os={software.os} size={48} />
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span className="version-tag">{software.version}</span>
                        <span className="folder-tag">{software.folder}</span>
                      </div>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <Link to={`/software/${software.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className="software-title-link">{software.title}</h3>
                      </Link>
                      <p className="software-desc-text">{software.desc}</p>
                    </div>
                    <div className="card-footer-modern">
                      <span className="size-text">{software.size}</span>
                      <Link to={`/software/${software.id}`} className="details-btn">
                        <Eye size={18} /> {t('details')}
                      </Link>
                    </div>
                  </div>
                ))}
                {filteredSoftware.length === 0 && (
                  <div className="glass-panel empty-state">
                    <Ghost size={64} style={{ opacity: 0.2 }} />
                    <h2>{t('no_matches_found')}</h2>
                    <p>{t('search_no_match')} "{searchTerm}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="folder-grid-modern">
                {currentFoldersList.map((folderName) => (
                  <div 
                    key={folderName} 
                    onClick={() => setCurrentFolder(folderName)}
                    className="folder-item-modern"
                  >
                    <div className="folder-icon-wrapper">
                      <ModernFolderIcon size={48} folderName={folderName} />
                    </div>
                    <div className="folder-text-content">
                      <span className="folder-title-modern">
                        {t(folderName.toLowerCase().replace(' ', '_'))}
                      </span>
                      <span className="folder-subtitle-modern">
                        {softwareData.filter(s => s.os === activeOS && s.folder === folderName).length} Resources
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : currentFolder && !currentSubfolder && availableSubfolders.length > 0 ? (
        <>
          <div style={{ marginBottom: '40px', maxWidth: '1100px', margin: '0 auto 40px auto' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
              <button 
                onClick={() => { setCurrentFolder(null); setCurrentSubfolder(null); setCurrentTypeFolder(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
              >
                {t('repository')}
              </button>
              <ChevronRight size={14} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{t(currentFolder.toLowerCase().replace(' ', '_'))}</span>
            </nav>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '12px', borderRadius: '16px', background: 'var(--surface-badge)', color: 'var(--primary)' }}>
                <ModernFolderIcon size={42} folderName={currentFolder} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-animated-cyber" style={{ margin: 0, fontSize: '2rem' }}>{currentFolder}</h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '2px' }}>
                  {activeOS === 'windows' ? t('win_repo_desc') : t('mac_repo_desc')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              
              {availableSubfolders.map((folderName) => (
                <div 
                  key={folderName}
                  onClick={() => setCurrentSubfolder(folderName)}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--surface-border)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glass)';
                  }}
                >
                  <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'var(--card-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                    <ModernFolderIcon size={32} folderName={folderName} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{t(folderName.toLowerCase().replace(' ', '_'))}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('folder')}</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                </div>
              ))}

              {softwareData
                .filter(item => item.os === activeOS && item.folder === currentFolder && !item.subfolder)
                .map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => navigate(`/software/${item.id}`)}
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.borderColor = 'var(--primary)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'var(--surface-border)';
                    }}
                  >
                    <div style={{ background: 'var(--card-dark)', padding: '16px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      <SoftwareIcon id={item.id} os={item.os} size={48} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <a 
                        href={item.downloadUrl || item.url || `https://files.kichhoat24h.com/download/${encodeURIComponent(item.folder)}/${encodeURIComponent(item.title)}`}
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => { 
                          e.stopPropagation();
                          if (authLoading) { e.preventDefault(); return; }
                          if (isGuest) { e.preventDefault(); navigate('/login'); } 
                        }}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <span 
                          style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.target.style.color = 'var(--primary)'}
                          onMouseOut={(e) => e.target.style.color = 'inherit'}
                        >
                          {item.title}
                        </span>
                      </a>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'var(--surface-badge)', padding: '2px 8px', borderRadius: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                          {item.version || 'Latest'}
                        </span>
                        {item.size && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {item.size}</span>}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </>
      ) : (currentFolder === 'Office' || currentFolder === 'Driver') && currentSubfolder && !currentTypeFolder && availableTypes.length > 0 ? (
        <>
          <div style={{ marginBottom: '40px', maxWidth: '1000px', margin: '0 auto 40px auto' }}>
            <button 
              onClick={() => setCurrentSubfolder(null)}
              className="btn btn-outline"
              style={{ padding: '8px 16px', marginBottom: '24px' }}
            >
              <ArrowLeft size={16} /> {t('back_to')} {t('folder')} {t(currentFolder.toLowerCase().replace(' ', '_'))}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ModernFolderIcon size={36} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-animated-cyber" style={{ margin: 0, lineHeight: 1 }}>
                  {(currentFolder === 'Office' || currentFolder === 'Driver') ? `${currentFolder} ` : ''}
                  {t(currentSubfolder.toLowerCase().replace(' ', '_'))}
                </h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {activeOS === 'windows' ? 'Windows OS' : 'macOS'} Apps in {currentFolder}
                </span>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
              
              {availableTypes.map((folderName) => (
                <div 
                  key={folderName}
                  onClick={() => setCurrentTypeFolder(folderName)}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '16px',
                    padding: '32px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'var(--surface-border)';
                  }}
                >
                  <div style={{ 
                    width: '64px', height: '64px', borderRadius: '16px', 
                    background: 'var(--card-dark)', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', border: '1px solid var(--surface-border)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <ModernFolderIcon size={40} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '0.3px' }}>
                      {folderName}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t('folder')}
                    </span>
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
              <ArrowLeft size={16} /> {currentTypeFolder ? `${t('back_to')} ${t('folder')} ${t(currentSubfolder.toLowerCase().replace(' ', '_'))}` : (currentSubfolder ? `${t('back_to')} ${t('folder')} ${t(currentFolder.toLowerCase().replace(' ', '_'))}` : t('back_to_folders'))}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ModernFolderIcon size={36} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="text-animated-cyber" style={{ margin: 0, lineHeight: 1 }}>
                  {currentTypeFolder ? `${currentTypeFolder} (${t(currentSubfolder.toLowerCase().replace(' ', '_'))})` : (currentSubfolder ? ((currentFolder === 'Office' || currentFolder === 'Driver') ? `${currentFolder} ${t(currentSubfolder.toLowerCase().replace(' ', '_'))}` : t(currentSubfolder.toLowerCase().replace(' ', '_'))) : currentFolder)}
                </h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  {activeOS === 'windows' ? t('win_repo_desc') : t('mac_repo_desc')}
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
                      {(software.title.toLowerCase().includes('iso') || (software.url && software.url.toLowerCase().includes('.iso'))) 
                        ? <ModernIsoIcon /> 
                        : <SoftwareIcon id={software.id} os={software.os} size={32} />}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <a 
                          href={software.url || `https://files.kichhoat24h.com/download/${encodeURIComponent(software.folder)}/${encodeURIComponent(software.title)}`}
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => { 
                            if (authLoading) return;
                            if (isGuest) { e.preventDefault(); navigate('/login'); } 
                          }}
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
                        onClick={(e) => { 
                          if (authLoading) return;
                          if (isGuest) { e.preventDefault(); navigate('/login'); } 
                        }}
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
                    <div style={{ background: 'rgba(69, 243, 255, 0.1)', padding: '12px', borderRadius: '16px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {(software.title.toLowerCase().includes('iso') || (software.url && software.url.toLowerCase().includes('.iso'))) ? (
                        <ModernIsoIcon size={32} />
                      ) : (
                        <SoftwareIcon id={software.id} os={software.os} size={36} />
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      {software.isNew && <span style={{ background: 'var(--secondary)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase' }}>NEW</span>}
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
                    onClick={(e) => { 
                      if (authLoading) return;
                      if (isGuest) { e.preventDefault(); navigate('/login'); } 
                    }}
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
                    <Link 
                      to={isGuest ? '#' : `/software/${software.id}`} 
                      onClick={(e) => { 
                        if (authLoading) return;
                        if (isGuest) { e.preventDefault(); navigate('/login'); } 
                      }} 
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--primary)' }}
                    >
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
