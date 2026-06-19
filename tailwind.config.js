/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        life: {
          amber: '#C76A3C',
          cream: '#FAF8F4',
          espresso: '#1F1B16',
          lime: '#E1F432',
          paper: '#F5F1EA',
          sand: '#EFEAE0',
        },
      },
      fontFamily: {
        display: ['PretendardVariable'],
        latin: ['Lato-Regular'],
        'latin-bold': ['Lato-Bold'],
        'latin-black': ['Lato-Black'],
      },
    },
  },
  plugins: [],
};
