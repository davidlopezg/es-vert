import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: '/es-vert/'` para GitHub Pages en <user>.github.io/es-vert.
// Si despliegas en dominio propio o subruta distinta, ajústalo.
export default defineConfig({
  plugins: [react()],
  base: '/es-vert/',
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
