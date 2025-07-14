/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        'pong-neon-green': '#00ff00',
        'pong-neon-blue': '#00ffff',
        'pong-neon-pink': '#ff00ff',
        'pong-neon-yellow': '#ffff00',
      },
      boxShadow: {
        'neon-green': '0 0 30px rgba(0, 255, 0, 0.1)',
        'neon-blue': '0 0 30px rgba(0, 255, 255, 0.1)',
        'neon-pink': '0 0 30px rgba(255, 0, 255, 0.1)',
      },
    },
  },
  plugins: [],
} 