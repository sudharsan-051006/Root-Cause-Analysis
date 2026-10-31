/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1528',
          800: '#111E38',
          700: '#1B2C4E',
          600: '#283E6B',
        },
        slate: {
          850: '#15202E',
          750: '#253549',
        },
        teal: {
          500: '#0D9488',
          600: '#0F766E',
          700: '#115E59',
        },
        pharma: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          text: '#0F172A',
          muted: '#64748B',
          accent: '#0D9488'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
