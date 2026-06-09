import React from 'react';
import './SideDecorations.css';

const SideDecorations = () => {
  return (
    <div className="side-decorations-container">
      {/* LEFT SIDE DECORATION (Cyber Mascot Bot) */}
      <div className="side-decor-left">
        <svg 
          width="150" 
          height="320" 
          viewBox="0 0 150 320" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="leftBotGrad" x1="20" y1="60" x2="130" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="50%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="neonGlowGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="40" y1="80" x2="110" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
            </linearGradient>
            <filter id="neonFilter" x="-10" y="-10" width="170" height="340" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing Aura */}
          <circle cx="75" cy="140" r="55" fill="url(#neonGlowGrad)" filter="url(#neonFilter)" />

          {/* Floating Aux Elements (Binary & Code brackets) */}
          <g className="float-item-1" transform="translate(10, 40)">
            <rect width="28" height="28" rx="8" fill="rgba(99, 102, 241, 0.1)" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1.5" />
            <text x="14" y="19" fill="#818CF8" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">{"{"}</text>
          </g>

          <g className="float-item-2" transform="translate(115, 80)">
            <circle r="14" cx="14" cy="14" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1.5" />
            <text x="14" y="19" fill="#C084FC" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">JS</text>
          </g>

          <g className="float-item-3" transform="translate(15, 230)">
            <rect width="24" height="24" rx="6" fill="rgba(6, 182, 212, 0.1)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
            <text x="12" y="17" fill="#22D3EE" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="monospace">&lt;&gt;</text>
          </g>

          {/* MAIN MASCOT - FLOATING CYBER BOT */}
          <g className="mascot-float-group">
            {/* Robot Hover Shadow */}
            <ellipse cx="75" cy="235" rx="28" ry="6" fill="rgba(0, 0, 0, 0.25)" />

            {/* Arms */}
            <rect x="22" y="135" width="10" height="36" rx="5" fill="#312E81" stroke="#4F46E5" strokeWidth="1.5" transform="rotate(-15 22 135)" />
            <rect x="118" y="135" width="10" height="36" rx="5" fill="#312E81" stroke="#4F46E5" strokeWidth="1.5" transform="rotate(15 118 135)" />

            {/* Neck Connection */}
            <rect x="68" y="152" width="14" height="12" rx="3" fill="#4F46E5" />

            {/* Main Body */}
            <rect x="38" y="158" width="74" height="66" rx="22" fill="url(#leftBotGrad)" stroke="#6366F1" strokeWidth="2" />
            {/* Glowing Core on Body */}
            <circle cx="75" cy="191" r="14" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1.5" />
            <circle cx="75" cy="191" r="7" fill="#22D3EE" className="glow-pulse" />

            {/* Head */}
            <rect x="42" y="86" width="66" height="70" rx="26" fill="url(#leftBotGrad)" stroke="#6366F1" strokeWidth="2" />
            {/* Head Ears/Antennas */}
            <circle cx="38" cy="121" r="7" fill="#4F46E5" />
            <circle cx="112" cy="121" r="7" fill="#4F46E5" />
            {/* Antenna Top */}
            <line x1="75" y1="86" x2="75" y2="70" stroke="#6366F1" strokeWidth="3" />
            <circle cx="75" cy="67" r="5" fill="#22D3EE" />

            {/* Screen Face */}
            <rect x="49" y="96" width="52" height="42" rx="14" fill="#0B0F19" stroke="#4F46E5" strokeWidth="1.5" />
            {/* Neon Blinking Eyes */}
            <g className="glow-pulse">
              {/* Left Eye: < */}
              <text x="61" y="122" fill="#22D3EE" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace">&lt;</text>
              {/* Right Eye: > */}
              <text x="89" y="122" fill="#22D3EE" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="monospace">&gt;</text>
            </g>

            {/* Glass Reflection Highlight */}
            <path d="M44 115 C 44 95, 60 90, 80 90" stroke="rgba(255,255,255,0.18)" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {/* RIGHT SIDE DECORATION (Digital Cloud Core / Server stack) */}
      <div className="side-decor-right">
        <svg 
          width="150" 
          height="320" 
          viewBox="0 0 150 320" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="rightCoreGrad" x1="20" y1="60" x2="130" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="50%" stopColor="#BE123C" />
              <stop offset="100%" stopColor="#4C0519" />
            </linearGradient>
            <linearGradient id="neonGlowGradRight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#BE123C" stopOpacity="0" />
            </linearGradient>
            <filter id="glowFilterRight" x="-10" y="-10" width="170" height="340" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing Aura */}
          <circle cx="75" cy="140" r="55" fill="url(#neonGlowGradRight)" filter="url(#glowFilterRight)" />

          {/* Floating Aux Elements (Cloud, Key, Download arrow) */}
          <g className="float-item-1" transform="translate(105, 50)">
            <rect width="26" height="26" rx="8" fill="rgba(244, 63, 94, 0.1)" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="1.5" />
            <text x="13" y="18" fill="#F43F5E" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">⌘</text>
          </g>

          <g className="float-item-2" transform="translate(15, 90)">
            <circle r="14" cx="14" cy="14" fill="rgba(234, 179, 8, 0.1)" stroke="rgba(234, 179, 8, 0.3)" strokeWidth="1.5" />
            <text x="14" y="19" fill="#FACC15" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">★</text>
          </g>

          <g className="float-item-3" transform="translate(110, 220)">
            <rect width="24" height="24" rx="6" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1.5" />
            <text x="12" y="17" fill="#10B981" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="monospace">↓</text>
          </g>

          {/* MAIN MASCOT - CYBER CLOUD SERVER CORE */}
          <g className="mascot-float-group">
            {/* Base Floating Platform Shadow */}
            <ellipse cx="75" cy="235" rx="36" ry="7" fill="rgba(0, 0, 0, 0.25)" />

            {/* Platform Base */}
            <path d="M35 210 L75 224 L115 210 L75 196 Z" fill="#4C0519" stroke="#F43F5E" strokeWidth="2" />
            <path d="M35 210 L35 218 L75 232 L115 218 L115 210 L75 224 Z" fill="#881337" stroke="#F43F5E" strokeWidth="2" />
            <line x1="75" y1="224" x2="75" y2="232" stroke="#F43F5E" strokeWidth="2" />

            {/* Floating Server Layer 1 (Bottom) */}
            <path d="M42 176 L75 188 L108 176 L75 164 Z" fill="url(#rightCoreGrad)" stroke="#F43F5E" strokeWidth="1.5" />
            <path d="M42 176 L42 183 L75 195 L108 183 L108 176 L75 188 Z" fill="#881337" stroke="#F43F5E" strokeWidth="1.5" />
            {/* Server Neon lights */}
            <circle cx="58" cy="183" r="1.5" fill="#10B981" />
            <circle cx="75" cy="189" r="1.5" fill="#38BDF8" className="glow-pulse" />
            <circle cx="92" cy="183" r="1.5" fill="#FACC15" />

            {/* Floating Server Layer 2 (Middle) */}
            <path d="M42 144 L75 156 L108 144 L75 132 Z" fill="url(#rightCoreGrad)" stroke="#F43F5E" strokeWidth="1.5" />
            <path d="M42 144 L42 151 L75 163 L108 151 L108 144 L75 156 Z" fill="#881337" stroke="#F43F5E" strokeWidth="1.5" />
            <circle cx="58" cy="151" r="1.5" fill="#10B981" />
            <circle cx="75" cy="157" r="1.5" fill="#38BDF8" className="glow-pulse" />
            <circle cx="92" cy="151" r="1.5" fill="#FACC15" />

            {/* Floating Server Layer 3 (Top) */}
            <path d="M42 112 L75 124 L108 112 L75 100 Z" fill="url(#rightCoreGrad)" stroke="#F43F5E" strokeWidth="1.5" />
            <path d="M42 112 L42 119 L75 131 L108 119 L108 112 L75 124 Z" fill="#881337" stroke="#F43F5E" strokeWidth="1.5" />
            <circle cx="58" cy="119" r="1.5" fill="#10B981" />
            <circle cx="75" cy="125" r="1.5" fill="#38BDF8" className="glow-pulse" />
            <circle cx="92" cy="119" r="1.5" fill="#FACC15" />

            {/* Top Holographic Crystal */}
            <g className="glow-pulse">
              <path d="M75 66 L86 78 L75 90 L64 78 Z" fill="rgba(34, 211, 238, 0.4)" stroke="#22D3EE" strokeWidth="1.5" />
              <path d="M75 52 L75 66 L64 78 Z" fill="rgba(34, 211, 238, 0.2)" stroke="#22D3EE" strokeWidth="1" />
              <path d="M75 52 L75 66 L86 78 Z" fill="rgba(34, 211, 238, 0.6)" stroke="#22D3EE" strokeWidth="1" />
            </g>

            {/* Energy Stream Connecting Server Layers */}
            <line x1="75" y1="100" x2="75" y2="196" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 3" className="glow-pulse" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default SideDecorations;
