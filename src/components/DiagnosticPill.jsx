import { useEffect, useState } from 'react';
import { getDiagnostic, diagnosticText } from '../lib/diagnostic.js';
import { getLastImageSource } from '../lib/image.js';

// Píldora fija, bottom-right, SIEMPRE visible en pantalla.
//   - Punto verde  → al menos un provider de imagen cargado (HF o Custom)
//   - Punto ámbar  → solo modo demo, ningún provider
//   - Punto rojo   → error reciente (mensaje persiste 5s)
// Click  →  panel con estado completo + botón copiar al portapapeles
// Pensada para móvil (tappable, ≥44px de target).

async function copyText(text) {
  try {
    await navigator.clipboard?.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  }
}

export default function DiagnosticPill() {
  const diag = getDiagnostic();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgSource, setImgSource] = useState(getLastImageSource());

  // Refresca la fuente cuando cambia algo (polling cada 500ms; barato).
  useEffect(() => {
    const t = setInterval(() => setImgSource(getLastImageSource()), 500);
    return () => clearInterval(t);
  }, []);

  const dot = diag.ok
    ? (imgSource === 'curated'
        ? 'bg-amber-500' // ámbar · imagen cayó al stock curado
        : 'bg-accent')   // verde · provider de imagen OK
    : (diag.hasAny
        ? 'bg-amber-500' // ámbar · solo LLM, sin imagen
        : 'bg-mute');    // gris · todo en mock/demo

  const label = imgSource === 'curated'
    ? 'STOCK'
    : (diag.ok ? `IMG ${diag.hf ? 'HF' : 'Custom'}` : 'DEMO');

  const handleCopy = async () => {
    const ok = await copyText(diagnosticText(diag));
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Diagnóstico"
          className="bg-cream border border-ink/80 px-3 py-2 flex items-center gap-2 shadow-lg hover:bg-ink hover:text-cream transition-colors min-h-[44px]"
        >
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]">{label}</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">·  ⓘ</span>
        </button>
      )}

      {open && (
        <div className="bg-cream border border-ink shadow-2xl w-[20rem] max-w-[calc(100vw-1.5rem)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/15">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
              Diagnóstico
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="font-mono w-8 h-8 inline-flex items-center justify-center text-ink hover:bg-ink hover:text-cream border border-ink/30"
            >
              ✕
            </button>
          </div>

          <ul className="px-4 py-3 space-y-1.5">
            <li className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[13px] text-mute">Modo</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
                {diag.isDev ? 'Dev local' : 'Producción'}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[13px] text-mute">LLM chat</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${diag.llm ? 'text-accent' : 'text-ink/40'}`}>
                {diag.llm ? diag.llmMode : 'mock'}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[13px] text-mute">Imagen HF</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${diag.hf ? 'text-accent' : 'text-ink/40'}`}>
                {diag.hf ? 'ON' : 'off'}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[13px] text-mute">Imagen Replicate</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${diag.replicate ? 'text-accent' : 'text-ink/40'}`}>
                {diag.replicate ? 'ON' : 'off'}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[13px] text-mute">Imagen Together.ai</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${diag.together ? 'text-accent' : 'text-ink/40'}`}>
                {diag.together ? 'ON' : 'off'}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span className="font-sans text-[13px] text-mute">Imagen custom</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${diag.customImage ? 'text-accent' : 'text-ink/40'}`}>
                {diag.customImage ? 'ON' : 'off'}
              </span>
            </li>
            <li className="flex items-baseline justify-between gap-3 pt-1 border-t border-ink/10">
              <span className="font-sans text-[13px] text-mute">Última imagen</span>
              <span className={`font-mono text-[11px] uppercase tracking-[0.18em] ${
                imgSource === 'curated' ? 'text-amber-500' : 'text-accent'
              }`}>
                {imgSource}
              </span>
            </li>
          </ul>

          <div className="px-4 pb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="font-mono text-[11px] uppercase tracking-[0.22em] border border-ink px-3 py-2 hover:bg-ink hover:text-cream transition-colors"
            >
              {copied ? '✓ Copiado' : '⧉ Copiar estado'}
            </button>
            {!diag.hf && !diag.replicate && !diag.together && !diag.customImage && (
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] uppercase tracking-[0.22em] border border-ink/30 px-3 py-2 hover:bg-ink hover:text-cream transition-colors"
              >
                ↗ Crear API key Replicate
              </a>
            )}
          </div>

          <div className="px-4 pb-4 text-[11px] leading-snug text-mute border-t border-ink/10 pt-3">
            Si dice <em>off</em> tras editar <code className="font-mono text-[10px]">.env.local</code>,
            reinicia <code className="font-mono text-[10px]">npm run dev</code>.
            {imgSource === 'curated' && (
              <span className="block mt-2 text-amber-500">
                ▲ Última imagen cayó al stock curado — ningún provider devolvió una IA real.
                Para image-to-image real, despliega <code className="font-mono text-[10px]">ai-proxy/worker.js</code>.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
