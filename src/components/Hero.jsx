import { useRef, useState } from 'react';

// Hero centrado en conversión: CTA principal verde grande
// "Subir foto de mi terraza" + secundaria "O prueba con una demo".
// Paso 02 simulado con checkmarks (lo que pasa tras subir).
// Sin dropzone-card-como-formulario; toda la fricción desaparece.

const COLOPHON =
  'Estudio Es-Vert · Diseño 3D · Montaje profesional · Barcelona · Desde 2018';

const WHAT_HAPPENS = [
  { id: '01', text: 'Detectamos productos reales aplicables a tu superficie' },
  { id: '02', text: 'Calculamos precio unitario real contra nuestro catálogo' },
  { id: '03', text: 'Renderizamos el antes/después con la composición propuesta' },
  { id: '04', text: 'Iteramos contigo hasta dar con el diseño que quieres' },
];

export default function Hero({ onDemo, onFile }) {
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [filename, setFilename] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type?.startsWith('image/')) return;
    setFilename(file.name);
    setPhase('reading');
    setTimeout(() => {
      onFile(file);
      setPhase('done');
    }, 700);
  };

  return (
    <section className="flex-1 flex flex-col min-h-0">

      {/* ── Bloque titular ─────────────────────────────────────────── */}
      <div className="px-5 md:px-10 lg:px-12 pt-5 md:pt-8 pb-5 md:pb-7 border-b border-ink/15">
        <div className="anim-fade-up stagger-1 grid grid-cols-12 gap-3 mb-5 md:mb-8">
          <span className="col-span-4 font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
            01 · Tu terraza
          </span>
          <span className="col-span-8 h-px self-center bg-ink/15"></span>
          <span className="col-span-6 font-mono text-[11px] uppercase tracking-[0.28em] text-mute md:text-right">
            Estudio · Barcelona · 2018
          </span>
        </div>

        <h1 className="anim-fade-up stagger-2 font-serif tracking-[-0.035em] leading-[0.92] text-[14vw] md:text-[7rem] lg:text-[9rem] xl:text-[11rem] text-ink">
          <span className="block font-extralight">Tu terraza,</span>
          <span className="block italic font-medium">rediseñada.</span>
        </h1>
      </div>

      {/* ── Bloque conversión + Paso 02 simulado ──────────────────── */}
      <div className="px-5 md:px-10 lg:px-12 py-5 md:py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

        {/* Columna izquierda: subtítulo */}
        <div className="lg:col-span-5 lg:pr-4 anim-fade-up stagger-3 flex flex-col justify-center">
          <p className="font-serif text-xl md:text-2xl lg:text-[1.65rem] leading-[1.25] text-ink">
            Tú decides el diseño<br />
            <span className="text-mute">y nosotros hacemos todo lo demás.</span>
          </p>
          <p className="mt-4 font-sans text-[15px] leading-snug text-mute max-w-md">
            Sube una foto de tu terraza y en menos de 1 minuto te enseñamos
            cómo puede quedar, con precios reales por producto y sin inventar SKUs.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <span>· Sin compromiso</span>
            <span>· Visita incluida</span>
            <span>· Catálogo real</span>
          </div>
        </div>

        {/* Columna derecha: CTA grande + drag-over + Paso 02 */}
        <div className="lg:col-span-7 anim-fade-up stagger-4 space-y-4">

          {/* CTA principal */}
          <div className="bg-white border border-ink/15 overflow-hidden">
            <div className="px-5 md:px-7 pt-4 pb-3 flex items-baseline justify-between border-b border-ink/10">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">
                Paso 01 · Tu foto
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                24 m² · orientación SO
              </span>
            </div>

            <div className="px-5 md:px-7 py-6">
              {/* Zona drag-over (toda la fila) */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`transition-colors ${
                  drag
                    ? 'bg-accent/[0.06]'
                    : 'bg-cream/40'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />

                {/* Botón verde grande — CTA principal */}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={phase === 'reading'}
                  className="w-full bg-accent hover:bg-accent/90 disabled:opacity-60 text-cream px-6 py-5 btn-lift disabled:cursor-wait"
                >
                  <span className="block font-mono text-[13px] md:text-[14px] uppercase tracking-[0.18em] font-medium">
                    {phase === 'reading'
                      ? 'Detectando productos…'
                      : phase === 'done'
                      ? `✓  ${filename || 'Foto cargada'}`
                      : 'Subir foto de mi terraza'}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.25em] mt-1 opacity-85">
                    Máx. 10 MB · JPG, PNG, HEIC, WEBP
                  </span>
                </button>

                {/* Opción secundaria — demo */}
                <p className="text-center mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
                  O{' '}
                  <button
                    type="button"
                    onClick={onDemo}
                    className="text-ink underline underline-offset-4 hover:no-underline hover:text-accent transition-colors btn-lift"
                  >
                    prueba con una demo
                  </button>
                  {' '}— sin subir archivo.
                </p>
              </div>
            </div>
          </div>

          {/* Paso 02 simulado — qué pasa después */}
          <div className="bg-white border border-ink/15 overflow-hidden">
            <div className="px-5 md:px-7 pt-4 pb-3 flex items-baseline justify-between border-b border-ink/10">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
                Paso 02 · Tu presupuesto está listo
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
                ↓ en menos de 1 minuto
              </span>
            </div>

            <div className="px-5 md:px-7 py-5">
              <ul className="space-y-3">
                {WHAT_HAPPENS.map((w) => (
                  <li key={w.id} className="flex items-start gap-3">
                    <span className="font-mono text-[11px] tabular-nums text-accent mt-0.5 shrink-0">
                      ✓
                    </span>
                    <div className="flex-1 flex items-baseline gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute shrink-0">
                        {w.id}
                      </span>
                      <span className="font-sans text-[15px] leading-snug text-ink">
                        {w.text}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Colofón compacto al pie */}
      <div className="px-5 md:px-10 lg:px-12 py-3 border-t border-ink/10 anim-fade-up stagger-5">
        <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-mute text-center md:text-left">
          {COLOPHON}
        </p>
      </div>
    </section>
  );
}
