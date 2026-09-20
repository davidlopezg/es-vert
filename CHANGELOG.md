# Changelog

Todos los cambios relevantes del proyecto. Formato inspirado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

## [0.2.0] — 2025-XX-XX · Refresco visual

### Cambio
- **Sistema de diseño corporativo**, inspirado en la web de la marca madre:
  - Paleta cálida (`cream` `#F6F6F6`, `ink` `#1A1A1A`, `accent` verde `#53A548`, `taupe` `#8D8375`, `mute` `#666666`).
  - Tipografía única: **Montserrat** (Light/Regular/Italic/Medium). Abandonamos Fraunces y JetBrains Mono.
  - **Asimetría `rounded-tl-[60px] md:rounded-tl-[100px]`** en tarjetas y slider: la firma del estudio.
- **Header a dos bandas**:
  - Banda superior en taupe con contacto, dirección e idiomas (es · cat · en).
  - Logo **ÉS—VERT** con ÉS en mute, em-dash en ink, VERT en accent.
- **Hero en grid 50/50**: titular con pesos mixtos (Tu terraza, *rediseñada.*) + tarjeta blanca con dropzone en la columna derecha.
- **Subtítulo**: la frase del usuario, *«Tú decides el diseño y nosotros hacemos todo lo demás»*, queda como claim principal.
- **Strip de credibilidad** en estilo crédito de revista: `Diseño 3D · Montaje profesional · Presupuesto real · Sin compromiso`.
- **CTA del dropzone**: `Seleccionar archivo` (ghost) + `Probar demo →` (texto plano) — sin botón redundante "Empezar mi proyecto".
- **Recibo con disclaimer honesto** sobre borrador IA + visita técnica, e italic mute.
- **Mini-CTA *«Reservar visita técnica →»*** al pie del recibo: línea sutil, sin sección propia — enlaza self-serve con el servicio manual del estudio.

### Por decidir
- (Sigue desde 0.1.0) Modelo LLM canónico, identidad visual final, validación de catálogo seed.

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
- **Paleta única** `ink` / `paper` (luego reemplazada en 0.2.0 por `cream` / `ink` / `accent` / `taupe` / `mute`).
- **Slider vs generativo real**: el render del "después" es stock por defecto; cuando se configure `VITE_IMAGE_*` (directo o vía proxy), pasa a generarse al subir foto.
- **Sin rutas**: una sola página; la app es literalmente el producto.
