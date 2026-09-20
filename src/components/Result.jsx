import BeforeAfterSlider from './BeforeAfterSlider.jsx';
import Receipt from './Receipt.jsx';
import Prompt from './Prompt.jsx';
import { IMAGES } from '../data/products.js';

// Resultado: rejilla 70/30 sin curva (el radio se ha retirado).
// Densidad: tapas más estrechas, sin aire vacío entre paneles.

export default function Result({
  lines,
  onPrompt,
  messages,
  pending,
  beforeSrc,
  afterSrc,
  onReset,
  onReservar,
}) {
  return (
    <section className="flex-1 grid grid-cols-1 md:grid-cols-10 min-h-0 border-t border-ink/10">
      <div className="md:col-span-7 relative min-h-[55vh] md:min-h-0 border-b md:border-b-0 md:border-r border-ink/10">
        <BeforeAfterSlider
          before={beforeSrc || IMAGES.before}
          after={afterSrc || IMAGES.after}
          regenerating={pending}
        />
      </div>

      <aside className="md:col-span-3 flex flex-col min-h-0">
        <Receipt lines={lines} onReservar={onReservar} />
        <Prompt onSubmit={onPrompt} messages={messages} pending={pending} />
      </aside>
    </section>
  );
}
