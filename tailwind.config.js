/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1F6B', 900: '#071548', 800: '#0A1A5C' },
        brand: { DEFAULT: '#1747D6', soft: '#EEF2FF' },
        accent: { DEFAULT: '#F28C1B', dark: '#D97706' },
        ink: '#1B2340',
      },
      fontFamily: { sans: ['Manrope', 'system-ui', 'Segoe UI', 'sans-serif'] },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};
