export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f3e8fb', 100: '#e1c5f5', 200: '#c89de9', 300: '#ae75dd',
          400: '#9452d0', 500: '#7a0cbf', 600: '#5b068c', 700: '#480570',
          800: '#350454', 900: '#220338',
        },
        accent: {
          50:  '#fff3eb', 100: '#ffd9b8', 200: '#ffba80', 300: '#ff9a47',
          400: '#ff7a2e', 500: '#ff5e00', 600: '#cc4b00', 700: '#993800',
          800: '#662500', 900: '#331200',
        },
      },
      fontFamily: { sans: ['Roboto', 'sans-serif'] },
      animation: {
        'fade-in':      'fadeIn 0.25s ease-out',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.34,1.36,0.64,1) both',
        'scale-in':     'scaleIn 0.25s cubic-bezier(0.34,1.36,0.64,1)',
        'bounce-in':    'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-glow':   'pulseGlow 2.5s ease-in-out infinite',
        'float':        'float 8s ease-in-out infinite',
        'float-slow':   'float 12s ease-in-out infinite',
        'float-fast':   'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 1.6s linear infinite',
        'gradient-x':   'gradientX 4s ease infinite',
        'bar-fill':     'barFill 1s cubic-bezier(0.34,1.2,0.64,1) forwards',
        'ping-once':    'ping 0.6s cubic-bezier(0,0,0.2,1) forwards',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        bounceIn:  { '0%': { opacity: '0', transform: 'scale(0.8)' }, '70%': { transform: 'scale(1.04)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 0 rgba(255,94,0,0.35)' },
          '50%':     { boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 12px rgba(255,94,0,0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%':     { transform: 'translateY(-28px) scale(1.06)' },
        },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        gradientX:  { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        barFill:    { from: { width: '0%' }, to: { width: 'var(--bar-w)' } },
        ping:       { '75%,100%': { transform: 'scale(2)', opacity: '0' } },
        spin:       { to: { transform: 'rotate(360deg)' } },
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(91,6,140,0.35)',
        'glow-accent':  '0 0 24px rgba(255,94,0,0.35)',
        'card':         '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':   '0 12px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
        'modal':        '0 30px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
}
