export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f3e8fb',
          100: '#e1c5f5',
          200: '#c89de9',
          300: '#ae75dd',
          400: '#9452d0',
          500: '#7a0cbf',
          600: '#5b068c',
          700: '#480570',
          800: '#350454',
          900: '#220338',
        },
        accent: {
          50:  '#fff3eb',
          100: '#ffd9b8',
          200: '#ffba80',
          300: '#ff9a47',
          400: '#ff7a2e',
          500: '#ff5e00',
          600: '#cc4b00',
          700: '#993800',
          800: '#662500',
          900: '#331200',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out both',
        'scale-in':   'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,94,0,0.35)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(255,94,0,0)' },
        },
      },
    },
  },
  plugins: [],
}
