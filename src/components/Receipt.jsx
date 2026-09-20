import { eur } from '../data/products.js';

// Recibo editorial: cada línea muestra índice + nombre + subtotal,
// luego desglose (qty × unit). Total en serif Fraunces grande.
// Footer cierra con dos CTAs: visita técnica y descarga PDF.

function fmt(n) {
  return eur.format(n) + ' €';
}

function Row({ line, idx }) {
  return (
    <li className="py-3 border-b border-ink/10 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] tabular-nums text-mute">
          {String(idx + 1).padStart(2, '0')}
        </span>
        <h3 className="flex-1 font-sans text-[14px] md:text-[15px] leading-snug text-ink">
          {line.name}
        </h3>
        <span className="font-mono text-[13px] tabular-nums text-ink whitespace-nowrap">
          {fmt(line.price * line.qty)}
        </span>
      </div>
      <div className="mt-0.5 ml-6 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
          {line.qty} × {fmt(line.price)}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-mute">
          sin IVA
        </span>
      </div>
    </li>
  );
}

export default function Receipt({ lines, onReservar }) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const qtyTotal = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="flex flex-col min-h-0">
      <header className="px-5 pt-5 pb-3 border-b border-ink/15">
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
            Recibo · 001 · Borrador
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
            {lines.length} {lines.length === 1 ? 'línea' : 'líneas'}
          </span>
        </div>
        <h2 className="font-serif font-light text-2xl md:text-[1.65rem] leading-[1.05] tracking-tight">
          Presupuesto<br />
          <em className="italic font-medium">base estimado</em>
        </h2>
      </header>

      {lines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <p className="font-serif text-center text-mute text-sm">
            Recibo vacío.<br />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] block mt-2">
              Pide un cambio para empezar
            </span>
          </p>
        </div>
      ) : (
        <ul className="px-5 py-1">
          {lines.map((line, i) => <Row key={line.id} line={line} idx={i} />)}
        </ul>
      )}

      <div className="mt-auto border-t border-ink px-5 py-5 space-y-4">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
          <span>{qtyTotal} unidades en {lines.length} líneas</span>
          <span>Subtotal</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
            Total estimado
          </span>
          <span className="font-serif font-medium text-3xl md:text-[2.4rem] tracking-tight tabular-nums leading-none">
            {fmt(subtotal)}
          </span>
        </div>

        <p className="font-sans text-[11px] leading-[1.55] text-mute">
          Borrador generado por IA. Sujeto a validación y visita técnica.
          Precios orientativos basados en catálogo público; el precio final
          se cierra tras la visita.
        </p>
      </div>

      {/* CTA final del recibo */}
      <div className="px-5 pb-5 -mt-1">
        <button
          type="button"
          onClick={onReservar}
          className="w-full bg-accent hover:bg-accent/90 text-cream px-6 py-4 font-mono text-[12px] uppercase tracking-[0.18em] font-medium btn-lift"
        >
          Obtener mi diseño y presupuesto personalizado →
        </button>
        <div className="flex items-center justify-between mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
          <button
            type="button"
            className="hover:text-ink transition-colors btn-lift"
          >
            Reservar visita técnica
          </button>
          <button
            type="button"
            className="hover:text-ink transition-colors btn-lift"
            aria-label="Exportar presupuesto"
          >
            ↓ PDF
          </button>
        </div>
      </div>
    </div>
  );
}
