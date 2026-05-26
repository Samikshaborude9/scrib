/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Nunito', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        syne: ['Syne', 'sans-serif']
      },
      colors: {
        brand: {
          50:  '#EEEDFE',
          100: '#CECBF6',
          400: '#7F77DD',
          500: '#534AB7',
          600: '#3C3489',
          700: '#26215C',
          accent: '#5ed29c',
          dark: '#070b0a'
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cardFloat: {
          '0%, 100%': { transform: 'translateY(-50px)' },
          '50%': { transform: 'translateY(-58px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.65' },
        }
      },
      animation: {
        fadeUp: 'fadeUp 0.8s ease both',
        cardFloat: 'cardFloat 4s ease-in-out infinite',
        glowPulse: 'glowPulse 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
