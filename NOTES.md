# NOTES · Bitácora del proyecto

Registro cronológico de decisiones, comandos y observaciones del día a día.
Se complementa con `CHANGELOG.md` (que solo lleva releases fechados).

---

## 2025 · Sesión inicial

### Contexto
- Briefing V3 entregado por el usuario: landing product-led, editorial, anti-SaaS.
- Acordado: scaffoldear MVP con dos estados (hero ↔ result), soporte drop&drop real + demo mock.
- Hosting previsto: GitHub Pages (estático).

### Decisiones técnicas
- **Stack**: Vite 5 + React 18 + Tailwind 3. Se descartó Next.js (sobrepeso) y CRA (deprecada).
- **Tipografías**: Fraunces (serif) + JetBrains Mono (mono), vía Google Fonts con `preconnect` y `display=swap`.
- **Paleta**: solo `ink` (#000) y `paper` (#FFF). Sin acentos. Tailwind config con `rgb(... / <alpha-value>)` para soportar modificadores de opacidad.
- **Slider**: pointer events (`onPointerDown/Move/Up`) + `setPointerCapture` para que el drag siga al cursor/tacto fuera del área. Recorte del "antes" con `clip-path: inset(0 R 0 0)`.
- **Recibir el patrón LLM de HabitQuest**: misma `getAIConfig()` con `mode: direct | proxy`, default URL `https://api.minimax.io/v1`, modelo `MiniMax-M2`. Es el patrón validado por el usuario.

### Pendientes de esta sesión
- [ ] Subir el repo a GitHub (`gh repo create` cuando el usuario confirme nombre y visibilidad).
- [ ] Confirmar nombre del repo (actualmente asumido `es-vert`).
- [ ] Definir identidad visual mínima (logo SVG, claim final del footer).
- [ ] Resolver cuándo el slider muestra el render real vs el de stock.

### Observaciones
- El brief prohíbe secciones "Cómo funciona" / "Precios". Está respetado: la landing ES el producto.
- La regla "la IA no inventa" se traduce literalmente al `SYSTEM_PROMPT` de `minimax.js`: prohíbe SKUs inventadas y obliga a un catálogo de marcas reales.

---

## Próxima sesión (ideas)
- Hacer build de prueba local (`npm install && npm run build`) para validar que el bundle genera sin warnings.
- Diseñar el estado `error` del workflow: ¿qué pasa si la API falla en medio de una conversación?
- Catálogo seed: revisar si los 4 productos iniciales representan el rango de precio típico de una terraza real (1.000–4.000 €).
- Considerar un `humans.txt` y un `robots.txt` literarios para reforzar la identidad editorial.
