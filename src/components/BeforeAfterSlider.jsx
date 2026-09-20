import { useCallback, useEffect, useRef, useState } from 'react';

// Slider Antes/Después con:
//  - Pointer events (mouse + touch unificados)
//  - Recorte del "antes" con clip-path
//  - Overlay de carga cuando pending es true
//  - Banner de error visible cuando la API falla
//  - Botón reintentar + Copiar al portapapeles (diagnóstico en móvil)

async function copyText(text) {
  try {
    await navigator.clipboard?.writeText(text);
    return true;
  } catch {
    // Fallback para navegadores sin Clipboard API
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

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

function Spinner() {
  return (
    <div className="inline-block w-10 h-10 border-[2.5px] border-ink/15 border-t-ink rounded-full animate-spin" />
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[11px] uppercase tracking-[0.22em] border border-cream/40 px-3 py-1.5 hover:bg-cream hover:text-ink transition-colors"
    >
      {copied ? '✓ Copiado' : '⧉ Copiar error'}
    </button>
  );
}

export default function BeforeAfterSlider({
  before,
  after,
  label = 'terraza',
  pending = false,
  error = null,
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
      <div className="absolute top-5 left-5 right-5 md:top-6 md:left-6 md:right-6 flex justify-between pointer-events-none z-10">
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] bg-cream/95 text-ink px-3 py-1.5">
          Antes
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.3em] bg-ink/90 text-cream border border-paper px-3 py-1.5">
          Después
        </span>
      </div>

      {/* Overlay: spinner de carga */}
      {pending && (
        <div className="absolute inset-0 bg-cream/90 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center px-6 max-w-sm">
            <Spinner />
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.28em] text-ink">
              Generando tu terraza
            </p>
            <p className="mt-2 font-sans text-[13px] text-mute leading-snug">
              La IA está dibujando con tus productos y tu foto.
              Espera 5–30 s según el provider.
            </p>
          </div>
        </div>
      )}

      {/* Banner de error (visible siempre que haya error y no esté cargando) */}
      {!pending && error && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-ink/95 text-cream backdrop-blur-sm">
          <div className="px-4 md:px-6 py-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-cream/60">
                Error de generación
              </span>
              <code className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream/45 truncate">
                {error.length > 80 ? error.slice(0, 80) + '…' : error}
              </code>
            </div>
            <p className="font-sans text-[13px] leading-snug">
              {error}
            </p>
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-mono text-[11px] uppercase tracking-[0.22em] border border-cream/40 px-3 py-1.5 hover:bg-cream hover:text-ink transition-colors"
                >
                  ↻ Reintentar
                </button>
              )}
              <CopyButton text={error} />
              <a
                href={typeof window !== 'undefined' ? `mailto:?subject=Es-Vert%20error&body=${encodeURIComponent(error)}` : '#'}
                className="font-mono text-[11px] uppercase tracking-[0.22em] border border-cream/40 px-3 py-1.5 hover:bg-cream hover:text-ink transition-colors"
              >
                ✉ Enviar por email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Pie con metadatos */}
      <div className="absolute bottom-5 left-5 right-5 md:bottom-6 md:left-6 md:right-6 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream/95 text-ink px-3 py-1.5">
          Terraza · 24 m² · orientación SO
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          {!pending && afterFailed && !error && onRetry && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRetry}
                className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream text-ink border border-ink/40 px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors"
              >
                ↻ Reintentar
              </button>
              {after && (
                <a
                  href={after}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream text-mute border border-ink/30 px-3 py-1.5 hover:text-ink transition-colors"
                  title="Abre la URL de la IA en una pestaña nueva"
                >
                  ↗ Ver URL
                </a>
              )}
            </div>
          )}
          {!pending && !error && !afterFailed && (
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] bg-cream/95 text-mute px-3 py-1.5">
              IA · render
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
