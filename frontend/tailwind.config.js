/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tessolve Brand Colors
        // Orange: #E85D24 (TESS)
        // Blue: #0077C8 (OLVE)
        tessolve: {
          orange: '#E85D24',
          'orange-light': '#F47B4A',
          'orange-dark': '#C94D1A',
          blue: '#0077C8',
          'blue-light': '#2B8FD4',
          'blue-dark': '#005A99',
          navy: '#004B8D',
          'navy-dark': '#003366',
        },
        // Primary = Tessolve Blue
        primary: {
          50: '#e6f3fb',
          100: '#cce7f7',
          200: '#99cfef',
          300: '#66b7e7',
          400: '#339fdf',
          500: '#0077C8',  // Tessolve Blue
          600: '#005fa0',
          700: '#004778',
          800: '#003050',
          900: '#001828',
        },
        // Accent = Tessolve Orange
        accent: {
          50: '#fef3ee',
          100: '#fde7dd',
          200: '#fbcfbb',
          300: '#f9b799',
          400: '#f47b4a',
          500: '#E85D24',  // Tessolve Orange
          600: '#c94d1a',
          700: '#aa3d10',
          800: '#8b2d06',
          900: '#6c1d00',
        },
        // Dark theme background
        dark: {
          50: '#e8eaed',
          100: '#c5c9d1',
          200: '#9fa5b3',
          300: '#798195',
          400: '#5c667d',
          500: '#404b65',
          600: '#38435c',
          700: '#2e3850',
          800: '#252d44',
          900: '#1a2038',
          950: '#0f1424',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(232, 93, 36, 0.3)',
        'glow-blue': '0 0 20px rgba(0, 119, 200, 0.3)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
