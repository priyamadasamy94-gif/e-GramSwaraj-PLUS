import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  {
    id: 'gov-classic',
    name: 'National Tricolor',
    subName: 'Gov Navy & Saffron',
    nativeName: 'राष्ट्रीय तिरंगा',
    description: 'Official Government of India national portal styling in Navy Blue, Saffron and India Green',
    primaryColor: '#1c3d76',
    secondaryColor: '#f28c28',
    previewBadge: 'bg-[#1c3d76] text-white',
    ringColor: 'ring-[#1c3d76]',
    isDark: false,
  },
  {
    id: 'panchayat-green',
    name: 'Panchayat Harit',
    subName: 'Rural Development Green',
    nativeName: 'पंचायत हरित',
    description: 'Earthy agricultural and rural self-governance emerald green theme with golden harvest accents',
    primaryColor: '#15803d',
    secondaryColor: '#ca8a04',
    previewBadge: 'bg-[#15803d] text-white',
    ringColor: 'ring-[#15803d]',
    isDark: false,
  },
  {
    id: 'nic-blue',
    name: 'NIC Royal Azure',
    subName: 'National Informatics Centre',
    nativeName: 'एनआईसी नीला',
    description: 'Crisp royal blue and sky azure standard used across Central Government NIC portals',
    primaryColor: '#1d4ed8',
    secondaryColor: '#0284c7',
    previewBadge: 'bg-[#1d4ed8] text-white',
    ringColor: 'ring-[#1d4ed8]',
    isDark: false,
  },
  {
    id: 'saffron-warm',
    name: 'Viksit Bharat',
    subName: 'Saffron Heritage',
    nativeName: 'विकसित भारत',
    description: 'Dignified warm terracotta saffron and sandstone heritage palette representing cultural pride',
    primaryColor: '#c2410c',
    secondaryColor: '#ea580c',
    previewBadge: 'bg-[#c2410c] text-white',
    ringColor: 'ring-[#c2410c]',
    isDark: false,
  },
  {
    id: 'dark',
    name: 'Ratri / Accessible Dark',
    subName: 'Modern Night Mode',
    nativeName: 'रात्रि / डार्क',
    description: 'Deep slate dark interface designed to reduce glare and eye strain in low-light environments',
    primaryColor: '#3b82f6',
    secondaryColor: '#60a5fa',
    previewBadge: 'bg-[#0f172a] text-white',
    ringColor: 'ring-blue-500',
    isDark: true,
  },
  {
    id: 'high-contrast',
    name: 'GIGW High Contrast',
    subName: 'Black & Gold (Accessibility)',
    nativeName: 'उच्च कंट्रास्ट (GIGW)',
    description: 'Strict Guidelines for Indian Government Websites (GIGW) high contrast mode for visually impaired citizens',
    primaryColor: '#facc15',
    secondaryColor: '#ffffff',
    previewBadge: 'bg-black text-[#facc15]',
    ringColor: 'ring-yellow-400',
    isDark: true,
  },
];

const THEME_KEY = 'egs_theme';
const FONT_SCALE_KEY = 'egs_font_scale';
const HIGH_CONTRAST_KEY = 'egs_high_contrast';

const ThemeContext = createContext({
  theme: 'gov-classic',
  setTheme: () => {},
  fontScale: 'normal',
  setFontScale: () => {},
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  resetFontSize: () => {},
  highContrast: false,
  toggleHighContrast: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'gov-classic';
    } catch {
      return 'gov-classic';
    }
  });

  const [fontScale, setFontScaleState] = useState(() => {
    try {
      return localStorage.getItem(FONT_SCALE_KEY) || 'normal';
    } catch {
      return 'normal';
    }
  });

  const [highContrast, setHighContrastState] = useState(() => {
    try {
      return localStorage.getItem(HIGH_CONTRAST_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];
    
    // Set data-theme attribute
    root.setAttribute('data-theme', theme);
    
    // Manage dark mode classes for Tailwind
    const shouldBeDark = currentTheme.isDark || highContrast || theme === 'dark' || theme === 'high-contrast';
    if (shouldBeDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (highContrast || theme === 'high-contrast') {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, highContrast]);

  // Apply font scale to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-sm', 'font-scale-normal', 'font-scale-lg', 'font-scale-xl');
    root.classList.add(`font-scale-${fontScale}`);

    try {
      localStorage.setItem(FONT_SCALE_KEY, fontScale);
    } catch {
      // ignore
    }
  }, [fontScale]);

  const setTheme = (newTheme) => {
    const valid = THEMES.some((t) => t.id === newTheme);
    if (valid) {
      setThemeState(newTheme);
      if (newTheme === 'high-contrast') {
        setHighContrastState(true);
      } else if (highContrast && newTheme !== 'high-contrast') {
        setHighContrastState(false);
      }
    }
  };

  const setFontScale = (scale) => {
    if (['sm', 'normal', 'lg', 'xl'].includes(scale)) {
      setFontScaleState(scale);
    }
  };

  const increaseFontSize = () => {
    if (fontScale === 'sm') setFontScaleState('normal');
    else if (fontScale === 'normal') setFontScaleState('lg');
    else if (fontScale === 'lg') setFontScaleState('xl');
  };

  const decreaseFontSize = () => {
    if (fontScale === 'xl') setFontScaleState('lg');
    else if (fontScale === 'lg') setFontScaleState('normal');
    else if (fontScale === 'normal') setFontScaleState('sm');
  };

  const resetFontSize = () => {
    setFontScaleState('normal');
  };

  const toggleHighContrast = () => {
    setHighContrastState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(HIGH_CONTRAST_KEY, String(next));
      } catch {
        // ignore
      }
      if (next) {
        setThemeState('high-contrast');
      } else if (theme === 'high-contrast') {
        setThemeState('gov-classic');
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        fontScale,
        setFontScale,
        increaseFontSize,
        decreaseFontSize,
        resetFontSize,
        highContrast,
        toggleHighContrast,
        themes: THEMES,
        currentThemeConfig: THEMES.find((t) => t.id === theme) || THEMES[0],
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
