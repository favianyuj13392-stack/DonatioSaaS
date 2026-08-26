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
          primary: 'var(--tenant-primary, #db2777)',
          hover: 'var(--tenant-hover, #be185d)',
          light: 'var(--tenant-light, #fdf2f8)',
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
