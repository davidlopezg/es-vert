import { eur } from '../data/products.js';

// Recibo editorial denso: cada línea muestra nombre, desglose
// (qty × unit) y subtotal en dos filas. Total en serif grande
// debajo. Disclaimer honesto + mini-CTA al pie, todo sin aire vacío.

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

export default function Receipt({ lines }) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const qtyTotal = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="flex flex-col min-h-0">
      {/* Cabecera del recibo */}
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

      {/* Lista densa */}
      {lines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <p className="font-serif italic text-center text-mute text-sm">
            Recibo vacío.<br />Pide un cambio para empezar.
          </p>
        </div>
      ) : (
        <ul className="px-5 py-1">
          {lines.map((line, i) => <Row key={line.id} line={line} idx={i} />)}
        </ul>
      )}

      {/* Footer: total + disclaimer + CTA */}
      <div className="mt-auto border-t border-ink px-5 py-5 space-y-4">
        {/* Mini-stats y total */}
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

        <p className="font-serif italic text-[11px] leading-[1.55] text-mute">
          *Borrador generado por IA. Sujeto a validación y visita técnica.
          Precios orientativos basados en catálogo público; el precio final
          se cierra tras la visita.*
        </p>

        <div className="pt-3 border-t border-ink/10 flex items-center justify-between">
          <button
            type="button"
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink underline underline-offset-4 hover:no-underline btn-lift"
          >
            Reservar visita técnica →
          </button>
          <button
            type="button"
            className="font-mono text-[11px] uppercase tracking-[0.25em] text-mute hover:text-ink btn-lift"
            aria-label="Exportar presupuesto"
          >
            ↓ PDF
          </button>
        </div>
      </div>
    </div>
  );
}
