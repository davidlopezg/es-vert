// Cabecera a dos bandas: contacto arriba (taupe), logo + estado abajo (cream).
// El logo "ÉS—VERT" sigue la radiografía: ES en mute, em-dash en ink,
// VERT en accent (verde corporativo).

export default function Header({ stage, onHome }) {
  const status =
    stage === 'hero' ? 'Demo abierta · N° 001' : 'Diseño en curso · N° 001';

  return (
    <>
      {/* Banda superior: contacto + ubicación + idiomas */}
      <div className="bg-taupe text-cream text-[10px] md:text-[11px] uppercase tracking-[0.22em] px-4 md:px-8 py-2 flex flex-wrap items-center justify-between gap-y-1 gap-x-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <a href="mailto:hola@es-vert.com" className="hover:underline underline-offset-4">
            hola@es-vert.com
          </a>
          <span className="hidden sm:inline">+34 932 142 142</span>
          <span className="hidden md:inline">Carrer de Provença 248 · Barcelona</span>
        </div>
        <div className="flex items-center gap-x-5">
          <span className="hidden md:inline">L–V 9:00 — 18:00</span>
          <span className="space-x-2">
            <span>es</span>
            <span className="opacity-50">·</span>
            <span className="opacity-50">cat</span>
            <span className="opacity-50">·</span>
            <span className="opacity-50">en</span>
          </span>
        </div>
      </div>

      {/* Banda principal: logo + estado */}
      <header className="bg-cream border-b border-ink/10 px-4 md:px-8 py-4 md:py-5 flex justify-between items-center gap-6">
        <button
          type="button"
          onClick={onHome}
          className="text-[1.4rem] md:text-2xl tracking-tight leading-none font-medium"
          aria-label="Es-Vert · inicio"
        >
          <span className="text-mute">és</span>
          <span className="text-ink/40 mx-[3px]">—</span>
          <span className="text-accent">vert</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          <span className="text-[11px] uppercase tracking-[0.22em] text-mute">
            {status}
          </span>
          {stage === 'result' && (
            <button
              type="button"
              onClick={onHome}
              className="border border-ink/30 text-ink px-4 py-2 text-[11px] uppercase tracking-[0.22em] hover:bg-ink hover:text-cream transition-colors"
            >
              ← Nuevo proyecto
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onHome}
          className="md:hidden border border-ink/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] hover:bg-ink hover:text-cream transition-colors"
        >
          {stage === 'hero' ? 'Demo' : 'Inicio'}
        </button>
      </header>
    </>
  );
}
