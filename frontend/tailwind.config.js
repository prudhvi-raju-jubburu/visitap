/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f59e0b',
        bg: '#020617',
        surface: '#0f172a',
        surfaceLight: '#1e293b',
        text: '#e2e8f0',
        textMuted: '#94a3b8',
        accent: '#6366f1',
        success: '#10b981',
        danger: '#ef4444',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Poppins', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1a0a2e 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.4) 60%, transparent 100%)',
        'amber-glow': 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.15) 0%, transparent 70%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'amber': '0 0 30px rgba(245, 158, 11, 0.3)',
        'glow': '0 0 40px rgba(99, 102, 241, 0.4)',
        'card': '0 4px 30px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
