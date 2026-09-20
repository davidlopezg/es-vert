# Es-Vert

> **Tu terraza, rediseñada.** La IA no inventa: diseña con productos reales que puedes comprar.
>
> Mira cómo puede quedar tu espacio y descubre cuánto cuesta.

Landing editorial y product-led. **La landing es el producto**: una sola pantalla con dos estados (hero → resultado interactivo), cero secciones “Cómo funciona” / “Precios” / “FAQ”. El usuario experimenta el valor en los primeros 10 segundos.

## Verlo en producción

Tras desplegar en GitHub Pages, vive en `https://<user>.github.io/es-vert/`.

## Stack

- React 18 + Vite 5 + Tailwind CSS 3
- Tipografías: **Fraunces** (serif titulares) + **JetBrains Mono** (SKUs, precios, metadatos)
- Sin router, sin estado global, sin CSS-in-JS
- Adaptadores finos en `src/lib/` que activan el modo live con `.env` o el proxy

## Estructura

```
src/
├── App.jsx                          orquesta los dos estados (hero ↔ result)
├── main.jsx · index.css
├── components/
│   ├── Header.jsx                   masthead editorial (edición, fecha, coordenadas)
│   ├── Hero.jsx                     dropzone con drag&drop + atajo a demo
│   ├── Result.jsx                   rejilla 70/30, stack vertical en móvil
│   ├── BeforeAfterSlider.jsx        slider con pointer events unificados
│   ├── Receipt.jsx                  ticket editorial con dot-leaders mono
│   └── Prompt.jsx                   atajos + historial breve + input libre
├── data/products.js                 catálogo seed + placeholders
└── lib/
    ├── matchAndRespond.js           respuestas canned (modo demo)
    ├── minimax.js                   adapter LLM (mode direct / proxy)
    └── image.js                     adapter de imagen (mode direct / proxy)

ai-proxy/
├── worker.js                        Cloudflare Worker (oculta las claves)
└── wrangler.toml.example            plantilla de despliegue
```

## Desarrollo local

```bash
npm install
npm run dev          # http://localhost:5173
```

Sin `.env.local`, la app funciona completa con **datos mock**: cero llamadas externas. Esto es deliberado — cualquier persona puede clonar, ejecutar y ver el producto en menos de un minuto.

## Conectar a las APIs reales

Hay **dos modos** y puedes combinarlos:

### Modo A · uso personal

Copia `.env.example` a `.env.local`, rellena tu clave y `npm run dev`. La clave queda incrustada en el bundle — perfecto para uso personal o demos internas, **inaceptable para producción pública**.

```env
VITE_MINIMAX_API_KEY="tu-clave-de-minimax"
VITE_IMAGE_API_URL="https://api.replicate.com/v1/predictions"
VITE_IMAGE_API_KEY="tu-clave"
VITE_IMAGE_MODEL="stability-ai/sdxl"
```

### Modo B · producción pública (recomendado)

Las claves viven en un **Cloudflare Worker**; el front solo conoce la URL pública del Worker.

1. Crea el Worker (gratis): `dash.cloudflare.com → Workers & Pages → Create → Worker`, pega el contenido de [`ai-proxy/worker.js`](./ai-proxy/worker.js).
2. Configura los secretos en el Worker:
   - `MINIMAX_API_KEY` → tu clave de [platform.minimax.io](https://platform.minimax.io)
   - `IMAGE_API_URL` / `IMAGE_API_KEY` → tu proveedor de imagen (opcional)
   - `AI_PROXY_TOKEN` → token compartido opcional (defensa adicional)
3. Apunta el front a la URL del Worker:

```env
VITE_AI_PROXY_URL="https://tu-worker.tu-subdominio.workers.dev"
VITE_AI_PROXY_TOKEN="el-token-que-configuraste"
VITE_IMAGE_API_URL="https://api.replicate.com/v1/predictions"   # si dejas IMAGE_VIA_PROXY en true,
VITE_IMAGE_API_KEY="tu-clave"                                    # el Worker la usará desde
VITE_IMAGE_MODEL="stability-ai/sdxl"                             # sus propios secretos.
```

Despliega. La app detecta automáticamente el modo y muestra el badge correspondiente en el pie (`Conectado · MiniMax · direct` o `Conectado · Proxy IA · proxy`).

Para desactivar la imagen a través del proxy (recomendado casi siempre NO): `VITE_IMAGE_VIA_PROXY=false`.

## Despliegue en GitHub Pages

1. Sube el repo (`gh repo create es-vert --public --source=. --remote=origin --push`).
2. Activa Pages en **Settings → Pages → Build & deployment → GitHub Actions**.
3. Añade las secrets que necesites en **Settings → Secrets and variables → Actions**.
4. Cada push a `main` redeploy automáticamente (workflow en `.github/workflows/deploy.yml`).

`vite.config.js` lleva `base: '/es-vert/'` por defecto. Cámbialo a `'/'` si lo mueves a dominio propio.

## Decisiones de diseño

- **Paleta única** `ink` (#000) y `paper` (#FFF). El color lo traen solo las fotografías.
- **Cero border-radius**. Bordes rectos en todos los componentes, líneas hairline (1 px) como separadores.
- **Tipografía dual**: serif para los titulares y dot-leaders, mono para todo dato técnico.
- **Producto = landing**. Sin menú, sin secciones estándar, sin onboarding.

## Documentos del proyecto

- [`CHANGELOG.md`](./CHANGELOG.md) — versiones y cambios publicados.
- [`NOTES.md`](./NOTES.md) — bitácora viva de sesiones, decisiones y observaciones.

## Licencia y atribución

- Imágenes placeholder: [picsum.photos](https://picsum.photos) (sustituir cuando haya renders reales).
- Tipografías: [Fraunces](https://fonts.google.com/specimen/Fraunces), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Google Fonts, SIL Open Font License).
- Inspiración del patrón de proxy: proyecto hermano HabitQuest (mismo autor, mismo stack).
