import BeforeAfterSlider from './BeforeAfterSlider.jsx';
import Receipt from './Receipt.jsx';
import Prompt from './Prompt.jsx';
import { IMAGES } from '../data/products.js';

// Layout RESULT: 70% slider + 30% panel (recibo + prompt).
// En <768px stack vertical (slider primero, panel debajo).

export default function Result({
  lines,
  onPrompt,
  messages,
  pending,
  beforeSrc,
  afterSrc,
  onReset,
}) {
  return (
    <section className="flex-1 grid grid-cols-1 md:grid-cols-10 min-h-0">
      {/* Panel izquierdo: 70% */}
      <div className="md:col-span-7 relative border-b md:border-b-0 md:border-r border-ink min-h-[55vh] md:min-h-0">
        <BeforeAfterSlider
          before={beforeSrc || IMAGES.before}
          after={afterSrc || IMAGES.after}
        />
      </div>

      {/* Panel derecho: 30% */}
      <aside className="md:col-span-3 flex flex-col min-h-0">
        <Receipt lines={lines} />

        <Prompt
          onSubmit={onPrompt}
          messages={messages}
          pending={pending}
        />

        <div className="border-t border-ink px-5 md:px-6 py-3 flex justify-between items-center">
          <button
            type="button"
            onClick={onReset}
            className="mono text-[10px] uppercase tracking-[0.22em] underline underline-offset-4 hover:no-underline"
          >
            ← Empezar de nuevo
          </button>
          <span className="mono text-[10px] uppercase tracking-[0.22em] opacity-50">
            Demo
          </span>
        </div>
      </aside>
    </section>
  );
}
