import { eur } from '../data/products.js';

// Recibo editorial modernizado: serif fuera, sin mono, todo Montserrat.
// Dot-leaders y separadores con hairline para reducir peso visual.
// Disclaimer reescrito (honesto sobre el borrador IA + visita técnica).
// Mini-CTA discreto al pie, sin sección propia.

function fmt(n) {
  return eur.format(n) + ' €';
}

function Row({ line }) {
  return (
    <li className="py-4 border-b border-ink/10 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-sans text-[15px] md:text-base leading-snug text-ink">
          {line.name}
        </h3>
        <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-mute tabular-nums whitespace-nowrap">
          {line.qty}×
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span
          className="flex-1 border-b border-dotted border-ink/30 translate-y-[-3px]"
          aria-hidden="true"
        ></span>
        <span className="font-sans text-sm tabular-nums text-ink">
          {fmt(line.price * line.qty)}
        </span>
      </div>
    </li>
  );
}

export default function Receipt({ lines }) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  return (
    <div className="flex flex-col min-h-0">
      <header className="px-5 md:px-6 pt-6 pb-5 border-b border-ink/15">
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-mute mb-2">
          Recibo · 001 · Borrador
        </p>
        <h2 className="font-sans font-light text-2xl md:text-[1.7rem] leading-[1.1] tracking-tight">
          Presupuesto<br />
          <em className="italic font-medium">base estimado</em>
        </h2>
      </header>

      {lines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <p className="font-sans italic text-center text-mute text-sm">
            Recibo vacío.<br />Pide un cambio para empezar.
          </p>
        </div>
      ) : (
        <ul className="px-5 md:px-6 py-2">
          {lines.map(line => <Row key={line.id} line={line} />)}
        </ul>
      )}

      <div className="mt-auto border-t border-ink px-5 md:px-6 py-6">
        <div className="flex items-baseline justify-between">
          <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-mute">
            Total estimado
          </span>
          <span className="font-sans font-medium text-3xl md:text-4xl tabular-nums">
            {fmt(subtotal)}
          </span>
        </div>

        <p className="mt-5 font-sans italic text-[11px] md:text-xs leading-[1.55] text-mute">
          *Borrador generado por IA. Sujeto a validación y visita técnica.
          Precios orientativos basados en catálogo público; el precio final
          se cierra tras la visita.*
        </p>

        <div className="mt-5 pt-5 border-t border-ink/10">
          <button
            type="button"
            className="font-sans text-[11px] uppercase tracking-[0.25em] text-ink underline underline-offset-4 hover:no-underline"
          >
            Reservar visita técnica →
          </button>
        </div>
      </div>
    </div>
  );
}
