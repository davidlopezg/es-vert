// Cabecera tipo masthead editorial. Una sola línea, hairline inferior.
// En mobile se pliega en dos líneas sin romper la rejilla.

export default function Header({ stage, onHome }) {
  const status = stage === 'hero' ? 'N° 001 · Demo abierta' : 'N° 001 · Diseño en curso';

  return (
    <header className="border-b border-ink px-4 md:px-6 py-3 mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] grid grid-cols-3 items-center gap-2">
      <button
        type="button"
        onClick={onHome}
        className="justify-self-start font-serif text-base md:text-lg normal-case tracking-tight"
        aria-label="Volver al inicio · Es-Vert"
      >
        <span className="font-medium">Es</span>
        <span className="mx-[1px]">—</span>
        <span className="font-medium">Vert</span>
      </button>
      <div className="justify-self-center text-center hidden sm:block">{status}</div>
      <div className="justify-self-end text-right">
        <span className="hidden md:inline">Barcelona · 41°23′N 2°09′E</span>
        <span className="md:hidden">{status}</span>
      </div>
    </header>
  );
}
