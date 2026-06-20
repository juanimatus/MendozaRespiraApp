/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
          '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
      },
      colors: {
        forest: {
          50:  '#f0f7f0',
          100: '#d8ecd8',
          500: '#3a7d44',
          600: '#2d6435',
          700: '#1f4a26',
          900: '#0e2212',
        },
        earth: {
          100: '#f5ede0',
          200: '#e8d5b7',
          400: '#b8883a',
          600: '#7a5522',
        },
      },
    },
  },
  plugins: [],
};
