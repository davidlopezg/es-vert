// Cabecera compacta: monograma ÉS—VERT + meta a la derecha.
// Padding recortado para sumar densidad al global.

export default function Header({ stage, onHome }) {
  const status =
    stage === 'hero' ? 'Demo · N° 001' : 'Diseño · N° 001';

  return (
    <header className="px-5 md:px-10 py-3 md:py-4 flex justify-between items-center gap-6 anim-fade-up stagger-0 border-b border-ink/15">
      <button
        type="button"
        onClick={onHome}
        className="font-serif text-[1.35rem] md:text-[1.55rem] tracking-tight leading-none btn-lift"
        aria-label="Es-Vert · inicio"
      >
        <span className="text-mute">ÉS</span>
        <span className="text-ink/30 mx-[3px]">—</span>
        <span className="text-accent">VERT</span>
      </button>

      <div className="flex items-center gap-3 md:gap-5">
        <span className="hidden md:flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
          <span>{status}</span>
          <span className="text-mute/50">·</span>
          <span>Est. 2018 · BCN</span>
        </span>
        <span className="md:hidden font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
          {status}
        </span>
        {stage === 'result' && (
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-ink/40 text-ink px-3 py-1.5 hover:bg-ink hover:text-cream btn-lift"
          >
            ← Nuevo
          </button>
        )}
      </div>
    </header>
  );
}
