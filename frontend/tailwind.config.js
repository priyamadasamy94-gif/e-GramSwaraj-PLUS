/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Noto Sans"', '"Noto Sans Devanagari"', '"Noto Sans Telugu"', '"Noto Sans Tamil"', '"Noto Sans Kannada"', '"Noto Sans Malayalam"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        gov: {
          50: 'var(--gov-50, #eef3fb)',
          100: 'var(--gov-100, #d9e4f5)',
          200: 'var(--gov-200, #b3c8eb)',
          300: 'var(--gov-300, #8aa9dc)',
          400: 'var(--gov-400, #5a82c7)',
          500: 'var(--gov-500, #3563ad)',
          600: 'var(--gov-600, #244d92)',
          700: 'var(--gov-700, #1c3d76)',
          800: 'var(--gov-800, #162f5c)',
          900: 'var(--gov-900, #0f2142)',
          950: 'var(--gov-950, #0a162d)',
        },
        saffron: { 400: '#f7a74a', 500: '#f28c28', 600: '#d97414' },
        indiagreen: { 500: '#138808', 600: '#0f6d06' },
      },
      boxShadow: { card: '0 1px 2px rgba(15,33,66,.06), 0 1px 3px rgba(15,33,66,.08)' },
    },
  },
  plugins: [],
};
