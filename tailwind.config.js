/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      // Paleta corporativa És-Vert (radiografía visual 2025-09)
      //   cream  #F6F6F6 → fondo
      //   ink    #1A1A1A → texto principal
      //   accent #53A548 → verde corporativo (CTAs, "vert")
      //   taupe  #8D8375 → barra superior, separadores cálidos
      //   mute   #666666 → texto secundario / "ÉS"
      // Sintaxis con <alpha-value> para soportar /10, /30, /90...
      colors: {
        cream:  'rgb(246 246 246 / <alpha-value>)',
        ink:    'rgb(26 26 26 / <alpha-value>)',
        accent: 'rgb(83 165 72 / <alpha-value>)',
        taupe:  'rgb(141 131 117 / <alpha-value>)',
        mute:   'rgb(102 102 102 / <alpha-value>)',
      },
      letterSpacing: {
        editorial: '0.22em',
      },
    },
  },
  plugins: [],
};
