/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        'neon-orchid': 'rgb(var(--neon-orchid))',
        'sunset-gold': 'rgb(var(--sunset-gold))',
        'velvet-gray': 'rgb(var(--velvet-gray))',
        'obsidian': 'rgb(var(--obsidian))',
        'charcoal': 'rgb(var(--charcoal))',
        'smoke': 'rgb(var(--smoke))',
        'pearl': 'rgb(var(--pearl))',
        'crimson': 'rgb(var(--crimson))',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
      },
      boxShadow: {
        'glow': '0 0 8px rgba(255, 215, 0, 0.6)',
        'glow-purple': '0 0 8px rgba(218, 112, 214, 0.6)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      }
    },
  },
  plugins: [],
}

