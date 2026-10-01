const { jar, brand, accent } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand,
        jar,
        accent,
        surface: { DEFAULT: '#F6F6EF', card: '#FFFFFF', dark: '#14161A', cardDark: '#1F2228' },
        ink: { DEFAULT: '#1B1B1B', muted: '#5F6368', dark: '#F2F2F2', mutedDark: '#A3A8AF' },
        danger: '#E06666',
        success: '#7CC9A0',
      },
      fontFamily: {
        sans: ['Jost_400Regular'],
        medium: ['Jost_500Medium'],
        semibold: ['Jost_600SemiBold'],
        bold: ['Jost_700Bold'],
        extrabold: ['Jost_800ExtraBold'],
      },
      borderRadius: { jar: 28 },
    },
  },
  plugins: [],
};
