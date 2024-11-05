const flowbite = require("flowbite-react/tailwind");
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        fontFamily : {
            'sans': ['Inter', 'sans-serif'],
        },
       
        extend: {
            colors: {
                button:{
                    100: '#5489fc',
                },
                border:{
                    100: '#e0e2e7',
                },
                myCyan : '#0FB7FF',
                myGreen : '#1EB564'
            },
            keyframes: {
              'progress': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
              }
            },
            animation: {
              'progress': 'progress-bar 1s infinite linear'
            }
        }, 
    },
    plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.custom-scrollbar': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#cbd5e1 #f1f5f9',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f5f9',
            'border-radius': '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            'border-radius': '6px',
            '&:hover': {
              background: '#94a3b8',
            },
          },
        },
      })
    },
  ],
};