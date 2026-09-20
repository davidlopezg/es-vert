# Changelog

Todos los cambios relevantes del proyecto. Formato inspirado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Por decidir
- Modelo LLM por defecto (placeholder `MiniMax-M2`, pendiente de confirmar el modelo canónico).
- Identidad visual (paleta `ink/paper`; eventual logo/icono SVG propio).
- Catálogo seed de SKUs (4 productos iniciales; falta validar precios reales contra retailers).

## [0.1.0] — 2025-XX-XX · Inicio

### Añadido
- Scaffolding de Vite 5 + React 18 + Tailwind 3, sin extras.
- Adaptador MiniMax (`src/lib/minimax.js`) con dos modos (`direct` / `proxy`), mismo patrón que HabitQuest.
- Adaptador de imagen genérico (`src/lib/image.js`) que se enruta por el proxy o directo.
- Worker de Cloudflare (`ai-proxy/worker.js`) con dos endpoints (`/chat/completions`, `/image/generate`) que custodian las claves en servidor.
- Estados `hero` ↔ `result` con transición instantánea en `src/App.jsx`.
- Slider Antes/Después con pointer events (mouse + touch unificados) en `src/components/BeforeAfterSlider.jsx`.
- Recibo editorial con dot-leaders monoespaciados y total serif en `src/components/Receipt.jsx`.
- Hero con dropzone real (drag&drop + selector de archivo) y botón demo en `src/components/Hero.jsx`.
- Prompt iterativo con atajos, historial breve e input libre en `src/components/Prompt.jsx`.
- Catálogo seed (`src/data/products.js`) y respuestas canned para modo demo (`src/lib/matchAndRespond.js`).
- Workflow de GitHub Actions para desplegar en GitHub Pages (`.github/workflows/deploy.yml`).
- `.env.example` documentando las 9 variables y los dos modos de uso.
- `README.md`, `CHANGELOG.md` y `NOTES.md`.

### Decisiones
- **Paleta única** `ink` / `paper`: rechazar el verde corporativo. El color lo traen solo las fotografías.
- **Sin border-radius**: bordes rectos en todo el UI (`rounded-none` por defecto en componentes custom).
- **Slider vs generativo real**: el render del "después" es stock por defecto; cuando se configure `VITE_IMAGE_*` (directo o vía proxy), pasa a generarse al subir foto.
- **Sin rutas**: una sola página; la app es literalmente el producto.
