import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
      boxShadow: {
        'sticky-right': '2px 0 6px -3px rgba(0,0,0,0.12)',
        'sticky-left': '-2px 0 6px -3px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
