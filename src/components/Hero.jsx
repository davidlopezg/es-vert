import { useRef, useState } from 'react';

// Estado INICIAL: titular gigante + dropzone masivo.
// Soporta drag&drop real Y selección de archivo (que se usará como
// "antes" en el slider de Result). El botón "Probar demo" salta
// directamente al estado Result con los mocks.

export default function Hero({ onDemo, onFile }) {
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'reading' | 'done'
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type?.startsWith('image/')) return;
    setPhase('reading');
    // Pequeño delay para que se vea el estado de carga.
    setTimeout(() => {
      onFile(file);
      setPhase('done');
    }, 700);
  };

  return (
    <section className="flex-1 flex flex-col">
      {/* --- Bloque titular --------------------------------------------- */}
      <div className="px-5 md:px-12 pt-8 md:pt-14 pb-6 md:pb-10 border-b border-ink">
        <div className="flex items-center gap-4 mb-6 md:mb-10">
          <span className="mono text-[10px] uppercase tracking-[0.28em]">Edición N° 001</span>
          <span className="h-px flex-1 bg-ink"></span>
          <span className="mono text-[10px] uppercase tracking-[0.28em]">Verano 2025</span>
        </div>

        <h1 className="font-serif leading-[0.9] tracking-[-0.045em] text-[16vw] md:text-[12rem] lg:text-[14rem] font-light">
          <span className="block">TU TERRAZA,</span>
          <span className="block">
            <em className="italic font-normal">REDISEÑADA.</em>
          </span>
        </h1>
      </div>

      {/* --- Rejilla 4 + 8 --------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0">
        {/* Columna izquierda: subtítulo */}
        <div className="md:col-span-4 p-5 md:p-10 lg:p-12 border-b md:border-b-0 md:border-r border-ink flex flex-col justify-between min-h-[180px]">
          <p className="font-serif text-2xl md:text-3xl lg:text-[2rem] leading-[1.05] max-w-sm">
            La IA no inventa: diseña con <em className="italic">productos reales</em> que puedes comprar.
          </p>
          <div className="mt-8 md:mt-12">
            <p className="mono text-[10px] uppercase tracking-[0.22em] leading-[1.6] opacity-70">
              Mira cómo puede quedar tu espacio y descubre cuánto cuesta.<br />
              Presupuesto calculado a partir de productos y precios reales.
            </p>
          </div>
        </div>

        {/* Columna derecha: dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const file = e.dataTransfer.files?.[0];
            handleFile(file);
          }}
          className={`md:col-span-8 relative transition-colors duration-150 ${
            drag ? 'bg-ink text-paper' : 'bg-paper text-ink'
          }`}
        >
          <div className="absolute inset-4 md:inset-8 border border-dashed border-current flex flex-col items-center justify-center text-center p-6 md:p-12">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <span className="mono text-[10px] uppercase tracking-[0.32em] mb-4 opacity-70">
              {phase === 'reading' ? '· Cargando ·'
                : drag ? '· Suelta aquí ·'
                : '· Paso 01 · Sube una foto ·'}
            </span>

            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-3xl">
              {phase === 'reading'
                ? <>Detectando productos<br /><em className="italic">compatibles…</em></>
                : <>Arrastra una foto de<br /><em className="italic">tu terraza</em> al cuadrado.</>
              }
            </h2>

            <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={phase === 'reading'}
                className="mono text-[11px] uppercase tracking-[0.25em] border border-current px-5 py-3 hover:bg-current hover:text-paper transition-colors disabled:opacity-40"
              >
                Seleccionar archivo
              </button>
              <span className="mono text-[10px] uppercase tracking-[0.22em] opacity-50">o</span>
              <button
                type="button"
                onClick={onDemo}
                disabled={phase === 'reading'}
                className="mono text-[11px] uppercase tracking-[0.25em] underline underline-offset-4 hover:no-underline disabled:opacity-40"
              >
                Probar demo →
              </button>
            </div>

            <p className="mono text-[10px] uppercase tracking-[0.25em] mt-6 md:mt-10 opacity-50">
              jpg · png · heic · máx 20 MB
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
