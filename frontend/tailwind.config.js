/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Material 3 Semantic Colors (Light Theme Baseline - Teal/Indigo source)
        primary: '#006A60', // Teal 700
        'on-primary': '#FFFFFF',
        'primary-container': '#74F8E5', // Teal 200
        'on-primary-container': '#00201C', // Teal 900

        secondary: '#4A635F', // M3 Secondary
        'on-secondary': '#FFFFFF',
        'secondary-container': '#CCE8E3',
        'on-secondary-container': '#05201C',

        tertiary: '#456179', // Slate/Blue-ish
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#CCE5FF',
        'on-tertiary-container': '#001E30',

        error: '#BA1A1A',
        'on-error': '#FFFFFF',

        background: '#FAFDFB', // Neutral 99
        'on-background': '#191C1C', // Neutral 10

        surface: '#F7FAF9', // Neutral 98
        'on-surface': '#191C1C', // Neutral 10
        'surface-variant': '#DAE5E1', // Neutral Variant 90
        'on-surface-variant': '#3F4947', // Neutral Variant 30

        outline: '#6F7977',
        'outline-variant': '#BFC9C5',
      },
      fontFamily: {
        poppins: ['"Poppins"', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'], // Keep Inter, it's good for M3
        // You generally want a Display font for Headlines in M3, but Inter is fine for variable weight.
      },
      transitionTimingFunction: {
        'emphasized': 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        'emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
        'emphasized-accelerate': 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
        'standard': 'cubic-bezier(0.2, 0.0, 0, 1.0)',
        'standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
        'standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.05, 0.7, 0.1, 1.0) forwards',
        'slide-up': 'slideUp 1s cubic-bezier(0.05, 0.7, 0.1, 1.0) forwards',
        'scale-in': 'scaleIn 0.8s cubic-bezier(0.2, 0.0, 0, 1.0) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob': 'blob 7s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
