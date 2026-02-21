import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        craft: {
          bg: '#1A0E0A',
          dark: '#0F0805',
          card: '#231510',
          border: '#3D2A1F',
          amber: '#D4871C',
          gold: '#F4C430',
          light: '#F5E6D3',
          muted: '#8B7355',
          danger: '#DC2626',
          success: '#16A34A',
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config
