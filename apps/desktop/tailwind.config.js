/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        lightBlue: "#60A5FA",
        lavender: "#C4B5FD",
        softGreen: "#4ADE80",
        dark: "#0F172A"
      },
      animation: {
        'soft-pulse': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit': 'spin 10s linear infinite',
      }
    },
  },
  plugins: [],
}
