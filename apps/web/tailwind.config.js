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
          DEFAULT: '#0F172A',
          dark: '#020617',
          light: '#334155',
        },
        primary: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
          light: '#F1F5F9',
        },
        accent: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          light: '#F0FDFA',
        },
        teal: {
          DEFAULT: '#0D9488',
          hover: '#0F766E',
          light: '#F0FDFA',
        },
        healthGreen: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
        },
        healthAmber: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        healthRed: {
          DEFAULT: '#E11D48',
          light: '#FFF1F2',
        },
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
      },
      borderRadius: {
        card: '16px',
        control: '10px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'elevated': '0 10px 25px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
}
