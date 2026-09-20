// Cabecera con logo + meta + botón hamburguesa arriba a la derecha.

export default function Header({ stage, onHome, onMenu }) {
  return (
    <header className="px-5 md:px-10 py-3 md:py-4 flex justify-between items-center gap-6 anim-fade-up stagger-0 border-b border-ink/15 relative z-40">
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
          <span>{stage === 'hero' ? 'Demo · N° 001' : 'Diseño · N° 001'}</span>
          <span className="text-mute/60">·</span>
          <span>Est. 2018 · BCN</span>
        </span>
        {stage === 'result' && (
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-ink/40 text-ink px-3 py-1.5 hover:bg-ink hover:text-cream btn-lift hidden sm:inline-flex"
          >
            ← Nuevo
          </button>
        )}
        {/* Botón hamburguesa */}
        <button
          type="button"
          onClick={onMenu}
          aria-label="Abrir menú"
          className="font-mono w-10 h-10 inline-flex flex-col items-center justify-center gap-[5px] border border-ink/40 text-ink hover:bg-ink hover:text-cream transition-colors"
        >
          <span className="block w-4 h-px bg-current"></span>
          <span className="block w-4 h-px bg-current"></span>
          <span className="block w-4 h-px bg-current"></span>
        </button>
      </div>
    </header>
  );
}
