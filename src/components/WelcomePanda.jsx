import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import './WelcomePanda.css';

const WelcomePanda = () => {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fading out after 14.2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 14200);

    // Completely unmount after 15 seconds (matching CSS fade-out duration)
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 15000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="welcome-panda-wrapper">
      <div className={`welcome-panda-container ${fadeOut ? 'fade-out' : ''}`}>
        
        {/* Speech Bubble */}
        <div className="panda-speech-bubble">
          <span>{lang === 'km' ? 'សួស្តី! 🐼' : 'Hello! 🐼'}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
            {lang === 'km' ? 'សូមស្វាគមន៍មកកាន់ ITShare' : 'Welcome to ITShare!'}
          </span>
        </div>

        {/* Interactive SVG Panda */}
        <div className="panda-graphic-container">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 120 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Panda Body */}
            <path 
              d="M32 94 C32 82, 88 82, 88 94 L80 115 L40 115 Z" 
              fill="#FFFFFF" 
              stroke="#CBD5E1" 
              strokeWidth="2" 
            />
            {/* Scarf / Collar */}
            <rect x="41" y="91" width="38" height="6" rx="3" fill="#6366F1" />
            <rect x="47" y="97" width="6" height="14" rx="2" fill="#4F46E5" />

            {/* Left Static Arm */}
            <path 
              d="M84 94 C92 94, 98 102, 94 110" 
              stroke="#0F172A" 
              strokeWidth="10" 
              strokeLinecap="round" 
            />

            {/* Waving Arm (Animated Group) */}
            <g className="panda-waving-hand">
              <path 
                d="M30 90 C16 80, 12 65, 24 55" 
                stroke="#0F172A" 
                strokeWidth="10" 
                strokeLinecap="round" 
              />
              {/* White paw highlight */}
              <circle cx="22" cy="58" r="3" fill="#FFFFFF" />
            </g>

            {/* Ears */}
            <circle cx="35" cy="28" r="14" fill="#0F172A" />
            <circle cx="85" cy="28" r="14" fill="#0F172A" />
            <circle cx="35" cy="28" r="6" fill="#1E293B" />
            <circle cx="85" cy="28" r="6" fill="#1E293B" />

            {/* Head */}
            <circle cx="60" cy="58" r="36" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />

            {/* Eye Patches */}
            <ellipse cx="44" cy="55" rx="10" ry="12" fill="#0F172A" transform="rotate(-15 44 55)" />
            <ellipse cx="76" cy="55" rx="10" ry="12" fill="#0F172A" transform="rotate(15 76 55)" />

            {/* Blush Cheeks */}
            <ellipse cx="38" cy="70" rx="5" ry="3.5" fill="#FDA4AF" opacity="0.6" />
            <ellipse cx="82" cy="70" rx="5" ry="3.5" fill="#FDA4AF" opacity="0.6" />

            {/* Cool Sunglasses/Glasses (Neon Cyan) */}
            <g>
              {/* Left Lens Frame */}
              <rect x="31" y="45" width="24" height="18" rx="6" stroke="#22D3EE" strokeWidth="3.5" fill="rgba(34, 211, 238, 0.2)" />
              {/* Right Lens Frame */}
              <rect x="65" y="45" width="24" height="18" rx="6" stroke="#22D3EE" strokeWidth="3.5" fill="rgba(34, 211, 238, 0.2)" />
              {/* Glasses Bridge */}
              <line x1="55" y1="54" x2="65" y2="54" stroke="#22D3EE" strokeWidth="3.5" />
              {/* Sunglasses shine reflect */}
              <path d="M35 50 L42 47" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M69 50 L76 47" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Nose */}
            <polygon points="57,66 63,66 60,69" fill="#0F172A" />

            {/* Smiling Mouth */}
            <path 
              d="M55 72 C57 75, 63 75, 65 72" 
              stroke="#0F172A" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
          </svg>
        </div>

      </div>
    </div>
  );
};

export default WelcomePanda;
