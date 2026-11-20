/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          50: '#eff6ff',
          100: '#dbeafe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
        lift: '0 10px 15px -3px rgba(0,0,0,0.08)',
        mega: '0 20px 25px -5px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        xl2: '12px',
      },
    },
  },
  plugins: [],
};
