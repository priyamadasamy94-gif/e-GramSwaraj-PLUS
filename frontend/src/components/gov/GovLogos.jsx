import React from 'react';

/**
 * State Emblem of India (Ashoka Lion Capital with Satyameva Jayate)
 * Official National Symbol of the Republic of India
 */
export function AshokaLionCapital({ className = "h-12 w-auto", light = false }) {
  const color = light ? "#ffffff" : "#1c3d76";
  const gold = light ? "#f7d070" : "#b45309";
  
  return (
    <svg viewBox="0 0 100 135" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="State Emblem of India">
      <title>State Emblem of India - Satyameva Jayate</title>
      <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Central Lion Head & Mane */}
        <path d="M 40 18 C 40 10, 60 10, 60 18 C 65 14, 72 20, 68 28 C 75 32, 70 42, 65 44 C 67 52, 60 56, 50 56 C 40 56, 33 52, 35 44 C 30 42, 25 32, 32 28 C 28 20, 35 14, 40 18 Z" fill={color} fillOpacity={light ? "0.15" : "0.08"} />
        <circle cx="45" cy="28" r="2" fill={color} />
        <circle cx="55" cy="28" r="2" fill={color} />
        <path d="M 48 34 L 52 34 L 50 37 Z" fill={color} />
        <path d="M 46 40 Q 50 44 54 40" stroke={color} strokeWidth="2.5" />
        <path d="M 43 23 Q 46 20 49 23" />
        <path d="M 51 23 Q 54 20 57 23" />

        {/* Left Profile Lion */}
        <path d="M 32 28 C 24 24, 18 32, 22 40 C 16 46, 22 56, 30 56 C 33 60, 38 62, 42 62" strokeWidth="2" fill={color} fillOpacity={light ? "0.12" : "0.05"} />
        <circle cx="24" cy="36" r="1.5" fill={color} />

        {/* Right Profile Lion */}
        <path d="M 68 28 C 76 24, 82 32, 78 40 C 84 46, 78 56, 70 56 C 67 60, 62 62, 58 62" strokeWidth="2" fill={color} fillOpacity={light ? "0.12" : "0.05"} />
        <circle cx="76" cy="36" r="1.5" fill={color} />

        {/* Lions' Paws & Chest */}
        <path d="M 36 54 L 36 76 Q 36 82 42 82 L 44 82 L 44 56" fill={color} fillOpacity="0.15" />
        <path d="M 64 54 L 64 76 Q 64 82 58 82 L 56 82 L 56 56" fill={color} fillOpacity="0.15" />
        <path d="M 47 56 L 47 80 L 53 80 L 53 56" strokeWidth="1.5" />

        {/* Abacus Platform */}
        <rect x="15" y="82" width="70" height="14" rx="2" fill={color} fillOpacity={light ? "0.2" : "0.12"} strokeWidth="2.5" />
        
        {/* Central Ashoka Chakra on Abacus */}
        <circle cx="50" cy="89" r="6" stroke="#1c3d76" strokeWidth="1.5" fill="#ffffff" />
        <circle cx="50" cy="89" r="1.5" fill="#1c3d76" />
        {/* 8 representative spoke marks */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="89"
            x2={50 + 5 * Math.cos((deg * Math.PI) / 180)}
            y2={89 + 5 * Math.sin((deg * Math.PI) / 180)}
            stroke="#1c3d76"
            strokeWidth="0.8"
          />
        ))}

        {/* Bull on Left of Abacus */}
        <path d="M 22 92 Q 25 86 31 87 Q 34 91 30 94 Z" strokeWidth="1.2" fill={color} fillOpacity="0.4" />
        {/* Galloping Horse on Right of Abacus */}
        <path d="M 78 92 Q 75 86 69 87 Q 66 91 70 94 Z" strokeWidth="1.2" fill={color} fillOpacity="0.4" />

        {/* Bell-shaped Inverted Lotus Base */}
        <path d="M 20 96 C 24 104, 34 108, 50 108 C 66 108, 76 104, 80 96" strokeWidth="2" fill="none" />
        <path d="M 28 96 Q 50 114 72 96" strokeWidth="1.5" />
        <path d="M 38 96 Q 50 110 62 96" strokeWidth="1" />
      </g>

      {/* Devanagari Inscription: सत्यमेव जयते (Satyameva Jayate) */}
      <text
        x="50"
        y="126"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="bold"
        fontFamily="'Noto Sans Devanagari', 'Segoe UI', serif"
        fill={color}
        letterSpacing="0.8"
      >
        सत्यमेव जयते
      </text>
    </svg>
  );
}

/**
 * 24-spoke Ashoka Chakra (Dharma Chakra)
 */
