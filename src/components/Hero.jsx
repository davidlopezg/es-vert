import { useRef, useState } from 'react';

// Composición editorial monocolumna: eyebrow → título → subtítulo
// (la frase del usuario) → dropzone con curva asimétrica → colofón.
// Sin franja de confianza, sin secciones extras.

const COLOPHON =
  'Estudio Es-Vert · Diseño 3D · Montaje profesional · Barcelona · Desde 2018';

export default function Hero({ onDemo, onFile }) {
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'reading'
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type?.startsWith('image/')) return;
    setPhase('reading');
    setTimeout(() => {
      onFile(file);
      setPhase('done');
    }, 700);
  };

  return (
    <section className="flex-1 flex flex-col min-h-0">
      {/* ── Bloque titular ─────────────────────────────────────────── */}
      <div className="px-5 md:px-10 lg:px-16 pt-10 md:pt-16 lg:pt-20 pb-8 md:pb-10 border-b border-ink/10">
        {/* Eyebrow */}
        <div className="anim-fade-up stagger-1 flex items-baseline gap-4 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
            01 · Tu terraza
          </span>
          <span className="h-px flex-1 bg-ink/15"></span>
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
            Estudio · Barcelona
          </span>
        </div>

        {/* Titular */}
        <h1 className="anim-fade-up stagger-2 font-serif tracking-[-0.035em] leading-[0.92] text-[16vw] md:text-[8.5rem] lg:text-[11rem] xl:text-[13rem] text-ink">
          <span className="block font-extralight">Tu terraza,</span>
          <span className="block italic font-medium">rediseñada.</span>
        </h1>
      </div>

      {/* ── Bloque subtítulo + dropzone + colofón ──────────────────── */}
      <div className="px-5 md:px-10 lg:px-16 py-10 md:py-14 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Subtítulo (izquierda en desktop) */}
          <div className="lg:col-span-5 anim-fade-up stagger-3">
            <p className="font-sans text-lg md:text-xl lg:text-[1.4rem] text-ink/85 leading-[1.4] max-w-md">
              Tú decides el diseño y nosotros hacemos todo lo demás.
            </p>
            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
              Mira cómo puede quedar tu espacio y descubre cuánto cuesta.
              Presupuesto calculado a partir de productos y precios reales.
            </p>
          </div>

          {/* Dropzone (derecha en desktop) */}
          <div className="lg:col-span-7 anim-fade-up stagger-4">
            <div className="bg-white border border-ink/10 radius-tl-asim md:radius-tl-asim-md overflow-hidden">
              <div className="px-6 md:px-8 pt-6 pb-4 flex items-baseline gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">
                  Paso 01
                </span>
                <span className="h-px flex-1 bg-ink/10"></span>
                <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
                  Tu foto
                </span>
              </div>

              <div className="px-6 md:px-8 pb-6 md:pb-8">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    handleFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`border-2 border-dashed p-8 md:p-12 text-center transition-colors ${
                    drag
                      ? 'border-accent bg-accent/[0.04]'
                      : 'border-ink/25 bg-cream/40'
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <p className="font-serif text-2xl md:text-[1.7rem] leading-snug text-ink mb-6">
                    {drag
                      ? <>Suelta aquí <span className="text-accent">↓</span></>
                      : phase === 'reading'
                      ? <>Detectando productos <em className="italic">compatibles…</em></>
                      : <>Arrastra una foto de <em className="italic">tu terraza</em></>}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      disabled={phase === 'reading'}
                      className="font-mono text-[11px] uppercase tracking-[0.25em] border border-ink/40 text-ink px-5 py-3 hover:bg-ink hover:text-cream btn-lift disabled:opacity-40"
                    >
                      Seleccionar archivo
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute">o</span>
                    <button
                      type="button"
                      onClick={onDemo}
                      disabled={phase === 'reading'}
                      className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink underline underline-offset-4 hover:no-underline btn-lift disabled:opacity-40"
                    >
                      Probar demo →
                    </button>
                  </div>
                  <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                    jpg · png · heic · máx 20 MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colofón editorial — una sola línea al pie del hero */}
        <div className="mt-12 md:mt-16 pt-6 border-t border-ink/10 anim-fade-up stagger-4">
          <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-mute text-center md:text-left">
            {COLOPHON}
          </p>
        </div>
      </div>
    </section>
  );
}
