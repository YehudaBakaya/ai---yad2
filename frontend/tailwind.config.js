export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      direction: ['ltr', 'rtl'],
      colors: {
        /* Midnight Emerald theme */
        bg: {
          primary:   '#0D1117',
          secondary: '#161B22',
          tertiary:  '#1C2333',
          elevated:  '#21262D',
        },
        border: {
          default: '#21262D',
          hover:   '#30363D',
        },
        text: {
          primary:   '#E6EDF3',
          secondary: '#8B949E',
          tertiary:  '#6E7681',
        },
        emerald: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        accent: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        ai: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
      },
    },
  },
  plugins: [],
}
