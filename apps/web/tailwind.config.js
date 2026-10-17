/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f7f5f2',
          100: '#efe8df',
          200: '#ded2c4',
          300: '#c7b7a1',
          400: '#b39d84',
          500: '#8a735d',
          600: '#6d584a',
          700: '#4f4039',
          800: '#2d2623',
          900: '#171413',
        },
      },
      boxShadow: {
        soft: '0 12px 35px rgba(45, 38, 35, 0.08)',
      },
    },
  },
  plugins: [],
};
