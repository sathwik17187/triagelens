/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A0B',
          soft: '#121214',
          card: '#161619',
          border: 'rgba(237, 234, 227, 0.08)',
          hover: 'rgba(237, 234, 227, 0.04)',
        },
        bone: {
          DEFAULT: '#EDEAE3',
          muted: '#8E8B85',
          dim: '#5A5854',
        },
        signal: {
          DEFAULT: '#10B981', // emerald pulse
          active: '#34D399',
          alert: '#EF4444',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        sans: ['"Inter Tight"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.2em',
        editorial: '0.05em',
      }
    },
  },
  plugins: [],
}

