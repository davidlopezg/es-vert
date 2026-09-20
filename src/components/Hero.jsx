import { useRef, useState } from 'react';

// Hero editorial denso: eyebrow + título + subtítulo + indicador de
// pasos numerado + dropzone + preview de SKUs que recibirás + colofón.
// Sin curvas (las quitamos en esta vuelta). Padding recortado al 50 %.

const COLOPHON =
  'Estudio Es-Vert · Diseño 3D · Montaje profesional · Barcelona · Desde 2018';

const PREVIEW = [
  { tag: 'Pérgola',     name: 'Madera Kave Home',  price: 1250, mark: 'estructura' },
  { tag: 'Suelo',       name: 'Iroko · m²',        price:  78,  mark: 'suelo' },
  { tag: 'Vegetación',  name: 'Olivo Vidri · Ø40',  price:  65,  mark: 'verde' },
  { tag: 'Iluminación', name: 'LED cálida',         price:  320, mark: 'luz' },
];

const STEPS = [
  { n: '01', label: 'Tu foto' },
  { n: '02', label: 'Itera con la IA' },
  { n: '03', label: 'Validamos en visita' },
];

const eur0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

export default function Hero({ onDemo, onFile }) {
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState('idle');
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

      {/* ── Bloque titular ──────────────────────────────────────────── */}
      <div className="px-5 md:px-10 lg:px-12 pt-5 md:pt-8 pb-5 md:pb-7 border-b border-ink/10">
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

        {/* Indicador de pasos numerado — densidad editorial */}
        <div className="anim-fade-up stagger-3 mt-6 md:mt-8 pt-5 border-t border-ink/10 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-baseline gap-3">
              <span className={`font-mono text-[14px] tabular-nums ${i === 0 ? 'text-accent' : 'text-mute'}`}>
                ●
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink">
                {s.n} ·
              </span>
              <span className="font-sans text-[15px] text-ink/85">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bloque subtítulo + dropzone + preview ──────────────────── */}
      <div className="px-5 md:px-10 lg:px-12 py-5 md:py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

        {/* Subtítulo (columna izquierda en desktop) */}
        <div className="lg:col-span-5 lg:pr-4 anim-fade-up stagger-3 flex flex-col justify-center">
          <p className="font-serif text-xl md:text-2xl lg:text-[1.65rem] leading-[1.25] text-ink">
            Tú decides el diseño<br />
            <span className="text-ink/65">y nosotros hacemos todo lo demás.</span>
          </p>
          <p className="mt-4 font-sans text-sm md:text-[15px] leading-snug text-ink/60 max-w-md">
            Mira cómo puede quedar tu espacio y descubre cuánto cuesta.
            Presupuesto calculado a partir de productos y precios reales —
            nada de SKUs inventados.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <span>· Sin compromiso</span>
            <span>· Visita incluida</span>
            <span>· Catálogo real</span>
          </div>
        </div>

        {/* Dropzone (columna derecha en desktop) */}
        <div className="lg:col-span-7 anim-fade-up stagger-4">
          <div className="bg-white border border-ink/15 overflow-hidden">
            <div className="px-5 md:px-7 pt-4 pb-3 flex items-baseline justify-between border-b border-ink/10">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent">
                Paso 01 · Tu foto
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                24 m² · orientación SO
              </span>
            </div>

            <div className="px-5 md:px-7 py-6 md:py-8">
              <div
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={`border-2 border-dashed px-5 py-8 md:py-10 text-center transition-colors ${
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
                <p className="font-serif text-xl md:text-2xl leading-snug text-ink mb-5">
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
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
                  jpg · png · heic · heif · webp · máx 20 MB
                </p>
              </div>
            </div>
          </div>

          {/* Preview de SKUs — bloque de densidad editorial */}
          <div className="mt-5 md:mt-6 anim-fade-up stagger-5">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-mute">
                Tu presupuesto incluirá →
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
                4 categorías
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PREVIEW.map((p) => (
                <div key={p.tag} className="bg-white border border-ink/10 p-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute">
                      {p.mark}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-ink">
                      {eur0.format(p.price)} €
                    </span>
                  </div>
                  <div className="font-sans text-[13px] leading-snug text-ink">
                    {p.tag}
                  </div>
                  <div className="font-sans text-[11px] text-mute leading-snug">
                    {p.name}
                  </div>
                </div>
              ))}
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
