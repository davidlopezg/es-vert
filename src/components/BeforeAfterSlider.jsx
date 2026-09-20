import { useCallback, useRef, useState } from 'react';

// Slider Antes/Después con pointer events.
// Etiquetas ahora en Montserrat uppercase tracking (sin mono).
// Fondo del contenedor: cream, para que la curva asimétrica se vea.

export default function BeforeAfterSlider({ before, after, label = 'terraza' }) {
  const [position, setPosition] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const setFromX = useCallback((clientX) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = (e) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragging.current = true;
    setFromX(e.clientX);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    setFromX(e.clientX);
  };

  const onPointerUp = (e) => {
    dragging.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const insetRight = 100 - position;

  return (
    <div
      ref={ref}
      className="relative w-full h-full select-none bg-cream overflow-hidden cursor-ew-resize touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Capa "después" */}
      <img
        src={after}
        alt={`${label} · después`}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Capa recortada "antes" */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${insetRight}% 0 0)` }}
      >
        <img
          src={before}
          alt={`${label} · antes`}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Línea separadora */}
      <div
        className="absolute top-0 bottom-0 w-px bg-cream/90 pointer-events-none"
        style={{ left: `${position}%` }}
      />

      {/* Empuñadura */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-cream border border-ink/80 pointer-events-none flex items-center justify-center"
        style={{ left: `${position}%` }}
        aria-hidden="true"
      >
        <span className="font-sans text-[15px] leading-none">‹›</span>
      </div>

      {/* Etiquetas */}
      <div className="absolute top-5 left-5 right-5 md:top-6 md:left-6 md:right-6 flex justify-between pointer-events-none">
        <span className="font-sans text-[10px] uppercase tracking-[0.28em] bg-cream/95 text-ink px-3 py-1.5">
          Antes
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.28em] bg-ink/90 text-cream px-3 py-1.5">
          Después
        </span>
      </div>

      {/* Pie con metadatos */}
      <div className="absolute bottom-5 left-5 right-5 md:bottom-6 md:left-6 md:right-6 flex flex-wrap justify-between gap-2 pointer-events-none">
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream/95 text-ink px-3 py-1.5">
          Terraza · 24 m² · orientación SO
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream/95 text-mute px-3 py-1.5">
          IA · render simulado
        </span>
      </div>
    </div>
  );
}
