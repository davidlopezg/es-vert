import { useEffect } from 'react';

// Menú lateral: drawer desde la derecha. Bloquea scroll del body.
// Incluye una sección de "Configuración" abajo que muestra qué
// providers están cargados en este build (lee import.meta.env).
// Diagnóstico visible SIN DevTools, pensado para móvil.

const SECTIONS = [
  {
    label: 'Estudio',
    items: [
      { label: 'Sobre nosotros',        href: '#sobre' },
      { label: 'Cómo trabajamos',       href: '#como' },
      { label: 'Proyectos realizados',  href: '#proyectos' },
      { label: 'Contacto',              href: '#contacto' },
    ],
  },
  {
    label: 'Recursos',
    items: [
      { label: 'Catálogo',        href: '#catalogo' },
      { label: 'Inspiración',     href: '#inspiracion' },
      { label: 'Preguntas',       href: '#faq' },
    ],
  },
  {
    label: 'Legal',
    items: [
      { label: 'Política de privacidad', href: '#privacidad' },
      { label: 'Aviso legal',            href: '#aviso-legal' },
      { label: 'Cookies',                href: '#cookies' },
    ],
  },
];

function statusDot(on) {
  return on ? '● verde' : '○ gris';
}

function ConfigurationBlock() {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const llm       = env.VITE_MINIMAX_API_KEY || env.VITE_AI_PROXY_URL;
  const hf        = env.VITE_HUGGINGFACE_TOKEN;
  const custom    = env.VITE_IMAGE_API_URL && env.VITE_IMAGE_API_KEY && env.VITE_IMAGE_MODEL;
  const isDev     = !!env.DEV;

  const Row = ({ label, value, on }) => (
    <li className="flex items-center justify-between gap-3 py-1.5">
      <span className="font-sans text-[13px] text-mute">{label}</span>
      <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
        on ? 'text-accent' : 'text-ink/40'
      }`}>
        {value}
      </span>
    </li>
  );

  return (
    <div className="px-6 py-5 border-t border-ink/15 bg-cream/50">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-3">
        Configuración (este build)
      </p>
      <ul className="space-y-0.5">
        <Row label="LLM (chat)"   value={llm ? 'ON' : 'mock'} on={!!llm} />
        <Row label="Imagen HF"   value={hf ? 'ON' : 'off'} on={!!hf} />
        <Row label="Imagen Replicate/fal" value={custom ? 'ON' : 'off'} on={!!custom} />
      </ul>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/40 mt-3">
        Modo · {isDev ? 'Dev local · localhost' : 'Build producción · GitHub Pages'}
      </p>
      <p className="font-sans text-[11px] text-mute mt-3 leading-snug">
        Si tu <code className="font-mono text-[10px]">.env.local</code> tiene{' '}
        <code className="font-mono text-[10px]">VITE_HUGGINGFACE_TOKEN</code> pero
        aquí dice <em>off</em>, reinicia <code className="font-mono text-[10px]">npm run dev</code>{' '}
        tras crearlo.
      </p>
    </div>
  );
}

export default function Menu({ open, onClose }) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <aside
        className="absolute top-0 right-0 h-full w-full sm:w-[26rem] bg-cream border-l border-ink shadow-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-5 flex items-center justify-between border-b border-ink/15 sticky top-0 bg-cream z-10">
          <span className="font-serif text-xl tracking-tight">
            <span className="text-mute">ÉS</span>
            <span className="text-ink/30 mx-[3px]">—</span>
            <span className="text-accent">VERT</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="font-mono w-10 h-10 inline-flex items-center justify-center border border-ink/40 text-ink hover:bg-ink hover:text-cream transition-colors"
          >
            ✕
          </button>
        </div>

        <nav className="px-6 py-8">
          {SECTIONS.map((sec) => (
            <div key={sec.label} className="mb-8 last:mb-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute mb-3">
                {sec.label}
              </p>
              <ul className="space-y-2">
                {sec.items.map((it) => (
                  <li key={it.label}>
                    <a
                      href={it.href}
                      onClick={onClose}
                      className="font-serif text-xl md:text-2xl text-ink hover:text-accent transition-colors block py-1"
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <ConfigurationBlock />

        <div className="px-6 py-6 border-t border-ink/15 bg-ink text-cream">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/50 mb-3">
            Contacto directo
          </p>
          <a
            href="mailto:hola@es-vert.com"
            className="font-sans text-base text-cream hover:text-accent transition-colors block"
          >
            hola@es-vert.com
          </a>
          <a
            href="tel:+34932142142"
            className="font-mono text-[14px] text-cream/80 hover:text-cream transition-colors block mt-1"
          >
            +34 932 142 142
          </a>
        </div>
      </aside>
    </div>
  );
}
