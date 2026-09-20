// Pie de página profundo: grid 4 columnas (Estudio, Servicios,
// Recursos, Legal) + banda inferior con copyright + estado de
// conexión. Fondo ink para crear el cierre "profesional" sin
// romper la paleta editorial.

const COLUMNS = [
  {
    label: 'Estudio',
    items: [
      { label: 'Sobre nosotros',        href: '#sobre' },
      { label: 'Cómo trabajamos',       href: '#como' },
      { label: 'Equipo',                href: '#equipo' },
      { label: 'Contacto',              href: '#contacto' },
    ],
  },
  {
    label: 'Servicios',
    items: [
      { label: 'Diseño 3D',             href: '#diseno-3d' },
      { label: 'Presupuesto cerrado',   href: '#presupuesto' },
      { label: 'Montaje profesional',   href: '#montaje' },
      { label: 'Mantenimiento',         href: '#mantenimiento' },
    ],
  },
  {
    label: 'Recursos',
    items: [
      { label: 'Proyectos realizados',  href: '#proyectos' },
      { label: 'Inspiración',           href: '#inspiracion' },
      { label: 'Catálogo',              href: '#catalogo' },
      { label: 'Preguntas frecuentes',  href: '#faq' },
    ],
  },
  {
    label: 'Legal',
    items: [
      { label: 'Política de privacidad', href: '#privacidad' },
      { label: 'Aviso legal',            href: '#aviso-legal' },
      { label: 'Cookies',                href: '#cookies' },
      { label: 'Términos',               href: '#terminos' },
    ],
  },
];

export default function Footer({ status = 'Demo · datos mock' }) {
  return (
    <footer className="bg-ink text-cream">
      {/* Grid principal */}
      <div className="px-5 md:px-10 lg:px-12 py-14 md:py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14">
          {COLUMNS.map((col) => (
            <div key={col.label}>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.28em] text-cream/50 mb-4">
                {col.label}
              </h4>
              <ul className="space-y-2.5">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <a
                      href={it.href}
                      className="font-sans text-[14px] md:text-[15px] text-cream/85 hover:text-accent transition-colors"
                    >
                      {it.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bloque de marca + contacto destacado */}
        <div className="mt-12 md:mt-16 pt-10 border-t border-cream/15 grid md:grid-cols-2 gap-10">
          <div>
            <div className="font-serif text-3xl md:text-4xl tracking-tight leading-none mb-4">
              <span className="text-cream/55">ÉS</span>
              <span className="text-cream/30 mx-[3px]">—</span>
              <span className="text-accent">VERT</span>
            </div>
            <p className="font-sans text-[15px] text-cream/70 leading-snug max-w-md">
              Estudio de paisajismo en Barcelona. Diseño 3D y montaje de
              mobiliario y plantas reales desde 2018. Sin inventar productos
              — todo lo que ves tiene precio real.
            </p>
          </div>
          <div className="md:text-right space-y-2">
            <div>
              <a
                href="mailto:hola@es-vert.com"
                className="font-serif text-2xl md:text-[1.7rem] text-cream hover:text-accent transition-colors block"
              >
                hola@es-vert.com
              </a>
            </div>
            <div>
              <a
                href="tel:+34932142142"
                className="font-mono text-[14px] uppercase tracking-[0.25em] text-cream/70 hover:text-cream transition-colors"
              >
                +34 932 142 142
              </a>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-cream/55">
              Carrer de Provença 248, Barcelona
            </p>
          </div>
        </div>
      </div>

      {/* Banda inferior */}
      <div className="border-t border-cream/15">
        <div className="px-5 md:px-10 lg:px-12 py-5 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cream/55">
          <span>© {new Date().getFullYear()} Es-Vert SL · CIF B-12345678</span>
          <span>Hecho con cuidado en Barcelona</span>
          <span>{status}</span>
        </div>
      </div>
    </footer>
  );
}
