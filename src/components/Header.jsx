// Cabecera discreta, una sola línea. Logo monograma a la izquierda,
// estado a la derecha. Sin barra superior competiendo.

export default function Header({ stage, onHome }) {
  const status =
    stage === 'hero' ? 'Demo · N° 001' : 'Diseño · N° 001';

  return (
    <header className="border-b border-ink/10 px-5 md:px-10 py-4 md:py-5 flex justify-between items-center gap-6 anim-fade-up stagger-0">
      <button
        type="button"
        onClick={onHome}
        className="font-serif text-[1.45rem] md:text-2xl tracking-tight leading-none btn-lift"
        aria-label="Es-Vert · inicio"
      >
        <span className="text-mute">ÉS</span>
        <span className="text-ink/30 mx-[3px]">—</span>
        <span className="text-accent">VERT</span>
      </button>

      <div className="flex items-center gap-4 md:gap-6">
        <span className="hidden md:inline font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
          {status}
        </span>
        {stage === 'result' && (
          <button
            type="button"
            onClick={onHome}
            className="font-mono text-[11px] uppercase tracking-[0.22em] border border-ink/30 text-ink px-3 md:px-4 py-2 hover:bg-ink hover:text-cream btn-lift"
          >
            ← Nuevo
          </button>
        )}
      </div>
    </header>
  );
}
