# NOTES · Bitácora del proyecto

Registro cronológico de decisiones, comandos y observaciones del día a día.
Se complementa con `CHANGELOG.md` (que solo lleva releases fechados).

---

## 2025 · Vuelta al editorial bien hecho

### Lo que el usuario mantuvo (no tocar)
- **Resultado con slider y sidebar** funcionan y gustan tal cual: rejilla 70/30, curva asimétrica en el slider, prompt + recibo en panel derecho.
- **Paleta** cream/ink/accent/taupe/mute es buena.

### Lo que el usuario rechazó y rehacemos
- **Tipografía plana**: una sola sans mata la personalidad. Vuelve la triada:
  - Fraunces → titulares (voz editorial, la firma de V1).
  - Inter → cuerpo y UI (sans de referencia).
  - JetBrains Mono → SKUs y precios (dot-leaders y tabular nums).
- **Dropzone como tarjeta**: se quita la rejilla 50/50. Hero monocolumna vertical, eyebrow → título → subtítulo (la frase del usuario) → dropzone con la curva asimétrica → colofón.
- **Trust strip corporativo**: se sustituye por una sola línea de colofón en mono — `Estudio Es-Vert · Diseño 3D · Montaje profesional · Barcelona · Desde 2018`. Sin banner, sin SaaS.
- **Header**: ya no compite con la composición. Una sola línea fina.
- **Recibo sin voz**: vuelve el total grande en serif Fraunces con dot-leaders, y los nombres en Inter.

### Decisiones que se toman aparte (no se preguntó porque era obvio)
- Stagger de entrada en 4 bloques — CSS keyframes + clases utilitarias, sin librerías. `prefers-reduced-motion` respetado.
- `focus-visible` con outline verde — accesibilidad arreglada.
- Botones con lift de 1 px en hover (`btn-lift`).

### Pendiente
- (Sigue) Decidir adónde apunta *Reservar visita técnica* (mailto, Calendly, formulario propio).
- (Sigue) Foto real de un proyecto del estudio para reemplazar el placeholder del slider.
- (Sigue) Validar en móvil real (no solo mental): sobre todo el hero, que ahora es monocolumna largo.

---

## 2025 · Sesión de refresco visual

### Radiografía de marca
El usuario pidió alinear el producto con la estética del sitio madre: off-white, verde corporativo, tipografía sans geométrica, **botones ghost** y, sobre todo, la curva **asimétrica `rounded-tl-…`** en imágenes. Esa asimetría es "el detalle de diseño más destacable" — la firma del estudio.

### Posicionamiento confirmado
La empresa **ya hace hoy** diseño 3D y montaje físico. Esta herramienta es "un paso más" sobre ese servicio. Eso obliga a la landing a ser:
- producto + servicio a la vez (no herramienta pura),
- honesta con el borrador (es un *draft*, se valida en visita),
- puente al funnel manual al final (no una sección "Contacto" completa, sí un mini-CTA).

### Cambio de claim
Mi propuesta inicial ("Empezar mi proyecto →") y la corporativa ("Diseño 3D · Montaje · Presupuesto · Sin compromiso") se rechazaron por ambos lados: demasiado SaaS. El usuario aporta la frase final: **«Tú decides el diseño y nosotros hacemos todo lo demás.»** — sentido editorial, tono boutique.

### Norma de diseño adoptada
> «Una sola idea por zona, sin más mecanismos de los necesarios.»

Aplicada a:
- Subtítulo = la frase del usuario. Sin más.
- Strip = crédito de revista bajo el subtítulo (mute, hairline), no banner.
- Botones = los que el dropzone necesita (file + demo), nada más.
- Recibo = el disclaimer honesto y un mini-CTA al pie, sin nueva sección.

### Pendiente
- [ ] Si se publica en abierto, decidir si el mini-CTA apunta a `mailto`, formulario o Calendly.
- [ ] Sustituir el placeholder `Est. 2018` por la fecha real del estudio.
- [ ] Cuando el usuario apruebe el look & feel, validación cruzada en mobile real (no solo simulación mental).

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