export function AshokaChakra({ className = "h-8 w-8", strokeColor = "#000080" }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ashoka Chakra">
      <circle cx="50" cy="50" r="46" stroke={strokeColor} strokeWidth="4" fill="none" />
      <circle cx="50" cy="50" r="8" fill={strokeColor} />
      <circle cx="50" cy="50" r="4" fill="#ffffff" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="50"
          x2={50 + 44 * Math.cos((deg * Math.PI) / 180)}
          y2={50 + 44 * Math.sin((deg * Math.PI) / 180)}
          stroke={strokeColor}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

/**
 * Digital India Vector Logo
 */
export function DigitalIndiaLogo({ className = "h-9 w-auto" }) {
  return (
    <svg viewBox="0 0 160 50" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Digital India">
      <defs>
        <linearGradient id="diGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f28c28" />
          <stop offset="50%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#138808" />
        </linearGradient>
      </defs>
      {/* Dynamic Digital India Wings / Star emblem */}
      <g transform="translate(4, 5)">
        <polygon points="20,0 28,15 22,22 14,8" fill="#f28c28" />
        <polygon points="28,15 42,16 31,25 35,40" fill="#2563eb" />
        <polygon points="31,25 22,38 18,26 8,24" fill="#138808" />
        <polygon points="8,24 16,14 22,22 18,26" fill="#0284c7" />
        <circle cx="22" cy="22" r="3.5" fill="#facc15" />
      </g>
      <text x="52" y="24" fontFamily="'Noto Sans', system-ui, sans-serif" fontWeight="800" fontSize="18" fill="#1e3a8a" letterSpacing="-0.5">
        Digital <tspan fill="#f28c28">India</tspan>
      </text>
      <text x="53" y="38" fontFamily="'Noto Sans', system-ui, sans-serif" fontWeight="600" fontSize="8.5" fill="#475569" letterSpacing="0.8">
        Power To Empower
      </text>
    </svg>
  );
}

/**
 * National Informatics Centre (NIC) Logo
 */
export function NICLogo({ className = "h-8 w-auto", light = false }) {
  const textCol = light ? "#ffffff" : "#0f2142";
  const subCol = light ? "#94a3b8" : "#64748b";
  return (
    <svg viewBox="0 0 140 44" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="National Informatics Centre">
      <g transform="translate(2, 6)">
        {/* Tricolor Tech Node Emblem */}
        <rect x="2" y="2" width="28" height="28" rx="6" fill="#1e3a8a" />
        <path d="M 6 10 L 26 10" stroke="#f28c28" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 6 16 L 20 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        <path d="M 6 22 L 26 22" stroke="#138808" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="21" cy="16" r="2.5" fill="#facc15" />
      </g>
      <text x="38" y="20" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="15" fill={textCol} letterSpacing="0.5">
        NIC
      </text>
      <text x="38" y="32" fontFamily="system-ui, sans-serif" fontWeight="600" fontSize="6.8" fill={subCol} letterSpacing="0.2">
        National Informatics Centre
      </text>
    </svg>
  );
}

/**
 * Swachh Bharat Abhiyan Logo (Mahatma Gandhi Spectacles)
 */
export function SwachhBharatLogo({ className = "h-8 w-auto" }) {
  return (
    <svg viewBox="0 0 100 40" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Swachh Bharat">
      {/* Glasses Frames */}
      <circle cx="30" cy="18" r="13" stroke="#138808" strokeWidth="2.5" fill="#ffffff" />
      <circle cx="70" cy="18" r="13" stroke="#138808" strokeWidth="2.5" fill="#ffffff" />
      <path d="M 43 18 Q 50 14 57 18" stroke="#138808" strokeWidth="2.5" fill="none" />
      <path d="M 17 18 L 8 13" stroke="#138808" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 83 18 L 92 13" stroke="#138808" strokeWidth="2.5" strokeLinecap="round" />
      <text x="30" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f28c28" fontFamily="'Noto Sans Devanagari', serif">
        स्वच्छ
      </text>
      <text x="70" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#138808" fontFamily="'Noto Sans Devanagari', serif">
        भारत
      </text>
      <text x="50" y="37" textAnchor="middle" fontSize="5.5" fontWeight="600" fill="#475569">
        एक कदम स्वच्छता की ओर
      </text>
    </svg>
  );
}

/**
 * Combined Official e-GramSwaraj + Panchayat Raj Crest
 */
export function EGramSwarajBadge({ className = "h-10 w-auto", light = false }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gov-800 to-gov-900 p-1 shadow-md ring-1 ring-white/20">
        <svg viewBox="0 0 48 48" className="h-8 w-8" xmlns="http://www.w3.org/2000/svg">
          {/* Circular Tricolor Ring */}
          <circle cx="24" cy="24" r="21" fill="none" stroke="#f28c28" strokeWidth="2" strokeDasharray="33 66" />
          <circle cx="24" cy="24" r="21" fill="none" stroke="#138808" strokeWidth="2" strokeDasharray="33 66" strokeDashoffset="33" />
          {/* Panchayat Hut & Spire */}
          <path d="M 12 33 L 36 33 L 36 22 L 24 12 L 12 22 Z" fill="#ffffff" />
          <path d="M 10 23 L 24 11 L 38 23" stroke="#f28c28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Ashoka Chakra Center */}
          <circle cx="24" cy="24" r="4.5" fill="none" stroke="#1c3d76" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="1.2" fill="#1c3d76" />
          {/* Pillar Foundation */}
          <rect x="18" y="27" width="12" height="6" fill="#138808" rx="1" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className={`flex items-center gap-1.5 text-base font-extrabold tracking-tight ${light ? 'text-white' : 'text-gov-900'}`}>
          <span>e-GramSwaraj</span>
          <span className="rounded bg-gradient-to-r from-saffron-500 to-amber-500 px-1 py-0.2 text-[11px] font-bold text-white shadow-xs">
            PLUS+
          </span>
        </div>
        <div className={`text-[10px] font-semibold tracking-wide ${light ? 'text-gov-200' : 'text-slate-600'}`}>
          ई-ग्रामस्वराज · पंचायती राज पोर्टल
        </div>
      </div>
    </div>
  );
}
