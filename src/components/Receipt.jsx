import { eur } from '../data/products.js';

// Recibo editorial: cabecera serif + líneas con dot-leader mono + total grande.
// Estilo ticket minimalista, sin sombras ni radios.

function fmt(n) {
  return eur.format(n) + ' €';
}

function Row({ line }) {
  return (
    <li className="py-4 border-b border-ink/15 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-base md:text-[17px] leading-snug">
          {line.name}
        </h3>
        <span className="mono text-[10px] uppercase tracking-[0.2em] opacity-70 tabular-nums whitespace-nowrap">
          {line.qty}×
        </span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span
          className="flex-1 border-b border-dotted border-ink/40 translate-y-[-3px]"
          aria-hidden="true"
        ></span>
        <span className="mono text-sm tabular-nums">
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
      <header className="p-5 md:p-6 border-b border-ink">
        <p className="mono text-[10px] uppercase tracking-[0.3em] mb-3 opacity-70">
          Recibo · 001
        </p>
        <h2 className="font-serif text-2xl md:text-3xl leading-[1.05]">
          Presupuesto<br />
          <em className="italic">base estimado</em>
        </h2>
        <p className="mono text-[10px] uppercase tracking-[0.2em] mt-3 opacity-60">
          Generado por IA · {new Date().toLocaleDateString('es-ES')}
        </p>
      </header>

      {lines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="font-serif italic text-center opacity-60">
            Recibo vacío.<br />Pide un cambio para empezar.
          </p>
        </div>
      ) : (
        <ul className="px-5 md:px-6 py-2">
          {lines.map(line => <Row key={line.id} line={line} />)}
        </ul>
      )}

      <div className="border-t border-ink px-5 md:px-6 py-5 mt-auto">
        <div className="flex items-baseline justify-between">
          <span className="mono text-[10px] uppercase tracking-[0.25em]">
            Total estimado
          </span>
          <span className="font-serif text-3xl md:text-4xl tabular-nums">
            {fmt(subtotal)}
          </span>
        </div>
        <p className="mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] mt-4 leading-[1.6] opacity-60">
          * Sujeto a instalación y condiciones del terreno.<br />
          Precios orientativos basados en catálogo público.
        </p>
      </div>
    </div>
  );
}
