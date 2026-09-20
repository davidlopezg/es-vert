import { useCallback, useEffect, useRef, useState } from 'react';

// Slider Antes/Después con pointer events y feedback de estado de
// generación de la imagen. Si la URL de la IA falla (rate-limit,
// red, CORS), la <img> cae a `onError` y marcamos estado `error`
// para mostrar un botón "Reintentar" sobre el chrome.

function ImageLayer({ src, alt, side, onState }) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover"
      onLoad={() => onState(side, 'ok')}
      onError={() => onState(side, 'error')}
    />
  );
}

export default function BeforeAfterSlider({
  before,
  after,
  label = 'terraza',
  regenerating = false,
  onRetry,
}) {
  const [position, setPosition] = useState(50);
  const [imgState, setImgState] = useState({ before: 'loading', after: 'loading' });
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

  // Reset estado cuando cambia la URL de la imagen.
  useEffect(() => {
    setImgState({ before: 'loading', after: 'loading' });
  }, [before, after]);

  const handleImgState = (side, state) =>
    setImgState(prev => ({ ...prev, [side]: state }));

  const afterFailed = imgState.after === 'error';

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
      <ImageLayer
        src={after}
        alt={`${label} · después`}
        side="after"
        onState={handleImgState}
      />

      {/* Capa recortada "antes" */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${insetRight}% 0 0)` }}
      >
        <ImageLayer
          src={before}
          alt={`${label} · antes`}
          side="before"
          onState={handleImgState}
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
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] bg-cream/95 text-ink px-3 py-1.5">
          Antes
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] bg-ink/90 text-cream border border-paper px-3 py-1.5">
          Después
        </span>
      </div>

      {/* Pie con metadatos + estado de generación */}
      <div className="absolute bottom-5 left-5 right-5 md:bottom-6 md:left-6 md:right-6 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream/95 text-ink px-3 py-1.5">
          Terraza · 24 m² · orientación SO
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          {regenerating && (
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-accent/95 text-cream px-3 py-1.5 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-cream rounded-full animate-pulse" />
              IA · regenerando
            </span>
          )}
          {!regenerating && afterFailed && onRetry && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRetry}
                className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream text-ink border border-ink/40 px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors"
              >
                ↻ Reintentar
              </button>
              <a
                href={after}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream text-mute border border-ink/30 px-3 py-1.5 hover:text-ink transition-colors"
                title="Abre la URL de la IA en una pestaña nueva para diagnosticar"
              >
                ↗ Ver URL
              </a>
            </div>
          )}
          {!regenerating && !afterFailed && (
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream/95 text-mute px-3 py-1.5">
              {afterFailed ? 'IA · sin conexión' : 'IA · render'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
