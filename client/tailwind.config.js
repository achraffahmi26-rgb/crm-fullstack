/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crm: {
          orange: '#ff5c35',
          orangeDark: '#e04826',
          ink: '#213343',
          muted: '#516f90',
          line: '#dbe4ed',
          surface: '#f6f9fc',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(33, 51, 67, 0.08)',
      },
    },
  },
  plugins: [],
};
