/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tenant: {
          primary: 'var(--tenant-primary, #059669)',
          hover: 'var(--tenant-hover, #047857)',
          light: 'var(--tenant-light, rgba(5,150,105,0.10))',
          secondary: 'var(--tenant-secondary, #0f172a)',
        },
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
    },
  },
  plugins: [],
}
