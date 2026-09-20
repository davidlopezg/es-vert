import BeforeAfterSlider from './BeforeAfterSlider.jsx';
import Receipt from './Receipt.jsx';
import Prompt from './Prompt.jsx';
import { IMAGES } from '../data/products.js';

// Estado RESULT: 70/30 con la firma del estudio aplicada al slider
// (rounded-tl asimétrico + hairline en el resto de bordes).
// Panel derecho: recibo + prompt + reset.

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
      {/* Slider con la curva asimétrica del estudio */}
      <div className="md:col-span-7 relative min-h-[55vh] md:min-h-0 radius-tl-asim md:radius-tl-asim-md overflow-hidden md:border md:border-ink/10 md:border-r-0 md:border-b-0 md:border-t-0 md:border-l-0">
        <div className="absolute inset-0 radius-tl-asim md:radius-tl-asim-md overflow-hidden">
          <BeforeAfterSlider
            before={beforeSrc || IMAGES.before}
            after={afterSrc || IMAGES.after}
          />
        </div>
      </div>

      {/* Panel derecho: recibo + prompt */}
      <aside className="md:col-span-3 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-ink/10">
        <Receipt lines={lines} />
        <Prompt onSubmit={onPrompt} messages={messages} pending={pending} />
      </aside>
    </section>
  );
}
