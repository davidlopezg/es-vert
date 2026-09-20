/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Triada tipográfica — cada voz con un trabajo distinto.
        sans:   ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif:  ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        mono:   ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
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
