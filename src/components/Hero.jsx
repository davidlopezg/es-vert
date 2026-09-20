import { useRef, useState } from 'react';

// Hero estado INICIAL — grid 50/50 con cabecera + dropzone card.
// La card derecha usa el truco del brief: rounded-tl asimétrico
// (solo esquina superior izquierda, las otras tres rectas).
// Todo el "relleno editorial" se queda como crédito editorial:
// masthead superior, strip tipográfico, subtítulo en cursiva suave.

const TRUST_STRIP =
  'Diseño 3D · Montaje profesional · Presupuesto real · Sin compromiso';

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
    <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
      {/* ── Columna izquierda: titular + subtítulo + crédito ───────── */}
      <div className="flex flex-col justify-between p-6 md:p-10 lg:p-12 xl:p-16 border-b lg:border-b-0 lg:border-r border-ink/10 min-h-[420px]">
        {/* Masthead */}
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-mute">
            Estudio
          </span>
          <span className="h-px flex-1 bg-ink/15"></span>
          <span className="text-[11px] uppercase tracking-[0.25em] text-mute">
            Est. 2018 · Barcelona
          </span>
        </div>

        {/* Titular */}
        <h1 className="font-sans tracking-[-0.035em] leading-[0.92] text-[16vw] md:text-[7rem] xl:text-[8.5rem] mt-12 lg:mt-0">
          <span className="block font-extralight text-ink">Tu terraza,</span>
          <span className="block italic font-medium">rediseñada.</span>
        </h1>

        {/* Subtítulo + crédito de credibilidad */}
        <div className="mt-10 lg:mt-14 max-w-xl">
          <p className="font-sans text-lg md:text-xl text-ink/85 leading-[1.45]">
            Tú decides el diseño y nosotros hacemos todo lo demás.
          </p>
          <div className="mt-8 pt-6 border-t border-ink/15">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-mute">
              {TRUST_STRIP}
            </p>
          </div>
        </div>
      </div>

      {/* ── Columna derecha: tarjeta blanca con dropzone ──────────── */}
      <div className="bg-cream p-6 md:p-10 lg:p-12 xl:p-16 flex items-center">
        <div className="w-full bg-white border border-ink/10 radius-tl-asim md:radius-tl-asim-md overflow-hidden">
          {/* Cabecera de la card */}
          <div className="px-6 md:px-8 pt-6 md:pt-8 pb-4">
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent mb-3">
              Paso 01 · Tu foto
            </p>
            <h2 className="font-sans font-extralight text-2xl md:text-[1.85rem] leading-[1.1] tracking-tight">
              Empieza por aquí.<br />
              <span className="text-ink/65">
                Sube una foto y mira el resultado en segundos.
              </span>
            </h2>
          </div>

          {/* Dropzone */}
          <div className="px-6 md:px-8 pb-6 md:pb-8">
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`border-2 border-dashed p-6 md:p-8 text-center transition-colors ${
                drag
                  ? 'border-accent bg-accent/[0.04]'
                  : 'border-ink/25 bg-cream/50'
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <p className="font-sans text-ink/80 text-base md:text-lg mb-5">
                {drag
                  ? 'Suelta aquí ↓'
                  : phase === 'reading'
                  ? 'Detectando productos compatibles…'
                  : 'Arrastra una foto de tu terraza'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={phase === 'reading'}
                  className="border border-ink/40 text-ink px-5 py-3 text-[12px] uppercase tracking-[0.22em] hover:bg-ink hover:text-cream transition-colors disabled:opacity-40"
                >
                  Seleccionar archivo
                </button>
                <span className="text-[11px] uppercase tracking-[0.22em] text-mute">o</span>
                <button
                  type="button"
                  onClick={onDemo}
                  disabled={phase === 'reading'}
                  className="text-[12px] uppercase tracking-[0.22em] text-ink underline underline-offset-4 hover:no-underline disabled:opacity-40"
                >
                  Probar demo →
                </button>
              </div>
              <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-mute">
                jpg · png · heic · máx 20 MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
