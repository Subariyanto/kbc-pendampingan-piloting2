/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef4ff',
          100: '#dbe6fe',
          500: '#3b6dc7',
          600: '#1e4fa8',
          700: '#163d83',
          800: '#102a4d',
          900: '#0a1d36',
        },
        gold: {
          400: '#f5c451',
          500: '#eecb59',
          600: '#caa42a',
        },
        teal: {
          500: '#2fa295',
          600: '#21847a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
