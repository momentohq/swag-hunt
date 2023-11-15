/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        highlight: 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      screens: {
        narrow: { raw: '(max-aspect-ratio: 3 / 2)' },
        wide: { raw: '(min-aspect-ratio: 3 / 2)' },
        'taller-than-854': { raw: '(min-height: 854px)' },
      },
      colors: {
        'momento-forest-green': '#25392B',
        'momento-electric-green': '#C4F135',
        'momento-mint-green': '#00C88C',
        'momento-squirrel-brown': '#C2B2A9',
        'momento-dark-forest': '#0e2515',
        'momento-dark-mint': '#03a876',
        'momento-light-squirrel': '#e1d9d5',
        'momento-light-mint': '#abe7d2',
        'momento-light-electric': '#eaf8b6'
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif']
      }
    },
  },
  plugins: [],
}
