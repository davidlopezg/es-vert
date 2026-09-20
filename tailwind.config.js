/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // La paleta editorial son SOLO dos colores: tinta y papel.
      // Sintaxis con <alpha-value> para que funcionen modificadores
      // como /15, /40, /90 que usamos en bordes y fondos semi.
      colors: {
        ink:   'rgb(0 0 0 / <alpha-value>)',
        paper: 'rgb(255 255 255 / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
