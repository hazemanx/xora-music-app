/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-black': '#121212',
        'app-dark': '#181818',
        'app-light': '#282828',
      },
    },
  },
  plugins: [],
}