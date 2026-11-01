/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
        up: 'rgb(var(--up) / <alpha-value>)',
        down: 'rgb(var(--down) / <alpha-value>)',
        brand: '#f59e0b',
        ink: '#0a0a0a',
      },
      keyframes: {
        flashUp: {
          from: { backgroundColor: 'rgb(var(--up) / 0.35)' },
          to: { backgroundColor: 'transparent' },
        },
        flashDown: {
          from: { backgroundColor: 'rgb(var(--down) / 0.35)' },
          to: { backgroundColor: 'transparent' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'flash-up': 'flashUp 0.9s ease-out',
        'flash-down': 'flashDown 0.9s ease-out',
        marquee: 'marquee 60s linear infinite',
      },
    },
  },
  plugins: [],
};
