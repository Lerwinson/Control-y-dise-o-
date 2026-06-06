import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        blood: '#FF0000',
        darkblood: '#8B0000',
        panel: 'rgba(20,2,2,0.55)',
      },
      fontFamily: {
        display: ['var(--font-orbitron)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 18px rgba(255,0,0,0.55), 0 0 40px rgba(139,0,0,0.35)',
      },
      keyframes: {
        auroraShift: {
          '0%,100%': { backgroundPosition: '0% 0%, 100% 0%, 50% 100%, 0 0' },
          '50%': { backgroundPosition: '30% 20%, 70% 10%, 40% 90%, 0 0' },
        },
        spin360: { to: { transform: 'rotate(360deg)' } },
        fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        aurora: 'auroraShift 18s ease-in-out infinite',
        spin360: 'spin360 9s linear infinite',
        fadeIn: 'fadeIn .35s ease',
      },
    },
  },
  plugins: [],
};

export default config;
