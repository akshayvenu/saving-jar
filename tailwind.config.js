const { ink, surface, brand, jar, accent, danger, success } = require('./src/theme/colors');

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
        surface: { ...surface, dark: '#14161A', cardDark: '#1F2228' },
        ink: { ...ink, dark: '#F2F2F2', mutedDark: '#A3A8AF' },
        danger,
        success,
      },
      fontFamily: {
        sans: ['DMSans_400Regular'],
        medium: ['DMSans_500Medium'],
        semibold: ['DMSans_600SemiBold'],
        bold: ['DMSans_700Bold'],
        extrabold: ['DMSans_800ExtraBold'],
        display: ['SpaceGrotesk_500Medium'],
        'display-semibold': ['SpaceGrotesk_600SemiBold'],
        'display-bold': ['SpaceGrotesk_700Bold'],
      },
      borderRadius: { jar: 28, block: 22 },
      borderWidth: { hair: '1.5px' },
    },
  },
  plugins: [],
};
