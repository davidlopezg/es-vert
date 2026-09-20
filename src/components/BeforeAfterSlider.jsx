import { useCallback, useRef, useState } from 'react';

// Slider Antes/Después con pointer events (mouse + touch unificados).
// - Imagen "después" siempre debajo
// - Imagen "antes" se recorta con clip-path según la posición
// - Empuñadura 9×9 con flecha mono ‹›
// - Etiquetas monoespaciadas en esquinas

export default function BeforeAfterSlider({ before, after, label = 'terraza' }) {
  const [position, setPosition] = useState(50);   // % desde la izquierda
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
      className="relative w-full h-full select-none bg-ink overflow-hidden cursor-ew-resize touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Capa base: "después" */}
      <img
        src={after}
        alt={`${label} · después`}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Capa recortada: "antes" */}
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
        className="absolute top-0 bottom-0 w-px bg-paper pointer-events-none"
        style={{ left: `${position}%` }}
      />

      {/* Empuñadura */}
      <div
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-paper border border-ink pointer-events-none flex items-center justify-center"
        style={{ left: `${position}%` }}
        aria-hidden="true"
      >
        <span className="mono text-[13px] leading-none">‹›</span>
      </div>

      {/* Etiquetas y metadatos superpuestos */}
      <div className="absolute top-5 left-5 right-5 md:top-6 md:left-6 md:right-6 flex justify-between pointer-events-none">
        <span className="mono text-[10px] uppercase tracking-[0.3em] bg-paper text-ink px-3 py-1.5">
          Antes
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.3em] bg-ink text-paper border border-paper px-3 py-1.5">
          Después
        </span>
      </div>

      <div className="absolute bottom-5 left-5 right-5 md:bottom-6 md:left-6 md:right-6 flex flex-wrap justify-between gap-2 pointer-events-none">
        <span className="mono text-[10px] uppercase tracking-[0.22em] bg-paper/90 px-3 py-1.5">
          Terraza · 24 m² · orientación SO
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.22em] bg-paper/90 px-3 py-1.5">
          IA · render simulado
        </span>
      </div>
    </div>
  );
}
