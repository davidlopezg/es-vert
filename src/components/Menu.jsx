import { useEffect } from 'react';

// Menú lateral: drawer desde la derecha. Bloquea scroll del body.
// Estructura por secciones (Estudio · Recursos · Legal) para que
// el pie de página profundo tenga una entrada móvil coherente.

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
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      {/* Drawer */}
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
